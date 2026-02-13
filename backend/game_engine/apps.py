from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class GameEngineConfig(AppConfig):
    name = 'game_engine'
    
    def ready(self):
        """Initialize Firebase when Django starts."""
        # Import here to avoid AppRegistryNotReady error
        from .firebase_auth import initialize_firebase
        
        # Initialize Firebase (with built-in duplicate check)
        initialize_firebase()
        
        # Preload AI Models
        try:
            from .ml.predictor import AIStockPredictor
            AIStockPredictor.preload_model('RELIANCE')
        except ImportError:
            pass # Handle case where deps aren't ready yet (e.g. during migration)
        except Exception as e:
            logger.warning("Failed to preload AI model: %s", e)
