import React, { useState, useCallback } from 'react';
import { api } from '../api';
import { playSound } from '../utils/sound';
import './ChatOverlay.css';

/**
 * Character metadata for display.
 */
const CHARACTER_META = {
    harshad: {
        emoji: '📈',
        name: 'Harshad',
        role: 'The Risk Taker',
    },
    jetta: {
        emoji: '🧮',
        name: 'Jetta Bhai',
        role: 'The Business Guru',
    },
    vasooli: {
        emoji: '👊',
        name: 'Vasooli Bhai',
        role: 'The Debt Collector',
    },
    sundar: {
        emoji: '🎭',
        name: 'Sundar',
        role: 'The "Investor"',
    },
};

/**
 * ChatOverlay — A slide-up card from contextual chatbot characters.
 *
 * Props:
 *  - chatbotData: { character, message, choices, is_scam, scam_loss_amount }
 *  - sessionId: current game session ID
 *  - onDismiss: () => void  — close the overlay
 *  - onSessionUpdate: (session) => void — update parent state with new session data
 */
const ChatOverlay = ({ chatbotData, sessionId, onDismiss, onSessionUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    if (!chatbotData || !chatbotData.character) return null;

    const meta = CHARACTER_META[chatbotData.character] || {
        emoji: '💬',
        name: chatbotData.character,
        role: 'Advisor',
    };

    const handleChoice = useCallback(async (choiceIndex) => {
        // choiceIndex 0 = primary action (Listen / Invest / Pay EMI)
        // choiceIndex 1 = secondary action (Ignore)
        const accepted = choiceIndex === 0;

        setLoading(true);
        try {
            playSound('click');
            const response = await api.respondToChatbot(
                sessionId,
                chatbotData.character,
                accepted,
                chatbotData.scam_loss_amount || 0,
            );

            setResult(response.message);

            // Update parent session state
            if (response.session && onSessionUpdate) {
                onSessionUpdate(response.session);
            }

            // Auto-dismiss after showing result
            setTimeout(() => {
                onDismiss();
            }, 3000);
        } catch (err) {
            if (import.meta.env.DEV) console.error('Chatbot response error:', err);
            onDismiss();
        } finally {
            setLoading(false);
        }
    }, [sessionId, chatbotData, onDismiss, onSessionUpdate]);

    return (
        <div className="chatbot-overlay" onClick={onDismiss}>
            <div
                className="chatbot-card"
                data-character={chatbotData.character}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="chatbot-header">
                    <div className="chatbot-avatar">{meta.emoji}</div>
                    <div>
                        <div className="chatbot-name">{meta.name}</div>
                        <div className="chatbot-role">{meta.role}</div>
                    </div>
                </div>

                {/* Message */}
                <div className="chatbot-body">
                    <div className="chatbot-message">
                        {result || chatbotData.message}
                    </div>

                    {chatbotData.is_scam && !result && (
                        <div className="scam-badge">
                            ⚠️ This sounds too good to be true…
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!result && (
                    <div className="chatbot-actions">
                        {loading ? (
                            <div className="chatbot-loading">
                                <div className="spinner" />
                                Processing…
                            </div>
                        ) : (
                            <>
                                <button
                                    className="chatbot-btn primary"
                                    onClick={() => handleChoice(0)}
                                >
                                    {chatbotData.choices?.[0] || 'Listen'}
                                </button>
                                <button
                                    className="chatbot-btn secondary"
                                    onClick={() => handleChoice(1)}
                                >
                                    {chatbotData.choices?.[1] || 'Ignore'}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatOverlay;
