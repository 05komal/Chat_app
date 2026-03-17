// client/src/js/messages.js

import * as utils from './utils.js';

let typingTimeout = null;

/**
 * Initialize chat interface
 */
export const initChatInterface = (app) => {
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const searchInput = document.getElementById('search-input');

  if (!messageInput || !sendBtn) return;

  // Auto-resize textarea
  messageInput.addEventListener('input', (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';

    // Send typing indicator
    app.sendTypingIndicator();

    // Debounce typing stop
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      app.sendTypingStopIndicator();
    }, 2000);
  });

  // Send message on Enter
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(app, messageInput);
    }
  });

  // Send button click
  sendBtn.addEventListener('click', () => {
    handleSendMessage(app, messageInput);
  });

  // Search conversations
  if (searchInput) {
    const debouncedSearch = utils.debounce((query) => {
      handleSearchConversations(app, query);
    }, 300);

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
  }

  // Render initial conversations
  renderConversationsList(app);
};

/**
 * Handle sending message
 */
const handleSendMessage = (app, input) => {
  const content = input.value.trim();

  if (!content || !app.currentChat) {
    input.focus();
    return;
  }

  // Clear input
  input.value = '';
  input.style.height = 'auto';

  // Send message
  app.sendMessage(content);
};

/**
 * Render conversations list
 */
export const renderConversationsList = (app) => {
  const list = document.getElementById('conversations-list');
  if (!list) return;

  list.innerHTML = '';

  if (app.conversations.length === 0) {
    list.innerHTML = '<li style="padding: 2rem; text-align: center; color: var(--text-light);">No conversations yet</li>';
    return;
  }

  app.conversations.forEach((conv) => {
    const li = document.createElement('li');
    li.className = 'conversation-item';
    if (app.currentChat?.id === conv.contact._id) {
      li.classList.add('active');
    }

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'conversation-avatar';
    avatar.textContent = utils.getInitials(conv.contact.firstName, conv.contact.lastName);
    avatar.style.background = `linear-gradient(135deg, ${utils.getAvatarColor(
      conv.contact.username || conv.contact.phone
    )}, ${utils.getAvatarColor(conv.contact.lastName || '')})`;

    // Status indicator
    if (conv.contact.status === 'online' || conv.contact.status === 'away') {
      const indicator = document.createElement('div');
      indicator.className = `status-indicator status-${conv.contact.status}`;
      avatar.appendChild(indicator);
    }

    li.appendChild(avatar);

    // Info
    const info = document.createElement('div');
    info.className = 'conversation-info';

    const name = document.createElement('div');
    name.className = 'conversation-name';
    name.textContent = conv.customName || conv.contact.username || conv.contact.firstName;

    const preview = document.createElement('div');
    preview.className = 'conversation-preview';
    if (conv.lastMessage) {
      const prefix = conv.lastMessage.sender === app.currentUser._id ? 'You: ' : '';
      preview.textContent = prefix + (conv.lastMessage.content || '[Media]');
    } else {
      preview.textContent = 'No messages yet';
    }

    info.appendChild(name);
    info.appendChild(preview);
    li.appendChild(info);

    // Meta
    const meta = document.createElement('div');
    meta.className = 'conversation-meta';

    if (conv.lastMessage) {
      const time = document.createElement('div');
      time.className = 'conversation-time';
      time.textContent = utils.formatTime(conv.lastMessageTime);
      meta.appendChild(time);
    }

    if (conv.unreadCount > 0) {
      const badge = document.createElement('div');
      badge.className = 'conversation-unread';
      badge.textContent = conv.unreadCount > 99 ? '99+' : conv.unreadCount;
      meta.appendChild(badge);
    }

    li.appendChild(meta);

    // Click handler
    li.addEventListener('click', () => {
      app.openConversation(conv.contact._id, conv.contact);
      renderConversationsList(app);
    });

    // Context menu (optional)
    li.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showConversationMenu(app, conv);
    });

    list.appendChild(li);
  });
};

/**
 * Handle search conversations
 */
