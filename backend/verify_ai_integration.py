
import os
import django
from django.conf import settings

# Setup Django if run standalone (though shell handles this, good for reference)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from game_engine.services import GameEngine
from game_engine.models import StockHistory, MarketTickerData

def verify_integration():
    print("--- Starting Integration Verification ---")
    
    # 1. Verify Seed Data
    seed_count = MarketTickerData.objects.count()
    print(f"MarketTickerData Count: {seed_count}")
    if seed_count == 0:
        print("FAILED: No seed data found.")
        return

    # 2. Create User
    username = "test_ai_user"
    user, created = User.objects.get_or_create(username=username)
    print(f"Test User: {user.username}")

    # 3. Start Session
    print("Starting new game session...")
    try:
        session = GameEngine.start_new_session(user)
        print(f"Session Created: ID {session.id}, Month {session.current_month}")
    except Exception as e:
        print(f"FAILED: start_new_session raised exception: {e}")
        import traceback
        traceback.print_exc()
        return

    # 4. Check Stock History
    history_count = StockHistory.objects.filter(session=session).count()
    print(f"StockHistory Records: {history_count}")
    
    # We expect 12 months * 3 sectors = 36 records
    if history_count >= 36:
        print("SUCCESS: StockHistory populated.")
    else:
        print(f"WARNING: Expected ~36 records, got {history_count}")

    # 5. Check Market Prices
    print(f"Initial Market Prices: {session.market_prices}")
    if 'tech' in session.market_prices and session.market_prices['tech'] > 0:
         print("SUCCESS: Tech sector price set.")
    else:
         print("FAILED: Tech sector price missing or zero.")

    # 6. Check AI/Fallback usage
    # Since we don't have the model file, it should have used the fallback but logically flow through the AIStockPredictor class fallback method.
    # We can check if the prices vary (fallback GBM) or are static? Fallback GBM is random.
    
    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    verify_integration()
