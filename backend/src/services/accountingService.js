const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const CashSession = require('../models/CashSession');
const SalesReturn = require('../models/SalesReturn');
const { getDateRange } = require('../utils/dateRange');

/**
 * Calculates comprehensive Income Statement / Profit & Loss for a date range
 */
const getProfitAndLoss = async (startDate, endDate) => {
  const dateMatch = {
    saleDate: { $gte: startDate, $lte: endDate },
    transactionStatus: { $in: ['COMPLETED', 'PARTIALLY_RETURNED'] },
  };

  // 1. Sales & Gross Revenue
  const sales = await Sale.find(dateMatch);
  const grossSalesCents = sales.reduce((acc, s) => acc + s.totalAmountCents + (s.discountTotalCents || 0), 0);
  const discountTotalCents = sales.reduce((acc, s) => acc + (s.discountTotalCents || 0), 0);

  // Sales Returns in period
  const returns = await SalesReturn.find({
    createdAt: { $gte: startDate, $lte: endDate },
  });
  const salesReturnsCents = returns.reduce((acc, r) => acc + r.totalRefundCents, 0);

  // Net Sales = Gross Sales - Discounts - Sales Returns
  const netSalesCents = Math.max(0, grossSalesCents - discountTotalCents - salesReturnsCents);

  // Cost of Goods Sold (COGS)
  const cogsCents = sales.reduce((acc, s) => acc + s.costOfGoodsSoldCents, 0);

  // Gross Profit = Net Sales - COGS
  const grossProfitCents = netSalesCents - cogsCents;

  // Operating Expenses in period
  const expenses = await Expense.find({
    date: { $gte: startDate, $lte: endDate },
  });
  const operatingExpensesCents = expenses.reduce((acc, e) => acc + e.amountCents, 0);

  // Net Profit = Gross Profit - Operating Expenses
  const netProfitCents = grossProfitCents - operatingExpensesCents;

  return {
    grossSalesCents,
    discountTotalCents,
    salesReturnsCents,
    netSalesCents,
    costOfGoodsSoldCents: cogsCents,
    grossProfitCents,
    operatingExpensesCents,
    netProfitCents,
    salesCount: sales.length,
    returnsCount: returns.length,
    expensesCount: expenses.length,
  };
};

/**
 * Calculates Dashboard metrics adhering strictly to accounting standards
 */
