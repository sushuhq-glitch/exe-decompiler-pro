"""
ANSI Color Support Module.

This module provides ANSI escape codes for terminal color output, supporting
cross-platform colored console output for enhanced user experience.

Classes:
    Colors: Collection of ANSI color codes and formatting utilities.

Example:
    >>> from ui.colors import Colors
    >>> print(f"{Colors.GREEN}Success!{Colors.RESET}")
    >>> print(Colors.colorize("Warning", Colors.YELLOW))
"""

import sys
import os
from typing import Optional


class Colors:
    """
    ANSI color codes and formatting utilities for terminal output.
    
    This class provides static methods and constants for colored terminal output
    using ANSI escape sequences. It automatically detects if the terminal supports
    colors and disables them if not supported.
    
    Attributes:
        RESET (str): Reset all formatting.
        BOLD (str): Bold text.
        DIM (str): Dim text.
        ITALIC (str): Italic text.
        UNDERLINE (str): Underlined text.
        BLINK (str): Blinking text.
        REVERSE (str): Reverse video.
        HIDDEN (str): Hidden text.
        BLACK (str): Black foreground color.
        RED (str): Red foreground color.
        GREEN (str): Green foreground color.
        YELLOW (str): Yellow foreground color.
        BLUE (str): Blue foreground color.
        MAGENTA (str): Magenta foreground color.
        CYAN (str): Cyan foreground color.
        WHITE (str): White foreground color.
        BG_BLACK (str): Black background color.
        BG_RED (str): Red background color.
        BG_GREEN (str): Green background color.
        BG_YELLOW (str): Yellow background color.
        BG_BLUE (str): Blue background color.
        BG_MAGENTA (str): Magenta background color.
        BG_CYAN (str): Cyan background color.
        BG_WHITE (str): White background color.
        BRIGHT_BLACK (str): Bright black (gray) foreground.
        BRIGHT_RED (str): Bright red foreground.
        BRIGHT_GREEN (str): Bright green foreground.
        BRIGHT_YELLOW (str): Bright yellow foreground.
        BRIGHT_BLUE (str): Bright blue foreground.
        BRIGHT_MAGENTA (str): Bright magenta foreground.
        BRIGHT_CYAN (str): Bright cyan foreground.
        BRIGHT_WHITE (str): Bright white foreground.
    """
    
    # Check if terminal supports colors
    _supports_color = (
        hasattr(sys.stdout, 'isatty') and sys.stdout.isatty() and
        os.environ.get('TERM') != 'dumb'
    ) or os.environ.get('FORCE_COLOR', '').lower() in ('1', 'true', 'yes')
    
    # Reset and formatting
    RESET = '\033[0m' if _supports_color else ''
    BOLD = '\033[1m' if _supports_color else ''
    DIM = '\033[2m' if _supports_color else ''
    ITALIC = '\033[3m' if _supports_color else ''
    UNDERLINE = '\033[4m' if _supports_color else ''
    BLINK = '\033[5m' if _supports_color else ''
    REVERSE = '\033[7m' if _supports_color else ''
    HIDDEN = '\033[8m' if _supports_color else ''
    
    # Foreground colors
    BLACK = '\033[30m' if _supports_color else ''
    RED = '\033[31m' if _supports_color else ''
    GREEN = '\033[32m' if _supports_color else ''
    YELLOW = '\033[33m' if _supports_color else ''
    BLUE = '\033[34m' if _supports_color else ''
    MAGENTA = '\033[35m' if _supports_color else ''
    CYAN = '\033[36m' if _supports_color else ''
    WHITE = '\033[37m' if _supports_color else ''
    DARK_GRAY = '\033[90m' if _supports_color else ''  # Alias for BRIGHT_BLACK
    
    # Background colors
    BG_BLACK = '\033[40m' if _supports_color else ''
    BG_RED = '\033[41m' if _supports_color else ''
    BG_GREEN = '\033[42m' if _supports_color else ''
    BG_YELLOW = '\033[43m' if _supports_color else ''
    BG_BLUE = '\033[44m' if _supports_color else ''
    BG_MAGENTA = '\033[45m' if _supports_color else ''
    BG_CYAN = '\033[46m' if _supports_color else ''
    BG_WHITE = '\033[47m' if _supports_color else ''
    
    # Bright foreground colors
    BRIGHT_BLACK = '\033[90m' if _supports_color else ''
    BRIGHT_RED = '\033[91m' if _supports_color else ''
    BRIGHT_GREEN = '\033[92m' if _supports_color else ''
    BRIGHT_YELLOW = '\033[93m' if _supports_color else ''
    BRIGHT_BLUE = '\033[94m' if _supports_color else ''
    BRIGHT_MAGENTA = '\033[95m' if _supports_color else ''
    BRIGHT_CYAN = '\033[96m' if _supports_color else ''
    BRIGHT_WHITE = '\033[97m' if _supports_color else ''
    
    @staticmethod
    def colorize(text: str, color: str, style: Optional[str] = None) -> str:
        """
        Apply color and optional style to text.
        
        Args:
            text: The text to colorize.
            color: ANSI color code to apply.
            style: Optional style (e.g., BOLD, ITALIC).
        
        Returns:
            Colorized text with reset code at the end.
        
        Example:
            >>> Colors.colorize("Hello", Colors.GREEN, Colors.BOLD)
            '\033[1m\033[32mHello\033[0m'
        """
        if not Colors._supports_color:
            return text
        
        prefix = f"{style}{color}" if style else color
        return f"{prefix}{text}{Colors.RESET}"
    
    @staticmethod
    def strip_colors(text: str) -> str:
        """
        Remove all ANSI color codes from text.
        
        Args:
            text: Text containing ANSI codes.
        
        Returns:
            Text with all ANSI codes removed.
        
        Example:
            >>> Colors.strip_colors("\033[32mHello\033[0m")
            'Hello'
        """
        import re
        ansi_escape = re.compile(r'\033\[[0-9;]*m')
        return ansi_escape.sub('', text)
    
    @staticmethod
    def enable_colors() -> None:
        """
        Force enable color support.
        
        This method enables color output even if terminal detection suggests
        colors are not supported. Useful for environments where colors are
        supported but not properly detected.
        """
        Colors._supports_color = True
        Colors._update_color_codes()
    
    @staticmethod
    def disable_colors() -> None:
        """
        Force disable color support.
        
        This method disables all color output, making all color codes empty strings.
        Useful for logging to files or environments where colors cause issues.
        """
        Colors._supports_color = False
        Colors._update_color_codes()
    
    @staticmethod
    def _update_color_codes() -> None:
        """
        Update all color codes based on current support status.
        
        This internal method refreshes all ANSI codes when color support
        is enabled or disabled at runtime.
        """
        supported = Colors._supports_color
        
        # Reset and formatting
        Colors.RESET = '\033[0m' if supported else ''
        Colors.BOLD = '\033[1m' if supported else ''
        Colors.DIM = '\033[2m' if supported else ''
        Colors.ITALIC = '\033[3m' if supported else ''
        Colors.UNDERLINE = '\033[4m' if supported else ''
        Colors.BLINK = '\033[5m' if supported else ''
        Colors.REVERSE = '\033[7m' if supported else ''
        Colors.HIDDEN = '\033[8m' if supported else ''
        
        # Foreground colors
        Colors.BLACK = '\033[30m' if supported else ''
        Colors.RED = '\033[31m' if supported else ''
        Colors.GREEN = '\033[32m' if supported else ''
        Colors.YELLOW = '\033[33m' if supported else ''
        Colors.BLUE = '\033[34m' if supported else ''
        Colors.MAGENTA = '\033[35m' if supported else ''
        Colors.CYAN = '\033[36m' if supported else ''
        Colors.WHITE = '\033[37m' if supported else ''
        
        # Background colors
        Colors.BG_BLACK = '\033[40m' if supported else ''
        Colors.BG_RED = '\033[41m' if supported else ''
        Colors.BG_GREEN = '\033[42m' if supported else ''
        Colors.BG_YELLOW = '\033[43m' if supported else ''
        Colors.BG_BLUE = '\033[44m' if supported else ''
        Colors.BG_MAGENTA = '\033[45m' if supported else ''
        Colors.BG_CYAN = '\033[46m' if supported else ''
        Colors.BG_WHITE = '\033[47m' if supported else ''
        
        # Bright foreground colors
        Colors.BRIGHT_BLACK = '\033[90m' if supported else ''
        Colors.BRIGHT_RED = '\033[91m' if supported else ''
        Colors.BRIGHT_GREEN = '\033[92m' if supported else ''
        Colors.BRIGHT_YELLOW = '\033[93m' if supported else ''
        Colors.BRIGHT_BLUE = '\033[94m' if supported else ''
        Colors.BRIGHT_MAGENTA = '\033[95m' if supported else ''
        Colors.BRIGHT_CYAN = '\033[96m' if supported else ''
        Colors.BRIGHT_WHITE = '\033[97m' if supported else ''
    
    @staticmethod
    def supports_color() -> bool:
        """
        Check if the terminal supports color output.
        
        Returns:
            True if colors are enabled, False otherwise.
        
        Example:
            >>> if Colors.supports_color():
            ...     print(f"{Colors.GREEN}Colors enabled{Colors.RESET}")
        """
        return Colors._supports_color
    
    @staticmethod
    def print_color_test() -> None:
        """
        Print a test pattern showing all available colors.
        
        This method displays all foreground and background colors with their
        names, useful for testing terminal color support and choosing colors.
        """
        print("\n=== Foreground Colors ===")
        colors = [
            ('BLACK', Colors.BLACK),
            ('RED', Colors.RED),
            ('GREEN', Colors.GREEN),
            ('YELLOW', Colors.YELLOW),
            ('BLUE', Colors.BLUE),
            ('MAGENTA', Colors.MAGENTA),
            ('CYAN', Colors.CYAN),
            ('WHITE', Colors.WHITE),
        ]
        
        for name, code in colors:
            print(f"{code}{name:15}{Colors.RESET} - Sample Text")
        
        print("\n=== Bright Foreground Colors ===")
        bright_colors = [
            ('BRIGHT_BLACK', Colors.BRIGHT_BLACK),
            ('BRIGHT_RED', Colors.BRIGHT_RED),
            ('BRIGHT_GREEN', Colors.BRIGHT_GREEN),
            ('BRIGHT_YELLOW', Colors.BRIGHT_YELLOW),
            ('BRIGHT_BLUE', Colors.BRIGHT_BLUE),
            ('BRIGHT_MAGENTA', Colors.BRIGHT_MAGENTA),
            ('BRIGHT_CYAN', Colors.BRIGHT_CYAN),
            ('BRIGHT_WHITE', Colors.BRIGHT_WHITE),
        ]
        
        for name, code in bright_colors:
            print(f"{code}{name:15}{Colors.RESET} - Sample Text")
        
        print("\n=== Text Styles ===")
        styles = [
            ('BOLD', Colors.BOLD),
            ('DIM', Colors.DIM),
            ('ITALIC', Colors.ITALIC),
            ('UNDERLINE', Colors.UNDERLINE),
        ]
        
        for name, code in styles:
            print(f"{code}{name:15}{Colors.RESET} - Sample Text")
        
        print("\n=== Background Colors ===")
        bg_colors = [
            ('BG_BLACK', Colors.BG_BLACK),
            ('BG_RED', Colors.BG_RED),
            ('BG_GREEN', Colors.BG_GREEN),
            ('BG_YELLOW', Colors.BG_YELLOW),
            ('BG_BLUE', Colors.BG_BLUE),
            ('BG_MAGENTA', Colors.BG_MAGENTA),
            ('BG_CYAN', Colors.BG_CYAN),
            ('BG_WHITE', Colors.BG_WHITE),
        ]
        
        for name, code in bg_colors:
            print(f"{code}{Colors.BLACK}{name:15}{Colors.RESET} - Sample Text")
        
        print()


