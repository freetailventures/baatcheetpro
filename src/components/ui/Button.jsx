import React from 'react';
import '../../styles/theme.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    onClick,
    className = '',
    disabled = false,
    type = 'button'
}) => {
    // Map internal variants to Stitch color tokens
    const bgColors = {
        primary: 'var(--color-mint)',    // Mint for primary actions
        secondary: 'var(--color-pink)',  // Pink for secondary
        danger: 'var(--color-coral)',    // Coral for destructive
        neutral: 'var(--color-white)',   // White for default
        lavender: 'var(--color-lavender)'
    };

    const padding = size === 'large' ? '16px 32px' : '10px 20px';
    const fontSize = size === 'large' ? '1.2rem' : '1rem';

    const style = {
        backgroundColor: bgColors[variant] || bgColors.neutral,
        padding: padding,
        fontSize: fontSize,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
    };

    return (
        <button
            type={type}
            className={`brutalist-btn ${className}`}
            style={style}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default Button;
