import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../utils/sound';

const GameStats = ({ session }) => {
    const [prevSession, setPrevSession] = useState(null);
    const [flashState, setFlashState] = useState({});
    const [animatedValues, setAnimatedValues] = useState({
        wealth: 0,
        happiness: 0,
        credit_score: 700
    });

    // Animate values on change
    useEffect(() => {
        if (!session) return;

        // Animate to new values
        const duration = 500;
        const startTime = Date.now();
        const startValues = { ...animatedValues };
        const endValues = {
            wealth: session.wealth,
            happiness: session.happiness,
            credit_score: session.credit_score
        };

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setAnimatedValues({
                wealth: Math.round(startValues.wealth + (endValues.wealth - startValues.wealth) * easeOut),
                happiness: Math.round(startValues.happiness + (endValues.happiness - startValues.happiness) * easeOut),
                credit_score: Math.round(startValues.credit_score + (endValues.credit_score - startValues.credit_score) * easeOut)
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();

        if (prevSession) {
            const newFlashState = {};
            let soundPlayed = false;

            // Check Wealth
            if (session.wealth !== prevSession.wealth) {
                const diff = session.wealth - prevSession.wealth;
                newFlashState.wealth = diff > 0 ? 'flash-green' : 'flash-red';
                if (!soundPlayed) {
                    playSound(diff > 0 ? 'success' : 'error');
                    soundPlayed = true;
                }
            }

            // Check Happiness
            if (session.happiness !== prevSession.happiness) {
                newFlashState.happiness = session.happiness > prevSession.happiness ? 'flash-green' : 'flash-red';
            }

            // Check Credit
            if (session.credit_score !== prevSession.credit_score) {
                newFlashState.credit = session.credit_score > prevSession.credit_score ? 'flash-green' : 'flash-red';
            }

            setFlashState(newFlashState);

            // Clear flash after animation
            const timer = setTimeout(() => {
                setFlashState({});
            }, 1000);

            return () => clearTimeout(timer);
        }

        setPrevSession(session);
    }, [session]);

    if (!session) return null;

    const formatMoney = (amount) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        }
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const getWealthClass = (wealth) => {
        if (wealth > 30000) return 'positive';
        if (wealth < 10000) return 'negative';
        return '';
    };

    const getHappinessClass = (happiness) => {
        if (happiness > 70) return 'positive';
        if (happiness < 30) return 'negative';
        if (happiness < 50) return 'warning';
        return '';
    };

    const getCreditClass = (credit) => {
        if (credit >= 750) return 'positive';
        if (credit < 600) return 'negative';
        return '';
    };

    // Calculate circular progress for each stat
    const getCircleProgress = (value, max) => {
        const percentage = Math.min((value / max) * 100, 100);
        const circumference = 2 * Math.PI * 36; // radius = 36
        const strokeDashoffset = circumference - (percentage / 100) * circumference;
        return { circumference, strokeDashoffset };
    };

    return (
        <div className="stats-bar glass">
            <div className={`stat-item ${flashState.wealth || ''}`}>
                <div className="stat-circle-container">
                    <svg className="stat-circle" viewBox="0 0 80 80">
                        <circle className="stat-circle-bg" cx="40" cy="40" r="36" />
                        <motion.circle
                            className={`stat-circle-progress ${session.wealth > 20000 ? 'success' : session.wealth < 5000 ? 'danger' : 'warning'}`}
                            cx="40"
                            cy="40"
                            r="36"
                            initial={{ strokeDashoffset: getCircleProgress(0, 50000).circumference }}
                            animate={{ strokeDashoffset: getCircleProgress(session.wealth, 50000).strokeDashoffset }}
                            transition={{ type: "spring", stiffness: 60, damping: 15 }}
                            style={{
                                strokeDasharray: getCircleProgress(session.wealth, 50000).circumference
                            }}
                        />
                    </svg>
                    <span className="stat-circle-icon">💰</span>
                </div>
                <div className="stat-info">
                    <span className="stat-label">Wealth</span>
                    <span className={`stat-value ${getWealthClass(session.wealth)} ${flashState.wealth ? 'number-glow' : ''}`}>
                        {formatMoney(animatedValues.wealth)}
                    </span>
                </div>
            </div>

            <div className={`stat-item ${flashState.happiness || ''}`}>
                <div className="stat-circle-container">
                    <svg className="stat-circle" viewBox="0 0 80 80">
                        <circle className="stat-circle-bg" cx="40" cy="40" r="36" />
                        <motion.circle
                            className={`stat-circle-progress ${session.happiness > 50 ? 'success' : session.happiness < 25 ? 'danger' : 'warning'}`}
                            cx="40"
                            cy="40"
                            r="36"
                            initial={{ strokeDashoffset: getCircleProgress(0, 100).circumference }}
                            animate={{ strokeDashoffset: getCircleProgress(session.happiness, 100).strokeDashoffset }}
                            transition={{ type: "spring", stiffness: 60, damping: 15 }}
                            style={{
                                strokeDasharray: getCircleProgress(session.happiness, 100).circumference
                            }}
                        />
                    </svg>
                    <span className="stat-circle-icon">😊</span>
                </div>
                <div className="stat-info">
                    <span className="stat-label">Happiness</span>
                    <span className={`stat-value ${getHappinessClass(session.happiness)} ${flashState.happiness ? 'number-glow' : ''}`}>
                        {animatedValues.happiness}%
                    </span>
                </div>
            </div>

            <div className={`stat-item ${flashState.credit || ''}`}>
                <div className="stat-circle-container">
                    <svg className="stat-circle" viewBox="0 0 80 80">
                        <circle className="stat-circle-bg" cx="40" cy="40" r="36" />
                        <motion.circle
                            className={`stat-circle-progress ${session.credit_score >= 750 ? 'success' : session.credit_score < 600 ? 'danger' : 'primary'}`}
                            cx="40"
                            cy="40"
                            r="36"
                            initial={{ strokeDashoffset: getCircleProgress(0, 600).circumference }}
                            animate={{ strokeDashoffset: getCircleProgress(session.credit_score - 300, 600).strokeDashoffset }}
                            transition={{ type: "spring", stiffness: 60, damping: 15 }}
                            style={{
                                strokeDasharray: getCircleProgress(session.credit_score - 300, 600).circumference
                            }}
                        />
                    </svg>
                    <span className="stat-circle-icon">📊</span>
                </div>
                <div className="stat-info">
                    <span className="stat-label">Credit</span>
                    <span className={`stat-value ${getCreditClass(session.credit_score)} ${flashState.credit ? 'number-glow' : ''}`}>
                        {animatedValues.credit_score}
                    </span>
                </div>
            </div>

            <div className="month-indicator">
                <div className="month-number">Month {session.current_month}</div>
                <span className="year-text">Year {Math.ceil(session.current_month / 12)} of 1</span>
            </div>
        </div>
    );
};

export default GameStats;
