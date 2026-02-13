"""
GameEngine configuration constants.

All game tuning knobs live here so they can be imported independently
without pulling in Django models or external libraries.
"""


class GameEngineConfig:
    """Namespace for game configuration constants."""

    CONFIG = {
        'STARTING_WEALTH': 25000,
        'HAPPINESS_START': 100,
        'CREDIT_SCORE_START': 700,
        'START_MONTH': 1,
        'CARDS_PER_MONTH': 3,
        'GAME_DURATION_MONTHS': 60,
        'MIN_HAPPINESS': 0,
        'MAX_HAPPINESS': 100,
        'MIN_CREDIT': 300,
        'MAX_CREDIT': 900,
        'MONTHLY_SALARY': 25000,
        'STOCK_SECTORS': ['gold', 'tech', 'real_estate'],
        'LEVEL_THRESHOLDS': [
            {'level': 1, 'min_month': 1, 'min_literacy': 0, 'desc': 'The Basics'},
            {'level': 2, 'min_month': 6, 'min_literacy': 20, 'desc': 'Credit & Debt'},
            {'level': 3, 'min_month': 12, 'min_literacy': 45, 'desc': 'Investing'},
            {'level': 4, 'min_month': 24, 'min_literacy': 70, 'desc': 'Diversification'},
            {'level': 5, 'min_month': 36, 'min_literacy': 90, 'desc': 'Mastery'}
        ],
        'LEVEL_CARD_FILTERS': {
            1: {
                'max_difficulty': 2,
                'categories': ['NEEDS', 'WANTS', 'EMERGENCY', 'SOCIAL']
            },
            2: {
                'max_difficulty': 3,
                'categories': ['NEEDS', 'WANTS', 'EMERGENCY', 'SOCIAL', 'DEBT', 'SHOPPING']
            },
            3: {
                'max_difficulty': 4,
                'categories': ['NEEDS', 'WANTS', 'EMERGENCY', 'SOCIAL', 'INVESTMENT', 'NEWS']
            },
            4: {
                'max_difficulty': 5,
                'categories': ['NEEDS', 'WANTS', 'EMERGENCY', 'SOCIAL', 'INVESTMENT', 'NEWS', 'QUIZ', 'TRAP']
            },
            5: {
                'max_difficulty': 5,
                'categories': None  # All
            }
        },
        'LEVEL_UNLOCKS': {
            'loans': 2,
            'investing': 3,
            'diversification': 4,
            'mastery': 5
        },
        'MUTUAL_FUNDS': {
            'NIFTY50': {'name': 'Nifty 50 Index Fund', 'risk': 'LOW', 'volatility': 0.03},
            'MIDCAP': {'name': 'MidCap Opportunities', 'risk': 'MEDIUM', 'volatility': 0.06},
            'SMALLCAP': {'name': 'SmallCap Discovery', 'risk': 'HIGH', 'volatility': 0.10}
        },
        'IPO_SCHEDULE': {
            6: {'name': 'Zomato', 'price_band': 76, 'listing_gain_prob': 0.7},
            12: {'name': 'LIC', 'price_band': 900, 'listing_gain_prob': 0.4},
            18: {'name': 'Paytm', 'price_band': 2150, 'listing_gain_prob': 0.1},
            24: {'name': 'Tata Tech', 'price_band': 500, 'listing_gain_prob': 0.9}
        }
    }


REPORT_PROMPT_TEMPLATE = (
    "You are an expert financial coach. Generate a concise Markdown report for the player. "
    "Use the sections: Summary, Highlights, Risks, Recommendations. "
    "Be supportive, specific, and keep it under 400 words.\n\n"
    "Game outcome reason: {reason}\n"
    "Final month: {current_month}\n"
    "Final wealth: ₹{wealth}\n"
    "Final happiness: {happiness}\n"
    "Final credit score: {credit_score}\n"
    "Financial literacy: {financial_literacy}\n"
    "Recurring expenses: ₹{recurring_expenses}\n"
    "Portfolio value: ₹{portfolio_value}\n"
    "Portfolio breakdown: {portfolio_breakdown}\n\n"
    "Gameplay log:\n{gameplay_log}\n"
)
