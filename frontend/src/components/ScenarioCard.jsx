import React, { useState, useEffect } from 'react';
import { playSound } from '../utils/sound';
import { useTranslation } from 'react-i18next';
import { getLocalizedText } from '../utils/translateContent';
import './ScenarioCard.css';

const CATEGORY_CONFIG = {
    NEEDS: { labelKey: 'category.needs', icon: '🛒' },
    WANTS: { labelKey: 'category.wants', icon: '🛍️' },
    EMERGENCY: { labelKey: 'category.emergency', icon: '🚨' },
    INVESTMENT: { labelKey: 'category.investment', icon: '📈' },
    SOCIAL: { labelKey: 'category.social', icon: '👥' },
    TRAP: { labelKey: 'category.trap', icon: '⚠️' },
    NEWS: { labelKey: 'category.news', icon: '📰' },
    QUIZ: { labelKey: 'category.quiz', icon: '❓' },
    CAREER: { labelKey: 'category.career', icon: '💼' }
};

const OPTION_LETTERS = ['A', 'B', 'C'];

function formatImpactTag(choice, t) {
    const sym = '₹';
    const tags = [];

    if (choice.wealth_impact < 0) {
        tags.push({ type: 'cost', text: `${sym}${Number(choice.wealth_impact).toLocaleString('en-IN')}`, class: 'impact-cost' });
    }
    if (choice.wealth_impact > 0) {
        tags.push({ type: 'savings', text: `${t('common.savings')} +${sym}${Number(choice.wealth_impact).toLocaleString('en-IN')}`, class: 'impact-savings' });
    }
    if (choice.happiness_impact !== 0) {
        const sign = choice.happiness_impact > 0 ? '+' : '';
        tags.push({ type: 'wellbeing', text: `${t('common.happiness')} ${sign}${choice.happiness_impact}`, class: 'impact-wellbeing' });
    }
    if (choice.credit_impact !== 0) {
        const sign = choice.credit_impact > 0 ? '+' : '';
        tags.push({ type: 'credit', text: `${t('common.credit')} ${sign}${choice.credit_impact}`, class: 'impact-credit' });
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
    onSkipCard
}) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language; // Get current language from i18n instance
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
            if (import.meta.env.DEV) console.error('Failed to use lifeline:', err);
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

    const displayedTitle = getLocalizedText(card, 'title', lang);
    const displayedDescription = getLocalizedText(card, 'description', lang);

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
                {t('game.month', { month: currentMonth })} of 12
            </div>

            <div className="scenario-card-inner">
                <div className="scenario-card-header">
                    <span className="scenario-category-tag">
                        <span className="scenario-category-icon">{categoryInfo.icon}</span>
                        {categoryInfo.labelKey ? t(categoryInfo.labelKey) : categoryInfo.label}
                    </span>
                    <div className="scenario-header-actions">
                        <button
                            type="button"
                            className="scenario-btn-read"
                            onClick={speakCard}
                            title={t('common.read_aloud')}
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
                        {hints && <span className="scenario-hint-active">✨ {t('common.hint')}</span>}
                        {!aiAdvice && onGetAIAdvice && (
                            <button
                                type="button"
                                className="scenario-btn-ai"
                                onClick={handleGetAIAdvice}
                                disabled={isGettingAdvice}
                                title={t('common.get_ai_advice')}
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
                            <span>🤖 {t('common.ai_advisor')}</span>
                            <button type="button" className="scenario-ai-close" onClick={() => setAIAdvice(null)}>×</button>
                        </div>
                        <p className="scenario-ai-text">{aiAdvice}</p>
                    </div>
                )}

                {isBroke && (
                    <div className="scenario-loan-banner">
                        <p>{t('common.low_balance')}</p>
                        <div className="scenario-loan-btns">
                            <button type="button" className="scenario-loan-btn safe" onClick={() => handleTakeLoan('FAMILY')} disabled={isTakingLoan}>
                                {t('common.loan_family')}
                            </button>
                            <button type="button" className="scenario-loan-btn risky" onClick={() => handleTakeLoan('INSTANT_APP')} disabled={isTakingLoan}>
                                {t('common.loan_app')}
                            </button>
                        </div>
                        {loanMessage && <p className="scenario-loan-msg">{loanMessage}</p>}
                    </div>
                )}

                <div className="scenario-options">
                    {card.choices.map((choice, index) => {
                        const isUnaffordable = choice.wealth_impact < 0 && Math.abs(choice.wealth_impact) > (session?.wealth ?? 0);
                        const tags = formatImpactTag(choice, t);
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
                                    <span className="scenario-option-text">{getLocalizedText(choice, 'text', lang)}</span>
                                </div>
                                <div className="scenario-option-tags">
                                    {tags.map((tag, i) => (
                                        <span key={i} className={`scenario-impact-tag ${tag.class}`}>
                                            {tag.text}
                                        </span>
                                    ))}
                                </div>
                                {isRecommended(choice.id) && <span className="scenario-option-badge">⭐ {t('common.ncfe_recommended')}</span>}
                                {isUnaffordable && <span className="scenario-option-badge warn">⚠️ {t('common.requires_loan')}</span>}
                            </button>
                        );
                    })}
                </div>

                {onSkipCard && (
                    <div className="scenario-skip">
                        <button type="button" className="scenario-skip-btn" onClick={handleSkipCard} disabled={disabled || isSkipping}>
                            {isSkipping ? <span className="scenario-spinner" /> : `⏭️ ${t('common.skip_question')}`}
                        </button>
                        <span className="scenario-skip-note">{t('common.skip_cost')}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScenarioCard;
