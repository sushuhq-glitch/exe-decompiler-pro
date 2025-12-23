"""
Keyword Generator Module
Generates random keywords for different languages.
"""

import random
import string
from typing import List, Set


class KeywordGenerator:
    """
    Generates random keywords for different languages.
    """
    
    LANGUAGES = {
        "IT": {
            "name": "Italiano",
            "consonants": "bcdfglmnpqrstvz",
            "vowels": "aeiou",
            "common_patterns": ["CV", "CVC", "VCV", "CVCV", "VCVC"]
        },
        "DE": {
            "name": "Deutsch",
            "consonants": "bcdfghjklmnpqrstvwxz",
            "vowels": "aeiou",
            "common_patterns": ["CVC", "CVCC", "CCVC", "CVCVC"]
        },
        "MX": {
            "name": "Español (México)",
            "consonants": "bcdfghjklmnpqrstvz",
            "vowels": "aeiou",
            "common_patterns": ["CV", "CVC", "CVCV", "VCVC"]
        },
        "TW": {
            "name": "中文 (Taiwan)",
            "consonants": "bcdfghjklmnpqrstvwxyz",
            "vowels": "aeiou",
            "common_patterns": ["CV", "CVC", "VC"]
        },
        "AT": {
            "name": "Deutsch (Österreich)",
            "consonants": "bcdfghjklmnpqrstvwxz",
            "vowels": "aeiouy",
            "common_patterns": ["CVC", "CVCC", "CCVC", "CVCVC"]
        }
    }
    
    def __init__(self):
        """Initialize the keyword generator."""
        pass
    
    def generate(self, language: str, count: int, remove_duplicates: bool = True) -> List[str]:
        """
        Generate keywords for the specified language.
        
        Args:
            language: Language code (IT, DE, MX, TW, AT)
            count: Number of keywords to generate
            remove_duplicates: Remove duplicate keywords
            
        Returns:
            List of generated keywords
        """
        if language not in self.LANGUAGES:
            raise ValueError(f"Unsupported language: {language}")
        
        lang_data = self.LANGUAGES[language]
        keywords: Set[str] if remove_duplicates else List[str] = set() if remove_duplicates else []
        
        consonants = lang_data["consonants"]
        vowels = lang_data["vowels"]
        patterns = lang_data["common_patterns"]
        
        target_count = count * 2 if remove_duplicates else count
        
        while (len(keywords) if remove_duplicates else len(keywords)) < count:
            # Choose random pattern
            pattern = random.choice(patterns)
            
            # Generate keyword based on pattern
            keyword = ""
            for char in pattern:
                if char == "C":
                    keyword += random.choice(consonants)
                elif char == "V":
                    keyword += random.choice(vowels)
            
            # Add random suffix (numbers)
            if random.random() < 0.3:  # 30% chance of adding numbers
                keyword += str(random.randint(0, 999))
            
            # Capitalize sometimes
            if random.random() < 0.2:  # 20% chance of capitalization
                keyword = keyword.capitalize()
            
            if remove_duplicates:
                keywords.add(keyword)
            else:
                keywords.append(keyword)
        
        # Convert set to list if needed
        result = list(keywords) if remove_duplicates else keywords
        return result[:count]
    
    def save_to_file(self, keywords: List[str], filename: str, format: str = "txt") -> str:
        """
        Save keywords to file.
        
        Args:
            keywords: List of keywords to save
            filename: Output filename (without extension)
            format: Output format (txt or csv)
            
        Returns:
            Full path to saved file
        """
        if format.lower() == "csv":
            filepath = f"{filename}.csv"
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write("keyword\n")  # CSV header
                for keyword in keywords:
                    f.write(f"{keyword}\n")
        else:
            filepath = f"{filename}.txt"
            with open(filepath, 'w', encoding='utf-8') as f:
                for keyword in keywords:
                    f.write(f"{keyword}\n")
        
        return filepath
    
    def get_statistics(self, keywords: List[str]) -> dict:
        """
        Get statistics about generated keywords.
        
        Args:
            keywords: List of keywords
            
        Returns:
            Dictionary with statistics
        """
        total = len(keywords)
        avg_length = sum(len(k) for k in keywords) / total if total > 0 else 0
        min_length = min(len(k) for k in keywords) if total > 0 else 0
        max_length = max(len(k) for k in keywords) if total > 0 else 0
        
        return {
            "total": total,
            "avg_length": round(avg_length, 2),
            "min_length": min_length,
            "max_length": max_length,
            "unique": len(set(keywords))
        }
