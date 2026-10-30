// Vercel Serverless Entry Point for DUKAAN Backend
require('dotenv').config();
const { connectDB } = require('../backend/src/config/db');
const app = require('../backend/src/app');

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
};
