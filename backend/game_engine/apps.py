from django.apps import AppConfig


class GameEngineConfig(AppConfig):
    name = 'game_engine'
    
    def ready(self):
        """Initialize Firebase when Django starts."""
        # Import here to avoid AppRegistryNotReady error
        from .firebase_auth import initialize_firebase
        
        # Initialize Firebase (with built-in duplicate check)
        initialize_firebase()

