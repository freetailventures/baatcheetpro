import React, { createContext, useContext, useEffect, useState } from 'react';

// CAUTION: Importing from legacy livekit.js. 
// We must ensure livekit.js exports these functions cleanly.
// If this fails, we will need to add "export" to the bottom of livekit.js.
import {
    connectToRoom,
    disconnectRoom,
    toggleMicrophone
} from '../livekit.js';

const VoiceContext = createContext();

export const useVoice = () => useContext(VoiceContext);

export const VoiceProvider = ({ children }) => {
    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState(null);

    // Wrapper for connecting to a room
    const joinRoom = async (username, roomId) => {
        try {
            setError(null);
            console.log(`VoiceContext: Joining room ${roomId} as ${username}...`);

            const newRoom = await connectToRoom(username, roomId);

            if (newRoom) {
                setRoom(newRoom);
                setIsConnected(true);
                // Initial state sync
                setIsMuted(false); // Default logic in legacy code
            }
        } catch (err) {
            console.error("VoiceContext Error:", err);
            setError(err.message);
        }
    };

    const leaveRoom = async () => {
        if (room) {
            await disconnectRoom();
            setRoom(null);
            setIsConnected(false);
            setParticipants([]);
        }
    };

    const toggleMic = async () => {
        if (room) {
            const muted = await toggleMicrophone();
            setIsMuted(muted);
        }
    };

    // Effect to listen to room events (Simplified for Phase 0)
    useEffect(() => {
        if (!room) return;

        // In a real implementation with the frozen engine, we might need
        // to attach listeners to the 'room' object here if the legacy code
        // doesn't handle React state updates.
        // For now, we assume the legacy code handles the heavy lifting 
        // and we just expose the control methods.

        return () => {
            // Cleanup if needed
        };
    }, [room]);

    const value = {
        room,
        isConnected,
        isMuted,
        error,
        joinRoom,
        leaveRoom,
        toggleMic
    };

    return (
        <VoiceContext.Provider value={value}>
            {children}
        </VoiceContext.Provider>
    );
};
