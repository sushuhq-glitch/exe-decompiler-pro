#!/usr/bin/env python3
"""
Password Analyzer Module - Advanced Password Security Analysis.

This module provides comprehensive password strength analysis with
15+ security checks including length, character diversity, patterns,
entropy, and common weaknesses.

Classes:
    PasswordAnalyzer: Main password analysis engine.
    PasswordScore: Password strength score calculator.
    PatternDetector: Common pattern detection.

Example:
    >>> from core.password_analyzer import PasswordAnalyzer
    >>> analyzer = PasswordAnalyzer()
    >>> score = analyzer.calculate_score("MyP@ssw0rd123")
    >>> is_strong = analyzer.is_strong_password("MyP@ssw0rd123")
"""

import re
import math
from typing import Dict, List, Optional, Tuple, Set
from dataclasses import dataclass
from collections import Counter


@dataclass
class PasswordAnalysis:
    """
    Detailed password analysis results.
    
    Attributes:
        password: The analyzed password.
        score: Overall score (0-100).
        strength: Strength category (weak/medium/strong).
        passed_checks: List of passed checks.
        failed_checks: List of failed checks.
        warnings: List of warnings.
        entropy: Shannon entropy value.
        recommendations: List of improvement recommendations.
    """
    password: str
    score: int
    strength: str
    passed_checks: List[str]
    failed_checks: List[str]
    warnings: List[str]
    entropy: float
    recommendations: List[str]


class PatternDetector:
    """
    Common pattern detection in passwords.
    
    This class detects common weak patterns like sequential characters,
    repeated patterns, keyboard patterns, and common substitutions.
    
    Example:
        >>> detector = PatternDetector()
        >>> detector.has_sequential("abc123")
        True
        >>> detector.has_repeated_chars("aaa111")
        True
    """
    
    # Common patterns
    SEQUENTIAL_PATTERNS = [
        'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk', 'jkl',
        'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs', 'rst', 'stu', 'tuv',
        'uvw', 'vwx', 'wxy', 'xyz', '123', '234', '345', '456', '567', '678',
        '789', '890', '012'
    ]
    
    KEYBOARD_PATTERNS = [
        'qwerty', 'asdfgh', 'zxcvbn', 'qwertz', 'azerty',
        '1qaz', '2wsx', '3edc', '4rfv', '5tgb', '6yhn', '7ujm', '8ik',
        'qazwsx', 'wsxedc', 'edcrfv', 'rfvtgb', 'tgbyhn', 'yhnujm'
    ]
    
    COMMON_SUBSTITUTIONS = {
        'a': ['@', '4'],
        'e': ['3'],
        'i': ['1', '!'],
        'o': ['0'],
        's': ['5', '$'],
        't': ['7'],
        'l': ['1'],
        'g': ['9'],
        'b': ['8']
    }
    
    def __init__(self):
        """Initialize pattern detector."""
        self.sequential_regex = re.compile(r'(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)', re.IGNORECASE)
        self.repeated_regex = re.compile(r'(.)\1{2,}')
        self.date_regex = re.compile(r'\b(19|20)\d{2}\b')
    
    def has_sequential(self, password: str) -> bool:
        """
        Check for sequential character patterns.
        
        Args:
            password: Password to check.
            
        Returns:
            True if sequential patterns found.
        """
        password_lower = password.lower()
        
        # Check predefined sequential patterns
        for pattern in self.SEQUENTIAL_PATTERNS:
            if pattern in password_lower:
                return True
        
        # Check using regex
        if self.sequential_regex.search(password):
            return True
        
        return False
    
    def has_repeated_chars(self, password: str, threshold: int = 3) -> bool:
        """
        Check for repeated characters.
        
        Args:
            password: Password to check.
            threshold: Minimum repetitions to flag.
            
        Returns:
            True if repeated characters found.
        """
        return bool(self.repeated_regex.search(password))
    
    def has_keyboard_pattern(self, password: str) -> bool:
        """
        Check for keyboard patterns.
        
        Args:
            password: Password to check.
            
        Returns:
            True if keyboard patterns found.
        """
        password_lower = password.lower()
        
        for pattern in self.KEYBOARD_PATTERNS:
            if pattern in password_lower:
                return True
        
        return False
    
    def has_common_substitutions(self, password: str) -> bool:
        """
        Check for common character substitutions.
        
        Args:
            password: Password to check.
            
        Returns:
            True if common substitutions detected.
        """
        substitution_count = 0
        
        for char, substitutes in self.COMMON_SUBSTITUTIONS.items():
            for sub in substitutes:
                if sub in password:
                    substitution_count += 1
        
        # More than 2 substitutions is suspicious
        return substitution_count > 2
    
    def has_date_pattern(self, password: str) -> bool:
        """
        Check for date patterns.
        
        Args:
            password: Password to check.
            
        Returns:
            True if date patterns found.
        """
        return bool(self.date_regex.search(password))
    
    def detect_all_patterns(self, password: str) -> List[str]:
        """
        Detect all patterns in a password.
        
        Args:
            password: Password to analyze.
            
        Returns:
            List of detected pattern types.
        """
        patterns = []
        
        if self.has_sequential(password):
            patterns.append("sequential")
        
        if self.has_repeated_chars(password):
            patterns.append("repeated")
        
        if self.has_keyboard_pattern(password):
            patterns.append("keyboard")
        
        if self.has_common_substitutions(password):
            patterns.append("substitution")
        
        if self.has_date_pattern(password):
            patterns.append("date")
        
        return patterns


