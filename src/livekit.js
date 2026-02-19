// ============================================
// LiveKit Connection Helper
// ============================================
import {
    Room,
    RoomEvent,
    Track,
} from 'livekit-client';

// Your self-hosted LiveKit server URL (from .env)
const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'wss://livekit.yourdomain.com';

// Token server URL (Netlify Function)
const TOKEN_SERVER_URL = '/.netlify/functions';

// The current LiveKit Room instance
let currentRoom = null;

/**
 * Get a LiveKit token from our token server
 */
async function getToken(roomName, identity) {
    const response = await fetch(
        `${TOKEN_SERVER_URL}/token?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(identity)}`
    );
    if (!response.ok) {
        throw new Error('Failed to get token from server');
    }
    const data = await response.json();
    return data.token;
}

/**
 * Build a plain array of participant info for the UI
 */
function buildParticipantList(room) {
    const all = [];

    // Local participant
    if (room.localParticipant) {
        all.push({
            identity: room.localParticipant.identity,
            isSpeaking: room.localParticipant.isSpeaking,
            isMuted: !room.localParticipant.isMicrophoneEnabled,
            isLocal: true,
        });
    }

    // Remote participants
    room.remoteParticipants.forEach(p => {
        all.push({
            identity: p.identity,
            isSpeaking: p.isSpeaking,
            isMuted: !p.isMicrophoneEnabled,
            isLocal: false,
        });
    });

    return all;
}

/**
 * Connect to a LiveKit voice room
 */
export async function connectToRoom(roomName, identity, callbacks = {}) {
    // Step 1: Get a token from our token server
    const token = await getToken(roomName, identity);

    // Step 2: Create a new Room instance
    const room = new Room({
        adaptiveStream: true,
        dynacast: true,
    });

    // Helper to notify UI of participant changes
    const notifyParticipants = () => {
        callbacks.onParticipantsChanged?.(buildParticipantList(room));
    };

    // Step 3: Set up event listeners

    // FIX: Fire onConnected when room is actually connected
    room.on(RoomEvent.Connected, () => {
        callbacks.onConnected?.();
        notifyParticipants(); // show local participant immediately
    });

    // When a new audio track is received from another participant
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
            const audioElement = track.attach();
            audioElement.id = `audio-${participant.identity}`;
            document.body.appendChild(audioElement);
        }
        notifyParticipants();
    });

    // When a track is removed
    room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach(el => el.remove());
        notifyParticipants();
    });

    // When a participant joins
    room.on(RoomEvent.ParticipantConnected, () => {
        notifyParticipants();
    });

    // When a participant leaves
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        const el = document.getElementById(`audio-${participant.identity}`);
        if (el) el.remove();
        notifyParticipants();
    });

    // When speaking status changes
    room.on(RoomEvent.ActiveSpeakersChanged, () => {
        notifyParticipants();
    });

    // When local track is published
    room.on(RoomEvent.LocalTrackPublished, () => {
        notifyParticipants();
    });

    // When disconnected
    room.on(RoomEvent.Disconnected, () => {
        callbacks.onDisconnected?.();
    });

    // Step 4: Connect to the room
    try {
        await room.connect(LIVEKIT_URL, token);
    } catch (err) {
        callbacks.onError?.(err);
        throw err;
    }

    // Step 5: Enable microphone
    await room.localParticipant.setMicrophoneEnabled(true);
    notifyParticipants();

    currentRoom = room;
    return room;
}

/**
 * Toggle microphone on/off
 */
export async function toggleMicrophone() {
    if (!currentRoom) return false;
    const isEnabled = currentRoom.localParticipant.isMicrophoneEnabled;
    await currentRoom.localParticipant.setMicrophoneEnabled(!isEnabled);
    return isEnabled;
}

/**
 * Check if microphone is currently muted
 */
export function isMicMuted() {
    if (!currentRoom) return true;
    return !currentRoom.localParticipant.isMicrophoneEnabled;
}

/**
 * Get all participants in the room (including local)
 */
export function getParticipants() {
    if (!currentRoom) return [];
    return buildParticipantList(currentRoom);
}

/**
 * Leave the current room
 */
export async function leaveRoom() {
    if (currentRoom) {
        await currentRoom.disconnect();
        currentRoom = null;
    }
}

/**
 * Get the current room instance
 */
export function getCurrentRoom() {
    return currentRoom;
}
