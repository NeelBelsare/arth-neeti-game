from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def standard_exception_handler(exc, context):
    """
    Custom exception handler that returns a standardized error response format:
    {
        "error": "Summary error message",
        "code": "error_code_string",
        "detail": "Detailed error info (if meaningful specific detail exists)"
    }
    """
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Use the status code from the response or 500 if None
    status_code = response.status_code if response else status.HTTP_500_INTERNAL_SERVER_ERROR

    if response is None:
        # If response is None, it means it's an unhandled exception (500)
        # Log the full exception with stack trace
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        
        return Response({
            "error": "Internal Server Error",
            "code": "internal_server_error",
            "detail": str(exc) if status_code < 500 else "An unexpected error occurred."
        }, status=status_code)

    # If response exists, standardize its data
    data = response.data
    custom_data = {
        "error": "Request Failed",
        "code": "request_failed"
    }

    # Extract clearer error message from DRF's various error structures
    if isinstance(data, dict):
        if "detail" in data:
            custom_data["error"] = data["detail"]
            custom_data["code"] = data.get("code", "error")
        else:
            # Handle validation errors (field errors)
            # e.g. {"field": ["Error message"]}
            # We take the first error we find for the summary
            first_key = next(iter(data))
            first_val = data[first_key]
            
            if isinstance(first_val, list):
                custom_data["error"] = f"{first_key}: {first_val[0]}"
            else:
                custom_data["error"] = f"{first_key}: {first_val}"
            
            custom_data["code"] = "validation_error"
            custom_data["detail"] = data # Keep full validation errors in detail

    elif isinstance(data, list):
        custom_data["error"] = data[0]
        custom_data["code"] = "error"

    response.data = custom_data
    return response
