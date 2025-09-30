const User = require('../models/User');

// Get user profile
const getProfile = async (req, res) => {
  try {
    console.log('\n🔵 GET PROFILE REQUEST for user:', req.userId);
    
    const user = await User.findById(req.userId).select('-password -otp -otpExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format join date
    const joinDate = user.createdAt.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    const profileData = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      joinDate: joinDate,
      profileImage: user.profileImage,
      membershipType: user.membershipType,
      coins: user.coins
    };

    console.log('✅ Profile data sent:', profileData);
    res.json(profileData);

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, location, profileImage } = req.body;
    console.log('\n🔵 UPDATE PROFILE REQUEST:', { name, phone, location, profileImage: !!profileImage });

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update only provided fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (profileImage) user.profileImage = profileImage;

    await user.save();
    
    console.log('✅ Profile updated successfully');

    // Return updated profile data
    const joinDate = user.createdAt.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    const updatedProfile = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      joinDate: joinDate,
      profileImage: user.profileImage,
      membershipType: user.membershipType,
      coins: user.coins
    };

    res.json({
      message: 'Profile updated successfully',
      user: updatedProfile
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
