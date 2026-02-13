import os
import django
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, APIException

# Configure Django settings if not already configured
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from game_engine.exceptions import standard_exception_handler
from core.urls import health_check

def test_exception_handler():
    print("\n--- Testing Exception Handler ---")
    
    # Test 1: Validation Error
    exc = ValidationError({"field": ["This field is required."]})
    context = {} # Mock context
    response = standard_exception_handler(exc, context)
    print(f"Validation Error Response: {response.data}")
    assert response.data['error'] == "field: This field is required."
    assert response.data['code'] == "validation_error"

    # Test 2: Generic API Exception
    class MyError(APIException):
        status_code = 400
        default_detail = 'Something went wrong.'
        default_code = 'my_error'

    exc = MyError()
    response = standard_exception_handler(exc, context)
    print(f"API Exception Response: {response.data}")
    assert response.data['error'] == "Something went wrong."
    assert response.data['code'] == "my_error"

    print("Exception handler tests passed!")

def test_health_check():
    print("\n--- Testing Health Check ---")
    
    # Mock request
    from django.test import RequestFactory
    request = RequestFactory().get('/health-check/')
    
    response = health_check(request)
    import json
    data = json.loads(response.content)
    print(f"Health Check Response: {data}")
    
    assert data['status'] == 'ok'
    assert data['version'] == 'v1'
    # database status might be 'unknown' or 'connected' depending on DB state, 
    # but we just want to ensure it runs without crashing.
    print("Health check tests passed!")

if __name__ == "__main__":
    try:
        test_exception_handler()
        test_health_check()
        print("\nAll Phase 6 verifications passed!")
    except Exception as e:
        print(f"\nVerification FAILED: {e}")
        exit(1)
