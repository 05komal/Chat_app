// server/controllers/messageController.js
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const User = require('../models/User');

/**
 * Send a new message
 */
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.userId;
    
    // Check if recipient exists and is active
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found or inactive',
      });
    }
    
    // Check if recipient is not blocked by sender or sender is not blocked by recipient
    const senderContact = await Contact.findOne({
      user: senderId,
      contact: recipientId,
      status: 'blocked',
    });
    
    const recipientContact = await Contact.findOne({
      user: recipientId,
      contact: senderId,
      status: 'blocked',
    });
    
    if (senderContact || recipientContact) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send message to this user',
      });
    }
    
    // Create message
    const message = new Message({
      content,
      sender: senderId,
      recipient: recipientId,
      status: 'sent',
      deliveredAt: new Date(),
    });
    
    await message.save();
    await message.populate('sender', 'username firstName lastName profilePicture');
    
    // Update or create contact entry for both users
    let senderContactEntry = await Contact.findOne({
      user: senderId,
      contact: recipientId,
    });
    
    if (!senderContactEntry) {
      senderContactEntry = new Contact({
        user: senderId,
        contact: recipientId,
      });
    }
    
    senderContactEntry.lastMessageTime = new Date();
    await senderContactEntry.save();
    
    // Update recipient's contact with unread count
    let recipientContactEntry = await Contact.findOne({
      user: recipientId,
      contact: senderId,
    });
    
    if (!recipientContactEntry) {
      recipientContactEntry = new Contact({
        user: recipientId,
        contact: senderId,
      });
    }
    
    recipientContactEntry.lastMessageTime = new Date();
    recipientContactEntry.unreadCount += 1;
    await recipientContactEntry.save();
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message,
    });
  }
};

/**
 * Get conversation between two users
 */
const getConversation = async (req, res) => {
  try {
    const { userId: contactId } = req.params;
    const currentUserId = req.userId;
    const { limit = 50, skip = 0 } = req.query;
    
    // Verify contact exists
    const contact = await User.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Get messages between users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: contactId },
        { sender: contactId, recipient: currentUserId },
      ],
    })
      .populate('sender', 'username firstName lastName profilePicture')
      .populate('recipient', 'username firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    // Get total count
    const totalCount = await Message.countDocuments({
      $or: [
        { sender: currentUserId, recipient: contactId },
        { sender: contactId, recipient: currentUserId },
      ],
    });
    
    // Mark unread messages as read
    await Message.updateMany(
      {
        sender: contactId,
        recipient: currentUserId,
        status: { $in: ['sent', 'delivered'] },
      },
      {
        status: 'read',
        readAt: new Date(),
      }
    );
    
    // Update contact unread count
    const contactEntry = await Contact.findOne({
      user: currentUserId,
      contact: contactId,
    });
    
    if (contactEntry) {
      contactEntry.unreadCount = 0;
      await contactEntry.save();
    }
    
    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        messages: messages.reverse(), // Show oldest first
        contactInfo: contact.getPublicProfile(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation',
      error: error.message,
    });
  }
};

/**
 * Mark message as read
 */
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;
    
    const message = await Message.findOne({
      _id: messageId,
      recipient: userId,
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }
    
    message.status = 'read';
    message.readAt = new Date();
    await message.save();
    
    res.status(200).json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking message as read',
      error: error.message,
    });
  }
};

/**
 * Edit a message
 */
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.userId;
    
    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you cannot edit this message',
      });
    }
    
    // Check if message is older than 15 minutes (cannot edit very old messages)
    const messageAge = Date.now() - message.createdAt.getTime();
    if (messageAge > 15 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit messages older than 15 minutes',
      });
    }
    
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    
    await message.populate('sender', 'username firstName lastName profilePicture');
    
    res.status(200).json({
      success: true,
      message: 'Message edited successfully',
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error editing message',
      error: error.message,
    });
  }
};

/**
 * Delete a message
 */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;
    
    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you cannot delete this message',
      });
    }
    
    await Message.findByIdAndDelete(messageId);
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message,
    });
  }
};

/**
 * Get all conversations (chat list)
 */
const getConversationList = async (req, res) => {
  try {
    const userId = req.userId;
    const { search } = req.query;
    
    let contacts = await Contact.find({
      user: userId,
      status: 'active',
    })
      .populate('contact', 'username firstName lastName profilePicture status lastSeen')
      .sort({ lastMessageTime: -1, addedAt: -1 });
    
    // Get last message for each contact
    const conversationList = await Promise.all(
      contacts.map(async (contact) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: userId, recipient: contact.contact._id },
            { sender: contact.contact._id, recipient: userId },
          ],
        })
          .sort({ createdAt: -1 })
          .select('content status createdAt sender');
        
        return {
          contactId: contact._id,
          contact: contact.contact,
          customName: contact.customName,
          isFavorite: contact.isFavorite,
          lastMessage,
          unreadCount: contact.unreadCount,
          lastMessageTime: contact.lastMessageTime,
        };
      })
    );
    
    // Apply search filter
    let filtered = conversationList;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = conversationList.filter(conv => {
        const contactUser = conv.contact;
        return (
          (conv.customName && conv.customName.toLowerCase().includes(searchLower)) ||
          (contactUser.username && contactUser.username.toLowerCase().includes(searchLower)) ||
          (contactUser.firstName && contactUser.firstName.toLowerCase().includes(searchLower)) ||
          (contactUser.lastName && contactUser.lastName.toLowerCase().includes(searchLower))
        );
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        total: filtered.length,
        conversations: filtered,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message,
    });
  }
};

/**
 * Search messages
 */
const searchMessages = async (req, res) => {
  try {
    const { query, contactId } = req.query;
    const userId = req.userId;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }
    
    let searchQuery = {
      $or: [
        { sender: userId },
        { recipient: userId },
      ],
      content: { $regex: query, $options: 'i' },
    };
    
    if (contactId) {
      searchQuery.$or = [
        { sender: userId, recipient: contactId },
        { sender: contactId, recipient: userId },
      ];
    }
    
    const messages = await Message.find(searchQuery)
      .populate('sender', 'username firstName lastName')
      .populate('recipient', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.status(200).json({
      success: true,
      data: {
        total: messages.length,
        messages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching messages',
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  markAsRead,
  editMessage,
  deleteMessage,
  getConversationList,
  searchMessages,
};
