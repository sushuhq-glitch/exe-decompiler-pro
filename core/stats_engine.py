#!/usr/bin/env python3
"""
Statistics Engine Module - Performance Metrics and Tracking.

This module provides comprehensive statistics tracking and reporting
for keyword generation, deduplication, and file operations.

Classes:
    StatsEngine: Main statistics tracking engine.
    PerformanceMetrics: Performance measurement and analysis.
    ProgressTracker: Real-time progress tracking.

Example:
    >>> from core.stats_engine import StatsEngine
    >>> stats = StatsEngine()
    >>> stats.start_tracking("generation")
    >>> # ... do work ...
    >>> stats.update_progress(50, 100)
    >>> stats.print_summary()
"""

import time
import sys
import threading
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta


@dataclass
class MetricSnapshot:
    """
    Snapshot of metrics at a point in time.
    
    Attributes:
        timestamp: Time of snapshot.
        operations: Number of operations completed.
        rate: Operations per second.
        memory_mb: Memory usage in MB.
        elapsed_time: Elapsed time in seconds.
    """
    timestamp: datetime
    operations: int
    rate: float
    memory_mb: float
    elapsed_time: float


@dataclass
class TrackingSession:
    """
    A tracking session for an operation.
    
    Attributes:
        name: Session name.
        start_time: Start timestamp.
        end_time: End timestamp (None if ongoing).
        operations_total: Total operations to perform.
        operations_completed: Operations completed so far.
        snapshots: List of metric snapshots.
    """
    name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    operations_total: int = 0
    operations_completed: int = 0
    snapshots: List[MetricSnapshot] = field(default_factory=list)
    
    def get_elapsed_seconds(self) -> float:
        """Get elapsed time in seconds."""
        end = self.end_time or datetime.now()
        return (end - self.start_time).total_seconds()
    
    def get_progress_ratio(self) -> float:
        """Get progress ratio (0.0 to 1.0)."""
        if self.operations_total <= 0:
            return 0.0
        return min(1.0, self.operations_completed / self.operations_total)


