import React, { useMemo } from 'react';
import '../../styles/theme.css';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

// Simple DiceBear URL generator for Phase 0
// In Phase 1 we can implement the full local generation if needed
const getAvatarUrl = (seed) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

const Avatar = ({
    username = 'User',
    size = 50,
    isSpeaking = false,
    isOnline = false
}) => {
    const avatarUrl = useMemo(() => getAvatarUrl(username), [username]);

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <img
                src={avatarUrl}
                alt={username}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '3px solid black',
                    backgroundColor: 'white',
                    boxShadow: isSpeaking ? '0 0 0 4px var(--color-mint)' : 'none',
                    transition: 'box-shadow 0.1s ease',
                    objectFit: 'cover'
                }}
            />
            {isOnline && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981', // Green
                        border: '2px solid black'
                    }}
                />
            )}
        </div>
    );
};

export default Avatar;
