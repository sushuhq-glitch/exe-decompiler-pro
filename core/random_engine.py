"""
Cryptographically Secure Random Engine.

This module provides a high-quality random number generator using multiple
entropy sources including secrets.SystemRandom(), os.urandom(), and time.time_ns()
for maximum randomness and unpredictability.

Classes:
    RandomEngine: Cryptographically secure random number generator with entropy mixing.

Example:
    >>> from core.random_engine import RandomEngine
    >>> engine = RandomEngine()
    >>> random_num = engine.random_int(1, 100)
    >>> items = ['a', 'b', 'c']
    >>> engine.shuffle(items)
"""

import secrets
import os
import time
import hashlib
import random
from typing import Any, List, Optional, Sequence, TypeVar
from collections.abc import MutableSequence

T = TypeVar('T')


class RandomEngine:
    """
    Cryptographically secure random number generator.
    
    This class combines multiple entropy sources to provide high-quality
    random numbers with proper seeding support for deterministic mode.
    
    Attributes:
        deterministic (bool): Whether to use deterministic mode.
        seed_value (Optional[int]): Seed value for deterministic mode.
    
    Example:
        >>> # Non-deterministic mode (default)
        >>> engine = RandomEngine()
        >>> num = engine.random_int(1, 100)
        >>> 
        >>> # Deterministic mode
        >>> engine = RandomEngine(deterministic=True, seed=42)
        >>> num = engine.random_int(1, 100)
    """
    
    # Constants
    ENTROPY_ROUNDS = 5
    SHUFFLE_ITERATIONS = 3
    DEFAULT_ENTROPY_SIZE = 32
    
    def __init__(self, deterministic: bool = False, seed: Optional[int] = None):
        """
        Initialize random engine.
        
        Args:
            deterministic: If True, use deterministic mode with seed.
            seed: Seed value for deterministic mode. Auto-generated if None.
        
        Raises:
            ValueError: If seed is not a valid integer.
        
        Example:
            >>> engine = RandomEngine()  # Non-deterministic
            >>> engine = RandomEngine(deterministic=True, seed=42)  # Deterministic
        """
        self.deterministic = deterministic
        self.seed_value = seed
        
        if self.deterministic:
            if self.seed_value is None:
                # Generate seed from current time and random bytes
                self.seed_value = self._generate_seed()
            elif not isinstance(self.seed_value, int):
                raise ValueError(f"Seed must be an integer, got {type(self.seed_value)}")
            
            # Initialize random with seed for deterministic behavior
            random.seed(self.seed_value)
            self._random_gen = random.Random(self.seed_value)
        else:
            # Use SystemRandom for cryptographic randomness
            self._random_gen = secrets.SystemRandom()
        
        # Initialize entropy pool
        self._entropy_pool = bytearray()
        self._refresh_entropy_pool()
    
    def _generate_seed(self) -> int:
        """
        Generate a seed value from multiple entropy sources.
        
        Returns:
            Integer seed value.
        
        Example:
            >>> engine = RandomEngine()
            >>> seed = engine._generate_seed()
            >>> isinstance(seed, int)
            True
        """
        # Combine multiple entropy sources
        entropy_data = bytearray()
        
        # Add high-resolution time
        entropy_data.extend(time.time_ns().to_bytes(8, 'big'))
        
        # Add random bytes from OS
        entropy_data.extend(os.urandom(self.DEFAULT_ENTROPY_SIZE))
        
        # Add process ID
        entropy_data.extend(os.getpid().to_bytes(4, 'big'))
        
        # Hash the combined entropy
        seed_hash = hashlib.sha256(entropy_data).digest()
        
        # Convert to integer
        return int.from_bytes(seed_hash[:8], 'big')
    
    def _refresh_entropy_pool(self) -> None:
        """
        Refresh the entropy pool with new random data.
        
        This method is called periodically to ensure fresh entropy
        is available for random operations.
        """
        self._entropy_pool.clear()
        
        for _ in range(self.ENTROPY_ROUNDS):
            if self.deterministic:
                # Use seeded random for deterministic behavior
                self._entropy_pool.extend(
                    self._random_gen.getrandbits(256).to_bytes(32, 'big')
                )
            else:
                # Use cryptographic random sources
                self._entropy_pool.extend(os.urandom(self.DEFAULT_ENTROPY_SIZE))
                self._entropy_pool.extend(secrets.token_bytes(self.DEFAULT_ENTROPY_SIZE))
            
            # Mix in high-resolution time
            time_bytes = time.time_ns().to_bytes(8, 'big')
            self._entropy_pool.extend(time_bytes)
    
    def _mix_entropy(self) -> bytes:
        """
        Mix entropy pool using cryptographic hash.
        
        Returns:
            32 bytes of mixed entropy.
        
        Example:
            >>> engine = RandomEngine()
            >>> entropy = engine._mix_entropy()
            >>> len(entropy)
            32
        """
        if len(self._entropy_pool) < 32:
            self._refresh_entropy_pool()
        
        # Hash the entropy pool
        mixed = hashlib.sha256(bytes(self._entropy_pool)).digest()
        
        # Rotate the pool
        self._entropy_pool = self._entropy_pool[16:] + bytearray(mixed[:16])
        
        return mixed
    
    def random_bytes(self, size: int) -> bytes:
        """
        Generate random bytes.
        
        Args:
            size: Number of bytes to generate.
        
        Returns:
            Random bytes of specified size.
        
        Raises:
            ValueError: If size is not positive.
        
        Example:
            >>> engine = RandomEngine()
            >>> data = engine.random_bytes(16)
            >>> len(data)
            16
        """
        if size <= 0:
            raise ValueError(f"Size must be positive, got {size}")
        
        if self.deterministic:
            # Generate deterministic random bytes
            return self._random_gen.getrandbits(size * 8).to_bytes(size, 'big')
        else:
            # Use cryptographic random
            return secrets.token_bytes(size)
    
    def random_int(self, min_value: int, max_value: int) -> int:
        """
        Generate random integer in range [min_value, max_value].
        
        Args:
            min_value: Minimum value (inclusive).
            max_value: Maximum value (inclusive).
        
        Returns:
            Random integer in specified range.
        
        Raises:
            ValueError: If min_value > max_value.
        
        Example:
            >>> engine = RandomEngine()
            >>> num = engine.random_int(1, 100)
            >>> 1 <= num <= 100
            True
        """
        if min_value > max_value:
            raise ValueError(
                f"min_value ({min_value}) must be <= max_value ({max_value})"
            )
        
        return self._random_gen.randint(min_value, max_value)
    
    def random_float(self) -> float:
        """
        Generate random float in range [0.0, 1.0).
        
        Returns:
            Random float value.
        
        Example:
            >>> engine = RandomEngine()
            >>> value = engine.random_float()
            >>> 0.0 <= value < 1.0
            True
        """
        return self._random_gen.random()
    
    def random_choice(self, sequence: Sequence[T]) -> T:
        """
        Choose random element from sequence.
        
        Args:
            sequence: Non-empty sequence to choose from.
        
        Returns:
            Random element from sequence.
        
        Raises:
            IndexError: If sequence is empty.
            TypeError: If sequence is not a sequence.
        
        Example:
            >>> engine = RandomEngine()
            >>> items = ['a', 'b', 'c']
            >>> choice = engine.random_choice(items)
            >>> choice in items
            True
        """
        if not sequence:
            raise IndexError("Cannot choose from empty sequence")
        
        return self._random_gen.choice(sequence)
    
    def random_choices(
        self,
        sequence: Sequence[T],
        weights: Optional[Sequence[float]] = None,
        k: int = 1
    ) -> List[T]:
        """
        Choose k random elements from sequence with optional weights.
        
        Args:
            sequence: Sequence to choose from.
            weights: Optional weights for each element.
            k: Number of elements to choose.
        
        Returns:
            List of k random elements (with replacement).
        
        Raises:
            ValueError: If weights don't match sequence length.
            ValueError: If k is not positive.
        
        Example:
            >>> engine = RandomEngine()
            >>> items = ['a', 'b', 'c']
            >>> choices = engine.random_choices(items, k=5)
            >>> len(choices)
            5
        """
        if k <= 0:
            raise ValueError(f"k must be positive, got {k}")
        
        if not sequence:
            raise ValueError("Cannot choose from empty sequence")
        
        if weights is not None:
            if len(weights) != len(sequence):
                raise ValueError(
                    f"Weights length ({len(weights)}) must match "
                    f"sequence length ({len(sequence)})"
                )
            return self._random_gen.choices(sequence, weights=weights, k=k)
        
        return self._random_gen.choices(sequence, k=k)
    
    def random_sample(self, sequence: Sequence[T], k: int) -> List[T]:
        """
        Choose k unique random elements from sequence.
        
        Args:
            sequence: Sequence to sample from.
            k: Number of unique elements to choose.
        
        Returns:
            List of k unique random elements (without replacement).
        
        Raises:
            ValueError: If k > len(sequence).
            ValueError: If k is not positive.
        
        Example:
            >>> engine = RandomEngine()
            >>> items = ['a', 'b', 'c', 'd', 'e']
            >>> sample = engine.random_sample(items, 3)
            >>> len(sample) == len(set(sample))
            True
        """
        if k <= 0:
            raise ValueError(f"k must be positive, got {k}")
        
        if k > len(sequence):
            raise ValueError(
                f"Sample size ({k}) cannot exceed sequence length ({len(sequence)})"
            )
        
        return self._random_gen.sample(sequence, k)
    
    def shuffle(self, sequence: MutableSequence[T]) -> None:
        """
        Shuffle sequence in-place using multiple iterations.
        
        This method performs multiple shuffle passes for enhanced randomness.
        
        Args:
            sequence: Mutable sequence to shuffle in-place.
        
        Raises:
            TypeError: If sequence is not mutable.
        
        Example:
            >>> engine = RandomEngine()
            >>> items = [1, 2, 3, 4, 5]
            >>> engine.shuffle(items)
            >>> len(items)
            5
        """
        if not isinstance(sequence, MutableSequence):
            raise TypeError(
                f"Sequence must be mutable, got {type(sequence).__name__}"
            )
        
        # Perform multiple shuffle iterations for enhanced randomness
        for _ in range(self.SHUFFLE_ITERATIONS):
            self._random_gen.shuffle(sequence)
    
    def random_string(
        self,
        length: int,
        charset: str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    ) -> str:
        """
        Generate random string of specified length.
        
        Args:
            length: Length of string to generate.
            charset: Character set to use (default: alphanumeric).
        
        Returns:
            Random string.
        
        Raises:
            ValueError: If length is not positive or charset is empty.
        
        Example:
            >>> engine = RandomEngine()
            >>> s = engine.random_string(10)
            >>> len(s)
            10
        """
        if length <= 0:
            raise ValueError(f"Length must be positive, got {length}")
        
        if not charset:
            raise ValueError("Charset cannot be empty")
        
        return ''.join(self.random_choice(charset) for _ in range(length))
    
    def weighted_choice(
        self,
        items: Sequence[T],
        weights: Sequence[float]
    ) -> T:
        """
        Choose one item based on weights.
        
        Args:
            items: Items to choose from.
            weights: Weight for each item.
        
        Returns:
            Single weighted random choice.
        
        Raises:
            ValueError: If items and weights lengths don't match.
            ValueError: If items is empty.
        
        Example:
            >>> engine = RandomEngine()
            >>> items = ['a', 'b', 'c']
            >>> weights = [10, 5, 1]
            >>> choice = engine.weighted_choice(items, weights)
            >>> choice in items
            True
        """
        if not items:
            raise ValueError("Items cannot be empty")
        
        if len(items) != len(weights):
            raise ValueError(
                f"Items length ({len(items)}) must match "
                f"weights length ({len(weights)})"
            )
        
        return self._random_gen.choices(items, weights=weights, k=1)[0]
    
    def get_seed(self) -> Optional[int]:
        """
        Get current seed value.
        
        Returns:
            Seed value if deterministic mode, None otherwise.
        
        Example:
            >>> engine = RandomEngine(deterministic=True, seed=42)
            >>> engine.get_seed()
            42
        """
        return self.seed_value if self.deterministic else None
    
    def is_deterministic(self) -> bool:
        """
        Check if engine is in deterministic mode.
        
        Returns:
            True if deterministic, False otherwise.
        
        Example:
            >>> engine = RandomEngine()
            >>> engine.is_deterministic()
            False
        """
        return self.deterministic
    
    def reseed(self, seed: Optional[int] = None) -> None:
        """
        Reseed the random engine.
        
        Args:
            seed: New seed value. Auto-generated if None.
        
        Raises:
            RuntimeError: If called in non-deterministic mode.
        
        Example:
            >>> engine = RandomEngine(deterministic=True, seed=42)
            >>> engine.reseed(123)
            >>> engine.get_seed()
            123
        """
        if not self.deterministic:
            raise RuntimeError("Cannot reseed in non-deterministic mode")
        
        if seed is None:
            seed = self._generate_seed()
        
        self.seed_value = seed
        random.seed(self.seed_value)
        self._random_gen = random.Random(self.seed_value)
        self._refresh_entropy_pool()
