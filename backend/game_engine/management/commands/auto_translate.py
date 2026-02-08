from django.core.management.base import BaseCommand
from game_engine.models import ScenarioCard, Choice
from deep_translator import GoogleTranslator
import time

class Command(BaseCommand):
    help = 'Auto-translate scenarios using Google Translate (via deep-translator)'

    def handle(self, *args, **options):
        self.stdout.write('[INFO] Starting auto-translation...')
        
        # Initialize Translators
        translator_hi = GoogleTranslator(source='auto', target='hi')
        translator_mr = GoogleTranslator(source='auto', target='mr')

        # Translate Scenario Cards
        cards = ScenarioCard.objects.all()
        total_cards = cards.count()
        self.stdout.write(f'[INFO] Found {total_cards} cards to process.')
        
        for i, card in enumerate(cards):
            try:
                changed = False
                
                # Hindi
                if not card.title_hi:
                    card.title_hi = translator_hi.translate(card.title)
                    changed = True
                if not card.description_hi:
                    card.description_hi = translator_hi.translate(card.description)
                    changed = True
                
                # Marathi
                if not card.title_mr:
                    card.title_mr = translator_mr.translate(card.title)
                    changed = True
                if not card.description_mr:
                    card.description_mr = translator_mr.translate(card.description)
                    changed = True
                
                if changed:
                    card.save()
                    self.stdout.write(f'[SUCCESS] Translated Card {i+1}/{total_cards}: {card.title}')
                else:
                    self.stdout.write(f'[SKIP] Card {i+1}/{total_cards} already translated.')
                
                # Sleep briefly to avoid rate limits
                time.sleep(0.5)

            except Exception as e:
                self.stdout.write(f'[ERROR] Failed to translate Card {card.id}: {e}')
        
        # Translate Choices
        choices = Choice.objects.all()
        total_choices = choices.count()
        self.stdout.write(f'[INFO] Found {total_choices} choices to process.')
        
        for i, choice in enumerate(choices):
            try:
                changed = False
                
                # Hindi
                if not choice.text_hi:
                    choice.text_hi = translator_hi.translate(choice.text)
                    changed = True
                if not choice.feedback_hi and choice.feedback:
                    choice.feedback_hi = translator_hi.translate(choice.feedback)
                    changed = True
                
                # Marathi
                if not choice.text_mr:
                    choice.text_mr = translator_mr.translate(choice.text)
                    changed = True
                if not choice.feedback_mr and choice.feedback:
                    choice.feedback_mr = translator_mr.translate(choice.feedback)
                    changed = True
                
                if changed:
                    choice.save()
                    self.stdout.write(f'[SUCCESS] Translated Choice {i+1}/{total_choices}: {choice.text[:30]}...')
                else:
                    self.stdout.write(f'[SKIP] Choice {i+1}/{total_choices} already translated.')
                
                # Sleep briefly
                time.sleep(0.5)
                
            except Exception as e:
                self.stdout.write(f'[ERROR] Failed to translate Choice {choice.id}: {e}')

        self.stdout.write('[DONE] Auto-translation completed.')
