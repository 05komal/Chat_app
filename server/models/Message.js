// server/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // Message Content
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: 5000,
    },
    
    // Sender & Recipient
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Message Status
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    
    // Media/Attachments (for future use)
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document'],
      },
      url: String,
      fileName: String,
      fileSize: Number,
    }],
    
    // Read Status
    readAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    
    // Message Type
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'system'],
      default: 'text',
    },
    
    // Reaction Support (for future use)
    reactions: [{
      user: mongoose.Schema.Types.ObjectId,
      emoji: String,
    }],
    
    // Reply To
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, status: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
