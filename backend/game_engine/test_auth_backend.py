import logging
from django.contrib.auth.models import User
from rest_framework import authentication
from rest_framework import exceptions
from django.conf import settings

logger = logging.getLogger(__name__)

class TestAuthentication(authentication.BaseAuthentication):
    """
    Authentication backend for testing purposes only.
    Allows bypassing Firebase auth by providing a specific header.
    
    Usage:
    client.get('/api/endpoint/', HTTP_X_TEST_USER='testuser')
    
    Security:
    Only active if settings.DEBUG is True or settings.TESTING is True.
    """
    def authenticate(self, request):
        # Security check: Ensure this backend is never active in production
        if not getattr(settings, 'DEBUG', False) and not getattr(settings, 'TESTING', False):
            return None

        username = request.META.get('HTTP_X_TEST_USER')
        if not username:
            return None

        logger.info(f"TestAuthentication: Authenticating as test user '{username}'")

        try:
            user, created = User.objects.get_or_create(username=username)
            if created:
                user.set_unusable_password()
                user.save()
            return (user, None)
        except Exception as e:
            logger.error(f"TestAuthentication failed: {e}")
            raise exceptions.AuthenticationFailed('Test authentication failed')
