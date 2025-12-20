"""
Input Validation Module.

This module provides comprehensive input validation utilities for the keyword
generator, ensuring data integrity and preventing invalid operations.

Classes:
    Validators: Collection of validation methods for various data types.

Example:
    >>> from utils.validators import Validators
    >>> Validators.validate_count(1000)  # Returns True
    >>> Validators.validate_language("IT")  # Returns True
"""

import re
import os
from typing import Any, List, Optional, Union
from pathlib import Path


class ValidationError(Exception):
    """Custom exception for validation failures."""
    
    def __init__(self, message: str, field: Optional[str] = None):
        """
        Initialize validation error.
        
        Args:
            message: Error message describing the validation failure.
            field: Optional field name that failed validation.
        """
        self.field = field
        self.message = message
        super().__init__(self.message)
    
    def __str__(self) -> str:
        """Return formatted error message."""
        if self.field:
            return f"Validation error for '{self.field}': {self.message}"
        return f"Validation error: {self.message}"


class Validators:
    """
    Comprehensive input validation utilities.
    
    This class provides static methods for validating various types of input
    data used throughout the keyword generator application.
    
    Attributes:
        SUPPORTED_LANGUAGES (List[str]): List of supported language codes.
        SUPPORTED_FORMATS (List[str]): List of supported file formats.
        MIN_COUNT (int): Minimum keyword count.
        MAX_COUNT (int): Maximum keyword count.
        MIN_KEYWORD_LENGTH (int): Minimum keyword length.
        MAX_KEYWORD_LENGTH (int): Maximum keyword length.
        MIN_PASSWORD_LENGTH (int): Minimum password length.
        MAX_PASSWORD_LENGTH (int): Maximum password length.
    """
    
    # Constants
    SUPPORTED_LANGUAGES = ['IT', 'MX', 'DE', 'TW', 'AT']
    SUPPORTED_FORMATS = ['txt', 'csv', 'json']
    MIN_COUNT = 1
    MAX_COUNT = 10_000_000
    MIN_KEYWORD_LENGTH = 3
    MAX_KEYWORD_LENGTH = 150
    MIN_PASSWORD_LENGTH = 6
    MAX_PASSWORD_LENGTH = 30
    EMAIL_REGEX = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )
    
    @staticmethod
    def validate_language(language: str) -> bool:
        """
        Validate language code.
        
        Args:
            language: Language code to validate (e.g., 'IT', 'MX').
        
        Returns:
            True if language is supported.
        
        Raises:
            ValidationError: If language is not supported.
        
        Example:
            >>> Validators.validate_language("IT")
            True
        """
        if not isinstance(language, str):
            raise ValidationError(
                f"Language must be a string, got {type(language).__name__}",
                "language"
            )
        
        language = language.upper().strip()
        
        if not language:
            raise ValidationError("Language cannot be empty", "language")
        
        if language not in Validators.SUPPORTED_LANGUAGES:
            raise ValidationError(
                f"Unsupported language '{language}'. "
                f"Supported: {', '.join(Validators.SUPPORTED_LANGUAGES)}",
                "language"
            )
        
        return True
    
    @staticmethod
    def validate_count(count: Union[int, str]) -> int:
        """
        Validate keyword count.
        
        Args:
            count: Number of keywords to generate (int or string).
        
        Returns:
            Validated count as integer.
        
        Raises:
            ValidationError: If count is invalid.
        
        Example:
            >>> Validators.validate_count("1000")
            1000
        """
        try:
            if isinstance(count, str):
                # Remove common separators
                count = count.replace(',', '').replace('_', '').replace(' ', '')
                count = int(count)
            elif not isinstance(count, int):
                raise ValueError()
        except (ValueError, AttributeError):
            raise ValidationError(
                f"Count must be a valid integer, got '{count}'",
                "count"
            )
        
        if count < Validators.MIN_COUNT:
            raise ValidationError(
                f"Count must be at least {Validators.MIN_COUNT}, got {count}",
                "count"
            )
        
        if count > Validators.MAX_COUNT:
            raise ValidationError(
                f"Count cannot exceed {Validators.MAX_COUNT:,}, got {count:,}",
                "count"
            )
        
        return count
    
    @staticmethod
    def validate_keyword_length(keyword: str) -> bool:
        """
        Validate keyword length.
        
        Args:
            keyword: Keyword to validate.
        
        Returns:
            True if keyword length is valid.
        
        Raises:
            ValidationError: If keyword length is invalid.
        
        Example:
            >>> Validators.validate_keyword_length("test keyword")
            True
        """
        if not isinstance(keyword, str):
            raise ValidationError(
                f"Keyword must be a string, got {type(keyword).__name__}",
                "keyword"
            )
        
        length = len(keyword)
        
        if length < Validators.MIN_KEYWORD_LENGTH:
            raise ValidationError(
                f"Keyword too short (min {Validators.MIN_KEYWORD_LENGTH} chars), "
                f"got {length} chars: '{keyword}'",
                "keyword"
            )
        
        if length > Validators.MAX_KEYWORD_LENGTH:
            raise ValidationError(
                f"Keyword too long (max {Validators.MAX_KEYWORD_LENGTH} chars), "
                f"got {length} chars",
                "keyword"
            )
        
        return True
    
    @staticmethod
    def validate_file_path(file_path: Union[str, Path]) -> Path:
        """
        Validate file path.
        
        Args:
            file_path: Path to validate.
        
        Returns:
            Validated Path object.
        
        Raises:
            ValidationError: If path is invalid.
        
        Example:
            >>> path = Validators.validate_file_path("/tmp/test.txt")
            >>> isinstance(path, Path)
            True
        """
        if not file_path:
            raise ValidationError("File path cannot be empty", "file_path")
        
        try:
            path = Path(file_path)
        except (TypeError, ValueError) as e:
            raise ValidationError(
                f"Invalid file path: {e}",
                "file_path"
            )
        
        # Check if parent directory exists or can be created
        parent = path.parent
        if not parent.exists():
            try:
                parent.mkdir(parents=True, exist_ok=True)
            except (OSError, PermissionError) as e:
                raise ValidationError(
                    f"Cannot create parent directory: {e}",
                    "file_path"
                )
        
        return path
    
    @staticmethod
    def validate_existing_file(file_path: Union[str, Path]) -> Path:
        """
        Validate that file exists.
        
        Args:
            file_path: Path to existing file.
        
        Returns:
            Validated Path object.
        
        Raises:
            ValidationError: If file doesn't exist or is not a file.
        
        Example:
            >>> path = Validators.validate_existing_file("/etc/hosts")
            >>> path.exists()
            True
        """
        path = Validators.validate_file_path(file_path)
        
        if not path.exists():
            raise ValidationError(
                f"File does not exist: {path}",
                "file_path"
            )
        
        if not path.is_file():
            raise ValidationError(
                f"Path is not a file: {path}",
                "file_path"
            )
        
        return path
    
    @staticmethod
    def validate_file_format(file_format: str) -> str:
        """
        Validate file format.
        
        Args:
            file_format: File format to validate (e.g., 'txt', 'csv').
        
        Returns:
            Validated format string (lowercase).
        
        Raises:
            ValidationError: If format is not supported.
        
        Example:
            >>> Validators.validate_file_format("TXT")
            'txt'
        """
        if not isinstance(file_format, str):
            raise ValidationError(
                f"File format must be a string, got {type(file_format).__name__}",
                "file_format"
            )
        
        file_format = file_format.lower().strip()
        
        if not file_format:
            raise ValidationError("File format cannot be empty", "file_format")
        
        if file_format not in Validators.SUPPORTED_FORMATS:
            raise ValidationError(
                f"Unsupported file format '{file_format}'. "
                f"Supported: {', '.join(Validators.SUPPORTED_FORMATS)}",
                "file_format"
            )
        
        return file_format
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """
        Validate email address format.
        
        Args:
            email: Email address to validate.
        
        Returns:
            True if email format is valid.
        
        Raises:
            ValidationError: If email format is invalid.
        
        Example:
            >>> Validators.validate_email("user@example.com")
            True
        """
        if not isinstance(email, str):
            raise ValidationError(
                f"Email must be a string, got {type(email).__name__}",
                "email"
            )
        
        email = email.strip()
        
        if not email:
            raise ValidationError("Email cannot be empty", "email")
        
        if not Validators.EMAIL_REGEX.match(email):
            raise ValidationError(
                f"Invalid email format: '{email}'",
                "email"
            )
        
        return True
    
    @staticmethod
    def validate_password_length(password: str) -> bool:
        """
        Validate password length.
        
        Args:
            password: Password to validate.
        
        Returns:
            True if password length is valid.
        
        Raises:
            ValidationError: If password length is invalid.
        
        Example:
            >>> Validators.validate_password_length("mypassword123")
            True
        """
        if not isinstance(password, str):
            raise ValidationError(
                f"Password must be a string, got {type(password).__name__}",
                "password"
            )
        
        length = len(password)
        
        if length < Validators.MIN_PASSWORD_LENGTH:
            raise ValidationError(
                f"Password too short (min {Validators.MIN_PASSWORD_LENGTH} chars), "
                f"got {length} chars",
                "password"
            )
        
        if length > Validators.MAX_PASSWORD_LENGTH:
            raise ValidationError(
                f"Password too long (max {Validators.MAX_PASSWORD_LENGTH} chars), "
                f"got {length} chars",
                "password"
            )
        
        return True
    
    @staticmethod
    def validate_combo_line(line: str) -> tuple[str, str]:
        """
        Validate and parse combo line (email:password format).
        
        Args:
            line: Combo line to validate.
        
        Returns:
            Tuple of (email, password).
        
        Raises:
            ValidationError: If combo format is invalid.
        
        Example:
            >>> email, password = Validators.validate_combo_line("user@test.com:pass123")
            >>> email
            'user@test.com'
        """
        if not isinstance(line, str):
            raise ValidationError(
                f"Combo line must be a string, got {type(line).__name__}",
                "combo_line"
            )
        
        line = line.strip()
        
        if not line:
            raise ValidationError("Combo line cannot be empty", "combo_line")
        
        if ':' not in line:
            raise ValidationError(
                "Invalid combo format. Expected 'email:password'",
                "combo_line"
            )
        
        parts = line.split(':', 1)
        if len(parts) != 2:
            raise ValidationError(
                "Invalid combo format. Expected exactly one ':' separator",
                "combo_line"
            )
        
        email, password = parts
        email = email.strip()
        password = password.strip()
        
        if not email:
            raise ValidationError("Email part is empty in combo", "combo_line")
        
        if not password:
            raise ValidationError("Password part is empty in combo", "combo_line")
        
        # Validate email format
        try:
            Validators.validate_email(email)
        except ValidationError as e:
            raise ValidationError(
                f"Invalid email in combo: {e.message}",
                "combo_line"
            )
        
        return email, password
    
    @staticmethod
    def validate_positive_integer(value: Union[int, str], name: str = "value") -> int:
        """
        Validate positive integer.
        
        Args:
            value: Value to validate.
            name: Name of the value for error messages.
        
        Returns:
            Validated integer.
        
        Raises:
            ValidationError: If value is not a positive integer.
        
        Example:
            >>> Validators.validate_positive_integer("42", "batch_size")
            42
        """
        try:
            if isinstance(value, str):
                value = int(value.strip())
            elif not isinstance(value, int):
                raise ValueError()
        except (ValueError, AttributeError):
            raise ValidationError(
                f"{name} must be a valid integer, got '{value}'",
                name
            )
        
        if value <= 0:
            raise ValidationError(
                f"{name} must be positive, got {value}",
                name
            )
        
        return value
    
    @staticmethod
    def validate_boolean(value: Any, name: str = "value") -> bool:
        """
        Validate and convert to boolean.
        
        Args:
            value: Value to convert to boolean.
            name: Name of the value for error messages.
        
        Returns:
            Boolean value.
        
        Example:
            >>> Validators.validate_boolean("yes", "deterministic")
            True
        """
        if isinstance(value, bool):
            return value
        
        if isinstance(value, str):
            value = value.lower().strip()
            if value in ('true', 'yes', 'y', '1', 'on'):
                return True
            if value in ('false', 'no', 'n', '0', 'off'):
                return False
        
        if isinstance(value, (int, float)):
            return bool(value)
        
        raise ValidationError(
            f"{name} must be a boolean value, got '{value}'",
            name
        )
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitize filename by removing/replacing invalid characters.
        
        Args:
            filename: Filename to sanitize.
        
        Returns:
            Sanitized filename.
        
        Example:
            >>> Validators.sanitize_filename("my/file:name.txt")
            'my_file_name.txt'
        """
        if not filename:
            return "output.txt"
        
        # Remove or replace invalid characters
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            filename = filename.replace(char, '_')
        
        # Remove leading/trailing dots and spaces
        filename = filename.strip('. ')
        
        # Ensure filename is not empty after sanitization
        if not filename:
            return "output.txt"
        
        return filename
