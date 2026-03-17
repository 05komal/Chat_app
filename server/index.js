// server/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const connectDB = require('./config/db');
const { setupWebSocket } = require('./websocket');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const contactRoutes = require('./routes/contacts');
const messageRoutes = require('./routes/messages');

// Initialize Express app
const app = express();

// Environment variables
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== MIDDLEWARE ====================

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });
}

// ==================== ERROR HANDLER MIDDLEWARE ====================

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// ==================== ROUTES ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
  });
});

// API version endpoint
app.get('/api/version', (req, res) => {
  res.status(200).json({
    success: true,
    version: '1.0.0',
    name: 'Chat App API',
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Contact routes
app.use('/api/contacts', contactRoutes);

// Message routes
app.use('/api/messages', messageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ==================== SERVER SETUP ====================

// Create HTTP server for WebSocket
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  clientTracking: true,
});

// Setup WebSocket handlers
setupWebSocket(wss);

// ==================== DATABASE CONNECTION ====================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Database connected');
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║     🚀 Chat App Server Started 🚀     ║
╠════════════════════════════════════════╣
║ Environment: ${NODE_ENV.padEnd(32)}║
║ Port: ${PORT.toString().padEnd(40)}║
║ API: http://localhost:${PORT}/api              ║
║ WebSocket: ws://localhost:${PORT}/ws            ║
║ Status: ${('✅ Running').padEnd(40)}║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ==================== GRACEFUL SHUTDOWN ====================

const gracefulShutdown = async (signal) => {
  console.log(`\n📡 ${signal} received, shutting down gracefully...`);
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  // Close WebSocket connections
  wss.clients.forEach((client) => {
    client.close();
  });
  
  console.log('✅ WebSocket connections closed');
  
  // Close database connection
  try {
    require('mongoose').connection.close(false, () => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error closing database:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Promise Rejection:', error);
  process.exit(1);
});

// ==================== START SERVER ====================

startServer();

module.exports = { app, server, wss };
