const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const PaymentAllocation = require('../models/PaymentAllocation');
const { getUnitConversion, recordMovement } = require('../services/inventoryService');
const { recordCashMovement, getActiveCashSession } = require('../services/cashService');
const { recalculateCustomerBalance } = require('../services/debtService');
const { logAudit } = require('../services/auditService');
const { toCents } = require('../utils/money');

// @desc Create a new POS Sale
// @route POST /api/sales
const createSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerId = null,
      items, // array of { productId, unit, quantity, unitPrice, discount }
      discountTotal = 0,
      taxTotal = 0,
      amountPaid = 0,
      paymentMethod = 'CASH',
      paymentReference = '',
      notes = '',
      dueDate = null,
    } = req.body;

    if (!items || !items.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Sale must include at least one item' });
    }

    let customer = null;
    let customerName = 'Walk-in Customer';
    if (customerId) {
      customer = await Customer.findById(customerId).session(session);
      if (!customer) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Specified customer does not exist' });
      }
      customerName = customer.name;
    }

    const saleNumber = `INV-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;

    let subtotalCents = 0;
    let totalCogsCents = 0;
    const processedItems = [];

    // Process each item, validate stock, calculate COGS and deduct inventory
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const multiplier = getUnitConversion(product, item.unit);
      const qty = Number(item.quantity);
      if (qty <= 0) {
        throw new Error(`Quantity for ${product.name} must be greater than zero`);
      }

      const baseQuantity = Number((qty * multiplier).toFixed(4));
      const unitPriceCents = item.unitPrice !== undefined ? toCents(item.unitPrice) : product.sellingPriceCents;
      const discountCents = item.discount ? toCents(item.discount) : 0;
      const lineTotalCents = Math.round(qty * unitPriceCents) - discountCents;

      // Current weighted average cost
      const unitCostCents = product.costPriceCents || 0;
      const lineCostCents = Math.round(baseQuantity * unitCostCents);

      subtotalCents += lineTotalCents;
      totalCogsCents += lineCostCents;

      // Deduct inventory atomically
      await recordMovement({
        productId: product._id,
        movementType: 'SALE',
        quantityChange: -baseQuantity,
        unit: item.unit || product.baseUnit,
        unitCostCents,
        referenceType: 'Sale',
        reason: `Sale ${saleNumber}`,
        userId: req.user._id,
        session,
      });

      processedItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        unit: item.unit || product.baseUnit,
        conversionMultiplier: multiplier,
        quantity: qty,
        baseQuantity,
        unitPriceCents,
        discountCents,
        lineTotalCents,
        unitCostCents,
        lineCostCents,
      });
    }

    const discountTotalCents = toCents(discountTotal);
    const taxTotalCents = toCents(taxTotal);
    const totalAmountCents = Math.max(0, subtotalCents - discountTotalCents + taxTotalCents);
    const initialAmountPaidCents = Math.min(toCents(amountPaid), totalAmountCents);
    const outstandingBalanceCents = totalAmountCents - initialAmountPaidCents;

    let paymentStatus = 'UNPAID';
    if (outstandingBalanceCents === 0) {
      paymentStatus = 'PAID';
    } else if (initialAmountPaidCents > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    // Credit sale requires a registered customer
    if (outstandingBalanceCents > 0 && !customer) {
      throw new Error('Credit sales and partial payments require a registered customer. Walk-in customers must pay in full.');
    }

    // Check customer credit limit if applicable
    if (customer && customer.creditLimitCents > 0) {
      if (customer.outstandingBalanceCents + outstandingBalanceCents > customer.creditLimitCents) {
        throw new Error(
          `Sale exceeds customer credit limit of $${customer.creditLimitCents / 100}. Current debt: $${customer.outstandingBalanceCents / 100}`
        );
      }
    }

    // Active physical cash session if paid in cash
    let activeCashSession = null;
    if (initialAmountPaidCents > 0 && paymentMethod === 'CASH') {
      activeCashSession = await getActiveCashSession(req.user._id);
    }

    const sale = new Sale({
      saleNumber,
      customer: customer ? customer._id : null,
      customerName,
      items: processedItems,
      subtotalCents,
      discountTotalCents,
      taxTotalCents,
      totalAmountCents,
      amountPaidCents: initialAmountPaidCents,
      outstandingBalanceCents,
      costOfGoodsSoldCents: totalCogsCents,
      grossProfitCents: totalAmountCents - totalCogsCents,
      paymentStatus,
      transactionStatus: 'COMPLETED',
      dueDate: dueDate ? new Date(dueDate) : null,
      cashier: req.user._id,
      cashSession: activeCashSession ? activeCashSession._id : null,
      notes,
    });

    await sale.save({ session });

    // Record initial payment if money was tendered at checkout
    if (initialAmountPaidCents > 0) {
      const paymentNumber = `PAY-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;
      const accountType =
        paymentMethod === 'CASH'
          ? 'CASH_DRAWER'
          : ['EVC_PLUS', 'OTHER_MOBILE'].includes(paymentMethod)
          ? 'MOBILE_WALLET'
          : 'BANK_ACCOUNT';

      const payment = new Payment({
        paymentNumber,
        partyType: 'CUSTOMER',
        partyId: customer ? customer._id : sale._id,
        partyModel: customer ? 'Customer' : 'Sale',
        partyName: customerName,
        amountCents: initialAmountPaidCents,
        paymentMethod,
        accountType,
        referenceNumber: paymentReference || saleNumber,
        cashSession: activeCashSession ? activeCashSession._id : null,
        recordedBy: req.user._id,
        notes: `Initial payment for sale ${saleNumber}`,
      });

      await payment.save({ session });

      const allocation = new PaymentAllocation({
        payment: payment._id,
        sale: sale._id,
        allocatedAmountCents: initialAmountPaidCents,
        allocationMethod: 'AUTOMATIC_CHECKOUT',
      });

      await allocation.save({ session });

      // Record in cash session drawer if cash
      if (paymentMethod === 'CASH' && activeCashSession) {
        await recordCashMovement({
          sessionId: activeCashSession._id,
          type: 'CASH_SALE',
          amountCents: initialAmountPaidCents,
          session,
        });
      }
    }

    // Refresh customer balances
    if (customer) {
      await recalculateCustomerBalance(customer._id, session);
    }

    await session.commitTransaction();
    session.endSession();

    await logAudit({
      user: req.user,
      action: 'SALE_CREATED',
      resourceType: 'Sale',
      resourceId: sale._id,
      description: `Sale ${saleNumber} created. Total: $${totalAmountCents / 100}, Paid: $${initialAmountPaidCents / 100}`,
      details: {
        totalAmountCents,
        costOfGoodsSoldCents: totalCogsCents,
        paymentStatus,
        customerName,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// @desc Get all sales with filters
// @route GET /api/sales
const getSales = async (req, res, next) => {
  try {
    const { customerId, paymentStatus, transactionStatus, startDate, endDate, search } = req.query;
    const query = {};

    if (customerId) query.customer = customerId;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (transactionStatus) query.transactionStatus = transactionStatus;
    if (search) {
      query.$or = [
        { saleNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.saleDate.$lte = end;
      }
    }

    const sales = await Sale.find(query)
      .populate('customer', 'name phone')
      .populate('cashier', 'name')
      .sort({ saleDate: -1 });

    res.json({ success: true, count: sales.length, data: sales });
  } catch (err) {
    next(err);
  }
};

// @desc Get single sale by ID with allocations & payments
// @route GET /api/sales/:id
const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer')
      .populate('cashier', 'name')
      .populate('items.product', 'name sku barcode');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const allocations = await PaymentAllocation.find({ sale: sale._id }).populate('payment');

    res.json({ success: true, data: { sale, allocations } });
  } catch (err) {
    next(err);
  }
};

// @desc Void / Cancel Sale
// @route POST /api/sales/:id/void
const voidSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason = 'Cancelled by manager' } = req.body;
    const sale = await Sale.findById(req.params.id).session(session);

    if (!sale) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    if (sale.transactionStatus === 'VOIDED') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Sale is already voided' });
    }

    // Reverse inventory movements
    for (const item of sale.items) {
      await recordMovement({
        productId: item.product,
        movementType: 'ADJUSTMENT',
        quantityChange: item.baseQuantity,
        unitCostCents: item.unitCostCents,
        referenceType: 'Sale',
        referenceId: sale._id,
        reason: `Void Sale ${sale.saleNumber}: Return stock`,
        userId: req.user._id,
        session,
      });
    }

    sale.transactionStatus = 'VOIDED';
    sale.notes = (sale.notes ? sale.notes + ' | ' : '') + `VOIDED: ${reason}`;
    await sale.save({ session });

    if (sale.customer) {
      await recalculateCustomerBalance(sale.customer, session);
    }

    await session.commitTransaction();
    session.endSession();

    await logAudit({
      user: req.user,
      action: 'SALE_VOIDED',
      resourceType: 'Sale',
      resourceId: sale._id,
      description: `Sale ${sale.saleNumber} voided`,
      reason,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Sale voided and inventory restored', data: sale });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  voidSale,
};

