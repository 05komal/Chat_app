// client/src/js/app.js

import api from './api.js';
import wsClient from './websocket.js';
import * as utils from './utils.js';
import { initAuthPages } from './auth.js';
import { initChatInterface } from './messages.js';
import { initContactsManagement } from './contacts.js';

class ChatApp {
  constructor() {
    this.root = document.getElementById('root');
    this.currentUser = null;
    this.currentChat = null;
    this.conversations = [];
    this.contacts = [];
    this.isInitialized = false;
    this.init();
  }

  /**
   * Initialize application
   */
  async init() {
    console.log('🚀 Initializing Chat App...');

    // Check if user is already logged in
    if (api.isAuthenticated()) {
      try {
        const profileResponse = await api.getProfile();
        if (profileResponse.success) {
          this.currentUser = profileResponse.data;
          await this.loadChatInterface();
          this.isInitialized = true;
          console.log('✅ Chat App Initialized');
          return;
        }
      } catch (error) {
        console.warn('⚠️ Session expired, redirecting to login');
        api.removeToken();
      }
    }

    // Show login page
    this.showLoginPage();
    this.isInitialized = true;
    console.log('✅ Chat App Initialized');
  }

  /**
   * Show login page
   */
  showLoginPage() {
    const template = document.getElementById('login-page');
    this.root.innerHTML = template.innerHTML;
    initAuthPages.setupLogin(this);
  }

  /**
   * Navigate to register page
   */
  goToRegister() {
    const template = document.getElementById('register-page');
    this.root.innerHTML = template.innerHTML;
    initAuthPages.setupRegister(this);
  }

  /**
   * Navigate to login page
   */
  goToLogin() {
    this.showLoginPage();
  }

  /**
   * Navigate to OTP verification page
   */
  goToOTPPage(phone, firstName, lastName) {
    const template = document.getElementById('otp-page');
    this.root.innerHTML = template.innerHTML;
    initAuthPages.setupOTP(this, phone, firstName, lastName);
  }

  /**
   * Load chat interface after login
   */
  async loadChatInterface() {
    try {
      // Load conversations and contacts
      await Promise.all([
        this.loadConversations(),
        this.loadContacts(),
      ]);

      // Render chat page
      const template = document.getElementById('chat-page');
      this.root.innerHTML = template.innerHTML;

      // Initialize modules
      initChatInterface(this);
      initContactsManagement(this);

      // Setup WebSocket connection
      await this.setupWebSocket();

      console.log('✅ Chat interface loaded');
    } catch (error) {
      console.error('❌ Error loading chat interface:', error);
      utils.showNotification('Failed to load chat. Please refresh.', 'danger');
    }
  }

  /**
   * Setup WebSocket connection
   */
  async setupWebSocket() {
    try {
      await wsClient.connect();

      // Listen to real-time events
      wsClient.on('message', (data) => this.handleNewMessage(data));
      wsClient.on('user_typing', (data) => this.handleUserTyping(data));
      wsClient.on('user_typing_stop', (data) => this.handleTypingStop(data));
      wsClient.on('message_read', (data) => this.handleMessageRead(data));
      wsClient.on('user_status_changed', (data) => this.handleStatusChange(data));
      wsClient.on('disconnected', () => this.handleDisconnection());

      // Update user status to online
      wsClient.updateStatus('online');

      // Ping server every 30 seconds to keep connection alive
      this.pingInterval = setInterval(() => {
        if (wsClient.isConnectedStatus()) {
          wsClient.ping();
        }
      }, 30000);

      console.log('✅ WebSocket connected');
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      utils.showNotification('Real-time connection failed. Retrying...', 'warning');
    }
  }

