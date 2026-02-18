import { connectToRoom } from '../livekit.js';
import { ref, set, remove, onDisconnect } from 'firebase/database';
import { database } from '../firebase.js';

export async function renderRoom(roomId, roomName, onLeaveRoom) {
    const container = document.getElementById('app');

    container.innerHTML = `
        <div class="room-layout fade-in">
            <header class="room-header glass-card">
                <div>
                    <h3>🔥 ${roomName}</h3>
                    <div class="room-subtitle-text">LIVE AUDIO</div>
                </div>
                <span id="connection-status" class="status-badge connecting">Connecting…</span>
            </header>

            <div id="participants-grid" class="participants-grid">
                <!-- Avatars appear here -->
            </div>

            <div id="online-count-bar" class="online-count" style="display:none;">
                <span class="dot"></span>
                <span id="online-count-text">0 users online</span>
            </div>
        </div>

        <div class="controls-bar">
            <button id="volume-btn" class="control-btn" title="Volume">🔊</button>
            <button id="mic-btn" class="control-btn" title="Toggle Mic">🎤</button>
            <button id="ludo-btn" class="control-btn" title="Play Ludo">🎲</button>
            <button id="leave-btn" class="control-btn end-call" title="Leave">📞</button>
        </div>
    `;

    // Connection state
    const statusBadge = document.getElementById('connection-status');
    const participantsGrid = document.getElementById('participants-grid');
    const onlineCountBar = document.getElementById('online-count-bar');
    const onlineCountText = document.getElementById('online-count-text');

    let livekitRoom = null;
    let isMuted = false;

    // Random identity
    const identity = 'User-' + Math.floor(1000 + Math.random() * 9000);

    // Firebase presence
    const metaRef = ref(database, `rooms-meta/${roomId}/participants`);

    function getInitials(name) {
        return name
            .split(/[\s\-]+/)
            .map(w => w.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    function renderParticipants(participants) {
        if (!participantsGrid) return;

        participantsGrid.innerHTML = participants.map(p => {
            const speaking = p.isSpeaking ? 'speaking' : '';
            const micIcon = p.isMuted ? '🔇' : '🎤';
            const initials = getInitials(p.identity);
            return `
                <div class="participant-tile ${speaking}">
                    <div class="avatar">${initials}</div>
                    <div class="participant-name">${p.identity}</div>
                    <div class="mic-status">${micIcon}</div>
                </div>
            `;
        }).join('');

        // Update online count
        if (onlineCountBar) {
            onlineCountBar.style.display = 'inline-flex';
            onlineCountText.textContent = `${participants.length} user${participants.length !== 1 ? 's' : ''} online`;
        }

        // Update Firebase count
        set(metaRef, participants.length).catch(() => { });
    }

    try {
        livekitRoom = await connectToRoom(roomId, identity, {
            onConnected: () => {
                statusBadge.textContent = 'Connected ✅';
                statusBadge.className = 'status-badge connected';
            },
            onDisconnected: () => {
                statusBadge.textContent = 'Disconnected';
                statusBadge.className = 'status-badge error';
            },
            onParticipantsChanged: renderParticipants,
            onError: err => {
                statusBadge.textContent = 'Error';
                statusBadge.className = 'status-badge error';
                console.error('[Room] Connection error:', err);
            }
        });
    } catch (err) {
        console.error('[Room] Failed to connect:', err);
        statusBadge.textContent = 'Failed to connect';
        statusBadge.className = 'status-badge error';
    }

    // ------ Controls ------
    // Mic toggle
    document.getElementById('mic-btn').addEventListener('click', () => {
        if (!livekitRoom) return;
        isMuted = !isMuted;
        const micBtn = document.getElementById('mic-btn');

        livekitRoom.localParticipant.setMicrophoneEnabled(!isMuted);
        micBtn.textContent = isMuted ? '🔇' : '🎤';
        micBtn.classList.toggle('muted', isMuted);
    });

    // Volume (placeholder for now)
    document.getElementById('volume-btn').addEventListener('click', () => {
        // Future: volume slider
    });

    // Ludo prank
    document.getElementById('ludo-btn').addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.className = 'prank-overlay';
        overlay.innerHTML = `
            <div class="prank-content">
                <div class="prank-emoji">🚨</div>
                <h1>POLICE!</h1>
                <h2>DARWAZA KHOLO!</h2>
                <p>Mumbai Cyber Cell • IP Traced 📍</p>
            </div>
        `;
        document.body.appendChild(overlay);

        // Play alarm sound
        try {
            const audio = new Audio('https://www.soundjay.com/misc/sounds/fail-buzzer-01.mp3');
            audio.volume = 0.7;
            audio.play().catch(() => { });
        } catch (_) { }

        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 500);
        }, 3000);
    });

    // Leave room
    document.getElementById('leave-btn').addEventListener('click', async () => {
        if (livekitRoom) {
            try {
                await livekitRoom.disconnect();
            } catch (_) { }
        }
        // Clean up Firebase
        remove(metaRef).catch(() => { });
        onLeaveRoom();
    });

    // Cleanup on tab/page close
    const disconnectRef = onDisconnect(metaRef);
    disconnectRef.remove().catch(() => { });
}
