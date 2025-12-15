"""
File Manager
============

Handles file operations for the bot.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

import os
import shutil
from pathlib import Path
from typing import List, Optional
import zipfile
import tarfile
import logging


class FileManager:
    """Manages file operations."""
    
    def __init__(self, base_dir: str = "./storage"):
        """Initialize file manager."""
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.logger = logging.getLogger(__name__)
    
    def create_directory(self, dir_path: str) -> Path:
        """Create directory if it doesn't exist."""
        path = self.base_dir / dir_path
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    def delete_directory(self, dir_path: str) -> bool:
        """Delete directory and its contents."""
        path = self.base_dir / dir_path
        try:
            if path.exists():
                shutil.rmtree(path)
            return True
        except Exception as e:
            self.logger.error(f"Failed to delete directory: {e}")
            return False
    
    def save_file(self, file_path: str, content: str) -> bool:
        """Save content to file."""
        path = self.base_dir / file_path
        path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            self.logger.error(f"Failed to save file: {e}")
            return False
    
    def read_file(self, file_path: str) -> Optional[str]:
        """Read file content."""
        path = self.base_dir / file_path
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            self.logger.error(f"Failed to read file: {e}")
            return None
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file."""
        path = self.base_dir / file_path
        
        try:
            if path.exists():
                path.unlink()
            return True
        except Exception as e:
            self.logger.error(f"Failed to delete file: {e}")
            return False
    
    def list_files(self, dir_path: str = "", pattern: str = "*") -> List[Path]:
        """List files in directory."""
        path = self.base_dir / dir_path
        
        try:
            return list(path.glob(pattern))
        except Exception as e:
            self.logger.error(f"Failed to list files: {e}")
            return []
    
    def create_zip(self, zip_path: str, files: List[str]) -> bool:
        """Create ZIP archive from files."""
        zip_file = self.base_dir / zip_path
        zip_file.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zf:
                for file_path in files:
                    full_path = self.base_dir / file_path
                    if full_path.exists():
                        zf.write(full_path, arcname=Path(file_path).name)
            return True
        except Exception as e:
            self.logger.error(f"Failed to create ZIP: {e}")
            return False
    
    def extract_zip(self, zip_path: str, extract_to: str) -> bool:
        """Extract ZIP archive."""
        zip_file = self.base_dir / zip_path
        extract_path = self.base_dir / extract_to
        
        try:
            with zipfile.ZipFile(zip_file, 'r') as zf:
                zf.extractall(extract_path)
            return True
        except Exception as e:
            self.logger.error(f"Failed to extract ZIP: {e}")
            return False
    
    def get_file_size(self, file_path: str) -> Optional[int]:
        """Get file size in bytes."""
        path = self.base_dir / file_path
        
        try:
            if path.exists():
                return path.stat().st_size
        except Exception as e:
            self.logger.error(f"Failed to get file size: {e}")
        
        return None
    
    def copy_file(self, source: str, destination: str) -> bool:
        """Copy file."""
        src = self.base_dir / source
        dst = self.base_dir / destination
        dst.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            shutil.copy2(src, dst)
            return True
        except Exception as e:
            self.logger.error(f"Failed to copy file: {e}")
            return False


__all__ = ['FileManager']
