// client/src/js/utils.js

/**
 * Format date and time
 */
export const formatTime = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diffTime = now - d;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today - show time
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
};

/**
 * Format message time (with timestamp)
 */
export const formatMessageTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format last seen
 */
export const formatLastSeen = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diffTime = now - d;
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
};

/**
 * Get initials from name
 */
export const getInitials = (firstName = '', lastName = '') => {
  const first = firstName.charAt(0) || '?';
  const last = lastName.charAt(0) || '';
  return (first + last).toUpperCase();
};

/**
 * Generate avatar color based on name
 */
export const getAvatarColor = (name) => {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^\+?1?\d{9,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Format phone number for display
 */
export const formatPhoneDisplay = (phone) => {
  // Remove non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Remove leading 1 for US numbers
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    cleaned = cleaned.slice(1);
  }

  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

/**
 * Get password strength message
 */
export const getPasswordStrengthMessage = (password) => {
  if (!password) return '';
  if (password.length < 6) return 'Too short';
  if (!/[A-Z]/.test(password)) return 'Add uppercase letter';
  if (!/[a-z]/.test(password)) return 'Add lowercase letter';
  if (!/[0-9]/.test(password)) return 'Add number';
  return 'Strong';
};

/**
 * Show notification
 */
export const showNotification = (message, type = 'info', duration = 3000) => {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `alert alert-${type}`;
  notification.textContent = message;

  // Add to page
  const container = document.body;
  container.appendChild(notification);

  // Auto remove
  if (duration > 0) {
    setTimeout(() => {
      notification.remove();
    }, duration);
  }

  return notification;
};

/**
 * Escape HTML to prevent XSS
 */
export const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Linkify URLs in text
 */
export const linkifyUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener">${url}</a>`;
  });
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = (text) => {
  return navigator.clipboard.writeText(text).then(() => {
    showNotification('Copied to clipboard', 'success', 2000);
    return true;
  }).catch(() => {
    showNotification('Failed to copy', 'danger', 2000);
    return false;
  });
};

/**
 * Get OS type
 */
export const getOS = () => {
  const userAgent = window.navigator.userAgent;
  if (userAgent.indexOf('Win') > -1) return 'Windows';
  if (userAgent.indexOf('Mac') > -1) return 'MacOS';
  if (userAgent.indexOf('Linux') > -1) return 'Linux';
  if (userAgent.indexOf('Android') > -1) return 'Android';
  if (userAgent.indexOf('like Mac') > -1) return 'iOS';
  return 'Unknown';
};

/**
 * Is mobile device
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Store in local storage
 */
export const storage = {
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get: (key) => {
    const value = localStorage.getItem(key);
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return value;
    }
  },
  remove: (key) => {
    localStorage.removeItem(key);
  },
  clear: () => {
    localStorage.clear();
  },
};

/**
 * Make API request with timeout
 */
export const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
};

export default {
  formatTime,
  formatMessageTime,
  formatLastSeen,
  getInitials,
  getAvatarColor,
  validatePhone,
  formatPhoneDisplay,
  validatePassword,
  getPasswordStrengthMessage,
  showNotification,
  escapeHtml,
  linkifyUrls,
  debounce,
  throttle,
  copyToClipboard,
  getOS,
  isMobileDevice,
  storage,
  fetchWithTimeout,
};
