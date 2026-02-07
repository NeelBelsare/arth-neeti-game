import React, { useState } from 'react';
import './BudgetDisplay.css';

const BudgetDisplay = ({ expenses, totalMonthlyDrain, marketPrices }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Group by Category
    const groupedExpenses = expenses.reduce((acc, expense) => {
        const category = expense.category || 'OTHER';
        if (!acc[category]) acc[category] = [];
        acc[category].push(expense);
        return acc;
    }, {});

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="budget-card">
            <div className="budget-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="header-left">
                    <div className="icon-wrapper">
                        <span style={{ fontSize: '24px' }}>🚨</span>
                    </div>
                    <div className="header-text">
                        <h3>Monthly Bills</h3>
                        <p className="subtitle">Projected Outflow</p>
                    </div>
                </div>
                <div className="header-right">
                    <span className="total-amount">-{formatCurrency(totalMonthlyDrain)}</span>
                    <span style={{ fontSize: '20px' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {isExpanded && (
                <div className="budget-details">
                    <div className="inflation-note">
                        <span style={{ marginRight: '8px' }}>📈</span>
                        <span>Inflation is active. Prices rise annually.</span>
                    </div>

                    <div className="expense-list">
                        {Object.keys(groupedExpenses).map(cat => (
                            <div key={cat} className="category-group">
                                <h4 className="category-title">{cat}</h4>
                                {groupedExpenses[cat].map(exp => (
                                    <div key={exp.id} className="expense-item">
                                        <span className="expense-name">
                                            {exp.name}
                                            {exp.is_essential && <span className="tag-essential">Essential</span>}
                                        </span>
                                        <span className="expense-amount">-{formatCurrency(exp.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="budget-footer">
                        <p>Payable on Month End</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetDisplay;
