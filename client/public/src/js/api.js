// client/src/js/api.js

const API_BASE_URL = 'http://localhost:5000/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = this.getToken();
  }

  // Token management
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Helper method for API calls
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Register with phone number
   */
  async register(phone, firstName = '', lastName = '', email = '') {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        firstName,
        lastName,
        email,
      }),
    });
  }

  /**
   * Verify OTP and create account
   */
  async verifyOTP(phone, otp, password, firstName = '', lastName = '') {
    const response = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        otp,
        password,
        firstName,
        lastName,
      }),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  /**
   * Resend OTP
   */
  async resendOTP(phone) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  /**
   * Login with phone and password
   */
  async login(phone, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    return this.request('/auth/profile');
  }

  /**
   * Logout
   */
  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });

    this.removeToken();
    return response;
  }

  // ==================== USERS ====================

  /**
   * Update user profile
   */
  async updateProfile(data) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get user profile
   */
  async getUserProfile(identifier) {
    return this.request(`/users/${identifier}`);
  }

  /**
   * Search users
   */
  async searchUsers(query) {
    return this.request(`/users/search?query=${encodeURIComponent(query)}`);
  }

  /**
   * Get online users
   */
  async getOnlineUsers() {
    return this.request('/users/online');
  }

  /**
   * Block user
   */
  async blockUser(userId) {
    return this.request(`/users/${userId}/block`, {
      method: 'POST',
    });
  }

  /**
   * Unblock user
   */
  async unblockUser(userId) {
    return this.request(`/users/${userId}/unblock`, {
      method: 'POST',
    });
  }

  /**
   * Get blocked users list
   */
  async getBlockedUsers() {
    return this.request('/users/blocked/list');
  }

  /**
   * Update user status
   */
  async updateStatus(status) {
    return this.request('/users/status', {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Deactivate account
   */
  async deactivateAccount(password) {
    return this.request('/users/deactivate', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  // ==================== CONTACTS ====================

  /**
   * Add a new contact
   */
  async addContact(contactIdentifier, customName = null) {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify({
        contactIdentifier,
        customName,
      }),
    });
  }

  /**
   * Get all contacts
   */
  async getContacts(search = '', status = 'active') {
    let url = '/contacts';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;

    return this.request(url);
  }

  /**
   * Update contact
   */
  async updateContact(contactId, data) {
    return this.request(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete contact
   */
  async deleteContact(contactId) {
    return this.request(`/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Block contact
   */
  async blockContact(contactId) {
    return this.request(`/contacts/${contactId}/block`, {
      method: 'POST',
    });
  }

  /**
   * Get favorite contacts
   */
  async getFavorites() {
    return this.request('/contacts/favorites');
  }

  // ==================== MESSAGES ====================

  /**
   * Send a message
   */
  async sendMessage(recipientId, content) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({
        recipientId,
        content,
      }),
    });
  }

  /**
   * Get conversation with user
   */
  async getConversation(userId, limit = 50, skip = 0) {
    const url = `/messages/${userId}?limit=${limit}&skip=${skip}`;
    return this.request(url);
  }

  /**
   * Get conversation list
   */
  async getConversationList(search = '') {
    let url = '/messages/conversations';
    if (search) url += `?search=${encodeURIComponent(search)}`;

    return this.request(url);
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    return this.request(`/messages/${messageId}/read`, {
      method: 'POST',
    });
  }

  /**
   * Edit message
   */
  async editMessage(messageId, content) {
    return this.request(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId) {
    return this.request(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Search messages
   */
  async searchMessages(query, contactId = null) {
    let url = `/messages/search?query=${encodeURIComponent(query)}`;
    if (contactId) url += `&contactId=${contactId}`;

    return this.request(url);
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Clear all data
   */
  clearAllData() {
    this.removeToken();
    localStorage.clear();
  }
}

// Create singleton instance
const api = new APIClient();

export default api;
