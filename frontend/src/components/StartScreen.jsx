import React, { useEffect, useState } from 'react';
import { playSound, initAudio } from '../utils/sound';

const StartScreen = ({ onStartGame, isLoading }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [showFeatures, setShowFeatures] = useState(false);
    const fullText = "The Strategy of Wealth — Navigate your first 5 years of career. Make smart decisions. Build your future.";

    // Faster typewriter effect
    useEffect(() => {
        let index = 0;
        const timer = setInterval(() => {
            if (index < fullText.length) {
                setDisplayedText(fullText.slice(0, index + 1));
                index++;
            } else {
                clearInterval(timer);
                setTimeout(() => setShowFeatures(true), 100);
            }
        }, 15); // Faster: 15ms instead of 30ms

        return () => clearInterval(timer);
    }, []);

    const handleStartClick = () => {
        initAudio(); // Unlock audio context
        playSound('click');
        onStartGame();
    };

    return (
        <div className="start-screen">
            {/* Animated Logo */}
            <div className="start-logo floating-animation">🏦</div>

            <h1 className="start-title shimmer-text">Arth-Neeti</h1>

            <p className="start-subtitle typewriter-text">
                {displayedText}
                <span className="cursor-blink">|</span>
            </p>

            {/* Feature Cards with Staggered Animation */}
            <div className={`start-features ${showFeatures ? 'features-visible' : ''}`}>
                <div className="feature-item glass feature-delay-1">
                    <div className="feature-icon bounce-animation">💰</div>
                    <div className="feature-title">Manage Wealth</div>
                    <div className="feature-desc">Starting salary: ₹25,000/month</div>
                </div>

                <div className="feature-item glass feature-delay-2">
                    <div className="feature-icon bounce-animation">😊</div>
                    <div className="feature-title">Stay Happy</div>
                    <div className="feature-desc">Balance work and life</div>
                </div>

                <div className="feature-item glass feature-delay-3">
                    <div className="feature-icon bounce-animation">📊</div>
                    <div className="feature-title">Build Credit</div>
                    <div className="feature-desc">Make smart financial choices</div>
                </div>
            </div>

            {/* Enhanced CTA Button */}
            <button
                className="btn btn-primary btn-lg glow-button"
                onClick={handleStartClick}
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <span className="loading-spinner" style={{ width: 20, height: 20 }}></span>
                        Starting...
                    </>
                ) : (
                    <>
                        <span className="btn-icon">🎮</span>
                        Start Your Journey
                    </>
                )}
            </button>

            {/* NCFE Branding */}
            <div className="ncfe-branding">
                <p className="powered-by">Powered by</p>
                <div className="ncfe-logo-container">
                    <span className="ncfe-badge">NCFE</span>
                    <span className="ncfe-text">National Centre for Financial Education</span>
                </div>
                <p className="tagline">Learn financial literacy through real-life scenarios</p>
            </div>
        </div>
    );
};

export default StartScreen;
