require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');

const User = require('../models/User');
const Settings = require('../models/Settings');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const InventoryMovement = require('../models/InventoryMovement');
const CashSession = require('../models/CashSession');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    const Sale = require('../models/Sale');
    const Payment = require('../models/Payment');
    const PaymentAllocation = require('../models/PaymentAllocation');
    const Expense = require('../models/Expense');

    await Promise.all([
      User.deleteMany({}),
      Settings.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Supplier.deleteMany({}),
      Customer.deleteMany({}),
      InventoryMovement.deleteMany({}),
      CashSession.deleteMany({}),
      Sale.deleteMany({}),
      Payment.deleteMany({}),
      PaymentAllocation.deleteMany({}),
      Expense.deleteMany({}),
    ]);

    console.log('[Seed] Seeding Default Settings...');
    await Settings.create({
      shopName: 'DUKAAN Enterprise',
      tagline: 'Modern Retail & Wholesale Shop Management',
      phone: '+1 800 555 DUKAN',
      email: 'contact@dukaan.com',
      address: 'Central Market Boulevard, Suite 101',
      currency: 'USD',
      currencySymbol: '$',
      timezone: 'UTC',
      allowNegativeStock: false,
      costingMethod: 'WEIGHTED_AVERAGE',
      receiptFooterMessage: 'Thank you for shopping at DUKAAN! Please retain this receipt.',
    });

    console.log('[Seed] Seeding Users...');
    const adminUser = await User.create({
      name: 'Business Owner',
      username: 'admin',
      email: 'admin@dukaan.com',
      password: 'Password123!',
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    const cashierUser = await User.create({
      name: 'Salma Cashier',
      username: 'cashier',
      email: 'cashier@dukaan.com',
      password: 'Password123!',
      role: 'CASHIER',
      status: 'ACTIVE',
    });

    const stockManagerUser = await User.create({
      name: 'Farhan Stock Manager',
      username: 'stock',
      email: 'stock@dukaan.com',
      password: 'Password123!',
      role: 'STOCK_MANAGER',
      status: 'ACTIVE',
    });

    console.log('[Seed] Seeding Categories...');
    const catGroceries = await Category.create({ name: 'Groceries', code: 'GRO', description: 'Staples and essentials' });
    const catBeverages = await Category.create({ name: 'Beverages', code: 'BEV', description: 'Drinks and juices' });
    const catSnacks = await Category.create({ name: 'Snacks & Sweets', code: 'SNK', description: 'Biscuits and confectionery' });
    const catHousehold = await Category.create({ name: 'Household', code: 'HOU', description: 'Cleaners and detergents' });

    console.log('[Seed] Seeding Products with Multi-unit Conversions...');
    const productsData = [
      {
        name: 'Basmati Rice 5kg',
        sku: 'RICE-005',
        barcode: '8901234567890',
        category: catGroceries._id,
        baseUnit: 'PIECE',
        unitConversions: [{ unitName: 'CARTON', multiplier: 4, sellingPriceCents: 5800 }], // 1 carton = 4 bags ($58.00)
        costPriceCents: 1000, // $10.00
        sellingPriceCents: 1500, // $15.00
        currentStock: 100,
        minStockLevel: 15,
      },
      {
        name: 'Mineral Water 1.5L',
        sku: 'WAT-015',
        barcode: '8901234567891',
        category: catBeverages._id,
        baseUnit: 'PIECE',
        unitConversions: [{ unitName: 'CARTON', multiplier: 12, sellingPriceCents: 1000 }], // 1 carton = 12 bottles ($10.00)
        costPriceCents: 50, // $0.50
        sellingPriceCents: 100, // $1.00
        currentStock: 240,
        minStockLevel: 48,
      },
      {
        name: 'Full Cream Milk 1L',
        sku: 'MILK-001',
        barcode: '8901234567892',
        category: catBeverages._id,
        baseUnit: 'PIECE',
        unitConversions: [{ unitName: 'CARTON', multiplier: 12, sellingPriceCents: 2200 }],
        costPriceCents: 120, // $1.20
        sellingPriceCents: 200, // $2.00
        currentStock: 120,
        minStockLevel: 24,
      },
      {
        name: 'Pure Cooking Oil 5L',
        sku: 'OIL-005',
        barcode: '8901234567893',
        category: catGroceries._id,
        baseUnit: 'PIECE',
        unitConversions: [{ unitName: 'CARTON', multiplier: 4, sellingPriceCents: 5200 }],
        costPriceCents: 900, // $9.00
        sellingPriceCents: 1400, // $14.00
        currentStock: 50,
        minStockLevel: 10,
      },
      {
        name: 'Fine Granulated Sugar (kg)',
        sku: 'SUG-001',
        barcode: '8901234567894',
        category: catGroceries._id,
        baseUnit: 'KG',
        unitConversions: [{ unitName: 'SACK', multiplier: 50, sellingPriceCents: 6500 }], // 1 sack = 50 kg ($65.00)
        costPriceCents: 90, // $0.90 per kg
        sellingPriceCents: 140, // $1.40 per kg
        currentStock: 500,
        minStockLevel: 50,
      },
      {
        name: 'Premium Tea Bags 100s',
        sku: 'TEA-100',
        barcode: '8901234567895',
        category: catBeverages._id,
        baseUnit: 'PIECE',
        unitConversions: [{ unitName: 'CARTON', multiplier: 24, sellingPriceCents: 11000 }],
        costPriceCents: 320, // $3.20
        sellingPriceCents: 500, // $5.00
        currentStock: 72,
        minStockLevel: 12,
      },
      {
        name: 'Laundry Detergent Powder 3kg',
        sku: 'DET-003',
        barcode: '8901234567896',
        category: catHousehold._id,
        baseUnit: 'PIECE',
        unitConversions: [{ unitName: 'BOX', multiplier: 6, sellingPriceCents: 4500 }],
        costPriceCents: 550, // $5.50
        sellingPriceCents: 850, // $8.50
        currentStock: 8, // Low Stock trigger
        minStockLevel: 10,
      },
      {
        name: 'Chocolate Cream Biscuits 120g',
        sku: 'BIS-120',
        barcode: '8901234567897',
        category: catSnacks._id,
        baseUnit: 'PIECE',
        unitConversions: [{ unitName: 'BOX', multiplier: 24, sellingPriceCents: 1800 }],
        costPriceCents: 50,
        sellingPriceCents: 85,
        currentStock: 144,
        minStockLevel: 24,
      },
    ];

    for (const p of productsData) {
      const prod = await Product.create(p);
      // Record initial inventory movement
      await InventoryMovement.create({
        product: prod._id,
        movementType: 'OPENING',
        quantity: prod.currentStock,
        unit: prod.baseUnit,
        unitCostCents: prod.costPriceCents,
        totalCostCents: prod.currentStock * prod.costPriceCents,
        stockBefore: 0,
        stockAfter: prod.currentStock,
        referenceType: 'InitialStock',
        reason: 'Opening stock at system setup',
        createdBy: adminUser._id,
      });
    }

    console.log('[Seed] Seeding Suppliers...');
    await Supplier.create([
      {
        name: 'Global Wholesale Mart',
        contactPerson: 'David Miller',
        phone: '+1 888 111 2222',
        email: 'orders@globalmart.com',
        address: '45 Logistics Way, Port Industrial Area',
        openingBalanceCents: 0,
        outstandingBalanceCents: 0,
      },
      {
        name: 'National Beverage Distributing Co.',
        contactPerson: 'Layla Vance',
        phone: '+1 888 333 4444',
        email: 'sales@natbev.com',
        address: '88 Riverfront Road',
        openingBalanceCents: 0,
        outstandingBalanceCents: 0,
      },
    ]);

    console.log('[Seed] Seeding Customers...');
    await Customer.create([
      {
        name: 'Ahmed Hassan',
        phone: '+1 555 901 2345',
        email: 'ahmed.hassan@example.com',
        address: 'Flat 4B, Palm Residency',
        notes: 'Reliable weekly customer',
        openingBalanceCents: 0,
        outstandingBalanceCents: 0,
        creditLimitCents: 50000, // $500.00 credit limit
      },
      {
        name: 'Sunrise Mini-Café',
        phone: '+1 555 777 8899',
        email: 'procurement@sunrisecafe.com',
        address: 'Shop 12, Downtown Food Court',
        notes: 'Buys milk and tea in cartons',
        openingBalanceCents: 0,
        outstandingBalanceCents: 0,
        creditLimitCents: 150000, // $1,500.00 credit limit
      },
      {
        name: 'Fatimah Noor',
        phone: '+1 555 333 1122',
        email: 'fatimah.noor@example.com',
        address: '22 Blossom Garden',
        openingBalanceCents: 0,
        outstandingBalanceCents: 0,
        creditLimitCents: 20000,
      },
    ]);

    console.log('[Seed] Seeding Open Cash Session...');
    const activeSession = await CashSession.create({
      cashier: cashierUser._id,
      openingCashCents: 15000, // $150.00
      expectedClosingCashCents: 15000,
      status: 'OPEN',
      openedAt: new Date(),
    });

    console.log('[Seed] Seeding Initial Transactions...');
    const custAhmed = await Customer.findOne({ name: 'Ahmed Hassan' });
    const riceProduct = await Product.findOne({ sku: 'RICE-005' });
    const milkProduct = await Product.findOne({ sku: 'MILK-001' });

    if (custAhmed && riceProduct && milkProduct) {
      // Sale 1: Credit sale to Ahmed ($45.00, $0 paid => $45.00 debt)
      const sale1 = await Sale.create({
        saleNumber: 'INV-20261027-001',
        customer: custAhmed._id,
        customerName: custAhmed.name,
        saleDate: new Date(),
        items: [
          {
            product: riceProduct._id,
            productName: riceProduct.name,
            sku: riceProduct.sku,
            unit: 'PIECE',
            conversionMultiplier: 1,
            quantity: 3,
            baseQuantity: 3,
            unitPriceCents: 1500,
            lineTotalCents: 4500,
            unitCostCents: 1000,
            lineCostCents: 3000,
          },
        ],
        subtotalCents: 4500,
        discountTotalCents: 0,
        taxTotalCents: 0,
        totalAmountCents: 4500,
        amountPaidCents: 0,
        outstandingBalanceCents: 4500,
        costOfGoodsSoldCents: 3000,
        grossProfitCents: 1500,
        paymentStatus: 'UNPAID',
        transactionStatus: 'COMPLETED',
        cashier: cashierUser._id,
      });

      // Update Ahmed's balance
      custAhmed.totalCreditSalesCents = 4500;
      custAhmed.outstandingBalanceCents = 4500;
      await custAhmed.save();

      // Deduct stock for sale 1
      riceProduct.currentStock -= 3;
      await riceProduct.save();

      // Sale 2: Cash sale to Walk-in ($24.00, paid in cash => feeds cash drawer)
      const sale2 = await Sale.create({
        saleNumber: 'INV-20261027-002',
        customer: null,
        customerName: 'Walk-in Customer',
        saleDate: new Date(),
        items: [
          {
            product: milkProduct._id,
            productName: milkProduct.name,
            sku: milkProduct.sku,
            unit: 'PIECE',
            conversionMultiplier: 1,
            quantity: 12,
            baseQuantity: 12,
            unitPriceCents: 200,
            lineTotalCents: 2400,
            unitCostCents: 120,
            lineCostCents: 1440,
          },
        ],
        subtotalCents: 2400,
        discountTotalCents: 0,
        taxTotalCents: 0,
        totalAmountCents: 2400,
        amountPaidCents: 2400,
        outstandingBalanceCents: 0,
        costOfGoodsSoldCents: 1440,
        grossProfitCents: 960,
        paymentStatus: 'PAID',
        transactionStatus: 'COMPLETED',
        cashier: cashierUser._id,
        cashSession: activeSession._id,
      });

      // Record cash payment
      const payment2 = await Payment.create({
        paymentNumber: 'PAY-20261027-001',
        partyType: 'CUSTOMER',
        partyId: sale2._id,
        partyModel: 'Sale',
        partyName: 'Walk-in Customer',
        amountCents: 2400,
        paymentMethod: 'CASH',
        accountType: 'CASH_DRAWER',
        cashSession: activeSession._id,
        recordedBy: cashierUser._id,
      });

      await PaymentAllocation.create({
        payment: payment2._id,
        sale: sale2._id,
        allocatedAmountCents: 2400,
        allocationMethod: 'AUTOMATIC_CHECKOUT',
      });

      // Update cash drawer
      activeSession.cashSalesCents += 2400;
      activeSession.calculateExpectedCash();
      await activeSession.save();

      // Deduct stock for sale 2
      milkProduct.currentStock -= 12;
      await milkProduct.save();

      // Record operating expense ($15.00 for office supplies paid in cash)
      await Expense.create({
        category: 'OFFICE_SUPPLIES',
        amountCents: 1500,
        date: new Date(),
        paymentMethod: 'CASH',
        description: 'Packaging bags and register paper rolls',
        cashSession: activeSession._id,
        recordedBy: cashierUser._id,
      });

      activeSession.cashExpensesCents += 1500;
      activeSession.calculateExpectedCash();
      await activeSession.save();
    }

    console.log('\n======================================================');
    console.log('  SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('  Default Accounts:');
    console.log('  - Admin:         admin / Password123!   (Role: ADMIN)');
    console.log('  - Cashier:       cashier / Password123! (Role: CASHIER)');
    console.log('  - Stock Manager: stock / Password123!   (Role: STOCK_MANAGER)');
    console.log('======================================================\n');

    const { disconnectDB } = require('../config/db');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedData();
