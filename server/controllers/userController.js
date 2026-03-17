// server/controllers/userController.js
const User = require('../models/User');
const Contact = require('../models/Contact');

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { username, firstName, lastName, email, bio, isPublic } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Check if username is already taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken',
        });
      }
    }
    
    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken',
        });
      }
    }
    
    // Update fields
    if (username) user.username = username;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (isPublic !== undefined) user.isPublic = isPublic;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
};

/**
 * Get user profile by ID or username
 */
const getUserProfile = async (req, res) => {
  try {
    const { identifier } = req.params;
    const currentUserId = req.userId;
    
    let user;
    
    // Check if identifier is MongoDB ID or username
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(identifier);
    } else {
      user = await User.findOne({ username: identifier });
    }
    
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Check if current user has blocked this user or vice versa
    const isBlocked = await Contact.findOne({
      $or: [
        { user: currentUserId, contact: user._id, status: 'blocked' },
        { user: user._id, contact: currentUserId, status: 'blocked' },
      ],
    });
    
    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'You cannot view this profile',
      });
    }
    
    // Check if already a contact
    const contact = await Contact.findOne({
      user: currentUserId,
      contact: user._id,
    });
    
    res.status(200).json({
      success: true,
      data: {
        user: user.getPublicProfile(),
        isContact: !!contact,
        isFavorite: contact ? contact.isFavorite : false,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message,
    });
  }
};

/**
 * Search users
 */
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.userId;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }
    
    const users = await User.find({
      _id: { $ne: currentUserId },
      isActive: true,
      isPublic: true,
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ],
    })
      .select('username firstName lastName profilePicture phone bio status')
      .limit(20);
    
    // Get contact status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const contact = await Contact.findOne({
          user: currentUserId,
          contact: user._id,
        });
        
        return {
          ...user.toObject(),
          isContact: !!contact,
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: {
        total: usersWithStatus.length,
        users: usersWithStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message,
    });
  }
};

/**
 * Get online friends
 */
const getOnlineUsers = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get all contacts
    const contacts = await Contact.find({
      user: userId,
      status: 'active',
    }).populate('contact', 'username firstName lastName status lastSeen profilePicture');
    
    // Filter online contacts
    const onlineContacts = contacts.filter(c => c.contact.status === 'online');
    
    res.status(200).json({
      success: true,
      data: {
        total: onlineContacts.length,
        users: onlineContacts.map(c => ({
          ...c.contact.toObject(),
          contactId: c._id,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching online users',
      error: error.message,
    });
  }
};

/**
 * Block user
 */
const blockUser = async (req, res) => {
  try {
    const { userId: blockUserId } = req.params;
    const currentUserId = req.userId;
    
    if (blockUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself',
      });
    }
    
    const userToBlock = await User.findById(blockUserId);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Update or create contact with blocked status
    let contact = await Contact.findOne({
      user: currentUserId,
      contact: blockUserId,
    });
    
    if (!contact) {
      contact = new Contact({
        user: currentUserId,
        contact: blockUserId,
        status: 'blocked',
      });
    } else {
      contact.status = 'blocked';
    }
    
    await contact.save();
    
    res.status(200).json({
      success: true,
      message: 'User blocked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error blocking user',
      error: error.message,
    });
  }
};

/**
 * Unblock user
 */
const unblockUser = async (req, res) => {
  try {
    const { userId: unblockUserId } = req.params;
    const currentUserId = req.userId;
    
    const contact = await Contact.findOne({
      user: currentUserId,
      contact: unblockUserId,
      status: 'blocked',
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'User is not blocked',
      });
    }
    
    contact.status = 'active';
    await contact.save();
    
    res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unblocking user',
      error: error.message,
    });
  }
};

/**
 * Get blocked users list
 */
const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.userId;
    
    const blockedUsers = await Contact.find({
      user: userId,
      status: 'blocked',
    }).populate('contact', 'username firstName lastName profilePicture phone');
    
    res.status(200).json({
      success: true,
      data: {
        total: blockedUsers.length,
        users: blockedUsers.map(b => ({
          ...b.contact.toObject(),
          blockedAt: b.updatedAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blocked users',
      error: error.message,
    });
  }
};

/**
 * Change user status (online/offline/away)
 */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.userId;
    
    if (!['online', 'offline', 'away'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }
    
    const user = await User.findById(userId);
    user.status = status;
    if (status === 'offline') {
      user.lastSeen = new Date();
    }
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Status updated',
      data: {
        status: user.status,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message,
    });
  }
};

/**
 * Deactivate account
 */
const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.userId;
    
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }
    
    user.isActive = false;
    user.status = 'offline';
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deactivating account',
      error: error.message,
    });
  }
};

module.exports = {
  updateProfile,
  getUserProfile,
  searchUsers,
  getOnlineUsers,
  blockUser,
  unblockUser,
  getBlockedUsers,
  updateStatus,
  deactivateAccount,
};
