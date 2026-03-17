## ⚡ Quick Start Guide

### 🔧 Prerequisites
- Node.js v14+
- MongoDB (local or Atlas)
- Modern web browser

### 📥 Installation (5 minutes)

#### 1️⃣ Clone/Download Project
```bash
cd chat-app-pro
```

#### 2️⃣ Backend Setup
```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB URL
# MONGODB_URI=mongodb://localhost:27017/chat-app

# Start server
npm run dev
```

✅ Server runs on: `http://localhost:5000`

#### 3️⃣ Frontend Setup
```bash
cd ../client

# Option A: Python (recommended)
python -m http.server 3000

# Option B: Node
npx http-server public -p 3000
```

✅ Frontend runs on: `http://localhost:3000`

### 🧪 First Run

1. Open `http://localhost:3000` in browser
2. Click "Sign up here"
3. Enter phone: `+1234567890`
4. Click "Get OTP"
5. Check server console for OTP code
6. Enter OTP and password
7. Login and start chatting!

### 📋 API Reference Quick Reference

```javascript
// Register
POST /api/auth/register
{ phone, firstName, lastName, email }

// Verify OTP
POST /api/auth/verify-otp
{ phone, otp, password, firstName, lastName }

// Login
POST /api/auth/login
{ phone, password }

// Send Message
POST /api/messages
{ recipientId, content }

// Get Conversations
GET /api/messages/conversations

// Search Users
GET /api/users/search?query=name

// Add Contact
POST /api/contacts
{ contactIdentifier, customName }
```

### 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| MongoDB error | Install MongoDB or update MONGODB_URI in .env |
| WebSocket fails | Check server is running on port 5000 |
| Can't see OTP | Check server console (NODE_ENV=development) |
| Port already in use | Change PORT in .env or kill process on that port |

### 📱 Test Data

Use these test credentials to quickly test:

**User 1:**
- Phone: `+1111111111`
- Password: `Test@123`

**User 2:**
- Phone: `+2222222222`
- Password: `Test@456`

(Create them by registering first)

### 🎯 Next Steps

After setup, try:
1. Create 2 accounts on different browsers
2. Add each other as contacts
3. Send real-time messages
4. Test typing indicators
5. Read message receipts

### 📚 Full Documentation

See `README.md` for complete documentation.

### 🆘 Need Help?

Check these first:
1. Both server and client running?
2. MongoDB is running?
3. Ports 5000 and 3000 are free?
4. Check browser console for errors
5. Check server console for API errors

---

**You're all set! Happy Chatting! 💬**
