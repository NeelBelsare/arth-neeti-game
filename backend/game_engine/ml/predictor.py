import numpy as np
import random

class MarketPredictor:
    """
    Generates realistic stock market trajectories.
    V1: Uses Geometric Brownian Motion (GBM) to simulate realistic volatility.
    V2 (TODO): Load sklearn/PyTorch model trained on real NIFTY/NASDAQ data.
    """
    
    SECTOR_CONFIG = {
        'tech': {'mu': 0.02, 'sigma': 0.15, 'start': 500},  # High growth, high volatility
        'gold': {'mu': 0.005, 'sigma': 0.05, 'start': 1800}, # Stable, low volatility
        'real_estate': {'mu': 0.01, 'sigma': 0.02, 'start': 300} # Slow steady growth
    }

    @staticmethod
    def generate_trajectory(sector, duration_months=12):
        """
        Returns a list of 12 prices.
        """
        config = MarketPredictor.SECTOR_CONFIG.get(sector, {'mu': 0.01, 'sigma': 0.1, 'start': 100})
        
        # GBM Parameters
        T = 1.0
        dt = T / duration_months
        current_price = config['start']
        prices = []

        for _ in range(duration_months):
            # GBM Formula: S_t = S_{t-1} * exp((mu - 0.5*sigma^2)*dt + sigma*sqrt(dt)*Z)
            drift = (config['mu'] - 0.5 * config['sigma']**2) * dt
            # Use random.gauss or np.random.normal. Since we imported numpy as np, use that.
            shock = config['sigma'] * np.sqrt(dt) * np.random.normal()
            
            current_price = current_price * np.exp(drift + shock)
            prices.append(int(current_price))

        return prices

    @staticmethod
    def get_futures_quote(current_price, sector, duration):
        """
        Calculates the Contract Price for a futures contract.
        Logic: Forecast Price - Risk Premium (The "House Edge")
        """
        # Simulate the ML's "forecast" (which is just the trend component without the noise)
        config = MarketPredictor.SECTOR_CONFIG.get(sector)
        if not config:
             # Fallback if sector unknown
             config = {'mu': 0.01}
             
        expected_growth = config['mu'] * (duration / 12.0)
        
        # The 'Predicted' price is roughly current * growth
        predicted_price = current_price * (1 + expected_growth)
        
        # Discount Factor (The "Fee"): 5% + 1% per month of duration
        risk_discount = 0.05 + (0.01 * duration)
        
        contract_price = int(predicted_price * (1 - risk_discount))
        return contract_price
