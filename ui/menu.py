#!/usr/bin/env python3
"""
Menu Module - Interactive Terminal User Interface.

This module provides a comprehensive terminal-based menu system
with colored output, progress bars, and user interaction features.

Classes:
    Menu: Main menu system with interactive prompts.
    Banner: Application banner and branding.
    ProgressBar: Terminal progress bar display.

Example:
    >>> from ui.menu import Menu
    >>> menu = Menu()
    >>> action = menu.show_main_menu()
    >>> language = menu.select_language()
"""

import sys
import os
from typing import Optional, List, Dict, Any
from pathlib import Path

# Try to import tkinter for file dialogs
try:
    import tkinter as tk
    from tkinter import filedialog
    TKINTER_AVAILABLE = True
except ImportError:
    TKINTER_AVAILABLE = False

from ui.colors import Colors, ColorPrinter


class Banner:
    """
    Application banner and branding.
    
    Provides ASCII art banners and application information display.
    
    Example:
        >>> banner = Banner()
        >>> banner.print_main_banner()
    """
    
    MAIN_BANNER = """
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ███████╗██╗   ██╗███████╗██╗  ██╗██╗  ██╗██╗    ██╗            ║
║   ██╔════╝██║   ██║██╔════╝██║  ██║██║ ██╔╝██║    ██║            ║
║   ███████╗██║   ██║███████╗███████║█████╔╝ ██║ █╗ ██║            ║
║   ╚════██║██║   ██║╚════██║██╔══██║██╔═██╗ ██║███╗██║            ║
║   ███████║╚██████╔╝███████║██║  ██║██║  ██╗╚███╔███╔╝            ║
║   ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝             ║
║                                                                   ║
║              Advanced Keyword Generator v5.0                      ║
║              Professional OOP Implementation                      ║
║                                                                   ║
║              Author: @teoo6232-eng                                ║
║              Pure Python 3.10+ • Zero Dependencies                ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
"""
    
    FEATURES = [
        "✓ Multi-language keyword generation (IT, MX, DE, TW, AT)",
        "✓ Template-based generation with 30+ templates",
        "✓ Cryptographic random engine with entropy mixing",
        "✓ Real-time duplicate detection and removal",
        "✓ Password strength analysis (15+ checks)",
        "✓ Streaming support for 10M+ keywords",
        "✓ Memory efficient (max 2GB usage)",
        "✓ Performance tracking and statistics",
        "✓ Multiple output formats (TXT, CSV, JSON)",
        "✓ Deterministic mode for reproducible results",
    ]
    
    def __init__(self, enable_colors: bool = True):
        """
        Initialize banner.
        
        Args:
            enable_colors: Whether to use colored output.
        """
        self.enable_colors = enable_colors
        self.printer = ColorPrinter(enable_colors)
    
    def print_main_banner(self) -> None:
        """
        Print the main application banner.
        
        Example:
            >>> banner = Banner()
            >>> banner.print_main_banner()
        """
        self.printer.print_colored(self.MAIN_BANNER, Colors.CYAN)
    
    def print_features(self) -> None:
        """
        Print application features list.
        
        Example:
            >>> banner = Banner()
            >>> banner.print_features()
        """
        print("\n" + "═" * 70)
        self.printer.print_colored("  FEATURES", Colors.YELLOW + Colors.BOLD)
        print("═" * 70)
        for feature in self.FEATURES:
            self.printer.print_colored(f"  {feature}", Colors.GREEN)
        print("═" * 70 + "\n")
    
    def print_separator(self, char: str = "═", length: int = 70) -> None:
        """Print a separator line."""
        print(char * length)
    
    def print_header(self, text: str) -> None:
        """Print a section header."""
        print("\n" + "═" * 70)
        self.printer.print_colored(f"  {text}", Colors.CYAN + Colors.BOLD)
        print("═" * 70 + "\n")


