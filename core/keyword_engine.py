#!/usr/bin/env python3
"""
Keyword Engine Module - Advanced Keyword Generation System.

This module provides the main keyword generation engine that combines
random generation, template processing, and validation to produce
high-quality keywords at scale.

Classes:
    KeywordEngine: Main keyword generation engine.
    KeywordBatch: Batch keyword generation with streaming support.
    KeywordValidator: Keyword validation and normalization.

Example:
    >>> from core.keyword_engine import KeywordEngine
    >>> from core.random_engine import RandomEngine
    >>> from core.template_engine import TemplateEngine
    >>> 
    >>> random_engine = RandomEngine()
    >>> template_engine = TemplateEngine(random_engine)
    >>> engine = KeywordEngine(random_engine, template_engine)
    >>> keywords = engine.generate_batch("IT", 1000)
"""

import time
import threading
from typing import List, Set, Optional, Iterator, Dict, Any, Tuple
from pathlib import Path
from collections import deque
from dataclasses import dataclass
import re

from core.random_engine import RandomEngine
from core.template_engine import TemplateEngine
from data.language_data import LanguageData


@dataclass
class KeywordMetrics:
    """
    Metrics for keyword generation performance.
    
    Attributes:
        total_generated: Total number of keywords generated.
        total_valid: Total number of valid keywords.
        total_duplicates: Total number of duplicates found.
        generation_time: Time taken for generation (seconds).
        keywords_per_second: Generation rate.
    """
    total_generated: int = 0
    total_valid: int = 0
    total_duplicates: int = 0
    generation_time: float = 0.0
    keywords_per_second: float = 0.0


class KeywordValidator:
    """
    Keyword validation and normalization.
    
    This class provides methods for validating and normalizing keywords
    according to various quality criteria.
    
    Example:
        >>> validator = KeywordValidator()
        >>> keyword = " Test Keyword "
        >>> normalized = validator.normalize(keyword)
        >>> is_valid = validator.validate(normalized)
    """
    
    # Validation patterns
    MIN_LENGTH = 2
    MAX_LENGTH = 200
    INVALID_CHARS_PATTERN = re.compile(r'[<>\"\'\\|]')
    EXCESSIVE_SPACES_PATTERN = re.compile(r'\s{2,}')
    VALID_KEYWORD_PATTERN = re.compile(r'^[\w\s\-\.,:;!?()&+@#$%]+$', re.UNICODE)
    
    def __init__(self):
        """Initialize the keyword validator."""
        self.validation_stats = {
            'total_validated': 0,
            'valid': 0,
            'invalid': 0,
            'too_short': 0,
            'too_long': 0,
            'invalid_chars': 0,
        }
    
    def normalize(self, keyword: str) -> str:
        """
        Normalize a keyword.
        
        Args:
            keyword: Raw keyword to normalize.
            
        Returns:
            Normalized keyword.
            
        Example:
            >>> validator = KeywordValidator()
            >>> validator.normalize("  test   keyword  ")
            'test keyword'
        """
        if not keyword:
            return ""
        
        # Strip leading/trailing whitespace
        keyword = keyword.strip()
        
        # Replace excessive spaces
        keyword = self.EXCESSIVE_SPACES_PATTERN.sub(' ', keyword)
        
        # Normalize case (keep original for now)
        # keyword = keyword.lower()
        
        return keyword
    
    def validate(self, keyword: str) -> bool:
        """
        Validate a keyword.
        
        Args:
            keyword: Keyword to validate.
            
        Returns:
            True if valid, False otherwise.
            
        Example:
            >>> validator = KeywordValidator()
            >>> validator.validate("test keyword")
            True
            >>> validator.validate("")
            False
        """
        self.validation_stats['total_validated'] += 1
        
        # Check empty
        if not keyword:
            self.validation_stats['invalid'] += 1
            return False
        
        # Check length
        if len(keyword) < self.MIN_LENGTH:
            self.validation_stats['too_short'] += 1
            self.validation_stats['invalid'] += 1
            return False
        
        if len(keyword) > self.MAX_LENGTH:
            self.validation_stats['too_long'] += 1
            self.validation_stats['invalid'] += 1
            return False
        
        # Check for invalid characters
        if self.INVALID_CHARS_PATTERN.search(keyword):
            self.validation_stats['invalid_chars'] += 1
            self.validation_stats['invalid'] += 1
            return False
        
        # Check valid pattern
        if not self.VALID_KEYWORD_PATTERN.match(keyword):
            self.validation_stats['invalid'] += 1
            return False
        
        self.validation_stats['valid'] += 1
        return True
    
    def validate_and_normalize(self, keyword: str) -> Optional[str]:
        """
        Normalize and validate a keyword.
        
        Args:
            keyword: Raw keyword.
            
        Returns:
            Normalized keyword if valid, None otherwise.
            
        Example:
            >>> validator = KeywordValidator()
            >>> validator.validate_and_normalize("  test  ")
            'test'
        """
        normalized = self.normalize(keyword)
        if self.validate(normalized):
            return normalized
        return None
    
    def get_stats(self) -> Dict[str, int]:
        """
        Get validation statistics.
        
        Returns:
            Dictionary of validation statistics.
        """
        return self.validation_stats.copy()
    
    def reset_stats(self) -> None:
        """Reset validation statistics."""
        for key in self.validation_stats:
            self.validation_stats[key] = 0


