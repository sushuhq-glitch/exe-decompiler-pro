"""
List Splitter Module
Splits large files into smaller parts.
"""

import math
from typing import List


class ListSplitter:
    """
    Splits files into smaller parts.
    """
    
    def __init__(self):
        """Initialize the list splitter."""
        pass
    
    def split_by_parts(self, lines: List[str], num_parts: int) -> List[List[str]]:
        """
        Split lines into N equal parts.
        
        Args:
            lines: List of lines to split
            num_parts: Number of parts to create
            
        Returns:
            List of line chunks
        """
        if num_parts <= 0:
            raise ValueError("Number of parts must be positive")
        
        total_lines = len(lines)
        lines_per_part = math.ceil(total_lines / num_parts)
        
        parts = []
        for i in range(0, total_lines, lines_per_part):
            parts.append(lines[i:i + lines_per_part])
        
        return parts
    
    def split_by_lines(self, lines: List[str], lines_per_part: int) -> List[List[str]]:
        """
        Split lines into parts with X lines each.
        
        Args:
            lines: List of lines to split
            lines_per_part: Number of lines per part
            
        Returns:
            List of line chunks
        """
        if lines_per_part <= 0:
            raise ValueError("Lines per part must be positive")
        
        parts = []
        for i in range(0, len(lines), lines_per_part):
            parts.append(lines[i:i + lines_per_part])
        
        return parts
    
    def process_file(self, filepath: str, split_mode: str, value: int) -> List[List[str]]:
        """
        Process a file and split it.
        
        Args:
            filepath: Path to the input file
            split_mode: "parts" or "lines"
            value: Number of parts or lines per part
            
        Returns:
            List of line chunks
        """
        # Read all lines
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = [line.strip() for line in f if line.strip()]
        
        if split_mode == "parts":
            return self.split_by_parts(lines, value)
        elif split_mode == "lines":
            return self.split_by_lines(lines, value)
        else:
            raise ValueError(f"Invalid split mode: {split_mode}")
    
    def save_parts(self, parts: List[List[str]], base_filename: str) -> List[str]:
        """
        Save parts to separate files.
        
        Args:
            parts: List of line chunks
            base_filename: Base filename for output files
            
        Returns:
            List of created filenames
        """
        created_files = []
        
        for i, part in enumerate(parts, 1):
            filename = f"{base_filename}_part{i}.txt"
            with open(filename, 'w', encoding='utf-8') as f:
                for line in part:
                    f.write(f"{line}\n")
            created_files.append(filename)
        
        return created_files
    
    def get_statistics(self, parts: List[List[str]]) -> dict:
        """
        Get statistics about the split operation.
        
        Args:
            parts: List of line chunks
            
        Returns:
            Dictionary with statistics
        """
        total_lines = sum(len(part) for part in parts)
        min_lines = min(len(part) for part in parts) if parts else 0
        max_lines = max(len(part) for part in parts) if parts else 0
        avg_lines = total_lines / len(parts) if parts else 0
        
        return {
            "num_parts": len(parts),
            "total_lines": total_lines,
            "min_lines_per_part": min_lines,
            "max_lines_per_part": max_lines,
            "avg_lines_per_part": round(avg_lines, 2)
        }
