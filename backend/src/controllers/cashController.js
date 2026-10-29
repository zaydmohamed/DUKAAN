const CashSession = require('../models/CashSession');
const { openCashSession, closeCashSession, getActiveCashSession } = require('../services/cashService');
const { logAudit } = require('../services/auditService');
const { toCents } = require('../utils/money');

// @desc Get current active cash session for logged-in cashier or shop
// @route GET /api/cash/current
const getCurrentSession = async (req, res, next) => {
  try {
    const session = await getActiveCashSession(req.user._id);
    if (session) {
      session.calculateExpectedCash();
    }
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

// @desc Open a new daily cash session
// @route POST /api/cash/open
const openSession = async (req, res, next) => {
  try {
    const { openingCash = 0 } = req.body;
    const openingCashCents = toCents(openingCash);

    const session = await openCashSession({
      cashierId: req.user._id,
      openingCashCents,
    });

    await logAudit({
      user: req.user,
      action: 'CASH_SESSION_OPENED',
      resourceType: 'CashSession',
      resourceId: session._id,
      description: `Cash drawer session opened with $${openingCashCents / 100}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

// @desc Close cash session & reconcile drawer
// @route POST /api/cash/close
const closeSession = async (req, res, next) => {
  try {
    const { sessionId, actualCountedCash, closingNotes = '', discrepancyExplanation = '' } = req.body;

    const actualCountedCashCents = toCents(actualCountedCash);

    const session = await closeCashSession({
      sessionId,
      actualCountedCashCents,
      closingNotes,
      discrepancyExplanation,
    });

    await logAudit({
      user: req.user,
      action: 'CASH_SESSION_CLOSED',
      resourceType: 'CashSession',
      resourceId: session._id,
      description: `Cash session closed. Expected: $${session.expectedClosingCashCents / 100}, Counted: $${
        session.actualCountedCashCents / 100
      }, Difference: $${session.differenceCents / 100}`,
      details: {
        expectedClosingCashCents: session.expectedClosingCashCents,
        actualCountedCashCents: session.actualCountedCashCents,
        differenceCents: session.differenceCents,
      },
      reason: discrepancyExplanation,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

// @desc Get all cash sessions history
// @route GET /api/cash/history
const getSessionHistory = async (req, res, next) => {
  try {
    const sessions = await CashSession.find()
      .populate('cashier', 'name username')
      .sort({ openedAt: -1 });

    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCurrentSession,
  openSession,
  closeSession,
  getSessionHistory,
};

