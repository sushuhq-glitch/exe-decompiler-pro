"""Form Analyzer"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup

class FormAnalyzer:
    """Analyzes HTML forms."""
    
    def analyze_form(self, html: str) -> List[Dict[str, Any]]:
        """Analyze forms in HTML."""
        forms = []
        soup = BeautifulSoup(html, "html.parser")
        
        for form in soup.find_all("form"):
            form_data = {
                "action": form.get("action", ""),
                "method": form.get("method", "POST").upper(),
                "fields": self._extract_fields(form),
                "buttons": self._extract_buttons(form),
                "is_login_form": self._is_login_form(form)
            }
            forms.append(form_data)
        
        return forms
    
    def _extract_fields(self, form) -> List[Dict]:
        """Extract form fields."""
        fields = []
        for input_tag in form.find_all("input"):
            field = {
                "name": input_tag.get("name", ""),
                "type": input_tag.get("type", "text"),
                "value": input_tag.get("value", ""),
                "placeholder": input_tag.get("placeholder", ""),
                "required": input_tag.has_attr("required")
            }
            fields.append(field)
        return fields
    
    def _extract_buttons(self, form) -> List[Dict]:
        """Extract form buttons."""
        buttons = []
        for button in form.find_all(["button", "input"]):
            if button.name == "input" and button.get("type") not in ["submit", "button"]:
                continue
            buttons.append({
                "type": button.get("type", "button"),
                "text": button.get_text(strip=True) or button.get("value", "")
            })
        return buttons
    
    def _is_login_form(self, form) -> bool:
        """Check if form is a login form."""
        # Look for password field
        has_password = any(
            inp.get("type") == "password"
            for inp in form.find_all("input")
        )
        
        # Look for email/username field
        has_user_field = any(
            inp.get("type") in ["email", "text"] and
            any(keyword in str(inp.get("name", "")).lower()
                for keyword in ["email", "user", "login", "username"])
            for inp in form.find_all("input")
        )
        
        return has_password and has_user_field