class PasswordAnalyzer:
    """
    Advanced password security analysis engine.
    
    This class provides comprehensive password strength analysis with
    15+ security checks including:
    - Length requirements
    - Character type diversity
    - Pattern detection
    - Entropy calculation
    - Vowel ratio analysis
    - Common weakness detection
    
    Example:
        >>> analyzer = PasswordAnalyzer()
        >>> is_strong = analyzer.is_strong_password("MyP@ssw0rd123!")
        >>> analysis = analyzer.analyze_password("weak")
        >>> print(analysis.score)
    """
    
    # Password requirements
    MIN_LENGTH = 8
    MAX_LENGTH = 128
    MIN_SCORE = 60
    
    # Character sets
    LOWERCASE = set('abcdefghijklmnopqrstuvwxyz')
    UPPERCASE = set('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    DIGITS = set('0123456789')
    SPECIAL = set('!@#$%^&*()_+-=[]{}|;:,.<>?')
    VOWELS = set('aeiouAEIOU')
    
    def __init__(self, min_length: int = 8, min_score: int = 60):
        """
        Initialize password analyzer.
        
        Args:
            min_length: Minimum password length.
            min_score: Minimum score for strong password.
            
        Example:
            >>> analyzer = PasswordAnalyzer(min_length=10, min_score=70)
        """
        self.min_length = min_length
        self.min_score = min_score
        self.pattern_detector = PatternDetector()
        
        # Statistics
        self.total_analyzed = 0
        self.strong_count = 0
        self.weak_count = 0
    
    def calculate_entropy(self, password: str) -> float:
        """
        Calculate Shannon entropy of a password.
        
        Args:
            password: Password to analyze.
            
        Returns:
            Shannon entropy value.
            
        Example:
            >>> analyzer = PasswordAnalyzer()
            >>> entropy = analyzer.calculate_entropy("password123")
        """
        if not password:
            return 0.0
        
        # Count character frequencies
        counter = Counter(password)
        length = len(password)
        
        # Calculate Shannon entropy
        entropy = 0.0
        for count in counter.values():
            probability = count / length
            entropy -= probability * math.log2(probability)
        
        return entropy
    
    def calculate_char_diversity(self, password: str) -> float:
        """
        Calculate character diversity ratio.
        
        Args:
            password: Password to analyze.
            
        Returns:
            Diversity ratio (0.0 to 1.0).
        """
        if not password:
            return 0.0
        
        unique_chars = len(set(password))
        total_chars = len(password)
        
        return unique_chars / total_chars
    
    def calculate_vowel_ratio(self, password: str) -> float:
        """
        Calculate vowel ratio in password.
        
        Args:
            password: Password to analyze.
            
        Returns:
            Vowel ratio (0.0 to 1.0).
        """
        if not password:
            return 0.0
        
        vowel_count = sum(1 for c in password if c in self.VOWELS)
        return vowel_count / len(password)
    
    def check_character_types(self, password: str) -> Dict[str, bool]:
        """
        Check which character types are present.
        
        Args:
            password: Password to check.
            
        Returns:
            Dictionary of character type presence.
        """
        password_set = set(password)
        
        return {
            'lowercase': bool(password_set & self.LOWERCASE),
            'uppercase': bool(password_set & self.UPPERCASE),
            'digits': bool(password_set & self.DIGITS),
            'special': bool(password_set & self.SPECIAL),
        }
    
    def calculate_score(self, password: str) -> int:
        """
        Calculate password strength score (0-100).
        
        Args:
            password: Password to score.
            
        Returns:
            Score from 0 to 100.
            
        Example:
            >>> analyzer = PasswordAnalyzer()
            >>> score = analyzer.calculate_score("MyP@ssw0rd123!")
            >>> print(f"Score: {score}")
        """
        if not password:
            return 0
        
        score = 0
        
        # Length score (max 25 points)
        length = len(password)
        if length >= 16:
            score += 25
        elif length >= 12:
            score += 20
        elif length >= 8:
            score += 15
        elif length >= 6:
            score += 10
        else:
            score += 5
        
        # Character type diversity (max 20 points)
        char_types = self.check_character_types(password)
        type_count = sum(char_types.values())
        score += type_count * 5
        
        # Character diversity (max 15 points)
        diversity = self.calculate_char_diversity(password)
        score += int(diversity * 15)
        
        # Entropy (max 20 points)
        entropy = self.calculate_entropy(password)
        if entropy >= 4.5:
            score += 20
        elif entropy >= 4.0:
            score += 15
        elif entropy >= 3.5:
            score += 10
        elif entropy >= 3.0:
            score += 5
        
        # Pattern penalties (max -20 points)
        patterns = self.pattern_detector.detect_all_patterns(password)
        score -= len(patterns) * 4
        
        # Vowel ratio penalty (max -10 points)
        vowel_ratio = self.calculate_vowel_ratio(password)
        if vowel_ratio > 0.7:
            score -= 10
        elif vowel_ratio > 0.6:
            score -= 5
        
        # Repeated characters penalty (max -10 points)
        if self.pattern_detector.has_repeated_chars(password):
            score -= 10
        
        # Bonus for length > 16 (max +10 points)
        if length > 16:
            score += min(10, (length - 16) // 2)
        
        # Clamp score to 0-100
        return max(0, min(100, score))
    
    def is_strong_password(self, password: str) -> bool:
        """
        Check if a password is strong.
        
        Args:
            password: Password to check.
            
        Returns:
            True if password is strong.
            
        Example:
            >>> analyzer = PasswordAnalyzer()
            >>> analyzer.is_strong_password("Str0ng!P@ssw0rd")
            True
        """
        # Length check
        if len(password) < self.min_length:
            return False
        
        # Score check
        score = self.calculate_score(password)
        return score >= self.min_score
    
    def analyze_password(self, password: str) -> PasswordAnalysis:
        """
        Perform comprehensive password analysis.
        
        Args:
            password: Password to analyze.
            
        Returns:
            PasswordAnalysis object with detailed results.
            
        Example:
            >>> analyzer = PasswordAnalyzer()
            >>> analysis = analyzer.analyze_password("MyPassword123!")
            >>> print(f"Score: {analysis.score}")
            >>> print(f"Strength: {analysis.strength}")
        """
        self.total_analyzed += 1
        
        # Calculate metrics
        score = self.calculate_score(password)
        entropy = self.calculate_entropy(password)
        char_types = self.check_character_types(password)
        diversity = self.calculate_char_diversity(password)
        vowel_ratio = self.calculate_vowel_ratio(password)
        patterns = self.pattern_detector.detect_all_patterns(password)
        
        # Determine strength
        if score >= 80:
            strength = "strong"
            self.strong_count += 1
        elif score >= 60:
            strength = "medium"
        else:
            strength = "weak"
            self.weak_count += 1
        
        # Passed and failed checks
        passed_checks = []
        failed_checks = []
        warnings = []
        recommendations = []
        
        # Length check
        if len(password) >= self.min_length:
            passed_checks.append(f"Length >= {self.min_length}")
        else:
            failed_checks.append(f"Length < {self.min_length}")
            recommendations.append(f"Increase length to at least {self.min_length} characters")
        
        # Character type checks
        if char_types['lowercase']:
            passed_checks.append("Contains lowercase")
        else:
            failed_checks.append("No lowercase letters")
            recommendations.append("Add lowercase letters")
        
        if char_types['uppercase']:
            passed_checks.append("Contains uppercase")
        else:
            failed_checks.append("No uppercase letters")
            recommendations.append("Add uppercase letters")
        
        if char_types['digits']:
            passed_checks.append("Contains digits")
        else:
            failed_checks.append("No digits")
            recommendations.append("Add numbers")
        
        if char_types['special']:
            passed_checks.append("Contains special characters")
        else:
            failed_checks.append("No special characters")
            recommendations.append("Add special characters (!@#$%)")
        
        # Diversity check
        if diversity >= 0.5:
            passed_checks.append("Good character diversity")
        else:
            warnings.append("Low character diversity")
            recommendations.append("Use more unique characters")
        
        # Entropy check
        if entropy >= 3.5:
            passed_checks.append("Sufficient entropy")
        else:
            warnings.append("Low entropy")
            recommendations.append("Make password more unpredictable")
        
        # Pattern checks
        if not patterns:
            passed_checks.append("No common patterns")
        else:
            for pattern in patterns:
                warnings.append(f"Contains {pattern} pattern")
                recommendations.append(f"Avoid {pattern} patterns")
        
        # Vowel ratio check
        if vowel_ratio <= 0.7:
            passed_checks.append("Acceptable vowel ratio")
        else:
            warnings.append("High vowel ratio")
            recommendations.append("Balance vowels and consonants")
        
        return PasswordAnalysis(
            password=password,
            score=score,
            strength=strength,
            passed_checks=passed_checks,
            failed_checks=failed_checks,
            warnings=warnings,
            entropy=entropy,
            recommendations=recommendations
        )
    
    def filter_weak_passwords(self, combos: List[str],
                             separator: str = ':') -> List[str]:
        """
        Filter out weak passwords from email:password combos.
        
        Args:
            combos: List of email:password combinations.
            separator: Separator character (default ':').
            
        Returns:
            List of combos with strong passwords only.
            
        Example:
            >>> analyzer = PasswordAnalyzer()
            >>> combos = ["user@test.com:weak", "user@test.com:Str0ng!Pass"]
            >>> strong = analyzer.filter_weak_passwords(combos)
        """
        filtered = []
        
        for combo in combos:
            if separator not in combo:
                continue
            
            parts = combo.split(separator, 1)
            if len(parts) != 2:
                continue
            
            email, password = parts
            
            if self.is_strong_password(password):
                filtered.append(combo)
        
        return filtered
    
    def batch_analyze(self, passwords: List[str]) -> List[PasswordAnalysis]:
        """
        Analyze multiple passwords.
        
        Args:
            passwords: List of passwords to analyze.
            
        Returns:
            List of PasswordAnalysis objects.
            
        Example:
            >>> analyzer = PasswordAnalyzer()
            >>> results = analyzer.batch_analyze(["pass1", "pass2"])
        """
        return [self.analyze_password(pwd) for pwd in passwords]
    
    def get_statistics(self) -> Dict[str, int]:
        """
        Get analyzer statistics.
        
        Returns:
            Dictionary of statistics.
        """
        return {
            'total_analyzed': self.total_analyzed,
            'strong_count': self.strong_count,
            'weak_count': self.weak_count,
            'strong_ratio': self.strong_count / max(1, self.total_analyzed),
        }
    
    def reset_statistics(self) -> None:
        """Reset analyzer statistics."""
        self.total_analyzed = 0
        self.strong_count = 0
        self.weak_count = 0
    
    def __repr__(self) -> str:
        """String representation."""
        return (f"PasswordAnalyzer(analyzed={self.total_analyzed}, "
                f"strong={self.strong_count}, weak={self.weak_count})")