class ProgressBar:
    """
    Terminal progress bar display.
    
    Displays progress bars with percentage, ETA, and rate information.
    
    Example:
        >>> progress = ProgressBar(total=100)
        >>> progress.update(50)
        >>> progress.finish()
    """
    
    def __init__(self, total: int = 100, width: int = 50,
                 prefix: str = "", suffix: str = "",
                 enable_colors: bool = True):
        """
        Initialize progress bar.
        
        Args:
            total: Total number of operations.
            width: Width of progress bar in characters.
            prefix: Prefix text before the bar.
            suffix: Suffix text after the bar.
            enable_colors: Whether to use colored output.
        """
        self.total = total
        self.width = width
        self.prefix = prefix
        self.suffix = suffix
        self.enable_colors = enable_colors
        self.printer = ColorPrinter(enable_colors)
        self.current = 0
        self.start_time = None
        self.last_print_length = 0
    
    def update(self, current: int, extra_info: str = "") -> None:
        """
        Update progress bar.
        
        Args:
            current: Current progress value.
            extra_info: Extra information to display.
        """
        import time
        
        if self.start_time is None:
            self.start_time = time.time()
        
        self.current = current
        ratio = min(1.0, current / max(1, self.total))
        percent = ratio * 100
        
        # Calculate filled/empty portions
        filled = int(self.width * ratio)
        empty = self.width - filled
        
        # Calculate ETA
        elapsed = time.time() - self.start_time
        if current > 0 and elapsed > 0:
            rate = current / elapsed
            remaining = (self.total - current) / rate if rate > 0 else 0
            eta_str = self._format_time(remaining)
            rate_str = f"{rate:.0f} ops/s"
        else:
            eta_str = "N/A"
            rate_str = "N/A"
        
        # Build progress bar
        bar = "█" * filled + "░" * empty
        
        # Build complete line
        line = f"\r{self.prefix}[{bar}] {percent:.1f}% | {current}/{self.total} | ETA: {eta_str} | {rate_str}"
        if extra_info:
            line += f" | {extra_info}"
        if self.suffix:
            line += f" {self.suffix}"
        
        # Clear previous line
        if self.last_print_length > 0:
            sys.stdout.write("\r" + " " * self.last_print_length + "\r")
        
        # Print new line
        if self.enable_colors:
            sys.stdout.write(f"{Colors.GREEN}{line}{Colors.RESET}")
        else:
            sys.stdout.write(line)
        
        sys.stdout.flush()
        self.last_print_length = len(line)
    
    def finish(self) -> None:
        """Finish progress bar display."""
        print()  # New line after progress bar
    
    def _format_time(self, seconds: float) -> str:
        """Format time in seconds to human-readable string."""
        if seconds < 0:
            return "N/A"
        elif seconds < 60:
            return f"{int(seconds)}s"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            secs = int(seconds % 60)
            return f"{minutes}m {secs}s"
        else:
            hours = int(seconds / 3600)
            minutes = int((seconds % 3600) / 60)
            return f"{hours}h {minutes}m"


