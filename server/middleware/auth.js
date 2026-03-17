// server/middleware/auth.js
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }
    
    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    // Update last seen
    user.lastSeen = new Date();
    user.status = 'online';
    await user.save();
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error',
      error: error.message 
    });
  }
};

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    
    if (token) {
      if (token.startsWith('Bearer ')) {
        token = token.slice(7);
      }
      
      const decoded = verifyToken(token);
      
      if (decoded) {
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
};
