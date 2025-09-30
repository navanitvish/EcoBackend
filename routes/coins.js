// routes/coins.js
const express = require('express');
const router = express.Router();
const {
  getUserCoins,
  getCoinHistory,
  addBonusCoins,
  deductCoins,
  useCoins,
  getCoinSystemInfo
} = require('../controllers/coinsController');

// Middleware imports (adjust paths according to your project structure)
const authMiddleware = require('../middleware/auth'); // User authentication
const adminMiddleware = require('../middleware/admin'); // Admin authentication (create if doesn't exist)

// User routes (require authentication)
router.get('/balance', authMiddleware, getUserCoins);
router.get('/history', authMiddleware, getCoinHistory);
router.post('/use', authMiddleware, useCoins);
router.get('/info', getCoinSystemInfo); // Public route for coin system information

// Admin routes (require admin authentication)
router.post('/add-bonus', authMiddleware, adminMiddleware, addBonusCoins);
router.post('/deduct', authMiddleware, adminMiddleware, deductCoins);

module.exports = router;