import React, { useEffect, useState } from 'react';

const Confetti = ({ isActive, duration = 3000 }) => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (!isActive) {
            setParticles([]);
            return;
        }

        // Generate confetti particles
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#fbbf24'];
        const shapes = ['●', '■', '▲', '★', '♦', '₹'];

        const newParticles = [];
        for (let i = 0; i < 50; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100,
                delay: Math.random() * 0.5,
                duration: 2 + Math.random() * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                size: 10 + Math.random() * 10,
                rotation: Math.random() * 360
            });
        }
        setParticles(newParticles);

        // Clear after duration
        const timer = setTimeout(() => {
            setParticles([]);
        }, duration);

        return () => clearTimeout(timer);
    }, [isActive, duration]);

    if (particles.length === 0) return null;

    return (
        <div className="confetti-container" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1000,
            overflow: 'hidden'
        }}>
            {particles.map(particle => (
                <div
                    key={particle.id}
                    style={{
                        position: 'absolute',
                        left: `${particle.x}%`,
                        top: '-20px',
                        fontSize: `${particle.size}px`,
                        color: particle.color,
                        transform: `rotate(${particle.rotation}deg)`,
                        animation: `confettiFall ${particle.duration}s ease-out ${particle.delay}s forwards`,
                        opacity: 0.9
                    }}
                >
                    {particle.shape}
                </div>
            ))}
        </div>
    );
};

export default Confetti;
