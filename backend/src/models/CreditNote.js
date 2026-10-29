const mongoose = require('mongoose');

const creditNoteSchema = new mongoose.Schema(
  {
    creditNoteNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    amountCents: {
      type: Number,
      required: true,
      min: [1, 'Amount must be positive'],
    },
    remainingBalanceCents: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    referenceType: {
      type: String,
      enum: ['SalesReturn', 'OverchargeCorrection', 'Goodwill', 'Manual'],
      default: 'Manual',
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FULLY_UTILIZED', 'VOIDED'],
      default: 'ACTIVE',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CreditNote', creditNoteSchema);

