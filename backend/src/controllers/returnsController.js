const mongoose = require('mongoose');
const SalesReturn = require('../models/SalesReturn');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const CreditNote = require('../models/CreditNote');
const { recordMovement, getUnitConversion } = require('../services/inventoryService');
const { recordCashMovement, getActiveCashSession } = require('../services/cashService');
const { recalculateCustomerBalance } = require('../services/debtService');
const { logAudit } = require('../services/auditService');
const { toCents } = require('../utils/money');

// @desc Process Sales Return & Refund
// @route POST /api/returns
const createReturn = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      saleId,
      items, // array of { productId, unit, quantity, unitRefund, isRestockable }
      refundMethod = 'CASH', // 'CASH', 'CREDIT_NOTE', 'REDUCE_DEBT'
      reason,
    } = req.body;

    if (!reason) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Return reason is required' });
    }

    const sale = await Sale.findById(saleId).session(session);
    if (!sale) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const returnNumber = `RET-${Date.now().toString().slice(-8)}`;
    let totalRefundCents = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      const multiplier = getUnitConversion(product, item.unit);
      const qty = Number(item.quantity);
      const baseQty = Number((qty * multiplier).toFixed(4));
      const unitRefundCents = toCents(item.unitRefund);
      const lineRefundCents = Math.round(qty * unitRefundCents);
      const isRestockable = item.isRestockable !== false;

      totalRefundCents += lineRefundCents;

      // Update inventory based on restockable status
      if (isRestockable) {
        await recordMovement({
          productId: product._id,
          movementType: 'CUSTOMER_RETURN',
          quantityChange: baseQty,
          unit: item.unit || product.baseUnit,
          unitCostCents: product.costPriceCents,
          referenceType: 'SalesReturn',
          reason: `Customer Return ${returnNumber}: Restocked`,
          userId: req.user._id,
          session,
        });
      } else {
        // Record as damaged inventory movement
        await recordMovement({
          productId: product._id,
          movementType: 'DAMAGE',
          quantityChange: 0, // Not added to saleable stock
          unit: item.unit || product.baseUnit,
          unitCostCents: product.costPriceCents,
          referenceType: 'SalesReturn',
          reason: `Customer Return ${returnNumber}: Damaged/Unsellable`,
          userId: req.user._id,
          session,
        });
      }

      processedItems.push({
        product: product._id,
        productName: product.name,
        unit: item.unit || product.baseUnit,
        conversionMultiplier: multiplier,
        quantity: qty,
        baseQuantity: baseQty,
        unitRefundCents,
        lineRefundCents,
        isRestockable,
      });
    }

    const salesReturn = new SalesReturn({
      returnNumber,
      sale: sale._id,
      customer: sale.customer,
      items: processedItems,
      totalRefundCents,
      refundMethod,
      reason,
      processedBy: req.user._id,
    });

    await salesReturn.save({ session });

    // Handle refund payout / adjustment
    if (refundMethod === 'CASH') {
      const activeSession = await getActiveCashSession(req.user._id);
      if (activeSession) {
        await recordCashMovement({
          sessionId: activeSession._id,
          type: 'EXPENSE', // Outflow from drawer
          amountCents: totalRefundCents,
          session,
        });
      }
    } else if (refundMethod === 'CREDIT_NOTE' && sale.customer) {
      const creditNote = new CreditNote({
        creditNoteNumber: `CN-RET-${Date.now().toString().slice(-6)}`,
        customer: sale.customer,
        amountCents: totalRefundCents,
        remainingBalanceCents: totalRefundCents,
        reason: `Sales Return ${returnNumber}`,
        referenceType: 'SalesReturn',
        referenceId: salesReturn._id,
        issuedBy: req.user._id,
      });
      await creditNote.save({ session });
    } else if (refundMethod === 'REDUCE_DEBT' && sale.customer) {
      if (sale.outstandingBalanceCents > 0) {
        const debtReduction = Math.min(totalRefundCents, sale.outstandingBalanceCents);
        sale.outstandingBalanceCents -= debtReduction;
        if (sale.outstandingBalanceCents === 0) sale.paymentStatus = 'PAID';
        await sale.save({ session });
      }
    }

    sale.transactionStatus = 'PARTIALLY_RETURNED';
    await sale.save({ session });

    if (sale.customer) {
      await recalculateCustomerBalance(sale.customer, session);
    }

    await session.commitTransaction();
    session.endSession();

    await logAudit({
      user: req.user,
      action: 'REFUND_PROCESSED',
      resourceType: 'SalesReturn',
      resourceId: salesReturn._id,
      description: `Sales Return ${returnNumber} processed for Sale ${sale.saleNumber}. Refund: $${totalRefundCents / 100}`,
      details: { totalRefundCents, refundMethod, reason },
      reason,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: salesReturn });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// @desc Get all sales returns
// @route GET /api/returns
const getReturns = async (req, res, next) => {
  try {
    const returns = await SalesReturn.find()
      .populate('sale', 'saleNumber saleDate')
      .populate('customer', 'name phone')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: returns.length, data: returns });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReturn,
  getReturns,
};

