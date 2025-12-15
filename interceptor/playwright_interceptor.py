"""Playwright-based Network Interceptor"""
try:
    from playwright.async_api import async_playwright, Page
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    async_playwright = None
    Page = None
    print("⚠️  Playwright not available. Install with: pip install playwright && playwright install chromium")

import logging

class PlaywrightInterceptor:
    """Playwright-based network interception."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.requests = []
        self.responses = []
    
    async def setup(self, page: Page):
        """Setup network interception."""
        page.on("request", self._on_request)
        page.on("response", self._on_response)
        self.logger.info("Playwright interceptor setup complete")
    
    async def _on_request(self, request):
        """Handle request event."""
        self.requests.append({
            "method": request.method,
            "url": request.url,
            "headers": request.headers,
            "post_data": request.post_data
        })
    
    async def _on_response(self, response):
        """Handle response event."""
        try:
            body = await response.text()
        except:
            body = ""
        
        self.responses.append({
            "status": response.status,
            "url": response.url,
            "headers": response.headers,
            "body": body
        })