class KeywordBatch:
    """
    Batch keyword generation with streaming support.
    
    This class provides efficient batch generation with support for
    streaming large keyword sets without loading everything into memory.
    
    Example:
        >>> batch = KeywordBatch(engine, "IT", 10000)
        >>> for keyword in batch.stream():
        ...     print(keyword)
    """
    
    def __init__(self, engine: 'KeywordEngine', language: str, count: int, 
                 deterministic: bool = False, seed: Optional[int] = None):
        """
        Initialize keyword batch.
        
        Args:
            engine: KeywordEngine instance.
            language: Language code.
            count: Number of keywords to generate.
            deterministic: Use deterministic mode.
            seed: Random seed for deterministic mode.
        """
        self.engine = engine
        self.language = language
        self.count = count
        self.deterministic = deterministic
        self.seed = seed
        self.generated = 0
        self.buffer = deque()
        self.buffer_size = 1000
    
    def stream(self) -> Iterator[str]:
        """
        Stream keywords one at a time.
        
        Yields:
            Individual keywords.
            
        Example:
            >>> for keyword in batch.stream():
            ...     process(keyword)
        """
        while self.generated < self.count:
            if not self.buffer:
                self._fill_buffer()
            
            if self.buffer:
                yield self.buffer.popleft()
                self.generated += 1
    
    def _fill_buffer(self) -> None:
        """Fill the internal buffer with keywords."""
        batch_size = min(self.buffer_size, self.count - self.generated)
        if batch_size <= 0:
            return
        
        keywords = self.engine._generate_batch_internal(
            self.language, 
            batch_size,
            self.deterministic,
            self.seed
        )
        self.buffer.extend(keywords)
    
    def to_list(self) -> List[str]:
        """
        Convert stream to list.
        
        Returns:
            List of all keywords.
            
        Example:
            >>> keywords = batch.to_list()
        """
        return list(self.stream())


