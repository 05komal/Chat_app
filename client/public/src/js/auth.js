// client/src/js/auth.js

import api from './api.js';
import * as utils from './utils.js';

let otpTimer = null;
let otpCountdown = 600; // 10 minutes in seconds

/**
 * Setup login page
 */
const setupLogin = (app) => {
  const form = document.getElementById('login-form');
  const btn = document.getElementById('login-btn');
  const errorDiv = document.getElementById('error-message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value;

    // Normalize phone number - remove spaces, dashes, parentheses
    phone = phone.replace(/[\s\-()]/g, '');

    // Validate
    if (!utils.validatePhone(phone)) {
      showError(errorDiv, 'Please enter a valid phone number');
      return;
    }

    if (!password) {
      showError(errorDiv, 'Password is required');
      return;
    }

    // Disable button
    btn.disabled = true;
    btn.classList.add('loading');

    try {
      const response = await api.login(phone, password);

      if (response.success) {
        utils.showNotification('Login successful! 🎉', 'success');
        setTimeout(() => {
          app.loadChatInterface();
        }, 500);
      } else {
        showError(errorDiv, response.message || 'Login failed');
      }
    } catch (error) {
      showError(errorDiv, error.message);
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  });
};

/**
 * Setup register page
 */
const setupRegister = (app) => {
  const form = document.getElementById('register-form');
  const btn = document.getElementById('register-btn');
  const errorDiv = document.getElementById('register-error');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let phone = document.getElementById('register-phone').value.trim();
    const firstName = document.getElementById('register-firstName').value.trim();
    const lastName = document.getElementById('register-lastName').value.trim();

    // Normalize phone number - remove spaces, dashes, parentheses
    phone = phone.replace(/[\s\-()]/g, '');

    // Validate
    if (!utils.validatePhone(phone)) {
      showError(errorDiv, 'Please enter a valid phone number');
      return;
    }

    if (!firstName) {
      showError(errorDiv, 'First name is required');
      return;
    }

    // Disable button
    btn.disabled = true;
    btn.classList.add('loading');

    try {
      const response = await api.register(phone, firstName, lastName);

      if (response.success) {
        utils.showNotification('OTP sent to your phone! ✉️', 'success');
        // Go to OTP page
        app.goToOTPPage(phone, firstName, lastName);
      } else {
        showError(errorDiv, response.message || 'Registration failed');
      }
    } catch (error) {
      showError(errorDiv, error.message);
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  });
};

/**
 * Setup OTP verification page
 */
const setupOTP = (app, phone, firstName, lastName) => {
  const form = document.getElementById('otp-form');
  const btn = document.getElementById('otp-btn');
  const errorDiv = document.getElementById('otp-error');
  const phoneDisplay = document.getElementById('otp-phone');
  const inputs = document.getElementById('otp-inputs');

  if (!form) return;

  // Display phone
  if (phoneDisplay) {
    phoneDisplay.textContent = utils.formatPhoneDisplay(phone);
  }

  // Create OTP input fields
  createOTPInputs(inputs);

  // Start countdown timer
  startOTPTimer();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const otp = getOTPValue();
    const password = document.getElementById('otp-password').value;

    // Validate
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      showError(errorDiv, 'Please enter a valid 6-digit OTP');
      return;
    }

    if (!utils.validatePassword(password)) {
      showError(
        errorDiv,
        'Password must have: 6+ chars, uppercase, lowercase, number'
      );
      return;
    }

    // Disable button
    btn.disabled = true;
    btn.classList.add('loading');

    try {
      const response = await api.verifyOTP(phone, otp, password, firstName, lastName);

      if (response.success) {
        utils.showNotification('Account created successfully! 🎉', 'success');
        clearInterval(otpTimer);
        setTimeout(() => {
          app.loadChatInterface();
        }, 500);
      } else {
        showError(errorDiv, response.message || 'OTP verification failed');
      }
    } catch (error) {
      showError(errorDiv, error.message);
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  });

  // Monitor password strength
  const passwordInput = document.getElementById('otp-password');
  if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
      const strength = utils.getPasswordStrengthMessage(e.target.value);
      const strengthEl = document.getElementById('password-strength');
      if (strengthEl) {
        strengthEl.textContent = strength;
        strengthEl.style.color = strength === 'Strong' ? 'var(--success-color)' : 'var(--text-light)';
      }
    });
  }
};