  /**
   * Load conversations list
   */
  async loadConversations() {
    try {
      const response = await api.getConversationList();
      if (response.success) {
        this.conversations = response.data.conversations;
        console.log(`✅ Loaded ${this.conversations.length} conversations`);
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
    }
  }

  /**
   * Load contacts list
   */
  async loadContacts() {
    try {
      const response = await api.getContacts();
      if (response.success) {
        this.contacts = response.data.contacts;
        console.log(`✅ Loaded ${this.contacts.length} contacts`);
      }
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
    }
  }

  /**
   * Open conversation with user
   */
  async openConversation(contactId, contactInfo) {
    try {
      this.currentChat = {
        id: contactId,
        info: contactInfo,
        messages: [],
      };

      // Load message history
      const response = await api.getConversation(contactId, 50, 0);
      if (response.success) {
        this.currentChat.messages = response.data.messages;
        console.log(`✅ Loaded ${this.currentChat.messages.length} messages`);
      }

      // Render chat
      this.renderChat();

      // Mark as read
      this.markConversationAsRead(contactId);
    } catch (error) {
      console.error('❌ Error opening conversation:', error);
      utils.showNotification('Failed to open conversation', 'danger');
    }
  }

  /**
   * Render chat interface
   */
  renderChat() {
    if (!this.currentChat) return;

    const emptyChat = document.getElementById('empty-chat');
    const chatContainer = document.getElementById('chat-container');

    if (emptyChat) emptyChat.style.display = 'none';
    if (chatContainer) chatContainer.style.display = 'flex';

    // Update header
    this.updateChatHeader();

    // Render messages
    this.renderMessages();

    // Focus input
    const input = document.getElementById('message-input');
    if (input) input.focus();
  }

  /**
   * Update chat header with contact info
   */
  updateChatHeader() {
    const contact = this.currentChat.info;
    const avatar = document.getElementById('chat-avatar');
    const name = document.getElementById('chat-name');
    const statusText = document.getElementById('contact-status-text');
    const statusIndicator = document.getElementById('contact-status');

    if (avatar) {
      avatar.textContent = utils.getInitials(contact.firstName, contact.lastName);
      avatar.style.background = `linear-gradient(135deg, ${utils.getAvatarColor(
        contact.username || contact.phone
      )}, ${utils.getAvatarColor(contact.lastName || '')})`;
    }

    if (name) name.textContent = contact.firstName || contact.username || contact.phone;

    if (statusText) {
      statusText.textContent =
        contact.status === 'online'
          ? 'online'
          : contact.status === 'away'
          ? 'away'
          : `seen ${utils.formatLastSeen(contact.lastSeen)}`;
    }

    if (statusIndicator) {
      statusIndicator.className = `status-indicator status-${contact.status}`;
    }
  }

  /**
   * Render messages in conversation
   */
  renderMessages() {
    const container = document.getElementById('messages-container');
    if (!container) return;

    container.innerHTML = '';

    this.currentChat.messages.forEach((msg) => {
      const messageEl = this.createMessageElement(msg);
      container.appendChild(messageEl);
    });

    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Create message element
   */
  createMessageElement(msg) {
    const li = document.createElement('li');
    li.className = `message ${msg.sender._id === this.currentUser._id ? 'own' : ''}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = msg.content;
    bubble.appendChild(content);

    if (msg.isEdited) {
      const edited = document.createElement('div');
      edited.className = 'message-edited';
      edited.textContent = '(edited)';
      bubble.appendChild(edited);
    }

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = utils.formatMessageTime(msg.createdAt);

    if (msg.sender._id === this.currentUser._id) {
      const status = document.createElement('span');
      status.className = 'message-status';
      status.innerHTML = this.getStatusIcon(msg.status);
      time.appendChild(status);
    }

    bubble.appendChild(time);
    li.appendChild(bubble);

    return li;
  }

  /**
   * Get status icon for message
   */
  getStatusIcon(status) {
    const icons = {
      sent: '✓',
      delivered: '✓✓',
      read: '✓✓',
    };
    return icons[status] || '○';
  }

  /**
   * Send message
   */
  async sendMessage(content) {
    if (!content.trim() || !this.currentChat) return;

    try {
      // Send via WebSocket for real-time
      const success = wsClient.sendMessage(this.currentChat.id, content);

      if (!success) {
        // Fallback to REST API
        const response = await api.sendMessage(this.currentChat.id, content);
        if (!response.success) throw new Error('Failed to send message');
      }

      // Clear input
      const input = document.getElementById('message-input');
      if (input) input.value = '';

      console.log('✅ Message sent');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      utils.showNotification('Failed to send message', 'danger');
    }
  }

  /**
   * Handle new message received
   */
  handleNewMessage(data) {
    // If message is for current conversation, add it
    if (this.currentChat && data.sender._id !== this.currentUser._id &&
        (data.sender._id === this.currentChat.id || data.recipient === this.currentUser._id)) {
      
      // Add to messages
      this.currentChat.messages.push(data);
      this.renderMessages();

      // Mark as read
      if (data.status !== 'read') {
        wsClient.markAsRead(data._id);
      }

      // Play notification sound
      this.playNotificationSound();
    }

    // Update conversations list
    this.loadConversations();
  }

  /**
   * Handle typing indicator
   */
  handleUserTyping(data) {
    if (this.currentChat && data.userId === this.currentChat.id) {
      const indicator = document.getElementById('typing-indicator');
      if (!indicator) {
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = 'typing-indicator';
        div.innerHTML = `
          <span style="font-size: 0.9rem; color: var(--text-light);">
            ${data.username} is typing
          </span>
          <div style="display: flex; gap: 2px; margin-left: 0.5rem;">
            <span class="typing-dot" style="animation-delay: 0s;"></span>
            <span class="typing-dot" style="animation-delay: 0.2s;"></span>
            <span class="typing-dot" style="animation-delay: 0.4s;"></span>
          </div>
        `;
        const container = document.getElementById('messages-container');
        if (container) container.appendChild(div);
      }
    }
  }

  /**
   * Handle typing stop
   */
  handleTypingStop(data) {
    if (this.currentChat && data.userId === this.currentChat.id) {
      const indicator = document.getElementById('typing-indicator');
      if (indicator) indicator.remove();
    }
  }

  /**
   * Handle message read
   */
  handleMessageRead(data) {
    if (this.currentChat) {
      const msg = this.currentChat.messages.find(m => m._id === data.messageId);
      if (msg) {
        msg.status = 'read';
        msg.readAt = data.readAt;
        this.renderMessages();
      }
    }
  }

  /**
   * Handle user status change
   */
  handleStatusChange(data) {
    if (this.currentChat && data.userId === this.currentChat.id) {
      this.currentChat.info.status = data.status;
      this.updateChatHeader();
    }
  }

  /**
   * Handle disconnection
   */
  handleDisconnection() {
    console.warn('⚠️ WebSocket disconnected');
    utils.showNotification('Connection lost. Reconnecting...', 'warning');
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(contactId) {
    try {
      // Get unread messages
      const unreadMessages = this.currentChat.messages.filter(
        msg => msg.status !== 'read' && msg.recipient === this.currentUser._id
      );

      // Mark each as read
      for (const msg of unreadMessages) {
        wsClient.markAsRead(msg._id);
      }

      // Update contact unread count
      const contact = this.contacts.find(c => c.contact._id === contactId);
      if (contact) {
        contact.unreadCount = 0;
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator() {
    if (this.currentChat) {
      wsClient.sendTyping(this.currentChat.id);
    }
  }

  /**
   * Send typing stop indicator
   */
  sendTypingStopIndicator() {
    if (this.currentChat) {
      wsClient.sendTypingStop(this.currentChat.id);
    }
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Notification not supported or blocked
    }
  }

  /**
   * Search contacts
   */
  async searchContacts(query) {
    try {
      const response = await api.getContacts(query);
      if (response.success) {
        return response.data.contacts;
      }
    } catch (error) {
      console.error('Error searching contacts:', error);
    }
    return [];
  }

  /**
   * Search users
   */
  async searchUsers(query) {
    try {
      const response = await api.searchUsers(query);
      if (response.success) {
        return response.data.users;
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
    return [];
  }

  /**
   * Add contact
   */
  async addContact(identifier, customName) {
    try {
      const response = await api.addContact(identifier, customName);
      if (response.success) {
        utils.showNotification('Contact added successfully', 'success');
        await this.loadContacts();
        return true;
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      utils.showNotification(error.message, 'danger');
    }
    return false;
  }

  /**
   * Delete contact
   */
  async deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) return false;

    try {
      const response = await api.deleteContact(contactId);
      if (response.success) {
        utils.showNotification('Contact deleted', 'success');
        await this.loadContacts();
        return true;
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      utils.showNotification(error.message, 'danger');
    }
    return false;
  }

  /**
   * Block contact
   */
  async blockContact(contactId) {
    try {
      const response = await api.blockContact(contactId);
      if (response.success) {
        utils.showNotification('Contact blocked', 'success');
        await this.loadContacts();
        return true;
      }
    } catch (error) {
      console.error('Error blocking contact:', error);
      utils.showNotification(error.message, 'danger');
    }
    return false;
  }

  /**
   * Update user profile
   */
  async updateProfile(data) {
    try {
      const response = await api.updateProfile(data);
      if (response.success) {
        this.currentUser = response.data;
        utils.showNotification('Profile updated successfully', 'success');
        return true;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      utils.showNotification(error.message, 'danger');
    }
    return false;
  }

  /**
   * Logout
   */
  async logout() {
    try {
      // Update status to offline
      wsClient.updateStatus('offline');

      // Disconnect WebSocket
      wsClient.disconnect();

      // Call logout API
      await api.logout();

      // Clear data
      this.currentUser = null;
      this.currentChat = null;
      this.conversations = [];
      this.contacts = [];

      // Clear interval
      if (this.pingInterval) clearInterval(this.pingInterval);

      // Show login page
      this.showLoginPage();

      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  /**
   * Show menu
   */
  showMenu() {
    // Show menu modal (to be implemented)
    console.log('Show menu');
  }

  /**
   * Show contact info
   */
  showContactInfo() {
    // Show contact info modal (to be implemented)
    console.log('Show contact info');
  }

  /**
   * Resend OTP
   */
  async resendOTP() {
    const phone = document.getElementById('register-phone')?.value || 
                  document.getElementById('otp-phone')?.textContent;
    
    if (!phone) {
      utils.showNotification('Phone number not found', 'danger');
      return;
    }

    try {
      const response = await api.resendOTP(phone);
      if (response.success) {
        utils.showNotification('OTP sent successfully', 'success');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      utils.showNotification(error.message, 'danger');
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ChatApp();
});

export default ChatApp;
