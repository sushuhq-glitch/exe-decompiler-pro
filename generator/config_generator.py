"""Config Generator"""
import json

class ConfigGenerator:
    """Generates config.json for checkers."""
    
    def generate(self, settings: dict) -> str:
        """Generate configuration JSON."""
        default_config = {
            "threads": 10,
            "timeout": 30,
            "retry_attempts": 3,
            "rate_limit_delay": 0.1,
            "use_proxy": False,
            "proxy_file": "proxies.txt",
            "output_directory": "output",
            "logging": {
                "enabled": True,
                "level": "INFO",
                "file": "checker.log"
            },
            "features": {
                "colored_output": True,
                "progress_bar": True,
                "save_stats": True
            }
        }
        
        # Merge with provided settings
        config = {**default_config, **settings}
        
        return json.dumps(config, indent=2)

__all__ = ['ConfigGenerator']
