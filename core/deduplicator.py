#!/usr/bin/env python3
"""
Deduplicator Module - Advanced Duplicate Removal System.

This module provides efficient duplicate detection and removal using
hash-based algorithms and optional Bloom filters for memory efficiency.

Classes:
    Deduplicator: Main deduplication engine with hash-based tracking.
    BloomFilter: Space-efficient probabilistic duplicate detector.
    DeduplicationStats: Statistics tracking for deduplication operations.

Example:
    >>> from core.deduplicator import Deduplicator
    >>> dedup = Deduplicator()
    >>> items = ["a", "b", "a", "c", "b"]
    >>> unique = dedup.remove_duplicates(items)
    >>> print(unique)  # ['a', 'b', 'c']
"""

import hashlib
import time
import sys
from typing import List, Set, Optional, Iterator, Dict, Any
from dataclasses import dataclass
from collections import OrderedDict
import math


@dataclass
class DeduplicationStats:
    """
    Statistics for deduplication operations.
    
    Attributes:
        total_processed: Total items processed.
        unique_items: Number of unique items.
        duplicates_found: Number of duplicates found.
        processing_time: Time taken (seconds).
        memory_used_mb: Memory used (MB).
    """
    total_processed: int = 0
    unique_items: int = 0
    duplicates_found: int = 0
    processing_time: float = 0.0
    memory_used_mb: float = 0.0


class BloomFilter:
    """
    Space-efficient probabilistic data structure for duplicate detection.
    
    A Bloom filter is a probabilistic data structure that can test whether
    an element is a member of a set. False positive matches are possible,
    but false negatives are not.
    
    Attributes:
        size: Size of the bit array.
        hash_count: Number of hash functions.
        bit_array: Internal bit array.
    
    Example:
        >>> bloom = BloomFilter(size=10000, hash_count=3)
        >>> bloom.add("test")
        >>> bloom.contains("test")
        True
        >>> bloom.contains("other")
        False
    """
    
    def __init__(self, size: int = 10_000_000, hash_count: int = 7,
                 false_positive_rate: float = 0.001):
        """
        Initialize Bloom filter.
        
        Args:
            size: Expected number of elements.
            hash_count: Number of hash functions to use.
            false_positive_rate: Target false positive rate.
            
        Example:
            >>> bloom = BloomFilter(size=1000000, hash_count=5)
        """
        # Calculate optimal size and hash count if not provided
        if false_positive_rate and false_positive_rate > 0:
            self.size = self._optimal_size(size, false_positive_rate)
            self.hash_count = self._optimal_hash_count(self.size, size)
        else:
            self.size = size
            self.hash_count = hash_count
        
        # Initialize bit array using a list of integers
        # Each integer represents 64 bits
        self.array_size = (self.size + 63) // 64
        self.bit_array = [0] * self.array_size
        
        # Statistics
        self.item_count = 0
        self.collision_count = 0
    
    def _optimal_size(self, n: int, p: float) -> int:
        """
        Calculate optimal Bloom filter size.
        
        Args:
            n: Expected number of elements.
            p: Target false positive rate.
            
        Returns:
            Optimal size in bits.
        """
        if p <= 0 or p >= 1:
            p = 0.001
        
        m = -(n * math.log(p)) / (math.log(2) ** 2)
        return int(m)
    
    def _optimal_hash_count(self, m: int, n: int) -> int:
        """
        Calculate optimal number of hash functions.
        
        Args:
            m: Size of bit array.
            n: Expected number of elements.
            
        Returns:
            Optimal number of hash functions.
        """
        if n <= 0:
            return 1
        
        k = (m / n) * math.log(2)
        return max(1, int(k))
    
    def _hash(self, item: str, seed: int) -> int:
        """
        Generate a hash value for an item.
        
        Args:
            item: Item to hash.
            seed: Hash seed.
            
        Returns:
            Hash value.
        """
        # Use SHA256 with seed
        h = hashlib.sha256()
        h.update(f"{seed}:{item}".encode('utf-8'))
        return int.from_bytes(h.digest()[:8], 'big') % self.size
    
    def add(self, item: str) -> None:
        """
        Add an item to the Bloom filter.
        
        Args:
            item: Item to add.
            
        Example:
            >>> bloom = BloomFilter()
            >>> bloom.add("test")
        """
        for i in range(self.hash_count):
            pos = self._hash(item, i)
            array_idx = pos // 64
            bit_idx = pos % 64
            
            # Check if already set (collision)
            if self.bit_array[array_idx] & (1 << bit_idx):
                self.collision_count += 1
            
            self.bit_array[array_idx] |= (1 << bit_idx)
        
        self.item_count += 1
    
    def contains(self, item: str) -> bool:
        """
        Check if an item might be in the set.
        
        Args:
            item: Item to check.
            
        Returns:
            True if item might be present (or false positive),
            False if definitely not present.
            
        Example:
            >>> bloom = BloomFilter()
            >>> bloom.add("test")
            >>> bloom.contains("test")
            True
        """
        for i in range(self.hash_count):
            pos = self._hash(item, i)
            array_idx = pos // 64
            bit_idx = pos % 64
            
            if not (self.bit_array[array_idx] & (1 << bit_idx)):
                return False
        
        return True
    
    def get_fill_ratio(self) -> float:
        """
        Get the fill ratio of the Bloom filter.
        
        Returns:
            Fill ratio (0.0 to 1.0).
        """
        set_bits = sum(bin(x).count('1') for x in self.bit_array)
        return set_bits / self.size
    
    def get_memory_usage_mb(self) -> float:
        """
        Get memory usage in MB.
        
        Returns:
            Memory usage in megabytes.
        """
        # Each integer is 8 bytes on 64-bit Python
        return (self.array_size * 8) / (1024 * 1024)
    
    def clear(self) -> None:
        """
        Clear the Bloom filter.
        
        Example:
            >>> bloom.clear()
        """
        self.bit_array = [0] * self.array_size
        self.item_count = 0
        self.collision_count = 0


