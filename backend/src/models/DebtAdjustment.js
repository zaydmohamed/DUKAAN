const mongoose = require('mongoose');

const debtAdjustmentSchema = new mongoose.Schema(
  {
    adjustmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    partyType: {
      type: String,
      enum: ['CUSTOMER', 'SUPPLIER'],
      required: true,
    },
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'partyModel',
    },
    partyModel: {
      type: String,
      required: true,
      enum: ['Customer', 'Supplier'],
    },
    adjustmentType: {
      type: String,
      enum: ['BAD_DEBT_WRITE_OFF', 'DISPUTE_SETTLEMENT', 'OPENING_BALANCE_CORRECTION', 'OTHER'],
      required: true,
    },
    amountCents: {
      type: Number,
      required: true, // Signed amount or magnitude reducing debt
    },
    previousBalanceCents: {
      type: Number,
      required: true,
    },
    newBalanceCents: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DebtAdjustment', debtAdjustmentSchema);

