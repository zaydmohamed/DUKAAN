const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const PaymentAllocation = require('../models/PaymentAllocation');
const { getUnitConversion, recordMovement, updateWeightedAverageCost } = require('../services/inventoryService');
const { recordCashMovement, getActiveCashSession } = require('../services/cashService');
const { logAudit } = require('../services/auditService');
const { toCents } = require('../utils/money');

// @desc Create a new purchase
// @route POST /api/purchases
const createPurchase = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      supplierId,
      items, // array of { productId, unit, quantity, unitCost, additionalCost }
      freightAndAdditionalCost = 0,
      amountPaid = 0,
      paymentMethod = 'CASH',
      paymentReference = '',
      receivedNow = true, // If true, receives goods immediately and updates inventory
      notes = '',
    } = req.body;

    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Supplier not found' });
    }

    const purchaseNumber = `PUR-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;
    const freightCents = toCents(freightAndAdditionalCost);

    let goodsCostCents = 0;
    const processedItems = [];

    // Calculate total base items to allocate general freight proportionally
    let totalBaseUnits = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      const mult = getUnitConversion(product, item.unit);
      totalBaseUnits += Number(item.quantity) * mult;
    }

    const freightPerBaseUnit = totalBaseUnits > 0 ? Math.round(freightCents / totalBaseUnits) : 0;

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      const mult = getUnitConversion(product, item.unit);
      const qty = Number(item.quantity);
      const baseQty = Number((qty * mult).toFixed(4));
      const unitCostCents = toCents(item.unitCost);
      const lineTotalCents = Math.round(qty * unitCostCents);

      goodsCostCents += lineTotalCents;

      // Effective unit cost including allocated freight
      const effectiveUnitCostCents = unitCostCents + freightPerBaseUnit * mult;

      processedItems.push({
        product: product._id,
        productName: product.name,
        unit: item.unit || product.baseUnit,
        conversionMultiplier: mult,
        quantity: qty,
        baseQuantity: baseQty,
        unitCostCents,
        additionalCostPerUnitCents: freightPerBaseUnit * mult,
        effectiveUnitCostCents,
        lineTotalCents,
      });

      // If received immediately, update stock and weighted average cost
      if (receivedNow) {
        await updateWeightedAverageCost(product._id, baseQty, Math.round(effectiveUnitCostCents / mult), session);

        await recordMovement({
          productId: product._id,
          movementType: 'PURCHASE',
          quantityChange: baseQty,
          unit: item.unit || product.baseUnit,
          unitCostCents: Math.round(effectiveUnitCostCents / mult),
          referenceType: 'Purchase',
          reason: `Purchase ${purchaseNumber}`,
          userId: req.user._id,
          session,
        });
      }
    }

    const totalPurchaseCostCents = goodsCostCents + freightCents;
    const initialAmountPaidCents = Math.min(toCents(amountPaid), totalPurchaseCostCents);
    const outstandingBalanceCents = totalPurchaseCostCents - initialAmountPaidCents;

    let paymentStatus = 'UNPAID';
    if (outstandingBalanceCents === 0) {
      paymentStatus = 'PAID';
    } else if (initialAmountPaidCents > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    const purchase = new Purchase({
      purchaseNumber,
      supplier: supplier._id,
      items: processedItems,
      goodsCostCents,
      freightAndAdditionalCostCents: freightCents,
      totalPurchaseCostCents,
      amountPaidCents: initialAmountPaidCents,
      outstandingBalanceCents,
      receivedStatus: receivedNow ? 'RECEIVED' : 'PENDING',
      receivedAt: receivedNow ? new Date() : null,
      paymentStatus,
      recordedBy: req.user._id,
      notes,
    });

    await purchase.save({ session });

    // Record initial supplier payment if paid at order time
    if (initialAmountPaidCents > 0) {
      const paymentNumber = `PAY-S-${Date.now().toString().slice(-8)}`;
      const accountType =
        paymentMethod === 'CASH'
          ? 'CASH_DRAWER'
          : ['EVC_PLUS', 'OTHER_MOBILE'].includes(paymentMethod)
          ? 'MOBILE_WALLET'
          : 'BANK_ACCOUNT';

      const payment = new Payment({
        paymentNumber,
        partyType: 'SUPPLIER',
        partyId: supplier._id,
        partyModel: 'Supplier',
        partyName: supplier.name,
        amountCents: initialAmountPaidCents,
        paymentMethod,
        accountType,
        referenceNumber: paymentReference || purchaseNumber,
        recordedBy: req.user._id,
        notes: `Payment for purchase ${purchaseNumber}`,
      });

      await payment.save({ session });

      const allocation = new PaymentAllocation({
        payment: payment._id,
        purchase: purchase._id,
        allocatedAmountCents: initialAmountPaidCents,
        allocationMethod: 'SPECIFIC_INVOICE',
      });
      await allocation.save({ session });

      // If cash, deduct from drawer
      if (paymentMethod === 'CASH') {
        await recordCashMovement({
          type: 'SUPPLIER_PAYMENT',
          amountCents: initialAmountPaidCents,
          session,
        });
      }
    }

    // Update supplier outstanding balance
    supplier.totalPurchasesCents += totalPurchaseCostCents;
    supplier.totalPaymentsCents += initialAmountPaidCents;
    supplier.outstandingBalanceCents += outstandingBalanceCents;
    await supplier.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logAudit({
      user: req.user,
      action: 'PURCHASE_CREATED',
      resourceType: 'Purchase',
      resourceId: purchase._id,
      description: `Purchase ${purchaseNumber} recorded from ${supplier.name}. Total: $${totalPurchaseCostCents / 100}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: purchase });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// @desc Receive pending purchase goods
