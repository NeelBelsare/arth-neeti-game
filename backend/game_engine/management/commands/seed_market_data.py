import pandas as pd
from django.core.management.base import BaseCommand
from game_engine.models import MarketTickerData
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Seeds source market data from CSV for Cold Start context'

    def handle(self, *args, **kwargs):
        # Using the uploaded NIFTY_50_COMPANIES.csv
        # Assuming the CSV is in the root directory relative to 'backend' (settings.BASE_DIR)
        csv_path = os.path.join(settings.BASE_DIR, '..', 'NIFTY_50_COMPANIES.csv')
        
        if not os.path.exists(csv_path):
            # Fallback check mainly for dev environment variation
            csv_path = os.path.join(settings.BASE_DIR, 'game_engine', 'ml', 'data', 'NIFTY_50_COMPANIES.csv')
            
        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f'CSV not found at {csv_path}'))
            return

        self.stdout.write("Loading CSV...")
        try:
            df = pd.read_csv(csv_path)
            
            # Filter for RELIANCE.NS as our primary Tech/Bluechip proxy
            ticker = 'RELIANCE.NS'
            if 'Ticker' not in df.columns:
                 # Try to guess column if 'Ticker' is missing or different
                 if 'Symbol' in df.columns:
                     ticker_col = 'Symbol'
                 else:
                     self.stdout.write(self.style.ERROR(f"CSV missing 'Ticker' column. Columns: {df.columns}"))
                     return
            else:
                 ticker_col = 'Ticker'
                 
            data = df[df[ticker_col] == ticker].copy()
            
            if data.empty:
                 self.stdout.write(self.style.WARNING(f"No data found for {ticker} in CSV."))
                 return

            # Sort and select features required by LSTM
            # Features: ['Close', 'RSI_14', 'MACD', 'Signal_Line', 'Daily_Return_%']
            if 'Date' in data.columns:
                data['Date'] = pd.to_datetime(data['Date'])
                data = data.sort_values('Date')
            
            # Clean Data
            required_cols = ['Close', 'RSI_14', 'MACD', 'Signal_Line', 'Daily_Return_%']
            missing_cols = [c for c in required_cols if c not in data.columns]
            if missing_cols:
                self.stdout.write(self.style.ERROR(f"Missing columns: {missing_cols}"))
                return
                
            data = data.dropna(subset=required_cols)
            
            # Save to DB (Optimized bulk create)
            records = []
            self.stdout.write(f"Seeding {len(data)} records for {ticker}...")
            
            # Clear old data for this ticker
            MarketTickerData.objects.filter(ticker=ticker).delete()
            
            for index, row in data.iterrows():
                records.append(MarketTickerData(
                    ticker=ticker,
                    date=row['Date'],
                    close=row['Close'],
                    rsi=row['RSI_14'],
                    macd=row['MACD'],
                    signal=row['Signal_Line'],
                    daily_return=row['Daily_Return_%']
                ))
                
                if len(records) > 5000:
                    MarketTickerData.objects.bulk_create(records)
                    records = []
                    
            if records:
                MarketTickerData.objects.bulk_create(records)
                
            self.stdout.write(self.style.SUCCESS(f'Successfully seeded data for {ticker}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error seeding data: {e}"))
