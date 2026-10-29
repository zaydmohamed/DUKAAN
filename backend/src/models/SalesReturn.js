const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      default: 'PIECE',
    },
    conversionMultiplier: {
      type: Number,
      default: 1,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.001, 'Quantity must be positive'],
    },
    baseQuantity: {
      type: Number,
      required: true,
    },
    unitRefundCents: {
      type: Number,
      required: true,
    },
    lineRefundCents: {
      type: Number,
      required: true,
    },
    isRestockable: {
      type: Boolean,
      default: true, // If true, increases saleable stock; if false, recorded as damaged inventory
    },
  },
  { _id: false }
);

const salesReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    items: [returnItemSchema],
    totalRefundCents: {
      type: Number,
      required: true,
      min: [0, 'Refund must not be negative'],
    },
    refundMethod: {
      type: String,
      enum: ['CASH', 'CREDIT_NOTE', 'REDUCE_DEBT'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SalesReturn', salesReturnSchema);

