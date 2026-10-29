const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    movementType: {
      type: String,
      enum: [
        'OPENING',
        'PURCHASE',
        'SALE',
        'CUSTOMER_RETURN',
        'DAMAGE',
        'LOSS',
        'ADJUSTMENT',
      ],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true, // Signed number: positive for additions, negative for deductions
    },
    unit: {
      type: String,
      default: 'PIECE',
    },
    unitCostCents: {
      type: Number,
      default: 0,
    },
    totalCostCents: {
      type: Number,
      default: 0,
    },
    stockBefore: {
      type: Number,
      required: true,
    },
    stockAfter: {
      type: Number,
      required: true,
    },
    referenceType: {
      type: String,
      enum: ['Sale', 'Purchase', 'SalesReturn', 'ManualAdjustment', 'InitialStock'],
      default: 'ManualAdjustment',
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

inventoryMovementSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);

