import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import BudgetDisplay from './BudgetDisplay';

const HomePage = ({ onStartGame, isLoading, username }) => {
    const navigate = useNavigate();

    return (
        <div className="home-page">
            {/* Profile Icon - Top Left */}
            <div className="profile-icon-container">
                <button
                    onClick={() => navigate('/profile')}
                    className="profile-icon-btn"
                    aria-label="Profile"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </button>
            </div>

            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-icon">💼💰</div>
                <h1 className="hero-title">Arth-Neeti</h1>
                <p className="hero-subtitle">Your First Year as a Working Professional</p>
                <p className="hero-description">
                    Navigate 12 months of real-life financial decisions. Balance your salary,
                    manage expenses, and survive without going bankrupt or burning out!
                </p>
                <button
                    className="cta-button"
                    onClick={onStartGame}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="loading-spinner-small"></span>
                            Starting...
                        </>
                    ) : (
                        <>
                            <span className="play-icon">▶</span>
                            Start Your Journey
                        </>
                    )}
                </button>
            </div>

            {/* Game Objective Section */}
            <div className="info-cards-section">
                <div className="info-cards-row">
                    {/* Objective Card */}
                    <div className="info-card">
                        <div className="card-icon red">🎯</div>
                        <h3 className="card-title">Your Mission</h3>
                        <div className="card-content">
                            <p className="mission-text">Survive 12 months without:</p>
                            <div className="danger-badges">
                                <span className="badge danger-badge">💸 Bankruptcy (₹0)</span>
                                <span className="badge warning-badge">😰 Burnout (0% Happiness)</span>
                            </div>
                            <p className="reward-text">Complete all 12 months to unlock your Financial Persona!</p>
                        </div>
                    </div>

                    {/* Stats Explained Card */}
                    <div className="info-card">
                        <div className="card-icon blue">📊</div>
                        <h3 className="card-title">Your Stats</h3>
                        <div className="card-content">
                            <ul className="stats-list">
                                <li><span className="stat-emoji">💰</span> <strong>Wealth</strong> - Your bank balance (Starting: ₹25,000)</li>
                                <li><span className="stat-emoji">😊</span> <strong>Well-being</strong> - Your happiness & mental health</li>
                                <li><span className="stat-emoji">📊</span> <strong>Credit Score</strong> - CIBIL score (300-900)</li>
                                <li><span className="stat-emoji">🧾</span> <strong>Monthly Bills</strong> - Living costs + subscriptions</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* How to Play Card - Full Width */}
                <div className="info-card full-width">
                    <div className="card-icon green">🎮</div>
                    <h3 className="card-title">How to Play</h3>
                    <div className="card-content game-loop">
                        <div className="loop-step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <h4>📋 Read the Scenario</h4>
                                <p>Each month you'll face 3 real-life situations - from office parties to medical emergencies</p>
                            </div>
                        </div>
                        <div className="loop-arrow">→</div>
                        <div className="loop-step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <h4>🤔 Make Your Choice</h4>
                                <p>Every choice affects your Wealth, Happiness, and Credit Score. Choose wisely!</p>
                            </div>
                        </div>
                        <div className="loop-arrow">→</div>
                        <div className="loop-step">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <h4>💵 Monthly Salary</h4>
                                <p>Receive ₹25,000 salary, but bills are deducted automatically each month</p>
                            </div>
                        </div>
                        <div className="loop-arrow">→</div>
                        <div className="loop-step">
                            <div className="step-number">4</div>
                            <div className="step-content">
                                <h4>🔄 Repeat</h4>
                                <p>Survive all 12 months to win and see your final Financial Persona!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Budget Preview Section */}
            <div className="budget-preview-section" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', padding: '0 1rem' }}>
                <BudgetDisplay
                    expenses={[
                        { id: 1, name: 'Rent (2BHK)', amount: 10000, category: 'HOUSING', is_essential: true },
                        { id: 2, name: 'Groceries', amount: 2500, category: 'FOOD', is_essential: true },
                        { id: 3, name: 'Utilities', amount: 1000, category: 'UTILITIES', is_essential: true },
                        { id: 4, name: 'Transport', amount: 1000, category: 'TRANSPORT', is_essential: true },
                    ]}
                    totalMonthlyDrain={14500}
                />
            </div>

            {/* Features Section */}
            <div className="goals-section">
                <div className="goal-card">
                    <div className="goal-icon blue">📈</div>
                    <h3 className="goal-title">Stock Market</h3>
                    <div className="goal-info">
                        <span className="goal-label">Sectors</span>
                        <span className="goal-amount blue">Gold, Tech, Real Estate</span>
                    </div>
                    <p className="goal-description">Invest in Dalal Street - buy low, sell high!</p>
                </div>
                <div className="goal-card">
                    <div className="goal-icon green">🏦</div>
                    <h3 className="goal-title">Loans</h3>
                    <div className="goal-info">
                        <span className="goal-label">Options</span>
                        <span className="goal-amount green">Family / Instant App</span>
                    </div>
                    <p className="goal-description">Borrow when broke, but beware of interest!</p>
                </div>
                <div className="goal-card">
                    <div className="goal-icon purple">💡</div>
                    <h3 className="goal-title">Lifelines</h3>
                    <div className="goal-info">
                        <span className="goal-label">Help</span>
                        <span className="goal-amount purple">Ask NCFE / AI Advisor</span>
                    </div>
                    <p className="goal-description">Stuck? Get expert financial advice!</p>
                </div>
            </div>

            {/* Pro Tips */}
            <div className="tips-section">
                <h3 className="tips-title">💡 Pro Tips</h3>
                <div className="tips-grid">
                    <div className="tip-item">
                        <span className="tip-icon">🚫</span>
                        <span>Avoid expensive subscriptions that drain your wallet monthly</span>
                    </div>
                    <div className="tip-item">
                        <span className="tip-icon">🛡️</span>
                        <span>Build an emergency fund for unexpected medical expenses</span>
                    </div>
                    <div className="tip-item">
                        <span className="tip-icon">⚠️</span>
                        <span>High-interest loans can trap you in a debt spiral</span>
                    </div>
                    <div className="tip-item">
                        <span className="tip-icon">📊</span>
                        <span>A good credit score (750+) unlocks better loan options</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
