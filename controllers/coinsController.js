// controllers/coinsController.js
const User = require('../models/User');
const Order = require('../models/Order');
const { calculateCoins } = require('./paymentController');

// Get user's coin balance
const getUserCoins = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('coins');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      coins: user.coins || 0,
      message: 'Coins retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching user coins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coins',
      error: error.message
    });
  }
};

// Get coin earning history
const getCoinHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Get orders that earned coins (paid orders)
    const orders = await Order.find({
      userId,
      paymentStatus: 'paid'
    })
    .sort({ paymentDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('orderNumber total paymentDate createdAt');

    const total = await Order.countDocuments({
      userId,
      paymentStatus: 'paid'
    });

    // Calculate coins earned for each order
    const coinHistory = orders.map(order => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.total,
      coinsEarned: calculateCoins(order.total),
      earnedDate: order.paymentDate || order.createdAt,
      type: 'earned'
    }));

    res.json({
      success: true,
      coinHistory,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching coin history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coin history',
      error: error.message
    });
  }
};

// Admin function to add coins to user (bonus coins)
const addBonusCoins = async (req, res) => {
  try {
    const { userId, coins, reason } = req.body;

    if (!userId || !coins || coins <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId and positive coins amount required'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { coins: coins } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`Added ${coins} bonus coins to user ${userId}. Reason: ${reason || 'Admin action'}. User now has ${user.coins} total coins.`);

    res.json({
      success: true,
      message: 'Bonus coins added successfully',
      data: {
        userId: user._id,
        coinsAdded: coins,
        totalCoins: user.coins,
        reason: reason || 'Admin bonus'
      }
    });

  } catch (error) {
    console.error('Error adding bonus coins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add bonus coins',
      error: error.message
    });
  }
};

// Admin function to deduct coins from user
const deductCoins = async (req, res) => {
  try {
    const { userId, coins, reason } = req.body;

    if (!userId || !coins || coins <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId and positive coins amount required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.coins < coins) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins balance'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { coins: -coins } },
      { new: true }
    );

    console.log(`Deducted ${coins} coins from user ${userId}. Reason: ${reason || 'Admin action'}. User now has ${updatedUser.coins} total coins.`);

    res.json({
      success: true,
      message: 'Coins deducted successfully',
      data: {
        userId: updatedUser._id,
        coinsDeducted: coins,
        totalCoins: updatedUser.coins,
        reason: reason || 'Admin deduction'
      }
    });

  } catch (error) {
    console.error('Error deducting coins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deduct coins',
      error: error.message
    });
  }
};

// Function to use coins for discount (for future implementation)
const useCoins = async (req, res) => {
  try {
    const userId = req.user.id;
    const { coinsToUse } = req.body;

    if (!coinsToUse || coinsToUse <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid coins amount required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.coins < coinsToUse) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins balance'
      });
    }

    // Calculate discount (1 coin = 1 rupee discount)
    const discountAmount = coinsToUse;

    res.json({
      success: true,
      message: 'Coins can be used',
      data: {
        coinsToUse,
        discountAmount,
        remainingCoins: user.coins - coinsToUse
      }
    });

  } catch (error) {
    console.error('Error using coins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process coins usage',
      error: error.message
    });
  }
};

// Get coin system info/rules
const getCoinSystemInfo = async (req, res) => {
  try {
    const coinsInfo = {
      earningRule: "Earn 2 coins for every ₹100 spent",
      conversionRate: "1 coin = ₹1 discount",
      minimumOrder: "₹100 minimum order to earn coins",
      usage: "Use coins as discount on future orders",
      validity: "Coins have no expiry date"
    };

    res.json({
      success: true,
      coinsInfo
    });

  } catch (error) {
    console.error('Error fetching coin system info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coin system information',
      error: error.message
    });
  }
};

module.exports = {
  getUserCoins,
  getCoinHistory,
  addBonusCoins,
  deductCoins,
  useCoins,
  getCoinSystemInfo
};