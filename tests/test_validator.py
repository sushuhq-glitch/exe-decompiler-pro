"""Test suite for validator module"""
import pytest
from validator.credential_validator import CredentialValidator
from validator.api_validator import APIValidator
from validator.response_validator import ResponseValidator
from validator.auth_validator import AuthValidator

class TestCredentialValidator:
    @pytest.fixture
    def validator(self):
        return CredentialValidator()
    
    @pytest.mark.asyncio
    async def test_validate(self, validator):
        result = await validator.validate("https://example.com", "test@test.com", "password", None)
        assert isinstance(result, dict)

class TestAPIValidator:
    @pytest.fixture
    def validator(self):
        return APIValidator()
    
    @pytest.mark.asyncio
    async def test_validate_endpoint(self, validator):
        result = await validator.validate_endpoint("https://example.com/api", "GET")
        assert isinstance(result, bool)

class TestResponseValidator:
    @pytest.fixture
    def validator(self):
        return ResponseValidator()
    
    def test_validate(self, validator):
        result = validator.validate({"status": 200, "body": "{}"})
        assert isinstance(result, bool)

class TestAuthValidator:
    @pytest.fixture
    def validator(self):
        return AuthValidator()
    
    def test_validate_token(self, validator):
        result = validator.validate_token("test_token_12345")
        assert isinstance(result, bool)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
