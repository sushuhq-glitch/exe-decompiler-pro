"""
Duplicate Remover Module
Removes duplicate lines from text files.
"""

from typing import List, Set


class DuplicateRemover:
    """
    Removes duplicate lines from files.
    """
    
    def __init__(self):
        """Initialize the duplicate remover."""
        pass
    
    def remove_duplicates(self, lines: List[str]) -> List[str]:
        """
        Remove duplicate lines while preserving order.
        
        Args:
            lines: List of lines to process
            
        Returns:
            List of unique lines in original order
        """
        seen: Set[str] = set()
        unique_lines: List[str] = []
        
        for line in lines:
            if line not in seen:
                seen.add(line)
                unique_lines.append(line)
        
        return unique_lines
    
    def process_file(self, filepath: str) -> tuple[List[str], int]:
        """
        Process a file and remove duplicates.
        
        Args:
            filepath: Path to the input file
            
        Returns:
            Tuple of (unique lines, number of duplicates removed)
        """
        # Read all lines
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = [line.strip() for line in f if line.strip()]
        
        original_count = len(lines)
        
        # Remove duplicates
        unique_lines = self.remove_duplicates(lines)
        
        duplicates_removed = original_count - len(unique_lines)
        
        return unique_lines, duplicates_removed
    
    def save_to_file(self, lines: List[str], filename: str) -> str:
        """
        Save unique lines to file.
        
        Args:
            lines: List of lines to save
            filename: Output filename
            
        Returns:
            Path to saved file
        """
        with open(filename, 'w', encoding='utf-8') as f:
            for line in lines:
                f.write(f"{line}\n")
        
        return filename
    
    def get_statistics(self, original_count: int, unique_count: int) -> dict:
        """
        Get statistics about duplicate removal.
        
        Args:
            original_count: Original number of lines
            unique_count: Number of unique lines
            
        Returns:
            Dictionary with statistics
        """
        duplicates = original_count - unique_count
        percentage = (duplicates / original_count * 100) if original_count > 0 else 0
        
        return {
            "original_count": original_count,
            "unique_count": unique_count,
            "duplicates_removed": duplicates,
            "percentage_removed": round(percentage, 2)
        }
