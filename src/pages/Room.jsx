import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVoice } from '../contexts/VoiceContext';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { Mic, MicOff, PhoneOff, MessageSquare, Smile } from 'lucide-react';

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const {
        room,
        isConnected,
        joinRoom,
        leaveRoom,
        toggleMic,
        isMuted,
        error
    } = useVoice();

    // On mount, if not connected, try to join (simulated for now)
    // In real app, user clicks join in Lobby -> connects -> navigates here
    useEffect(() => {
        if (!isConnected && !room) {
            // For dev/testing: Auto-join if land directly on URL
            // In production, we'd redirect to Lobby
            joinRoom("GuestUser", roomId);
        }
    }, [roomId, isConnected]);

    const handleLeave = () => {
        if (confirm("Are you sure you want to leave the room?")) {
            leaveRoom();
            navigate('/');
        }
    };

    const handleMinimize = () => {
        navigate('/'); // Go back to lobby but keep voice active (VoiceContext handles state)
    };

    if (error) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-2xl font-bold mb-4">Connection Failed 😢</h2>
                <p className="mb-6">{error}</p>
                <Button onClick={() => navigate('/')}>Back to Lobby</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[var(--color-bg)]">

            {/* ROOM HEADER */}
            <header className="flex justify-between items-center p-4 border-b-4 border-black bg-white shadow-sm">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black truncate max-w-[200px]">
                        {roomId || "Voice Room"} 🗣️
                    </h1>
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        LIVE | Connected
                    </span>
                </div>
                <Button size="small" variant="neutral" onClick={handleMinimize}>
                    Minimize 🔽
                </Button>
            </header>

            {/* SCROLLABLE PARTICIPANT GRID */}
            <main className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-4 content-start">
                {/* Mock participants + Real local user */}
                <div className="flex flex-col items-center">
                    <Avatar
                        username="Me"
                        size={80}
                        isSpeaking={!isMuted} // React to local mic state
                        isOnline={true}
                    />
                    <span className="mt-2 font-bold text-sm bg-white border-2 border-black px-2 rounded-md">
                        You {isMuted && '🔇'}
                    </span>
                </div>

                {/* Fake participants to fill grid */}
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center opacity-70">
                        <Avatar username={`User-${i}`} size={80} />
                        <span className="mt-2 font-bold text-sm">User {i + 1}</span>
                    </div>
                ))}
            </main>

            {/* BOTTOM CONTROLS BAR */}
            <footer className="p-4 bg-white border-t-4 border-black pb-8">
                <div className="flex justify-between items-center max-w-md mx-auto">

                    <Button
                        className="rounded-full w-14 h-14 flex items-center justify-center"
                        variant={isMuted ? 'danger' : 'primary'}
                        onClick={toggleMic}
                    >
                        {isMuted ? <MicOff /> : <Mic />}
                    </Button>

                    <Button
                        className="rounded-full w-14 h-14 flex items-center justify-center"
                        variant="neutral"
                        onClick={() => alert("Chat coming in Phase 2!")}
                    >
                        <MessageSquare />
                    </Button>

                    <Button
                        className="rounded-full w-14 h-14 flex items-center justify-center"
                        variant="secondary"
                        onClick={() => alert("Reactions coming in Phase 3!")}
                    >
                        <Smile />
                    </Button>

                    <Button
                        className="w-auto px-6 h-14 flex items-center gap-2"
                        variant="danger"
                        onClick={handleLeave}
                    >
                        <PhoneOff />
                        <span className="hidden sm:inline">Leave</span>
                    </Button>

                </div>
            </footer>

        </div>
    );
};

export default Room;
