const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      default: 'DUKAAN Enterprise',
    },
    tagline: {
      type: String,
      default: 'Professional Shop Management & POS System',
    },
    phone: {
      type: String,
      default: '+1 234 567 8900',
    },
    email: {
      type: String,
      default: 'info@dukaan.com',
    },
    address: {
      type: String,
      default: '123 Commercial Market, Suite 100',
    },
    currency: {
      type: String,
      default: 'USD',
    },
    currencySymbol: {
      type: String,
      default: '$',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    allowNegativeStock: {
      type: Boolean,
      default: false,
    },
    costingMethod: {
      type: String,
      enum: ['WEIGHTED_AVERAGE', 'FIFO'],
      default: 'WEIGHTED_AVERAGE',
    },
    receiptFooterMessage: {
      type: String,
      default: 'Thank you for your business! Please come again.',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);

