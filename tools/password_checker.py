"""
Password Strength Checker Module
Analyzes password strength in email:password format files.
"""

import re
from typing import List, Dict, Tuple


class PasswordChecker:
    """
    Analyzes password strength and categorizes them.
    """
    
    WEAK = "WEAK"
    MEDIUM = "MEDIUM"
    STRONG = "STRONG"
    
    def __init__(self):
        """Initialize the password checker."""
        pass
    
    def check_password_strength(self, password: str) -> str:
        """
        Check the strength of a password.
        
        Args:
            password: Password to check
            
        Returns:
            Strength category (WEAK, MEDIUM, STRONG)
        """
        if len(password) < 6:
            return self.WEAK
        
        has_lower = bool(re.search(r'[a-z]', password))
        has_upper = bool(re.search(r'[A-Z]', password))
        has_digit = bool(re.search(r'\d', password))
        has_special = bool(re.search(r'[^a-zA-Z0-9]', password))
        
        # WEAK: < 6 chars, only letters or only numbers
        if len(password) < 6:
            return self.WEAK
        
        if (has_lower or has_upper) and not has_digit and not has_special:
            return self.WEAK
        
        if has_digit and not has_lower and not has_upper and not has_special:
            return self.WEAK
        
        # STRONG: > 8 chars with uppercase, lowercase, numbers, and symbols
        if len(password) > 8 and has_lower and has_upper and has_digit and has_special:
            return self.STRONG
        
        # MEDIUM: 6-8 chars with mix of letters and numbers
        if 6 <= len(password) <= 8:
            if (has_lower or has_upper) and has_digit:
                return self.MEDIUM
        
        # Default to MEDIUM for anything in between
        if len(password) > 8:
            return self.MEDIUM
        
        return self.WEAK
    
    def analyze_file(self, filepath: str, separator: str = ":") -> Dict[str, List[str]]:
        """
        Analyze a file with email:password format.
        
        Args:
            filepath: Path to the input file
            separator: Separator between email and password (default: ":")
            
        Returns:
            Dictionary with categorized passwords
        """
        results = {
            self.WEAK: [],
            self.MEDIUM: [],
            self.STRONG: []
        }
        
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                
                # Split by separator
                parts = line.split(separator)
                if len(parts) < 2:
                    continue
                
                password = parts[1] if len(parts) == 2 else separator.join(parts[1:])
                
                # Check strength
                strength = self.check_password_strength(password)
                results[strength].append(line)
        
        return results
    
    def save_results(self, results: Dict[str, List[str]], base_filename: str, 
                    separate_files: bool = True, strong_only: bool = False) -> List[str]:
        """
        Save analysis results to file(s).
        
        Args:
            results: Dictionary with categorized passwords
            base_filename: Base filename for output
            separate_files: Save to separate files per category
            strong_only: Save only strong passwords to a single file
            
        Returns:
            List of created filenames
        """
        created_files = []
        
        if strong_only:
            # Save only strong passwords
            filename = f"{base_filename}_strong.txt"
            with open(filename, 'w', encoding='utf-8') as f:
                for line in results[self.STRONG]:
                    f.write(f"{line}\n")
            created_files.append(filename)
        
        elif separate_files:
            # Save to separate files
            for category in [self.WEAK, self.MEDIUM, self.STRONG]:
                filename = f"{base_filename}_{category.lower()}.txt"
                with open(filename, 'w', encoding='utf-8') as f:
                    for line in results[category]:
                        f.write(f"{line}\n")
                created_files.append(filename)
        
        else:
            # Save all to one file with categories
            filename = f"{base_filename}_analyzed.txt"
            with open(filename, 'w', encoding='utf-8') as f:
                for category in [self.WEAK, self.MEDIUM, self.STRONG]:
                    f.write(f"=== {category} ===\n")
                    for line in results[category]:
                        f.write(f"{line}\n")
                    f.write("\n")
            created_files.append(filename)
        
        return created_files
    
    def get_statistics(self, results: Dict[str, List[str]]) -> Dict[str, int]:
        """
        Get statistics about analyzed passwords.
        
        Args:
            results: Dictionary with categorized passwords
            
        Returns:
            Dictionary with statistics
        """
        return {
            "total": sum(len(results[cat]) for cat in results),
            "weak": len(results[self.WEAK]),
            "medium": len(results[self.MEDIUM]),
            "strong": len(results[self.STRONG])
        }
