const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import files
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/payment');

// Create Express app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', require('./routes/orders'));
app.use('/api/profile', require('./routes/profileRoutes')); 


// Test route
app.get('/', (req, res) => {
  res.json({ message: '🕊️💃 Be Infinity API is running! 🕊️💃' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
   console.log(`🚀 Server running on port ${PORT}`);
});