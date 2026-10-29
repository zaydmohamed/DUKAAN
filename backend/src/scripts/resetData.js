require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');

const User = require('../models/User');
const Settings = require('../models/Settings');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const PaymentAllocation = require('../models/PaymentAllocation');
const Expense = require('../models/Expense');
const InventoryMovement = require('../models/InventoryMovement');
const CashSession = require('../models/CashSession');
const SalesReturn = require('../models/SalesReturn');
const CreditNote = require('../models/CreditNote');
const DebtAdjustment = require('../models/DebtAdjustment');
const AuditLog = require('../models/AuditLog');

const resetAllData = async () => {
  try {
    console.log('[Reset] Connecting to database...');
    await connectDB();

    console.log('[Reset] Wiping all data collections...');
    await Promise.all([
      Sale.deleteMany({}),
      Purchase.deleteMany({}),
      Payment.deleteMany({}),
      PaymentAllocation.deleteMany({}),
      Customer.deleteMany({}),
      Supplier.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      InventoryMovement.deleteMany({}),
      CashSession.deleteMany({}),
      Expense.deleteMany({}),
      SalesReturn.deleteMany({}),
      CreditNote.deleteMany({}),
      DebtAdjustment.deleteMany({}),
      AuditLog.deleteMany({}),
      User.deleteMany({}),
      Settings.deleteMany({}),
    ]);

    console.log('[Reset] Re-creating default Admin user and Shop Settings...');

    // Default Admin User
    await User.create({
      name: 'System Admin',
      username: 'admin',
      email: 'admin@dukaan.com',
      password: 'Password123!',
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    // Default System Settings
    await Settings.create({
      shopName: 'DUKAAN Enterprise',
      tagline: 'Modern Retail & Wholesale Shop Management',
      phone: '+1 800 555 DUKAN',
      email: 'contact@dukaan.com',
      address: 'Central Market',
      currency: 'USD',
      currencySymbol: '$',
      timezone: 'UTC',
      allowNegativeStock: false,
      costingMethod: 'WEIGHTED_AVERAGE',
      receiptFooterMessage: 'Thank you for your business!',
    });

    console.log('\n======================================================');
    console.log('  ALL SYSTEM DATA HAS BEEN CLEARED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('  The system is now completely empty and clean.');
    console.log('  Admin Login: admin / Password123!');
    console.log('======================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Reset Error]', error);
    process.exit(1);
  }
};

resetAllData();

