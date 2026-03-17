// server/routes/users.js
const express = require('express');
const router = express.Router();
const { validate, updateProfileSchema } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const {
  updateProfile,
  getUserProfile,
  searchUsers,
  getOnlineUsers,
  blockUser,
  unblockUser,
  getBlockedUsers,
  updateStatus,
  deactivateAccount,
} = require('../controllers/userController');

/**
 * @route PUT /api/users/profile
 * @description Update current user profile
 * @auth required
 * @body { username, firstName, lastName, email, bio, isPublic }
 */
router.put('/profile', authMiddleware, validate(updateProfileSchema), updateProfile);

/**
 * @route GET /api/users/search
 * @description Search users
 * @auth required
 * @query { query }
 */
router.get('/search', authMiddleware, searchUsers);

/**
 * @route GET /api/users/online
 * @description Get online users (contacts)
 * @auth required
 */
router.get('/online', authMiddleware, getOnlineUsers);

/**
 * @route GET /api/users/:identifier
 * @description Get user profile by ID or username
 * @auth required
 * @params { identifier }
 */
router.get('/:identifier', authMiddleware, getUserProfile);

/**
 * @route POST /api/users/:userId/block
 * @description Block a user
 * @auth required
 * @params { userId }
 */
router.post('/:userId/block', authMiddleware, blockUser);

/**
 * @route POST /api/users/:userId/unblock
 * @description Unblock a user
 * @auth required
 * @params { userId }
 */
router.post('/:userId/unblock', authMiddleware, unblockUser);

/**
 * @route GET /api/users/blocked/list
 * @description Get list of blocked users
 * @auth required
 */
router.get('/blocked/list', authMiddleware, getBlockedUsers);

/**
 * @route POST /api/users/status
 * @description Update user status (online/offline/away)
 * @auth required
 * @body { status }
 */
router.post('/status', authMiddleware, (req, res, next) => {
  const Joi = require('joi');
  const schema = Joi.object({
    status: Joi.string().valid('online', 'offline', 'away').required(),
  });
  validate(schema)(req, res, next);
}, updateStatus);

/**
 * @route POST /api/users/deactivate
 * @description Deactivate user account
 * @auth required
 * @body { password }
 */
router.post('/deactivate', authMiddleware, (req, res, next) => {
  const Joi = require('joi');
  const schema = Joi.object({
    password: Joi.string().required(),
  });
  validate(schema)(req, res, next);
}, deactivateAccount);

module.exports = router;
