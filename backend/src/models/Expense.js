const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      trim: true,
      enum: [
        'RENT',
        'ELECTRICITY',
        'SALARIES',
        'TRANSPORT',
        'INTERNET',
        'REPAIRS',
        'MARKETING',
        'OFFICE_SUPPLIES',
        'TAXES',
        'OTHER_OPERATING_EXPENSE',
      ],
      default: 'OTHER_OPERATING_EXPENSE',
      index: true,
    },
    amountCents: {
      type: Number,
      required: true,
      min: [1, 'Expense amount must be positive'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'EVC_PLUS', 'OTHER_MOBILE', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'],
      required: true,
      index: true,
    },
    accountType: {
      type: String,
      enum: ['CASH_DRAWER', 'MOBILE_WALLET', 'BANK_ACCOUNT'],
      required: true,
      default: 'CASH_DRAWER',
    },
    cashSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashSession',
      default: null,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Expense', expenseSchema);