/**
 * Create OTP input fields
 */
const createOTPInputs = (container) => {
  if (!container) return;

  for (let i = 0; i < 6; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'otp-input';
    input.maxLength = '1';
    input.inputMode = 'numeric';
    input.dataset.index = i;

    input.addEventListener('input', (e) => {
      // Only allow digits
      e.target.value = e.target.value.replace(/\D/g, '');

      // Move to next field
      if (e.target.value && i < 5) {
        const nextInput = container.children[i + 1];
        if (nextInput) nextInput.focus();
      }

      // Mark as filled
      if (e.target.value) {
        e.target.classList.add('filled');
      } else {
        e.target.classList.remove('filled');
      }

      // Auto submit if all filled
      const allFilled = Array.from(container.children).every(
        (el) => el.value.length === 1
      );
      if (allFilled) {
        const passwordInput = document.getElementById('otp-password');
        if (passwordInput && passwordInput.value) {
          document.getElementById('otp-form').dispatchEvent(
            new Event('submit')
          );
        }
      }
    });

    input.addEventListener('keydown', (e) => {
      // Handle backspace
      if (e.key === 'Backspace' && !e.target.value && i > 0) {
        const prevInput = container.children[i - 1];
        if (prevInput) prevInput.focus();
      }

      // Handle arrow keys
      if (e.key === 'ArrowRight' && i < 5) {
        const nextInput = container.children[i + 1];
        if (nextInput) nextInput.focus();
      }

      if (e.key === 'ArrowLeft' && i > 0) {
        const prevInput = container.children[i - 1];
        if (prevInput) prevInput.focus();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text');
      const digits = pastedData.replace(/\D/g, '').slice(0, 6);

      Array.from(container.children).forEach((el, idx) => {
        if (idx < digits.length) {
          el.value = digits[idx];
          el.classList.add('filled');
        } else {
          el.value = '';
          el.classList.remove('filled');
        }
      });

      if (digits.length === 6) {
        container.children[5].focus();
      }
    });

    container.appendChild(input);
  }

  // Focus first input
  if (container.children[0]) {
    container.children[0].focus();
  }
};

/**
 * Get OTP value from inputs
 */
const getOTPValue = () => {
  const inputs = document.querySelectorAll('.otp-input');
  return Array.from(inputs)
    .map((el) => el.value)
    .join('');
};

/**
 * Start OTP countdown timer
 */
const startOTPTimer = () => {
  const timerEl = document.getElementById('timer-count');
  const timerContainer = document.getElementById('otp-timer');
  const resendBtn = document.getElementById('resend-btn');
  
  otpCountdown = 600; // Reset to 10 minutes

  if (otpTimer) clearInterval(otpTimer);

  otpTimer = setInterval(() => {
    otpCountdown--;

    if (timerEl) {
      const minutes = Math.floor(otpCountdown / 60);
      const seconds = otpCountdown % 60;
      timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Check if expired
    if (otpCountdown <= 0) {
      clearInterval(otpTimer);
      if (timerContainer) {
        timerContainer.classList.add('expired');
        timerContainer.textContent = 'Code expired. Please request a new one.';
      }
      if (resendBtn) {
        resendBtn.disabled = false;
      }
    }

    // Enable resend button after 30 seconds
    if (otpCountdown <= 570 && otpCountdown > 0 && resendBtn) {
      resendBtn.disabled = false;
    }
  }, 1000);
};

/**
 * Show error message
 */
const showError = (errorDiv, message) => {
  if (!errorDiv) return;

  errorDiv.textContent = message;
  errorDiv.classList.add('show');

  // Auto hide after 5 seconds
  setTimeout(() => {
    errorDiv.classList.remove('show');
  }, 5000);
};

export const initAuthPages = {
  setupLogin,
  setupRegister,
  setupOTP,
};

export default initAuthPages;