import torch
import joblib
import logging
import numpy as np
import os
import random
from django.conf import settings
from .colab_architecture import StockPredictor

logger = logging.getLogger(__name__)

class AIStockPredictor:
    """
    Production inference engine for stock predictions.
    Loads PyTorch model and Scaler once (Singleton pattern).
    """
    _shared_model = {}
    _shared_scaler = {}

    def __init__(self, ticker='RELIANCE'):
        self.ticker = ticker.upper()
        self.device = torch.device('cpu') # Force CPU for web server deployment
        
        # Paths (Assumes files exist from Colab training)
        self.model_path = os.path.join(settings.BASE_DIR, f'game_engine/ml/models/{self.ticker.lower()}_model.pth')
        self.scaler_path = os.path.join(settings.BASE_DIR, f'game_engine/ml/models/{self.ticker.lower()}_scaler.pkl')
        
        # Check if already loaded in class/singleton storage
        if self.ticker in AIStockPredictor._shared_model:
            self.model = AIStockPredictor._shared_model[self.ticker]
            self.scaler = AIStockPredictor._shared_scaler[self.ticker]
        else:
            self.model = None
            self.scaler = None
            self._load_assets()

    @classmethod
    def preload_model(cls, ticker='RELIANCE'):
        """Helper to trigger loading without creating an instance."""
        predictor = cls(ticker) # This triggers _load_assets if not loaded
        return predictor.model is not None

    def _load_assets(self):
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                # Load Scaler
                scaler = joblib.load(self.scaler_path)
                
                # Load Model
                model = StockPredictor(input_dim=5, hidden_dim=64, num_layers=2, output_dim=1)
                model.load_state_dict(torch.load(self.model_path, map_location=self.device))
                model.eval()
                
                # Store in Singleton
                AIStockPredictor._shared_scaler[self.ticker] = scaler
                AIStockPredictor._shared_model[self.ticker] = model
                
                self.scaler = scaler
                self.model = model
                logger.info("[%s] AI Model Loaded Successfully.", self.ticker)
            else:
                logger.info("[%s] Model files not found. Falling back to simulation.", self.ticker)
        except Exception as e:
            logger.error("[%s] Error loading AI model: %s", self.ticker, e)

    def generate_forecast(self, seed_data, months=60):
        """
        Generates a 60-month trajectory based on seed data.
        seed_data: DataFrame or numpy array of shape (60, 5) 
                   Columns: ['Close', 'RSI', 'MACD', 'Signal', 'Return']
        """
        if self.model is None:
            # Fallback to GBM if model missing
            return self._fallback_generator(seed_data.iloc[-1]['Close'] if hasattr(seed_data, 'iloc') else 100, months)

        trajectory = []
        
        # 1. Prepare Initial Context
        # We need the last 60 days of data to predict Day 1
        current_context = seed_data.values[-60:] # Ensure we have exactly 60
        current_price = current_context[-1, 0] # Assume 'Close' is col 0
        
        # 2. Iterative Prediction Loop
        # Note: We are predicting MONTHLY points using a DAILY model.
        # Approximation: Run inference 20 times (trading days) to get next month? 
        # Or just treat 1 step = 1 month (if model trained on monthly)?
        # Assuming Model is Daily: We simulate 20 steps per game-month.
        
        for m_idx in range(months):
            # Run 20 daily steps to simulate 1 month of movement
            for d_idx in range(20): 
                scaled_input = self.scaler.transform(current_context)
                tensor_input = torch.from_numpy(scaled_input).float().unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    # Predict Scaled Close Price
                    pred_scaled = self.model(tensor_input).item()
                
                # Inverse Transform to get Real Price
                # We assume the model predicts Column 0 (Close)
                placeholder = np.zeros((1, 5))
                placeholder[0, 0] = pred_scaled
                # Fill other columns with mean values/zeros to avoid scaler complaining if it used them?
                # StandardScaler/MinMaxScaler usually element-wise.
                # However, we must ensure we don't accidentally inverse transform using Col 4 params for Col 0.
                # inverse_transform maps x -> (x - min) / scale
                pred_price = self.scaler.inverse_transform(placeholder)[0, 0]

                # --- CHAOS FACTOR ---
                # Add noise to the implied return
                if current_price > 0:
                    implied_return = (pred_price - current_price) / current_price
                else:
                    implied_return = 0

                # 5% chance of a "Market Shock" (±3-5%)
                if random.random() < 0.05:
                    chaos = random.uniform(-0.05, 0.05)
                else:
                    chaos = random.normalvariate(0, 0.01) # Standard market noise
                
                final_return = implied_return + chaos
                
                # Calculate New Price
                new_price = current_price * (1 + final_return)
                
                # Update Context (Shift window)
                # We need to construct a new row. 
                # REALITY CHECK: We can't easily calculate MACD/RSI on the fly without history.
                # Engineering Shortcut: Reuse previous technicals but update 'Close' and 'Return'.
                new_row = current_context[-1].copy()
                new_row[0] = new_price # Close
                new_row[4] = final_return # Return
                
                # Append and shift
                current_context = np.vstack([current_context[1:], new_row])
                current_price = new_price

            trajectory.append(int(current_price))

        return trajectory

    def _fallback_generator(self, start_price, months):
        """Legacy GBM logic for backup"""
        prices = []
        curr = start_price
        for _ in range(months):
            curr = curr * (1 + random.normalvariate(0.005, 0.05))
            prices.append(int(curr))
        return prices
