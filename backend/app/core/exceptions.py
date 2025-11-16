"""
Custom exceptions - Application-specific error classes
"""


class AppException(Exception):
    """Base application exception"""
    
    def __init__(self, message: str, status_code: int = 500, detail: str = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)


class NotFoundException(AppException):
    """Resource not found exception"""
    
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)


class UnauthorizedException(AppException):
    """Unauthorized access exception"""
    
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status_code=401)


class ForbiddenException(AppException):
    """Forbidden access exception"""
    
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, status_code=403)


class BadRequestException(AppException):
    """Bad request exception"""
    
    def __init__(self, message: str = "Bad request", detail: str = None):
        super().__init__(message, status_code=400, detail=detail)


class ConflictException(AppException):
    """Resource conflict exception"""
    
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message, status_code=409)