class Deduplicator:
    """
    Advanced duplicate detection and removal system.
    
    This class provides efficient deduplication using hash-based tracking
    with optional Bloom filter support for memory efficiency.
    
    Features:
        - Hash-based duplicate detection
        - Optional Bloom filter for memory efficiency
        - Streaming support for large datasets
        - Memory usage tracking
        - Performance statistics
    
    Example:
        >>> dedup = Deduplicator()
        >>> items = ["a", "b", "a", "c"]
        >>> unique = dedup.remove_duplicates(items)
        >>> print(len(unique))  # 3
    """
    
    def __init__(self, use_bloom_filter: bool = False,
                 bloom_size: int = 10_000_000,
                 bloom_fpr: float = 0.001,
                 max_memory_mb: float = 2048):
        """
        Initialize the deduplicator.
        
        Args:
            use_bloom_filter: Whether to use Bloom filter.
            bloom_size: Expected number of elements for Bloom filter.
            bloom_fpr: False positive rate for Bloom filter.
            max_memory_mb: Maximum memory to use (MB).
            
        Example:
            >>> dedup = Deduplicator(use_bloom_filter=True)
        """
        self.use_bloom_filter = use_bloom_filter
        self.max_memory_mb = max_memory_mb
        
        # Hash-based tracking
        self.seen_hashes: Set[str] = set()
        self.seen_items: Set[str] = set()
        
        # Bloom filter
        self.bloom_filter: Optional[BloomFilter] = None
        if use_bloom_filter:
            self.bloom_filter = BloomFilter(
                size=bloom_size,
                false_positive_rate=bloom_fpr
            )
        
        # Statistics
        self.stats = DeduplicationStats()
        
        # Cache for recent items
        self.cache_size = 100_000
        self.recent_cache: OrderedDict[str, bool] = OrderedDict()
    
    def _compute_hash(self, item: str) -> str:
        """
        Compute hash for an item.
        
        Args:
            item: Item to hash.
            
        Returns:
            Hash string.
        """
        return hashlib.md5(item.encode('utf-8')).hexdigest()
    
    def check_duplicate(self, item: str) -> bool:
        """
        Check if an item is a duplicate.
        
        Args:
            item: Item to check.
            
        Returns:
            True if duplicate, False if unique.
            
        Example:
            >>> dedup = Deduplicator()
            >>> dedup.check_duplicate("test")
            False
            >>> dedup.add_to_cache("test")
            >>> dedup.check_duplicate("test")
            True
        """
        # Check recent cache first (fastest)
        if item in self.recent_cache:
            return True
        
        # Check Bloom filter if enabled
        if self.use_bloom_filter and self.bloom_filter:
            if not self.bloom_filter.contains(item):
                return False
        
        # Check hash set
        item_hash = self._compute_hash(item)
        return item_hash in self.seen_hashes
    
    def add_to_cache(self, item: str) -> None:
        """
        Add an item to the duplicate cache.
        
        Args:
            item: Item to add.
            
        Example:
            >>> dedup = Deduplicator()
            >>> dedup.add_to_cache("test")
        """
        # Add to recent cache
        self.recent_cache[item] = True
        if len(self.recent_cache) > self.cache_size:
            self.recent_cache.popitem(last=False)
        
        # Add to Bloom filter
        if self.use_bloom_filter and self.bloom_filter:
            self.bloom_filter.add(item)
        
        # Add hash to set
        item_hash = self._compute_hash(item)
        self.seen_hashes.add(item_hash)
        self.seen_items.add(item)
    
    def remove_duplicates(self, items: List[str],
                         case_sensitive: bool = True,
                         preserve_order: bool = True) -> List[str]:
        """
        Remove duplicates from a list of items.
        
        Args:
            items: List of items.
            case_sensitive: Whether to consider case.
            preserve_order: Whether to preserve original order.
            
        Returns:
            List of unique items.
            
        Example:
            >>> dedup = Deduplicator()
            >>> items = ["a", "b", "A", "a", "c"]
            >>> unique = dedup.remove_duplicates(items)
            >>> print(unique)  # ['a', 'b', 'A', 'c'] or ['a', 'b', 'c']
        """
        start_time = time.time()
        
        unique = []
        local_seen: Set[str] = set()
        
        for item in items:
            self.stats.total_processed += 1
            
            # Normalize case if needed
            check_item = item if case_sensitive else item.lower()
            
            # Check if duplicate
            if check_item in local_seen:
                self.stats.duplicates_found += 1
                continue
            
            if self.check_duplicate(check_item):
                self.stats.duplicates_found += 1
                continue
            
            # Add to results
            unique.append(item)
            local_seen.add(check_item)
            self.add_to_cache(check_item)
            self.stats.unique_items += 1
        
        # Update statistics
        end_time = time.time()
        self.stats.processing_time = end_time - start_time
        self.stats.memory_used_mb = self.get_memory_usage_mb()
        
        return unique
    
    def remove_duplicates_stream(self, items: Iterator[str],
                                case_sensitive: bool = True) -> Iterator[str]:
        """
        Remove duplicates from a stream of items.
        
        Args:
            items: Iterator of items.
            case_sensitive: Whether to consider case.
            
        Yields:
            Unique items.
            
        Example:
            >>> dedup = Deduplicator()
            >>> items = iter(["a", "b", "a", "c"])
            >>> for unique in dedup.remove_duplicates_stream(items):
            ...     print(unique)
        """
        for item in items:
            self.stats.total_processed += 1
            
            # Normalize case if needed
            check_item = item if case_sensitive else item.lower()
            
            # Check if duplicate
            if self.check_duplicate(check_item):
                self.stats.duplicates_found += 1
                continue
            
            # Add to cache and yield
            self.add_to_cache(check_item)
            self.stats.unique_items += 1
            yield item
    
    def clear_cache(self) -> None:
        """
        Clear all caches.
        
        Example:
            >>> dedup.clear_cache()
        """
        self.seen_hashes.clear()
        self.seen_items.clear()
        self.recent_cache.clear()
        
        if self.bloom_filter:
            self.bloom_filter.clear()
    
    def get_stats(self) -> DeduplicationStats:
        """
        Get deduplication statistics.
        
        Returns:
            DeduplicationStats object.
            
        Example:
            >>> stats = dedup.get_stats()
            >>> print(f"Duplicates: {stats.duplicates_found}")
        """
        self.stats.memory_used_mb = self.get_memory_usage_mb()
        return self.stats
    
    def reset_stats(self) -> None:
        """
        Reset statistics.
        
        Example:
            >>> dedup.reset_stats()
        """
        self.stats = DeduplicationStats()
    
    def get_memory_usage_mb(self) -> float:
        """
        Get current memory usage in MB.
        
        Returns:
            Memory usage in megabytes.
            
        Example:
            >>> usage = dedup.get_memory_usage_mb()
            >>> print(f"Memory: {usage:.2f} MB")
        """
        memory = 0.0
        
        # Hash set memory
        memory += sys.getsizeof(self.seen_hashes) / (1024 * 1024)
        for item in list(self.seen_hashes)[:100]:  # Sample
            memory += sys.getsizeof(item) / (1024 * 1024)
        memory *= len(self.seen_hashes) / max(1, min(100, len(self.seen_hashes)))
        
        # Items set memory
        memory += sys.getsizeof(self.seen_items) / (1024 * 1024)
        
        # Cache memory
        memory += sys.getsizeof(self.recent_cache) / (1024 * 1024)
        
        # Bloom filter memory
        if self.bloom_filter:
            memory += self.bloom_filter.get_memory_usage_mb()
        
        return memory
    
    def get_duplicate_ratio(self) -> float:
        """
        Get ratio of duplicates to total processed.
        
        Returns:
            Duplicate ratio (0.0 to 1.0).
            
        Example:
            >>> ratio = dedup.get_duplicate_ratio()
            >>> print(f"Duplicate ratio: {ratio:.2%}")
        """
        if self.stats.total_processed == 0:
            return 0.0
        
        return self.stats.duplicates_found / self.stats.total_processed
    
    def get_cache_info(self) -> Dict[str, Any]:
        """
        Get information about caches.
        
        Returns:
            Dictionary with cache information.
            
        Example:
            >>> info = dedup.get_cache_info()
            >>> print(f"Hash cache size: {info['hash_cache_size']}")
        """
        info = {
            'hash_cache_size': len(self.seen_hashes),
            'item_cache_size': len(self.seen_items),
            'recent_cache_size': len(self.recent_cache),
            'memory_usage_mb': self.get_memory_usage_mb(),
        }
        
        if self.bloom_filter:
            info['bloom_filter'] = {
                'size': self.bloom_filter.size,
                'hash_count': self.bloom_filter.hash_count,
                'item_count': self.bloom_filter.item_count,
                'fill_ratio': self.bloom_filter.get_fill_ratio(),
                'memory_mb': self.bloom_filter.get_memory_usage_mb(),
            }
        
        return info
    
    def optimize_memory(self) -> None:
        """
        Optimize memory usage by clearing old entries.
        
        This method removes old entries from caches if memory usage
        exceeds the maximum limit.
        
        Example:
            >>> dedup.optimize_memory()
        """
        current_memory = self.get_memory_usage_mb()
        
        if current_memory > self.max_memory_mb:
            # Clear oldest entries from hash cache
            remove_count = len(self.seen_hashes) // 10
            hashes_to_remove = list(self.seen_hashes)[:remove_count]
            for h in hashes_to_remove:
                self.seen_hashes.discard(h)
            
            # Clear oldest from items
            items_to_remove = list(self.seen_items)[:remove_count]
            for item in items_to_remove:
                self.seen_items.discard(item)
            
            # Clear recent cache
            while len(self.recent_cache) > self.cache_size // 2:
                self.recent_cache.popitem(last=False)
    
    def export_stats(self) -> Dict[str, Any]:
        """
        Export all statistics as a dictionary.
        
        Returns:
            Dictionary with all statistics.
            
        Example:
            >>> stats = dedup.export_stats()
            >>> print(stats)
        """
        return {
            'total_processed': self.stats.total_processed,
            'unique_items': self.stats.unique_items,
            'duplicates_found': self.stats.duplicates_found,
            'duplicate_ratio': self.get_duplicate_ratio(),
            'processing_time': self.stats.processing_time,
            'memory_used_mb': self.get_memory_usage_mb(),
            'cache_info': self.get_cache_info(),
        }
    
    def __repr__(self) -> str:
        """String representation of the deduplicator."""
        return (f"Deduplicator(processed={self.stats.total_processed}, "
                f"unique={self.stats.unique_items}, "
                f"duplicates={self.stats.duplicates_found}, "
                f"memory={self.get_memory_usage_mb():.2f}MB)")
