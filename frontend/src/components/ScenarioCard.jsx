import React, { useState, useEffect } from 'react';
import { playSound } from '../utils/sound';

const ScenarioCard = ({ card, onChoiceSelect, disabled, session, onUseLifeline }) => {
    const [hints, setHints] = useState(null);
    const [isUsingLifeline, setIsUsingLifeline] = useState(false);
    const [cardKey, setCardKey] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState(null);

    // Trigger card flip animation on new card
    useEffect(() => {
        if (card) {
            setCardKey(prev => prev + 1);
            setHints(null);
            setSelectedChoice(null);
            playSound('cardFlip');
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

    return (
        <div key={cardKey} className="scenario-card card-flip-animation">
            <div className="scenario-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className={`scenario-category ${card.category}`}>
                        {card.category}
                    </span>
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
                </div>
                <h2 className="scenario-title">{card.title}</h2>
                <p className="scenario-description">{card.description}</p>
            </div>

            <div className="scenario-body">
                <div className="choices-container">
                    {card.choices.map((choice, index) => (
                        <button
                            key={choice.id}
                            className={`choice-btn ${isRecommended(choice.id) ? 'recommended' : ''} ${selectedChoice === choice.id ? 'selected' : ''}`}
                            onClick={() => handleChoiceClick(choice)}
                            disabled={disabled}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {isRecommended(choice.id) && (
                                <span className="recommended-badge">⭐ NCFE Recommended</span>
                            )}
                            <span className="choice-text">{choice.text}</span>
                            <div className="choice-impacts">
                                {formatImpact(choice.wealth_impact, 'wealth')}
                                {formatImpact(choice.happiness_impact, 'happiness')}
                                {formatImpact(choice.credit_impact, 'credit')}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScenarioCard;
