import React, { useState } from 'react';
import { useVoice } from '../contexts/VoiceContext';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { Search, Plus, Loader } from 'lucide-react';

const Lobby = () => {
    const { joinRoom, isConnected } = useVoice();
    const [searchTerm, setSearchTerm] = useState('');

    // Mock Room Data (Will be replaced by Firebase later)
    const rooms = [
        { id: 'hindi-1', name: 'Hindi Practice Room 🗣️', lang: 'Hindi', users: 7, color: 'mint' },
        { id: 'english-1', name: 'English Improve 🇬🇧', lang: 'English', users: 12, color: 'pink' },
        { id: 'chill-1', name: 'Just Chilling ☕', lang: 'Any', users: 4, color: 'yellow' },
        { id: 'music-1', name: 'Music Jam 🎸', lang: 'Music', users: 9, color: 'lavender' },
    ];

    const handleJoin = (roomId) => {
        const username = prompt("Enter your username to join:");
        if (username) {
            joinRoom(username, roomId);
        }
    };

    return (
        <div className="p-4 pb-24"> {/* pb-24 for bottom nav space */}

            {/* HEADER */}
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-black tracking-tight border-b-4 border-black inline-block pb-1">
                    yaha baat karo 🎙️
                </h1>
                <Avatar username="Me" size={40} isOnline={true} />
            </header>

            {/* SEARCH BAR */}
            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Search rooms..."
                    className="w-full p-3 pl-10 border-4 border-black rounded-xl shadow-[4px_4px_0px_#000] focus:outline-none focus:translate-y-1 focus:shadow-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 w-5 h-5 opacity-50" />
            </div>

            {/* FILTERS */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {['All', 'Hindi 🇮🇳', 'English 🇬🇧', 'Music 🎵', 'Favorites ❤️'].map((filter, idx) => (
                    <button
                        key={filter}
                        className={`
              px-4 py-1.5 border-2 border-black rounded-full font-bold whitespace-nowrap
              ${idx === 0 ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}
            `}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* ROOMS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                    <Card key={room.id} color={room.color} className="flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold leading-tight">{room.name}</h3>
                            <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                LIVE
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold bg-white/50 px-2 py-1 rounded-md border-2 border-black/10">
                                {room.lang}
                            </span>
                            <span className="text-sm font-bold flex items-center gap-1">
                                👥 {room.users}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-black/10">
                            <div className="flex -space-x-2">
                                {[...Array(3)].map((_, i) => (
                                    <Avatar key={i} username={`User${i}${room.id}`} size={30} />
                                ))}
                                {room.users > 3 && (
                                    <div className="w-[30px] h-[30px] rounded-full bg-black text-white flex items-center justify-center text-xs border-2 border-white z-10">
                                        +{room.users - 3}
                                    </div>
                                )}
                            </div>

                            <Button size="small" onClick={() => handleJoin(room.id)}>
                                Join →
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* FLOATING ACTION BUTTON (CREATE) */}
            <button
                className="fixed bottom-24 right-5 w-16 h-16 bg-[var(--color-coral)] border-4 border-black rounded-full shadow-[4px_4px_0px_#000] flex items-center justify-center hover:translate-y-1 hover:shadow-[2px_2px_0px_#000] transition-all z-50"
                onClick={() => alert("Create Room modal coming in Phase 1!")}
            >
                <Plus size={32} strokeWidth={3} />
            </button>

        </div>
    );
};

export default Lobby;
