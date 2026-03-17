// server/websocket.js
const { verifyToken } = require('./utils/jwt');
const User = require('./models/User');
const Message = require('./models/Message');

// Store active WebSocket connections
const activeConnections = new Map(); // userId -> ws

/**
 * Setup WebSocket connection handler
 */
const setupWebSocket = (wss) => {
  wss.on('connection', async (ws, req) => {
    try {
      // Get token from URL or headers
      const token = req.url.split('token=')[1] || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        ws.close(1008, 'Unauthorized');
        return;
      }
      
      const decoded = verifyToken(token);
      if (!decoded) {
        ws.close(1008, 'Invalid token');
        return;
      }
      
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        ws.close(1008, 'User not found or inactive');
        return;
      }
      
      const userId = user._id.toString();
      
      // Store connection
      activeConnections.set(userId, {
        ws,
        user,
        connectedAt: new Date(),
      });
      
      // Update user status to online
      user.status = 'online';
      await user.save();
      
      // Broadcast user online status
      broadcastUserStatus(userId, 'online');
      
      console.log(`✅ User ${user.username} connected. Total connections: ${activeConnections.size}`);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        data: {
          message: 'Connected to chat server',
          userId,
          username: user.username,
        },
      }));
      
      // Handle incoming messages
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          await handleWebSocketMessage(message, userId);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            data: { error: 'Invalid message format' },
          }));
        }
      });
      
      // Handle disconnection
      ws.on('close', async () => {
        activeConnections.delete(userId);
        
        // Update user status to offline
        const userData = await User.findById(userId);
        if (userData) {
          userData.status = 'offline';
          userData.lastSeen = new Date();
          await userData.save();
        }
        
        broadcastUserStatus(userId, 'offline');
        
        console.log(`❌ User ${userData?.username} disconnected. Total connections: ${activeConnections.size}`);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Server error');
    }
  });
};

/**
 * Handle incoming WebSocket messages
 */
const handleWebSocketMessage = async (message, senderId) => {
  const { type, data } = message;
  
  switch (type) {
    case 'message': {
      await handleNewMessage(senderId, data);
      break;
    }
    
    case 'typing': {
      await broadcastTyping(senderId, data.recipientId);
      break;
    }
    
    case 'typing_stop': {
      await broadcastTypingStop(senderId, data.recipientId);
      break;
    }
    
    case 'read': {
      await handleMessageRead(data.messageId);
      break;
    }
    
    case 'user_status': {
      await handleUserStatusUpdate(senderId, data.status);
      break;
    }
    
    case 'ping': {
      const connection = activeConnections.get(senderId);
      if (connection) {
        connection.ws.send(JSON.stringify({ type: 'pong' }));
      }
      break;
    }
    
    default:
      console.warn('Unknown message type:', type);
  }
};

/**
 * Handle new chat message
 */
const handleNewMessage = async (senderId, data) => {
  try {
    const { recipientId, content } = data;
    
    // Create message in database
    const message = new Message({
      content,
      sender: senderId,
      recipient: recipientId,
      status: 'sent',
      deliveredAt: new Date(),
    });
    
    await message.save();
    await message.populate('sender', 'username firstName lastName profilePicture');
    
    // Send to recipient if online
    const recipientConnection = activeConnections.get(recipientId);
    if (recipientConnection) {
      recipientConnection.ws.send(JSON.stringify({
        type: 'message',
        data: {
          ...message.toObject(),
          status: 'delivered',
        },
      }));
      
      // Update message status
      message.status = 'delivered';
      message.deliveredAt = new Date();
      await message.save();
    }
    
    // Notify sender
    const senderConnection = activeConnections.get(senderId);
    if (senderConnection) {
      senderConnection.ws.send(JSON.stringify({
        type: 'message_sent',
        data: {
          messageId: message._id,
          status: 'delivered',
          deliveredAt: message.deliveredAt,
        },
      }));
    }
  } catch (error) {
    console.error('Error handling new message:', error);
  }
};

/**
 * Broadcast typing indicator
 */
const broadcastTyping = async (senderId, recipientId) => {
  const senderData = await User.findById(senderId).select('username');
  const recipientConnection = activeConnections.get(recipientId);
  
  if (recipientConnection) {
    recipientConnection.ws.send(JSON.stringify({
      type: 'user_typing',
      data: {
        userId: senderId,
        username: senderData.username,
      },
    }));
  }
};

/**
 * Broadcast typing stop indicator
 */
const broadcastTypingStop = async (senderId, recipientId) => {
  const recipientConnection = activeConnections.get(recipientId);
  
  if (recipientConnection) {
    recipientConnection.ws.send(JSON.stringify({
      type: 'user_typing_stop',
      data: {
        userId: senderId,
      },
    }));
  }
};

/**
 * Handle message read status
 */
const handleMessageRead = async (messageId) => {
  try {
    const message = await Message.findById(messageId);
    if (message) {
      message.status = 'read';
      message.readAt = new Date();
      await message.save();
      
      // Notify sender
      const senderConnection = activeConnections.get(message.sender.toString());
      if (senderConnection) {
        senderConnection.ws.send(JSON.stringify({
          type: 'message_read',
          data: {
            messageId,
            readAt: message.readAt,
          },
        }));
      }
    }
  } catch (error) {
    console.error('Error handling message read:', error);
  }
};

/**
 * Handle user status update
 */
const handleUserStatusUpdate = async (userId, status) => {
  try {
    if (!['online', 'offline', 'away'].includes(status)) return;
    
    const user = await User.findById(userId);
    if (user) {
      user.status = status;
      if (status === 'offline') {
        user.lastSeen = new Date();
      }
      await user.save();
      
      broadcastUserStatus(userId, status);
    }
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

/**
 * Broadcast user status to all connected users
 */
const broadcastUserStatus = (userId, status) => {
  const statusMessage = JSON.stringify({
    type: 'user_status_changed',
    data: {
      userId,
      status,
      timestamp: new Date(),
    },
  });
  
  activeConnections.forEach((connection) => {
    if (connection.ws.readyState === 1) { // WebSocket.OPEN
      connection.ws.send(statusMessage);
    }
  });
};

/**
 * Send direct message via WebSocket
 */
const sendDirectMessage = (userId, message) => {
  const connection = activeConnections.get(userId);
  if (connection && connection.ws.readyState === 1) {
    connection.ws.send(JSON.stringify(message));
  }
};

/**
 * Broadcast message to multiple users
 */
const broadcastMessage = (userIds, message) => {
  const msgString = JSON.stringify(message);
  userIds.forEach((userId) => {
    sendDirectMessage(userId, JSON.parse(msgString));
  });
};

/**
 * Get online users count
 */
const getOnlineUsersCount = () => {
  return activeConnections.size;
};

/**
 * Get active connection info
 */
const getConnectionInfo = (userId) => {
  return activeConnections.get(userId);
};

module.exports = {
  setupWebSocket,
  sendDirectMessage,
  broadcastMessage,
  broadcastUserStatus,
  getOnlineUsersCount,
  getConnectionInfo,
};
