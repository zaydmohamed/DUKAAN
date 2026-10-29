const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    partyType: {
      type: String,
      enum: ['CUSTOMER', 'SUPPLIER'],
      required: true,
      index: true,
    },
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'partyModel',
      index: true,
    },
    partyModel: {
      type: String,
      required: true,
      enum: ['Customer', 'Supplier', 'Sale'],
    },
    partyName: {
      type: String,
      required: true,
    },
    amountCents: {
      type: Number,
      required: true,
      min: [1, 'Payment amount must be greater than zero'],
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
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      index: true, // For mobile money TxID or bank ref
    },
    cashSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashSession',
      default: null,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    unallocatedAmountCents: {
      type: Number,
      default: 0, // Unallocated balance (advance payment/liability)
    },
    status: {
      type: String,
      enum: ['VALID', 'REVERSED'],
      default: 'VALID',
      index: true,
    },
    reversalReason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
