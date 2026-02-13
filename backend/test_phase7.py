import os
import django
from django.conf import settings
import sys

# Configure Django settings if not already configured
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
from django.conf import settings
settings.TESTING = True
django.setup()

from django.test.utils import get_runner

def run_tests():
    from io import StringIO
    import contextlib
    stream = StringIO()
    
    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=2, interactive=False)
    
    failures = 0
    try:
        with contextlib.redirect_stdout(stream), contextlib.redirect_stderr(stream):
            failures = test_runner.run_tests(["game_engine.tests.StartGameAPITests", "game_engine.tests.SubmitChoiceAPITests", "game_engine.tests.GameProgressionTests", "game_engine.tests_new_features.ValidationTests"])
    except Exception as e:
        stream.write(f"\nEXCEPTION DURING TESTING: {e}")
        failures = 1

    with open("test_results_v2.txt", "w", encoding="utf-8") as f:
        f.write(stream.getvalue())
        if failures:
            f.write(f"\nThere were {failures} failures.")
    
    sys.exit(1 if failures else 0)

if __name__ == "__main__":
    run_tests()
