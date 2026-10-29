const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
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
    sku: {
      type: String,
    },
    unit: {
      type: String,
      required: true,
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
      required: true, // quantity * conversionMultiplier
    },
    unitPriceCents: {
      type: Number,
      required: true,
    },
    discountCents: {
      type: Number,
      default: 0,
    },
    lineTotalCents: {
      type: Number,
      required: true,
    },
    unitCostCents: {
      type: Number,
      required: true,
      default: 0,
    },
    lineCostCents: {
      type: Number,
      required: true,
      default: 0, // baseQuantity * unitCostCents
    },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    saleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
    },
    saleDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    items: [saleItemSchema],
    subtotalCents: {
      type: Number,
      required: true,
      default: 0,
    },
    discountTotalCents: {
      type: Number,
      default: 0,
    },
    taxTotalCents: {
      type: Number,
      default: 0,
    },
    totalAmountCents: {
      type: Number,
      required: true,
      default: 0,
    },
    amountPaidCents: {
      type: Number,
      default: 0,
    },
    outstandingBalanceCents: {
      type: Number,
      required: true,
      default: 0,
    },
    costOfGoodsSoldCents: {
      type: Number,
      required: true,
      default: 0,
    },
    grossProfitCents: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'],
      default: 'UNPAID',
      index: true,
    },
    transactionStatus: {
      type: String,
      enum: ['COMPLETED', 'VOIDED', 'RETURNED', 'PARTIALLY_RETURNED'],
      default: 'COMPLETED',
      index: true,
    },
    dueDate: {
      type: Date,
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cashSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashSession',
      default: null,
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

module.exports = mongoose.model('Sale', saleSchema);

