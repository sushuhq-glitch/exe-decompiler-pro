"""Browser Automation Controller"""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import logging

class BrowserController:
    """Controls browser automation."""
    
    def __init__(self, headless: bool = True):
        self.logger = logging.getLogger(__name__)
        self.headless = headless
        self.driver = None
    
    def start(self):
        """Start browser."""
        options = Options()
        if self.headless:
            options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        
        self.driver = webdriver.Chrome(options=options)
        self.logger.info("Browser started")
    
    def navigate(self, url: str):
        """Navigate to URL."""
        self.driver.get(url)
        self.logger.info(f"Navigated to {url}")
    
    def wait_for_element(self, selector: str, timeout: int = 10):
        """Wait for element to be present."""
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
    
    def fill_form(self, email: str, password: str):
        """Fill login form."""
        # Find email field
        email_selectors = [
            'input[type="email"]',
            'input[name*="email"]',
            'input[name*="user"]',
            'input[id*="email"]'
        ]
        
        for selector in email_selectors:
            try:
                elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                elem.send_keys(email)
                break
            except:
                continue
        
        # Find password field
        password_selectors = [
            'input[type="password"]',
            'input[name*="pass"]',
            'input[id*="pass"]'
        ]
        
        for selector in password_selectors:
            try:
                elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                elem.send_keys(password)
                break
            except:
                continue
    
    def submit_form(self):
        """Submit the form."""
        submit_selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:contains("Login")',
            'button:contains("Sign in")'
        ]
        
        for selector in submit_selectors:
            try:
                elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                elem.click()
                return
            except:
                continue
    
    def get_cookies(self):
        """Get all cookies."""
        return self.driver.get_cookies()
    
    def get_page_source(self):
        """Get page HTML source."""
        return self.driver.page_source
    
    def screenshot(self, path: str):
        """Take screenshot."""
        self.driver.save_screenshot(path)
    
    def stop(self):
        """Stop browser."""
        if self.driver:
            self.driver.quit()
            self.logger.info("Browser stopped")

    async def navigate_and_wait(self, url: str, wait_condition: str = "networkidle") -> bool:
        """
        Navigate to URL and wait for specific condition.
        
        Args:
            url: Target URL
            wait_condition: Wait condition (networkidle, load, domcontentloaded)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            if self.driver:
                self.driver.get(url)
                
                # Wait based on condition
                if wait_condition == "networkidle":
                    await asyncio.sleep(2)  # Wait for network to be idle
                elif wait_condition == "domcontentloaded":
                    WebDriverWait(self.driver, 10).until(
                        lambda d: d.execute_script("return document.readyState") == "complete"
                    )
                
                return True
        except Exception as e:
            self.logger.error(f"Navigation failed: {e}")
        
        return False
    
    async def execute_script_async(self, script: str, *args) -> Any:
        """
        Execute JavaScript asynchronously.
        
        Args:
            script: JavaScript code
            *args: Arguments to pass to script
        
        Returns:
            Script return value
        """
        if not self.driver:
            return None
        
        try:
            return self.driver.execute_script(script, *args)
        except Exception as e:
            self.logger.error(f"Script execution failed: {e}")
            return None
    
    async def get_local_storage(self) -> Dict[str, Any]:
        """
        Get all localStorage items.
        
        Returns:
            Dictionary of localStorage items
        """
        if not self.driver:
            return {}
        
        try:
            script = """
            var items = {};
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                items[key] = localStorage.getItem(key);
            }
            return items;
            """
            return self.driver.execute_script(script) or {}
        except Exception as e:
            self.logger.error(f"Failed to get localStorage: {e}")
            return {}
    
    async def get_session_storage(self) -> Dict[str, Any]:
        """
        Get all sessionStorage items.
        
        Returns:
            Dictionary of sessionStorage items
        """
        if not self.driver:
            return {}
        
        try:
            script = """
            var items = {};
            for (var i = 0; i < sessionStorage.length; i++) {
                var key = sessionStorage.key(i);
                items[key] = sessionStorage.getItem(key);
            }
            return items;
            """
            return self.driver.execute_script(script) or {}
        except Exception as e:
            self.logger.error(f"Failed to get sessionStorage: {e}")
            return {}
    
    async def inject_intercept_script(self) -> bool:
        """
        Inject network intercept script into page.
        
        Returns:
            True if successful, False otherwise
        """
        if not self.driver:
            return False
        
        script = """
        (function() {
            window.__interceptedRequests = [];
            window.__interceptedResponses = [];
            
            // Intercept fetch
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                const [url, options] = args;
                window.__interceptedRequests.push({
                    type: 'fetch',
                    url: url,
                    options: options,
                    timestamp: Date.now()
                });
                
                return originalFetch.apply(this, args).then(response => {
                    response.clone().json().then(data => {
                        window.__interceptedResponses.push({
                            type: 'fetch',
                            url: url,
                            status: response.status,
                            data: data,
                            timestamp: Date.now()
                        });
                    }).catch(() => {});
                    return response;
                });
            };
            
            // Intercept XMLHttpRequest
            const originalXHR = window.XMLHttpRequest.prototype.open;
            window.XMLHttpRequest.prototype.open = function(method, url) {
                this.__interceptedRequest = {
                    type: 'xhr',
                    method: method,
                    url: url,
                    timestamp: Date.now()
                };
                window.__interceptedRequests.push(this.__interceptedRequest);
                return originalXHR.apply(this, arguments);
            };
        })();
        """
        
        try:
            self.driver.execute_script(script)
            self.logger.info("✅ Network intercept script injected")
            return True
        except Exception as e:
            self.logger.error(f"Failed to inject intercept script: {e}")
            return False
    
    async def get_intercepted_requests(self) -> List[Dict[str, Any]]:
        """
        Get intercepted network requests.
        
        Returns:
            List of intercepted requests
        """
        if not self.driver:
            return []
        
        try:
            script = "return window.__interceptedRequests || [];"
            return self.driver.execute_script(script)
        except Exception:
            return []
    
    async def get_intercepted_responses(self) -> List[Dict[str, Any]]:
        """
        Get intercepted network responses.
        
        Returns:
            List of intercepted responses
        """
        if not self.driver:
            return []
        
        try:
            script = "return window.__interceptedResponses || [];"
            return self.driver.execute_script(script)
        except Exception:
            return []
