const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/profile - Get user profile
router.get('/', authenticateToken, getProfile);

// PUT /api/profile - Update user profile  
router.put('/', authenticateToken, updateProfile);

module.exports = router;