class PerformanceMetrics:
    """
    Performance measurement and analysis.
    
    This class tracks various performance metrics including throughput,
    latency, memory usage, and efficiency.
    
    Example:
        >>> metrics = PerformanceMetrics()
        >>> metrics.record_operation(duration=0.5, items_processed=100)
        >>> stats = metrics.get_statistics()
    """
    
    def __init__(self):
        """Initialize performance metrics."""
        self.operation_count = 0
        self.total_duration = 0.0
        self.total_items = 0
        self.durations: List[float] = []
        self.max_duration = 0.0
        self.min_duration = float('inf')
        self.start_time = time.time()
    
    def record_operation(self, duration: float, items_processed: int = 1) -> None:
        """
        Record an operation.
        
        Args:
            duration: Operation duration in seconds.
            items_processed: Number of items processed.
        """
        self.operation_count += 1
        self.total_duration += duration
        self.total_items += items_processed
        self.durations.append(duration)
        
        self.max_duration = max(self.max_duration, duration)
        self.min_duration = min(self.min_duration, duration)
        
        # Keep only last 1000 durations to avoid memory issues
        if len(self.durations) > 1000:
            self.durations = self.durations[-1000:]
    
    def get_average_duration(self) -> float:
        """Get average operation duration."""
        if self.operation_count == 0:
            return 0.0
        return self.total_duration / self.operation_count
    
    def get_throughput(self) -> float:
        """Get operations per second."""
        elapsed = time.time() - self.start_time
        if elapsed <= 0:
            return 0.0
        return self.operation_count / elapsed
    
    def get_items_per_second(self) -> float:
        """Get items processed per second."""
        elapsed = time.time() - self.start_time
        if elapsed <= 0:
            return 0.0
        return self.total_items / elapsed
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get all statistics.
        
        Returns:
            Dictionary of performance statistics.
        """
        return {
            'operation_count': self.operation_count,
            'total_items': self.total_items,
            'total_duration': self.total_duration,
            'avg_duration': self.get_average_duration(),
            'min_duration': self.min_duration if self.min_duration != float('inf') else 0.0,
            'max_duration': self.max_duration,
            'throughput': self.get_throughput(),
            'items_per_second': self.get_items_per_second(),
        }
    
    def reset(self) -> None:
        """Reset all metrics."""
        self.operation_count = 0
        self.total_duration = 0.0
        self.total_items = 0
        self.durations.clear()
        self.max_duration = 0.0
        self.min_duration = float('inf')
        self.start_time = time.time()


class ProgressTracker:
    """
    Real-time progress tracking with ETA calculation.
    
    Example:
        >>> tracker = ProgressTracker(total=1000)
        >>> tracker.update(100)
        >>> print(tracker.get_eta())
    """
    
    def __init__(self, total: int = 100):
        """
        Initialize progress tracker.
        
        Args:
            total: Total number of operations.
        """
        self.total = total
        self.current = 0
        self.start_time = time.time()
        self.last_update_time = self.start_time
        self.rate_samples: List[float] = []
    
    def update(self, current: int) -> None:
        """
        Update current progress.
        
        Args:
            current: Current progress value.
        """
        self.current = current
        
        # Calculate rate
        now = time.time()
        elapsed = now - self.last_update_time
        if elapsed > 0:
            rate = (current - self.current) / elapsed
            self.rate_samples.append(rate)
            
            # Keep only last 10 samples
            if len(self.rate_samples) > 10:
                self.rate_samples = self.rate_samples[-10:]
        
        self.last_update_time = now
    
    def increment(self, amount: int = 1) -> None:
        """Increment progress by amount."""
        self.update(self.current + amount)
    
    def get_progress_ratio(self) -> float:
        """Get progress ratio (0.0 to 1.0)."""
        if self.total <= 0:
            return 0.0
        return min(1.0, self.current / self.total)
    
    def get_progress_percent(self) -> float:
        """Get progress percentage (0.0 to 100.0)."""
        return self.get_progress_ratio() * 100.0
    
    def get_elapsed_seconds(self) -> float:
        """Get elapsed time in seconds."""
        return time.time() - self.start_time
    
    def get_average_rate(self) -> float:
        """Get average processing rate."""
        elapsed = self.get_elapsed_seconds()
        if elapsed <= 0:
            return 0.0
        return self.current / elapsed
    
    def get_eta_seconds(self) -> float:
        """
        Get estimated time to completion in seconds.
        
        Returns:
            ETA in seconds, or -1 if cannot estimate.
        """
        rate = self.get_average_rate()
        if rate <= 0:
            return -1.0
        
        remaining = self.total - self.current
        return remaining / rate
    
    def get_eta_string(self) -> str:
        """
        Get ETA as a formatted string.
        
        Returns:
            ETA string (e.g., "2m 30s").
        """
        eta_seconds = self.get_eta_seconds()
        if eta_seconds < 0:
            return "Unknown"
        
        if eta_seconds < 60:
            return f"{int(eta_seconds)}s"
        elif eta_seconds < 3600:
            minutes = int(eta_seconds / 60)
            seconds = int(eta_seconds % 60)
            return f"{minutes}m {seconds}s"
        else:
            hours = int(eta_seconds / 3600)
            minutes = int((eta_seconds % 3600) / 60)
            return f"{hours}h {minutes}m"
    
    def is_complete(self) -> bool:
        """Check if progress is complete."""
        return self.current >= self.total


class StatsEngine:
    """
    Main statistics tracking and reporting engine.
    
    This class provides comprehensive statistics tracking for all
    operations including keyword generation, deduplication, and
    file operations.
    
    Features:
        - Real-time progress tracking
        - Performance metrics
        - Memory tracking
        - Time estimation
        - Detailed reporting
    
    Example:
        >>> stats = StatsEngine()
        >>> stats.start_tracking("generation")
        >>> stats.update_progress(500, 1000)
        >>> stats.print_summary()
    """
    
    def __init__(self):
        """Initialize statistics engine."""
        self.sessions: Dict[str, TrackingSession] = {}
        self.current_session: Optional[str] = None
        self.performance = PerformanceMetrics()
        self.lock = threading.Lock()
        
        # Global statistics
        self.total_keywords_generated = 0
        self.total_duplicates_removed = 0
        self.total_files_processed = 0
        self.total_bytes_written = 0
        
        # Timing
        self.app_start_time = datetime.now()
    
    def start_tracking(self, session_name: str, total_operations: int = 0) -> None:
        """
        Start a new tracking session.
        
        Args:
            session_name: Name of the session.
            total_operations: Total operations to perform.
            
        Example:
            >>> stats.start_tracking("generation", 10000)
        """
        with self.lock:
            session = TrackingSession(
                name=session_name,
                start_time=datetime.now(),
                operations_total=total_operations
            )
            self.sessions[session_name] = session
            self.current_session = session_name
    
    def end_tracking(self, session_name: Optional[str] = None) -> None:
        """
        End a tracking session.
        
        Args:
            session_name: Name of session to end (or current).
            
        Example:
            >>> stats.end_tracking("generation")
        """
        with self.lock:
            name = session_name or self.current_session
            if name and name in self.sessions:
                self.sessions[name].end_time = datetime.now()
    
    def update_progress(self, completed: int, total: Optional[int] = None,
                       memory_mb: float = 0.0) -> None:
        """
        Update progress for current session.
        
        Args:
            completed: Number of operations completed.
            total: Total operations (optional).
            memory_mb: Memory usage in MB.
            
        Example:
            >>> stats.update_progress(500, 1000, 128.5)
        """
        with self.lock:
            if not self.current_session:
                return
            
            session = self.sessions.get(self.current_session)
            if not session:
                return
            
            session.operations_completed = completed
            if total is not None:
                session.operations_total = total
            
            # Calculate rate
            elapsed = session.get_elapsed_seconds()
            rate = completed / elapsed if elapsed > 0 else 0.0
            
            # Create snapshot
            snapshot = MetricSnapshot(
                timestamp=datetime.now(),
                operations=completed,
                rate=rate,
                memory_mb=memory_mb,
                elapsed_time=elapsed
            )
            session.snapshots.append(snapshot)
            
            # Keep only last 100 snapshots
            if len(session.snapshots) > 100:
                session.snapshots = session.snapshots[-100:]
    
    def record_keywords_generated(self, count: int) -> None:
        """
        Record keywords generated.
        
        Args:
            count: Number of keywords generated.
        """
        with self.lock:
            self.total_keywords_generated += count
    
    def record_duplicates_removed(self, count: int) -> None:
        """
        Record duplicates removed.
        
        Args:
            count: Number of duplicates removed.
        """
        with self.lock:
            self.total_duplicates_removed += count
    
    def record_file_processed(self, filename: str, bytes_written: int = 0) -> None:
        """
        Record file processed.
        
        Args:
            filename: Name of file.
            bytes_written: Bytes written to file.
        """
        with self.lock:
            self.total_files_processed += 1
            self.total_bytes_written += bytes_written
    
    def get_session_stats(self, session_name: str) -> Optional[Dict[str, Any]]:
        """
        Get statistics for a session.
        
        Args:
            session_name: Name of session.
            
        Returns:
            Dictionary of session statistics or None.
        """
        with self.lock:
            session = self.sessions.get(session_name)
            if not session:
                return None
            
            elapsed = session.get_elapsed_seconds()
            rate = 0.0
            if elapsed > 0 and session.operations_completed > 0:
                rate = session.operations_completed / elapsed
            
            return {
                'name': session.name,
                'start_time': session.start_time.isoformat(),
                'end_time': session.end_time.isoformat() if session.end_time else None,
                'elapsed_seconds': elapsed,
                'operations_total': session.operations_total,
                'operations_completed': session.operations_completed,
                'progress_ratio': session.get_progress_ratio(),
                'progress_percent': session.get_progress_ratio() * 100,
                'rate': rate,
                'snapshots': len(session.snapshots),
            }
    
    def calculate_metrics(self) -> Dict[str, Any]:
        """
        Calculate all metrics.
        
        Returns:
            Dictionary of all metrics.
            
        Example:
            >>> metrics = stats.calculate_metrics()
            >>> print(metrics['total_keywords_generated'])
        """
        with self.lock:
            app_elapsed = (datetime.now() - self.app_start_time).total_seconds()
            
            # Calculate rates
            keywords_per_second = 0.0
            if app_elapsed > 0:
                keywords_per_second = self.total_keywords_generated / app_elapsed
            
            # Get current session stats
            current_stats = None
            if self.current_session:
                current_stats = self.get_session_stats(self.current_session)
            
            return {
                'app_elapsed_seconds': app_elapsed,
                'total_keywords_generated': self.total_keywords_generated,
                'total_duplicates_removed': self.total_duplicates_removed,
                'total_files_processed': self.total_files_processed,
                'total_bytes_written': self.total_bytes_written,
                'keywords_per_second': keywords_per_second,
                'current_session': current_stats,
                'performance': self.performance.get_statistics(),
            }
    
    def print_summary(self, detailed: bool = False) -> None:
        """
        Print statistics summary.
        
        Args:
            detailed: Whether to print detailed statistics.
            
        Example:
            >>> stats.print_summary()
        """
        metrics = self.calculate_metrics()
        
        print("\n" + "=" * 60)
        print(" STATISTICS SUMMARY")
        print("=" * 60)
        
        # Global stats
        print(f"\n📊 Global Statistics:")
        print(f"  • Keywords Generated: {metrics['total_keywords_generated']:,}")
        print(f"  • Duplicates Removed: {metrics['total_duplicates_removed']:,}")
        print(f"  • Files Processed: {metrics['total_files_processed']:,}")
        print(f"  • Data Written: {self._format_bytes(metrics['total_bytes_written'])}")
        print(f"  • Generation Rate: {metrics['keywords_per_second']:,.0f} keywords/sec")
        
        # Current session stats
        if metrics['current_session']:
            sess = metrics['current_session']
            print(f"\n⏱️  Current Session: {sess['name']}")
            print(f"  • Progress: {sess['progress_percent']:.1f}% ({sess['operations_completed']:,}/{sess['operations_total']:,})")
            print(f"  • Elapsed: {self._format_duration(sess['elapsed_seconds'])}")
            print(f"  • Rate: {sess['rate']:,.0f} ops/sec")
        
        # Performance stats
        if detailed:
            perf = metrics['performance']
            print(f"\n⚡ Performance Metrics:")
            print(f"  • Operations: {perf['operation_count']:,}")
            print(f"  • Avg Duration: {perf['avg_duration']:.3f}s")
            print(f"  • Throughput: {perf['throughput']:.2f} ops/sec")
            print(f"  • Items/sec: {perf['items_per_second']:,.0f}")
        
        print("\n" + "=" * 60 + "\n")
    
    def export_stats(self, filepath: Optional[str] = None) -> Dict[str, Any]:
        """
        Export all statistics to a dictionary or file.
        
        Args:
            filepath: Optional file path to save JSON.
            
        Returns:
            Dictionary of all statistics.
        """
        stats = {
            'timestamp': datetime.now().isoformat(),
            'metrics': self.calculate_metrics(),
            'sessions': {
                name: self.get_session_stats(name)
                for name in self.sessions.keys()
            }
        }
        
        if filepath:
            import json
            with open(filepath, 'w') as f:
                json.dump(stats, f, indent=2)
        
        return stats
    
    def _format_duration(self, seconds: float) -> str:
        """Format duration as human-readable string."""
        if seconds < 60:
            return f"{seconds:.1f}s"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            secs = int(seconds % 60)
            return f"{minutes}m {secs}s"
        else:
            hours = int(seconds / 3600)
            minutes = int((seconds % 3600) / 60)
            return f"{hours}h {minutes}m"
    
    def _format_bytes(self, bytes: int) -> str:
        """Format bytes as human-readable string."""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes < 1024.0:
                return f"{bytes:.2f} {unit}"
            bytes /= 1024.0
        return f"{bytes:.2f} PB"
    
    def reset_all(self) -> None:
        """Reset all statistics."""
        with self.lock:
            self.sessions.clear()
            self.current_session = None
            self.performance.reset()
            self.total_keywords_generated = 0
            self.total_duplicates_removed = 0
            self.total_files_processed = 0
            self.total_bytes_written = 0
            self.app_start_time = datetime.now()
    
    def __repr__(self) -> str:
        """String representation."""
        return (f"StatsEngine(keywords={self.total_keywords_generated}, "
                f"duplicates={self.total_duplicates_removed}, "
                f"files={self.total_files_processed})")
