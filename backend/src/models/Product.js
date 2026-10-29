const mongoose = require('mongoose');

const unitConversionSchema = new mongoose.Schema(
  {
    unitName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true, // e.g. 'CARTON', 'BOX', 'DOZEN', 'PACK'
    },
    multiplier: {
      type: Number,
      required: true,
      min: [0.0001, 'Multiplier must be greater than zero'], // e.g., 20 means 1 CARTON = 20 BASE UNITS
    },
    sellingPriceCents: {
      type: Number, // Optional custom price for this unit, or defaults to base price * multiplier
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    baseUnit: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: 'PIECE', // e.g. PIECE, KG, GRAM, LITER, METER
    },
    unitConversions: [unitConversionSchema],
    costPriceCents: {
      type: Number,
      required: true,
      min: 0,
      default: 0, // In integer cents (Weighted Average Cost)
    },
    sellingPriceCents: {
      type: Number,
      required: true,
      min: 0, // In integer cents
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0, // Always stored in base unit
    },
    minStockLevel: {
      type: Number,
      default: 10,
    },
    allowNegativeStock: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 'text', sku: 'text', barcode: 'text' });

module.exports = mongoose.model('Product', productSchema);

