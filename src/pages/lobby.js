// ============================================
// Room Lobby Page
// ============================================
// Shows the list of active voice rooms.
// Users can create new rooms or join existing ones.

import { database, ref, push, set, onValue, remove, get } from '../firebase.js';

// Store the Firebase listener so we can unsubscribe later
let roomsListener = null;

/**
 * Render the lobby page
 * @param {Function} onJoinRoom - Called when user clicks "Join" on a room (receives roomId, roomName)
 * @param {Function} onLogout - Called when user clicks logout
 */
export function renderLobby(onJoinRoom, onLogout) {
    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="lobby-page">
      <!-- Header -->
      <div class="lobby-header">
        <div class="lobby-header-left">
          <h1>🎙️ Yaha Baat Karo</h1>
          <p>Create or join a voice room to start talking</p>
        </div>
        <button class="btn btn-secondary" id="logoutBtn">🚪 Log Out</button>
      </div>

      <!-- Create Room -->
      <div class="create-room-section">
        <form class="create-room-form" id="createRoomForm">
          <input 
            type="text" 
            class="input-field" 
            id="roomNameInput" 
            placeholder="Enter room name (e.g., Chill Zone)" 
            maxlength="40"
            autocomplete="off"
          />
          <button type="submit" class="btn btn-primary" id="createRoomBtn">
            ✨ Create Room
          </button>
        </form>
        <div class="error-msg" id="createError">
          <span>⚠️</span>
          <span id="createErrorText">Error</span>
        </div>
      </div>

      <!-- Room List -->
      <div class="rooms-section">
        <div class="rooms-section-title">
          <span>🔊 Active Rooms</span>
          <span id="roomCount"></span>
        </div>
        <div id="roomsList" class="rooms-grid">
          <!-- Rooms will be loaded here -->
        </div>
      </div>
    </div>
  `;

    // --- Event Listeners ---

    const createForm = document.getElementById('createRoomForm');
    const roomNameInput = document.getElementById('roomNameInput');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const createError = document.getElementById('createError');
    const createErrorText = document.getElementById('createErrorText');

    // Handle room creation
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const roomName = roomNameInput.value.trim();
        if (!roomName) {
            showCreateError('Please enter a room name');
            return;
        }

        createRoomBtn.disabled = true;
        createRoomBtn.innerHTML = '<div class="spinner"></div> Creating...';

        try {
            // Create a new room in Firebase
            const roomsRef = ref(database, 'rooms');
            const newRoomRef = push(roomsRef);
            await set(newRoomRef, {
                name: roomName,
                createdBy: roomName.split(' ')[0], // Use first word as creator name
                createdAt: Date.now(),
                participants: {}
            });

            // Clear input
            roomNameInput.value = '';
            createError.classList.remove('visible');

            // Show toast
            showToast(`Room "${roomName}" created! 🎉`);
        } catch (error) {
            console.error('Error creating room:', error);
            showCreateError('Failed to create room. Try again.');
        } finally {
            createRoomBtn.disabled = false;
            createRoomBtn.innerHTML = '✨ Create Room';
        }
    });

    // Clear error when typing
    roomNameInput.addEventListener('input', () => {
        createError.classList.remove('visible');
    });

    // Handle logout
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('ybk_authenticated');
        if (roomsListener) {
            roomsListener();
            roomsListener = null;
        }
        onLogout();
    });

    // --- Load rooms from Firebase (real-time) ---
    loadRooms(onJoinRoom);
}

/**
 * Listen to rooms in Firebase and render them in real-time
 */
function loadRooms(onJoinRoom) {
    const roomsRef = ref(database, 'rooms');

    roomsListener = onValue(roomsRef, (snapshot) => {
        const roomsList = document.getElementById('roomsList');
        const roomCount = document.getElementById('roomCount');

        if (!roomsList) return;

        if (!snapshot.exists()) {
            roomCount.textContent = '';
            roomsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎧</div>
          <p class="empty-state-text">No active rooms yet</p>
          <p class="empty-state-hint">Create the first room above!</p>
        </div>
      `;
            return;
        }

        const rooms = snapshot.val();
        const roomIds = Object.keys(rooms);
        roomCount.textContent = `(${roomIds.length})`;

        roomsList.innerHTML = roomIds.map(roomId => {
            const room = rooms[roomId];
            const participantCount = room.participants ? Object.keys(room.participants).length : 0;
            const createdAgo = getTimeAgo(room.createdAt);

            return `
        <div class="room-card glass-card" data-room-id="${roomId}">
          <div class="room-card-header">
            <span class="room-card-name">${escapeHtml(room.name)}</span>
            <span class="room-card-status">
              <span class="dot"></span>
              ${participantCount} online
            </span>
          </div>
          <div class="room-card-meta">
            <span class="room-card-creator">👤 ${escapeHtml(room.createdBy)} · ${createdAgo}</span>
            <button class="btn btn-primary join-room-btn" data-room-id="${roomId}" data-room-name="${escapeHtml(room.name)}">
              Join →
            </button>
          </div>
        </div>
      `;
        }).join('');

        // Add click listeners to join buttons
        document.querySelectorAll('.join-room-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const roomId = btn.dataset.roomId;
                const roomName = btn.dataset.roomName;
                // Unsubscribe from rooms listener when leaving lobby
                if (roomsListener) {
                    roomsListener();
                    roomsListener = null;
                }
                onJoinRoom(roomId, roomName);
            });
        });
    });
}

/**
 * Cleanup the lobby (unsubscribe listeners)
 */
export function cleanupLobby() {
    if (roomsListener) {
        roomsListener();
        roomsListener = null;
    }
}

// --- Utility Functions ---

function showCreateError(message) {
    const createError = document.getElementById('createError');
    const createErrorText = document.getElementById('createErrorText');
    if (createError && createErrorText) {
        createErrorText.textContent = message;
        createError.classList.add('visible');
    }
}

function showToast(message) {
    // Remove any existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
