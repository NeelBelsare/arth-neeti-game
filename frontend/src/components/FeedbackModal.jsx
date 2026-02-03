import React, { useEffect, useState } from 'react';
import Confetti from './Confetti';
import { playSound } from '../utils/sound';

const FeedbackModal = ({ feedback, wasRecommended, onContinue }) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [iconAnimated, setIconAnimated] = useState(false);

    useEffect(() => {
        // Play sound based on choice quality
        if (wasRecommended) {
            playSound('celebration');
            setShowConfetti(true);
        } else {
            playSound('error');
        }

        // Trigger icon animation after mount
        const timer = setTimeout(() => setIconAnimated(true), 100);
        return () => clearTimeout(timer);
    }, [wasRecommended]);

    const handleContinue = () => {
        playSound('click');
        onContinue();
    };

    return (
        <>
            <Confetti isActive={showConfetti} />
            <div className="feedback-overlay" onClick={handleContinue}>
                <div className="feedback-card glass" onClick={(e) => e.stopPropagation()}>
                    <div className={`feedback-icon ${wasRecommended ? 'good' : 'bad'} ${iconAnimated ? 'celebrate-bounce' : ''}`}>
                        {wasRecommended ? '✅' : '⚠️'}
                    </div>

                    <h3 className="feedback-title">
                        {wasRecommended ? (
                            <span className="shimmer-text">Smart Choice!</span>
                        ) : (
                            'Think About It...'
                        )}
                    </h3>

                    <div className="feedback-tip">
                        <div className="feedback-tip-label">
                            <span className="tip-icon">💡</span>
                            Financial Tip from NCFE
                        </div>
                        <p className="feedback-text">{feedback}</p>
                    </div>

                    <button className="btn btn-primary btn-block glow-on-hover" onClick={handleContinue}>
                        <span>Continue</span>
                        <span className="arrow-icon">→</span>
                    </button>

                    {wasRecommended && (
                        <div className="bonus-message">
                            <span className="bonus-icon">🌟</span>
                            Great financial decision!
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default FeedbackModal;
