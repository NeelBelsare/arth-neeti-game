import { useState, useCallback, useEffect } from 'react';
import { api } from './api';
import GameStats from './components/GameStats';
import ScenarioCard from './components/ScenarioCard';
import FeedbackModal from './components/FeedbackModal';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import ParticleBackground from './components/ParticleBackground';
import StockTicker from './components/StockTicker';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import './App.css';
import './components/ReportModal.css';

import ProfileScreen from './components/ProfileScreen';

// Game states
const GAME_STATE = {
    LOGIN: 'login',
    REGISTER: 'register',
    PROFILE: 'profile',
    START: 'start',
    PLAYING: 'playing',
    FEEDBACK: 'feedback',
    GAME_OVER: 'game_over',
    LOADING: 'loading',
};

// ... inside App component ...
const SESSION_STORAGE_KEY = 'arthneeti_session_id';

function App() {
    const [gameState, setGameState] = useState(GAME_STATE.LOADING);
    const [session, setSession] = useState(null);
    const [username, setUsername] = useState(null);
    const [currentCard, setCurrentCard] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [gameOverData, setGameOverData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lang, setLang] = useState('en');

    // Init: Check for auth token and session
    useEffect(() => {
        const initApp = async () => {
            const token = localStorage.getItem('auth_token');
            const savedUsername = localStorage.getItem('username');

            if (!token) {
                setGameState(GAME_STATE.LOGIN);
                return;
            }

            setUsername(savedUsername);

            // Try to resume session
            const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
            if (savedSessionId) {
                try {
                    const sessionData = await api.getSession(savedSessionId);
                    if (sessionData.session && sessionData.session.is_active) {
                        setSession(sessionData.session);
                        // Get next card
                        const cardData = await api.getCard(savedSessionId);
                        if (!cardData.game_complete) {
                            setCurrentCard(cardData.card);
                            setGameState(GAME_STATE.PLAYING);
                            return;
                        } else {
                            localStorage.removeItem(SESSION_STORAGE_KEY);
                        }
                    } else {
                        localStorage.removeItem(SESSION_STORAGE_KEY);
                    }
                } catch (err) {
                    console.log('Could not resume session:', err);
                    localStorage.removeItem(SESSION_STORAGE_KEY);
                }
            }

            // If authenticated but no active session
            setGameState(GAME_STATE.START);
        };

        initApp();
    }, []);

    // Auth Handlers
    const handleLoginSuccess = useCallback((data) => {
        setUsername(data.username);
        setGameState(GAME_STATE.START);
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('username');
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setSession(null);
        setUsername(null);
        setGameState(GAME_STATE.LOGIN);
    }, []);

    // Start a new game
    const handleStartGame = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.startGame();
            setSession(data.session);

            // Save session to localStorage for resume capability
            localStorage.setItem(SESSION_STORAGE_KEY, data.session.id);

            // Fetch first card
            const cardData = await api.getCard(data.session.id);
            setCurrentCard(cardData.card);
            setGameState(GAME_STATE.PLAYING);
        } catch (err) {
            setError('Failed to start game. Is the backend running?');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle choice selection
    const handleChoiceSelect = useCallback(async (choice) => {
        if (!session || !currentCard) return;

        setIsLoading(true);
        try {
            const result = await api.submitChoice(session.id, currentCard.id, choice.id);

            // Update session with new values
            setSession(result.session);

            // Show feedback
            setFeedback({
                text: result.feedback,
                wasRecommended: result.was_recommended,
            });
            setGameState(GAME_STATE.FEEDBACK);

            // Check if game over
            if (result.game_over) {
                setGameOverData({
                    reason: result.game_over_reason,
                    persona: result.final_persona,
                });
            }
        } catch (err) {
            setError('Failed to submit choice');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [session, currentCard]);

    // Continue after feedback
    const handleContinue = useCallback(async () => {
        if (gameOverData) {
            setGameState(GAME_STATE.GAME_OVER);
            return;
        }

        setIsLoading(true);
        try {
            const cardData = await api.getCard(session.id);

            if (cardData.game_complete) {
                setGameOverData({
                    reason: 'COMPLETED',
                    persona: null,
                });
                setGameState(GAME_STATE.GAME_OVER);
            } else {
                setCurrentCard(cardData.card);
                setGameState(GAME_STATE.PLAYING);
            }
        } catch (err) {
            setError('Failed to get next card');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [session, gameOverData]);

    // Use a lifeline
    const handleUseLifeline = useCallback(async (cardId) => {
        if (!session) return null;
        try {
            const result = await api.useLifeline(session.id, cardId);
            // Update session with new lifeline count
            if (result.session) {
                setSession(result.session);
            }
            return result;
        } catch (err) {
            console.error('Failed to use lifeline:', err);
            return null;
        }
    }, [session]);

    const handleTakeLoan = useCallback(async (loanType) => {
        if (!session) return null;
        try {
            const result = await api.takeLoan(session.id, loanType);
            if (result.session) {
                setSession(result.session);
            }
            return result;
        } catch (err) {
            console.error('Failed to take loan:', err);
            return null;
        }
    }, [session]);

    // Get AI advice for a card
    const handleGetAIAdvice = useCallback(async (cardId) => {
        if (!session) return null;
        try {
            const result = await api.getAIAdvice(session.id, cardId);
            return result;
        } catch (err) {
            console.error('Failed to get AI advice:', err);
            return null;
        }
    }, [session]);

    // Stock Market 2.0 Handlers
    const handleBuyStock = useCallback(async (sector, amount) => {
        if (!session) return null;
        try {
            const result = await api.buyStock(session.id, sector, amount);
            if (result.session) setSession(result.session);
            return result;
        } catch (err) {
            console.error('Failed to buy stock:', err);
            return { error: err.message };
        }
    }, [session]);

    const handleSellStock = useCallback(async (sector, units) => {
        if (!session) return null;
        try {
            const result = await api.sellStock(session.id, sector, units);
            if (result.session) setSession(result.session);
            return result;
        } catch (err) {
            console.error('Failed to sell stock:', err);
            return { error: err.message };
        }
    }, [session]);

    // Skip current card and get next
    const handleSkipCard = useCallback(async (cardId) => {
        if (!session || !cardId) return;

        // Clear current card immediately to show loading state
        setCurrentCard(null);
        setIsLoading(true);

        try {
            // Skip the card (this records it as shown)
            const result = await api.skipCard(session.id, cardId);
            if (result.session) {
                setSession(result.session);
            }

            // Fetch next card (will exclude the skipped card)
            const cardData = await api.getCard(session.id);
            if (cardData.game_complete) {
                setGameOverData({
                    reason: 'COMPLETED',
                    persona: cardData.persona || null,
                });
                setGameState(GAME_STATE.GAME_OVER);
            } else if (cardData.card) {
                setCurrentCard(cardData.card);
            }
        } catch (err) {
            console.error('Failed to skip card:', err);
            // If skip failed, try to recover by fetching any card
            try {
                const cardData = await api.getCard(session.id);
                if (cardData.card) {
                    setCurrentCard(cardData.card);
                }
            } catch (e) {
                console.error('Failed to recover:', e);
            }
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    // Play again
    const handlePlayAgain = useCallback(() => {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setSession(null);
        setCurrentCard(null);
        setFeedback(null);
        setGameOverData(null);
        setError(null);
        setGameState(GAME_STATE.START);
    }, []);

    // Render based on game state
    const renderContent = () => {
        if (error) {
            return (
                <div className="container flex-col-center">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{ marginBottom: '1rem' }}>Connection Error</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{error}</p>
                    <button className="btn btn-primary" onClick={() => setError(null)}>
                        Try Again
                    </button>
                    <button className="btn btn-secondary mt-4" onClick={handleLogout}>
                        Log Out
                    </button>
                </div>
            );
        }

        switch (gameState) {
            case GAME_STATE.LOGIN:
                return (
                    <LoginScreen
                        onLoginSuccess={handleLoginSuccess}
                        onNavigateToRegister={() => setGameState(GAME_STATE.REGISTER)}
                    />
                );

            case GAME_STATE.REGISTER:
                return (
                    <RegisterScreen
                        onLoginSuccess={handleLoginSuccess}
                        onNavigateToLogin={() => setGameState(GAME_STATE.LOGIN)}
                    />
                );

            case GAME_STATE.START:
                return (
                    <>
                        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
                            <span className="text-white/80">Welcome, {username}</span>
                            <button
                                onClick={() => setGameState(GAME_STATE.PROFILE)}
                                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 rounded-lg text-sm transition-colors border border-emerald-500/30"
                            >
                                Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg text-sm transition-colors border border-red-500/30"
                            >
                                Log Out
                            </button>
                        </div>
                        <StartScreen onStartGame={handleStartGame} isLoading={isLoading} />
                    </>
                );

            case GAME_STATE.PROFILE:
                return <ProfileScreen onBack={() => setGameState(GAME_STATE.START)} />;

            case GAME_STATE.PLAYING:
                return (
                    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
                        <div className="flex justify-between items-center mb-4 px-4 bg-slate-800/50 backdrop-blur-sm rounded-xl py-2">
                            <div className="language-toggle">
                                <span>Language:</span>
                                <div className="language-buttons">
                                    <button
                                        type="button"
                                        className={lang === 'en' ? 'active' : ''}
                                        onClick={() => setLang('en')}
                                    >
                                        En
                                    </button>
                                    <button
                                        type="button"
                                        className={lang === 'hi' ? 'active' : ''}
                                        onClick={() => setLang('hi')}
                                    >
                                        Hi
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-xs text-red-300 hover:text-red-100 hover:underline"
                            >
                                Quit & Logout
                            </button>
                        </div>

                        <StockTicker
                            session={session}
                            onBuy={handleBuyStock}
                            onSell={handleSellStock}
                        />
                        <GameStats session={session} />
                        <ScenarioCard
                            card={currentCard}
                            onChoiceSelect={handleChoiceSelect}
                            disabled={isLoading}
                            session={session}
                            onUseLifeline={handleUseLifeline}
                            onTakeLoan={handleTakeLoan}
                            onGetAIAdvice={handleGetAIAdvice}
                            onSkipCard={handleSkipCard}
                            lang={lang}
                        />
                    </div>
                );

            case GAME_STATE.FEEDBACK:
                return (
                    <>
                        <div className="container" style={{ paddingTop: '2rem' }}>
                            <GameStats session={session} />
                        </div>
                        <FeedbackModal
                            feedback={feedback?.text}
                            wasRecommended={feedback?.wasRecommended}
                            onContinue={handleContinue}
                        />
                    </>
                );

            case GAME_STATE.GAME_OVER:
                return (
                    <GameOverScreen
                        session={session}
                        persona={gameOverData?.persona}
                        reason={gameOverData?.reason}
                        onPlayAgain={handlePlayAgain}
                    />
                );

            case GAME_STATE.LOADING:
                return (
                    <div className="loading-screen">
                        <div className="loading-spinner"></div>
                        <p>Loading...</p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="app">
            <ParticleBackground intensity="normal" />
            {renderContent()}
        </div>
    );
}

export default App;
