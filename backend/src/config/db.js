const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/dukaan_shop_db';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false,
    });
    isConnected = true;
    console.log(`[Database] Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`[Database] Connection error: ${err.message}`);
    throw err;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  isConnected = false;
};

module.exports = { connectDB, disconnectDB };