class Menu:
    """
    Main interactive menu system.
    
    This class provides a comprehensive terminal-based menu system
    with user input validation, colored output, and file dialogs.
    
    Features:
        - Main menu with multiple actions
        - Language selection
        - Keyword count input with validation
        - File selection dialogs
        - Progress visualization
        - Error handling and user feedback
    
    Example:
        >>> menu = Menu()
        >>> action = menu.show_main_menu()
        >>> if action == "generate":
        ...     language = menu.select_language()
        ...     count = menu.get_keyword_count()
    """
    
    def __init__(self, enable_colors: bool = True, enable_file_dialogs: bool = True):
        """
        Initialize menu system.
        
        Args:
            enable_colors: Whether to use colored output.
            enable_file_dialogs: Whether to enable file dialogs.
        """
        self.enable_colors = enable_colors
        self.enable_file_dialogs = enable_file_dialogs and TKINTER_AVAILABLE
        self.printer = ColorPrinter(enable_colors)
        self.banner = Banner(enable_colors)
    
    def print_banner(self) -> None:
        """
        Print application banner.
        
        Example:
            >>> menu = Menu()
            >>> menu.print_banner()
        """
        self.clear_screen()
        self.banner.print_main_banner()
    
    def clear_screen(self) -> None:
        """Clear the terminal screen."""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def show_main_menu(self) -> str:
        """
        Show the main menu and get user choice.
        
        Returns:
            User action choice ("generate", "filter", "dedup", "exit").
            
        Example:
            >>> menu = Menu()
            >>> action = menu.show_main_menu()
        """
        self.print_banner()
        
        print("\n" + "═" * 70)
        self.printer.print_colored("  MAIN MENU", Colors.CYAN + Colors.BOLD)
        print("═" * 70 + "\n")
        
        options = [
            ("1", "Generate Keywords", "Create new keywords using templates"),
            ("2", "Filter Passwords", "Remove weak passwords from combos"),
            ("3", "Remove Duplicates", "Deduplicate keyword lists"),
            ("4", "Exit", "Exit the application"),
        ]
        
        for num, title, desc in options:
            self.printer.print_colored(f"  [{num}] ", Colors.YELLOW + Colors.BOLD, end="")
            self.printer.print_colored(title, Colors.WHITE + Colors.BOLD)
            self.printer.print_colored(f"      {desc}", Colors.DARK_GRAY)
            print()
        
        print("═" * 70)
        
        # Get user choice
        while True:
            choice = self._get_input("\nSelect option [1-4]: ", Colors.CYAN)
            
            if choice == "1":
                return "generate"
            elif choice == "2":
                return "filter"
            elif choice == "3":
                return "dedup"
            elif choice == "4":
                return "exit"
            else:
                self.printer.print_colored("✗ Invalid choice. Please select 1-4.", Colors.RED)
    
    def select_language(self) -> Optional[str]:
        """
        Show language selection menu.
        
        Returns:
            Selected language code or None if cancelled.
            
        Example:
            >>> menu = Menu()
            >>> language = menu.select_language()
        """
        print("\n" + "═" * 70)
        self.printer.print_colored("  SELECT LANGUAGE", Colors.CYAN + Colors.BOLD)
        print("═" * 70 + "\n")
        
        languages = [
            ("1", "IT", "Italian", "🇮🇹"),
            ("2", "MX", "Mexican Spanish", "🇲🇽"),
            ("3", "DE", "German", "🇩🇪"),
            ("4", "TW", "Taiwanese Mandarin", "🇹🇼"),
            ("5", "AT", "Austrian German", "🇦🇹"),
            ("0", "", "Cancel", "❌"),
        ]
        
        for num, code, name, flag in languages:
            if num == "0":
                print()
                self.printer.print_colored(f"  [{num}] {flag} {name}", Colors.DARK_GRAY)
            else:
                self.printer.print_colored(f"  [{num}] {flag} ", Colors.YELLOW, end="")
                self.printer.print_colored(f"{name}", Colors.WHITE + Colors.BOLD)
                self.printer.print_colored(f" ({code})", Colors.DARK_GRAY)
        
        print("\n" + "═" * 70)
        
        # Get user choice
        while True:
            choice = self._get_input("\nSelect language [1-5, 0=Cancel]: ", Colors.CYAN)
            
            if choice == "0":
                return None
            elif choice in ["1", "2", "3", "4", "5"]:
                lang_map = {"1": "IT", "2": "MX", "3": "DE", "4": "TW", "5": "AT"}
                return lang_map[choice]
            else:
                self.printer.print_colored("✗ Invalid choice. Please select 1-5 or 0.", Colors.RED)
    
    def get_keyword_count(self, min_count: int = 1, max_count: int = 10_000_000) -> int:
        """
        Get keyword count from user.
        
        Args:
            min_count: Minimum allowed count.
            max_count: Maximum allowed count.
            
        Returns:
            Number of keywords to generate.
            
        Example:
            >>> menu = Menu()
            >>> count = menu.get_keyword_count()
        """
        print("\n" + "═" * 70)
        self.printer.print_colored("  KEYWORD COUNT", Colors.CYAN + Colors.BOLD)
        print("═" * 70 + "\n")
        
        self.printer.print_colored(f"  Enter the number of keywords to generate.", Colors.WHITE)
        self.printer.print_colored(f"  Range: {min_count:,} - {max_count:,}", Colors.DARK_GRAY)
        self.printer.print_colored(f"  Recommended: 1,000 - 100,000", Colors.DARK_GRAY)
        
        print("\n" + "═" * 70)
        
        while True:
            count_str = self._get_input("\nKeyword count: ", Colors.CYAN)
            
            try:
                # Remove commas if present
                count_str = count_str.replace(",", "").replace(" ", "")
                count = int(count_str)
                
                if count < min_count:
                    self.printer.print_colored(f"✗ Count must be at least {min_count:,}.", Colors.RED)
                elif count > max_count:
                    self.printer.print_colored(f"✗ Count must be at most {max_count:,}.", Colors.RED)
                else:
                    self.printer.print_colored(f"✓ Generating {count:,} keywords.", Colors.GREEN)
                    return count
            
            except ValueError:
                self.printer.print_colored("✗ Invalid input. Please enter a number.", Colors.RED)
    
    def ask_deterministic(self) -> bool:
        """
        Ask if user wants deterministic mode.
        
        Returns:
            True if deterministic mode requested.
            
        Example:
            >>> menu = Menu()
            >>> deterministic = menu.ask_deterministic()
        """
        print("\n" + "═" * 70)
        self.printer.print_colored("  GENERATION MODE", Colors.CYAN + Colors.BOLD)
        print("═" * 70 + "\n")
        
        self.printer.print_colored("  Deterministic mode uses a seed for reproducible results.", Colors.WHITE)
        self.printer.print_colored("  Non-deterministic mode uses true randomness.", Colors.DARK_GRAY)
        
        print("\n" + "═" * 70)
        
        while True:
            choice = self._get_input("\nUse deterministic mode? [y/N]: ", Colors.CYAN).lower()
            
            if choice in ["y", "yes"]:
                return True
            elif choice in ["n", "no", ""]:
                return False
            else:
                self.printer.print_colored("✗ Please enter 'y' or 'n'.", Colors.RED)
    
    def select_file(self, title: str = "Select File") -> Optional[Path]:
        """
        Show file selection dialog or prompt.
        
        Args:
            title: Dialog title.
            
        Returns:
            Selected file path or None.
            
        Example:
            >>> menu = Menu()
            >>> filepath = menu.select_file()
        """
        if self.enable_file_dialogs:
            return self._select_file_dialog(title)
        else:
            return self._select_file_prompt(title)
    
    def _select_file_dialog(self, title: str) -> Optional[Path]:
        """Show file selection dialog using tkinter."""
        try:
            root = tk.Tk()
            root.withdraw()  # Hide the root window
            
            filepath = filedialog.askopenfilename(
                title=title,
                filetypes=[
                    ("Text files", "*.txt"),
                    ("CSV files", "*.csv"),
                    ("All files", "*.*")
                ]
            )
            
            root.destroy()
            
            if filepath:
                return Path(filepath)
            return None
        
        except Exception as e:
            self.printer.print_colored(f"✗ Error opening file dialog: {e}", Colors.RED)
            return self._select_file_prompt(title)
    
    def _select_file_prompt(self, title: str) -> Optional[Path]:
        """Show file selection prompt."""
        print("\n" + "═" * 70)
        self.printer.print_colored(f"  {title.upper()}", Colors.CYAN + Colors.BOLD)
        print("═" * 70 + "\n")
        
        filepath_str = self._get_input("Enter file path (or 'cancel'): ", Colors.CYAN)
        
        if filepath_str.lower() in ["cancel", "c", ""]:
            return None
        
        filepath = Path(filepath_str)
        
        if not filepath.exists():
            self.printer.print_colored(f"✗ File not found: {filepath}", Colors.RED)
            return None
        
        if not filepath.is_file():
            self.printer.print_colored(f"✗ Not a file: {filepath}", Colors.RED)
            return None
        
        return filepath
    
    def show_progress(self, current: int, total: int, extra_info: str = "") -> None:
        """
        Show progress bar.
        
        Args:
            current: Current progress.
            total: Total operations.
            extra_info: Extra information to display.
            
        Example:
            >>> menu = Menu()
            >>> menu.show_progress(50, 100)
        """
        progress = ProgressBar(total=total, enable_colors=self.enable_colors)
        progress.update(current, extra_info)
    
    def show_success(self, message: str) -> None:
        """
        Show success message.
        
        Args:
            message: Success message.
        """
        self.printer.print_colored(f"\n✓ {message}", Colors.GREEN + Colors.BOLD)
    
    def show_error(self, message: str) -> None:
        """
        Show error message.
        
        Args:
            message: Error message.
        """
        self.printer.print_colored(f"\n✗ {message}", Colors.RED + Colors.BOLD)
    
    def show_warning(self, message: str) -> None:
        """
        Show warning message.
        
        Args:
            message: Warning message.
        """
        self.printer.print_colored(f"\n⚠ {message}", Colors.YELLOW + Colors.BOLD)
    
    def show_info(self, message: str) -> None:
        """
        Show info message.
        
        Args:
            message: Info message.
        """
        self.printer.print_colored(f"\nℹ {message}", Colors.CYAN)
    
    def confirm(self, message: str, default: bool = False) -> bool:
        """
        Ask for user confirmation.
        
        Args:
            message: Confirmation message.
            default: Default value.
            
        Returns:
            True if confirmed.
            
        Example:
            >>> menu = Menu()
            >>> if menu.confirm("Delete file?"):
            ...     delete_file()
        """
        default_str = "[Y/n]" if default else "[y/N]"
        
        while True:
            choice = self._get_input(f"\n{message} {default_str}: ", Colors.YELLOW).lower()
            
            if choice in ["y", "yes"]:
                return True
            elif choice in ["n", "no"]:
                return False
            elif choice == "":
                return default
            else:
                self.printer.print_colored("✗ Please enter 'y' or 'n'.", Colors.RED)
    
    def pause(self, message: str = "Press Enter to continue...") -> None:
        """
        Pause and wait for user input.
        
        Args:
            message: Pause message.
        """
        self._get_input(f"\n{message}", Colors.DARK_GRAY)
    
    def _get_input(self, prompt: str, color: str = "") -> str:
        """
        Get user input with optional coloring.
        
        Args:
            prompt: Input prompt.
            color: Color code.
            
        Returns:
            User input string.
        """
        if self.enable_colors and color:
            return input(f"{color}{prompt}{Colors.RESET}")
        else:
            return input(prompt)
    
    def __repr__(self) -> str:
        """String representation."""
        return f"Menu(colors={self.enable_colors}, dialogs={self.enable_file_dialogs})"
