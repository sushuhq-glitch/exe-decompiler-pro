#!/usr/bin/env python3
"""
SUSHKW - Advanced Keyword Generator v5.0
Professional OOP Implementation

This is the main entry point for the keyword generator application.
It provides a complete terminal-based interface for:
- Generating keywords from templates
- Filtering weak passwords
- Removing duplicates
- Performance tracking and statistics

Author: @teoo6232-eng
License: MIT
Python: 3.10+
"""

import sys
import os
import logging
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from core.random_engine import RandomEngine
from core.keyword_engine import KeywordEngine
from core.template_engine import TemplateEngine
from core.deduplicator import Deduplicator
from core.password_analyzer import PasswordAnalyzer
from core.stats_engine import StatsEngine
from utils.file_manager import FileManager
from utils.logger import Logger
from ui.menu import Menu
from config import Config


class Application:
    """
    Main application orchestrator.
    
    This class coordinates all components of the keyword generator
    and provides the main application loop with menu-driven interface.
    
    Attributes:
        config: Configuration instance.
        logger: Logger instance.
        file_manager: File manager instance.
        random_engine: Random engine instance.
        template_engine: Template engine instance.
        keyword_engine: Keyword engine instance.
        deduplicator: Deduplicator instance.
        password_analyzer: Password analyzer instance.
        stats_engine: Statistics engine instance.
        menu: Menu instance.
    
    Example:
        >>> app = Application()
        >>> app.run()
    """
    
    def __init__(self):
        """
        Initialize application and all components.
        
        This method creates instances of all required components
        and sets up the application environment.
        """
        # Initialize configuration
        self.config = Config()
        
        # Initialize logger
        self.logger = Logger.get_logger(
            name="SUSHKW",
            level=logging.INFO,
            log_to_file=True,
            log_dir=self.config.LOGS_DIR
        )
        
        self.logger.info("=" * 70)
        self.logger.info(f"Starting {self.config.APP_NAME} v{self.config.VERSION}")
        self.logger.info("=" * 70)
        
        # Initialize file manager
        self.file_manager = FileManager()
        
        # Initialize random engine
        self.random_engine = RandomEngine(
            deterministic=self.config.DEFAULT_DETERMINISTIC,
            seed=self.config.DEFAULT_SEED
        )
        
        # Initialize template engine
        self.template_engine = TemplateEngine(
            random_engine=self.random_engine
        )
        
        # Initialize keyword engine
        self.keyword_engine = KeywordEngine(
            random_engine=self.random_engine,
            template_engine=self.template_engine
        )
        
        # Initialize deduplicator
        self.deduplicator = Deduplicator(
            use_bloom_filter=self.config.USE_BLOOM_FILTER,
            bloom_size=self.config.BLOOM_FILTER_SIZE,
            bloom_fpr=self.config.BLOOM_FILTER_FPR,
            max_memory_mb=self.config.MAX_DEDUP_MEMORY_MB
        )
        
        # Initialize password analyzer
        self.password_analyzer = PasswordAnalyzer(
            min_length=self.config.MIN_PASSWORD_LENGTH,
            min_score=self.config.MIN_PASSWORD_SCORE
        )
        
        # Initialize statistics engine
        self.stats_engine = StatsEngine()
        
        # Initialize menu
        self.menu = Menu(
            enable_colors=self.config.ENABLE_COLORS,
            enable_file_dialogs=self.config.ENABLE_FILE_DIALOGS
        )
        
        # Setup directories
        self._setup_directories()
        
        self.logger.info("All components initialized successfully")
    
    def _setup_directories(self) -> None:
        """
        Create necessary directories.
        
        Ensures that all required directories exist before
        the application starts processing.
        """
        directories = [
            self.config.OUTPUT_DIR,
            self.config.CACHE_DIR,
            self.config.LOGS_DIR,
        ]
        
        for directory in directories:
            try:
                directory.mkdir(parents=True, exist_ok=True)
                self.logger.debug(f"Directory ready: {directory}")
            except Exception as e:
                self.logger.error(f"Failed to create directory {directory}: {e}")
                raise
    
    def run(self) -> None:
        """
        Main application loop.
        
        This method displays the main menu and handles user actions
        until the user chooses to exit.
        
        Example:
            >>> app = Application()
            >>> app.run()
        """
        self.logger.info("Entering main application loop")
        
        try:
            while True:
                # Show main menu
                action = self.menu.show_main_menu()
                
                self.logger.info(f"User selected action: {action}")
                
                # Handle user action
                if action == "generate":
                    self._handle_generate()
                elif action == "filter":
                    self._handle_filter()
                elif action == "dedup":
                    self._handle_dedup()
                elif action == "exit":
                    self.logger.info("User requested exit")
                    self.menu.show_info("Thank you for using SUSHKW!")
                    break
                else:
                    self.logger.warning(f"Unknown action: {action}")
                    self.menu.show_error("Invalid action")
                
                # Pause before returning to menu
                self.menu.pause()
        
        except KeyboardInterrupt:
            self.logger.warning("Application interrupted by user (Ctrl+C)")
            self.menu.show_warning("\nApplication interrupted by user")
        
        except Exception as e:
            self.logger.error(f"Fatal error in main loop: {e}", exc_info=True)
            self.menu.show_error(f"Fatal error: {e}")
            raise
        
        finally:
            self.logger.info("Application shutting down")
            self.logger.info("=" * 70)
    
    def _handle_generate(self) -> None:
        """
        Handle keyword generation.
        
        This method guides the user through the keyword generation process:
        1. Select language
        2. Choose number of keywords
        3. Select generation mode (deterministic/random)
        4. Generate keywords
        5. Save to file
        """
        self.logger.info("Starting keyword generation workflow")
        
        # Select language
        language = self.menu.select_language()
        if not language:
            self.menu.show_info("Generation cancelled")
            self.logger.info("User cancelled language selection")
            return
        
        self.logger.info(f"Selected language: {language}")
        
        # Get keyword count
        count = self.menu.get_keyword_count(
            min_count=self.config.MIN_KEYWORD_COUNT,
            max_count=self.config.MAX_KEYWORD_COUNT
        )
        
        self.logger.info(f"Requested keyword count: {count:,}")
        
        # Ask about deterministic mode
        deterministic = self.menu.ask_deterministic()
        self.logger.info(f"Deterministic mode: {deterministic}")
        
        # Start statistics tracking
        self.stats_engine.start_tracking("generation", count)
        
        try:
            self.menu.show_info(f"Generating {count:,} keywords...")
            
            # Generate keywords
            keywords = self.keyword_engine.generate_batch(
                language=language,
                count=count,
                deterministic=deterministic,
                seed=42 if deterministic else None
            )
            
            self.logger.info(f"Generated {len(keywords):,} keywords")
            
            # Update statistics
            self.stats_engine.record_keywords_generated(len(keywords))
            
            # Remove duplicates
            self.menu.show_info("Removing duplicates...")
            unique_keywords = self.deduplicator.remove_duplicates(keywords)
            
            duplicates_removed = len(keywords) - len(unique_keywords)
            self.logger.info(f"Removed {duplicates_removed:,} duplicates")
            self.stats_engine.record_duplicates_removed(duplicates_removed)
            
            # Save to file
            self.menu.show_info("Saving keywords to file...")
            filename = self.file_manager.save_keywords(
                keywords=unique_keywords,
                language=language,
                format=self.config.DEFAULT_OUTPUT_FORMAT
            )
            
            self.logger.info(f"Saved to: {filename}")
            
            # Show success message
            self.menu.show_success(
                f"Generated {len(unique_keywords):,} unique keywords"
            )
            self.menu.show_success(f"Saved to: {filename}")
            
            # Show statistics
            self.stats_engine.end_tracking("generation")
            self.stats_engine.print_summary()
        
        except Exception as e:
            self.logger.error(f"Error during generation: {e}", exc_info=True)
            self.menu.show_error(f"Generation failed: {e}")
    
    def _handle_filter(self) -> None:
        """
        Handle password filtering.
        
        This method filters weak passwords from email:password combos:
        1. Select input file
        2. Load combos
        3. Analyze passwords
        4. Filter weak passwords
        5. Save strong passwords
        """
        self.logger.info("Starting password filtering workflow")
        
        # Select file
        filepath = self.menu.select_file("Select Combo File")
        if not filepath:
            self.menu.show_info("Filtering cancelled")
            self.logger.info("User cancelled file selection")
            return
        
        self.logger.info(f"Selected file: {filepath}")
        
        try:
            # Load file
            self.menu.show_info("Loading combos...")
            combos = self.file_manager.load_file(filepath)
            
            self.logger.info(f"Loaded {len(combos):,} combos")
            
            # Filter weak passwords
            self.menu.show_info("Analyzing passwords...")
            self.stats_engine.start_tracking("filtering", len(combos))
            
            strong_combos = self.password_analyzer.filter_weak_passwords(
                combos=combos,
                separator=self.config.COMBO_SEPARATOR
            )
            
            weak_count = len(combos) - len(strong_combos)
            self.logger.info(f"Filtered {weak_count:,} weak passwords")
            
            # Save results
            self.menu.show_info("Saving filtered combos...")
            filename = self.file_manager.save_keywords(
                keywords=strong_combos,
                language="filtered",
                format=self.config.DEFAULT_OUTPUT_FORMAT
            )
            
            self.logger.info(f"Saved to: {filename}")
            
            # Show success
            self.menu.show_success(
                f"Kept {len(strong_combos):,} strong passwords"
            )
            self.menu.show_success(f"Removed {weak_count:,} weak passwords")
            self.menu.show_success(f"Saved to: {filename}")
            
            # Show statistics
            self.stats_engine.end_tracking("filtering")
            self.stats_engine.print_summary()
        
        except Exception as e:
            self.logger.error(f"Error during filtering: {e}", exc_info=True)
            self.menu.show_error(f"Filtering failed: {e}")
    
    def _handle_dedup(self) -> None:
        """
        Handle deduplication.
        
        This method removes duplicates from a file:
        1. Select input file
        2. Load items
        3. Remove duplicates
        4. Save unique items
        """
        self.logger.info("Starting deduplication workflow")
        
        # Select file
        filepath = self.menu.select_file("Select File to Deduplicate")
        if not filepath:
            self.menu.show_info("Deduplication cancelled")
            self.logger.info("User cancelled file selection")
            return
        
        self.logger.info(f"Selected file: {filepath}")
        
        try:
            # Load file
            self.menu.show_info("Loading items...")
            items = self.file_manager.load_file(filepath)
            
            self.logger.info(f"Loaded {len(items):,} items")
            
            # Remove duplicates
            self.menu.show_info("Removing duplicates...")
            self.stats_engine.start_tracking("deduplication", len(items))
            
            unique_items = self.deduplicator.remove_duplicates(items)
            
            duplicates_removed = len(items) - len(unique_items)
            self.logger.info(f"Removed {duplicates_removed:,} duplicates")
            self.stats_engine.record_duplicates_removed(duplicates_removed)
            
            # Save results
            self.menu.show_info("Saving unique items...")
            filename = self.file_manager.save_keywords(
                keywords=unique_items,
                language="unique",
                format=self.config.DEFAULT_OUTPUT_FORMAT
            )
            
            self.logger.info(f"Saved to: {filename}")
            
            # Show success
            self.menu.show_success(
                f"Kept {len(unique_items):,} unique items"
            )
            self.menu.show_success(f"Removed {duplicates_removed:,} duplicates")
            self.menu.show_success(f"Saved to: {filename}")
            
            # Show statistics
            self.stats_engine.end_tracking("deduplication")
            self.stats_engine.print_summary()
        
        except Exception as e:
            self.logger.error(f"Error during deduplication: {e}", exc_info=True)
            self.menu.show_error(f"Deduplication failed: {e}")


def main():
    """
    Main entry point for the application.
    
    This function creates the application instance and starts
    the main loop. It handles any exceptions that occur during
    initialization or execution.
    """
    try:
        # Create and run application
        app = Application()
        app.run()
    
    except KeyboardInterrupt:
        print("\n\nApplication interrupted by user")
        sys.exit(0)
    
    except Exception as e:
        print(f"\n\nFatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
