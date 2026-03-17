// server/middleware/validate.js
const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message,
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }
    
    req.body = value;
    next();
  };
};

// Validation schemas
const registerSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?1?\d{9,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required',
    }),
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
});

const verifyOTPSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?1?\d{9,15}$/)
    .required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.length': 'OTP must be 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
    }),
  password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and numbers',
    }),
});

const loginSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?1?\d{9,15}$/)
    .required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  username: Joi.string()
    .pattern(/^[a-zA-Z0-9_]{3,}$/)
    .optional(),
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  bio: Joi.string().max(500).optional(),
  isPublic: Joi.boolean().optional(),
});

const addContactSchema = Joi.object({
  contactIdentifier: Joi.string()
    .required()
    .messages({
      'any.required': 'Contact identifier (username or phone) is required',
    }),
  customName: Joi.string().max(100).optional(),
});

const sendMessageSchema = Joi.object({
  recipientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid recipient ID',
    }),
  content: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message is too long',
    }),
});

module.exports = {
  validate,
  registerSchema,
  verifyOTPSchema,
  loginSchema,
  updateProfileSchema,
  addContactSchema,
  sendMessageSchema,
};
