import React, { useState, useEffect } from 'react';
import Confetti from './Confetti';
import Leaderboard from './Leaderboard';
import { api } from '../api';
import { playSound } from '../utils/sound';

const GameOverScreen = ({ session, persona, reason, onPlayAgain }) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [animatedStats, setAnimatedStats] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        // Play appropriate sound
        if (reason === 'COMPLETED') {
            playSound('celebration');
            setShowConfetti(true);
        } else {
            playSound('gameOver');
        }

        // Fetch leaderboard
        api.getLeaderboard()
            .then(data => setLeaderboard(data.leaderboard || []))
            .catch(err => console.error('Failed to fetch leaderboard:', err));

        // Trigger stat animations after delay
        const timer = setTimeout(() => setAnimatedStats(true), 500);
        return () => clearTimeout(timer);
    }, [reason]);

    const getReasonEmoji = () => {
        switch (reason) {
            case 'BANKRUPTCY': return '💸';
            case 'BURNOUT': return '😫';
            case 'COMPLETED': return '🎉';
            default: return '🎮';
        }
    };

    const getReasonText = () => {
        switch (reason) {
            case 'BANKRUPTCY': return 'You ran out of money!';
            case 'BURNOUT': return 'You burned out from stress!';
            case 'COMPLETED': return 'You completed 5 years!';
            default: return 'Game Over';
        }
    };

    const getPersonaEmoji = () => {
        if (!persona) return '🎭';
        switch (persona.title) {
            case 'The Warren Buffett': return '🦅';
            case 'The Cautious Saver': return '🐢';
            case 'The Balanced Spender': return '⚖️';
            case 'The YOLO Enthusiast': return '🎢';
            case 'The FOMO Victim': return '😰';
            default: return '🎭';
        }
    };

    const handlePlayAgain = () => {
        playSound('click');
        onPlayAgain();
    };

    const handleShowReport = () => {
        playSound('click');
        setShowReport(true);
    };

    return (
        <>
            <Confetti isActive={showConfetti} duration={5000} />
            <div className="game-over-screen">
                <div className={`persona-card glass ${animatedStats ? 'card-flip-animation' : ''}`}>
                    <div className="persona-icon floating-animation">{getPersonaEmoji()}</div>

                    <h2 className={`persona-title ${reason === 'COMPLETED' ? 'shimmer-text' : ''}`}>
                        {persona?.title || 'Game Complete'}
                    </h2>

                    <p className="persona-description">
                        {persona?.description || getReasonText()}
                    </p>

                    <div className="final-stats">
                        <div className={`final-stat ${animatedStats ? 'animate-slideUp' : ''}`} style={{ animationDelay: '0.1s' }}>
                            <div className={`final-stat-value ${session?.wealth > 0 ? 'text-success' : 'text-danger'} ${animatedStats ? 'number-glow' : ''}`}>
                                ₹{session?.wealth?.toLocaleString('en-IN') || 0}
                            </div>
                            <div className="final-stat-label">Final Wealth</div>
                        </div>

                        <div className={`final-stat ${animatedStats ? 'animate-slideUp' : ''}`} style={{ animationDelay: '0.2s' }}>
                            <div className={`final-stat-value ${session?.happiness > 50 ? 'text-success' : 'text-warning'} ${animatedStats ? 'number-glow' : ''}`}>
                                {session?.happiness || 0}%
                            </div>
                            <div className="final-stat-label">Happiness</div>
                        </div>

                        <div className={`final-stat ${animatedStats ? 'animate-slideUp' : ''}`} style={{ animationDelay: '0.3s' }}>
                            <div className={`final-stat-value text-primary ${animatedStats ? 'number-glow' : ''}`}>
                                {session?.credit_score || 700}
                            </div>
                            <div className="final-stat-label">Credit Score</div>
                        </div>

                        <div className={`final-stat ${animatedStats ? 'animate-slideUp' : ''}`} style={{ animationDelay: '0.4s' }}>
                            <div className={`final-stat-value text-gold ${animatedStats ? 'number-glow' : ''}`}>
                                {session?.current_month || 1}
                            </div>
                            <div className="final-stat-label">Months Survived</div>
                        </div>
                    </div>
                </div>

                {/* Report Modal */}
                {showReport && (
                    <div className="report-modal-overlay">
                        <div className="report-modal glass animate-slideUp">
                            <div className="report-header">
                                <span className="report-icon">📊</span>
                                <h2>Financial Health Report</h2>
                            </div>
                            <div className="report-content">
                                <div className="report-section">
                                    <h3>✨ Performance Summary</h3>
                                    <div className="report-stats-grid">
                                        <div className="report-stat-item">
                                            <span className="stat-icon">💰</span>
                                            <span className="stat-name">Final Wealth</span>
                                            <span className="stat-val">₹{session.wealth.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="report-stat-item">
                                            <span className="stat-icon">😊</span>
                                            <span className="stat-name">Well-being Index</span>
                                            <span className="stat-val">{session.happiness}%</span>
                                        </div>
                                        <div className="report-stat-item">
                                            <span className="stat-icon">💳</span>
                                            <span className="stat-name">Credit Score</span>
                                            <span className="stat-val">{session.credit_score}</span>
                                        </div>
                                        <div className="report-stat-item">
                                            <span className="stat-icon">📚</span>
                                            <span className="stat-name">Financial Credits</span>
                                            <span className="stat-val">{session.financial_literacy || 50}/100</span>
                                        </div>
                                        {session.portfolio && Object.keys(session.portfolio).some(k => session.portfolio[k] > 0) && (
                                            <div className="report-stat-item">
                                                <span className="stat-icon">📈</span>
                                                <span className="stat-name">Stock Portfolio</span>
                                                <span className="stat-val">
                                                    ₹{Object.entries(session.portfolio || {}).reduce((sum, [sector, units]) => {
                                                        const price = session.market_prices?.[sector] || 100;
                                                        return sum + Math.round(units * price);
                                                    }, 0).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        )}
                                        <div className="report-stat-item">
                                            <span className="stat-icon">📅</span>
                                            <span className="stat-name">Months Survived</span>
                                            <span className="stat-val">{session.current_month}/12</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="report-section">
                                    <h3>💡 Key Recommendations</h3>
                                    <ul className="recommendations-list">
                                        {session.wealth < 10000 && (
                                            <li className="rec-item warning">
                                                <span className="rec-icon">⚠️</span>
                                                <div>
                                                    <strong>Emergency Fund</strong>
                                                    <p>Your savings are low. Aim for 6 months of expenses.</p>
                                                </div>
                                            </li>
                                        )}
                                        {session.credit_score < 700 && (
                                            <li className="rec-item warning">
                                                <span className="rec-icon">⚠️</span>
                                                <div>
                                                    <strong>Credit Health</strong>
                                                    <p>Avoid unnecessary loans and pay bills on time.</p>
                                                </div>
                                            </li>
                                        )}
                                        {session.happiness < 50 && (
                                            <li className="rec-item warning">
                                                <span className="rec-icon">⚠️</span>
                                                <div>
                                                    <strong>Life Balance</strong>
                                                    <p>Don't sacrifice happiness for money. Budget for fun!</p>
                                                </div>
                                            </li>
                                        )}
                                        <li className="rec-item success">
                                            <span className="rec-icon">✅</span>
                                            <div>
                                                <strong>Investment</strong>
                                                <p>Consider starting a SIP for long-term wealth.</p>
                                            </div>
                                        </li>
                                        <li className="rec-item success">
                                            <span className="rec-icon">✅</span>
                                            <div>
                                                <strong>Insurance</strong>
                                                <p>Ensure you have adequate health and term insurance.</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                <div className="report-section">
                                    <h3>🔗 Resources (NCFE)</h3>
                                    <p className="resource-intro">Learn more about financial planning:</p>
                                    <div className="resource-links">
                                        <a href="https://www.ncfe.org.in/" target="_blank" rel="noopener noreferrer" className="resource-link">
                                            <span>🏛️</span> National Centre for Financial Education
                                        </a>
                                        <a href="https://www.rbi.org.in/commonman/" target="_blank" rel="noopener noreferrer" className="resource-link">
                                            <span>🏦</span> RBI - For Common Man
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div className="report-actions">
                                <button className="btn btn-primary glow-on-hover" onClick={() => window.print()}>
                                    🖨️ Print Certificate
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowReport(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-md" style={{ marginTop: '1.5rem' }}>
                    <button className="btn btn-primary btn-lg glow-button" onClick={handlePlayAgain}>
                        🔄 Play Again
                    </button>
                    <button className="btn btn-secondary btn-lg" onClick={handleShowReport}>
                        📄 View Report
                    </button>
                </div>

                <div className="game-over-footer">
                    <span className="reason-badge">
                        {getReasonEmoji()} {getReasonText()}
                    </span>
                </div>

                <Leaderboard leaderboard={leaderboard} />
            </div>
        </>
    );
};

export default GameOverScreen;
