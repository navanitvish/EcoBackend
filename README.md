# Kiri Beauty Backend

Simple backend for Kiri Beauty authentication system.

## 📁 Folder Structure
```
backend/
├── config/
│   └── database.js          # Database connection
├── controllers/
│   └── authController.js    # Authentication logic
├── models/
│   └── User.js             # User database model
├── routes/
│   └── authRoutes.js       # API routes
├── helpers/
│   ├── emailHelper.js      # Email functions
│   └── otpHelper.js        # OTP functions
├── .env                    # Environment variables
├── package.json           # Dependencies
├── server.js             # Main server file
└── README.md            # This file
```

## 🚀 How to Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Create `.env` file and add:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kiri_beauty
JWT_SECRET=your_secret_key_123456789
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 3. Setup Gmail for Emails
1. Go to Google Account settings
2. Enable 2-factor authentication
3. Generate App Password
4. Use App Password in `.env` file

### 4. Install MongoDB
- Download MongoDB from official website
- Or use MongoDB Atlas (cloud database)

### 5. Start Server
```bash
npm run dev
```

## 📡 API Endpoints

### Register
```
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@email.com",
  "password": "password123"
}
```

### Login
```
POST /api/auth/login
{
  "email": "john@email.com",
  "password": "password123"
}
```

### Send OTP
```
POST /api/auth/send-otp
{
  "email": "john@email.com"
}
```

### Verify OTP
```
POST /api/auth/verify-otp
{
  "email": "john@email.com",
  "otp": "123456"
}
```

### Google Auth
```
POST /api/auth/google
{
  "name": "John Doe",
  "email": "john@gmail.com",
  "googleId": "google_user_id"
}
```

## 🔧 Frontend Integration

Update your frontend API calls to:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';

// Register
const response = await fetch(`${API_BASE_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

// Send OTP
const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: formData.email })
});
```

## 🎯 Features
- ✅ User Registration
- ✅ User Login  
- ✅ OTP Email Verification
- ✅ Google OAuth Support
- ✅ JWT Token Authentication
- ✅ Password Hashing
- ✅ Input Validation

## 🐛 Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check MongoDB URI in `.env`

### Email Not Sending
- Check Gmail credentials
- Make sure App Password is used
- Enable 2-factor authentication

### Port Already in Use
- Change PORT in `.env` file
- Or kill process using port 5000