class KeywordEngine:
    """
    Main keyword generation engine.
    
    This class orchestrates keyword generation using templates, random data,
    and language-specific content to produce high-quality keywords at scale.
    
    Features:
        - Template-based generation
        - Real-time duplicate checking
        - Streaming for large batches
        - Support for 10M+ keywords
        - Deterministic mode support
        - Multi-language support
    
    Example:
        >>> engine = KeywordEngine(random_engine, template_engine)
        >>> keywords = engine.generate_batch("IT", 1000)
        >>> single = engine.generate_single("MX")
    """
    
    def __init__(self, random_engine: RandomEngine, template_engine: TemplateEngine):
        """
        Initialize the keyword engine.
        
        Args:
            random_engine: RandomEngine instance for random generation.
            template_engine: TemplateEngine instance for template processing.
            
        Example:
            >>> from core.random_engine import RandomEngine
            >>> from core.template_engine import TemplateEngine
            >>> random_engine = RandomEngine()
            >>> template_engine = TemplateEngine(random_engine)
            >>> engine = KeywordEngine(random_engine, template_engine)
        """
        self.random_engine = random_engine
        self.template_engine = template_engine
        self.language_data = LanguageData()
        self.validator = KeywordValidator()
        
        # Statistics
        self.metrics = KeywordMetrics()
        
        # Duplicate tracking
        self.seen_keywords: Set[str] = set()
        self.enable_realtime_dedup = True
        self.max_seen_size = 1_000_000
        
        # Thread safety
        self._lock = threading.Lock()
        
        # Performance tracking
        self.last_generation_time = 0.0
        self.total_generation_time = 0.0
        self.generation_count = 0
    
    def generate_single(self, language: str, deterministic: bool = False,
                       seed: Optional[int] = None) -> str:
        """
        Generate a single keyword.
        
        Args:
            language: Language code (IT, MX, DE, TW, AT).
            deterministic: Use deterministic mode.
            seed: Random seed for deterministic mode.
            
        Returns:
            Generated keyword.
            
        Example:
            >>> keyword = engine.generate_single("IT")
            >>> print(keyword)
        """
        keywords = self.generate_batch(language, 1, deterministic, seed)
        return keywords[0] if keywords else ""
    
    def generate_batch(self, language: str, count: int,
                      deterministic: bool = False,
                      seed: Optional[int] = None) -> List[str]:
        """
        Generate a batch of keywords.
        
        Args:
            language: Language code (IT, MX, DE, TW, AT).
            count: Number of keywords to generate.
            deterministic: Use deterministic mode.
            seed: Random seed for deterministic mode.
            
        Returns:
            List of generated keywords.
            
        Example:
            >>> keywords = engine.generate_batch("IT", 1000)
            >>> print(f"Generated {len(keywords)} keywords")
        """
        if count <= 0:
            return []
        
        # For large batches, use streaming
        if count > 100000:
            batch = KeywordBatch(self, language, count, deterministic, seed)
            return batch.to_list()
        
        return self._generate_batch_internal(language, count, deterministic, seed)
    
    def _generate_batch_internal(self, language: str, count: int,
                                deterministic: bool = False,
                                seed: Optional[int] = None) -> List[str]:
        """
        Internal batch generation method.
        
        Args:
            language: Language code.
            count: Number of keywords to generate.
            deterministic: Use deterministic mode.
            seed: Random seed.
            
        Returns:
            List of generated keywords.
        """
        start_time = time.time()
        
        # Configure random engine for deterministic mode if requested
        original_engine = self.random_engine
        temp_engine = None
        
        if deterministic:
            if seed is not None and self.random_engine.is_deterministic():
                # Engine is already deterministic, just reseed it
                self.random_engine.reseed(seed)
            elif seed is not None:
                # Engine is not deterministic, create a temporary one
                temp_engine = RandomEngine(deterministic=True, seed=seed)
                self.random_engine = temp_engine
                # Also update template engine to use temp engine
                self.template_engine.random_engine = temp_engine
        
        try:
            # Load language data
            dataset = self.language_data.get_dataset(language)
            if not dataset:
                raise ValueError(f"Unsupported language: {language}")
            
            # Load templates into template engine
            self.template_engine.clear_templates()
            self.template_engine.add_templates(dataset.templates)
            
            keywords = []
            attempts = 0
            max_attempts = count * 3  # Allow some retries for duplicates
            
            while len(keywords) < count and attempts < max_attempts:
                attempts += 1
                
                # Select random data for template
                data = {
                    'brand': self.random_engine.random_choice(dataset.brands),
                    'product': self.random_engine.random_choice(dataset.products),
                    'intent': self.random_engine.random_choice(dataset.intents),
                    'modifier': self.random_engine.random_choice(dataset.modifiers),
                    'question': self.random_engine.random_choice(dataset.questions),
                    'suffix': self.random_engine.random_choice(dataset.suffixes),
                }
            
                # Generate keyword from template
                try:
                    keyword = self.template_engine.render_random(data)
                except Exception:
                    continue
                
                # Validate and normalize
                normalized = self.validator.validate_and_normalize(keyword)
                if not normalized:
                    continue
                
                # Check for duplicates
                if self.enable_realtime_dedup:
                    with self._lock:
                        if normalized in self.seen_keywords:
                            self.metrics.total_duplicates += 1
                            continue
                        
                        # Add to seen set
                        self.seen_keywords.add(normalized)
                        
                        # Limit seen set size
                        if len(self.seen_keywords) > self.max_seen_size:
                            # Remove oldest 10%
                            remove_count = self.max_seen_size // 10
                            for _ in range(remove_count):
                                self.seen_keywords.pop()
                
                keywords.append(normalized)
                self.metrics.total_generated += 1
                self.metrics.total_valid += 1
            
            # Update metrics
            end_time = time.time()
            generation_time = end_time - start_time
            self.metrics.generation_time += generation_time
            
            if generation_time > 0:
                self.metrics.keywords_per_second = len(keywords) / generation_time
            
            self.last_generation_time = generation_time
            self.total_generation_time += generation_time
            self.generation_count += 1
            
            return keywords
        finally:
            # Restore original engine if we created a temporary one
            if temp_engine is not None:
                self.random_engine = original_engine
                self.template_engine.random_engine = original_engine
    
    def generate_stream(self, language: str, count: int,
                       deterministic: bool = False,
                       seed: Optional[int] = None) -> Iterator[str]:
        """
        Generate keywords as a stream.
        
        Args:
            language: Language code.
            count: Number of keywords to generate.
            deterministic: Use deterministic mode.
            seed: Random seed.
            
        Yields:
            Individual keywords.
            
        Example:
            >>> for keyword in engine.generate_stream("IT", 10000):
            ...     save_keyword(keyword)
        """
        batch = KeywordBatch(self, language, count, deterministic, seed)
        yield from batch.stream()
    
    def validate_keyword(self, keyword: str) -> bool:
        """
        Validate a keyword.
        
        Args:
            keyword: Keyword to validate.
            
        Returns:
            True if valid, False otherwise.
            
        Example:
            >>> is_valid = engine.validate_keyword("test keyword")
        """
        return self.validator.validate(keyword)
    
    def normalize_keyword(self, keyword: str) -> str:
        """
        Normalize a keyword.
        
        Args:
            keyword: Keyword to normalize.
            
        Returns:
            Normalized keyword.
            
        Example:
            >>> normalized = engine.normalize_keyword("  Test  ")
        """
        return self.validator.normalize(keyword)
    
    def get_metrics(self) -> KeywordMetrics:
        """
        Get generation metrics.
        
        Returns:
            KeywordMetrics object with statistics.
            
        Example:
            >>> metrics = engine.get_metrics()
            >>> print(f"Generated: {metrics.total_generated}")
        """
        return self.metrics
    
    def reset_metrics(self) -> None:
        """
        Reset generation metrics.
        
        Example:
            >>> engine.reset_metrics()
        """
        self.metrics = KeywordMetrics()
        self.validator.reset_stats()
    
    def clear_duplicate_cache(self) -> None:
        """
        Clear the duplicate tracking cache.
        
        Example:
            >>> engine.clear_duplicate_cache()
        """
        with self._lock:
            self.seen_keywords.clear()
    
    def set_realtime_dedup(self, enabled: bool) -> None:
        """
        Enable or disable real-time deduplication.
        
        Args:
            enabled: Whether to enable real-time dedup.
            
        Example:
            >>> engine.set_realtime_dedup(True)
        """
        self.enable_realtime_dedup = enabled
    
    def get_supported_languages(self) -> List[str]:
        """
        Get list of supported languages.
        
        Returns:
            List of language codes.
            
        Example:
            >>> languages = engine.get_supported_languages()
        """
        return self.language_data.get_supported_languages()
    
    def get_language_stats(self, language: str) -> Dict[str, int]:
        """
        Get statistics for a language dataset.
        
        Args:
            language: Language code.
            
        Returns:
            Dictionary of dataset statistics.
            
        Example:
            >>> stats = engine.get_language_stats("IT")
            >>> print(f"Brands: {stats['brands']}")
        """
        dataset = self.language_data.get_dataset(language)
        if not dataset:
            return {}
        
        return {
            'brands': len(dataset.brands),
            'products': len(dataset.products),
            'intents': len(dataset.intents),
            'modifiers': len(dataset.modifiers),
            'questions': len(dataset.questions),
            'suffixes': len(dataset.suffixes),
            'templates': len(dataset.templates),
        }
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """
        Get performance statistics.
        
        Returns:
            Dictionary of performance metrics.
            
        Example:
            >>> stats = engine.get_performance_stats()
            >>> print(f"Avg time: {stats['avg_generation_time']}")
        """
        avg_time = 0.0
        if self.generation_count > 0:
            avg_time = self.total_generation_time / self.generation_count
        
        return {
            'last_generation_time': self.last_generation_time,
            'total_generation_time': self.total_generation_time,
            'avg_generation_time': avg_time,
            'generation_count': self.generation_count,
            'keywords_per_second': self.metrics.keywords_per_second,
            'cache_size': len(self.seen_keywords),
        }
    
    def estimate_generation_time(self, count: int) -> float:
        """
        Estimate time to generate keywords.
        
        Args:
            count: Number of keywords to generate.
            
        Returns:
            Estimated time in seconds.
            
        Example:
            >>> estimated = engine.estimate_generation_time(100000)
            >>> print(f"Estimated: {estimated:.2f} seconds")
        """
        if self.metrics.keywords_per_second <= 0:
            # Default estimate: 10000 keywords per second
            return count / 10000.0
        
        return count / self.metrics.keywords_per_second
    
    def __repr__(self) -> str:
        """String representation of the engine."""
        return (f"KeywordEngine(generated={self.metrics.total_generated}, "
                f"valid={self.metrics.total_valid}, "
                f"duplicates={self.metrics.total_duplicates}, "
                f"kps={self.metrics.keywords_per_second:.0f})")
