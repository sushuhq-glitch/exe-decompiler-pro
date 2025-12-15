'''Browser Console Injector'''
import logging

class ConsoleInjector:
    '''Injects JavaScript into browser console.'''
    
    def __init__(self, driver):
        self.driver = driver
        self.logger = logging.getLogger(__name__)
    
    def inject_script(self, script: str):
        '''Inject JavaScript code.'''
        try:
            return self.driver.execute_script(script)
        except Exception as e:
            self.logger.error(f"Script injection failed: {e}")
            return None
    
    def capture_api_calls(self):
        '''Inject script to capture API calls.'''
        script = '''
        window.apiCalls = [];
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            window.apiCalls.push({
                url: args[0],
                options: args[1],
                timestamp: Date.now()
            });
            return originalFetch.apply(this, args);
        };
        '''
        self.inject_script(script)
    
    def get_captured_calls(self):
        '''Get captured API calls.'''
        script = 'return window.apiCalls || [];'
        return self.inject_script(script)
