import React, { useState, useEffect } from 'react';
import './StockTicker.css';

const SECTORS = {
    gold: { name: 'Gold', icon: '🥇', colorClass: 'stock-price-yellow' },
    tech: { name: 'Tech', icon: '💻', colorClass: 'stock-price-cyan' },
    real_estate: { name: 'Real Estate', icon: '🏠', colorClass: 'stock-price-green' }
};

export default function StockTicker({ session, onBuy, onSell }) {
    const [prevPrices, setPrevPrices] = useState({});
    const [flashStates, setFlashStates] = useState({});
    const [selectedSector, setSelectedSector] = useState(null);
    const [actionStart, setActionStart] = useState(null);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (session && session.market_prices) {
            const newFlashes = {};
            Object.keys(SECTORS).forEach((sector) => {
                const prev = prevPrices[sector];
                const curr = session.market_prices[sector];
                if (prev != null && curr > prev) newFlashes[sector] = 'flash-green';
                if (prev != null && curr < prev) newFlashes[sector] = 'flash-red';
            });
            if (Object.keys(newFlashes).length > 0) {
                setFlashStates(newFlashes);
                setTimeout(() => setFlashStates({}), 1000);
            }
            setPrevPrices({ ...session.market_prices });
        }
    }, [session?.market_prices]);

    if (!session) return null;

    const prices = session.market_prices || { gold: 100, tech: 100, real_estate: 100 };
    const portfolio = session.portfolio || { gold: 0, tech: 0, real_estate: 0 };
    const wealth = session.wealth ?? 0;

    const handleAction = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
        setIsLoading(true);
        setMessage(null);
        try {
            const result =
                actionStart === 'buy'
                    ? await onBuy(selectedSector, Number(amount))
                    : await onSell(selectedSector, Number(amount));
            if (result?.message) {
                setMessage({ type: 'success', text: result.message });
                setAmount('');
                setTimeout(() => {
                    setMessage(null);
                    setActionStart(null);
                    setSelectedSector(null);
                }, 1500);
            } else if (result?.error) {
                setMessage({ type: 'error', text: result.error });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Transaction failed' });
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <>
            <div className="stock-ticker-new">
                <div className="stock-ticker-header">
                    <h3 className="stock-ticker-title">
                        <span className="stock-ticker-title-icon">📈</span>
                        Stock Market
                    </h3>
                    <div className="stock-ticker-live">
                        <span className="stock-ticker-live-dot" />
                        Live
                    </div>
                </div>

                <div className="stock-ticker-grid">
                    {Object.entries(SECTORS).map(([key, info]) => {
                        const price = prices[key] ?? 100;
                        const owned = portfolio[key] ?? 0;
                        const currentValue = owned * price;
                        const flashClass = flashStates[key] || '';

                        return (
                            <div
                                key={key}
                                className={`stock-ticker-card ${flashClass}`}
                            >
                                <div className="stock-ticker-card-header">
                                    <span className="stock-ticker-card-icon">{info.icon}</span>
                                    <span className="stock-ticker-card-name">{info.name}</span>
                                </div>
                                <div className={`stock-ticker-card-price ${info.colorClass}`}>
                                    ₹{price}
                                </div>
                                <div className="stock-ticker-card-meta">
                                    <span>Owned: <strong>{Number(owned).toFixed(1)}</strong></span>
                                    <span>Value: <span className="value">₹{currentValue.toLocaleString()}</span></span>
                                </div>
                                <div className="stock-ticker-card-actions">
                                    <button
                                        type="button"
                                        className="stock-ticker-btn-buy"
                                        onClick={() => {
                                            setSelectedSector(key);
                                            setActionStart('buy');
                                        }}
                                    >
                                        Buy
                                    </button>
                                    <button
                                        type="button"
                                        className="stock-ticker-btn-sell"
                                        disabled={owned <= 0}
                                        onClick={() => {
                                            setSelectedSector(key);
                                            setActionStart('sell');
                                        }}
                                    >
                                        Sell
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedSector && actionStart && (
                <div className="stock-ticker-modal-overlay">
                    <div className="stock-ticker-modal">
                        <div className={`stock-ticker-modal-header ${actionStart}`}>
                            <h4 className="stock-ticker-modal-title">
                                <span>{SECTORS[selectedSector].icon}</span>
                                <span>{actionStart === 'buy' ? 'Buy' : 'Sell'} {SECTORS[selectedSector].name}</span>
                            </h4>
                        </div>
                        <div className="stock-ticker-modal-body">
                            <div className="stock-ticker-modal-stats">
                                <div>
                                    <span>Market Price</span>
                                    <strong className={SECTORS[selectedSector].colorClass}>₹{prices[selectedSector]}</strong>
                                </div>
                                <div>
                                    <span>Your Portfolio</span>
                                    <strong>{portfolio[selectedSector] ?? 0} units</strong>
                                </div>
                                <div>
                                    <span>Available Cash</span>
                                    <strong style={{ color: '#22c55e' }}>₹{wealth.toLocaleString()}</strong>
                                </div>
                            </div>

                            {message && (
                                <div className={`stock-ticker-modal-msg ${message.type}`}>
                                    {message.type === 'success' ? '✅' : '⚠️'} {message.text}
                                </div>
                            )}

                            <label className="stock-ticker-modal-label">
                                {actionStart === 'buy' ? 'Investment Amount (₹)' : 'Units to Sell'}
                            </label>
                            <input
                                type="number"
                                className="stock-ticker-modal-input"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                min="0"
                                autoFocus
                            />
                            {actionStart === 'buy' && (
                                <div className="stock-ticker-modal-quick">
                                    {[1000, 5000].map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setAmount(String(val))}
                                        >
                                            +{val / 1000}k
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="stock-ticker-modal-actions">
                                <button
                                    type="button"
                                    className="stock-ticker-modal-cancel"
                                    onClick={() => {
                                        setSelectedSector(null);
                                        setActionStart(null);
                                        setMessage(null);
                                        setAmount('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className={actionStart === 'buy' ? 'stock-ticker-modal-confirm-buy' : 'stock-ticker-modal-confirm-sell'}
                                    onClick={handleAction}
                                    disabled={isLoading || !amount || Number(amount) <= 0}
                                >
                                    {isLoading ? 'Processing...' : actionStart === 'buy' ? 'Confirm Buy' : 'Confirm Sell'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