// @route POST /api/purchases/:id/receive
const receivePurchase = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const purchase = await Purchase.findById(req.params.id).session(session);
    if (!purchase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    if (purchase.receivedStatus === 'RECEIVED') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Purchase has already been received' });
    }

    for (const item of purchase.items) {
      await updateWeightedAverageCost(
        item.product,
        item.baseQuantity,
        Math.round(item.effectiveUnitCostCents / item.conversionMultiplier),
        session
      );

      await recordMovement({
        productId: item.product,
        movementType: 'PURCHASE',
        quantityChange: item.baseQuantity,
        unit: item.unit,
        unitCostCents: Math.round(item.effectiveUnitCostCents / item.conversionMultiplier),
        referenceType: 'Purchase',
        referenceId: purchase._id,
        reason: `Goods receipt for Purchase ${purchase.purchaseNumber}`,
        userId: req.user._id,
        session,
      });
    }

    purchase.receivedStatus = 'RECEIVED';
    purchase.receivedAt = new Date();
    await purchase.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logAudit({
      user: req.user,
      action: 'PURCHASE_RECEIVED',
      resourceType: 'Purchase',
      resourceId: purchase._id,
      description: `Purchase ${purchase.purchaseNumber} goods accepted into inventory`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Purchase goods received and inventory updated', data: purchase });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// @desc Get all purchases
// @route GET /api/purchases
const getPurchases = async (req, res, next) => {
  try {
    const { supplierId, paymentStatus, receivedStatus } = req.query;
    const query = {};

    if (supplierId) query.supplier = supplierId;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (receivedStatus) query.receivedStatus = receivedStatus;

    const purchases = await Purchase.find(query)
      .populate('supplier', 'name phone')
      .populate('recordedBy', 'name')
      .sort({ purchaseDate: -1 });

    res.json({ success: true, count: purchases.length, data: purchases });
  } catch (err) {
    next(err);
  }
};

// @desc Get purchase by ID
// @route GET /api/purchases/:id
const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier')
      .populate('recordedBy', 'name');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    res.json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPurchase,
  receivePurchase,
  getPurchases,
  getPurchaseById,
};

