import os
import random
import logging
import uuid
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from .models import GameSession, PlayerChoice, RecurringExpense, GameHistory, PlayerProfile, ScenarioCard, StockHistory, FuturesContract, IncomeSource, MarketTickerData
from .ml.predictor import AIStockPredictor
from .advisor import GROQ_AVAILABLE as GENAI_AVAILABLE, get_advisor, AdvisorPersona, ChatbotMessage
from .ai_engine import get_ai_master

# Optional: Google Generative AI for final reports
try:
    import google.generativeai as genai
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

class GameEngine:
    # Game Configuration Constants
    CONFIG = {
        'STARTING_WEALTH': 25000,
        'HAPPINESS_START': 100,
        'CREDIT_SCORE_START': 700,
        'START_MONTH': 1,
        'CARDS_PER_MONTH': 3,
        'GAME_DURATION_MONTHS': 60, # Extended for 5 years as per comments (was 12 in code)
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
                'categories': None # All
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
            # Month: {Details}
            6: {'name': 'Zomato', 'price_band': 76, 'listing_gain_prob': 0.7},
            12: {'name': 'LIC', 'price_band': 900, 'listing_gain_prob': 0.4},
            18: {'name': 'Paytm', 'price_band': 2150, 'listing_gain_prob': 0.1}, # The trap!
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

    # ================= SECURITY =================
    @staticmethod
    def validate_ownership(user, session):
        """
        SECURITY CRITICAL: Ensure the session belongs to the requesting user.
        Raises PermissionDenied if mismatch.
        """
        # Allow guest access if both are anonymous/guest, but strictly check authenticated users
        if session.user != user:
             # In a real app, we'd log this security event
             raise PermissionDenied("You do not own this game session.")

    # ================= SESSION MGMT =================
    @staticmethod
    def start_new_session(user):
        """Initialize a new game session with defaults."""
        session = GameSession.objects.create(
            user=user,
            wealth=GameEngine.CONFIG['STARTING_WEALTH'],
            happiness=GameEngine.CONFIG['HAPPINESS_START'],
            credit_score=GameEngine.CONFIG['CREDIT_SCORE_START'],
            current_month=GameEngine.CONFIG['START_MONTH']
        )
        session.current_level = GameEngine._calculate_level(session)
        # Init market trends
        session.market_trends = {s: 0 for s in GameEngine.CONFIG['STOCK_SECTORS']}
        session.save()

        # --- NEW: Generate Deterministic Market History ---
        # 1. Fetch Cold Start Data (Last 60 available days)
        # In a real game, you might randomize the "start date" to make games different
        # For now, let's take the most recent 60 days in DB
        ticker = 'RELIANCE.NS'
        seed_qs = MarketTickerData.objects.filter(ticker=ticker).order_by('-date')[:60]
        
        initial_prices = {}
        
        if seed_qs.count() < 60:
             # Handle error or fallback
             logger.warning("Insufficient seed data for AI. Using fallback simulation.")
             # Fallback: Use manual simple generation or error out
             # Just set defaults
             initial_prices = {"gold": 1800, "tech": 500, "real_estate": 300}
             
             # Fallback generation
             for sector in GameEngine.CONFIG['STOCK_SECTORS']:
                 prices = [initial_prices.get(sector, 100) for _ in range(12)] # Flat/Simple
                 history_objs = [
                    StockHistory(session=session, sector=sector, month=i+1, price=p)
                    for i, p in enumerate(prices)
                ]
                 StockHistory.objects.bulk_create(history_objs)

        else:
            # Prepare DataFrame (manual construction to avoid pandas dependency in main loop if possible, but here we need it)
            import pandas as pd
            seed_data = pd.DataFrame(list(seed_qs.values(
                'close', 'rsi', 'macd', 'signal', 'daily_return'
            )))
            # The query ordered by -date (desc), so we need to reverse to ascending for LSTM
            seed_data = seed_data.iloc[::-1]
            
            # 2. Generate Trajectory
            predictor = AIStockPredictor(ticker='RELIANCE')
            # Map 'RELIANCE' (game sector 'tech') to the model
            tech_prices = predictor.generate_forecast(seed_data, months=12) # Generate 12 months
            
            # Simple scaling/logic for other sectors (since we only have 1 model)
            # Gold: Stable, less volatile. Use Tech pattern but dampened? 
            # Or just use Random Walk for others for now until we have models.
            # Let's use Random Walk for Gold and Real Estate for MVP, and AI for Tech.
            
            # Tech
            history_objs = [
                StockHistory(session=session, sector='tech', month=i+1, price=p)
                for i, p in enumerate(tech_prices)
            ]
            
            # Gold (Legacy GBM)
            # AIStockPredictor has _fallback_generator.
            gold_prices = predictor._fallback_generator(1800, 12)
            history_objs += [
                StockHistory(session=session, sector='gold', month=i+1, price=p)
                for i, p in enumerate(gold_prices)
            ]
            
            # Real Estate
            re_prices = predictor._fallback_generator(300, 12)
            history_objs += [
                StockHistory(session=session, sector='real_estate', month=i+1, price=p)
                for i, p in enumerate(re_prices)
            ]

            StockHistory.objects.bulk_create(history_objs)
            
            # Set Month 1 Price
            initial_prices['tech'] = tech_prices[0]
            initial_prices['gold'] = gold_prices[0]
            initial_prices['real_estate'] = re_prices[0]
            
        # Initialize Mutual Fund NAVs (Start at 100)
        for mf_key in GameEngine.CONFIG['MUTUAL_FUNDS']:
            initial_prices[f"MF_{mf_key}"] = 100
            
        session.market_prices = initial_prices
        session.portfolio = {s: 0 for s in GameEngine.CONFIG['STOCK_SECTORS']}
        session.save()

        # --- NEW: Initialize Monthly Bills (Budget) ---
        # Base Expenses (Total ~14.5k)
        default_expenses = [
            {'name': 'Rent (2BHK)', 'amount': 10000, 'category': 'HOUSING', 'is_essential': True, 'inflation': 0.05},
            {'name': 'Groceries', 'amount': 2500, 'category': 'FOOD', 'is_essential': True, 'inflation': 0.07},
            {'name': 'Utilities (Electricity/Water)', 'amount': 1000, 'category': 'UTILITIES', 'is_essential': True, 'inflation': 0.03},
            {'name': 'Transport (Metro/Bus)', 'amount': 1000, 'category': 'TRANSPORT', 'is_essential': True, 'inflation': 0.05}
        ]
        
        for exp in default_expenses:
            RecurringExpense.objects.create(
                session=session,
                name=exp['name'],
                amount=exp['amount'],
                category=exp['category'],
                is_essential=exp['is_essential'],
                inflation_rate=exp['inflation'],
                started_month=session.current_month
            )
            
        return session

    # ================= CORE GAMEPLAY =================
    @staticmethod
    def get_next_card(session):
        """
        Smart Scenario Selection with AI Integration.
        - 30% chance to generate a fresh AI scenario tailored to the user.
        - Fallback to DB deck if AI fails or skipped.
        - Avoids repeats.
        """
        GameEngine._refresh_level(session)
        
        # --- AI GENERATION ATTEMPT ---
        # Try AI 30% of the time, or if we are running low on cards?
        # Let's try 30% for now to mix handling latency.
        if random.random() < 0.3:
            try:
                profile = session.persona_profile
                if profile:
                    ai_master = get_ai_master()
                    # Pick a random category suitable for the level
                    level_categories = GameEngine.CONFIG['LEVEL_CARD_FILTERS'].get(
                        session.current_level, 
                        GameEngine.CONFIG['LEVEL_CARD_FILTERS'][1]
                    )['categories']
                    
                    category = random.choice(level_categories) if level_categories else "WANTS"
                    
                    # Generate
                    ai_card = ai_master.generate_scenario(
                        profile=profile,
                        wealth=session.wealth,
                        month=session.current_month,
                        category=category
                    )
                    
                    if ai_card:
                        return ai_card
            except Exception as e:
                # Log and fall back
                logger.warning("AI Generation failed: %s", e)
                pass

        # --- STANDARD DECK FALLBACK ---
        level_filters = GameEngine.CONFIG['LEVEL_CARD_FILTERS'].get(
            session.current_level,
            GameEngine.CONFIG['LEVEL_CARD_FILTERS'][1]
        )
        # 1. Filter valid cards
        shown_ids = PlayerChoice.objects.filter(session=session).values_list('card_id', flat=True)
        
        available = ScenarioCard.objects.filter(
             is_active=True,
             is_generated=False, # Prefer handcrafted cards for the base deck
             min_month__lte=session.current_month,
             difficulty__lte=level_filters['max_difficulty']
        ).exclude(id__in=shown_ids)

        if level_filters['categories']:
            available = available.filter(category__in=level_filters['categories'])

        if not available.exists():
            available = ScenarioCard.objects.filter(
                is_active=True,
                is_generated=False,
                min_month__lte=session.current_month
            ).exclude(id__in=shown_ids)
        
        if not available.exists():
            # Fallback: Allow repeats if deck exhausted
            available = ScenarioCard.objects.filter(
                is_active=True,
                is_generated=False,
                min_month__lte=session.current_month
            )
             
        if not available.exists():
            return None # Should handle "End Game" or "No Cards" upstream
            
        # 2. Adaptive Difficulty
        # If Literacy is low (<30), prefer simpler cards (Difficulty 1-2)
        # If Literacy is high (>70), allow harder cards (Difficulty 4-5)
        
        # Simple weighted random choice from available
        return random.choice(list(available))

    @staticmethod
    def use_lifeline(session, card):
        """
        Reveal recommended choice.
        """
        if session.lifelines <= 0:
            return {'error': "No lifelines remaining."}
            
        session.lifelines -= 1
        session.save()
        
        # Find best choice
        # If multiple recommended, pick first. If none, pick highest wealth impact?
        # Assuming is_recommended is set on at least one.
        rec_choice = card.choices.filter(is_recommended=True).first()
        
        if not rec_choice:
            # Fallback: Pick choice with highest happiness impact
            rec_choice = card.choices.order_by('-happiness_impact').first()
            
        return {
            'success': True,
            'lifelines_remaining': session.lifelines,
            'hint': f"Advisor Suggests: {rec_choice.text}",
            'choice_id': rec_choice.id if rec_choice else None
        }

    @staticmethod
    def process_choice(session, card, choice):
        """Main game loop step."""
        GameEngine._append_gameplay_log(
            session,
            (
                f"Month {session.current_month}: {card.title} — {choice.text}. "
                f"Impact: wealth {choice.wealth_impact:+}, happiness {choice.happiness_impact:+}, "
                f"credit {choice.credit_impact:+}, literacy {choice.literacy_impact:+}."
            ),
        )
        
        # 1. Apply Direct Impacts
        session.wealth += choice.wealth_impact
        session.happiness += choice.happiness_impact
        session.credit_score += choice.credit_impact
        session.financial_literacy += choice.literacy_impact

        session.happiness = GameEngine._clamp(session.happiness, 0, 100)
        session.credit_score = GameEngine._clamp(session.credit_score, 300, 900)

        feedback_parts = []
        if choice.feedback:
            feedback_parts.append(choice.feedback)

        # 2. Handle Recurring Expenses (Add/Remove)
        if choice.adds_recurring_expense > 0:
            RecurringExpense.objects.create(
                session=session,
                name=choice.expense_name or f"Expense from '{card.title}'",
                amount=choice.adds_recurring_expense,
                category='LIFESTYLE', # Default items from cards to Lifestyle usually
                is_essential=False,
                inflation_rate=0.04,
                started_month=session.current_month
            )
        
        if choice.cancels_expense_name:
            expenses = session.expenses.filter(
                name=choice.cancels_expense_name, 
                is_cancelled=False
            )
            count = expenses.update(
                is_cancelled=True, 
                cancelled_month=session.current_month
            )
            if count > 0:
                feedback_parts.append(f" (Cancelled {count} subscription(s)!)")

        # 3. Handle Market Events
        if card.market_event and card.market_event.is_active:
            event = card.market_event
            impacts = event.sector_impacts
            
            market_changes = []
            if session.market_prices:
                for sector, multiplier in impacts.items():
                    if sector in session.market_prices:
                        # Apply immediate shock
                        old_price = session.market_prices[sector]
                        new_price = int(old_price * multiplier)
                        session.market_prices[sector] = new_price
                        
                        # Update TREND (Momentum)
                        # If multiplier > 1, trend becomes positive (+3). If < 1, negative (-3).
                        trend_impact = 3 if multiplier > 1 else -3
                        session.market_trends[sector] = trend_impact
                        
                        pct = int((multiplier - 1) * 100)
                        direction = "surged" if pct > 0 else "crashed"
                        market_changes.append(f"{sector.title()} {direction} {abs(pct)}%")
            
            if market_changes:
                feedback_parts.append(f" 📉 MARKET NEWS: {', '.join(market_changes)}!")

        # 4. Log Choice
        PlayerChoice.objects.create(session=session, card=card, choice=choice)

        # 5. Advance Month Check
        choices_count = PlayerChoice.objects.filter(session=session).count()
        new_month = (choices_count // GameEngine.CONFIG['CARDS_PER_MONTH']) + 1
        
        if new_month > session.current_month:
            # New Logic: Call advance_month
            result = GameEngine.advance_month(session)
            
            feedback_parts.append(result['report'])
            
            if result['game_over']:
                GameEngine._finalize_game(session, result['game_over_reason'])
                return {
                    'session': session,
                    'feedback': " ".join(feedback_parts),
                    'game_over': True,
                    'game_over_reason': result['game_over_reason'],
                    'final_persona': GameEngine.generate_persona(session),
                    'chatbot': result.get('chatbot'),
                }

        # 6. Check Game Over (Immediate, e.g. from choice impact)
        game_over, reason = GameEngine._check_game_over(session)
        if game_over:
            GameEngine._finalize_game(session, reason)

        return {
            'session': session,
            'feedback': " ".join(feedback_parts),
            'game_over': game_over,
            'game_over_reason': reason,
            'final_persona': GameEngine.generate_persona(session) if game_over else None,
            'chatbot': result.get('chatbot') if 'result' in locals() else None,
        }

    @staticmethod
    def process_skip(session, card):
        """
        Handle skipping a card. 
        IMPROVEMENT: Variable penalties based on importance.
        """
        # Base penalty
        happiness_loss = 5
        credit_loss = 5

        # Heavy penalty for critical categories
        if card.category in ['EMERGENCY', 'NEEDS']:
            happiness_loss = 15
            credit_loss = 20
        elif card.category == 'INVESTMENT':
            credit_loss = 10  # Missed opportunity

        GameEngine._append_gameplay_log(
            session,
            (
                f"Month {session.current_month}: Skipped {card.title}. "
                f"Penalty: happiness -{happiness_loss}, credit -{credit_loss}."
            ),
        )

        session.happiness = max(0, session.happiness - happiness_loss)
        session.credit_score = max(300, session.credit_score - credit_loss)
        
        # Log as skipped (choice=None)
        PlayerChoice.objects.create(session=session, card=card, choice=None)

        game_over, reason = GameEngine._check_game_over(session)
        if game_over:
            GameEngine._finalize_game(session, reason)
        else:
            session.save()
        
        return {
            'message': f"Skipped! Penalty: -{happiness_loss} Happiness, -{credit_loss} Credit Score.",
            'session': session,
            'game_over': game_over,
            'game_over_reason': reason
        }

    # ================= ECONOMICS & MARKET =================
    @staticmethod
    def advance_month(session):
        """
        The Master Time Step Function.
        - Updates time
        - Applies expenses
        - Updates market
        - Checks game over
        """
        # 1. Advance Time
        session.current_month += 1
        months_passed = 1 # Simple 1 month step
        
        report_lines = [f"📅 Month {session.current_month} Started!"]
        GameEngine._refresh_level(session)

        # 2. Income Processing
        # Calculate Total Income from all sources
        total_income = 0
        income_report_lines = []
        
        income_sources = IncomeSource.objects.filter(session=session)
        # Note: In a real scenario we'd check Frequency (Monthly/Quarterly). Assuming Monthly for MVP or checks.
        
        for source in income_sources:
            amount = source.amount_base
            
            # Variability Logic
            if source.source_type == IncomeSource.SourceType.FREELANCE:
                chance = random.random()
                if chance < 0.3: # 30% chance of no gig
                    amount = 0
                    income_report_lines.append(f"⚠️ No Freelance gig this month.")
                else:
                    # Fluctuate between 80% and 120%
                    amount = int(source.amount_base * random.uniform(0.8, 1.2))
                    
            if amount > 0:
                total_income += amount
                income_report_lines.append(f"+₹{amount} from {source.get_source_type_display()}")

        # Fallback if no sources defined (Legacy support)
        if not income_sources.exists():
            total_income = GameEngine.CONFIG['MONTHLY_SALARY']
            income_report_lines.append(f"+₹{total_income} Salary credited.")

        session.wealth += total_income
        report_lines.extend(income_report_lines)

        # 3. Recurring Expenses & Inflation
        # The "Real" Source of Truth is now the RecurringExpense table
        active_expenses = session.expenses.filter(is_cancelled=False)
        total_monthly_drain = 0
        bill_report_lines = []
        
        # Check for Annual Inflation (Every 12 months, starting month 13)
        apply_inflation = (session.current_month > 1) and (session.current_month % 12 == 1)
        
        for expense in active_expenses:
            # Apply Inflation if needed
            if apply_inflation and expense.inflation_rate > 0:
                old_amount = expense.amount
                # Inflation formula: New = Old * (1 + Rate)
                new_amount = int(old_amount * (1 + expense.inflation_rate))
                expense.amount = new_amount
                expense.save()
                bill_report_lines.append(f"📈 {expense.name} rose to ₹{new_amount} (+{(expense.inflation_rate*100):.0f}%)")

            total_monthly_drain += expense.amount
        
        session.wealth -= total_monthly_drain
        
        # Update cache for UI
        session.recurring_expenses = total_monthly_drain
        
        report_lines.append(f"-₹{total_monthly_drain} Total Bills Paid.")
        if bill_report_lines:
             report_lines.append(" ".join(bill_report_lines))

        # 4. Market Update
        market_changes = GameEngine.update_market_prices(session)
        if market_changes:
            report_lines.append(f"Market Update: {', '.join(market_changes)}")



        # 4.5. IPO Listings (Check if any active IPO lists today)
        # Assuming listing happens the month AFTER application
        # Actually, let's check config. If current_month == listing_month (implied from schedule?)
        # Let's say IPO is open in Month X, lists in Month X+1.
        # Check active_ipos for any that are due.
        
        # Filter active IPOs
        # active_ipos structure: [{"name": "Zomato", "amount": 15000, "status": "APPLIED", "month": 5}]
        updated_ipos = []
        for ipo in session.active_ipos:
            # If applied month < current month -> LIST IT!
            if ipo['status'] == 'APPLIED' and ipo['month'] < session.current_month:
                # Find IPO details (reverse lookup or just store in ipo object? Store in object for safety)
                # But we defined schedule in CONFIG. Let's look up by name.
                ipo_details = next((v for k,v in GameEngine.CONFIG['IPO_SCHEDULE'].items() if v['name'] == ipo['name']), None)
                
                listing_gain_pct = 0
                if ipo_details:
                    # Determine Listing Gain
                    # Probabilistic
                    if random.random() < ipo_details['listing_gain_prob']:
                        # Gain: +10% to +80%
                        listing_gain_pct = random.uniform(0.1, 0.8)
                    else:
                        # Loss: -5% to -30%
                        listing_gain_pct = random.uniform(-0.3, -0.05)
                else:
                    # Fallback
                    listing_gain_pct = 0.1
                
                # Allotment Logic (Random 0 to 100%)
                # High demand IPOs might give 0 allotment.
                allotment_ratio = random.choice([0.0, 0.5, 1.0]) # Simplified
                
                invested = ipo['amount']
                allotted_value = invested * allotment_ratio
                refund = invested - allotted_value
                
                # Listing Value
                final_value = allotted_value * (1 + listing_gain_pct)
                
                total_credit = refund + final_value
                profit = total_credit - invested
                
                session.wealth += int(total_credit)
                
                # Log it
                status_msg = ""
                if allotment_ratio == 0:
                     status_msg = "No allotment (Refunded)."
                elif profit > 0:
                     status_msg = f"LISTED WITH GAINS! Profit: ₹{int(profit)}"
                else:
                     status_msg = f"DISCOUNT LISTING. Loss: ₹{int(abs(profit))}"
                     
                report_lines.append(f"🔔 IPO {ipo['name']}: {status_msg}")
                
                # Mark as processed
                ipo['status'] = 'PROCESSED'
                # Don't keep processed IPOs in active list? Keeping them for history might be good.
                # But active_ipos implies active. Let's move to a history log or just remove.
                # Let's remove for now to keep JSON clean, or mark PROCESSED.
                # GameSessionSerializer expects list.
            else:
                updated_ipos.append(ipo)
                
        session.active_ipos = updated_ipos

        # 5. Natural Stat Decay & Soft Failures
        # Stress from low wealth
        if session.wealth < 10000:
            session.happiness -= 2
            report_lines.append("📉 Financial stress is affecting your happiness (-2).")
            
        # Isolation (optional simple check: if happiness is high, slight decay to force fun choices)
        # If happiness > 90, decay -1 (Hedonic Adaptation)
        if session.happiness > 90:
             session.happiness -= 1

        # 6. Check Game Over
        game_over, reason = GameEngine._check_game_over(session)
        
        session.save()

        if game_over:
            report_lines.append(f"GAME OVER: {reason}")
            
        # 7. Chatbot Trigger (Contextual Characters)
        chatbot_data = None
        if not game_over:
            chatbot_data = GameEngine._check_chatbot_triggers(session)
            if chatbot_data:
                report_lines.append(f"💬 {chatbot_data['character'].upper()}: {chatbot_data['message']}")
            elif GENAI_AVAILABLE:
                advisor_msg = GameEngine._check_advisor_triggers(session)
                if advisor_msg:
                    report_lines.append(f"💬 Advisor: {advisor_msg}")

        return {
            'report': " ".join(report_lines),
            'game_over': game_over,
            'game_over_reason': reason,
            'chatbot': chatbot_data,
        }

    @staticmethod
    def _check_advisor_triggers(session):
        """Check for events that warrant proactive advice (legacy fallback)."""
        advisor = get_advisor()
        msg = None
        
        if session.wealth < 5000:
            msg = advisor.get_proactive_message("CRISIS", "Wealth dropped below 5k", session.wealth, session.happiness, AdvisorPersona.STRICT)
        elif session.wealth > 100000 and session.current_month % 6 == 0:
            msg = advisor.get_proactive_message("MILESTONE", "Wealth over 100k", session.wealth, session.happiness, AdvisorPersona.SASSY)
        elif session.happiness < 30:
            msg = advisor.get_proactive_message("WARNING", "Happiness dangerously low", session.wealth, session.happiness, AdvisorPersona.FRIENDLY)
        elif session.recurring_expenses > (25000 * 0.6):
            msg = advisor.get_proactive_message("DANGER", "Expenses > 60% of income", session.wealth, session.happiness, AdvisorPersona.STRICT)
              
        return msg

    @staticmethod
    def _check_chatbot_triggers(session):
        """
        Check game state and trigger the appropriate contextual chatbot character.
        Returns a dict suitable for frontend ChatOverlay, or None.

        Trigger Priority:
        1. Vasooli Bhai: Debt crisis (EMI missed / Debt > 50% net worth)
        2. Sundar (Scamster): Random trigger (~10% chance per month)
        3. Harshad (Risk Taker): Cash > 50k and Portfolio empty
        4. Jetta Bhai (Business): Profile == Business OR sustained losses
        """
        advisor = get_advisor()

        # --- Calculate Net Worth ---
        portfolio_value = 0
        portfolio_empty = True
        if session.portfolio and session.market_prices:
            for sector, units in session.portfolio.items():
                if units > 0:
                    portfolio_empty = False
                price = session.market_prices.get(sector, 0)
                portfolio_value += int(units * price)
        net_worth = session.wealth + portfolio_value

        # --- Calculate Debt Ratio ---
        debt_expenses = RecurringExpense.objects.filter(
            session=session, category='DEBT', is_cancelled=False
        )
        total_debt_emi = sum(e.amount for e in debt_expenses)
        debt_ratio = total_debt_emi / max(net_worth, 1) if net_worth > 0 else 1.0

        # --- 1. VASOOLI BHAI: Debt Crisis ---
        if debt_ratio > 0.5 or total_debt_emi > (session.wealth * 0.4):
            msg = advisor.get_character_message(
                character='vasooli',
                trigger_reason=f"Debt EMI is ₹{total_debt_emi}/mo, which is {debt_ratio*100:.0f}% of net worth",
                current_wealth=session.wealth,
                current_happiness=session.happiness,
            )
            return {
                'character': msg.character,
                'message': msg.message,
                'choices': msg.choices,
                'is_scam': msg.is_scam,
                'scam_loss_amount': msg.scam_loss_amount,
            }

        # --- 2. SUNDAR: Random Scam (10% chance, only if wealth > 10k) ---
        if session.wealth > 10000 and random.random() < 0.10:
            msg = advisor.get_character_message(
                character='sundar',
                trigger_reason=f"Player has ₹{session.wealth:,} cash — ripe for a scam",
                current_wealth=session.wealth,
                current_happiness=session.happiness,
            )
            return {
                'character': msg.character,
                'message': msg.message,
                'choices': msg.choices,
                'is_scam': msg.is_scam,
                'scam_loss_amount': msg.scam_loss_amount,
            }

        # --- 3. HARSHAD: Cash hoarding + no portfolio ---
        if session.wealth > 50000 and portfolio_empty:
            msg = advisor.get_character_message(
                character='harshad',
                trigger_reason=f"Cash ₹{session.wealth:,} sitting idle with zero portfolio",
                current_wealth=session.wealth,
                current_happiness=session.happiness,
            )
            return {
                'character': msg.character,
                'message': msg.message,
                'choices': msg.choices,
                'is_scam': msg.is_scam,
                'scam_loss_amount': msg.scam_loss_amount,
            }

        # --- 4. JETTA: Business profile or sustained losses ---
        is_business = False
        try:
            persona = session.persona_profile
            if persona and persona.career_stage == 'BUSINESS_OWNER':
                is_business = True
        except Exception:
            pass

        # Check for sustained losses: wealth dropped > 10% from starting or below recurring expenses
        initial_wealth = GameEngine.CONFIG['STARTING_WEALTH']
        wealth_drop_pct = (initial_wealth - session.wealth) / max(initial_wealth, 1)

        if is_business or wealth_drop_pct > 0.10:
            msg = advisor.get_character_message(
                character='jetta',
                trigger_reason=(
                    f"Business profile or wealth dropped {wealth_drop_pct*100:.0f}% from start"
                    if not is_business
                    else "Business Owner profile — Jetta Bhai monitors your margins"
                ),
                current_wealth=session.wealth,
                current_happiness=session.happiness,
            )
            return {
                'character': msg.character,
                'message': msg.message,
                'choices': msg.choices,
                'is_scam': msg.is_scam,
                'scam_loss_amount': msg.scam_loss_amount,
            }

        return None

    @staticmethod
    def process_scam_choice(session, accepted: bool, scam_loss_amount: int):
        """
        Handle the player's response to Sundar's scam offer.

        Args:
            session: Active GameSession.
            accepted: True if user clicked 'Invest', False if 'Ignore'.
            scam_loss_amount: The amount Sundar demanded.

        Returns:
            dict with result message and updated session.
        """
        if accepted:
            # Money deleted — the scam trap!
            session.wealth -= scam_loss_amount
            session.happiness -= 15  # Regret + embarrassment
            session.financial_literacy -= 5
            session.happiness = GameEngine._clamp(session.happiness, 0, 100)
            session.financial_literacy = max(0, session.financial_literacy)

            GameEngine._append_gameplay_log(
                session,
                f"Month {session.current_month}: FELL FOR SCAM! Lost ₹{scam_loss_amount} to Sundar's scheme.",
            )
            session.save()

            # Check game over (could go bankrupt)
            game_over, reason = GameEngine._check_game_over(session)
            if game_over:
                GameEngine._finalize_game(session, reason)

            return {
                'message': (
                    f"💀 SCAM ALERT! Sundar vanished with your ₹{scam_loss_amount:,}! "
                    f"This is how Ponzi schemes work — if it's too good to be true, it is!"
                ),
                'session': session,
                'game_over': game_over,
                'game_over_reason': reason,
            }
        else:
            # Smart choice
            session.financial_literacy += 5
            GameEngine._append_gameplay_log(
                session,
                f"Month {session.current_month}: Ignored Sundar's scam. Smart move!",
            )
            session.save()

            return {
                'message': (
                    '✅ Smart move! You avoided a scam. '
                    'Remember: guaranteed high returns = guaranteed fraud!'
                ),
                'session': session,
                'game_over': False,
                'game_over_reason': None,
            }

    @staticmethod
    def update_market_prices(session):
        """
        Apply momentum/trends to prices each month.
        Returns list of significant changes for the news feed.
        """
        if not session.market_prices:
            return []

        changes = []
        new_month = session.current_month
        
        # Fetch prices from History table
        histories = StockHistory.objects.filter(session=session, month=new_month)
        
        for record in histories:
            old_price = session.market_prices.get(record.sector, 0)
            new_price = record.price
            
            session.market_prices[record.sector] = new_price
            
            # Calculate Change % for News Feed
            if old_price > 0:
                pct_change = ((new_price - old_price) / old_price) * 100
                if abs(pct_change) > 5:
                    direction = "surged" if pct_change > 0 else "tanked"
                    changes.append(f"{record.sector.title()} {direction} {abs(pct_change):.1f}%")
        
        # Update Mutual Fund NAVs
        # Method: Small random walk + bias based on volatility
        for mf_key, mf_data in GameEngine.CONFIG['MUTUAL_FUNDS'].items():
            key = f"MF_{mf_key}"
            old_nav = session.market_prices.get(key, 100)
            
            # Volatility
            vol = mf_data['volatility']
            # Random move: Normal distribution mean 0.5% growth (0.005), std dev = vol
            # We want them to generally go up over 5 years.
            change_pct = random.gauss(0.008, vol) # Mean 0.8% monthly growth (~10% annual)
            
            new_nav = old_nav * (1 + change_pct)
            session.market_prices[key] = max(10, new_nav) # Floor at 10
            
            # MFs usually don't make news headlines unless big crash
            if change_pct < -0.05:
                 changes.append(f"{mf_data['name']} dropped {abs(change_pct*100):.1f}%")

        return changes

    # ================= LOAN LOGIC =================
    @staticmethod
    def process_loan(session, loan_type):
        """
        Smart Loan System.
        Limit based on credit score.
        """
        GameEngine._refresh_level(session)
        if session.current_level < GameEngine.CONFIG['LEVEL_UNLOCKS']['loans']:
            return {'error': "Loans unlock at Level 2."}
        # Calculate Credit Limit
        # Score 700 -> ₹14,000 limit
        credit_limit = session.credit_score * 30
        
        current_loans = 0 # In a real DB we'd sum active loans. Simplified here.
        
        if loan_type == 'FAMILY':
            amount = 5000
            if session.wealth + amount > 50000: # Anti-exploit
                 return {'error': "You don't need a loan right now."}
            
            session.wealth += amount
            session.happiness -= 5 # Pride hurt
            msg = "Family helped with ₹5,000. Pay them back later!"
            
        elif loan_type == 'INSTANT_APP':
            amount = 10000
            if amount > credit_limit:
                 return {'error': f"Loan rejected. Your credit limit is ₹{credit_limit}."}
            
            session.wealth += amount
            session.credit_score -= 50 # Hard check
            session.happiness += 5 # Relief
            
            # Add recurring interest payment!
            Heading = "High Interest Loan"
            RecurringExpense.objects.create(
                session=session,
                name=Heading,
                amount=500, # 5% monthly interest
                category='DEBT',
                is_essential=True, # Debt is essential!
                inflation_rate=0.0, # Fixed interest usually
                started_month=session.current_month
            )
            msg = f"Loan approved: ₹{amount}. Credit score dropped. Monthly interest added."
            
        else:
            return {'error': "Invalid loan type"}
            
        session.save()
        return {'session': session, 'message': msg}

    # ================= UTILS =================
    @staticmethod
    def _clamp(val, min_val, max_val):
        return max(min_val, min(max_val, val))

    @staticmethod
    def _check_game_over(session):
        if session.wealth <= 0:
            return True, 'BANKRUPTCY'
        if session.happiness <= GameEngine.CONFIG['MIN_HAPPINESS']:
            return True, 'BURNOUT'
        if session.current_month > GameEngine.CONFIG['GAME_DURATION_MONTHS']:
            return True, 'COMPLETED'
        return False, None

    @staticmethod
    def _finalize_game(session, reason):
        session.is_active = False
        if not session.final_report:
            session.final_report = GameEngine._generate_final_report(session, reason)
        session.save()
        GameEngine._save_history(session, reason)

    @staticmethod
    def _append_gameplay_log(session, entry):
        entry = entry.strip()
        if not entry:
            return
        if session.gameplay_log:
            session.gameplay_log = f"{session.gameplay_log}\n{entry}"
        else:
            session.gameplay_log = entry

    @staticmethod
    def _generate_final_report(session, reason):
        portfolio_value = 0
        portfolio_lines = []
        if session.portfolio and session.market_prices:
            for sector, units in session.portfolio.items():
                price = session.market_prices.get(sector, 100)
                value = int(units * price)
                portfolio_value += value
                if units:
                    portfolio_lines.append(f"{sector.title()}: {units:.2f} units @ ₹{price} (₹{value})")
        portfolio_breakdown = "; ".join(portfolio_lines) if portfolio_lines else "No active holdings."
        gameplay_log = session.gameplay_log or "No gameplay log recorded."

        prompt = GameEngine.REPORT_PROMPT_TEMPLATE.format(
            reason=reason,
            current_month=session.current_month,
            wealth=session.wealth,
            happiness=session.happiness,
            credit_score=session.credit_score,
            financial_literacy=session.financial_literacy,
            recurring_expenses=session.recurring_expenses,
            portfolio_value=portfolio_value,
            portfolio_breakdown=portfolio_breakdown,
            gameplay_log=gameplay_log,
        )

        if GENAI_AVAILABLE and genai and os.environ.get('GEMINI_API_KEY'):
            try:
                genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                if response and getattr(response, 'text', None):
                    return response.text.strip()
            except Exception:
                pass

        return (
            "## Summary\n"
            f"- Outcome: **{reason}** after month **{session.current_month}**.\n"
            f"- Final cash: **₹{session.wealth}**. Portfolio value: **₹{portfolio_value}**.\n"
            f"- Happiness: **{session.happiness}**. Credit score: **{session.credit_score}**.\n\n"
            "## Highlights\n"
            f"- Portfolio: {portfolio_breakdown}\n"
            f"- Recurring expenses: ₹{session.recurring_expenses}\n\n"
            "## Risks\n"
            "- Watch cash flow relative to recurring bills.\n"
            "- Keep credit score healthy by avoiding high-interest debt.\n\n"
            "## Recommendations\n"
            "- Build a 3–6 month emergency fund.\n"
            "- Automate savings with a monthly SIP.\n"
            "- Review recurring expenses and cancel low-value subscriptions.\n"
        )
    @staticmethod
    def _save_history(session, reason):
        persona_data = GameEngine.generate_persona(session)
        if session.user:
            # Calculate stock profit (portfolio value - initial investment)
            portfolio_value = 0
            if session.portfolio and session.market_prices:
                for sector, units in session.portfolio.items():
                    price = session.market_prices.get(sector, 100)
                    portfolio_value += int(units * price)
            
            GameHistory.objects.create(
                user=session.user,
                final_wealth=session.wealth,
                final_happiness=session.happiness,
                final_credit_score=session.credit_score,
                financial_literacy_score=session.financial_literacy,
                persona=persona_data['persona'],
                end_reason=reason,
                months_played=session.current_month
            )
            profile, _ = PlayerProfile.objects.get_or_create(user=session.user)
            profile.total_games += 1
            profile.highest_wealth = max(profile.highest_wealth, session.wealth + portfolio_value)
            profile.highest_score = max(profile.highest_score, session.financial_literacy)
            profile.highest_credit_score = max(profile.highest_credit_score, session.credit_score)
            profile.highest_happiness = max(profile.highest_happiness, session.happiness)
            profile.highest_stock_profit = max(profile.highest_stock_profit, portfolio_value)
            profile.save()

    # ================= STOCK MARKET TRADING =================
    @staticmethod
    def buy_stock(session, sector, amount):
        """
        Buy stocks in a specific sector.
        """
        GameEngine._refresh_level(session)
        if session.current_level < GameEngine.CONFIG['LEVEL_UNLOCKS']['investing']:
            return {'error': "Investing unlocks at Level 2."}
        if (
            session.current_level < GameEngine.CONFIG['LEVEL_UNLOCKS']['diversification']
            and session.portfolio
            and any(units > 0 for s, units in session.portfolio.items() if s != sector)
        ):
            return {'error': "Diversification unlocks at Level 3. Stick to one sector for now."}
        if sector not in GameEngine.CONFIG['STOCK_SECTORS']:
            return {'error': "Invalid sector."}
            
        if amount <= 0:
            return {'error': "Amount must be positive."}
            
        if session.wealth < amount:
            return {'error': "Insufficient funds."}
            
        # Get current price
        current_price = session.market_prices.get(sector, 100)
        
        # Calculate units (allow fractional? No, let's stick to units for simplicity or just value tracking)
        # Re-reading models: portfolio is {"gold": 0, "tech": 0} -> imply units.
        # But previous logic in views.py (invest_in_stocks) just tracked raw value in 'stock_investment'.
        # The new front-end expects units. 
        
        # Let's simple: Units = Amount / Price
        units = amount / current_price
        
        # Update State
        session.wealth -= amount
        session.portfolio[sector] = session.portfolio.get(sector, 0) + units
        
        # Log purchase history for profit calculation
        session.purchase_history.append({
            "sector": sector,
            "units": units,
            "price": current_price,
            "month": session.current_month
        })
        
        session.save()
        
        return {
            'session': session,
            'message': f"Bought {units:.2f} units of {sector.title()} at ₹{current_price}."
        }

    @staticmethod
    def sell_stock(session, sector, amount):
        """
        Sell stocks. `amount` here refers to UNITS to sell, not cash value.
        Wait, frontend input says "Units to Sell" if action is Sell.
        """
        if sector not in GameEngine.CONFIG['STOCK_SECTORS']:
            return {'error': "Invalid sector."}
            
        units_to_sell = float(amount) # Front end sends number
        
        if units_to_sell <= 0:
            return {'error': "Invalid units."}
            
        current_owned = session.portfolio.get(sector, 0)
        if current_owned < units_to_sell:
             return {'error': f"You only have {current_owned:.2f} units."}
             
        # Calculate Value
        current_price = session.market_prices.get(sector, 100)
        cash_value = units_to_sell * current_price
        
        # Update State
        session.wealth += int(cash_value) # Round to nearest rupee
        session.portfolio[sector] = current_owned - units_to_sell
        session.save()
        
        return {
            'session': session,
            'message': f"Sold {units_to_sell:.2f} units for ₹{int(cash_value)}."
        }

    @staticmethod
    def sell_futures(session, sector, units, duration):
        """
        Executes a Futures Contract sale.
        """
        GameEngine._refresh_level(session)
        if session.current_level < GameEngine.CONFIG['LEVEL_UNLOCKS']['mastery']:
            return {'error': "Mastery futures unlock at Level 4."}
        if sector not in session.market_prices:
            return {'error': "Invalid sector"}
            
        current_price = session.market_prices[sector]
        current_owned = session.portfolio.get(sector, 0)
        
        if current_owned < units:
            return {'error': f"Insufficient units. You have {current_owned}."}
            
        # 1. Get Quote
        contract_price = MarketPredictor.get_futures_quote(current_price, sector, duration)
        total_payout = contract_price * units
        
        # 2. Execute Trade (Immediate Cash, Remove Stock)
        session.wealth += int(total_payout)
        session.portfolio[sector] = current_owned - units
        
        # 3. Record Contract
        FuturesContract.objects.create(
            session=session,
            sector=sector,
            units=units,
            strike_price=contract_price,
            spot_price_at_sale=current_price,
            duration_months=duration,
            created_month=session.current_month
        )
        
        session.save()
        
        return {
            'message': f"Contract Sold! {units} {sector} units @ ₹{contract_price}/unit. +₹{int(total_payout)}",
            'session': session
        }

    # ================= MUTUAL FUNDS & IPOs =================
    @staticmethod
    def buy_mutual_fund(session, fund_type, amount):
        """Invest in a Mutual Fund."""
        GameEngine._refresh_level(session)
        if session.current_level < GameEngine.CONFIG['LEVEL_UNLOCKS']['investing']:
            return {'error': "Investing unlocks at Level 3. (Mutual Funds)"}
        
        if fund_type not in GameEngine.CONFIG['MUTUAL_FUNDS']:
            return {'error': "Invalid Fund Type."}
            
        if amount < 500:
             return {'error': "Minimum investment is ₹500."}
             
        if session.wealth < amount:
             return {'error': "Insufficient funds."}
             
        # Execute
        key = f"MF_{fund_type}"
        nav = session.market_prices.get(key, 100)
        units = amount / nav
        
        # Update Session
        # session.mutual_funds structure: {"NIFTY50": {"units": 0, "invested": 0}}
        current_data = session.mutual_funds.get(fund_type, {'units': 0.0, 'invested': 0.0})
        
        current_data['units'] += units
        current_data['invested'] += amount
        
        session.mutual_funds[fund_type] = current_data
        session.wealth -= amount
        session.save()
        
        return {
            'session': session,
            'message': f"Invested ₹{amount} in {GameEngine.CONFIG['MUTUAL_FUNDS'][fund_type]['name']}."
        }
        
    @staticmethod
    def sell_mutual_fund(session, fund_type, units):
        """Redeem Mutual Fund units."""
        if fund_type not in session.mutual_funds:
             return {'error': "You don't own this fund."}
             
        current_data = session.mutual_funds[fund_type]
        if current_data['units'] < units:
             return {'error': "Insufficient units."}
             
        key = f"MF_{fund_type}"
        nav = session.market_prices.get(key, 100)
        
        redemption_value = units * nav
        
        # Update State
        session.wealth += int(redemption_value)
        current_data['units'] -= units
        # Invested amount reduction? Proportional.
        # If I sell 50% of units, I reduce invested by 50%? Yes, for simple CAGR calc.
        pct_sold = units / (current_data['units'] + units) # because we already subtracted
        # Wait, I subtracted units.
        # Original units = current_data['units'] + units
        original_units = current_data['units'] + units
        if original_units > 0:
            current_data['invested'] = current_data['invested'] * (current_data['units'] / original_units)
        
        if current_data['units'] < 0.01: # Cleanup dust
            del session.mutual_funds[fund_type]
        else:
            session.mutual_funds[fund_type] = current_data
            
        session.save()
        
        return {
            'session': session,
            'message': f"Redeemed {units:.2f} units for ₹{int(redemption_value)}."
        }

    @staticmethod
    def apply_for_ipo(session, ipo_name, amount):
        """Apply for an IPO."""
        GameEngine._refresh_level(session)
        # Check if IPO is valid and open?
        # For MVP, we pass name. Check if it exists in schedule for CURRENT month?
        # Actually logic is: ScenarioCard ("New IPO Open!") -> User clicks Choice -> API call.
        # But we also have a "Market" tab where they might see "Open IPOs".
        
        # Find IPO in schedule
        # Schedule Key is Month.
        # find ipo by name
        ipo_month = None
        ipo_details = None
        for m, details in GameEngine.CONFIG['IPO_SCHEDULE'].items():
            if details['name'] == ipo_name:
                ipo_month = m
                ipo_details = details
                break
        
        if not ipo_details:
             return {'error': "Invalid IPO."}
             
        # Check timeline
        if session.current_month > ipo_month:
             return {'error': "IPO Closed."}
        if session.current_month < ipo_month:
             return {'error': f"IPO opens in month {ipo_month}."}
             
        # Check bounds
        if amount < 10000 or amount > 200000: # Min 10k, Max 2L (retail limit)
             return {'error': "Investment must be between ₹10k and ₹2L."}
             
        if session.wealth < amount:
             return {'error': "Insufficient funds."}
             
        # Check if already applied
        for app in session.active_ipos:
            if app['name'] == ipo_name:
                 return {'error': "Already applied for this IPO."}
                 
        # Apply
        session.wealth -= amount
        session.active_ipos.append({
            "name": ipo_name,
            "amount": amount,
            "status": "APPLIED",
            "month": session.current_month
        })
        session.save()
        
        return {
            'session': session,
            'message': f"Applied for {ipo_name} IPO (₹{amount}). Allocation next month."
        }

    @staticmethod
    def generate_persona(session):
        """Generates the detailed end-game report."""
        # Note: logic copied from original views.py _generate_detailed_report
        # but cleaned up slightly.
        w = session.wealth
        h = session.happiness
        s = session.financial_literacy

        if w > 100000 and h > 80:
            p, d = "The Financial Guru", "Mastered wealth AND happiness."
        elif w > 100000 and h < 40:
            p, d = "The Miser", "Rich but miserable."
        elif w < 10000 and h > 80:
            p, d = "The Happy-Go-Lucky", "Broke but smiling."
        elif s >= 80:
            p, d = "The Warren Buffett", "Strategic genius."
        elif s >= 50:
            p, d = "The Balanced Spender", "Good balance."
        else:
            p, d = "The FOMO Victim", "Driven by trends."

        return {
            'persona': p,
            'description': d,
            'final_score': s,
            'net_worth': w
        }

    @staticmethod
    def _calculate_level(session):
        level = 1
        for threshold in GameEngine.CONFIG['LEVEL_THRESHOLDS']:
            if (
                session.current_month >= threshold['min_month']
                or session.financial_literacy >= threshold['min_literacy']
            ):
                level = threshold['level']
        return level

    @staticmethod
    def _refresh_level(session):
        next_level = GameEngine._calculate_level(session)
        if session.current_level != next_level:
            session.current_level = next_level
