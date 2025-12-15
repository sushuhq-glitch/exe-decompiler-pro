"""Test suite for discovery module"""
import pytest
from discovery.api_discovery import APIDiscovery
from discovery.profile_discovery import ProfileDiscovery
from discovery.payment_discovery import PaymentDiscovery

class TestAPIDiscovery:
    @pytest.fixture
    def discovery(self):
        return APIDiscovery()
    
    @pytest.mark.asyncio
    async def test_discover_endpoints(self, discovery):
        endpoints = await discovery.discover_endpoints("https://example.com", {}, [])
        assert isinstance(endpoints, list)

class TestProfileDiscovery:
    @pytest.fixture
    def discovery(self):
        return ProfileDiscovery()
    
    @pytest.mark.asyncio
    async def test_discover(self, discovery):
        endpoints = await discovery.discover("https://example.com", {})
        assert isinstance(endpoints, list)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
