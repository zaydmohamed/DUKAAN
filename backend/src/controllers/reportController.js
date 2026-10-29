const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const CashSession = require('../models/CashSession');
const InventoryMovement = require('../models/InventoryMovement');
const SalesReturn = require('../models/SalesReturn');
const { getProfitAndLoss, getDashboardMetrics, getDebtAgingReport } = require('../services/accountingService');
const { getDateRange } = require('../utils/dateRange');

// Helper to convert array of objects to CSV string
const convertToCSV = (rows, headers) => {
  if (!rows || !rows.length) return headers.join(',') + '\n';
  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((header) => {
      let val = row[header] !== undefined && row[header] !== null ? row[header] : '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
};

// @desc Dashboard Overview Metrics
// @route GET /api/reports/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const { filter = 'today', startDate, endDate } = req.query;
    const data = await getDashboardMetrics(filter, startDate, endDate);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// @desc Unified Reports Endpoint for all 20 reports + CSV export
// @route GET /api/reports/:reportType
const getReport = async (req, res, next) => {
  try {
    const { reportType } = req.params;
    const { filter = 'this_month', startDate: customStart, endDate: customEnd, format } = req.query;
    const { startDate, endDate } = getDateRange(filter, customStart, customEnd);

    let reportData = [];
    let headers = [];
    let summary = {};

    switch (reportType) {
      // 1. Daily Sales Report
      // 2. Weekly Sales Report
      // 3. Monthly Sales Report
      // 4. Annual Sales Report
      case 'daily-sales':
      case 'weekly-sales':
      case 'monthly-sales':
      case 'annual-sales': {
        const sales = await Sale.find({
          saleDate: { $gte: startDate, $lte: endDate },
          transactionStatus: { $in: ['COMPLETED', 'PARTIALLY_RETURNED'] },
        }).populate('customer', 'name phone').sort({ saleDate: -1 });

        reportData = sales.map((s) => ({
          saleNumber: s.saleNumber,
          date: s.saleDate.toISOString().split('T')[0],
          customer: s.customer ? s.customer.name : s.customerName,
          totalAmount: (s.totalAmountCents / 100).toFixed(2),
          paidAmount: (s.amountPaidCents / 100).toFixed(2),
          balance: (s.outstandingBalanceCents / 100).toFixed(2),
          paymentStatus: s.paymentStatus,
          cogs: (s.costOfGoodsSoldCents / 100).toFixed(2),
          grossProfit: (s.grossProfitCents / 100).toFixed(2),
        }));

        headers = ['saleNumber', 'date', 'customer', 'totalAmount', 'paidAmount', 'balance', 'paymentStatus', 'cogs', 'grossProfit'];
        const totalRev = sales.reduce((a, b) => a + b.totalAmountCents, 0);
        const totalProfit = sales.reduce((a, b) => a + b.grossProfitCents, 0);
        summary = { totalRevenueCents: totalRev, totalGrossProfitCents: totalProfit, count: sales.length };
        break;
      }

      // 5. Cash Flow Report
      case 'cash-flow': {
        const paymentsIn = await Payment.find({
          paymentDate: { $gte: startDate, $lte: endDate },
          status: 'VALID',
          partyType: 'CUSTOMER',
        });
        const paymentsOut = await Payment.find({
          paymentDate: { $gte: startDate, $lte: endDate },
          status: 'VALID',
          partyType: 'SUPPLIER',
        });
        const expenses = await Expense.find({
          date: { $gte: startDate, $lte: endDate },
        });

        const totalIn = paymentsIn.reduce((a, b) => a + b.amountCents, 0);
        const totalSuppOut = paymentsOut.reduce((a, b) => a + b.amountCents, 0);
        const totalExpOut = expenses.reduce((a, b) => a + b.amountCents, 0);
        const netCashFlow = totalIn - totalSuppOut - totalExpOut;

        summary = {
          totalInflowsCents: totalIn,
          totalOutflowsCents: totalSuppOut + totalExpOut,
          supplierPaymentsCents: totalSuppOut,
          operatingExpensesCents: totalExpOut,
          netCashFlowCents: netCashFlow,
        };

        reportData = [
          ...paymentsIn.map((p) => ({
            type: 'INFLOW (Customer Payment)',
            number: p.paymentNumber,
            date: p.paymentDate.toISOString().split('T')[0],
            method: p.paymentMethod,
            amount: (p.amountCents / 100).toFixed(2),
          })),
          ...paymentsOut.map((p) => ({
            type: 'OUTFLOW (Supplier Payment)',
            number: p.paymentNumber,
            date: p.paymentDate.toISOString().split('T')[0],
            method: p.paymentMethod,
            amount: `-${(p.amountCents / 100).toFixed(2)}`,
          })),
          ...expenses.map((e) => ({
            type: `OUTFLOW (${e.category})`,
            number: e.referenceNumber || 'EXPENSE',
            date: e.date.toISOString().split('T')[0],
            method: e.paymentMethod,
            amount: `-${(e.amountCents / 100).toFixed(2)}`,
          })),
        ];
        headers = ['type', 'number', 'date', 'method', 'amount'];
        break;
      }

      // 6. Cash Session Report
      case 'cash-sessions': {
        const sessions = await CashSession.find({
          openedAt: { $gte: startDate, $lte: endDate },
        }).populate('cashier', 'name').sort({ openedAt: -1 });

        reportData = sessions.map((s) => ({
          sessionId: s._id,
          cashier: s.cashier ? s.cashier.name : 'Unknown',
          openedAt: s.openedAt.toISOString(),
          closedAt: s.closedAt ? s.closedAt.toISOString() : 'OPEN',
          openingCash: (s.openingCashCents / 100).toFixed(2),
          cashSales: (s.cashSalesCents / 100).toFixed(2),
          cashDebtCollections: (s.cashDebtCollectionsCents / 100).toFixed(2),
          cashExpenses: (s.cashExpensesCents / 100).toFixed(2),
          expectedCash: (s.expectedClosingCashCents / 100).toFixed(2),
          actualCash: (s.actualCountedCashCents / 100).toFixed(2),
          difference: (s.differenceCents / 100).toFixed(2),
          status: s.status,
        }));
        headers = ['sessionId', 'cashier', 'openedAt', 'closedAt', 'openingCash', 'cashSales', 'cashDebtCollections', 'cashExpenses', 'expectedCash', 'actualCash', 'difference', 'status'];
        break;
      }

      // 7. Customer Debt Report
      case 'customer-debts': {
        const customers = await Customer.find({ outstandingBalanceCents: { $gt: 0 } }).sort({ outstandingBalanceCents: -1 });
        reportData = customers.map((c) => ({
          customerName: c.name,
          phone: c.phone || '',
          totalSales: (c.totalCreditSalesCents / 100).toFixed(2),
          totalPayments: (c.totalPaymentsCents / 100).toFixed(2),
          outstandingDebt: (c.outstandingBalanceCents / 100).toFixed(2),
        }));
        headers = ['customerName', 'phone', 'totalSales', 'totalPayments', 'outstandingDebt'];
        summary = { totalDebtCents: customers.reduce((a, b) => a + b.outstandingBalanceCents, 0), customerCount: customers.length };
        break;
      }

      // 8. Customer Debt Aging Report
      case 'debt-aging': {
        const aging = await getDebtAgingReport();
        reportData = aging.invoices.map((inv) => ({
          saleNumber: inv.saleNumber,
          customerName: inv.customerName,
          date: new Date(inv.saleDate).toISOString().split('T')[0],
          totalAmount: (inv.totalAmountCents / 100).toFixed(2),
          balance: (inv.outstandingBalanceCents / 100).toFixed(2),
          ageDays: inv.ageDays,
          agingBucket: inv.bucket,
        }));
        headers = ['saleNumber', 'customerName', 'date', 'totalAmount', 'balance', 'ageDays', 'agingBucket'];
        summary = aging;
        break;
      }

      // 9. Supplier Debt Report
      case 'supplier-debts': {
        const suppliers = await Supplier.find({ outstandingBalanceCents: { $gt: 0 } }).sort({ outstandingBalanceCents: -1 });
        reportData = suppliers.map((s) => ({
          supplierName: s.name,
          phone: s.phone || '',
          totalPurchases: (s.totalPurchasesCents / 100).toFixed(2),
          totalPayments: (s.totalPaymentsCents / 100).toFixed(2),
          outstandingPayable: (s.outstandingBalanceCents / 100).toFixed(2),
        }));
        headers = ['supplierName', 'phone', 'totalPurchases', 'totalPayments', 'outstandingPayable'];
        summary = { totalPayableCents: suppliers.reduce((a, b) => a + b.outstandingBalanceCents, 0) };
        break;
      }

      // 10. Inventory Movement Report
      case 'inventory-movements': {
        const movements = await InventoryMovement.find({
          createdAt: { $gte: startDate, $lte: endDate },
        }).populate('product', 'name sku').populate('createdBy', 'name').sort({ createdAt: -1 });

        reportData = movements.map((m) => ({
          date: m.createdAt.toISOString(),
          product: m.product ? m.product.name : 'Unknown',
          sku: m.product ? m.product.sku : '',
          movementType: m.movementType,
          quantity: m.quantity,
          unit: m.unit,
          stockBefore: m.stockBefore,
          stockAfter: m.stockAfter,
          reason: m.reason || '',
          user: m.createdBy ? m.createdBy.name : 'System',
        }));
        headers = ['date', 'product', 'sku', 'movementType', 'quantity', 'unit', 'stockBefore', 'stockAfter', 'reason', 'user'];
        break;
      }

      // 11. Stock Valuation Report
      case 'stock-valuation': {
        const prods = await Product.find({ status: 'ACTIVE' }).populate('category', 'name').sort({ name: 1 });
        let totalVal = 0;
        reportData = prods.map((p) => {
          const val = Math.round(p.currentStock * p.costPriceCents);
          totalVal += val;
          return {
            productName: p.name,
            sku: p.sku,
            category: p.category ? p.category.name : '',
            unit: p.baseUnit,
            costPrice: (p.costPriceCents / 100).toFixed(2),
            sellingPrice: (p.sellingPriceCents / 100).toFixed(2),
            currentStock: p.currentStock,
            totalValuation: (val / 100).toFixed(2),
          };
        });
        headers = ['productName', 'sku', 'category', 'unit', 'costPrice', 'sellingPrice', 'currentStock', 'totalValuation'];
        summary = { totalStockValuationCents: totalVal, productCount: prods.length };
        break;
      }

      // 12. Low Stock Report
      case 'low-stock': {
        const lowProds = await Product.find({
          status: 'ACTIVE',
          $expr: { $lte: ['$currentStock', '$minStockLevel'] },
        }).populate('category', 'name');

        reportData = lowProds.map((p) => ({
          productName: p.name,
          sku: p.sku,
          currentStock: p.currentStock,
          minStockLevel: p.minStockLevel,
          unit: p.baseUnit,
          reorderNeeded: Math.max(0, p.minStockLevel - p.currentStock),
        }));
        headers = ['productName', 'sku', 'currentStock', 'minStockLevel', 'unit', 'reorderNeeded'];
        break;
      }

      // 13. Damaged Goods Report
      case 'damaged-goods': {
        const damaged = await InventoryMovement.find({
          movementType: 'DAMAGE',
          createdAt: { $gte: startDate, $lte: endDate },
        }).populate('product', 'name sku').populate('createdBy', 'name');

        reportData = damaged.map((d) => ({
          date: d.createdAt.toISOString(),
          product: d.product ? d.product.name : 'Unknown',
          quantity: Math.abs(d.quantity),
          unitCost: (d.unitCostCents / 100).toFixed(2),
          totalLoss: (d.totalCostCents / 100).toFixed(2),
          reason: d.reason || '',
          user: d.createdBy ? d.createdBy.name : 'System',
        }));
        headers = ['date', 'product', 'quantity', 'unitCost', 'totalLoss', 'reason', 'user'];
        summary = { totalLossCents: damaged.reduce((a, b) => a + b.totalCostCents, 0) };
        break;
      }

      // 14. Expense Report
      case 'expenses': {
        const exps = await Expense.find({
          date: { $gte: startDate, $lte: endDate },
        }).populate('recordedBy', 'name').sort({ date: -1 });

        reportData = exps.map((e) => ({
          date: e.date.toISOString().split('T')[0],
          category: e.category,
          amount: (e.amountCents / 100).toFixed(2),
          method: e.paymentMethod,
          description: e.description,
          recordedBy: e.recordedBy ? e.recordedBy.name : '',
        }));
        headers = ['date', 'category', 'amount', 'method', 'description', 'recordedBy'];
        summary = { totalExpensesCents: exps.reduce((a, b) => a + b.amountCents, 0) };
        break;
      }

      // 15. Gross Profit Report
      case 'gross-profit': {
        const sales = await Sale.find({
          saleDate: { $gte: startDate, $lte: endDate },
          transactionStatus: { $in: ['COMPLETED', 'PARTIALLY_RETURNED'] },
        }).sort({ saleDate: -1 });

        reportData = sales.map((s) => ({
          saleNumber: s.saleNumber,
          date: s.saleDate.toISOString().split('T')[0],
          netSales: (s.totalAmountCents / 100).toFixed(2),
          cogs: (s.costOfGoodsSoldCents / 100).toFixed(2),
          grossProfit: (s.grossProfitCents / 100).toFixed(2),
          marginPercent: s.totalAmountCents > 0 ? ((s.grossProfitCents / s.totalAmountCents) * 100).toFixed(1) + '%' : '0%',
        }));
        headers = ['saleNumber', 'date', 'netSales', 'cogs', 'grossProfit', 'marginPercent'];
        const pnl = await getProfitAndLoss(startDate, endDate);
        summary = pnl;
        break;
      }

      // 16. Net Profit and Loss Report
      case 'net-profit-loss': {
        const pnl = await getProfitAndLoss(startDate, endDate);
        summary = pnl;
        reportData = [
          { item: 'Gross Sales Revenue', amount: (pnl.grossSalesCents / 100).toFixed(2) },
          { item: 'Less: Customer Discounts', amount: `-${(pnl.discountTotalCents / 100).toFixed(2)}` },
          { item: 'Less: Sales Returns', amount: `-${(pnl.salesReturnsCents / 100).toFixed(2)}` },
          { item: 'Net Sales Revenue', amount: (pnl.netSalesCents / 100).toFixed(2) },
          { item: 'Less: Cost of Goods Sold (COGS)', amount: `-${(pnl.costOfGoodsSoldCents / 100).toFixed(2)}` },
          { item: 'Gross Profit', amount: (pnl.grossProfitCents / 100).toFixed(2) },
          { item: 'Less: Operating Expenses', amount: `-${(pnl.operatingExpensesCents / 100).toFixed(2)}` },
          { item: 'Net Business Profit', amount: (pnl.netProfitCents / 100).toFixed(2) },
        ];
        headers = ['item', 'amount'];
        break;
      }

      // 17. Payment Method Report
      case 'payment-methods': {
        const payments = await Payment.find({
          paymentDate: { $gte: startDate, $lte: endDate },
          status: 'VALID',
        });
        const methodsMap = {};
        for (const p of payments) {
          if (!methodsMap[p.paymentMethod]) {
            methodsMap[p.paymentMethod] = { count: 0, totalCents: 0 };
          }
          methodsMap[p.paymentMethod].count++;
          methodsMap[p.paymentMethod].totalCents += p.amountCents;
        }
        reportData = Object.entries(methodsMap).map(([method, data]) => ({
          paymentMethod: method,
          transactionCount: data.count,
          totalAmount: (data.totalCents / 100).toFixed(2),
        }));
        headers = ['paymentMethod', 'transactionCount', 'totalAmount'];
        break;
      }

      // 18. Customer Statement Report
      // 19. Supplier Statement Report
      case 'customer-statements': {
        const custs = await Customer.find().sort({ name: 1 });
        reportData = custs.map((c) => ({
          name: c.name,
          phone: c.phone || '',
          totalSales: (c.totalCreditSalesCents / 100).toFixed(2),
          totalPaid: (c.totalPaymentsCents / 100).toFixed(2),
          outstandingBalance: (c.outstandingBalanceCents / 100).toFixed(2),
        }));
        headers = ['name', 'phone', 'totalSales', 'totalPaid', 'outstandingBalance'];
        break;
      }

      case 'supplier-statements': {
        const supps = await Supplier.find().sort({ name: 1 });
        reportData = supps.map((s) => ({
          name: s.name,
          phone: s.phone || '',
          totalPurchases: (s.totalPurchasesCents / 100).toFixed(2),
          totalPaid: (s.totalPaymentsCents / 100).toFixed(2),
          outstandingPayable: (s.outstandingBalanceCents / 100).toFixed(2),
        }));
        headers = ['name', 'phone', 'totalPurchases', 'totalPaid', 'outstandingPayable'];
        break;
      }

      // 20. Sales Returns Report
      case 'sales-returns': {
        const returns = await SalesReturn.find({
          createdAt: { $gte: startDate, $lte: endDate },
        }).populate('sale', 'saleNumber').populate('processedBy', 'name');

        reportData = returns.map((r) => ({
          returnNumber: r.returnNumber,
          saleNumber: r.sale ? r.sale.saleNumber : '',
          date: r.createdAt.toISOString().split('T')[0],
          refundAmount: (r.totalRefundCents / 100).toFixed(2),
          refundMethod: r.refundMethod,
          reason: r.reason,
          processedBy: r.processedBy ? r.processedBy.name : '',
        }));
        headers = ['returnNumber', 'saleNumber', 'date', 'refundAmount', 'refundMethod', 'reason', 'processedBy'];
        break;
      }

      default:
        return res.status(404).json({ success: false, message: `Report '${reportType}' not found` });
    }

    if (format === 'csv') {
      const csv = convertToCSV(reportData, headers);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${reportType}-report.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      reportType,
      filter,
      startDate,
      endDate,
      count: reportData.length,
      summary,
      headers,
      data: reportData,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getReport,
};

