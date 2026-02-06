import React, { useState, useEffect } from 'react';
import { playSound } from '../utils/sound';
import './ScenarioCard.css';

const CATEGORY_CONFIG = {
    NEEDS: { label: 'Needs', icon: '🛒' },
    WANTS: { label: 'Wants', icon: '🛍️' },
    EMERGENCY: { label: 'Emergency', icon: '🚨' },
    INVESTMENT: { label: 'Investment', icon: '📈' },
    SOCIAL: { label: 'Social', icon: '👥' },
    TRAP: { label: 'Trap', icon: '⚠️' },
    NEWS: { label: 'News', icon: '📰' },
    QUIZ: { label: 'Quiz', icon: '❓' },
    CAREER: { label: 'Career', icon: '💼' }
};

const OPTION_LETTERS = ['A', 'B', 'C'];

function formatImpactTag(choice) {
    const sym = '₹';
    const tags = [];

    if (choice.wealth_impact < 0) {
        tags.push({ type: 'cost', text: `${sym}${Number(choice.wealth_impact).toLocaleString('en-IN')}`, class: 'impact-cost' });
    }
    if (choice.wealth_impact > 0) {
        tags.push({ type: 'savings', text: `Savings +${sym}${Number(choice.wealth_impact).toLocaleString('en-IN')}`, class: 'impact-savings' });
    }
    if (choice.happiness_impact !== 0) {
        const sign = choice.happiness_impact > 0 ? '+' : '';
        tags.push({ type: 'wellbeing', text: `Wellbeing ${sign}${choice.happiness_impact}`, class: 'impact-wellbeing' });
    }
    if (choice.credit_impact !== 0) {
        const sign = choice.credit_impact > 0 ? '+' : '';
        tags.push({ type: 'credit', text: `Credit ${sign}${choice.credit_impact}`, class: 'impact-credit' });
    }

    return tags;
}