const handleSearchConversations = (app, query) => {
  const list = document.getElementById('conversations-list');
  if (!list) return;

  if (!query) {
    renderConversationsList(app);
    return;
  }

  const filtered = app.conversations.filter((conv) => {
    const searchLower = query.toLowerCase();
    return (
      (conv.customName && conv.customName.toLowerCase().includes(searchLower)) ||
      (conv.contact.username && conv.contact.username.toLowerCase().includes(searchLower)) ||
      (conv.contact.firstName && conv.contact.firstName.toLowerCase().includes(searchLower)) ||
      (conv.contact.lastName && conv.contact.lastName.toLowerCase().includes(searchLower))
    );
  });

  list.innerHTML = '';

  if (filtered.length === 0) {
    list.innerHTML = '<li style="padding: 2rem; text-align: center; color: var(--text-light);">No conversations found</li>';
    return;
  }

  filtered.forEach((conv) => {
    const li = document.createElement('li');
    li.className = 'conversation-item';
    if (app.currentChat?.id === conv.contact._id) {
      li.classList.add('active');
    }

    li.innerHTML = `
      <div class="conversation-avatar" style="background: linear-gradient(135deg, 
        ${utils.getAvatarColor(conv.contact.username || conv.contact.phone)}, 
        ${utils.getAvatarColor(conv.contact.lastName || '')})">
        ${utils.getInitials(conv.contact.firstName, conv.contact.lastName)}
        ${conv.contact.status === 'online' ? '<div class="status-indicator status-online"></div>' : ''}
      </div>
      <div class="conversation-info">
        <div class="conversation-name">${conv.customName || conv.contact.username || conv.contact.firstName}</div>
        <div class="conversation-preview">${
          conv.lastMessage?.content || 'No messages yet'
        }</div>
      </div>
      <div class="conversation-meta">
        <div class="conversation-time">${utils.formatTime(conv.lastMessageTime)}</div>
        ${conv.unreadCount > 0 ? `<div class="conversation-unread">${conv.unreadCount}</div>` : ''}
      </div>
    `;

    li.addEventListener('click', () => {
      app.openConversation(conv.contact._id, conv.contact);
      renderConversationsList(app);
    });

    list.appendChild(li);
  });
};

/**
 * Show conversation context menu
 */
const showConversationMenu = (app, conversation) => {
  // Create simple menu (can be enhanced with modal)
  const actions = [
    { label: 'Mark as read', action: () => markAsRead(app, conversation) },
    { label: 'Delete conversation', action: () => deleteConversation(app, conversation) },
    { label: 'Block user', action: () => blockUser(app, conversation.contact._id) },
  ];

  console.log('Menu actions available:', actions);
  // TODO: Implement actual menu UI
};

/**
 * Mark conversation as read
 */
const markAsRead = (app, conversation) => {
  const messages = conversation.lastMessage;
  if (messages && messages.status !== 'read') {
    // Implement mark as read
  }
};

/**
 * Delete conversation
 */
const deleteConversation = async (app, conversation) => {
  if (!confirm('Delete this conversation?')) return;
  // Implement delete conversation
};

/**
 * Block user
 */
const blockUser = async (app, userId) => {
  if (!confirm('Block this user? You won\'t be able to message them.')) return;
  try {
    const response = await app.searchUsers(''); // Use app's method
    // Implement block user
  } catch (error) {
    utils.showNotification('Error blocking user', 'danger');
  }
};

/**
 * Format message for display
 */
export const formatMessageForDisplay = (message) => {
  let text = utils.escapeHtml(message.content);
  text = utils.linkifyUrls(text);
  return text;
};

/**
 * Update message status in UI
 */
export const updateMessageStatus = (messageId, status) => {
  const messages = document.querySelectorAll('[data-message-id]');
  messages.forEach((msg) => {
    if (msg.dataset.messageId === messageId) {
      const statusEl = msg.querySelector('.message-status');
      if (statusEl) {
        const icons = {
          sent: '✓',
          delivered: '✓✓',
          read: '✓✓',
        };
        statusEl.textContent = icons[status] || '○';
      }
    }
  });
};

/**
 * Get unread count
 */
export const getUnreadCount = (conversations) => {
  return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
};

/**
 * Update document title with unread count
 */
export const updateDocumentTitle = (unreadCount) => {
  if (unreadCount > 0) {
    document.title = `(${unreadCount}) ChatApp`;
  } else {
    document.title = 'ChatApp';
  }
};

export default { initChatInterface, renderConversationsList };
