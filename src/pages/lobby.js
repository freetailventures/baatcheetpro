import { ref, onValue, push, remove, serverTimestamp } from 'firebase/database';
import { database } from '../firebase.js';

export function renderLobby(onJoinRoom, onLogout) {
    const container = document.getElementById('app');

    container.innerHTML = `
        <div class="lobby-container fade-in">
            <header class="lobby-header">
                <h2>🏠 Lobby</h2>
                <div class="header-actions">
                    <button id="create-room-btn" class="btn small">➕ New Room</button>
                    <button id="logout-btn" class="btn secondary small">Logout</button>
                </div>
            </header>

            <!-- Trending / Permanent Rooms -->
            <div class="section-label">🔥 Trending Now</div>

            <div class="rooms-grid" id="permanent-rooms">
                <div class="room-card oyo-room fade-in" data-room-id="oyo-room">
                    <h3>💘 OYO Room</h3>
                    <p class="room-subtitle">Dating & Chill • Music</p>
                    <div class="room-meta">
                        <span class="participant-count">
                            <span>👥</span>
                            <span id="oyo-count">0</span> online
                        </span>
                        <button class="btn join-btn" data-room-id="oyo-room" data-room-name="OYO Room">Join OYO</button>
                    </div>
                </div>

                <div class="room-card gaali-room fade-in" data-room-id="gaali-room">
                    <h3>🤬 Gaali Room</h3>
                    <p class="room-subtitle">No Rules • Debate • Fight</p>
                    <div class="room-meta">
                        <span class="participant-count">
                            <span>👥</span>
                            <span id="gaali-count">0</span> online
                        </span>
                        <button class="btn join-btn gaali-join" data-room-id="gaali-room" data-room-name="Gaali Room">Join Fight</button>
                    </div>
                </div>
            </div>

            <!-- Dynamic Rooms -->
            <div class="section-label">🎧 Active Rooms <span id="room-count-label" style="margin-left:auto; font-weight:400; text-transform:none; letter-spacing:0;"></span></div>

            <div class="rooms-grid" id="rooms-grid">
                <div class="empty-state">
                    <div class="empty-icon">🎙️</div>
                    <p>No active rooms yet.<br>Create one to start chatting!</p>
                </div>
            </div>

            <!-- Create Room Modal -->
            <dialog id="create-modal">
                <div class="glass-card">
                    <div class="modal-icon"><span>🎙️</span></div>
                    <h3>Create a Room</h3>
                    <p class="modal-subtitle">Start a conversation with friends</p>
                    <form id="create-form">
                        <input type="text" id="room-name-input" placeholder="Room Name (e.g. Chill Chat)" required maxlength="30" />
                        <div class="modal-actions">
                            <button type="button" id="cancel-create" class="btn secondary">Cancel</button>
                            <button type="submit" class="btn">🚀 Create Room</button>
                        </div>
                    </form>
                </div>
            </dialog>
        </div>
    `;

    // ------ Event Listeners ------
    document.getElementById('logout-btn').addEventListener('click', onLogout);

    const modal = document.getElementById('create-modal');
    document.getElementById('create-room-btn').addEventListener('click', () => modal.showModal());
    document.getElementById('cancel-create').addEventListener('click', () => modal.close());

    // Create room form
    document.getElementById('create-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('room-name-input').value.trim();
        if (!name) return;

        const roomId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        push(ref(database, 'rooms'), {
            id: roomId,
            name: name,
            createdAt: serverTimestamp()
        });

        modal.close();
        document.getElementById('room-name-input').value = '';
    });

    // Join buttons (permanent rooms)
    container.querySelectorAll('.join-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            onJoinRoom(btn.dataset.roomId, btn.dataset.roomName);
        });
    });

    // ------ Firebase Sync ------
    const roomsRef = ref(database, 'rooms');
    const unsubscribe = onValue(roomsRef, snapshot => {
        const grid = document.getElementById('rooms-grid');
        const countLabel = document.getElementById('room-count-label');
        if (!grid) return;

        if (!snapshot.exists()) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎙️</div>
                    <p>No active rooms yet.<br>Create one to start chatting!</p>
                </div>`;
            if (countLabel) countLabel.textContent = '';
            return;
        }

        const rooms = snapshot.val();
        const entries = Object.entries(rooms);
        if (countLabel) countLabel.textContent = `${entries.length} room${entries.length !== 1 ? 's' : ''}`;

        grid.innerHTML = entries.map(([key, room]) => `
            <div class="room-card fade-in">
                <h3>🎧 ${room.name}</h3>
                <div class="room-meta">
                    <span class="participant-count">
                        <span>👥</span>
                        <span id="count-${room.id || key}">${room.participants || 0}</span> online
                    </span>
                    <button
                        class="btn join-btn"
                        data-room-id="${room.id || key}"
                        data-room-name="${room.name}"
                        data-firebase-key="${key}"
                    >Join →</button>
                </div>
            </div>
        `).join('');

        // Attach join listeners
        grid.querySelectorAll('.join-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                onJoinRoom(btn.dataset.roomId, btn.dataset.roomName);
            });
        });
    });

    // Participant counts for permanent rooms
    const oyoRef = ref(database, 'rooms-meta/oyo-room/participants');
    const gaaliRef = ref(database, 'rooms-meta/gaali-room/participants');

    onValue(oyoRef, snap => {
        const el = document.getElementById('oyo-count');
        if (el) el.textContent = snap.val() || 0;
    });

    onValue(gaaliRef, snap => {
        const el = document.getElementById('gaali-count');
        if (el) el.textContent = snap.val() || 0;
    });

    return () => {
        // Cleanup (called when leaving lobby)
    };
}
