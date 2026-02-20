import React from 'react';
import '../../styles/theme.css';

const Card = ({ children, className = '', color = 'white' }) => {
    const bgColors = {
        white: 'var(--color-white)',
        mint: 'var(--color-mint)',
        pink: 'var(--color-pink)',
        lavender: 'var(--color-lavender)',
        coral: 'var(--color-coral)',
        yellow: 'var(--color-yellow)'
    };

    return (
        <div
            className={`brutalist-card ${className}`}
            style={{
                backgroundColor: bgColors[color] || bgColors.white,
                padding: '16px',
                position: 'relative',
                overflow: 'hidden' // Keeps content inside rounded corners
            }}
        >
            {children}
        </div>
    );
};

export default Card;