class ColorPrinter:
    """
    Utility class for printing colored text.
    
    This class provides convenient methods for printing text with colors,
    with optional enable/disable support.
    
    Attributes:
        enabled: Whether colors are enabled.
    
    Example:
        >>> printer = ColorPrinter(enabled=True)
        >>> printer.print_colored("Success!", Colors.GREEN)
    """
    
    def __init__(self, enabled: bool = True):
        """
        Initialize color printer.
        
        Args:
            enabled: Whether to enable colors.
        """
        # Check if terminal supports colors
        import sys
        supports_color = (
            hasattr(sys.stdout, 'isatty') and sys.stdout.isatty() and
            os.environ.get('TERM') != 'dumb'
        )
        self.enabled = enabled and supports_color
    
    def print_colored(self, text: str, color: str = "", end: str = "\n") -> None:
        """
        Print text with optional color.
        
        Args:
            text: Text to print.
            color: Color code.
            end: End character (default newline).
        """
        if self.enabled and color:
            print(f"{color}{text}{Colors.RESET}", end=end)
        else:
            print(text, end=end)
    
    def colorize(self, text: str, color: str = "") -> str:
        """
        Colorize text and return the string.
        
        Args:
            text: Text to colorize.
            color: Color code.
            
        Returns:
            Colored text string.
        """
        if self.enabled and color:
            return f"{color}{text}{Colors.RESET}"
        return text
