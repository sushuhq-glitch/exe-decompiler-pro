"""
File I/O Management Module.

This module provides comprehensive file I/O operations with streaming support,
multiple format handlers, checksum calculation, and atomic operations.

Classes:
    FileManager: Comprehensive file I/O management system.

Example:
    >>> from utils.file_manager import FileManager
    >>> fm = FileManager()
    >>> fm.write_lines("output.txt", ["line1", "line2"])
    >>> lines = fm.read_lines("output.txt")
"""

import os
import hashlib
import json
import csv
from typing import List, Optional, Iterator, Dict, Any
from pathlib import Path
from contextlib import contextmanager
import tempfile
import shutil

class FileManager:
    """
    Comprehensive file I/O management system.
    
    This class provides advanced file operations including:
    - Streaming I/O for large files
    - Multiple format support (txt, csv, json)
    - Checksum calculation (MD5, SHA256)
    - Atomic write operations
    - File dialog integration
    
    Attributes:
        BUFFER_SIZE (int): Buffer size for streaming (8192 bytes).
        SUPPORTED_FORMATS (List[str]): Supported file formats.
    
    Example:
        >>> fm = FileManager()
        >>> fm.write_lines("output.txt", ["line1", "line2"])
        >>> lines = list(fm.stream_lines("output.txt"))
    """
    
    BUFFER_SIZE = 8192
    SUPPORTED_FORMATS = ["txt", "csv", "json"]
    
    def __init__(self):
        """Initialize FileManager."""
        pass
    
    def write_lines(
        self,
        file_path: Path | str,
        lines: List[str],
        mode: str = "w",
        encoding: str = "utf-8",
        atomic: bool = True
    ) -> int:
        """
        Write lines to file.
        
        Args:
            file_path: Path to output file.
            lines: List of lines to write.
            mode: Write mode ('w' or 'a').
            encoding: File encoding.
            atomic: Use atomic write operation.
        
        Returns:
            Number of lines written.
        
        Example:
            >>> fm = FileManager()
            >>> count = fm.write_lines("test.txt", ["line1", "line2"])
            >>> count
            2
        """
        file_path = Path(file_path)
        
        if atomic and mode == "w":
            return self._atomic_write_lines(file_path, lines, encoding)
        
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, mode, encoding=encoding, buffering=self.BUFFER_SIZE) as f:
            for line in lines:
                f.write(line)
                if not line.endswith("\n"):
                    f.write("\n")
        
        return len(lines)
    
    def _atomic_write_lines(
        self,
        file_path: Path,
        lines: List[str],
        encoding: str
    ) -> int:
        """
        Write lines atomically using temporary file.
        
        Args:
            file_path: Target file path.
            lines: Lines to write.
            encoding: File encoding.
        
        Returns:
            Number of lines written.
        """
        file_path = Path(file_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Create temporary file in same directory
        temp_fd, temp_path = tempfile.mkstemp(
            dir=file_path.parent,
            prefix=f".tmp_{file_path.name}_"
        )
        
        try:
            with os.fdopen(temp_fd, "w", encoding=encoding) as f:
                for line in lines:
                    f.write(line)
                    if not line.endswith("\n"):
                        f.write("\n")
            
            # Atomic replace
            shutil.move(temp_path, file_path)
            return len(lines)
        
        except Exception:
            # Clean up on error
            try:
                os.unlink(temp_path)
            except OSError:
                pass
            raise
    
    def read_lines(
        self,
        file_path: Path | str,
        encoding: str = "utf-8",
        strip: bool = True
    ) -> List[str]:
        """
        Read all lines from file.
        
        Args:
            file_path: Path to input file.
            encoding: File encoding.
            strip: Strip whitespace from lines.
        
        Returns:
            List of lines.
        
        Example:
            >>> fm = FileManager()
            >>> lines = fm.read_lines("test.txt")
        """
        file_path = Path(file_path)
        
        with open(file_path, "r", encoding=encoding) as f:
            if strip:
                return [line.strip() for line in f]
            return [line.rstrip("\n") for line in f]
    
    def stream_lines(
        self,
        file_path: Path | str,
        encoding: str = "utf-8",
        strip: bool = True
    ) -> Iterator[str]:
        """
        Stream lines from file (memory efficient).
        
        Args:
            file_path: Path to input file.
            encoding: File encoding.
            strip: Strip whitespace from lines.
        
        Yields:
            Individual lines.
        
        Example:
            >>> fm = FileManager()
            >>> for line in fm.stream_lines("large_file.txt"):
            ...     process(line)
        """
        file_path = Path(file_path)
        
        with open(file_path, "r", encoding=encoding, buffering=self.BUFFER_SIZE) as f:
            for line in f:
                if strip:
                    yield line.strip()
                else:
                    yield line.rstrip("\n")
    
    def write_json(
        self,
        file_path: Path | str,
        data: Any,
        indent: int = 2,
        encoding: str = "utf-8"
    ) -> None:
        """
        Write data to JSON file.
        
        Args:
            file_path: Output file path.
            data: Data to write.
            indent: JSON indentation.
            encoding: File encoding.
        
        Example:
            >>> fm = FileManager()
            >>> fm.write_json("data.json", {"key": "value"})
        """
        file_path = Path(file_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, "w", encoding=encoding) as f:
            json.dump(data, f, indent=indent, ensure_ascii=False)
    
    def read_json(
        self,
        file_path: Path | str,
        encoding: str = "utf-8"
    ) -> Any:
        """
        Read JSON file.
        
        Args:
            file_path: Input file path.
            encoding: File encoding.
        
        Returns:
            Parsed JSON data.
        
        Example:
            >>> fm = FileManager()
            >>> data = fm.read_json("data.json")
        """
        file_path = Path(file_path)
        
        with open(file_path, "r", encoding=encoding) as f:
            return json.load(f)
    
    def write_csv(
        self,
        file_path: Path | str,
        rows: List[List[str]],
        headers: Optional[List[str]] = None,
        encoding: str = "utf-8"
    ) -> int:
        """
        Write rows to CSV file.
        
        Args:
            file_path: Output file path.
            rows: List of rows to write.
            headers: Optional column headers.
            encoding: File encoding.
        
        Returns:
            Number of rows written.
        
        Example:
            >>> fm = FileManager()
            >>> fm.write_csv("data.csv", [["a", "b"], ["c", "d"]])
        """
        file_path = Path(file_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, "w", newline="", encoding=encoding) as f:
            writer = csv.writer(f)
            
            if headers:
                writer.writerow(headers)
            
            writer.writerows(rows)
        
        return len(rows)
    
    def read_csv(
        self,
        file_path: Path | str,
        encoding: str = "utf-8",
        has_header: bool = False
    ) -> List[List[str]]:
        """
        Read CSV file.
        
        Args:
            file_path: Input file path.
            encoding: File encoding.
            has_header: Whether first row is header.
        
        Returns:
            List of rows.
        
        Example:
            >>> fm = FileManager()
            >>> rows = fm.read_csv("data.csv")
        """
        file_path = Path(file_path)
        
        with open(file_path, "r", newline="", encoding=encoding) as f:
            reader = csv.reader(f)
            
            if has_header:
                next(reader, None)  # Skip header
            
            return list(reader)
    
    def calculate_checksum(
        self,
        file_path: Path | str,
        algorithm: str = "md5"
    ) -> str:
        """
        Calculate file checksum.
        
        Args:
            file_path: File to checksum.
            algorithm: Hash algorithm ('md5' or 'sha256').
        
        Returns:
            Hexadecimal checksum string.
        
        Example:
            >>> fm = FileManager()
            >>> checksum = fm.calculate_checksum("file.txt", "md5")
        """
        file_path = Path(file_path)
        
        if algorithm.lower() == "md5":
            hasher = hashlib.md5()
        elif algorithm.lower() == "sha256":
            hasher = hashlib.sha256()
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        with open(file_path, "rb") as f:
            while chunk := f.read(self.BUFFER_SIZE):
                hasher.update(chunk)
        
        return hasher.hexdigest()
    
    def calculate_data_checksum(
        self,
        data: bytes,
        algorithm: str = "md5"
    ) -> str:
        """
        Calculate checksum of data in memory.
        
        Args:
            data: Data to checksum.
            algorithm: Hash algorithm.
        
        Returns:
            Hexadecimal checksum string.
        
        Example:
            >>> fm = FileManager()
            >>> checksum = fm.calculate_data_checksum(b"test data")
        """
        if algorithm.lower() == "md5":
            hasher = hashlib.md5()
        elif algorithm.lower() == "sha256":
            hasher = hashlib.sha256()
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        hasher.update(data)
        return hasher.hexdigest()
    
    def file_exists(self, file_path: Path | str) -> bool:
        """Check if file exists."""
        return Path(file_path).exists()
    
    def get_file_size(self, file_path: Path | str) -> int:
        """Get file size in bytes."""
        return Path(file_path).stat().st_size
    
    def count_lines(self, file_path: Path | str) -> int:
        """
        Count lines in file efficiently.
        
        Args:
            file_path: File to count lines in.
        
        Returns:
            Number of lines.
        
        Example:
            >>> fm = FileManager()
            >>> count = fm.count_lines("large_file.txt")
        """
        count = 0
        with open(file_path, "rb") as f:
            for _ in f:
                count += 1
        return count
    
    def select_file_dialog(
        self,
        title: str = "Select File",
        file_types: Optional[List[tuple]] = None
    ) -> Optional[Path]:
        """
        Show file selection dialog using tkinter.
        
        Args:
            title: Dialog title.
            file_types: List of (description, pattern) tuples.
        
        Returns:
            Selected file path or None if cancelled.
        
        Example:
            >>> fm = FileManager()
            >>> path = fm.select_file_dialog("Select CSV", [("CSV", "*.csv")])
        """
        try:
            import tkinter as tk
            from tkinter import filedialog
            
            root = tk.Tk()
            root.withdraw()
            
            if file_types is None:
                file_types = [("All Files", "*.*")]
            
            file_path = filedialog.askopenfilename(
                title=title,
                filetypes=file_types
            )
            
            root.destroy()
            
            return Path(file_path) if file_path else None
        
        except ImportError:
            # tkinter not available
            return None
    
    def save_file_dialog(
        self,
        title: str = "Save File",
        default_name: str = "output.txt",
        file_types: Optional[List[tuple]] = None
    ) -> Optional[Path]:
        """
        Show save file dialog using tkinter.
        
        Args:
            title: Dialog title.
            default_name: Default filename.
            file_types: List of (description, pattern) tuples.
        
        Returns:
            Selected file path or None if cancelled.
        
        Example:
            >>> fm = FileManager()
            >>> path = fm.save_file_dialog("Save As", "keywords.txt")
        """
        try:
            import tkinter as tk
            from tkinter import filedialog
            
            root = tk.Tk()
            root.withdraw()
            
            if file_types is None:
                file_types = [("All Files", "*.*")]
            
            file_path = filedialog.asksaveasfilename(
                title=title,
                initialfile=default_name,
                filetypes=file_types
            )
            
            root.destroy()
            
            return Path(file_path) if file_path else None
        
        except ImportError:
            # tkinter not available
            return None
    
    @contextmanager
    def open_stream(
        self,
        file_path: Path | str,
        mode: str = "r",
        encoding: str = "utf-8"
    ):
        """
        Context manager for file streaming.
        
        Args:
            file_path: File path.
            mode: Open mode.
            encoding: File encoding.
        
        Yields:
            File handle.
        
        Example:
            >>> fm = FileManager()
            >>> with fm.open_stream("file.txt") as f:
            ...     for line in f:
            ...         process(line)
        """
        file_path = Path(file_path)
        
        if "w" in mode or "a" in mode:
            file_path.parent.mkdir(parents=True, exist_ok=True)
        
        f = open(file_path, mode, encoding=encoding, buffering=self.BUFFER_SIZE)
        try:
            yield f
        finally:
            f.close()
