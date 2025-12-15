#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Form Detector - Advanced Form Detection Module
==============================================

This module detects login forms in web pages, including:
- Classic HTML forms (<form> tags)
- JavaScript-based forms (React, Vue, Angular, etc.)
- Email and password field detection
- CSRF token extraction
- Submit button identification

Author: Telegram API Checker Bot Team
Version: 2.0.0
"""

import asyncio
import logging
import time
from typing import Dict, List, Any, Optional, Tuple
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Tag
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager

logger = logging.getLogger(__name__)


class FormDetector:
    """
    Advanced form detector for login pages.
    
    Detects both HTML and JavaScript-based forms using Selenium and BeautifulSoup.
    """
    
    def __init__(self, headless: bool = True, timeout: int = 30):
        """
        Initialize the form detector.
        
        Args:
            headless: Run browser in headless mode
            timeout: Maximum wait time for elements
        """
        self.headless = headless
        self.timeout = timeout
        self.driver: Optional[webdriver.Chrome] = None
        self.wait: Optional[WebDriverWait] = None
    
    def _setup_driver(self) -> webdriver.Chrome:
        """
        Setup Chrome WebDriver with optimal configuration.
        
        Returns:
            Configured Chrome WebDriver instance
        """
        try:
            chrome_options = Options()
            
            if self.headless:
                chrome_options.add_argument('--headless')
                chrome_options.add_argument('--no-sandbox')
                chrome_options.add_argument('--disable-dev-shm-usage')
            
            # Performance optimizations
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--disable-extensions')
            chrome_options.add_argument('--disable-infobars')
            chrome_options.add_argument('--disable-notifications')
            chrome_options.add_argument('--disable-popup-blocking')
            
            # Stealth mode
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option('excludeSwitches', ['enable-automation'])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            # User agent
            chrome_options.add_argument(
                'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/120.0.0.0 Safari/537.36'
            )
            
            # Set page load timeout
            chrome_options.page_load_strategy = 'normal'
            
            # Enable logging for network interception
            chrome_options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
            
            # Install and setup driver
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Set timeouts
            driver.set_page_load_timeout(self.timeout)
            driver.implicitly_wait(5)
            
            logger.info("Chrome WebDriver setup successfully")
            return driver
            
        except Exception as e:
            logger.error(f"Failed to setup Chrome driver: {e}")
            raise
    
    def find_login_forms(self, url: str) -> List[Dict[str, Any]]:
        """
        Find ALL login forms in a page (HTML + JavaScript-based).
        
        Args:
            url: URL to analyze
            
        Returns:
            List of detected login forms with their details
        """
        login_forms = []
        
        try:
            # Setup driver if not already done
            if not self.driver:
                self.driver = self._setup_driver()
                self.wait = WebDriverWait(self.driver, self.timeout)
            
            logger.info(f"Loading page: {url}")
            self.driver.get(url)
            
            # Wait for page to load and JavaScript to render
            time.sleep(3)  # Wait for React/Vue/Angular rendering
            
            # Method 1: Find HTML forms
            html_forms = self._find_html_forms(url)
            login_forms.extend(html_forms)
            
            # Method 2: Find JavaScript-based forms
            js_forms = self._find_javascript_forms()
            login_forms.extend(js_forms)
            
            logger.info(f"Found {len(login_forms)} login form(s)")
            
        except TimeoutException:
            logger.error(f"Timeout loading page: {url}")
        except WebDriverException as e:
            logger.error(f"WebDriver error: {e}")
        except Exception as e:
            logger.exception(f"Unexpected error finding forms: {e}")
        
        return login_forms
    
    def _find_html_forms(self, base_url: str) -> List[Dict[str, Any]]:
        """
        Find classic HTML forms using BeautifulSoup.
        
        Args:
            base_url: Base URL for resolving relative URLs
            
        Returns:
            List of HTML login forms
        """
        html_forms = []
        
        try:
            html = self.driver.page_source
            soup = BeautifulSoup(html, 'html.parser')
            forms = soup.find_all('form')
            
            logger.info(f"Found {len(forms)} HTML form(s)")
            
            for idx, form in enumerate(forms):
                if self._has_email_and_password(form):
                    form_data = self._parse_html_form(form, idx, base_url)
                    html_forms.append(form_data)
                    logger.info(f"HTML form {idx} is a login form")
        
        except Exception as e:
            logger.error(f"Error parsing HTML forms: {e}")
        
        return html_forms
    
    def _find_javascript_forms(self) -> List[Dict[str, Any]]:
        """
        Find JavaScript-based forms (React, Vue, Angular, etc.).
        
        Returns:
            List of JavaScript login forms
        """
        js_forms = []
        
        try:
            # Try to find email and password inputs that are NOT in a <form> tag
            email_inputs = self._find_email_inputs()
            password_inputs = self._find_password_inputs()
            
            if email_inputs and password_inputs:
                # Found login inputs outside of traditional forms
                logger.info("Found JavaScript-based login form")
                
                # Find submit button
                submit_button = self._find_submit_button()
                
                form_data = {
                    'type': 'javascript',
                    'email_selector': self._get_best_selector(email_inputs[0]),
                    'password_selector': self._get_best_selector(password_inputs[0]),
                    'submit_selector': self._get_best_selector(submit_button) if submit_button else None,
                    'email_element': email_inputs[0],
                    'password_element': password_inputs[0],
                    'submit_element': submit_button,
                    'is_js_form': True,
                    'csrf_token': self._extract_csrf_token()
                }
                
                js_forms.append(form_data)
        
        except Exception as e:
            logger.error(f"Error finding JavaScript forms: {e}")
        
        return js_forms
    
    def _has_email_and_password(self, form: Tag) -> bool:
        """
        Check if form has both email and password fields.
        
        Args:
            form: BeautifulSoup form element
            
        Returns:
            True if form has both email and password fields
        """
        inputs = form.find_all('input')
        
        has_password = any(
            inp.get('type') == 'password'
            for inp in inputs
        )
        
        has_email = any(
            inp.get('type') in ['email', 'text'] and
            any(keyword in str(inp.get('name', '') + inp.get('id', '') + inp.get('placeholder', '')).lower()
                for keyword in ['email', 'e-mail', 'user', 'username', 'login'])
            for inp in inputs
        )
        
        return has_password and has_email
    
    def _parse_html_form(self, form: Tag, index: int, base_url: str) -> Dict[str, Any]:
        """
        Parse HTML form and extract relevant information.
        
        Args:
            form: BeautifulSoup form element
            index: Form index
            base_url: Base URL for resolving relative URLs
            
        Returns:
            Form data dictionary
        """
        form_data = {
            'type': 'html',
            'index': index,
            'action': urljoin(base_url, form.get('action', base_url)),
            'method': form.get('method', 'POST').upper(),
            'is_js_form': False
        }
        
        # Extract fields
        inputs = form.find_all('input')
        
        # Find email field
        for inp in inputs:
            if inp.get('type') in ['email', 'text']:
                name_id_placeholder = (str(inp.get('name', '')) + 
                                      str(inp.get('id', '')) + 
                                      str(inp.get('placeholder', ''))).lower()
                if any(keyword in name_id_placeholder for keyword in ['email', 'e-mail', 'user', 'username', 'login']):
                    form_data['email_field'] = {
                        'name': inp.get('name', ''),
                        'id': inp.get('id', ''),
                        'type': inp.get('type', 'text'),
                        'selector': self._create_selector(inp)
                    }
                    break
        
        # Find password field
        for inp in inputs:
            if inp.get('type') == 'password':
                form_data['password_field'] = {
                    'name': inp.get('name', ''),
                    'id': inp.get('id', ''),
                    'type': 'password',
                    'selector': self._create_selector(inp)
                }
                break
        
        # Find submit button
        submit = form.find(['button', 'input'], type='submit')
        if submit:
            form_data['submit_button'] = {
                'type': submit.name,
                'text': submit.get_text(strip=True) or submit.get('value', 'Submit'),
                'selector': self._create_selector(submit)
            }
        
        # Extract CSRF token
        csrf_input = form.find('input', attrs={'name': lambda x: x and 'csrf' in x.lower()})
        if csrf_input:
            form_data['csrf_token'] = {
                'name': csrf_input.get('name', ''),
                'value': csrf_input.get('value', '')
            }
        
        return form_data
    
    def _create_selector(self, element: Tag) -> str:
        """
        Create a CSS selector for an element.
        
        Args:
            element: BeautifulSoup element
            
        Returns:
            CSS selector string
        """
        # Prefer ID
        if element.get('id'):
            return f"#{element['id']}"
        
        # Then name
        if element.get('name'):
            return f"{element.name}[name='{element['name']}']"
        
        # Then type
        if element.get('type'):
            return f"{element.name}[type='{element['type']}']"
        
        # Fallback to tag name
        return element.name
    
    def _find_email_inputs(self) -> List[Any]:
        """
        Find email input fields using Selenium.
        
        Returns:
            List of email input elements
        """
        email_selectors = [
            "input[type='email']",
            "input[name*='email' i]",
            "input[id*='email' i]",
            "input[placeholder*='email' i]",
            "input[name*='user' i]",
            "input[id*='user' i]",
            "input[name*='login' i]",
            "input[id*='login' i]"
        ]
        
        for selector in email_selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    return elements
            except Exception:
                continue
        
        return []
    
    def _find_password_inputs(self) -> List[Any]:
        """
        Find password input fields using Selenium.
        
        Returns:
            List of password input elements
        """
        try:
            return self.driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
        except Exception:
            return []
    
    def _find_submit_button(self) -> Optional[Any]:
        """
        Find submit button using Selenium.
        
        Returns:
            Submit button element or None
        """
        button_selectors = [
            "button[type='submit']",
            "input[type='submit']",
            "button:contains('sign in')",
            "button:contains('login')",
            "button:contains('log in')",
            "button"
        ]
        
        for selector in button_selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    # Return the first visible button
                    for btn in elements:
                        if btn.is_displayed():
                            return btn
            except Exception:
                continue
        
        return None
    
    def _get_best_selector(self, element: Any) -> str:
        """
        Get the best CSS selector for a Selenium element.
        
        Args:
            element: Selenium WebElement
            
        Returns:
            CSS selector string
        """
        try:
            # Try ID first
            element_id = element.get_attribute('id')
            if element_id:
                return f"#{element_id}"
            
            # Try name
            name = element.get_attribute('name')
            if name:
                return f"input[name='{name}']"
            
            # Try type
            element_type = element.get_attribute('type')
            if element_type:
                return f"input[type='{element_type}']"
            
            # Fallback to tag name
            return element.tag_name
        
        except Exception:
            return "input"
    
    def _extract_csrf_token(self) -> Optional[Dict[str, str]]:
        """
        Extract CSRF token from page.
        
        Returns:
            CSRF token info or None
        """
        csrf_selectors = [
            "input[name*='csrf' i]",
            "input[name*='token' i]",
            "meta[name='csrf-token']",
            "meta[name='_token']"
        ]
        
        for selector in csrf_selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    elem = elements[0]
                    return {
                        'name': elem.get_attribute('name') or 'csrf_token',
                        'value': elem.get_attribute('value') or elem.get_attribute('content')
                    }
            except Exception:
                continue
        
        return None
    
    def close(self) -> None:
        """Close the browser driver."""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("Chrome WebDriver closed")
            except Exception as e:
                logger.error(f"Error closing driver: {e}")
            finally:
                self.driver = None
                self.wait = None
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()


# Export
__all__ = ['FormDetector']
