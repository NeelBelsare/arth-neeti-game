import React, { useState, useEffect } from 'react';
import { playSound } from '../utils/sound';

const ScenarioCard = ({ card, onChoiceSelect, disabled, session, onUseLifeline, onTakeLoan, onGetAIAdvice, onSkipCard, lang }) => {
    const [hints, setHints] = useState(null);
    const [isUsingLifeline, setIsUsingLifeline] = useState(false);
    const [cardKey, setCardKey] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState(null);
    const [loanMessage, setLoanMessage] = useState(null);
    const [isTakingLoan, setIsTakingLoan] = useState(false);
    const [aiAdvice, setAIAdvice] = useState(null);
    const [isGettingAdvice, setIsGettingAdvice] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);

    // Trigger card flip animation on new card
    useEffect(() => {
        if (card) {
            setCardKey(prev => prev + 1);
            setHints(null);
            setSelectedChoice(null);
            setLoanMessage(null);
            setAIAdvice(null);
            playSound('cardFlip');
        }
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, [card?.id]);

    if (!card) return null;

    const formatImpact = (value, type) => {
        if (value === 0) return null;
        const prefix = value > 0 ? '+' : '';
        const className = value > 0 ? 'positive' : 'negative';

        const icons = {
            wealth: '💰',
            happiness: '😊',
            credit: '📊',
            literacy: '📚'
        };

        return (
            <span className={`impact ${className}`}>
                {icons[type]} {prefix}{type === 'wealth' ? `₹${value.toLocaleString('en-IN')}` : value}
            </span>
        );
    };

    const handleUseLifeline = async () => {
        if (!session || session.lifelines <= 0 || isUsingLifeline) return;

        playSound('click');
        setIsUsingLifeline(true);
        try {
            const result = await onUseLifeline(card.id);
            if (result && result.hints) {
                playSound('levelUp');
                // Convert hints array to object for easy lookup
                const hintsMap = {};
                result.hints.forEach(h => {
                    hintsMap[h.choice_id] = h.is_recommended;
                });
                setHints(hintsMap);
            }
        } catch (err) {
            console.error('Failed to use lifeline:', err);
        } finally {
            setIsUsingLifeline(false);
        }
    };

    const handleChoiceClick = (choice) => {
        if (disabled || selectedChoice) return;

        playSound('click');
        setSelectedChoice(choice.id);

        // Add ripple effect class then call parent
        setTimeout(() => {
            onChoiceSelect(choice);
        }, 150);
    };

    const isRecommended = (choiceId) => {
        return hints && hints[choiceId];
    };

    const lifelines = session?.lifelines ?? 0;
    const isBroke = session?.wealth < 4000;

    const t = (en, hi, mr) => {
        if (lang === 'hi' && hi) return hi;
        if (lang === 'mr' && mr) return mr;
        return en;
    };

    const displayedTitle = t(card.title, card.title_hi, card.title_mr);
    const displayedDescription = t(card.description, card.description_hi, card.description_mr);

    const speakCard = () => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            alert('Voice not supported in this browser.');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(`${displayedTitle}. ${displayedDescription}`);
        if (lang === 'hi') {
            utterance.lang = 'hi-IN';
        } else if (lang === 'mr') {
            utterance.lang = 'mr-IN';
        } else {
            utterance.lang = 'en-IN';
        }
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const handleGetAIAdvice = async () => {
        if (!onGetAIAdvice || isGettingAdvice || aiAdvice) return;

        playSound('click');
        setIsGettingAdvice(true);
        try {
            const result = await onGetAIAdvice(card.id);
            if (result?.advice) {
                setAIAdvice(result.advice);
            }
        } catch (err) {
            console.error('Failed to get AI advice:', err);
            setAIAdvice('Unable to get advice right now. Try again later.');
        } finally {
            setIsGettingAdvice(false);
        }
    };

    const handleTakeLoan = async (loanType) => {
        if (!onTakeLoan || isTakingLoan) return;

        playSound('click');
        setIsTakingLoan(true);
        try {
            const result = await onTakeLoan(loanType);
            if (result?.message) {
                setLoanMessage(result.message);
            } else {
                setLoanMessage('Loan request completed.');
            }
        } catch (err) {
            console.error('Failed to take loan:', err);
            setLoanMessage('Loan request failed. Please try again.');
        } finally {
            setIsTakingLoan(false);
        }
    };

    const handleSkipCard = async () => {
        if (!onSkipCard || isSkipping) return;

        playSound('click');
        setIsSkipping(true);
        try {
            await onSkipCard(card.id);
        } catch (err) {
            console.error('Failed to skip card:', err);
        } finally {
            setIsSkipping(false);
        }
    };

    // Check if any choice requires more money than available
    const hasExpensiveChoice = card?.choices?.some(
        choice => choice.wealth_impact < 0 && Math.abs(choice.wealth_impact) > session?.wealth
    );

    return (
        <div key={cardKey} className="scenario-card card-flip-animation">
            <div className="scenario-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className={`scenario-category ${card.category}`}>
                        {card.category}
                    </span>
                    <button
                        className="speaker-btn"
                        onClick={speakCard}
                        type="button"
                        title="Read this scenario aloud"
                    >
                        🔊 Read
                    </button>
                    {lifelines > 0 && !hints && (
                        <button
                            className="lifeline-btn pulse-on-hover"
                            onClick={handleUseLifeline}
                            disabled={isUsingLifeline}
                            title="Ask NCFE for advice"
                        >
                            {isUsingLifeline ? (
                                <span className="loading-spinner" style={{ width: 14, height: 14 }}></span>
                            ) : (
                                <>💡 Ask NCFE ({lifelines})</>
                            )}
                        </button>
                    )}
                    {hints && (
                        <span className="lifeline-used celebrate-bounce">✨ Hint Active</span>
                    )}
                    {!aiAdvice && onGetAIAdvice && (
                        <button
                            className="ai-btn pulse-on-hover"
                            onClick={handleGetAIAdvice}
                            disabled={isGettingAdvice}
                            title="Get AI Financial Advice"
                        >
                            {isGettingAdvice ? (
                                <span className="loading-spinner" style={{ width: 14, height: 14 }}></span>
                            ) : (
                                <>🤖 Ask AI</>
                            )}
                        </button>
                    )}
                </div>
                <h2 className="scenario-title">{displayedTitle}</h2>
                <p className="scenario-description">{displayedDescription}</p>
                {aiAdvice && (
                    <div className="ai-advice-box">
                        <div className="ai-advice-header">
                            <span>🤖 AI Financial Advisor</span>
                            <button
                                className="close-btn"
                                onClick={() => setAIAdvice(null)}
                                title="Close advice"
                            >×</button>
                        </div>
                        <p className="ai-advice-text">{aiAdvice}</p>
                    </div>
                )}
            </div>

            <div className="scenario-body">
                {isBroke && (
                    <div className="emergency-loan">
                        <div>
                            <h3>⚠️ Low Balance Warning</h3>
                            <p>You have less than ₹4,000. Need help to keep going?</p>
                        </div>
                        <div className="loan-options">
                            <button
                                type="button"
                                className="loan-btn safe-loan"
                                onClick={() => handleTakeLoan('FAMILY')}
                                disabled={isTakingLoan}
                            >
                                Ask Family (₹5k, Safe)
                            </button>
                            <button
                                type="button"
                                className="loan-btn risky-loan"
                                onClick={() => handleTakeLoan('INSTANT_APP')}
                                disabled={isTakingLoan}
                            >
                                Instant Loan App (₹10k, Risky)
                            </button>
                        </div>
                        {loanMessage && <p className="loan-message">{loanMessage}</p>}
                    </div>
                )}
                <div className="choices-container">
                    {card.choices.map((choice, index) => {
                        const isUnaffordable = choice.wealth_impact < 0 && Math.abs(choice.wealth_impact) > session?.wealth;
                        return (
                            <button
                                key={choice.id}
                                className={`choice-btn ${isRecommended(choice.id) ? 'recommended' : ''} ${selectedChoice === choice.id ? 'selected' : ''} ${isUnaffordable ? 'unaffordable' : ''}`}
                                onClick={() => handleChoiceClick(choice)}
                                disabled={disabled}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {isRecommended(choice.id) && (
                                    <span className="recommended-badge">⭐ NCFE Recommended</span>
                                )}
                                {isUnaffordable && (
                                    <span className="unaffordable-badge">⚠️ Requires loan</span>
                                )}
                                <span className="choice-text">{choice.text}</span>
                                <div className="choice-impacts">
                                    {formatImpact(choice.wealth_impact, 'wealth')}
                                    {formatImpact(choice.happiness_impact, 'happiness')}
                                    {formatImpact(choice.credit_impact, 'credit')}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Skip Button */}
                {onSkipCard && (
                    <div className="skip-section">
                        <button
                            className="skip-btn"
                            onClick={handleSkipCard}
                            disabled={disabled || isSkipping}
                            title="Skip this question (-5 happiness, -10 credit)"
                        >
                            {isSkipping ? (
                                <span className="loading-spinner" style={{ width: 14, height: 14 }}></span>
                            ) : (
                                <>⏭️ Skip Question</>
                            )}
                        </button>
                        <span className="skip-warning">Skipping costs: -5 happiness, -10 credit</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScenarioCard;
