"""
Encryption Utilities
====================

Secure encryption/decryption for sensitive data.

Author: Telegram API Checker Bot Team
Version: 1.0.0
"""

import hashlib
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from typing import Optional
import os


class Encryptor:
    """Handles encryption and decryption of sensitive data."""
    
    def __init__(self, key: Optional[str] = None):
        """
        Initialize encryptor.
        
        Args:
            key: Encryption key (generates new if not provided)
        """
        if key:
            self.key = key.encode() if isinstance(key, str) else key
        else:
            self.key = Fernet.generate_key()
        
        self.cipher = Fernet(self.key)
    
    def encrypt(self, data: str) -> str:
        """
        Encrypt data.
        
        Args:
            data: Plain text to encrypt
            
        Returns:
            Encrypted data as base64 string
        """
        encrypted = self.cipher.encrypt(data.encode())
        return base64.b64encode(encrypted).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt data.
        
        Args:
            encrypted_data: Encrypted data as base64 string
            
        Returns:
            Decrypted plain text
        """
        encrypted = base64.b64decode(encrypted_data.encode())
        decrypted = self.cipher.decrypt(encrypted)
        return decrypted.decode()
    
    def hash_password(self, password: str, salt: Optional[bytes] = None) -> tuple:
        """
        Hash password with salt.
        
        Args:
            password: Password to hash
            salt: Salt bytes (generates new if not provided)
            
        Returns:
            Tuple of (hashed_password, salt)
        """
        if salt is None:
            salt = os.urandom(32)
        
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000
        )
        
        key = kdf.derive(password.encode())
        hashed = base64.b64encode(key).decode()
        
        return hashed, salt
    
    def verify_password(
        self,
        password: str,
        hashed: str,
        salt: bytes
    ) -> bool:
        """
        Verify password against hash.
        
        Args:
            password: Password to verify
            hashed: Hashed password
            salt: Salt used for hashing
            
        Returns:
            True if password matches, False otherwise
        """
        new_hash, _ = self.hash_password(password, salt)
        return new_hash == hashed
    
    @staticmethod
    def generate_key() -> str:
        """Generate new encryption key."""
        return Fernet.generate_key().decode()
    
    @staticmethod
    def hash_string(s: str) -> str:
        """Simple SHA-256 hash of string."""
        return hashlib.sha256(s.encode()).hexdigest()


__all__ = ['Encryptor']
