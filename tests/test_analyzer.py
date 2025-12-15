"""
Test suite for analyzer module
Comprehensive tests for website analysis functionality
"""
import pytest
import asyncio
from analyzer.website_analyzer import WebsiteAnalyzer
from analyzer.token_analyzer import TokenAnalyzer
from analyzer.response_analyzer import ResponseAnalyzer
from analyzer.form_analyzer import FormAnalyzer
from analyzer.header_analyzer import HeaderAnalyzer
from analyzer.dom_analyzer import DOMAnalyzer


class TestWebsiteAnalyzer:
    """Test WebsiteAnalyzer class."""
    
    @pytest.fixture
    def analyzer(self):
        """Create analyzer instance."""
        return WebsiteAnalyzer()
    
    @pytest.mark.asyncio
    async def test_analyze_valid_url(self, analyzer):
        """Test analyzing a valid URL."""
        result = await analyzer.analyze("https://example.com")
        assert 'url' in result
        assert 'forms' in result
    
    @pytest.mark.asyncio
    async def test_find_login_page(self, analyzer):
        """Test finding login page."""
        login_url = await analyzer._find_login_page("https://example.com")
        assert login_url is None or isinstance(login_url, str)
    
    def test_analyzer_initialization(self, analyzer):
        """Test analyzer initialization."""
        assert analyzer is not None
        assert hasattr(analyzer, 'logger')


class TestTokenAnalyzer:
    """Test TokenAnalyzer class."""
    
    @pytest.fixture
    def analyzer(self):
        """Create token analyzer."""
        return TokenAnalyzer()
    
    def test_analyze_response(self, analyzer):
        """Test response analysis."""
        response = {
            'headers': {'Authorization': 'Bearer test123'},
            'body': '{"token": "abc123"}'
        }
        result = analyzer.analyze_response(response)
        assert 'bearer_tokens' in result
        assert 'jwt_tokens' in result
    
    def test_decode_jwt(self, analyzer):
        """Test JWT decoding."""
        # Valid JWT would be tested here
        result = analyzer.decode_jwt("invalid.token.here")
        assert result is None


class TestResponseAnalyzer:
    """Test ResponseAnalyzer class."""
    
    @pytest.fixture
    def analyzer(self):
        """Create response analyzer."""
        return ResponseAnalyzer()
    
    def test_analyze_success_response(self, analyzer):
        """Test analyzing successful response."""
        response = {
            'status': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': '{"success": true}'
        }
        result = analyzer.analyze(response)
        assert result['success'] == True
        assert result['has_json'] == True


class TestFormAnalyzer:
    """Test FormAnalyzer class."""
    
    @pytest.fixture
    def analyzer(self):
        """Create form analyzer."""
        return FormAnalyzer()
    
    def test_analyze_form(self, analyzer):
        """Test form analysis."""
        html = '''
        <form action="/login" method="POST">
            <input type="email" name="email" required>
            <input type="password" name="password" required>
            <button type="submit">Login</button>
        </form>
        '''
        forms = analyzer.analyze_form(html)
        assert len(forms) == 1
        assert forms[0]['is_login_form'] == True


class TestHeaderAnalyzer:
    """Test HeaderAnalyzer class."""
    
    @pytest.fixture
    def analyzer(self):
        """Create header analyzer."""
        return HeaderAnalyzer()
    
    def test_analyze_headers(self, analyzer):
        """Test header analysis."""
        headers = {
            'X-Frame-Options': 'DENY',
            'X-Custom-Header': 'value',
            'Authorization': 'Bearer token'
        }
        result = analyzer.analyze(headers)
        assert 'security_headers' in result
        assert 'custom_headers' in result


class TestDOMAnalyzer:
    """Test DOMAnalyzer class."""
    
    @pytest.fixture
    def analyzer(self):
        """Create DOM analyzer."""
        return DOMAnalyzer()
    
    def test_analyze_dom(self, analyzer):
        """Test DOM analysis."""
        html = '''
        <html>
        <script>
        fetch('/api/user').then(r => r.json());
        </script>
        </html>
        '''
        result = analyzer.analyze(html)
        assert 'scripts' in result
        assert 'api_calls' in result


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
