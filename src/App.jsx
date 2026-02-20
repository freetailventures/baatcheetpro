import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { VoiceProvider } from './contexts/VoiceContext';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import './index.css';

function App() {
    return (
        <VoiceProvider>
            <div className="app-container min-h-screen bg-[var(--color-bg)] font-[var(--font-main)]">
                <Routes>
                    <Route path="/" element={<Lobby />} />
                    <Route path="/room/:roomId" element={<Room />} />
                </Routes>
            </div>
        </VoiceProvider>
    );
}

export default App;
