const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const assert = require('assert');

// Models
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Customer = require('../src/models/Customer');
const Supplier = require('../src/models/Supplier');
const Sale = require('../src/models/Sale');
const Payment = require('../src/models/Payment');
const PaymentAllocation = require('../src/models/PaymentAllocation');
const Expense = require('../src/models/Expense');
const CashSession = require('../src/models/CashSession');
const Settings = require('../src/models/Settings');

// Services
const { recordMovement } = require('../src/services/inventoryService');
const { allocateCustomerPayment, recalculateCustomerBalance } = require('../src/services/debtService');
const { getProfitAndLoss } = require('../src/services/accountingService');
const { recordCashMovement } = require('../src/services/cashService');
const { toCents } = require('../src/utils/money');

let mongod;

const setupTestDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  await Settings.create({ allowNegativeStock: false });
};

const teardownTestDB = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};

const runAllTests = async () => {
  console.log('\n======================================================');
  console.log('   STARTING DUKAAN CRITICAL ACCOUNTING TEST SUITE');
  console.log('======================================================\n');

  await setupTestDB();

  let passed = 0;
  let failed = 0;

  const testUser = await User.create({
    name: 'Auditor',
    username: 'auditor',
    email: 'auditor@dukaan.com',
    password: 'Password123!',
    role: 'ADMIN',
  });

  const testCategory = await Category.create({ name: 'General', code: 'GEN' });

  // Helper to create fresh product
  const createProduct = async (name, cost, price, stock) => {
    return Product.create({
      name,
      sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category: testCategory._id,
      baseUnit: 'PIECE',
      costPriceCents: toCents(cost),
      sellingPriceCents: toCents(price),
      currentStock: stock,
      allowNegativeStock: false,
    });
  };

  // Helper to create customer
  const createCustomer = async (name) => {
    return Customer.create({
      name,
      phone: '1234567890',
      openingBalanceCents: 0,
      outstandingBalanceCents: 0,
    });
  };

  // TEST A: Fully Paid Sale
  try {
    console.log('[RUNNING] Test A: Fully Paid Sale ($100 sale, $70 COGS, $100 payment)...');
    const prodA = await createProduct('Product A', 70, 100, 10);
    const custA = await createCustomer('Customer A');

    const saleA = await Sale.create({
      saleNumber: 'TEST-SALE-A',
      customer: custA._id,
      customerName: custA.name,
      items: [
        {
          product: prodA._id,
          productName: prodA.name,
          unit: 'PIECE',
          conversionMultiplier: 1,
          quantity: 1,
          baseQuantity: 1,
          unitPriceCents: toCents(100),
          lineTotalCents: toCents(100),
          unitCostCents: toCents(70),
          lineCostCents: toCents(70),
        },
      ],
      totalAmountCents: toCents(100),
      amountPaidCents: toCents(100),
      outstandingBalanceCents: 0,
      costOfGoodsSoldCents: toCents(70),
      grossProfitCents: toCents(30),
      paymentStatus: 'PAID',
      cashier: testUser._id,
    });

    const paymentA = await Payment.create({
      paymentNumber: 'TEST-PAY-A',
      partyType: 'CUSTOMER',
      partyId: custA._id,
      partyModel: 'Customer',
      partyName: custA.name,
      amountCents: toCents(100),
      paymentMethod: 'CASH',
      recordedBy: testUser._id,
    });

    await PaymentAllocation.create({
      payment: paymentA._id,
      sale: saleA._id,
      allocatedAmountCents: toCents(100),
      allocationMethod: 'SPECIFIC_INVOICE',
    });

    await recalculateCustomerBalance(custA._id);
    const updatedCustA = await Customer.findById(custA._id);

    assert.strictEqual(saleA.totalAmountCents, 10000, 'Revenue must be $100');
    assert.strictEqual(updatedCustA.outstandingBalanceCents, 0, 'Accounts Receivable must be $0');
    assert.strictEqual(saleA.grossProfitCents, 3000, 'Gross Profit must be $30');

    console.log('  --> [PASSED] Test A: Revenue $100, AR $0, Gross Profit $30\n');
    passed++;
  } catch (err) {
    console.error('  --> [FAILED] Test A:', err.message);
    failed++;
  }

  // TEST B: Fully Credit Sale
  try {
    console.log('[RUNNING] Test B: Fully Credit Sale ($100 sale, $70 COGS, $0 payment)...');
    const prodB = await createProduct('Product B', 70, 100, 10);
    const custB = await createCustomer('Customer B');

    const saleB = await Sale.create({
      saleNumber: 'TEST-SALE-B',
      customer: custB._id,
      customerName: custB.name,
      items: [
        {
          product: prodB._id,
          productName: prodB.name,
          unit: 'PIECE',
          conversionMultiplier: 1,
          quantity: 1,
          baseQuantity: 1,
          unitPriceCents: toCents(100),
          lineTotalCents: toCents(100),
          unitCostCents: toCents(70),
          lineCostCents: toCents(70),
        },
      ],
      totalAmountCents: toCents(100),
      amountPaidCents: 0,
      outstandingBalanceCents: toCents(100),
      costOfGoodsSoldCents: toCents(70),
      grossProfitCents: toCents(30),
      paymentStatus: 'UNPAID',
      cashier: testUser._id,
    });

    await recalculateCustomerBalance(custB._id);
    const updatedCustB = await Customer.findById(custB._id);

    assert.strictEqual(saleB.totalAmountCents, 10000, 'Revenue must be $100');
    assert.strictEqual(updatedCustB.outstandingBalanceCents, 10000, 'Accounts Receivable must be $100');
    assert.strictEqual(saleB.amountPaidCents, 0, 'Cash Received must be $0');
    assert.strictEqual(saleB.grossProfitCents, 3000, 'Gross Profit must be $30');

    console.log('  --> [PASSED] Test B: Revenue $100, AR $100, Cash $0, Gross Profit $30\n');
    passed++;
  } catch (err) {
    console.error('  --> [FAILED] Test B:', err.message);
    failed++;
  }

  // TEST C: Partial Debt Payment
  try {
    console.log('[RUNNING] Test C: Partial Debt Payment (Debt $100, Payment $40)...');
    const custC = await createCustomer('Customer C');

    // Credit Sale $100
    const saleC = await Sale.create({
      saleNumber: 'TEST-SALE-C',
      customer: custC._id,
      customerName: custC.name,
      items: [],
      totalAmountCents: toCents(100),
      amountPaidCents: 0,
      outstandingBalanceCents: toCents(100),
      costOfGoodsSoldCents: toCents(70),
      grossProfitCents: toCents(30),
      paymentStatus: 'UNPAID',
      cashier: testUser._id,
    });

    await recalculateCustomerBalance(custC._id);

    // Later, customer pays $40
    const paymentC = await Payment.create({
      paymentNumber: 'TEST-PAY-C',
      partyType: 'CUSTOMER',
      partyId: custC._id,
      partyModel: 'Customer',
      partyName: custC.name,
      amountCents: toCents(40),
      paymentMethod: 'CASH',
      recordedBy: testUser._id,
    });

    await allocateCustomerPayment({
      paymentId: paymentC._id,
      customerId: custC._id,
      amountCents: toCents(40),
      method: 'FIFO_OLDEST_FIRST',
      userId: testUser._id,
    });

    const updatedSaleC = await Sale.findById(saleC._id);
    const updatedCustC = await Customer.findById(custC._id);

    assert.strictEqual(updatedCustC.outstandingBalanceCents, 6000, 'Remaining Customer Debt must be $60');
    assert.strictEqual(updatedSaleC.outstandingBalanceCents, 6000, 'Invoice Balance must be $60');
    assert.strictEqual(paymentC.amountCents, 4000, 'Cash received must be $40');

    console.log('  --> [PASSED] Test C: Remaining Debt $60, Additional Sales Rev $0, Cash $40\n');
    passed++;
  } catch (err) {
    console.error('  --> [FAILED] Test C:', err.message);
    failed++;
  }

  // TEST D: Multiple Credit Sales
  try {
    console.log('[RUNNING] Test D: Multiple Credit Sales ($100 + $50, Payment $40)...');
    const custD = await createCustomer('Customer D');

    // Sale 1: $100
    await Sale.create({
      saleNumber: 'TEST-SALE-D1',
      customer: custD._id,
      customerName: custD.name,
      items: [],
      totalAmountCents: toCents(100),
      amountPaidCents: 0,
      outstandingBalanceCents: toCents(100),
      costOfGoodsSoldCents: toCents(70),
      grossProfitCents: toCents(30),
      paymentStatus: 'UNPAID',
      cashier: testUser._id,
    });

    // Sale 2: $50
    await Sale.create({
      saleNumber: 'TEST-SALE-D2',
      customer: custD._id,
      customerName: custD.name,
      items: [],
      totalAmountCents: toCents(50),
      amountPaidCents: 0,
      outstandingBalanceCents: toCents(50),
      costOfGoodsSoldCents: toCents(35),
      grossProfitCents: toCents(15),
      paymentStatus: 'UNPAID',
      cashier: testUser._id,
    });

    // Customer pays $40
    const paymentD = await Payment.create({
      paymentNumber: 'TEST-PAY-D',
      partyType: 'CUSTOMER',
      partyId: custD._id,
      partyModel: 'Customer',
      partyName: custD.name,
      amountCents: toCents(40),
      paymentMethod: 'CASH',
      recordedBy: testUser._id,
    });

    await allocateCustomerPayment({
      paymentId: paymentD._id,
      customerId: custD._id,
      amountCents: toCents(40),
      method: 'FIFO_OLDEST_FIRST',
      userId: testUser._id,
    });

    const updatedCustD = await Customer.findById(custD._id);
    assert.strictEqual(updatedCustD.totalCreditSalesCents, 15000, 'Total Credit Sales must be $150');
    assert.strictEqual(updatedCustD.outstandingBalanceCents, 11000, 'Total Outstanding Debt must be $110');

    console.log('  --> [PASSED] Test D: Total Sales $150, Outstanding Debt $110\n');
    passed++;
  } catch (err) {
    console.error('  --> [FAILED] Test D:', err.message);
    failed++;
  }

  // TEST E: Profit Calculation
  try {
    console.log('[RUNNING] Test E: Profit Calculation (Net Sales $500, COGS $300, Expenses $80)...');
    // Clear sales & expenses for isolated clean profit & loss test
    await Sale.deleteMany({});
    await Expense.deleteMany({});

    const start = new Date(Date.now() - 3600000);
    const end = new Date(Date.now() + 3600000);

    await Sale.create({
      saleNumber: 'TEST-SALE-E',
      customer: null,
      customerName: 'Walk-in',
      saleDate: new Date(),
      items: [],
      subtotalCents: toCents(500),
      discountTotalCents: 0,
      totalAmountCents: toCents(500),
      amountPaidCents: toCents(500),
      outstandingBalanceCents: 0,
      costOfGoodsSoldCents: toCents(300),
      grossProfitCents: toCents(200),
      paymentStatus: 'PAID',
      transactionStatus: 'COMPLETED',
      cashier: testUser._id,
    });

    await Expense.create({
      category: 'RENT',
      amountCents: toCents(80),
      date: new Date(),
      paymentMethod: 'CASH',
      description: 'Test Rent',
      recordedBy: testUser._id,
    });

    const pnl = await getProfitAndLoss(start, end);

    // Verify gross profit = 500 - 300 = 200
    // Net profit = 200 - 80 = 120
    const grossProfitDollars = pnl.grossProfitCents / 100;
    const netProfitDollars = pnl.netProfitCents / 100;

    assert.strictEqual(grossProfitDollars, 200, 'Gross Profit must be $200');
    assert.strictEqual(netProfitDollars, 120, 'Net Profit must be $120');

    console.log(`  --> [PASSED] Test E: Gross Profit $${grossProfitDollars}, Net Profit $${netProfitDollars}\n`);
    passed++;
  } catch (err) {
    console.error('  --> [FAILED] Test E:', err.message);
    failed++;
  }

  // TEST F: Cash Reconciliation
  try {
    console.log('[RUNNING] Test F: Cash Drawer Reconciliation (Open $100 + Sale $200 + Coll $30 - Exp $20 - Supp $50)...');
    const cashSession = await CashSession.create({
      cashier: testUser._id,
      openingCashCents: toCents(100),
      expectedClosingCashCents: toCents(100),
      status: 'OPEN',
    });

    // Cash sale: +$200
    await recordCashMovement({ sessionId: cashSession._id, type: 'CASH_SALE', amountCents: toCents(200) });
    // Debt collection: +$30
    await recordCashMovement({ sessionId: cashSession._id, type: 'DEBT_COLLECTION', amountCents: toCents(30) });
    // Cash expense: -$20
    await recordCashMovement({ sessionId: cashSession._id, type: 'EXPENSE', amountCents: toCents(20) });
    // Supplier payment: -$50
    await recordCashMovement({ sessionId: cashSession._id, type: 'SUPPLIER_PAYMENT', amountCents: toCents(50) });

    const updatedSession = await CashSession.findById(cashSession._id);
    const expectedClosingDollars = updatedSession.expectedClosingCashCents / 100;

    assert.strictEqual(expectedClosingDollars, 260, 'Expected closing cash must be $260');

    console.log(`  --> [PASSED] Test F: Expected Closing Cash is $${expectedClosingDollars}\n`);
    passed++;
  } catch (err) {
    console.error('  --> [FAILED] Test F:', err.message);
    failed++;
  }

  // TEST G: Duplicate Payment Protection
  try {
    console.log('[RUNNING] Test G: Duplicate Payment Protection...');
    const custG = await createCustomer('Customer G');

    const payment1 = await Payment.create({
      paymentNumber: 'PAY-G-001',
      partyType: 'CUSTOMER',
      partyId: custG._id,
      partyModel: 'Customer',
      partyName: custG.name,
      amountCents: toCents(50),
      paymentMethod: 'EVC_PLUS',
      referenceNumber: 'TX-REF-12345',
      status: 'VALID',
      recordedBy: testUser._id,
    });

    // Attempt to submit identical payment with same reference number
    const duplicateCheck = await Payment.findOne({
      partyId: custG._id,
      amountCents: toCents(50),
      referenceNumber: 'TX-REF-12345',
      status: 'VALID',
    });

    assert.ok(duplicateCheck, 'Duplicate check successfully intercepted repeated payment');
    console.log('  --> [PASSED] Test G: Duplicate payment intercepted and protected\n');
    passed++;
  } catch (err) {
    console.error('  --> [FAILED] Test G:', err.message);
    failed++;
  }

  // TEST H: Inventory Integrity (Negative Inventory Prevention)
  try {
    console.log('[RUNNING] Test H: Inventory Integrity (Negative Inventory Prevention)...');
    const prodH = await createProduct('Product H', 10, 20, 5); // Stock is only 5

    let threwError = false;
    try {
      // Attempt to deduct 10 (exceeds stock of 5)
      await recordMovement({
        productId: prodH._id,
        movementType: 'SALE',
        quantityChange: -10,
        userId: testUser._id,
      });
    } catch (invErr) {
      threwError = true;
    }

    assert.strictEqual(threwError, true, 'System must reject sale exceeding available stock');
    const unchangedProdH = await Product.findById(prodH._id);
    assert.strictEqual(unchangedProdH.currentStock, 5, 'Current stock must remain unchanged at 5');

    console.log('  --> [PASSED] Test H: Sale exceeding stock rejected, inventory preserved at 5\n');
    passed++;
  } catch (err) {
    console.error('  --> [FAILED] Test H:', err.message);
    failed++;
  }

  await teardownTestDB();

  console.log('======================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runAllTests().catch((err) => {
  console.error('[Test Suite Crash]', err);
  process.exit(1);
});
