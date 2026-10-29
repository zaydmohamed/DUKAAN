const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const CreditNote = require('../models/CreditNote');
const DebtAdjustment = require('../models/DebtAdjustment');
const { getDebtAgingReport, getDashboardMetrics } = require('../services/accountingService');
const { writeOffBadDebt, recalculateCustomerBalance } = require('../services/debtService');
const { logAudit } = require('../services/auditService');
const { toCents } = require('../utils/money');

// @desc Get Customer Debt Dashboard Overview & Aging
// @route GET /api/debts/dashboard
const getDebtDashboard = async (req, res, next) => {
  try {
    const aging = await getDebtAgingReport();
    const customersWithDebt = await Customer.find({
      outstandingBalanceCents: { $gt: 0 },
    }).sort({ outstandingBalanceCents: -1 });

    const totalCustomersInDebt = customersWithDebt.length;
    const totalDebtCents = customersWithDebt.reduce((acc, c) => acc + c.outstandingBalanceCents, 0);

    res.json({
      success: true,
      data: {
        totalCustomersInDebt,
        totalDebtCents,
        aging,
        topDebtors: customersWithDebt.slice(0, 10),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get Invoices with Outstanding Debt
// @route GET /api/debts/invoices
const getDebtInvoices = async (req, res, next) => {
  try {
    const { customerId } = req.query;
    const query = {
      transactionStatus: 'COMPLETED',
      outstandingBalanceCents: { $gt: 0 },
    };
    if (customerId) query.customer = customerId;

    const invoices = await Sale.find(query)
      .populate('customer', 'name phone email')
      .sort({ saleDate: 1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    next(err);
  }
};

// @desc Authorized Bad Debt Write-Off
// @route POST /api/debts/write-off
const writeOffDebt = async (req, res, next) => {
  try {
    const { customerId, amount, reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Audited justification/reason is required for write-off' });
    }

    const amountCents = toCents(amount);
    if (amountCents <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive write-off amount required' });
    }

    const adjustment = await writeOffBadDebt({
      customerId,
      amountCents,
      reason,
      approvedByUser: req.user,
    });

    res.status(201).json({
      success: true,
      message: 'Bad debt successfully written off and audited',
      data: adjustment,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Issue Credit Note to customer
// @route POST /api/debts/credit-note
const issueCreditNote = async (req, res, next) => {
  try {
    const { customerId, amount, reason, referenceType = 'Manual' } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const amountCents = toCents(amount);
    if (amountCents <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount required' });
    }

    const creditNoteNumber = `CN-${Date.now().toString().slice(-8)}`;

    const creditNote = new CreditNote({
      creditNoteNumber,
      customer: customer._id,
      amountCents,
      remainingBalanceCents: amountCents,
      reason,
      referenceType,
      issuedBy: req.user._id,
    });

    await creditNote.save();
    await recalculateCustomerBalance(customer._id);

    await logAudit({
      user: req.user,
      action: 'CREDIT_NOTE_ISSUED',
      resourceType: 'CreditNote',
      resourceId: creditNote._id,
      description: `Credit note of $${amountCents / 100} issued to ${customer.name}`,
      details: { amountCents, reason },
      reason,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: creditNote });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDebtDashboard,
  getDebtInvoices,
  writeOffDebt,
  issueCreditNote,
};

