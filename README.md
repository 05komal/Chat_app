# 💬 Modern Chat App - Full Stack Implementation

A production-ready, real-time chat application similar to WhatsApp and Telegram, built with Node.js, MongoDB, and Vanilla JavaScript.

## 🎯 Features

### ✅ Authentication
- **Phone Number Registration** - Users register using their phone number
- **OTP Verification** - 6-digit OTP with 10-minute expiry and 5-attempt limit
- **Secure Password** - Password hashing with bcryptjs
- **JWT Tokens** - Stateless authentication with JWT tokens
- **Session Management** - Token-based session handling

### ✅ User Management
- **User Profiles** - Complete user information management
- **Username System** - Unique username for user discovery
- **Status Tracking** - Online/offline/away status
- **Last Seen** - Track when users were last active
- **User Search** - Search users by username, phone, or name
- **Profile Updates** - Edit name, bio, and other profile info
- **Account Deactivation** - Safely deactivate accounts

### ✅ Contact Management
- **Add Contacts** - Add users by username or phone number
- **Contact List** - View all contacts with status
- **Favorite Contacts** - Mark important contacts as favorites
- **Block/Unblock** - Block unwanted users
- **Mute Notifications** - Mute specific contacts
- **Contact Search** - Search within your contact list

### ✅ Real-time Messaging
- **Instant Messages** - WebSocket-based real-time messaging
- **Message Status** - Sent → Delivered → Read receipt tracking
- **Message Editing** - Edit messages within 15 minutes
- **Message Deletion** - Delete messages you've sent
- **Message History** - Persistent message storage
- **Typing Indicators** - See when contacts are typing
- **Conversation List** - View all active conversations
- **Message Search** - Search through message history
- **Unread Badges** - Track unread message count

### ✅ WebSocket Features
- **Real-time Updates** - Instant message delivery
- **User Status** - Live online/offline status updates
- **Typing Notifications** - Real-time typing indicators
- **Automatic Reconnection** - Auto-reconnect on disconnection
- **Connection Management** - Graceful handling of connections/disconnections

## 📁 Project Structure

```
chat-app-pro/
├── server/
│   ├── config/
│   │   └── db.js                 # MongoDB configuration
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Contact.js            # Contact schema
│   │   └── Message.js            # Message schema
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── userController.js     # User management logic
│   │   ├── contactController.js  # Contact management logic
│   │   └── messageController.js  # Message logic
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── users.js             # User endpoints
│   │   ├── contacts.js          # Contact endpoints
│   │   └── messages.js          # Message endpoints
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── validate.js          # Input validation
│   ├── utils/
│   │   ├── jwt.js               # JWT utilities
│   │   └── otp.js               # OTP utilities
│   ├── websocket.js             # WebSocket handler
│   ├── index.js                 # Main server file
│   ├── package.json
│   └── .env.example
│
├── client/
│   ├── public/
│   │   ├── index.html           # Main HTML
│   │   └── styles/
│   │       ├── global.css       # Global styles
│   │       ├── auth.css         # Auth page styles
│   │       └── chat.css         # Chat page styles
│   ├── src/
│   │   └── js/
│   │       ├── app.js           # Main app logic
│   │       ├── api.js           # API client
│   │       ├── websocket.js     # WebSocket client
│   │       ├── auth.js          # Auth logic
│   │       ├── messages.js      # Message logic
│   │       ├── contacts.js      # Contact logic
│   │       └── utils.js         # Utility functions
│   ├── package.json
│   └── README.md
│
├── CHAT_APP_ROADMAP.md          # Development roadmap
└── README.md                     # This file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (local or Atlas)
- **npm** or **yarn**
- **Python** (for client dev server) or any HTTP server

### Backend Setup

1. **Navigate to server directory:**
```bash
cd server
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
cp .env.example .env
```

4. **Update .env with your configuration:**
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chat-app

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# OTP Configuration
OTP_EXPIRE=10
OTP_LENGTH=6

# Client URL
CLIENT_URL=http://localhost:3000
```

5. **Ensure MongoDB is running:**
```bash
# If using MongoDB locally, start the service
# macOS with Homebrew:
brew services start mongodb-community

# Linux with systemd:
sudo systemctl start mongod

# Windows:
# MongoDB service should auto-start if installed
```

6. **Start the server:**
```bash
npm run dev
# or
npm start
```

You should see:
```
✅ MongoDB Connected
✅ Chat App Server Started

╔════════════════════════════════════════╗
║     🚀 Chat App Server Started 🚀     ║
╠════════════════════════════════════════╣
║ Environment: development               ║
║ Port: 5000                             ║
║ API: http://localhost:5000/api         ║
║ WebSocket: ws://localhost:5000/ws      ║
║ Status: ✅ Running                     ║
╚════════════════════════════════════════╝
```

### Frontend Setup

1. **Navigate to client directory:**
```bash
cd client
```

2. **Option A: Using Python (recommended for development):**
```bash
python -m http.server 3000
```

3. **Option B: Using Node.js http-server:**
```bash
npm install -g http-server
http-server -p 3000 public
```

