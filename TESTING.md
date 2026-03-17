# 🧪 Testing Guide - Chat App

Complete testing guide covering unit tests, integration tests, and E2E tests.

## Table of Contents
1. [Unit Testing](#unit-testing)
2. [Integration Testing](#integration-testing)
3. [E2E Testing](#e2e-testing)
4. [API Testing](#api-testing)
5. [Performance Testing](#performance-testing)
6. [Manual Testing Checklist](#manual-testing-checklist)

---

## 🧩 Unit Testing

### Setup Jest for Backend

**Install dependencies:**
```bash
cd server
npm install --save-dev jest @types/jest
```

**Create `jest.config.js`:**
```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
    '!**/*.test.js',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

**Update `package.json` scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Example Unit Tests

**`server/utils/__tests__/jwt.test.js`:**
```javascript
const { generateToken, verifyToken } = require('../jwt');

describe('JWT Utils', () => {
  describe('generateToken', () => {
    it('should generate a valid token', () => {
      const token = generateToken('user123');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateToken('user1');
      const token2 = generateToken('user2');
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken('user123');
      const decoded = verifyToken(token);
      expect(decoded.id).toBe('user123');
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMiLCJpYXQiOjE1MTYyMzkwMjJ9.invalid';
      const decoded = verifyToken(expiredToken);
      expect(decoded).toBeNull();
    });
  });
});
```

**`server/utils/__tests__/otp.test.js`:**
```javascript
const { generateOTP, storeOTP, verifyOTP } = require('../otp');

describe('OTP Utils', () => {
  describe('generateOTP', () => {
    it('should generate 6-digit OTP', () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate different OTPs', () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('storeOTP', () => {
    it('should store OTP for phone', () => {
      const phone = '+1234567890';
      const otp = generateOTP();
      storeOTP(phone, otp, 10);
      // Verify it was stored (implementation specific)
    });
  });

  describe('verifyOTP', () => {
    it('should verify correct OTP', () => {
      const phone = '+1234567890';
      const otp = generateOTP();
      storeOTP(phone, otp, 10);
      const result = verifyOTP(phone, otp);
      expect(result.success).toBe(true);
    });

    it('should reject incorrect OTP', () => {
      const phone = '+1234567890';
      storeOTP(phone, '123456', 10);
      const result = verifyOTP(phone, '999999');
      expect(result.success).toBe(false);
    });
  });
});
```

**Run tests:**
```bash
npm test
npm run test:coverage
```

---

## 🔗 Integration Testing

### Setup Supertest

**Install:**
```bash
npm install --save-dev supertest
```

**Example integration test:**

**`server/__tests__/auth.integration.test.js`:**
```javascript
const request = require('supertest');
const { app, server } = require('../index');
const User = require('../models/User');
const { generateOTP, storeOTP } = require('../utils/otp');

describe('Authentication Integration', () => {
  beforeAll(async () => {
    // Connect to test database
  });

  afterAll(async () => {
    // Close connections
    server.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phone: '+1234567890',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject duplicate phone', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          phone: '+1234567890',
          firstName: 'Jane',
          lastName: 'Doe',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should verify OTP and create account', async () => {
      const phone = '+9876543210';
      const otp = generateOTP();
      
      // Register first
      await request(app)
        .post('/api/auth/register')
        .send({ phone, firstName: 'Test', lastName: 'User' });

      // Store OTP
      storeOTP(phone, otp, 10);

      // Verify
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone,
          otp,
          password: 'Test@1234',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.token).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '+1234567890',
          password: 'Test@1234',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '+1234567890',
          password: 'wrongpassword',
        });

      expect(response.statusCode).toBe(401);
    });
  });
});
```

---

## 🎭 E2E Testing

### Setup with Playwright

**Install:**
```bash
npm install --save-dev @playwright/test
```

**Create `playwright.config.js`:**
```javascript
module.exports = {
  testDir: 'tests/e2e',
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
};
```

**Example E2E test:**

**`tests/e2e/auth.spec.js`:**
```javascript
const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test('should register a new user', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Click sign up link
    await page.click('text=Sign up here');

    // Fill registration form
    await page.fill('#register-phone', '+1234567890');
    await page.fill('#register-firstName', 'John');
    await page.fill('#register-lastName', 'Doe');

    // Submit
    await page.click('#register-btn');

    // Should navigate to OTP page
    await expect(page).toHaveURL(/.*otp/);
  });

  test('should complete OTP verification', async ({ page }) => {
    // Navigate to registration
    await page.goto('/');
    await page.click('text=Sign up here');

    // Fill and submit registration
    await page.fill('#register-phone', '+1234567890');
    await page.fill('#register-firstName', 'Jane');
    await page.fill('#register-lastName', 'Doe');
    await page.click('#register-btn');

    // Enter OTP (get from server logs in test)
    // This would require API mocking or test data setup
    const otpInputs = page.locator('.otp-input');
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(String(i + 1));
    }

    // Enter password
    await page.fill('#otp-password', 'Test@1234');

    // Submit
    await page.click('#otp-btn');

    // Should navigate to chat
    await expect(page).toHaveURL(/.*chat/);
  });

  test('should login with credentials', async ({ page }) => {
    // Navigate to login
    await page.goto('/');

    // Fill login form
    await page.fill('#login-phone', '+1234567890');
    await page.fill('#login-password', 'Test@1234');

    // Submit
    await page.click('#login-btn');

    // Should navigate to chat
    await expect(page).toHaveURL(/.*chat/);
  });
});

