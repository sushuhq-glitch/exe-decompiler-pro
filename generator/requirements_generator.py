"""Requirements.txt Generator"""

class RequirementsGenerator:
    """Generates requirements.txt for checkers."""
    
    def generate(self, features: dict = None) -> str:
        """Generate requirements based on features."""
        base_requirements = [
            "requests>=2.31.0",
            "colorama>=0.4.6",
            "tqdm>=4.66.1"
        ]
        
        optional_requirements = []
        
        if features:
            if features.get('proxy_support'):
                optional_requirements.append("pysocks>=1.7.1")
            if features.get('async_support'):
                optional_requirements.append("aiohttp>=3.9.0")
            if features.get('advanced_parsing'):
                optional_requirements.append("beautifulsoup4>=4.12.0")
        
        all_requirements = base_requirements + optional_requirements
        return "\\n".join(all_requirements)

__all__ = ['RequirementsGenerator']
