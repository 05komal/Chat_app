# 🚀 Deployment Guide - Chat App

Complete guide for deploying the Chat App to production environments.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Database Setup](#database-setup)
5. [SSL/TLS Configuration](#ssltls-configuration)
6. [Environment Variables](#environment-variables)
7. [Monitoring & Logging](#monitoring--logging)

---

## 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] Update JWT_SECRET with a strong random string
- [ ] Set secure passwords for all services
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly for production domain
- [ ] Set up proper logging and monitoring
- [ ] Configure database backups
- [ ] Test all features in staging environment
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN for static assets
- [ ] Set up rate limiting
- [ ] Configure environment-specific variables

---

## 🔧 Backend Deployment

### Option 1: Deploy to Heroku

**Prerequisites:**
- Heroku account
- Heroku CLI installed

**Steps:**

1. **Create Heroku app:**
```bash
heroku create your-app-name
```

2. **Set environment variables:**
```bash
heroku config:set JWT_SECRET=your-super-secret-key
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/chat-app
heroku config:set NODE_ENV=production
heroku config:set CLIENT_URL=https://yourdomain.com
```

3. **Create Procfile in server directory:**
```
web: node index.js
```

4. **Deploy:**
```bash
git subtree push --prefix server heroku main
# or
cd server && git push heroku main
```

5. **View logs:**
```bash
heroku logs --tail
```

### Option 2: Deploy to Railway.app

**Prerequisites:**
- Railway account
- GitHub repository

**Steps:**

1. **Push code to GitHub**
2. **Connect Railway to GitHub**
3. **Set environment variables in Railway dashboard**
4. **Railway auto-deploys on push**

### Option 3: Deploy to DigitalOcean App Platform

**Steps:**

1. **Connect GitHub to DigitalOcean**
2. **Create new app from repository**
3. **Configure:
   - Runtime: Node.js 18
   - Build command: `cd server && npm install`
   - Run command: `cd server && npm start`
4. **Add environment variables**
5. **Deploy**

### Option 4: Deploy to AWS EC2

**Prerequisites:**
- AWS account
- EC2 instance (Ubuntu 20.04 or later)
- SSH access

**Steps:**

1. **SSH into instance:**
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

2. **Install Node.js and npm:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install MongoDB (or use MongoDB Atlas):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

4. **Clone repository:**
```bash
git clone your-repo-url
cd chat-app-pro/server
```

5. **Install dependencies:**
```bash
npm install
```

6. **Create .env file:**
```bash
nano .env
# Add your configuration
```

7. **Install PM2 for process management:**
```bash
sudo npm install -g pm2
pm2 start index.js --name "chat-app"
pm2 startup
pm2 save
```

8. **Install and configure Nginx:**
```bash
sudo apt-get install nginx
```

Create `/etc/nginx/sites-available/chat-app`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🎨 Frontend Deployment

### Option 1: Deploy to Vercel

**Steps:**

1. **Push code to GitHub**
2. **Connect GitHub to Vercel**
3. **Configure:
   - Framework Preset: Other
   - Root Directory: `client/public`
   - Build command: (leave empty)
   - Output directory: (leave empty)
4. **Add environment variable:**
```
VITE_API_URL=https://your-backend.com/api
VITE_WS_URL=wss://your-backend.com/ws
```
5. **Deploy**

### Option 2: Deploy to Netlify

**Steps:**

1. **Connect GitHub to Netlify**
2. **Configure build:**
   - Build command: (leave empty)
   - Publish directory: `client/public`
3. **Add environment variables**
4. **Deploy**

**Create `netlify.toml`:**
```toml
[build]
  publish = "client/public"
  command = ""

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Deploy to AWS S3 + CloudFront

**Steps:**

1. **Create S3 bucket:**
```bash
aws s3 mb s3://your-chat-app-bucket --region us-east-1
```

2. **Enable static hosting:**
```bash
aws s3 website s3://your-chat-app-bucket --index-document index.html --error-document index.html
```

3. **Upload files:**
```bash
cd client/public
aws s3 sync . s3://your-chat-app-bucket --delete
```

4. **Create CloudFront distribution:**
   - Origin: Your S3 bucket
   - Enable HTTPS
   - Set cache behaviors

### Option 4: Deploy to DigitalOcean Spaces

**Steps:**

1. **Create Space**
2. **Upload files:**
```bash
aws s3 sync client/public s3://your-space-name --endpoint-url https://nyc3.digitaloceanspaces.com
```

3. **Set up CDN**

---

## 📊 Database Setup

### MongoDB Atlas (Recommended)

1. **Create account** at mongodb.com
2. **Create cluster:**
   - Choose free tier or paid
   - Select region
   - Create user with strong password
3. **Get connection string:**
   - Set IP whitelist to 0.0.0.0/0 (or specific IPs)
   - Copy connection string
4. **Set in environment variables:**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/chat-app
```

### Self-Hosted MongoDB

1. **Install MongoDB on server**
2. **Configure security:**
```bash
# Enable authentication
sudo nano /etc/mongod.conf
# Uncomment: security.authorization: enabled
```

3. **Create admin user:**
```bash
mongosh
use admin
db.createUser({ user: "admin", pwd: "strong_password", roles: ["root"] })
db.createUser({ user: "chatapp", pwd: "strong_password", roles: ["dbOwner"] })
```

4. **Connection string:**
```
mongodb://chatapp:password@localhost:27017/chat-app
```

---

## 🔐 SSL/TLS Configuration

### Using Let's Encrypt (Free)

1. **Install Certbot:**
```bash
sudo apt-get install certbot python3-certbot-nginx
```

2. **Get certificate:**
```bash
sudo certbot certonly --nginx -d your-domain.com
```

3. **Update Nginx config:**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Your location blocks
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

4. **Auto-renewal:**
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 🔧 Environment Variables

### Production .env Example

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/chat-app

# JWT
JWT_SECRET=your-extremely-long-random-secret-key-at-least-32-characters
JWT_EXPIRE=7d

# OTP
OTP_EXPIRE=10
OTP_LENGTH=6

# Client
CLIENT_URL=https://your-domain.com

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com

# Twilio SMS (Optional)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/chat-app/app.log
```

---

## 📊 Monitoring & Logging

### Setup Logging with Winston

```javascript
// server/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

### Setup Error Tracking with Sentry

1. **Create Sentry account**
2. **Install Sentry SDK:**
```bash
npm install @sentry/node
```

3. **Initialize in server:**
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Setup Performance Monitoring

Use tools like:
- **New Relic**
- **Datadog**
- **CloudWatch** (AWS)
- **Stackdriver** (Google Cloud)

---

## ✅ Post-Deployment Checklist

- [ ] Backend is running and responding to requests
- [ ] Frontend is accessible and loads
- [ ] WebSocket connections work
- [ ] Database is accessible and backing up
- [ ] SSL certificate is valid
- [ ] CORS is properly configured
- [ ] Logging is working
- [ ] Error tracking is active
- [ ] Database has indexes
- [ ] Rate limiting is active
- [ ] All environment variables are set
- [ ] Monitoring alerts are configured

---

## 🚨 Troubleshooting

### Backend not responding
```bash
# Check if service is running
ps aux | grep node

# Check logs
tail -f logs/combined.log

# Restart service
pm2 restart chat-app
```

### Database connection issues
```bash
# Test connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/chat-app"

# Check network access
nc -zv host.mongodb.net 27017
```

### SSL certificate issues
```bash
# Check certificate expiration
openssl x509 -in /path/to/cert.pem -noout -dates

# Renew certificate
sudo certbot renew --force-renewal
```

---

## 📞 Support & Resources

- **Heroku Docs:** https://devcenter.heroku.com/
- **Railway Docs:** https://docs.railway.app/
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **Nginx:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **PM2:** https://pm2.keymetrics.io/docs/

---

**Happy Deploying! 🚀**

Last Updated: March 2026
