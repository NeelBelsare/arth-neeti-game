import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { api } from '../api';
import StockTicker from '../components/StockTicker';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './StockMarketPage.css';

const StockMarketPage = ({ onBuy, onSell }) => {
    const navigate = useNavigate();
    const { session } = useSession();
    const [marketData, setMarketData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (session?.id) {
            fetchMarketData();
        }
    }, [session?.id]);

    const fetchMarketData = async () => {
        try {
            setIsLoading(true);
            const data = await api.getMarketStatus(session.id);
            setMarketData(data);
        } catch (err) {
            setError('Failed to load market data');
            if (import.meta.env.DEV) console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="stock-market-page">
                <div className="page-header">
                    <button onClick={() => navigate(-1)} className="back-button">
                        ← Back
                    </button>
                    <h1>Stock Market</h1>
                </div>
                <div className="error-message">
                    <p>No active game session. Please start a game first.</p>
                    <button onClick={() => navigate('/')} className="btn-primary">
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="stock-market-page">
            <div className="page-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    ← Back
                </button>
                <div className="header-content">
                    <h1>Stock Market</h1>
                    <p className="subtitle">Invest wisely and grow your portfolio</p>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-container" style={{ padding: '2rem' }}>
                    <LoadingSkeleton variant="stats" lines={1} />
                    <div style={{ height: '2rem' }} />
                    <LoadingSkeleton variant="card" lines={3} />
                </div>
            ) : error ? (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={fetchMarketData} className="btn-primary">
                        Retry
                    </button>
                </div>
            ) : (
                <div className="market-content">
                    <div className="market-info-card">
                        <h2>Market Overview</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="label">Current Wealth</span>
                                <span className="value wealth">₹{session.wealth?.toLocaleString() || 0}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Portfolio Value</span>
                                <span className="value portfolio">
                                    ₹{(() => {
                                        const portfolio = session.portfolio || {};
                                        const prices = session.market_prices || {};
                                        let total = 0;
                                        Object.keys(portfolio).forEach(sector => {
                                            total += (portfolio[sector] || 0) * (prices[sector] || 0);
                                        });
                                        return total.toLocaleString();
                                    })()}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="label">Total Assets</span>
                                <span className="value total">
                                    ₹{(() => {
                                        const portfolio = session.portfolio || {};
                                        const prices = session.market_prices || {};
                                        let total = session.wealth || 0;
                                        Object.keys(portfolio).forEach(sector => {
                                            total += (portfolio[sector] || 0) * (prices[sector] || 0);
                                        });
                                        return total.toLocaleString();
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <StockTicker session={session} onBuy={onBuy} onSell={onSell} />

                    <div className="market-tips">
                        <h3>💡 Investment Tips</h3>
                        <ul>
                            <li>Diversify your portfolio across different sectors</li>
                            <li>Don't invest more than you can afford to lose</li>
                            <li>Market prices fluctuate - buy low, sell high</li>
                            <li>Consider your financial goals before investing</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockMarketPage;
