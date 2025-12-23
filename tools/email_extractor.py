"""
Email Extractor Module
Extracts valid email addresses from text or files.
"""

import re
from typing import List, Set


class EmailExtractor:
    """
    Extracts and validates email addresses.
    """
    
    # RFC 5322 compliant email regex (simplified)
    EMAIL_PATTERN = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    
    def __init__(self):
        """Initialize the email extractor."""
        self.pattern = re.compile(self.EMAIL_PATTERN)
    
    def extract_from_text(self, text: str, unique_only: bool = True) -> List[str]:
        """
        Extract emails from text.
        
        Args:
            text: Text to extract emails from
            unique_only: Return only unique emails
            
        Returns:
            List of extracted emails
        """
        emails = self.pattern.findall(text)
        
        if unique_only:
            # Preserve order while removing duplicates
            seen: Set[str] = set()
            unique_emails: List[str] = []
            for email in emails:
                email_lower = email.lower()
                if email_lower not in seen:
                    seen.add(email_lower)
                    unique_emails.append(email)
            return unique_emails
        
        return emails
    
    def extract_from_file(self, filepath: str, unique_only: bool = True) -> List[str]:
        """
        Extract emails from a file.
        
        Args:
            filepath: Path to the input file
            unique_only: Return only unique emails
            
        Returns:
            List of extracted emails
        """
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
        
        return self.extract_from_text(text, unique_only)
    
    def save_to_file(self, emails: List[str], filename: str) -> str:
        """
        Save emails to file.
        
        Args:
            emails: List of emails to save
            filename: Output filename
            
        Returns:
            Path to saved file
        """
        with open(filename, 'w', encoding='utf-8') as f:
            for email in emails:
                f.write(f"{email}\n")
        
        return filename
    
    def validate_email(self, email: str) -> bool:
        """
        Validate a single email address.
        
        Args:
            email: Email address to validate
            
        Returns:
            True if valid, False otherwise
        """
        return bool(self.pattern.match(email))
    
    def get_statistics(self, emails: List[str]) -> dict:
        """
        Get statistics about extracted emails.
        
        Args:
            emails: List of extracted emails
            
        Returns:
            Dictionary with statistics
        """
        domains = {}
        for email in emails:
            domain = email.split('@')[1] if '@' in email else 'unknown'
            domains[domain] = domains.get(domain, 0) + 1
        
        return {
            "total_emails": len(emails),
            "unique_emails": len(set(email.lower() for email in emails)),
            "unique_domains": len(domains),
            "top_domains": sorted(domains.items(), key=lambda x: x[1], reverse=True)[:5]
        }
