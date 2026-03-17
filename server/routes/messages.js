// server/routes/messages.js
const express = require('express');
const router = express.Router();
const { validate, sendMessageSchema } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const {
  sendMessage,
  getConversation,
  markAsRead,
  editMessage,
  deleteMessage,
  getConversationList,
  searchMessages,
} = require('../controllers/messageController');

/**
 * @route POST /api/messages
 * @description Send a new message
 * @auth required
 * @body { recipientId, content }
 */
router.post('/', authMiddleware, validate(sendMessageSchema), sendMessage);

/**
 * @route GET /api/messages/conversations
 * @description Get all conversations (chat list)
 * @auth required
 * @query { search }
 */
router.get('/conversations', authMiddleware, getConversationList);

/**
 * @route GET /api/messages/search
 * @description Search messages
 * @auth required
 * @query { query, contactId }
 */
router.get('/search', authMiddleware, searchMessages);

/**
 * @route GET /api/messages/:userId
 * @description Get conversation with a user
 * @auth required
 * @params { userId }
 * @query { limit, skip }
 */
router.get('/:userId', authMiddleware, getConversation);

/**
 * @route PUT /api/messages/:messageId
 * @description Edit a message
 * @auth required
 * @params { messageId }
 * @body { content }
 */
router.put('/:messageId', authMiddleware, (req, res, next) => {
  const Joi = require('joi');
  const schema = Joi.object({
    content: Joi.string().min(1).max(5000).required(),
  });
  validate(schema)(req, res, next);
}, editMessage);

/**
 * @route DELETE /api/messages/:messageId
 * @description Delete a message
 * @auth required
 * @params { messageId }
 */
router.delete('/:messageId', authMiddleware, deleteMessage);

/**
 * @route POST /api/messages/:messageId/read
 * @description Mark message as read
 * @auth required
 * @params { messageId }
 */
router.post('/:messageId/read', authMiddleware, markAsRead);

module.exports = router;
