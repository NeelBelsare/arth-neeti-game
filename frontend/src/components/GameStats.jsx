import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../utils/sound';
import './GameStats.css';

const formatMoney = (amount) => {
    const sym = '₹';
    if (amount >= 100000) return `${sym}${(amount / 100000).toFixed(1)}L`;
    return `${sym}${Number(amount).toLocaleString('en-IN')}`;
};

function GameStats({ session }) {
    const [prevSession, setPrevSession] = useState(null);
    const [flashState, setFlashState] = useState({});
    const [animatedWealth, setAnimatedWealth] = useState(0);
    const [animatedNetWorth, setAnimatedNetWorth] = useState(0);
    const rafRef = useRef(null);

    const netWorth = (() => {
        if (!session) return 0;
        let total = session.wealth || 0;
        const portfolio = session.portfolio || {};
        const prices = session.market_prices || {};
        Object.keys(portfolio).forEach((s) => {
            total += (portfolio[s] || 0) * (prices[s] || 0);
        });
        return Math.round(total);
    })();

    useEffect(() => {
        if (!session) return;

        const duration = 500;
        const startTime = Date.now();
        const startWealth = animatedWealth;
        const startNet = animatedNetWorth;
        const endWealth = session.wealth || 0;
        const endNet = netWorth;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setAnimatedWealth(Math.round(startWealth + (endWealth - startWealth) * easeOut));
            setAnimatedNetWorth(Math.round(startNet + (endNet - startNet) * easeOut));
            if (progress < 1) rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [session]);

    useEffect(() => {
        if (!session || !prevSession) {
            if (session) setPrevSession(session);
            return;
        }
        const next = {};
        if (session.wealth !== prevSession.wealth) {
            next.wealth = session.wealth > prevSession.wealth ? 'flash-green' : 'flash-red';
            playSound(session.wealth > prevSession.wealth ? 'success' : 'error');
        }
        if (session.credit_score !== prevSession.credit_score) {
            next.credit = session.credit_score > prevSession.credit_score ? 'flash-green' : 'flash-red';
        }
        setFlashState(next);
        setPrevSession(session);
        const t = setTimeout(() => setFlashState({}), 1000);
        return () => clearTimeout(t);
    }, [session]);

    if (!session) return null;

    const currentMonth = session.current_month ?? 1;
    const monthsTotal = 12;
    const progressPct = Math.min(100, (currentMonth / monthsTotal) * 100);
    const monthsRemaining = Math.max(0, monthsTotal - currentMonth);

    const score = Math.min(100, Math.max(0, session.financial_literacy ?? 50));
    const scoreStatus =
        score >= 80 ? { label: 'Excellent', class: 'score-excellent' } :
            score >= 50 ? { label: 'Good', class: 'score-good' } :
                { label: 'Needs Work', class: 'score-needs-work' };

    // RBI Credit Score Norms (CIBIL-like 300-900 range)
    const creditScore = session.credit_score || 700;
    const creditStatus =
        creditScore >= 750 ? { label: 'Excellent', class: 'score-excellent' } :
            creditScore >= 700 ? { label: 'Good', class: 'score-good' } :
                creditScore >= 650 ? { label: 'Fair', class: 'score-fair' } :
                    creditScore >= 550 ? { label: 'Poor', class: 'score-poor' } :
                        { label: 'Very Poor', class: 'score-needs-work' };

    const wealthChange = prevSession
        ? (session.wealth || 0) - (prevSession.wealth || 0)
        : null;

    return (
        <div className="stats-dashboard">
            <div className={`stats-card stats-cash ${flashState.wealth || ''}`} >
                <div className="stats-card-header">
                    <span className="stats-card-icon stats-icon-cash">💳</span>
                    <span className="stats-card-label">Current Cash</span>
                </div>
                <div className="stats-card-value stats-value-cash">
                    {formatMoney(animatedWealth)}
                </div>
                <div className="stats-card-meta">
                    {wealthChange != null && wealthChange !== 0 && (
                        <>
                            {wealthChange > 0 && (
                                <span className="stats-change-positive">+{formatMoney(wealthChange)}</span>
                            )}
                            {wealthChange < 0 && (
                                <span className="stats-change-negative">/ {formatMoney(wealthChange)}</span>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="stats-card stats-networth">
                <div className="stats-card-header">
                    <span className="stats-card-icon stats-icon-networth">😊</span>
                    <span className="stats-card-label">Well-being</span>
                </div>
                <div className="stats-card-value stats-value-networth">
                    {session?.happiness || 0}%
                </div>
                <p className="stats-card-subtitle">Life satisfaction score</p>
            </div>

            <div className="stats-card stats-progress">
                <div className="stats-card-header">
                    <span className="stats-card-icon stats-icon-progress">🧾</span>
                    <span className="stats-card-label">Monthly Bills</span>
                </div>
                <div className="stats-card-value stats-value-progress">{formatMoney(session.recurring_expenses || 15000)}</div>
                <p className="stats-card-subtitle">Living + Subscriptions</p>
            </div>

            <div className={`stats-card stats-score ${flashState.credit || ''}`}>
                <div className="stats-card-header">
                    <span className="stats-card-icon stats-icon-score">📊</span>
                    <span className="stats-card-label">Credit Score</span>
                </div>
                <div className="stats-card-value stats-value-score">{session.credit_score || 700}</div>
                <span className={`stats-score-pill ${creditStatus.class}`}>{creditStatus.label}</span>
            </div>
        </div>
    );
}

export default GameStats;
