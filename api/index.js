const { connectDB } = require('../backend/src/config/db');
const app = require('../backend/src/app');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Vercel handler DB connection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
};
