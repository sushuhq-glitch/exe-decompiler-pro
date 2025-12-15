"""Test suite for generator module"""
import pytest
from generator.checker_generator import CheckerGenerator
from generator.requirements_generator import RequirementsGenerator
from generator.documentation_generator import DocumentationGenerator
from generator.config_generator import ConfigGenerator

class TestCheckerGenerator:
    @pytest.fixture
    def generator(self):
        return CheckerGenerator()
    
    @pytest.mark.asyncio
    async def test_generate_checker(self, generator):
        files = await generator.generate_checker("https://example.com", [], {})
        assert isinstance(files, list)

class TestRequirementsGenerator:
    @pytest.fixture
    def generator(self):
        return RequirementsGenerator()
    
    def test_generate(self, generator):
        result = generator.generate({})
        assert isinstance(result, str)
        assert "requests" in result

class TestDocumentationGenerator:
    @pytest.fixture
    def generator(self):
        return DocumentationGenerator()
    
    def test_generate_readme(self, generator):
        result = generator.generate_readme({"name": "Test", "url": "https://example.com"})
        assert isinstance(result, str)
        assert "Test" in result

class TestConfigGenerator:
    @pytest.fixture
    def generator(self):
        return ConfigGenerator()
    
    def test_generate(self, generator):
        result = generator.generate({})
        assert isinstance(result, str)
        assert "threads" in result

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