const ScenarioCard = ({
    card,
    onChoiceSelect,
    disabled,
    session,
    onUseLifeline,
    onTakeLoan,
    onGetAIAdvice,
    onSkipCard,
    lang
}) => {
    const [hints, setHints] = useState(null);
    const [isUsingLifeline, setIsUsingLifeline] = useState(false);
    const [cardKey, setCardKey] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState(null);
    const [loanMessage, setLoanMessage] = useState(null);
    const [isTakingLoan, setIsTakingLoan] = useState(false);
    const [aiAdvice, setAIAdvice] = useState(null);
    const [isGettingAdvice, setIsGettingAdvice] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);

    useEffect(() => {
        if (card) {
            setCardKey((prev) => prev + 1);
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

    const handleUseLifeline = async () => {
        if (!session || session.lifelines <= 0 || isUsingLifeline) return;
        playSound('click');
        setIsUsingLifeline(true);
        try {
            const result = await onUseLifeline(card.id);
            if (result && result.hints) {
                playSound('levelUp');
                const hintsMap = {};
                result.hints.forEach((h) => {
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
        setTimeout(() => onChoiceSelect(choice), 150);
    };

    const isRecommended = (choiceId) => hints && hints[choiceId];

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
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(`${displayedTitle}. ${displayedDescription}`);
        utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const handleGetAIAdvice = async () => {
        if (!onGetAIAdvice || isGettingAdvice || aiAdvice) return;
        playSound('click');
        setIsGettingAdvice(true);
        try {
            const result = await onGetAIAdvice(card.id);
            if (result?.advice) setAIAdvice(result.advice);
        } catch (err) {
            setAIAdvice('Unable to get advice right now.');
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
            if (result?.message) setLoanMessage(result.message);
            else setLoanMessage('Loan request completed.');
        } catch (err) {
            setLoanMessage('Loan request failed.');
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
        } finally {
            setIsSkipping(false);
        }
    };

    const categoryInfo = CATEGORY_CONFIG[card.category] || { label: card.category, icon: '📋' };
    const currentMonth = session?.current_month ?? 1;

    return (
        <div key={cardKey} className="scenario-card-new card-flip-animation">
            <div className="scenario-month-pill">
                Month {currentMonth} of 12
            </div>

            <div className="scenario-card-inner">
                <div className="scenario-card-header">
                    <span className="scenario-category-tag">
                        <span className="scenario-category-icon">{categoryInfo.icon}</span>
                        {categoryInfo.label}
                    </span>
                    <div className="scenario-header-actions">
                        <button
                            type="button"
                            className="scenario-btn-read"
                            onClick={speakCard}
                            title="Read aloud"
                        >
                            🔊
                        </button>
                        {lifelines > 0 && !hints && (
                            <button
                                type="button"
                                className="scenario-btn-hint"
                                onClick={handleUseLifeline}
                                disabled={isUsingLifeline}
                                title="Ask NCFE for advice"
                            >
                                {isUsingLifeline ? (
                                    <span className="scenario-spinner" />
                                ) : (
                                    <>💡</>
                                )}
                            </button>
                        )}
                        {hints && <span className="scenario-hint-active">✨ Hint</span>}
                        {!aiAdvice && onGetAIAdvice && (
                            <button
                                type="button"
                                className="scenario-btn-ai"
                                onClick={handleGetAIAdvice}
                                disabled={isGettingAdvice}
                                title="Get AI advice"
                            >
                                {isGettingAdvice ? <span className="scenario-spinner" /> : '🤖'}
                            </button>
                        )}
                    </div>
                </div>

                <h2 className="scenario-title-new">{displayedTitle}</h2>
                <p className="scenario-desc-new">{displayedDescription}</p>

                {aiAdvice && (
                    <div className="scenario-ai-box">
                        <div className="scenario-ai-header">
                            <span>🤖 AI Advisor</span>
                            <button type="button" className="scenario-ai-close" onClick={() => setAIAdvice(null)}>×</button>
                        </div>
                        <p className="scenario-ai-text">{aiAdvice}</p>
                    </div>
                )}

                {isBroke && (
                    <div className="scenario-loan-banner">
                        <p>⚠️ Low balance. Need help?</p>
                        <div className="scenario-loan-btns">
                            <button type="button" className="scenario-loan-btn safe" onClick={() => handleTakeLoan('FAMILY')} disabled={isTakingLoan}>
                                Family (₹5k)
                            </button>
                            <button type="button" className="scenario-loan-btn risky" onClick={() => handleTakeLoan('INSTANT_APP')} disabled={isTakingLoan}>
                                Instant App (₹10k)
                            </button>
                        </div>
                        {loanMessage && <p className="scenario-loan-msg">{loanMessage}</p>}
                    </div>
                )}

                <div className="scenario-options">
                    {card.choices.map((choice, index) => {
                        const isUnaffordable = choice.wealth_impact < 0 && Math.abs(choice.wealth_impact) > (session?.wealth ?? 0);
                        const tags = formatImpactTag(choice, true);
                        return (
                            <button
                                key={choice.id}
                                type="button"
                                className={`scenario-option ${isRecommended(choice.id) ? 'recommended' : ''} ${selectedChoice === choice.id ? 'selected' : ''} ${isUnaffordable ? 'unaffordable' : ''}`}
                                onClick={() => handleChoiceClick(choice)}
                                disabled={disabled}
                            >
                                <div className="scenario-option-main">
                                    <span className="scenario-option-letter">{OPTION_LETTERS[index] ?? index + 1}</span>
                                    <span className="scenario-option-text">{choice.text}</span>
                                </div>
                                <div className="scenario-option-tags">
                                    {tags.map((tag, i) => (
                                        <span key={i} className={`scenario-impact-tag ${tag.class}`}>
                                            {tag.text}
                                        </span>
                                    ))}
                                </div>
                                {isRecommended(choice.id) && <span className="scenario-option-badge">⭐ NCFE Recommended</span>}
                                {isUnaffordable && <span className="scenario-option-badge warn">⚠️ Requires loan</span>}
                            </button>
                        );
                    })}
                </div>

                {onSkipCard && (
                    <div className="scenario-skip">
                        <button type="button" className="scenario-skip-btn" onClick={handleSkipCard} disabled={disabled || isSkipping}>
                            {isSkipping ? <span className="scenario-spinner" /> : '⏭️ Skip Question'}
                        </button>
                        <span className="scenario-skip-note">-5 happiness, -10 credit</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScenarioCard;
