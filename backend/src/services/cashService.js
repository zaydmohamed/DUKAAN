const CashSession = require('../models/CashSession');

/**
 * Get the currently open cash session for a cashier or any open session
 */
const getActiveCashSession = async (cashierId = null) => {
  const query = { status: 'OPEN' };
  if (cashierId) query.cashier = cashierId;
  return CashSession.findOne(query).sort({ openedAt: -1 });
};

/**
 * Open a new cash session
 */
const openCashSession = async ({ cashierId, openingCashCents }) => {
  // Check if cashier already has an open session
  const existing = await CashSession.findOne({ cashier: cashierId, status: 'OPEN' });
  if (existing) {
    throw new Error('You already have an active open cash session. Please close it before opening a new one.');
  }

  const session = new CashSession({
    cashier: cashierId,
    openingCashCents,
    expectedClosingCashCents: openingCashCents,
    status: 'OPEN',
  });

  await session.save();
  return session;
};

/**
 * Record a cash flow movement inside an active cash session
 */
const recordCashMovement = async ({
  sessionId = null,
  cashierId = null,
  type, // 'CASH_SALE', 'DEBT_COLLECTION', 'EXPENSE', 'SUPPLIER_PAYMENT'
  amountCents,
  session = null,
}) => {
  let cashSession = null;
  if (sessionId) {
    cashSession = await CashSession.findById(sessionId).session(session);
  } else if (cashierId) {
    cashSession = await CashSession.findOne({ cashier: cashierId, status: 'OPEN' }).session(session);
  } else {
    cashSession = await CashSession.findOne({ status: 'OPEN' }).sort({ openedAt: -1 }).session(session);
  }

  if (!cashSession || cashSession.status !== 'OPEN') {
    // If no session open, we still log warning but don't crash
    console.warn('[CashSession] Transaction occurred with no active physical cash session.');
    return null;
  }

  switch (type) {
    case 'CASH_SALE':
      cashSession.cashSalesCents += amountCents;
      break;
    case 'DEBT_COLLECTION':
      cashSession.cashDebtCollectionsCents += amountCents;
      break;
    case 'EXPENSE':
      cashSession.cashExpensesCents += amountCents;
      break;
    case 'SUPPLIER_PAYMENT':
      cashSession.cashSupplierPaymentsCents += amountCents;
      break;
  }

  cashSession.calculateExpectedCash();
  await cashSession.save({ session });
  return cashSession;
};

/**
 * Close a cash session and reconcile drawer
 */
const closeCashSession = async ({
  sessionId,
  actualCountedCashCents,
  closingNotes = '',
  discrepancyExplanation = '',
}) => {
  const cashSession = await CashSession.findById(sessionId);
  if (!cashSession) throw new Error('Cash session not found');
  if (cashSession.status === 'CLOSED') throw new Error('Cash session is already closed');

  cashSession.calculateExpectedCash();
  cashSession.actualCountedCashCents = actualCountedCashCents;
  cashSession.differenceCents = actualCountedCashCents - cashSession.expectedClosingCashCents;
  cashSession.status = 'CLOSED';
  cashSession.closedAt = new Date();
  cashSession.closingNotes = closingNotes;
  cashSession.discrepancyExplanation = discrepancyExplanation;

  await cashSession.save();
  return cashSession;
};

module.exports = {
  getActiveCashSession,
  openCashSession,
  recordCashMovement,
  closeCashSession,
};

