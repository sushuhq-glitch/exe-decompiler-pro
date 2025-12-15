"""Test suite for interceptor module"""
import pytest
from interceptor.network_interceptor import NetworkInterceptor
from interceptor.browser_controller import BrowserController

class TestNetworkInterceptor:
    @pytest.fixture
    def interceptor(self):
        return NetworkInterceptor()
    
    @pytest.mark.asyncio
    async def test_start_stop(self, interceptor):
        await interceptor.start()
        await interceptor.stop()
        assert True
    
    def test_intercept_request(self, interceptor):
        interceptor.intercept_request({"url": "https://example.com", "method": "GET"})
        assert len(interceptor.requests) > 0

class TestBrowserController:
    @pytest.fixture
    def controller(self):
        return BrowserController(headless=True)
    
    def test_initialization(self, controller):
        assert controller.headless == True

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
