const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    openingBalanceCents: {
      type: Number,
      default: 0,
    },
    totalCreditSalesCents: {
      type: Number,
      default: 0,
    },
    totalPaymentsCents: {
      type: Number,
      default: 0,
    },
    outstandingBalanceCents: {
      type: Number,
      default: 0, // Opening + Credit Sales - Payments - Credit Notes
    },
    creditLimitCents: {
      type: Number,
      default: 0, // 0 = unlimited or configured
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ name: 'text', phone: 'text' });

module.exports = mongoose.model('Customer', customerSchema);

