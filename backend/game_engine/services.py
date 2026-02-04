import random
import uuid
from django.contrib.auth.models import User
from .models import GameSession, PlayerChoice, RecurringExpense, GameHistory, PlayerProfile

class GameEngine:
    # Game Configuration Constants
    CONFIG = {
        'STARTING_WEALTH': 25000,
        'HAPPINESS_START': 100,
        'CREDIT_SCORE_START': 700,
        'START_MONTH': 1,
        'CARDS_PER_MONTH': 3,
        'GAME_DURATION_MONTHS': 12,
        'MIN_HAPPINESS': 0,
        'MAX_HAPPINESS': 100,
        'MIN_CREDIT': 300,
        'MAX_CREDIT': 900,
        'MONTHLY_SALARY': 25000,
        'STOCK_SECTORS': ['gold', 'tech', 'real_estate']
    }

    @staticmethod
    def start_new_session(user):
        """Initialize a new game session with defaults."""
        return GameSession.objects.create(
            user=user,
            wealth=GameEngine.CONFIG['STARTING_WEALTH'],
            happiness=GameEngine.CONFIG['HAPPINESS_START'],
            credit_score=GameEngine.CONFIG['CREDIT_SCORE_START'],
            current_month=GameEngine.CONFIG['START_MONTH']
        )

    @staticmethod
    def process_choice(session, card, choice):
        """
        Main game loop step:
        1. Apply direct impacts (wealth, happiness, etc)
        2. Handle recurring expenses (Add/Remove)
        3. Handle Market Events (The Fix!)
        4. Log choice
        5. Check for month advance
        6. Check Win/Loss
        """
        
        # 1. Apply Impacts
        session.wealth += choice.wealth_impact
        session.happiness += choice.happiness_impact
        session.credit_score += choice.credit_impact
        session.financial_literacy += choice.literacy_impact

        # Clamp values
        session.happiness = max(
            GameEngine.CONFIG['MIN_HAPPINESS'], 
            min(GameEngine.CONFIG['MAX_HAPPINESS'], session.happiness)
        )
        session.credit_score = max(
            GameEngine.CONFIG['MIN_CREDIT'], 
            min(GameEngine.CONFIG['MAX_CREDIT'], session.credit_score)
        )

        feedback_parts = []
        if choice.feedback:
            feedback_parts.append(choice.feedback)

        # 2. Handle Recurring Expenses
        if choice.adds_recurring_expense > 0:
            RecurringExpense.objects.create(
                session=session,
                name=choice.expense_name or f"Expense from '{card.title}'",
                amount=choice.adds_recurring_expense,
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

        # 3. Handle Market Events (CRITICAL FIX)
        # If the card is a NEWS event, it should impact the market IMMEDIATELY
        if card.market_event and card.market_event.is_active:
            event = card.market_event
            impacts = event.sector_impacts # e.g., {'tech': 1.2, 'gold': 0.9}
            
            market_changes = []
            if session.market_prices:
                for sector, multiplier in impacts.items():
                    if sector in session.market_prices:
                        old_price = session.market_prices[sector]
                        new_price = int(old_price * multiplier)
                        session.market_prices[sector] = new_price
                        
                        # Track change for feedback
                        pct = int((multiplier - 1) * 100)
                        direction = "jumped" if pct > 0 else "crashed"
                        market_changes.append(f"{sector.title()} {direction} {abs(pct)}%")
            
            if market_changes:
                feedback_parts.append(f" 📉 MARKET NEWS: {', '.join(market_changes)}!")

        # 4. Log Choice
        PlayerChoice.objects.create(session=session, card=card, choice=choice)

        # 5. Advance Month Logic
        choices_count = PlayerChoice.objects.filter(session=session).count()
        new_month = (choices_count // GameEngine.CONFIG['CARDS_PER_MONTH']) + 1
        
        if new_month > session.current_month:
            report = GameEngine._advance_month(session, new_month - session.current_month)
            session.current_month = new_month
            feedback_parts.append(report)

        # 6. Check Game Over
        game_over, reason = GameEngine._check_game_over(session)
        if game_over:
            session.is_active = False
            GameEngine._finalize_game(session, reason)

        session.save()

        return {
            'session': session,
            'feedback': " ".join(feedback_parts),
            'game_over': game_over,
            'game_over_reason': reason,
            'final_persona': GameEngine._generate_persona(session) if game_over else None
        }

    @staticmethod
    def _advance_month(session, months_passed=1):
        """Handles salary, expenses, and random market fluctuations."""
        
        # Salary
        salary_credit = GameEngine.CONFIG['MONTHLY_SALARY'] * months_passed
        session.wealth += salary_credit

        # Expenses
        active_expenses = session.expenses.filter(is_cancelled=False)
        monthly_drain = sum(e.amount for e in active_expenses)
        total_drain = monthly_drain * months_passed
        session.wealth -= total_drain
        session.recurring_expenses = monthly_drain

        # Random Market Fluctuation (Volatile, but smaller than Events)
        # This keeps the market alive even without news
        if session.market_prices:
            for sector in GameEngine.CONFIG['STOCK_SECTORS']:
                if sector in session.market_prices:
                    current = session.market_prices[sector]
                    # Random drift -5% to +5%
                    change = random.uniform(0.95, 1.05)
                    session.market_prices[sector] = int(current * change)

        return (
            f"\n📅 Month Completed! "
            f"+₹{salary_credit} Salary. "
            f"-₹{total_drain} Expenses. "
            f"Market inputs processed."
        )

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
        """Save history and update profile stats."""
        persona_data = GameEngine._generate_persona(session)
        
        # Save History
        if session.user:
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

            # Update Profile
            profile, _ = PlayerProfile.objects.get_or_create(user=session.user)
            profile.total_games += 1
            profile.highest_wealth = max(profile.highest_wealth, session.wealth)
            profile.highest_score = max(profile.highest_score, session.financial_literacy)
            profile.save()

    @staticmethod
    def _generate_persona(session):
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
