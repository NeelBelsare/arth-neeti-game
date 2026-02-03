import React, { useEffect, useRef } from 'react';

const ParticleBackground = ({ intensity = 'normal' }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particle configuration based on intensity
        const config = {
            low: { count: 15, speed: 0.3 },
            normal: { count: 25, speed: 0.5 },
            high: { count: 40, speed: 0.8 }
        }[intensity] || { count: 25, speed: 0.5 };

        // Particle symbols
        const symbols = ['₹', '💰', '📈', '✨', '⭐', '💎', '🎯', '💡'];

        // Initialize particles
        const initParticles = () => {
            particlesRef.current = [];
            for (let i = 0; i < config.count; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 16 + 12,
                    speedY: (Math.random() - 0.5) * config.speed,
                    speedX: (Math.random() - 0.5) * config.speed * 0.5,
                    opacity: Math.random() * 0.4 + 0.1,
                    symbol: symbols[Math.floor(Math.random() * symbols.length)],
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.02
                });
            }
        };

        initParticles();

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach(particle => {
                // Update position
                particle.y += particle.speedY;
                particle.x += particle.speedX;
                particle.rotation += particle.rotationSpeed;

                // Wrap around screen
                if (particle.y < -50) particle.y = canvas.height + 50;
                if (particle.y > canvas.height + 50) particle.y = -50;
                if (particle.x < -50) particle.x = canvas.width + 50;
                if (particle.x > canvas.width + 50) particle.x = -50;

                // Draw particle
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                ctx.globalAlpha = particle.opacity;
                ctx.font = `${particle.size}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(particle.symbol, 0, 0);
                ctx.restore();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [intensity]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.6
            }}
        />
    );
};

export default ParticleBackground;
