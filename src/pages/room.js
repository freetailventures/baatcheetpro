// ============================================
// Voice Chat Room Page
// ============================================
// This is where the actual voice chat happens!
// Uses LiveKit to stream audio between participants.

import { database, ref, set, remove, onValue, update } from '../firebase.js';
import {
    connectToRoom,
    toggleMicrophone,
    isMicMuted,
    getParticipants,
    leaveRoom,
    getCurrentRoom
} from '../livekit.js';

let participantsListener = null;

/**
 * Render the voice chat room page
 * @param {string} roomId - Firebase room ID
 * @param {string} roomName - Display name of the room
 * @param {Function} onLeave - Called when user leaves the room
 */
export function renderRoom(roomId, roomName, onLeave) {
    const app = document.getElementById('app');

    // Ask for the user's display name
    const userName = promptForName();
    if (!userName) {
        onLeave();
        return;
    }

    // Store the user name for this session
    sessionStorage.setItem('ybk_username', userName);

    app.innerHTML = `
    <div class="room-page">
      <!-- Room Header -->
      <div class="room-header">
        <div class="room-header-info">
          <h1>🔊 ${escapeHtml(roomName)}</h1>
          <p>
            <span class="live-dot"></span>
            <span id="participantCount">Connecting...</span>
          </p>
        </div>
      </div>

      <!-- Participants Grid -->
      <div class="participants-grid" id="participantsGrid">
        <div style="text-align: center; padding: 40px; grid-column: 1 / -1;">
          <div class="spinner" style="margin: 0 auto 12px;"></div>
          <p style="color: var(--text-muted);">Connecting to voice room...</p>
        </div>
      </div>

      <!-- Room Controls -->
      <div class="room-controls glass-card">
        <button class="control-btn control-btn-mic" id="micBtn" title="Toggle Microphone" disabled>
          🎤
        </button>
        <button class="control-btn control-btn-leave" id="leaveBtn" title="Leave Room">
          📞
        </button>
      </div>
    </div>
  `;

    // --- Connect to LiveKit ---
    initVoiceChat(roomId, roomName, userName, onLeave);
}

/**
 * Prompt user for their display name
 */
function promptForName() {
    const storedName = sessionStorage.getItem('ybk_username');
    if (storedName) return storedName;

    let name = null;
    while (!name) {
        name = prompt('Enter your display name for the voice chat:');
        if (name === null) return null; // User clicked cancel
        name = name.trim();
        if (!name) {
            alert('Please enter a valid name!');
            name = null;
        }
        if (name && name.length > 20) {
            alert('Name must be 20 characters or less!');
            name = null;
        }
    }
    return name;
}

/**
 * Initialize the voice chat connection
 */
async function initVoiceChat(roomId, roomName, userName, onLeave) {
    const micBtn = document.getElementById('micBtn');
    const leaveBtn = document.getElementById('leaveBtn');
    const participantsGrid = document.getElementById('participantsGrid');
    const participantCount = document.getElementById('participantCount');

    // Add ourselves to Firebase participants
    const userParticipantRef = ref(database, `rooms/${roomId}/participants/${userName}`);
    await set(userParticipantRef, {
        name: userName,
        joinedAt: Date.now()
    });

    try {
        // Connect to LiveKit
        const room = await connectToRoom(roomName, userName, {
            onParticipantJoined: (participant) => {
                updateParticipantsUI();
                showToast(`${participant.identity} joined! 👋`);
            },

            onParticipantLeft: (participant) => {
                updateParticipantsUI();
                showToast(`${participant.identity} left`);
            },

            onTrackSubscribed: (track, participant) => {
                updateParticipantsUI();
            },

            onActiveSpeakerChanged: (speakers) => {
                // Highlight speaking participants
                document.querySelectorAll('.participant-card').forEach(card => {
                    card.classList.remove('speaking');
                });
                speakers.forEach(speaker => {
                    const card = document.querySelector(`[data-identity="${speaker.identity}"]`);
                    if (card) card.classList.add('speaking');
                });
            },

            onDisconnected: () => {
                handleLeave(roomId, userName, onLeave);
            }
        });

        // Enable mic button
        micBtn.disabled = false;

        // Update UI with participants
        updateParticipantsUI();

    } catch (error) {
        console.error('Failed to connect to voice room:', error);
        participantsGrid.innerHTML = `
      <div style="text-align: center; padding: 40px; grid-column: 1 / -1;">
        <p style="color: var(--accent-red); font-size: 1.25rem; margin-bottom: 8px;">❌ Failed to connect</p>
        <p style="color: var(--text-muted);">${escapeHtml(error.message)}</p>
        <p style="color: var(--text-muted); margin-top: 8px;">Make sure the token server and LiveKit server are running.</p>
      </div>
    `;
    }

    // --- Mic toggle ---
    micBtn.addEventListener('click', async () => {
        const muted = await toggleMicrophone();
        micBtn.classList.toggle('muted', muted);
        micBtn.textContent = muted ? '🔇' : '🎤';
        micBtn.title = muted ? 'Unmute Microphone' : 'Mute Microphone';
        updateParticipantsUI();
    });

    // --- Leave room ---
    leaveBtn.addEventListener('click', async () => {
        await handleLeave(roomId, userName, onLeave);
    });

    // Listen to Firebase participants for count updates
    const participantsRef = ref(database, `rooms/${roomId}/participants`);
    participantsListener = onValue(participantsRef, (snapshot) => {
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        if (participantCount) {
            participantCount.textContent = `${count} participant${count !== 1 ? 's' : ''} in room`;
        }
    });
}

/**
 * Update the participants grid UI
 */
function updateParticipantsUI() {
    const grid = document.getElementById('participantsGrid');
    if (!grid) return;

    const participants = getParticipants();

    if (participants.length === 0) {
        grid.innerHTML = `
      <div style="text-align: center; padding: 40px; grid-column: 1 / -1;">
        <p style="color: var(--text-muted);">No participants yet...</p>
      </div>
    `;
        return;
    }

    grid.innerHTML = participants.map(p => {
        const isLocal = p === getCurrentRoom()?.localParticipant;
        const isMuted = isLocal ? isMicMuted() : !p.isMicrophoneEnabled;
        const initial = (p.identity || '?')[0].toUpperCase();
        const name = p.identity || 'Unknown';

        return `
      <div class="participant-card glass-card ${isMuted ? 'muted' : ''}" data-identity="${escapeHtml(name)}">
        <div class="participant-avatar">${initial}</div>
        <div class="participant-name">${escapeHtml(name)}${isLocal ? ' (You)' : ''}</div>
        <div class="participant-status">
          ${isMuted ? '🔇 Muted' : '🎤 Speaking'}
        </div>
      </div>
    `;
    }).join('');
}

/**
 * Handle leaving the room
 */
async function handleLeave(roomId, userName, onLeave) {
    // Remove from Firebase
    try {
        const userRef = ref(database, `rooms/${roomId}/participants/${userName}`);
        await remove(userRef);
    } catch (e) {
        console.error('Error removing participant from Firebase:', e);
    }

    // Unsubscribe Firebase listener
    if (participantsListener) {
        participantsListener();
        participantsListener = null;
    }

    // Disconnect from LiveKit
    await leaveRoom();

    // Navigate back to lobby
    onLeave();
}

/**
 * Cleanup room resources
 */
export function cleanupRoom() {
    if (participantsListener) {
        participantsListener();
        participantsListener = null;
    }
    leaveRoom();
}

// --- Utility ---

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
