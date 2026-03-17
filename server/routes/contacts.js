// server/routes/contacts.js
const express = require('express');
const router = express.Router();
const { validate, addContactSchema } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const {
  addContact,
  getContacts,
  updateContact,
  deleteContact,
  blockContact,
  getFavorites,
} = require('../controllers/contactController');

/**
 * @route POST /api/contacts
 * @description Add a new contact
 * @auth required
 * @body { contactIdentifier, customName }
 */
router.post('/', authMiddleware, validate(addContactSchema), addContact);

/**
 * @route GET /api/contacts
 * @description Get all contacts
 * @auth required
 * @query { search, status }
 */
router.get('/', authMiddleware, getContacts);

/**
 * @route GET /api/contacts/favorites
 * @description Get favorite contacts
 * @auth required
 */
router.get('/favorites', authMiddleware, getFavorites);

/**
 * @route PUT /api/contacts/:contactId
 * @description Update contact
 * @auth required
 * @params { contactId }
 * @body { customName, isFavorite, status }
 */
router.put('/:contactId', authMiddleware, (req, res, next) => {
  const Joi = require('joi');
  const schema = Joi.object({
    customName: Joi.string().max(100).optional(),
    isFavorite: Joi.boolean().optional(),
    status: Joi.string().valid('active', 'blocked', 'muted').optional(),
  });
  validate(schema)(req, res, next);
}, updateContact);

/**
 * @route DELETE /api/contacts/:contactId
 * @description Delete a contact
 * @auth required
 * @params { contactId }
 */
router.delete('/:contactId', authMiddleware, deleteContact);

/**
 * @route POST /api/contacts/:contactId/block
 * @description Block a contact
 * @auth required
 * @params { contactId }
 */
router.post('/:contactId/block', authMiddleware, blockContact);

module.exports = router;
