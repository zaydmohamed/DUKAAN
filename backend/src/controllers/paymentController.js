const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const PaymentAllocation = require('../models/PaymentAllocation');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const { allocateCustomerPayment, recalculateCustomerBalance } = require('../services/debtService');
const { recordCashMovement, getActiveCashSession } = require('../services/cashService');
const { logAudit } = require('../services/auditService');
const { toCents } = require('../utils/money');

// @desc Record Customer Debt Payment
// @route POST /api/payments/customer
const recordCustomerPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerId,
      amount,
      paymentMethod = 'CASH',
      referenceNumber = '',
      allocationMethod = 'FIFO_OLDEST_FIRST', // 'FIFO_OLDEST_FIRST' or 'SPECIFIC_INVOICE'
      targetSaleId = null,
      notes = '',
    } = req.body;

    const amountCents = toCents(amount);
    if (amountCents <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    const customer = await Customer.findById(customerId).session(session);
    if (!customer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Duplicate Payment Protection: check if identical payment reference was processed recently
    if (referenceNumber) {
      const duplicate = await Payment.findOne({
        partyId: customer._id,
        amountCents,
        referenceNumber,
        status: 'VALID',
      }).session(session);

      if (duplicate) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          success: false,
          message: `Duplicate payment detected with reference '${referenceNumber}'. Payment was already recorded.`,
        });
      }
    }

    const paymentNumber = `PAY-C-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;
    const accountType =
      paymentMethod === 'CASH'
        ? 'CASH_DRAWER'
        : ['EVC_PLUS', 'OTHER_MOBILE'].includes(paymentMethod)
        ? 'MOBILE_WALLET'
        : 'BANK_ACCOUNT';

    let activeCashSession = null;
    if (paymentMethod === 'CASH') {
      activeCashSession = await getActiveCashSession(req.user._id);
    }

    const payment = new Payment({
      paymentNumber,
      partyType: 'CUSTOMER',
      partyId: customer._id,
      partyModel: 'Customer',
      partyName: customer.name,
      amountCents,
      paymentMethod,
      accountType,
      referenceNumber: referenceNumber || paymentNumber,
      cashSession: activeCashSession ? activeCashSession._id : null,
      recordedBy: req.user._id,
      notes,
    });

    await payment.save({ session });

    // Allocate payment (FIFO or Specific Invoice)
    const { allocationsCreated, unallocatedCents } = await allocateCustomerPayment({
      paymentId: payment._id,
      customerId: customer._id,
      amountCents,
      method: allocationMethod,
      targetSaleId,
      userId: req.user._id,
      session,
    });

    // Record in physical cash drawer if cash
    if (paymentMethod === 'CASH' && activeCashSession) {
      await recordCashMovement({
        sessionId: activeCashSession._id,
        type: 'DEBT_COLLECTION',
        amountCents,
        session,
      });
    }

    await session.commitTransaction();
    session.endSession();

    await logAudit({
      user: req.user,
      action: 'PAYMENT_RECEIVED',
      resourceType: 'Payment',
      resourceId: payment._id,
      description: `Customer payment of $${amountCents / 100} received from ${customer.name} via ${paymentMethod}`,
      details: { amountCents, allocationMethod, unallocatedCents },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        payment,
        allocations: allocationsCreated,
        unallocatedCents,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// @desc Record Supplier Debt Payment
// @route POST /api/payments/supplier
const recordSupplierPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      supplierId,
      purchaseId = null,
      amount,
      paymentMethod = 'CASH',
      referenceNumber = '',
      notes = '',
    } = req.body;

    const amountCents = toCents(amount);
    if (amountCents <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Valid payment amount required' });
    }

    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

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
      amountCents,
      paymentMethod,
      accountType,
      referenceNumber: referenceNumber || paymentNumber,
      recordedBy: req.user._id,
      notes,
    });

    await payment.save({ session });

    // Allocate to specific purchase or oldest purchase
    let remaining = amountCents;
    if (purchaseId) {
      const purchase = await Purchase.findById(purchaseId).session(session);
      if (purchase) {
        const alloc = Math.min(remaining, purchase.outstandingBalanceCents);
        purchase.amountPaidCents += alloc;
        purchase.outstandingBalanceCents -= alloc;
        purchase.paymentStatus =
          purchase.outstandingBalanceCents === 0
            ? 'PAID'
            : purchase.amountPaidCents > 0
            ? 'PARTIALLY_PAID'
            : 'UNPAID';
        await purchase.save({ session });

        const allocation = new PaymentAllocation({
          payment: payment._id,
          purchase: purchase._id,
          allocatedAmountCents: alloc,
          allocationMethod: 'SPECIFIC_INVOICE',
        });
        await allocation.save({ session });
        remaining -= alloc;
      }
    }

    // Update supplier balance
    supplier.totalPaymentsCents += amountCents;
    supplier.outstandingBalanceCents = Math.max(0, supplier.outstandingBalanceCents - amountCents);
    await supplier.save({ session });

    // Deduct from physical drawer if cash
    if (paymentMethod === 'CASH') {
      await recordCashMovement({
        type: 'SUPPLIER_PAYMENT',
        amountCents,
        session,
      });
    }

    await session.commitTransaction();
    session.endSession();

    await logAudit({
      user: req.user,
      action: 'SUPPLIER_PAYMENT_MADE',
      resourceType: 'Payment',
      resourceId: payment._id,
      description: `Payment of $${amountCents / 100} paid to supplier ${supplier.name} via ${paymentMethod}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// @desc Get all payments
// @route GET /api/payments
const getPayments = async (req, res, next) => {
  try {
    const { partyType, paymentMethod, startDate, endDate } = req.query;
    const query = {};

    if (partyType) query.partyType = partyType;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    const payments = await Payment.find(query)
      .populate('recordedBy', 'name')
      .sort({ paymentDate: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  recordCustomerPayment,
  recordSupplierPayment,
  getPayments,
};