test.describe('Chat Features', () => {
  test('should send and receive message', async ({ page, context }) => {
    // Login first user
    await page.goto('/');
    await page.fill('#login-phone', '+1234567890');
    await page.fill('#login-password', 'Test@1234');
    await page.click('#login-btn');
    await page.waitForNavigation();

    // Open second user's page in new tab
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.fill('#login-phone', '+9876543210');
    await page2.fill('#login-password', 'Test@5678');
    await page2.click('#login-btn');
    await page2.waitForNavigation();

    // First user sends message
    await page.fill('#message-input', 'Hello!');
    await page.click('#send-btn');

    // Second user should receive it
    await expect(page2.locator('text=Hello!')).toBeVisible({ timeout: 5000 });
  });

  test('should display typing indicator', async ({ page }) => {
    // Login and open chat
    await page.goto('/');
    await page.fill('#login-phone', '+1234567890');
    await page.fill('#login-password', 'Test@1234');
    await page.click('#login-btn');

    // Select a conversation
    const firstConversation = page.locator('.conversation-item').first();
    await firstConversation.click();

    // Start typing
    await page.fill('#message-input', 'Test...');

    // Typing indicator should appear
    await expect(page.locator('text=is typing')).toBeVisible({ timeout: 5000 });
  });
});
```

**Run E2E tests:**
```bash
npx playwright test
npx playwright test --ui
npx playwright test --debug
```

---

## 📡 API Testing

### Using Postman

**Import collection:**
1. Open Postman
2. Create new collection "Chat App API"
3. Add requests for each endpoint

**Example requests:**

**Register:**
```
POST /api/auth/register
Content-Type: application/json

{
  "phone": "+1234567890",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login:**
```
POST /api/auth/login
Content-Type: application/json

{
  "phone": "+1234567890",
  "password": "Test@1234"
}
```

**Send Message:**
```
POST /api/messages
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "recipientId": "user-id",
  "content": "Hello!"
}
```

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","firstName":"John"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","password":"Test@1234"}'

# Get profile
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Performance Testing

### Using Apache JMeter

**Test Plan:**

1. **Create Thread Group:**
   - Number of Threads: 100
   - Ramp-up Period: 10 seconds
   - Loop Count: 10

2. **Add HTTP Request:**
   - URL: `http://localhost:5000/api/messages/conversations`
   - Method: GET
   - Authorization header with token

3. **Add Listeners:**
   - View Results Tree
   - Aggregate Report
   - Graph Results

4. **Run Test:**
```bash
jmeter -n -t test-plan.jmx -l results.jtl -j jmeter.log
```

### Load Testing with k6

**Create `load-test.js`:**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  const url = 'http://localhost:5000/api/messages/conversations';
  const params = {
    headers: {
      'Authorization': `Bearer ${__ENV.TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const response = http.get(url, params);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

**Run test:**
```bash
k6 run --vus 10 --duration 30s load-test.js
```

---

## ✅ Manual Testing Checklist

### Authentication
- [ ] Register with phone number
- [ ] Receive OTP via email/SMS
- [ ] Verify OTP and create password
- [ ] Login with credentials
- [ ] Logout from app
- [ ] Session persists on page reload
- [ ] Invalid credentials show error
- [ ] Password validation works

### Messaging
- [ ] Send text message
- [ ] Receive real-time message
- [ ] Edit sent message
- [ ] Delete sent message
- [ ] See message delivery status
- [ ] See message read status
- [ ] Typing indicator appears
- [ ] Unread badge updates
- [ ] Scroll to load older messages

### Contacts
- [ ] Add new contact by username
- [ ] Add new contact by phone
- [ ] Search for contacts
- [ ] Mark contact as favorite
- [ ] Remove contact
- [ ] Block user
- [ ] Unblock user
- [ ] View contact profile

### UI/UX
- [ ] App is responsive on mobile
- [ ] App is responsive on tablet
- [ ] App is responsive on desktop
- [ ] No console errors
- [ ] No network errors
- [ ] Page loads in < 3 seconds
- [ ] Animations are smooth
- [ ] Dark mode works (if enabled)

### Performance
- [ ] Messages load quickly
- [ ] Contacts load quickly
- [ ] Search is responsive
- [ ] No lag on typing
- [ ] File uploads work
- [ ] Memory usage is acceptable

---

## 🎯 Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** 70%+ coverage
- **E2E Tests:** All critical paths
- **API Tests:** All endpoints

---

## 📚 Testing Tools Summary

| Tool | Purpose | Usage |
|------|---------|-------|
| Jest | Unit testing | `npm test` |
| Supertest | API testing | Integration tests |
| Playwright | E2E testing | `npx playwright test` |
| Postman | Manual API testing | GUI |
| cURL | API testing | Command line |
| JMeter | Load testing | GUI |
| k6 | Load testing | JavaScript |

---

**Happy Testing! 🧪**

Last Updated: March 2026
