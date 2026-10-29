const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dukaan_shop_db';

  try {
    // Attempt connecting to the configured URI with a short timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] Connected to external/local MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    // Check if our embedded MongoDB instance is already running on port 27018
    try {
      const fallbackUri = 'mongodb://127.0.0.1:27018/dukaan_shop_db';
      const fallbackConn = await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 1500 });
      console.log(`[Database] Connected to already-running embedded MongoDB at: ${fallbackUri}`);
      return fallbackConn;
    } catch (_fallbackErr) {
      // Proceed to launch a new embedded instance below
    }

    console.warn(`[Database] Direct connection to ${uri} failed: ${err.message}`);
    console.log('[Database] Starting built-in MongoDB engine for zero-configuration operation...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const path = require('path');
      const fs = require('fs');

      const storagePath = path.join(__dirname, '..', '..', 'data', 'db');
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
      }

      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'dukaan_shop_db',
          port: 27018,
          dbPath: storagePath,
          storageEngine: 'wiredTiger',
        },
      });

      const baseUri = mongodInstance.getUri();
      const embeddedUri = baseUri.endsWith('/') ? `${baseUri}dukaan_shop_db` : `${baseUri}/dukaan_shop_db`;
      const conn = await mongoose.connect(embeddedUri);
      console.log(`[Database] Connected to built-in MongoDB server (persistent) at: ${embeddedUri}`);
      return conn;
    } catch (embeddedErr) {
      console.error('[Database] Failed to start built-in MongoDB:', embeddedErr.message);
      throw embeddedErr;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
