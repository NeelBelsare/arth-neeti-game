"""
AI Financial Advisor module for Arth-Neeti game.
Provides contextual financial advice using Gemini API or fallback responses.
"""

import os
import random

# Try to import Google's Generative AI library
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class FinancialAdvisor:
    """AI-powered financial advisor for game scenarios."""

    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        self.model = None

        if GENAI_AVAILABLE and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
            except Exception as e:
                print(f"Failed to initialize Gemini: {e}")
                self.model = None

    def get_advice(self, scenario_title, scenario_description, choices, player_wealth, player_happiness):
        """
        Get financial advice for a scenario.
        Uses Gemini API if available, otherwise returns curated fallback advice.
        """
        if self.model:
            return self._get_gemini_advice(
                scenario_title, scenario_description, choices,
                player_wealth, player_happiness
            )
        else:
            return self._get_fallback_advice(scenario_title, scenario_description, choices)

    def _get_gemini_advice(self, title, description, choices, wealth, happiness):
        """Get advice from Gemini API."""
        choices_text = "\n".join([
            f"- {c['text']} (Wealth: {c.get('wealth_impact', 0):+}, Happiness: {c.get('happiness_impact', 0):+})"
            for c in choices
        ])

        prompt = f"""You are a friendly Indian financial advisor in a financial literacy game called Arth-Neeti. 
A young professional earning ₹25,000/month is facing this situation:

**Current Status:**
- Wealth: ₹{wealth:,}
- Happiness: {happiness}/100

**Scenario:** {title}
{description}

**Available Choices:**
{choices_text}

Give brief, practical financial advice (2-3 sentences max) in a friendly tone. 
Consider the 50-30-20 rule (50% needs, 30% wants, 20% savings).
Don't explicitly say which option to pick, but guide them toward smart financial thinking.
Use simple language appropriate for someone new to personal finance.
"""

        try:
            response = self.model.generate_content(prompt)
            return {
                'advice': response.text,
                'source': 'ai',
                'success': True
            }
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._get_fallback_advice(title, description, choices)

    def _get_fallback_advice(self, title, description, choices):
        """
        Return curated fallback advice based on scenario category keywords.
        """
        title_lower = title.lower()
        description_lower = description.lower()

        # Category-based advice
        if any(word in title_lower or word in description_lower 
               for word in ['friend', 'party', 'wedding', 'festival', 'celebration']):
            advice = random.choice([
                "💡 Social events are important, but set a budget before attending. It's okay to say 'I'll catch the next one' if your finances are tight!",
                "💡 Before spending on social events, ask yourself: 'Is this a need or a want?' Your future self will thank you for wise choices.",
                "💡 Consider the 50-30-20 rule: 50% for needs, 30% for wants (like social events), 20% for savings. Where does this fit?"
            ])
        elif any(word in title_lower or word in description_lower 
                 for word in ['sale', 'discount', 'offer', 'deal', 'shopping']):
            advice = random.choice([
                "💡 A discount on something you don't need isn't a savings - it's still spending! Ask: 'Would I buy this at full price?'",
                "💡 Impulse buying often leads to regret. Try the 24-hour rule: wait a day before making non-essential purchases.",
                "💡 Just because something is on sale doesn't mean you can afford it. Check your budget first!"
            ])
        elif any(word in title_lower or word in description_lower 
                 for word in ['investment', 'mutual fund', 'stock', 'sip', 'fd', 'deposit']):
            advice = random.choice([
                "💡 Start investing early, even small amounts! SIPs of ₹500/month can grow significantly over time thanks to compounding.",
                "💡 Don't put all eggs in one basket. Diversify between safe options (FD, PPF) and growth options (mutual funds, stocks).",
                "💡 Before investing, build an emergency fund first - 3-6 months of expenses. Then invest consistently."
            ])
        elif any(word in title_lower or word in description_lower 
                 for word in ['loan', 'emi', 'credit', 'borrow', 'debt']):
            advice = random.choice([
                "💡 Avoid high-interest loans like credit cards (36-48% p.a.) and instant loan apps. They create a debt trap!",
                "💡 The EMI rule: Total EMIs shouldn't exceed 40% of your monthly income. Beyond this, you risk financial stress.",
                "💡 Good debt (education, home) vs bad debt (gadgets, vacations). Know the difference before borrowing."
            ])
        elif any(word in title_lower or word in description_lower 
                 for word in ['emergency', 'hospital', 'accident', 'repair', 'urgent']):
            advice = random.choice([
                "💡 This is exactly why an emergency fund matters! Always keep 3-6 months of expenses saved for unexpected situations.",
                "💡 For true emergencies, prioritize health and safety. Money can be earned back, but time and health cannot.",
                "💡 Consider getting health insurance if you don't have one. ₹500-1000/month can save you lakhs later!"
            ])
        elif any(word in title_lower or word in description_lower 
                 for word in ['phone', 'gadget', 'laptop', 'electronics', 'upgrade']):
            advice = random.choice([
                "💡 Gadgets depreciate fast! Ask yourself: Is this an upgrade I need, or just want? Last year's model often works just as well.",
                "💡 Before buying electronics on EMI, calculate the total cost with interest. That ₹50k phone might cost ₹60k!",
                "💡 The best phone is the one you can afford without stress. Function over fashion saves money."
            ])
        elif any(word in title_lower or word in description_lower 
                 for word in ['insurance', 'policy', 'term', 'health']):
            advice = random.choice([
                "💡 Insurance is for protection, not investment! Buy Term Insurance for life cover (cheap and high coverage).",
                "💡 Health insurance is a must - medical inflation in India is 15% per year. Get covered before you need it.",
                "💡 Review insurance policies before buying. Traditional LIC policies often give poor returns compared to mutual funds."
            ])
        else:
            advice = random.choice([
                "💡 Financial literacy tip: Track every rupee you spend for a month. You'll be surprised where your money goes!",
                "💡 Remember the 50-30-20 rule: 50% needs, 30% wants, 20% savings. Small discipline leads to big wealth!",
                "💡 Pay yourself first! Set up auto-transfers to savings as soon as salary arrives, before spending on anything else.",
                "💡 Your financial decisions today shape your tomorrow. Think long-term, but don't forget to enjoy life responsibly!",
                "💡 Before any purchase, ask: Is this a need, a want, or a 'nice to have'? Prioritize accordingly."
            ])

        return {
            'advice': advice,
            'source': 'curated',
            'success': True
        }


# Singleton instance
_advisor = None


def get_advisor():
    """Get or create the singleton advisor instance."""
    global _advisor
    if _advisor is None:
        _advisor = FinancialAdvisor()
    return _advisor
