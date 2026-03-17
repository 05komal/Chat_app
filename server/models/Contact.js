// server/models/Contact.js
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    // User who owns this contact
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // The contact being added
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Contact Details
    customName: {
      type: String,
      default: null, // User can set custom name for contact
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    
    // Contact Status
    status: {
      type: String,
      enum: ['active', 'blocked', 'muted'],
      default: 'active',
    },
    
    // Last Interaction
    lastMessageTime: {
      type: Date,
      default: null,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    
    // Metadata
    addedAt: {
      type: Date,
      default: Date.now,
    },
    
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure unique contact per user
contactSchema.index({ user: 1, contact: 1 }, { unique: true });

// Prevent self-contacts
contactSchema.pre('save', async function (next) {
  if (this.user.equals(this.contact)) {
    throw new Error('Cannot add yourself as a contact');
  }
  next();
});

module.exports = mongoose.model('Contact', contactSchema);
