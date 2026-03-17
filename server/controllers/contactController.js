// server/controllers/contactController.js
const Contact = require('../models/Contact');
const User = require('../models/User');

/**
 * Add a new contact
 */
const addContact = async (req, res) => {
  try {
    const { contactIdentifier, customName } = req.body;
    const userId = req.userId;
    
    // Find contact by username or phone
    const contact = await User.findOne({
      $or: [
        { username: contactIdentifier },
        { phone: contactIdentifier },
      ],
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (contact._id.equals(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself as a contact',
      });
    }
    
    // Check if already a contact
    const existingContact = await Contact.findOne({
      user: userId,
      contact: contact._id,
    });
    
    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Already in your contacts',
      });
    }
    
    // Create new contact
    const newContact = new Contact({
      user: userId,
      contact: contact._id,
      customName: customName || contact.firstName || contact.username,
    });
    
    await newContact.save();
    await newContact.populate('contact', 'phone username firstName lastName profilePicture bio status');
    
    res.status(201).json({
      success: true,
      message: 'Contact added successfully',
      data: newContact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding contact',
      error: error.message,
    });
  }
};

/**
 * Get all contacts of the user
 */
const getContacts = async (req, res) => {
  try {
    const userId = req.userId;
    const { search, status = 'active' } = req.query;
    
    let query = { user: userId };
    
    if (status) {
      query.status = status;
    }
    
    let contacts = await Contact.find(query)
      .populate('contact', 'phone username firstName lastName profilePicture bio status lastSeen')
      .sort({ lastMessageTime: -1, addedAt: -1 });
    
    // Apply search filter if provided
    if (search) {
      contacts = contacts.filter(c => {
        const contactUser = c.contact;
        const searchLower = search.toLowerCase();
        return (
          (c.customName && c.customName.toLowerCase().includes(searchLower)) ||
          (contactUser.username && contactUser.username.toLowerCase().includes(searchLower)) ||
          (contactUser.firstName && contactUser.firstName.toLowerCase().includes(searchLower)) ||
          (contactUser.lastName && contactUser.lastName.toLowerCase().includes(searchLower)) ||
          (contactUser.phone && contactUser.phone.includes(search))
        );
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        total: contacts.length,
        contacts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts',
      error: error.message,
    });
  }
};

/**
 * Update contact
 */
const updateContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.userId;
    const { customName, isFavorite, status } = req.body;
    
    const contact = await Contact.findOne({
      _id: contactId,
      user: userId,
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }
    
    if (customName) contact.customName = customName;
    if (isFavorite !== undefined) contact.isFavorite = isFavorite;
    if (status && ['active', 'blocked', 'muted'].includes(status)) {
      contact.status = status;
    }
    
    await contact.save();
    await contact.populate('contact', 'phone username firstName lastName profilePicture bio status');
    
    res.status(200).json({
      success: true,
      message: 'Contact updated successfully',
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating contact',
      error: error.message,
    });
  }
};

/**
 * Delete a contact
 */
const deleteContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.userId;
    
    const result = await Contact.findOneAndDelete({
      _id: contactId,
      user: userId,
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting contact',
      error: error.message,
    });
  }
};

/**
 * Block a contact
 */
const blockContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.userId;
    
    const contact = await Contact.findOne({
      _id: contactId,
      user: userId,
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }
    
    contact.status = 'blocked';
    await contact.save();
    
    res.status(200).json({
      success: true,
      message: 'Contact blocked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error blocking contact',
      error: error.message,
    });
  }
};

/**
 * Get favorite contacts
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.userId;
    
    const favorites = await Contact.find({
      user: userId,
      isFavorite: true,
      status: 'active',
    })
      .populate('contact', 'phone username firstName lastName profilePicture bio status')
      .sort({ lastMessageTime: -1 });
    
    res.status(200).json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
      error: error.message,
    });
  }
};

module.exports = {
  addContact,
  getContacts,
  updateContact,
  deleteContact,
  blockContact,
  getFavorites,
};
