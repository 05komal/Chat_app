// client/src/js/websocket.js

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.url = 'ws://localhost:5000/ws';
    this.token = localStorage.getItem('authToken');
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.messageHandlers = new Map();
    this.isConnected = false;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (!this.token) {
      console.error('❌ No authentication token. Cannot connect to WebSocket.');
      return Promise.reject(new Error('No authentication token'));
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.url}?token=${this.token}`);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('❌ WebSocket disconnected');
          this.isConnected = false;
          this.emit('disconnected');
          this.attemptReconnect();
        };

        // Timeout for connection
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);
      } catch (error) {
        console.error('❌ WebSocket connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `⏳ Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('❌ Reconnection failed:', error);
        });
      }, this.reconnectDelay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('reconnect_failed');
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(message) {
    const { type, data } = message;

    console.log(`📨 Received: ${type}`, data);

    // Emit to specific handlers
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type).forEach((handler) => {
        handler(data);
      });
    }

    // Emit global event
    this.emit(type, data);
  }

  /**
   * Send a message through WebSocket
   */
  send(type, data = {}) {
    if (!this.isConnected) {
      console.error('❌ WebSocket not connected');
      return false;
    }

    try {
      const message = JSON.stringify({ type, data });
      this.ws.send(message);
      console.log(`📤 Sent: ${type}`, data);
      return true;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      return false;
    }
  }

  /**
   * Send chat message
   */
  sendMessage(recipientId, content) {
    return this.send('message', {
      recipientId,
      content,
    });
  }

  /**
   * Notify user is typing
   */
  sendTyping(recipientId) {
    return this.send('typing', {
      recipientId,
    });
  }

  /**
   * Notify typing stopped
   */
  sendTypingStop(recipientId) {
    return this.send('typing_stop', {
      recipientId,
    });
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId) {
    return this.send('read', {
      messageId,
    });
  }

  /**
   * Update user status
   */
  updateStatus(status) {
    return this.send('user_status', {
      status,
    });
  }

  /**
   * Send ping to server (keep-alive)
   */
  ping() {
    return this.send('ping');
  }

  /**
   * On message handler
   */
  on(type, callback) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(callback);
  }

  /**
   * Off message handler
   */
  off(type, callback) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit custom events
   */
  emit(event, data) {
    const customEvent = new CustomEvent(event, { detail: data });
    window.dispatchEvent(customEvent);
  }

  /**
   * Listen to custom events
   */
  listen(event, callback) {
    window.addEventListener(event, (e) => callback(e.detail));
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
      console.log('✅ WebSocket disconnected');
    }
  }

  /**
   * Check connection status
   */
  isConnectedStatus() {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
const wsClient = new WebSocketClient();

export default wsClient;
