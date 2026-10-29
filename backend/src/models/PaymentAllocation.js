const mongoose = require('mongoose');

const paymentAllocationSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      default: null,
      index: true,
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      default: null,
      index: true,
    },
    allocatedAmountCents: {
      type: Number,
      required: true,
      min: [1, 'Allocated amount must be positive'],
    },
    allocationDate: {
      type: Date,
      default: Date.now,
    },
    allocationMethod: {
      type: String,
      enum: ['SPECIFIC_INVOICE', 'FIFO_OLDEST_FIRST', 'AUTOMATIC_CHECKOUT'],
      default: 'SPECIFIC_INVOICE',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PaymentAllocation', paymentAllocationSchema);