4. **Open in browser:**
```
http://localhost:3000
```

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with phone number |
| POST | `/api/auth/verify-otp` | Verify OTP and create account |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/login` | Login with phone and password |
| GET | `/api/auth/profile` | Get current user profile |
| POST | `/api/auth/logout` | Logout current user |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/users/profile` | Update user profile |
| GET | `/api/users/search` | Search users |
| GET | `/api/users/online` | Get online users |
| GET | `/api/users/:identifier` | Get user profile |
| POST | `/api/users/:userId/block` | Block a user |
| POST | `/api/users/:userId/unblock` | Unblock a user |
| GET | `/api/users/blocked/list` | Get blocked users |
| POST | `/api/users/status` | Update status |

### Contact Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contacts` | Add contact |
| GET | `/api/contacts` | Get all contacts |
| GET | `/api/contacts/favorites` | Get favorite contacts |
| PUT | `/api/contacts/:contactId` | Update contact |
| DELETE | `/api/contacts/:contactId` | Delete contact |
| POST | `/api/contacts/:contactId/block` | Block contact |

### Message Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages` | Send message |
| GET | `/api/messages/conversations` | Get conversation list |
| GET | `/api/messages/search` | Search messages |
| GET | `/api/messages/:userId` | Get conversation |
| PUT | `/api/messages/:messageId` | Edit message |
| DELETE | `/api/messages/:messageId` | Delete message |
| POST | `/api/messages/:messageId/read` | Mark as read |

## 🔌 WebSocket Events

### Client → Server

```javascript
// Send message
{
  type: 'message',
  data: { recipientId, content }
}

// Typing indicator
{
  type: 'typing',
  data: { recipientId }
}

// Stop typing
{
  type: 'typing_stop',
  data: { recipientId }
}

// Mark as read
{
  type: 'read',
  data: { messageId }
}

// Update status
{
  type: 'user_status',
  data: { status: 'online' | 'offline' | 'away' }
}
```

### Server → Client

```javascript
// Connection established
{
  type: 'connected',
  data: { message, userId, username }
}

// New message received
{
  type: 'message',
  data: { /* message object */ }
}

// Message delivered
{
  type: 'message_sent',
  data: { messageId, status, deliveredAt }
}

// User typing
{
  type: 'user_typing',
  data: { userId, username }
}

// User stopped typing
{
  type: 'user_typing_stop',
  data: { userId }
}

// Message read
{
  type: 'message_read',
  data: { messageId, readAt }
}

// User status changed
{
  type: 'user_status_changed',
  data: { userId, status, timestamp }
}
```

## 🔐 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token-based authentication
- ✅ CORS protection
- ✅ Input validation with Joi
- ✅ XSS protection
- ✅ Rate limiting ready
- ✅ Secure OTP handling
- ✅ Token expiration

## 📚 Usage Examples

### Register a New User

```javascript
// Frontend
const response = await api.register(
  '+1234567890',
  'John',
  'Doe',
  'john@example.com'
);
// Returns OTP sent message

// Verify OTP
const result = await api.verifyOTP(
  '+1234567890',
  '123456',
  'Password123'
);
// Returns { token, user }
```

### Send a Message

```javascript
// REST API
const message = await api.sendMessage(
  'recipientUserId',
  'Hello, how are you?'
);

// WebSocket (real-time)
wsClient.sendMessage('recipientUserId', 'Hello!');
```

### Get Conversations

```javascript
const conversations = await api.getConversationList();
// Returns array of active conversations with last messages
```

## 🧪 Testing

### Test OTP Feature (Development)
When registering, the OTP will be logged to the server console. Check your terminal:
```
OTP for +1234567890: 123456
```

### Test WebSocket Connection
The frontend will automatically attempt to connect to the WebSocket server. Check browser console for:
```
✅ WebSocket connected
```

## 🛠️ Development

### Database Seeding (Optional)

Create some test users by making API calls:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","firstName":"John","lastName":"Doe"}'
```

### Debugging

Enable verbose logging by setting `NODE_ENV=development` in `.env`

### Common Issues

**Issue:** WebSocket connection fails
```
Solution: Ensure server is running on port 5000 and CORS is enabled
```

**Issue:** MongoDB connection error
```
Solution: Check MongoDB is running and MONGODB_URI is correct
```

**Issue:** OTP not appearing
```
Solution: Check server console for OTP logs in development mode
```

## 📦 Dependencies

### Backend
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **joi** - Input validation
- **ws** - WebSocket server
- **cors** - Cross-origin support
- **dotenv** - Environment variables

### Frontend
- Vanilla JavaScript (ES6+)
- No external dependencies for core functionality
- Font Awesome for icons (CDN)

## 🚀 Deployment

### Deploy to Heroku (Backend)

1. **Create Heroku app:**
```bash
heroku create your-app-name
```

2. **Set environment variables:**
```bash
heroku config:set JWT_SECRET=your_secret
heroku config:set MONGODB_URI=your_mongodb_url
```

3. **Deploy:**
```bash
git push heroku main
```

### Deploy to Vercel/Netlify (Frontend)

1. **Build for production:**
```bash
npm run build
```

2. **Deploy the `public` folder to your hosting service**

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, please open an issue on the GitHub repository.

## 🎓 Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [JWT Guide](https://jwt.io/introduction)

## 🎉 Acknowledgments

This project was built as a complete full-stack chat application demonstration showcasing:
- Modern backend architecture with Node.js and MongoDB
- Real-time communication with WebSockets
- Secure authentication with OTP and JWT
- Production-ready code structure
- Responsive frontend design

---

**Happy Chatting! 💬**

Last Updated: March 2026
Version: 1.0.0
