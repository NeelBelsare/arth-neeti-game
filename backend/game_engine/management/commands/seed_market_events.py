"""
Seed command for Market Events and News Cards.
These events affect stock prices and teach players about macro-economics.
"""
from django.core.management.base import BaseCommand
from game_engine.models import MarketEvent, ScenarioCard, Choice


class Command(BaseCommand):
    help = 'Seeds the database with market events and news cards'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Market Events...')
        
        # Create Market Events
        market_events = [
            {
                'title': 'Tech Boom: AI Revolution',
                'description': 'Major tech companies announce breakthrough AI products. Tech stocks are expected to surge.',
                'sector_impacts': {'tech': 1.25, 'gold': 0.95, 'real_estate': 1.02},
            },
            {
                'title': 'Gold Rush: Global Uncertainty',
                'description': 'International tensions rise, investors flee to safe havens. Gold prices expected to increase.',
                'sector_impacts': {'gold': 1.20, 'tech': 0.90, 'real_estate': 0.98},
            },
            {
                'title': 'Real Estate Revival',
                'description': 'Government announces major infrastructure projects and housing subsidies.',
                'sector_impacts': {'real_estate': 1.15, 'gold': 1.0, 'tech': 1.05},
            },
            {
                'title': 'Tech Crash: Regulation Fears',
                'description': 'New regulations threaten major tech companies. Investors are worried.',
                'sector_impacts': {'tech': 0.75, 'gold': 1.10, 'real_estate': 1.0},
            },
            {
                'title': 'Market Rally: Economic Recovery',
                'description': 'Strong economic data suggests recovery. All sectors expected to benefit.',
                'sector_impacts': {'tech': 1.10, 'gold': 0.95, 'real_estate': 1.12},
            },
            {
                'title': 'Crypto Crash Spillover',
                'description': 'Cryptocurrency markets collapse, causing ripple effects in tech stocks.',
                'sector_impacts': {'tech': 0.85, 'gold': 1.15, 'real_estate': 1.0},
            },
        ]

        for event_data in market_events:
            event, created = MarketEvent.objects.get_or_create(
                title=event_data['title'],
                defaults={
                    'description': event_data['description'],
                    'sector_impacts': event_data['sector_impacts'],
                    'is_active': True,
                }
            )
            if created:
                self.stdout.write(f'  Created: {event.title}')
            else:
                self.stdout.write(f'  Exists: {event.title}')

        self.stdout.write('\nSeeding News Cards...')
        
        # Create NEWS type cards that present market events to players
        news_cards = [
            {
                'title': '📰 Market News: Tech Sector Alert',
                'description': 'Breaking: Major tech companies announce record earnings and new AI products. Analysts predict significant growth in the tech sector. This could be a good opportunity to invest in Tech stocks.',
                'category': 'NEWS',
                'min_month': 3,
                'choices': [
                    {
                        'text': 'Buy Tech Stocks Now! (Use your wealth)',
                        'wealth_impact': 0,  # Actual investment handled by buy_stock API
                        'happiness_impact': 5,
                        'credit_impact': 0,
                        'literacy_impact': 10,
                        'feedback': 'Smart move! Acting on market news is a key skill. Remember: "Buy the rumor, sell the news."',
                        'is_recommended': True,
                    },
                    {
                        'text': 'Wait and watch',
                        'wealth_impact': 0,
                        'happiness_impact': 0,
                        'credit_impact': 0,
                        'literacy_impact': 5,
                        'feedback': 'Being cautious is wise, but sometimes opportunities pass by. Consider acting on well-researched news.',
                        'is_recommended': False,
                    },
                    {
                        'text': 'Sell my Tech holdings (if any)',
                        'wealth_impact': 0,
                        'happiness_impact': -5,
                        'credit_impact': 0,
                        'literacy_impact': -5,
                        'feedback': 'Selling when news is positive? You might be leaving money on the table!',
                        'is_recommended': False,
                    },
                ]
            },
            {
                'title': '📰 Breaking: Global Uncertainty Rising',
                'description': 'International tensions and economic uncertainty are causing investors to seek safe-haven assets. Gold prices are expected to rise as investors flee riskier investments.',
                'category': 'NEWS',
                'min_month': 5,
                'choices': [
                    {
                        'text': 'Move to Gold (Safe Haven)',
                        'wealth_impact': 0,
                        'happiness_impact': 5,
                        'credit_impact': 0,
                        'literacy_impact': 10,
                        'feedback': 'Gold is historically a safe haven during uncertain times. Well done!',
                        'is_recommended': True,
                    },
                    {
                        'text': 'Stay Invested in Tech (High Risk)',
                        'wealth_impact': 0,
                        'happiness_impact': 0,
                        'credit_impact': 0,
                        'literacy_impact': 0,
                        'feedback': 'Staying in volatile assets during uncertainty is risky. Know your risk tolerance.',
                        'is_recommended': False,
                    },
                    {
                        'text': 'Ignore the news',
                        'wealth_impact': 0,
                        'happiness_impact': 0,
                        'credit_impact': 0,
                        'literacy_impact': -5,
                        'feedback': 'Ignoring market signals can be costly. Stay informed!',
                        'is_recommended': False,
                    },
                ]
            },
            {
                'title': '📰 Government Housing Scheme Announced',
                'description': 'The government announces a major housing subsidy program. Real estate developers are celebrating. Property prices expected to rise in the coming months.',
                'category': 'NEWS',
                'min_month': 7,
                'choices': [
                    {
                        'text': 'Invest in Real Estate',
                        'wealth_impact': 0,
                        'happiness_impact': 5,
                        'credit_impact': 5,
                        'literacy_impact': 10,
                        'feedback': 'Government policy often drives real estate markets. Smart connection!',
                        'is_recommended': True,
                    },
                    {
                        'text': "I'll stick with my current portfolio",
                        'wealth_impact': 0,
                        'happiness_impact': 0,
                        'credit_impact': 0,
                        'literacy_impact': 0,
                        'feedback': 'Diversification is good, but recognizing opportunities matters too.',
                        'is_recommended': False,
                    },
                ]
            },
        ]

        for card_data in news_cards:
            card, created = ScenarioCard.objects.get_or_create(
                title=card_data['title'],
                defaults={
                    'description': card_data['description'],
                    'category': card_data['category'],
                    'min_month': card_data['min_month'],
                    'difficulty': 2,
                    'is_active': True,
                }
            )
            
            if created:
                self.stdout.write(f'  Created card: {card.title}')
                # Create choices
                for choice_data in card_data['choices']:
                    Choice.objects.create(card=card, **choice_data)
                    self.stdout.write(f'    + Choice: {choice_data["text"][:40]}...')
            else:
                self.stdout.write(f'  Exists: {card.title}')

        # Create Pop Quiz cards for Recall mechanics
        self.stdout.write('\nSeeding Pop Quiz Cards...')
        
        quiz_cards = [
            {
                'title': '🧠 Pop Quiz: Financial Literacy Check',
                'description': 'Time to test your financial knowledge! During your journey, you\'ve made several financial decisions. Let\'s see what you remember. Question: What is the recommended emergency fund amount?',
                'category': 'QUIZ',
                'min_month': 6,
                'choices': [
                    {
                        'text': '3-6 months of expenses',
                        'wealth_impact': 500,
                        'happiness_impact': 10,
                        'credit_impact': 0,
                        'literacy_impact': 15,
                        'feedback': 'Correct! 3-6 months of expenses is the standard recommendation for an emergency fund.',
                        'is_recommended': True,
                    },
                    {
                        'text': '1 month of salary',
                        'wealth_impact': -500,
                        'happiness_impact': -5,
                        'credit_impact': 0,
                        'literacy_impact': 5,
                        'feedback': 'That\'s too little! One month won\'t cover most emergencies. Aim for 3-6 months.',
                        'is_recommended': False,
                    },
                    {
                        'text': "Whatever I can save",
                        'wealth_impact': -300,
                        'happiness_impact': 0,
                        'credit_impact': 0,
                        'literacy_impact': 0,
                        'feedback': 'Having a specific target helps! The standard is 3-6 months of expenses.',
                        'is_recommended': False,
                    },
                ]
            },
            {
                'title': '🧠 Pop Quiz: Credit Score Knowledge',
                'description': 'Quick check on your credit knowledge! What is the typical good credit score range in India (CIBIL score)?',
                'category': 'QUIZ',
                'min_month': 9,
                'choices': [
                    {
                        'text': '750-900',
                        'wealth_impact': 500,
                        'happiness_impact': 10,
                        'credit_impact': 10,
                        'literacy_impact': 15,
                        'feedback': 'Correct! 750+ is considered a good CIBIL score in India.',
                        'is_recommended': True,
                    },
                    {
                        'text': '500-700',
                        'wealth_impact': -500,
                        'happiness_impact': -5,
                        'credit_impact': -5,
                        'literacy_impact': 5,
                        'feedback': 'That\'s actually a fair to poor score. 750+ is considered good.',
                        'is_recommended': False,
                    },
                    {
                        'text': '300-500',
                        'wealth_impact': -500,
                        'happiness_impact': -10,
                        'credit_impact': -10,
                        'literacy_impact': 0,
                        'feedback': 'That\'s a very low score! 750+ is the target for a good credit rating.',
                        'is_recommended': False,
                    },
                ]
            },
        ]

        for card_data in quiz_cards:
            card, created = ScenarioCard.objects.get_or_create(
                title=card_data['title'],
                defaults={
                    'description': card_data['description'],
                    'category': card_data['category'],
                    'min_month': card_data['min_month'],
                    'difficulty': 3,
                    'is_active': True,
                }
            )
            
            if created:
                self.stdout.write(f'  Created quiz: {card.title}')
                for choice_data in card_data['choices']:
                    Choice.objects.create(card=card, **choice_data)
            else:
                self.stdout.write(f'  Exists: {card.title}')

        # Create Recurring Expense cards (Subscription Traps)
        self.stdout.write('\nSeeding Subscription Cards...')
        
        subscription_cards = [
            {
                'title': '🎬 Netflix Premium Offer',
                'description': 'Netflix is offering a premium subscription. All your friends have it. The first month is free, then ₹500/month.',
                'category': 'TRAP',
                'min_month': 2,
                'choices': [
                    {
                        'text': 'Subscribe! (₹500/month recurring)',
                        'wealth_impact': 0,
                        'happiness_impact': 15,
                        'credit_impact': 0,
                        'literacy_impact': -5,
                        'feedback': 'Entertainment is important, but remember: this ₹500/month will keep draining your wealth every month!',
                        'is_recommended': False,
                        'adds_recurring_expense': 500,
                        'expense_name': 'Netflix Premium',
                    },
                    {
                        'text': 'No thanks, I have other entertainment',
                        'wealth_impact': 0,
                        'happiness_impact': -5,
                        'credit_impact': 0,
                        'literacy_impact': 10,
                        'feedback': 'FOMO avoided! You saved yourself from a recurring expense.',
                        'is_recommended': True,
                    },
                    {
                        'text': 'Split with friends (₹150/month)',
                        'wealth_impact': 0,
                        'happiness_impact': 10,
                        'credit_impact': 0,
                        'literacy_impact': 15,
                        'feedback': 'Smart! Sharing subscriptions is a great way to save money.',
                        'is_recommended': True,
                        'adds_recurring_expense': 150,
                        'expense_name': 'Netflix (Shared)',
                    },
                ]
            },
            {
                'title': '🏋️ Premium Gym Membership',
                'description': 'A fancy gym near your office offers a premium membership. It has all the latest equipment. ₹2000/month, 6-month lock-in.',
                'category': 'WANTS',
                'min_month': 3,
                'choices': [
                    {
                        'text': 'Join the premium gym (₹2000/month)',
                        'wealth_impact': 0,
                        'happiness_impact': 10,
                        'credit_impact': 0,
                        'literacy_impact': -5,
                        'feedback': 'Study shows 80% of gym members stop going after 3 months but keep paying!',
                        'is_recommended': False,
                        'adds_recurring_expense': 2000,
                        'expense_name': 'Premium Gym',
                    },
                    {
                        'text': 'Use the free park nearby',
                        'wealth_impact': 0,
                        'happiness_impact': 5,
                        'credit_impact': 0,
                        'literacy_impact': 15,
                        'feedback': 'Outdoor exercise is free and often more effective!',
                        'is_recommended': True,
                    },
                    {
                        'text': 'Join a basic gym (₹500/month)',
                        'wealth_impact': 0,
                        'happiness_impact': 8,
                        'credit_impact': 0,
                        'literacy_impact': 10,
                        'feedback': 'Budget-friendly fitness! Good balance of cost and convenience.',
                        'is_recommended': True,
                        'adds_recurring_expense': 500,
                        'expense_name': 'Basic Gym',
                    },
                ]
            },
            {
                'title': '❌ Cancel Subscription',
                'description': 'You\'re reviewing your monthly expenses and notice several subscriptions draining your account. Time to make a decision.',
                'category': 'NEEDS',
                'min_month': 8,
                'choices': [
                    {
                        'text': 'Cancel Netflix subscription',
                        'wealth_impact': 0,
                        'happiness_impact': -5,
                        'credit_impact': 0,
                        'literacy_impact': 10,
                        'feedback': 'Smart financial decision! You stopped a recurring drain.',
                        'is_recommended': True,
                        'cancels_expense_name': 'Netflix Premium',
                    },
                    {
                        'text': 'Cancel gym membership',
                        'wealth_impact': 0,
                        'happiness_impact': -3,
                        'credit_impact': 0,
                        'literacy_impact': 10,
                        'feedback': 'If you\'re not using it, canceling is the smart choice!',
                        'is_recommended': True,
                        'cancels_expense_name': 'Premium Gym',
                    },
                    {
                        'text': "Keep all subscriptions (they're worth it!)",
                        'wealth_impact': 0,
                        'happiness_impact': 5,
                        'credit_impact': 0,
                        'literacy_impact': -10,
                        'feedback': 'Subscription creep is real! Are you actually using all these services?',
                        'is_recommended': False,
                    },
                ]
            },
        ]

        for card_data in subscription_cards:
            card, created = ScenarioCard.objects.get_or_create(
                title=card_data['title'],
                defaults={
                    'description': card_data['description'],
                    'category': card_data['category'],
                    'min_month': card_data['min_month'],
                    'difficulty': 2,
                    'is_active': True,
                }
            )
            
            if created:
                self.stdout.write(f'  Created: {card.title}')
                for choice_data in card_data['choices']:
                    Choice.objects.create(card=card, **choice_data)
            else:
                self.stdout.write(f'  Exists: {card.title}')

        self.stdout.write(self.style.SUCCESS('\n✅ Market events and special cards seeded successfully!'))
