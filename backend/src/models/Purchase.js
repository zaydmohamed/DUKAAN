const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
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
      required: true,
    },
    unitCostCents: {
      type: Number,
      required: true,
    },
    additionalCostPerUnitCents: {
      type: Number,
      default: 0,
    },
    effectiveUnitCostCents: {
      type: Number,
      required: true, // (unitCostCents + additionalCostPerUnitCents) / baseQuantity
    },
    lineTotalCents: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    items: [purchaseItemSchema],
    goodsCostCents: {
      type: Number,
      required: true,
      default: 0,
    },
    freightAndAdditionalCostCents: {
      type: Number,
      default: 0,
    },
    totalPurchaseCostCents: {
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
    receivedStatus: {
      type: String,
      enum: ['PENDING', 'RECEIVED'],
      default: 'RECEIVED', // Stock increments only upon RECEIVED
      index: true,
    },
    receivedAt: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'],
      default: 'UNPAID',
      index: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

module.exports = mongoose.model('Purchase', purchaseSchema);

