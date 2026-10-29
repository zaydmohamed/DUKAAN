const mongoose = require('mongoose');

const cashSessionSchema = new mongoose.Schema(
  {
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    openedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    closedAt: {
      type: Date,
    },
    openingCashCents: {
      type: Number,
      required: true,
      default: 0,
    },
    cashSalesCents: {
      type: Number,
      default: 0,
    },
    cashDebtCollectionsCents: {
      type: Number,
      default: 0,
    },
    cashExpensesCents: {
      type: Number,
      default: 0,
    },
    cashSupplierPaymentsCents: {
      type: Number,
      default: 0,
    },
    expectedClosingCashCents: {
      type: Number,
      default: 0,
    },
    actualCountedCashCents: {
      type: Number,
      default: 0,
    },
    differenceCents: {
      type: Number,
      default: 0, // actualCountedCashCents - expectedClosingCashCents
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    closingNotes: {
      type: String,
      trim: true,
    },
    discrepancyExplanation: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to calculate expected cash dynamically
cashSessionSchema.methods.calculateExpectedCash = function () {
  this.expectedClosingCashCents =
    this.openingCashCents +
    this.cashSalesCents +
    this.cashDebtCollectionsCents -
    this.cashExpensesCents -
    this.cashSupplierPaymentsCents;
  return this.expectedClosingCashCents;
};

module.exports = mongoose.model('CashSession', cashSessionSchema);