const getDashboardMetrics = async (dateFilter = 'today', customStart = null, customEnd = null) => {
  const { startDate, endDate } = getDateRange(dateFilter, customStart, customEnd);

  // Profit and loss for the selected period
  const pnl = await getProfitAndLoss(startDate, endDate);

  // Today's Sales specific metric
  const todayRange = getDateRange('today');
  const todaySalesDocs = await Sale.find({
    saleDate: { $gte: todayRange.startDate, $lte: todayRange.endDate },
    transactionStatus: { $in: ['COMPLETED', 'PARTIALLY_RETURNED'] },
  });
  const todaySalesCents = todaySalesDocs.reduce((acc, s) => acc + s.totalAmountCents, 0);

  // Cash Received Today (across sales payments and debt collections)
  const todayPayments = await Payment.find({
    paymentDate: { $gte: todayRange.startDate, $lte: todayRange.endDate },
    status: 'VALID',
    paymentMethod: 'CASH',
    partyType: 'CUSTOMER',
  });
  const cashReceivedTodayCents = todayPayments.reduce((acc, p) => acc + p.amountCents, 0);

  // Total Cash Received for selected period (all methods)
  const periodPayments = await Payment.find({
    paymentDate: { $gte: startDate, $lte: endDate },
    status: 'VALID',
    partyType: 'CUSTOMER',
  });
  const totalReceivedSelectedPeriodCents = periodPayments.reduce((acc, p) => acc + p.amountCents, 0);

  // Accounts Receivable (Outstanding Customer Debts) - current total
  const customers = await Customer.find({ status: { $ne: 'BLOCKED' } });
  const outstandingCustomerDebtsCents = customers.reduce((acc, c) => acc + c.outstandingBalanceCents, 0);

  // Accounts Payable (Outstanding Supplier Debts) - current total
  const suppliers = await Supplier.find({ status: 'ACTIVE' });
  const outstandingSupplierDebtsCents = suppliers.reduce((acc, s) => acc + s.outstandingBalanceCents, 0);

  // Total Inventory Valuation (sum of currentStock * costPriceCents)
  const products = await Product.find({ status: 'ACTIVE' });
  let totalInventoryValueCents = 0;
  let lowStockCount = 0;

  for (const prod of products) {
    if (prod.currentStock > 0) {
      totalInventoryValueCents += Math.round(prod.currentStock * prod.costPriceCents);
    }
    if (prod.currentStock <= prod.minStockLevel) {
      lowStockCount++;
    }
  }

  // Active Cash Drawer Session
  const activeSession = await CashSession.findOne({ status: 'OPEN' }).sort({ openedAt: -1 });
  let expectedCashBalanceCents = 0;
  if (activeSession) {
    expectedCashBalanceCents = activeSession.calculateExpectedCash();
  }

  return {
    dateFilter,
    startDate,
    endDate,
    todaySalesCents,
    totalSalesSelectedPeriodCents: pnl.netSalesCents,
    cashReceivedTodayCents,
    totalReceivedSelectedPeriodCents,
    outstandingCustomerDebtsCents,
    outstandingSupplierDebtsCents,
    totalInventoryValueCents,
    costOfGoodsSoldCents: pnl.costOfGoodsSoldCents,
    grossProfitCents: pnl.grossProfitCents,
    operatingExpensesCents: pnl.operatingExpensesCents,
    netProfitCents: pnl.netProfitCents,
    lowStockProductsCount: lowStockCount,
    totalCustomersCount: customers.length,
    expectedCashBalanceCents,
    activeCashSession: activeSession || null,
  };
};

/**
 * Calculates Customer Debt Aging Buckets:
 * 0-30 days, 31-60 days, 61-90 days, 90+ days
 */
const getDebtAgingReport = async () => {
  const now = new Date();
  const salesWithDebt = await Sale.find({
    transactionStatus: 'COMPLETED',
    outstandingBalanceCents: { $gt: 0 },
  }).populate('customer');

  const aging = {
    current0_30: { totalCents: 0, count: 0 },
    days31_60: { totalCents: 0, count: 0 },
    days61_90: { totalCents: 0, count: 0 },
    over90: { totalCents: 0, count: 0 },
    totalDebtCents: 0,
    invoices: [],
  };

  for (const s of salesWithDebt) {
    const ageDays = Math.floor((now - new Date(s.saleDate)) / (1000 * 60 * 60 * 24));
    const debt = s.outstandingBalanceCents;
    aging.totalDebtCents += debt;

    const invoiceInfo = {
      saleId: s._id,
      saleNumber: s.saleNumber,
      customerName: s.customer ? s.customer.name : s.customerName,
      customerPhone: s.customer ? s.customer.phone : '',
      saleDate: s.saleDate,
      totalAmountCents: s.totalAmountCents,
      outstandingBalanceCents: s.outstandingBalanceCents,
      ageDays,
    };

    if (ageDays <= 30) {
      aging.current0_30.totalCents += debt;
      aging.current0_30.count++;
      invoiceInfo.bucket = '0-30 days';
    } else if (ageDays <= 60) {
      aging.days31_60.totalCents += debt;
      aging.days31_60.count++;
      invoiceInfo.bucket = '31-60 days';
    } else if (ageDays <= 90) {
      aging.days61_90.totalCents += debt;
      aging.days61_90.count++;
      invoiceInfo.bucket = '61-90 days';
    } else {
      aging.over90.totalCents += debt;
      aging.over90.count++;
      invoiceInfo.bucket = '90+ days';
    }

    aging.invoices.push(invoiceInfo);
  }

  return aging;
};

module.exports = {
  getProfitAndLoss,
  getDashboardMetrics,
  getDebtAgingReport,
};

