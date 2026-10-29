const Expense = require('../models/Expense');
const { recordCashMovement, getActiveCashSession } = require('../services/cashService');
const { logAudit } = require('../services/auditService');
const { toCents } = require('../utils/money');

// @desc Get all expenses with category and date filters
// @route GET /api/expenses
const getExpenses = async (req, res, next) => {
  try {
    const { category, paymentMethod, startDate, endDate } = req.query;
    const query = {};

    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const expenses = await Expense.find(query)
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    const totalCents = expenses.reduce((acc, e) => acc + e.amountCents, 0);

    res.json({ success: true, count: expenses.length, totalCents, data: expenses });
  } catch (err) {
    next(err);
  }
};

// @desc Create a new operating expense
// @route POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    const {
      category,
      amount,
      paymentMethod = 'CASH',
      description,
      date = new Date(),
      referenceNumber = '',
    } = req.body;

    const amountCents = toCents(amount);
    if (amountCents <= 0) {
      return res.status(400).json({ success: false, message: 'Expense amount must be positive' });
    }

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

    const expense = new Expense({
      category,
      amountCents,
      date: new Date(date),
      paymentMethod,
      accountType,
      cashSession: activeCashSession ? activeCashSession._id : null,
      description,
      referenceNumber,
      recordedBy: req.user._id,
    });

    await expense.save();

    // Deduct from physical drawer if paid in cash
    if (paymentMethod === 'CASH' && activeCashSession) {
      await recordCashMovement({
        sessionId: activeCashSession._id,
        type: 'EXPENSE',
        amountCents,
      });
    }

    await logAudit({
      user: req.user,
      action: 'EXPENSE_CREATED',
      resourceType: 'Expense',
      resourceId: expense._id,
      description: `Expense of $${amountCents / 100} recorded for ${category}`,
      details: { category, amountCents, paymentMethod, description },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

// @desc Delete an expense (Admin only)
// @route DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user,
      action: 'EXPENSE_DELETED',
      resourceType: 'Expense',
      resourceId: expense._id,
      description: `Expense of $${expense.amountCents / 100} (${expense.category}) removed`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Expense removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense,
};

