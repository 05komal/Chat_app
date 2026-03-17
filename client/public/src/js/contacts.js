// client/src/js/contacts.js

import * as utils from './utils.js';

/**
 * Initialize contacts management
 */
export const initContactsManagement = (app) => {
  const newChatBtn = document.querySelector('[title="New chat"]');
  const menuBtn = document.querySelector('[title="Menu"]');

  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => showAddContactModal(app));
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => showMainMenu(app));
  }
};

/**
 * Show add contact modal
 */
const showAddContactModal = async (app) => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  modal.innerHTML = `
    <div class="modal-header">
      <h2>New Chat</h2>
      <button style="background: none; border: none; cursor: pointer; font-size: 1.5rem;">×</button>
    </div>
    
    <div class="modal-body">
      <div class="form-group">
        <label>Search for a contact</label>
        <input
          type="text"
          id="search-users-input"
          class="search-input"
          placeholder="Enter username or phone..."
          style="width: 100%;"
        />
      </div>
      
      <div id="search-results" style="margin-top: 1rem; max-height: 300px; overflow-y: auto;"></div>
    </div>
    
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
        Cancel
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on X button
  modal.querySelector('button').addEventListener('click', () => {
    overlay.remove();
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Search users
  const searchInput = document.getElementById('search-users-input');
  const resultsDiv = document.getElementById('search-results');

  if (searchInput) {
    const debouncedSearch = utils.debounce(async (query) => {
      if (!query) {
        resultsDiv.innerHTML = '';
        return;
      }

      resultsDiv.innerHTML = '<p style="text-align: center; color: var(--text-light);">Searching...</p>';

      try {
        const users = await app.searchUsers(query);

        if (users.length === 0) {
          resultsDiv.innerHTML = '<p style="text-align: center; color: var(--text-light);">No users found</p>';
          return;
        }

        resultsDiv.innerHTML = '';

        users.forEach((user) => {
          const userEl = document.createElement('div');
          userEl.className = 'card';
          userEl.style.marginBottom = '0.5rem';
          userEl.style.cursor = 'pointer';
          userEl.style.transition = 'var(--transition)';

          userEl.innerHTML = `
            <div class="flex-between">
              <div class="flex" style="gap: 1rem;">
                <div class="conversation-avatar" style="width: 40px; height: 40px; background: linear-gradient(135deg, 
                  ${utils.getAvatarColor(user.username || user.phone)}, 
                  ${utils.getAvatarColor(user.lastName || '')})">
                  ${utils.getInitials(user.firstName, user.lastName)}
                </div>
                <div>
                  <div style="font-weight: 600;">${user.firstName || user.username}</div>
                  <div style="font-size: 0.85rem; color: var(--text-light);">@${user.username || user.phone}</div>
                </div>
              </div>
              <button class="btn btn-sm btn-primary">
                ${user.isContact ? 'Remove' : 'Add'}
              </button>
            </div>
          `;

          userEl.querySelector('button').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (user.isContact) {
              // Remove contact
              const contact = app.contacts.find(c => c.contact._id === user._id);
              if (contact) {
                await app.deleteContact(contact._id);
              }
            } else {
              // Add contact
              const customName = prompt('Enter a name for this contact:', user.firstName || user.username);
              if (customName !== null) {
                const success = await app.addContact(user.username || user.phone, customName);
                if (success) {
                  userEl.querySelector('button').textContent = 'Remove';
                  userEl.querySelector('button').classList.remove('btn-primary');
                  userEl.querySelector('button').classList.add('btn-danger');
                }
              }
            }
          });

          userEl.addEventListener('click', () => {
            app.openConversation(user._id, user);
            overlay.remove();
          });

          resultsDiv.appendChild(userEl);
        });
      } catch (error) {
        console.error('Error searching users:', error);
        resultsDiv.innerHTML = '<p style="color: var(--danger-color);">Error searching users</p>';
      }
    }, 300);

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });

    searchInput.focus();
  }
};

/**
 * Show main menu
 */
const showMainMenu = (app) => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '300px';

  modal.innerHTML = `
    <div class="modal-header">
      <h3>Menu</h3>
      <button style="background: none; border: none; cursor: pointer; font-size: 1.5rem;">×</button>
    </div>
    
    <div class="modal-body">
      <button class="btn btn-outline" style="width: 100%; margin-bottom: 0.5rem; justify-content: flex-start;">
        <i class="fas fa-user"></i> Profile
      </button>
      <button class="btn btn-outline" style="width: 100%; margin-bottom: 0.5rem; justify-content: flex-start;">
        <i class="fas fa-users"></i> Contacts
      </button>
      <button class="btn btn-outline" style="width: 100%; margin-bottom: 0.5rem; justify-content: flex-start;">
        <i class="fas fa-ban"></i> Blocked Users
      </button>
      <button class="btn btn-outline" style="width: 100%; margin-bottom: 0.5rem; justify-content: flex-start;">
        <i class="fas fa-cog"></i> Settings
      </button>
      <button class="btn btn-outline" style="width: 100%; margin-bottom: 0.5rem; justify-content: flex-start;">
        <i class="fas fa-moon"></i> Dark Mode
      </button>
      <hr style="border: none; border-top: 1px solid var(--border-color); margin: 1rem 0;">
      <button id="logout-btn" class="btn btn-danger" style="width: 100%; justify-content: flex-start;">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on X button
  modal.querySelector('button').addEventListener('click', () => {
    overlay.remove();
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Menu actions
  const buttons = modal.querySelectorAll('button');
  buttons[1]?.addEventListener('click', () => showProfileModal(app)); // Profile
  buttons[2]?.addEventListener('click', () => showContactsModal(app)); // Contacts
  buttons[3]?.addEventListener('click', () => showBlockedUsersModal(app)); // Blocked
  buttons[4]?.addEventListener('click', () => showSettingsModal(app)); // Settings
  buttons[5]?.addEventListener('click', () => toggleDarkMode()); // Dark mode
  buttons[6]?.addEventListener('click', () => {
    overlay.remove();
    app.logout();
  }); // Logout
};

/**
 * Show profile modal
 */
const showProfileModal = async (app) => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  const user = app.currentUser;

  modal.innerHTML = `
    <div class="modal-header">
      <h2>Profile</h2>
      <button style="background: none; border: none; cursor: pointer; font-size: 1.5rem;">×</button>
    </div>
    
    <div class="modal-body">
      <div style="text-align: center; margin-bottom: 2rem;">
        <div class="conversation-avatar" style="width: 80px; height: 80px; margin: 0 auto 1rem; font-size: 2rem; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));">
          ${utils.getInitials(user.firstName, user.lastName)}
        </div>
        <h3>${user.firstName} ${user.lastName}</h3>
        <p style="color: var(--text-light);">@${user.username || 'username'}</p>
      </div>

      <div class="form-group">
        <label>Phone</label>
        <input type="text" value="${user.phone}" disabled />
      </div>

      <div class="form-group">
        <label>Username</label>
        <input type="text" id="username-input" value="${user.username || ''}" />
      </div>

      <div class="form-group">
        <label>First Name</label>
        <input type="text" id="firstName-input" value="${user.firstName || ''}" />
      </div>

      <div class="form-group">
        <label>Last Name</label>
        <input type="text" id="lastName-input" value="${user.lastName || ''}" />
      </div>

      <div class="form-group">
        <label>Bio</label>
        <textarea id="bio-input" rows="3">${user.bio || ''}</textarea>
      </div>

      <div id="profile-error" class="auth-error"></div>
    </div>
    
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      <button id="save-profile-btn" class="btn btn-primary">Save Changes</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on X button
  modal.querySelector('button').addEventListener('click', () => {
    overlay.remove();
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Save profile
  document.getElementById('save-profile-btn').addEventListener('click', async () => {
    const errorDiv = document.getElementById('profile-error');
    const username = document.getElementById('username-input').value;
    const firstName = document.getElementById('firstName-input').value;
    const lastName = document.getElementById('lastName-input').value;
    const bio = document.getElementById('bio-input').value;

    try {
      const success = await app.updateProfile({
        username,
        firstName,
        lastName,
        bio,
      });

      if (success) {
        utils.showNotification('Profile updated successfully!', 'success');
        overlay.remove();
      }
    } catch (error) {
      if (errorDiv) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('show');
      }
    }
  });
};

/**
 * Show contacts modal
 */
const showContactsModal = (app) => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  modal.innerHTML = `
    <div class="modal-header">
      <h2>My Contacts (${app.contacts.length})</h2>
      <button style="background: none; border: none; cursor: pointer; font-size: 1.5rem;">×</button>
    </div>
    
    <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
      <div id="contacts-list"></div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on X button
  modal.querySelector('button').addEventListener('click', () => {
    overlay.remove();
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Render contacts
  const contactsList = document.getElementById('contacts-list');
  if (app.contacts.length === 0) {
    contactsList.innerHTML = '<p style="text-align: center; color: var(--text-light);">No contacts yet</p>';
    return;
  }

  app.contacts.forEach((contact) => {
    const contactEl = document.createElement('div');
    contactEl.className = 'card';
    contactEl.style.marginBottom = '0.5rem';

    const user = contact.contact;

    contactEl.innerHTML = `
      <div class="flex-between">
        <div class="flex" style="gap: 0.75rem; align-items: center;">
          <div class="conversation-avatar" style="width: 40px; height: 40px; background: linear-gradient(135deg, 
            ${utils.getAvatarColor(user.username || user.phone)}, 
            ${utils.getAvatarColor(user.lastName || '')})">
            ${utils.getInitials(user.firstName, user.lastName)}
          </div>
          <div>
            <div style="font-weight: 600;">${contact.customName || user.firstName}</div>
            <div style="font-size: 0.85rem; color: var(--text-light);">@${user.username || user.phone}</div>
          </div>
        </div>
        <div class="flex" style="gap: 0.5rem;">
          <button class="btn btn-sm btn-secondary" data-contact-id="${contact._id}">Delete</button>
        </div>
      </div>
    `;

    contactEl.querySelector('button').addEventListener('click', async () => {
      if (await app.deleteContact(contact._id)) {
        contactEl.remove();
      }
    });

    contactsList.appendChild(contactEl);
  });
};

/**
 * Show blocked users modal
 */
const showBlockedUsersModal = (app) => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  modal.innerHTML = `
    <div class="modal-header">
      <h2>Blocked Users</h2>
      <button style="background: none; border: none; cursor: pointer; font-size: 1.5rem;">×</button>
    </div>
    
    <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
      <div id="blocked-list"></div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on X button
  modal.querySelector('button').addEventListener('click', () => {
    overlay.remove();
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Render blocked users (placeholder)
  const blockedList = document.getElementById('blocked-list');
  blockedList.innerHTML = '<p style="text-align: center; color: var(--text-light);">No blocked users</p>';
};

/**
 * Show settings modal
 */
const showSettingsModal = (app) => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  modal.innerHTML = `
    <div class="modal-header">
      <h2>Settings</h2>
      <button style="background: none; border: none; cursor: pointer; font-size: 1.5rem;">×</button>
    </div>
    
    <div class="modal-body">
      <div style="margin-bottom: 1rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="checkbox" id="notifications-toggle" checked />
          Enable notifications
        </label>
      </div>

      <div style="margin-bottom: 1rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="checkbox" id="sounds-toggle" checked />
          Enable sounds
        </label>
      </div>

      <div style="margin-bottom: 1rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="checkbox" id="online-status-toggle" checked />
          Show online status
        </label>
      </div>
    </div>
    
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Close</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on X button
  modal.querySelector('button').addEventListener('click', () => {
    overlay.remove();
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
};

/**
 * Toggle dark mode
 */
const toggleDarkMode = () => {
  document.body.classList.toggle('dark-mode');
  utils.storage.set('darkMode', document.body.classList.contains('dark-mode'));
};

export default { initContactsManagement };
