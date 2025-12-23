"""
IL TOOL DI CARPANO - Main Application
Professional toolkit with modern GUI using customtkinter.

Author: @teoo6232-eng
Version: 1.0.0
"""

import customtkinter as ctk
from tkinter import filedialog, messagebox
import os
import time
from datetime import datetime
from threading import Thread

# Import tool modules
from tools.keyword_generator import KeywordGenerator
from tools.password_checker import PasswordChecker
from tools.duplicate_remover import DuplicateRemover
from tools.email_extractor import EmailExtractor
from tools.list_splitter import ListSplitter


# Set appearance and color theme
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")


class CarpanoTool(ctk.CTk):
    """
    Main application window for IL TOOL DI CARPANO.
    """
    
    # Color scheme - Red and Black
    COLORS = {
        "bg_primary": "#0d0d0d",      # Almost black
        "bg_secondary": "#1a1a1a",    # Dark gray
        "bg_sidebar": "#000000",      # Pure black
        "accent_red": "#dc143c",      # Crimson red
        "accent_red_hover": "#ff1744",# Bright red for hover
        "text_primary": "#ffffff",    # White
        "text_secondary": "#b0b0b0",  # Light gray
        "success": "#00ff00",         # Green for success
        "error": "#ff0000",           # Red for errors
    }
    
    def __init__(self):
        """Initialize the main application window."""
        super().__init__()
        
        # Configure window
        self.title("IL TOOL DI CARPANO")
        self.geometry("1200x700")
        self.minsize(1000, 600)
        
        # Set window icon (if available)
        try:
            self.iconbitmap("assets/icon.ico")
        except:
            pass
        
        # Initialize tool modules
        self.keyword_gen = KeywordGenerator()
        self.password_checker = PasswordChecker()
        self.duplicate_remover = DuplicateRemover()
        self.email_extractor = EmailExtractor()
        self.list_splitter = ListSplitter()
        
        # Current active frame
        self.current_frame = None
        
        # Setup UI
        self._setup_ui()
        
        # Show welcome screen by default
        self.show_welcome()
    
    def _setup_ui(self):
        """Setup the main UI layout."""
        # Configure grid
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)
        
        # Create sidebar
        self._create_sidebar()
        
        # Create main content area
        self._create_main_content()
    
    def _create_sidebar(self):
        """Create the sidebar with navigation buttons."""
        self.sidebar = ctk.CTkFrame(
            self,
            width=250,
            corner_radius=0,
            fg_color=self.COLORS["bg_sidebar"]
        )
        self.sidebar.grid(row=0, column=0, sticky="nsew", padx=0, pady=0)
        self.sidebar.grid_rowconfigure(8, weight=1)
        
        # Header
        header = ctk.CTkLabel(
            self.sidebar,
            text="IL TOOL DI\nCARPANO",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=self.COLORS["accent_red"]
        )
        header.grid(row=0, column=0, padx=20, pady=(30, 40))
        
        # Navigation buttons
        self.nav_buttons = []
        
        tools = [
            ("Home", "home", "🏠"),
            ("Keyword Generator", "keyword_gen", "🔑"),
            ("Password Checker", "password_check", "🔒"),
            ("Duplicate Remover", "duplicate_rem", "🗑️"),
            ("Email Extractor", "email_ext", "📧"),
            ("List Splitter", "list_split", "✂️"),
        ]
        
        for i, (name, key, icon) in enumerate(tools, start=1):
            btn = ctk.CTkButton(
                self.sidebar,
                text=f"  {name}",
                command=lambda k=key: self.switch_tool(k),
                font=ctk.CTkFont(size=14),
                height=45,
                corner_radius=8,
                fg_color="transparent",
                text_color=self.COLORS["text_secondary"],
                hover_color=self.COLORS["bg_secondary"],
                anchor="w"
            )
            btn.grid(row=i, column=0, padx=15, pady=5, sticky="ew")
            self.nav_buttons.append(btn)
        
        # Footer info
        footer = ctk.CTkLabel(
            self.sidebar,
            text="v1.0.0\n@teoo6232-eng",
            font=ctk.CTkFont(size=10),
            text_color=self.COLORS["text_secondary"]
        )
        footer.grid(row=9, column=0, padx=20, pady=20)
    
    def _create_main_content(self):
        """Create the main content area."""
        self.main_container = ctk.CTkFrame(
            self,
            corner_radius=0,
            fg_color=self.COLORS["bg_primary"]
        )
        self.main_container.grid(row=0, column=1, sticky="nsew", padx=0, pady=0)
        self.main_container.grid_rowconfigure(1, weight=1)
        self.main_container.grid_columnconfigure(0, weight=1)
        
        # Top header bar
        self.header_bar = ctk.CTkFrame(
            self.main_container,
            height=60,
            corner_radius=0,
            fg_color=self.COLORS["bg_secondary"]
        )
        self.header_bar.grid(row=0, column=0, sticky="ew", padx=0, pady=0)
        
        self.header_title = ctk.CTkLabel(
            self.header_bar,
            text="IL TOOL DI CARPANO",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=self.COLORS["accent_red"]
        )
        self.header_title.pack(side="left", padx=30, pady=15)
        
        # Content frame (where tools will be displayed)
        self.content_frame = ctk.CTkFrame(
            self.main_container,
            corner_radius=0,
            fg_color=self.COLORS["bg_primary"]
        )
        self.content_frame.grid(row=1, column=0, sticky="nsew", padx=0, pady=0)
    
    def switch_tool(self, tool_key: str):
        """Switch to a different tool."""
        # Clear current content
        for widget in self.content_frame.winfo_children():
            widget.destroy()
        
        # Update header and show appropriate tool
        if tool_key == "home":
            self.show_welcome()
        elif tool_key == "keyword_gen":
            self.show_keyword_generator()
        elif tool_key == "password_check":
            self.show_password_checker()
        elif tool_key == "duplicate_rem":
            self.show_duplicate_remover()
        elif tool_key == "email_ext":
            self.show_email_extractor()
        elif tool_key == "list_split":
            self.show_list_splitter()
    
    def show_welcome(self):
        """Show welcome screen."""
        frame = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        frame.pack(expand=True, fill="both", padx=50, pady=50)
        
        title = ctk.CTkLabel(
            frame,
            text="Benvenuto in IL TOOL DI CARPANO",
            font=ctk.CTkFont(size=32, weight="bold"),
            text_color=self.COLORS["accent_red"]
        )
        title.pack(pady=(50, 20))
        
        desc = ctk.CTkLabel(
            frame,
            text="Suite professionale di strumenti per la gestione di keyword, password e liste.\n\n"
                 "Seleziona uno strumento dalla sidebar per iniziare.",
            font=ctk.CTkFont(size=16),
            text_color=self.COLORS["text_secondary"],
            justify="center"
        )
        desc.pack(pady=20)
        
        # Feature list
        features_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        features_frame.pack(pady=30, padx=50, fill="x")
        
        features = [
            ("Keyword Generator", "Genera keyword per diverse lingue"),
            ("Password Checker", "Analizza la forza delle password"),
            ("Duplicate Remover", "Rimuovi duplicati dai file"),
            ("Email Extractor", "Estrai email da testo o file"),
            ("List Splitter", "Dividi file in parti più piccole"),
        ]
        
        for name, desc in features:
            f = ctk.CTkFrame(features_frame, fg_color="transparent")
            f.pack(fill="x", padx=20, pady=10)
            
            ctk.CTkLabel(
                f,
                text=f"• {name}",
                font=ctk.CTkFont(size=14, weight="bold"),
                text_color=self.COLORS["accent_red"],
                anchor="w"
            ).pack(side="left", padx=10)
            
            ctk.CTkLabel(
                f,
                text=desc,
                font=ctk.CTkFont(size=12),
                text_color=self.COLORS["text_secondary"],
                anchor="w"
            ).pack(side="left", padx=10)
    
    def show_keyword_generator(self):
        """Show keyword generator tool."""
        frame = ctk.CTkScrollableFrame(
            self.content_frame,
            fg_color="transparent"
        )
        frame.pack(expand=True, fill="both", padx=30, pady=30)
        
        # Title
        title = ctk.CTkLabel(
            frame,
            text="Keyword Generator",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=self.COLORS["accent_red"]
        )
        title.pack(anchor="w", pady=(0, 20))
        
        # Language selection
        lang_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        lang_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(
            lang_frame,
            text="Lingua:",
            font=ctk.CTkFont(size=14, weight="bold")
        ).grid(row=0, column=0, padx=20, pady=15, sticky="w")
        
        self.kg_language = ctk.CTkOptionMenu(
            lang_frame,
            values=["IT - Italiano", "DE - Deutsch", "MX - Español", "TW - 中文", "AT - Österreich"],
            fg_color=self.COLORS["accent_red"],
            button_color=self.COLORS["accent_red_hover"],
            button_hover_color=self.COLORS["accent_red"]
        )
        self.kg_language.grid(row=0, column=1, padx=20, pady=15, sticky="ew")
        self.kg_language.set("IT - Italiano")
        lang_frame.columnconfigure(1, weight=1)
        
        # Number of keywords
        count_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        count_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(
            count_frame,
            text="Numero di keywords:",
            font=ctk.CTkFont(size=14, weight="bold")
        ).grid(row=0, column=0, padx=20, pady=15, sticky="w")
        
        self.kg_count = ctk.CTkEntry(
            count_frame,
            placeholder_text="Es: 1000",
            width=200
        )
        self.kg_count.grid(row=0, column=1, padx=20, pady=15, sticky="ew")
        count_frame.columnconfigure(1, weight=1)
        
        # Output format
        format_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        format_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(
            format_frame,
            text="Formato output:",
            font=ctk.CTkFont(size=14, weight="bold")
        ).grid(row=0, column=0, padx=20, pady=15, sticky="w")
        
        self.kg_format = ctk.CTkOptionMenu(
            format_frame,
            values=["TXT", "CSV"],
            fg_color=self.COLORS["accent_red"],
            button_color=self.COLORS["accent_red_hover"]
        )
        self.kg_format.grid(row=0, column=1, padx=20, pady=15, sticky="ew")
        self.kg_format.set("TXT")
        format_frame.columnconfigure(1, weight=1)
        
        # Remove duplicates option
        self.kg_remove_dup = ctk.CTkCheckBox(
            frame,
            text="Rimuovi duplicati",
            font=ctk.CTkFont(size=14),
            fg_color=self.COLORS["accent_red"],
            hover_color=self.COLORS["accent_red_hover"]
        )
        self.kg_remove_dup.pack(anchor="w", pady=10)
        self.kg_remove_dup.select()
        
        # Generate button
        gen_btn = ctk.CTkButton(
            frame,
            text="Genera Keywords",
            command=self.generate_keywords,
            font=ctk.CTkFont(size=16, weight="bold"),
            height=50,
            fg_color=self.COLORS["accent_red"],
            hover_color=self.COLORS["accent_red_hover"]
        )
        gen_btn.pack(fill="x", pady=20)
        
        # Progress bar
        self.kg_progress = ctk.CTkProgressBar(
            frame,
            progress_color=self.COLORS["accent_red"]
        )
        self.kg_progress.pack(fill="x", pady=10)
        self.kg_progress.set(0)
        
        # Statistics
        self.kg_stats = ctk.CTkTextbox(
            frame,
            height=150,
            font=ctk.CTkFont(size=12),
            fg_color=self.COLORS["bg_secondary"]
        )
        self.kg_stats.pack(fill="x", pady=10)
        self.kg_stats.insert("1.0", "Statistiche verranno mostrate qui dopo la generazione...")
        self.kg_stats.configure(state="disabled")
    
    def generate_keywords(self):
        """Generate keywords in a separate thread."""
        try:
            # Validate input
            count_str = self.kg_count.get().strip()
            if not count_str or not count_str.isdigit():
                messagebox.showerror("Errore", "Inserisci un numero valido di keywords!")
                return
            
            count = int(count_str)
            if count <= 0 or count > 1000000:
                messagebox.showerror("Errore", "Il numero deve essere tra 1 e 1,000,000!")
                return
            
            # Get parameters
            lang_full = self.kg_language.get()
            lang = lang_full.split(" - ")[0]
            output_format = self.kg_format.get().lower()
            remove_dup = self.kg_remove_dup.get() == 1
            
            # Run in thread
            def run_generation():
                self.kg_progress.set(0.2)
                start_time = time.time()
                
                # Generate
                keywords = self.keyword_gen.generate(lang, count, remove_dup)
                self.kg_progress.set(0.6)
                
                # Save
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"keywords_{lang}_{timestamp}"
                filepath = self.keyword_gen.save_to_file(keywords, filename, output_format)
                self.kg_progress.set(0.8)
                
                # Get statistics
                stats = self.keyword_gen.get_statistics(keywords)
                elapsed = time.time() - start_time
                
                self.kg_progress.set(1.0)
                
                # Update stats
                stats_text = f"""
GENERAZIONE COMPLETATA!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keywords generate: {stats['total']:,}
Keywords uniche: {stats['unique']:,}
Lunghezza media: {stats['avg_length']} caratteri
Lunghezza min: {stats['min_length']} caratteri
Lunghezza max: {stats['max_length']} caratteri
Tempo impiegato: {elapsed:.2f} secondi
Velocità: {int(count/elapsed):,} keywords/sec
File salvato: {filepath}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
                self.kg_stats.configure(state="normal")
                self.kg_stats.delete("1.0", "end")
                self.kg_stats.insert("1.0", stats_text)
                self.kg_stats.configure(state="disabled")
                
                messagebox.showinfo("Successo", f"Keywords generate con successo!\n\nFile: {filepath}")
            
            Thread(target=run_generation, daemon=True).start()
            
        except Exception as e:
            messagebox.showerror("Errore", f"Errore durante la generazione: {str(e)}")
    
    def show_password_checker(self):
        """Show password strength checker tool."""
        frame = ctk.CTkScrollableFrame(
            self.content_frame,
            fg_color="transparent"
        )
        frame.pack(expand=True, fill="both", padx=30, pady=30)
        
        # Title
        title = ctk.CTkLabel(
            frame,
            text="Password Strength Checker",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=self.COLORS["accent_red"]
        )
        title.pack(anchor="w", pady=(0, 20))
        
        # File selection
        file_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        file_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(
            file_frame,
            text="File email:password:",
            font=ctk.CTkFont(size=14, weight="bold")
        ).grid(row=0, column=0, padx=20, pady=15, sticky="w")
        
        self.pc_filepath = ctk.CTkEntry(
            file_frame,
            placeholder_text="Nessun file selezionato",
            state="readonly"
        )
        self.pc_filepath.grid(row=0, column=1, padx=10, pady=15, sticky="ew")
        
        browse_btn = ctk.CTkButton(
            file_frame,
            text="Sfoglia",
            command=self.browse_password_file,
            width=100,
            fg_color=self.COLORS["accent_red"],
            hover_color=self.COLORS["accent_red_hover"]
        )
        browse_btn.grid(row=0, column=2, padx=20, pady=15)
        file_frame.columnconfigure(1, weight=1)
        
        # Output options
        output_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        output_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(
            output_frame,
            text="Opzioni output:",
            font=ctk.CTkFont(size=14, weight="bold")
        ).pack(anchor="w", padx=20, pady=(15, 5))
        
        self.pc_output_mode = ctk.CTkOptionMenu(
            output_frame,
            values=["File separati per categoria", "File unico con categorie", "Solo password STRONG"],
            fg_color=self.COLORS["accent_red"],
            button_color=self.COLORS["accent_red_hover"]
        )
        self.pc_output_mode.pack(fill="x", padx=20, pady=(5, 15))
        self.pc_output_mode.set("File separati per categoria")
        
        # Analyze button
        analyze_btn = ctk.CTkButton(
            frame,
            text="Analizza Password",
            command=self.analyze_passwords,
            font=ctk.CTkFont(size=16, weight="bold"),
            height=50,
            fg_color=self.COLORS["accent_red"],
            hover_color=self.COLORS["accent_red_hover"]
        )
        analyze_btn.pack(fill="x", pady=20)
        
        # Progress bar
        self.pc_progress = ctk.CTkProgressBar(
            frame,
            progress_color=self.COLORS["accent_red"]
        )
        self.pc_progress.pack(fill="x", pady=10)
        self.pc_progress.set(0)
        
        # Statistics
        self.pc_stats = ctk.CTkTextbox(
            frame,
            height=150,
            font=ctk.CTkFont(size=12),
            fg_color=self.COLORS["bg_secondary"]
        )
        self.pc_stats.pack(fill="x", pady=10)
        self.pc_stats.insert("1.0", "Statistiche verranno mostrate qui dopo l'analisi...")
        self.pc_stats.configure(state="disabled")
    
    def browse_password_file(self):
        """Browse for password file."""
        filename = filedialog.askopenfilename(
            title="Seleziona file email:password",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if filename:
            self.pc_filepath.configure(state="normal")
            self.pc_filepath.delete(0, "end")
            self.pc_filepath.insert(0, filename)
            self.pc_filepath.configure(state="readonly")
    
    def analyze_passwords(self):
        """Analyze password strength in a separate thread."""
        try:
            filepath = self.pc_filepath.get()
            if not filepath or not os.path.exists(filepath):
                messagebox.showerror("Errore", "Seleziona un file valido!")
                return
            
            output_mode = self.pc_output_mode.get()
            
            def run_analysis():
                self.pc_progress.set(0.2)
                start_time = time.time()
                
                # Analyze
                results = self.password_checker.analyze_file(filepath)
                self.pc_progress.set(0.6)
                
                # Save results
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                base_filename = f"passwords_analyzed_{timestamp}"
                
                if output_mode == "Solo password STRONG":
                    files = self.password_checker.save_results(results, base_filename, separate_files=False, strong_only=True)
                elif output_mode == "File unico con categorie":
                    files = self.password_checker.save_results(results, base_filename, separate_files=False, strong_only=False)
                else:
                    files = self.password_checker.save_results(results, base_filename, separate_files=True, strong_only=False)
                
                self.pc_progress.set(0.8)
                
                # Get statistics
                stats = self.password_checker.get_statistics(results)
                elapsed = time.time() - start_time
                
                self.pc_progress.set(1.0)
                
                # Update stats
                stats_text = f"""
ANALISI COMPLETATA!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Password totali: {stats['total']:,}
Password WEAK: {stats['weak']:,} ({stats['weak']/stats['total']*100:.1f}%)
Password MEDIUM: {stats['medium']:,} ({stats['medium']/stats['total']*100:.1f}%)
Password STRONG: {stats['strong']:,} ({stats['strong']/stats['total']*100:.1f}%)
Tempo impiegato: {elapsed:.2f} secondi
File salvati: {len(files)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File creati:
{chr(10).join(f"  • {f}" for f in files)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
                self.pc_stats.configure(state="normal")
                self.pc_stats.delete("1.0", "end")
                self.pc_stats.insert("1.0", stats_text)
                self.pc_stats.configure(state="disabled")
                
                messagebox.showinfo("Successo", f"Analisi completata!\n\n{len(files)} file creati.")
            
            Thread(target=run_analysis, daemon=True).start()
            
        except Exception as e:
            messagebox.showerror("Errore", f"Errore durante l'analisi: {str(e)}")
    
    def show_duplicate_remover(self):
        """Show duplicate remover tool."""
        frame = ctk.CTkScrollableFrame(
            self.content_frame,
            fg_color="transparent"
        )
        frame.pack(expand=True, fill="both", padx=30, pady=30)
        
        # Title
        title = ctk.CTkLabel(
            frame,
            text="Duplicate Remover",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=self.COLORS["accent_red"]
        )
        title.pack(anchor="w", pady=(0, 20))
        
        # File selection
        file_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        file_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(
            file_frame,
            text="File da pulire:",
            font=ctk.CTkFont(size=14, weight="bold")
        ).grid(row=0, column=0, padx=20, pady=15, sticky="w")
        
        self.dr_filepath = ctk.CTkEntry(
            file_frame,
            placeholder_text="Nessun file selezionato",
            state="readonly"
        )
        self.dr_filepath.grid(row=0, column=1, padx=10, pady=15, sticky="ew")
        
        browse_btn = ctk.CTkButton(
            file_frame,
            text="Sfoglia",
            command=self.browse_duplicate_file,
            width=100,
            fg_color=self.COLORS["accent_red"],
            hover_color=self.COLORS["accent_red_hover"]
        )
        browse_btn.grid(row=0, column=2, padx=20, pady=15)
        file_frame.columnconfigure(1, weight=1)
        
        # Remove button
        remove_btn = ctk.CTkButton(
            frame,
            text="Rimuovi Duplicati",
            command=self.remove_duplicates,
            font=ctk.CTkFont(size=16, weight="bold"),
            height=50,
            fg_color=self.COLORS["accent_red"],
            hover_color=self.COLORS["accent_red_hover"]
        )
        remove_btn.pack(fill="x", pady=20)
        
        # Progress bar
        self.dr_progress = ctk.CTkProgressBar(
            frame,
            progress_color=self.COLORS["accent_red"]
        )
        self.dr_progress.pack(fill="x", pady=10)
        self.dr_progress.set(0)
        
        # Statistics
        self.dr_stats = ctk.CTkTextbox(
            frame,
            height=150,
            font=ctk.CTkFont(size=12),
            fg_color=self.COLORS["bg_secondary"]
        )
        self.dr_stats.pack(fill="x", pady=10)
        self.dr_stats.insert("1.0", "Statistiche verranno mostrate qui dopo la rimozione...")
        self.dr_stats.configure(state="disabled")
    
    def browse_duplicate_file(self):
        """Browse for file to remove duplicates."""
        filename = filedialog.askopenfilename(
            title="Seleziona file da pulire",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if filename:
            self.dr_filepath.configure(state="normal")
            self.dr_filepath.delete(0, "end")
            self.dr_filepath.insert(0, filename)
            self.dr_filepath.configure(state="readonly")
    
    def remove_duplicates(self):
        """Remove duplicates in a separate thread."""
        try:
            filepath = self.dr_filepath.get()
            if not filepath or not os.path.exists(filepath):
                messagebox.showerror("Errore", "Seleziona un file valido!")
                return
            
            def run_removal():
                self.dr_progress.set(0.2)
                start_time = time.time()
                
                # Process file
                unique_lines, duplicates_removed = self.duplicate_remover.process_file(filepath)
                self.dr_progress.set(0.6)
                
                # Save result
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_file = f"unique_{timestamp}.txt"
                self.duplicate_remover.save_to_file(unique_lines, output_file)
                self.dr_progress.set(0.8)
                
                # Get statistics
                original_count = len(unique_lines) + duplicates_removed
                stats = self.duplicate_remover.get_statistics(original_count, len(unique_lines))
                elapsed = time.time() - start_time
                
                self.dr_progress.set(1.0)
                
                # Update stats
                stats_text = f"""
RIMOZIONE COMPLETATA!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Righe originali: {stats['original_count']:,}
Righe uniche: {stats['unique_count']:,}
Duplicati rimossi: {stats['duplicates_removed']:,}
Percentuale rimossa: {stats['percentage_removed']:.2f}%
Tempo impiegato: {elapsed:.2f} secondi
File salvato: {output_file}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
                self.dr_stats.configure(state="normal")
                self.dr_stats.delete("1.0", "end")
                self.dr_stats.insert("1.0", stats_text)
                self.dr_stats.configure(state="disabled")
                
                messagebox.showinfo("Successo", f"Duplicati rimossi!\n\nFile: {output_file}")
            
            Thread(target=run_removal, daemon=True).start()
            
        except Exception as e:
            messagebox.showerror("Errore", f"Errore durante la rimozione: {str(e)}")
    
    def show_email_extractor(self):
        """Show email extractor tool."""
        frame = ctk.CTkScrollableFrame(
            self.content_frame,
            fg_color="transparent"
        )
        frame.pack(expand=True, fill="both", padx=30, pady=30)
        
        # Title
        title = ctk.CTkLabel(
            frame,
            text="Email Extractor",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=self.COLORS["accent_red"]
        )
        title.pack(anchor="w", pady=(0, 20))
        
        # Input mode
        mode_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        mode_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(
            mode_frame,
            text="Modalità input:",
            font=ctk.CTkFont(size=14, weight="bold")
        ).pack(anchor="w", padx=20, pady=(15, 5))
        
        self.ee_mode = ctk.CTkOptionMenu(
            mode_frame,
            values=["Da file", "Da testo"],
            command=self.toggle_email_input_mode,
            fg_color=self.COLORS["accent_red"],
            button_color=self.COLORS["accent_red_hover"]
        )
        self.ee_mode.pack(fill="x", padx=20, pady=(5, 15))
        self.ee_mode.set("Da file")
        
        # File input
        self.ee_file_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        self.ee_file_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(
            self.ee_file_frame,
            text="File sorgente:",
            font=ctk.CTkFont(size=14, weight="bold")
        ).grid(row=0, column=0, padx=20, pady=15, sticky="w")
        
        self.ee_filepath = ctk.CTkEntry(
            self.ee_file_frame,
            placeholder_text="Nessun file selezionato",
            state="readonly"
        )
        self.ee_filepath.grid(row=0, column=1, padx=10, pady=15, sticky="ew")
        
        browse_btn = ctk.CTkButton(
            self.ee_file_frame,
            text="Sfoglia",
            command=self.browse_email_file,
            width=100,
            fg_color=self.COLORS["accent_red"],
            hover_color=self.COLORS["accent_red_hover"]
        )
        browse_btn.grid(row=0, column=2, padx=20, pady=15)
        self.ee_file_frame.columnconfigure(1, weight=1)
        
        # Text input
        self.ee_text_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        
        ctk.CTkLabel(
            self.ee_text_frame,
            text="Inserisci o incolla testo:",
            font=ctk.CTkFont(size=14, weight="bold")
        ).pack(anchor="w", padx=20, pady=(15, 5))
        
        self.ee_text_input = ctk.CTkTextbox(
            self.ee_text_frame,
            height=150,
            font=ctk.CTkFont(size=12)
        )
        self.ee_text_input.pack(fill="both", expand=True, padx=20, pady=(5, 15))
        
        # Extract button
        extract_btn = ctk.CTkButton(
            frame,
            text="Estrai Email",
            command=self.extract_emails,
            font=ctk.CTkFont(size=16, weight="bold"),
            height=50,
            fg_color=self.COLORS["accent_red"],
            hover_color=self.COLORS["accent_red_hover"]
        )
        extract_btn.pack(fill="x", pady=20)
        
        # Progress bar
        self.ee_progress = ctk.CTkProgressBar(
            frame,
            progress_color=self.COLORS["accent_red"]
        )
        self.ee_progress.pack(fill="x", pady=10)
        self.ee_progress.set(0)
        
        # Statistics
        self.ee_stats = ctk.CTkTextbox(
            frame,
            height=150,
            font=ctk.CTkFont(size=12),
            fg_color=self.COLORS["bg_secondary"]
        )
        self.ee_stats.pack(fill="x", pady=10)
        self.ee_stats.insert("1.0", "Statistiche verranno mostrate qui dopo l'estrazione...")
        self.ee_stats.configure(state="disabled")
    
    def toggle_email_input_mode(self, choice):
        """Toggle between file and text input mode."""
        if choice == "Da file":
            self.ee_file_frame.pack(fill="x", pady=10, before=self.ee_text_frame)
            self.ee_text_frame.pack_forget()
        else:
            self.ee_text_frame.pack(fill="x", pady=10, before=self.content_frame.winfo_children()[-4])
            self.ee_file_frame.pack_forget()
    
    def browse_email_file(self):
        """Browse for file to extract emails."""
        filename = filedialog.askopenfilename(
            title="Seleziona file sorgente",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if filename:
            self.ee_filepath.configure(state="normal")
            self.ee_filepath.delete(0, "end")
            self.ee_filepath.insert(0, filename)
            self.ee_filepath.configure(state="readonly")
    
    def extract_emails(self):
        """Extract emails in a separate thread."""
        try:
            mode = self.ee_mode.get()
            
            def run_extraction():
                self.ee_progress.set(0.2)
                start_time = time.time()
                
                # Extract emails
                if mode == "Da file":
                    filepath = self.ee_filepath.get()
                    if not filepath or not os.path.exists(filepath):
                        messagebox.showerror("Errore", "Seleziona un file valido!")
                        return
                    emails = self.email_extractor.extract_from_file(filepath, unique_only=True)
                else:
                    text = self.ee_text_input.get("1.0", "end")
                    if not text.strip():
                        messagebox.showerror("Errore", "Inserisci del testo!")
                        return
                    emails = self.email_extractor.extract_from_text(text, unique_only=True)
                
                self.ee_progress.set(0.6)
                
                # Save emails
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_file = f"emails_{timestamp}.txt"
                self.email_extractor.save_to_file(emails, output_file)
                self.ee_progress.set(0.8)
                
                # Get statistics
                stats = self.email_extractor.get_statistics(emails)
                elapsed = time.time() - start_time
                
                self.ee_progress.set(1.0)
                
                # Update stats
                top_domains_str = "\n".join(f"  • {domain}: {count}" for domain, count in stats['top_domains'][:5])
                stats_text = f"""
ESTRAZIONE COMPLETATA!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email totali trovate: {stats['total_emails']:,}
Email uniche: {stats['unique_emails']:,}
Domini unici: {stats['unique_domains']:,}
Tempo impiegato: {elapsed:.2f} secondi
File salvato: {output_file}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Top 5 domini:
{top_domains_str}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
                self.ee_stats.configure(state="normal")
                self.ee_stats.delete("1.0", "end")
                self.ee_stats.insert("1.0", stats_text)
                self.ee_stats.configure(state="disabled")
                
                messagebox.showinfo("Successo", f"Email estratte!\n\nFile: {output_file}")
            
            Thread(target=run_extraction, daemon=True).start()
            
        except Exception as e:
            messagebox.showerror("Errore", f"Errore durante l'estrazione: {str(e)}")
    
    def show_list_splitter(self):
        """Show list splitter tool."""
        frame = ctk.CTkScrollableFrame(
            self.content_frame,
            fg_color="transparent"
        )
        frame.pack(expand=True, fill="both", padx=30, pady=30)
        
        # Title
        title = ctk.CTkLabel(
            frame,
            text="List Splitter",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=self.COLORS["accent_red"]
        )
        title.pack(anchor="w", pady=(0, 20))
        
        # File selection
        file_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        file_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(
            file_frame,
            text="File da dividere:",
            font=ctk.CTkFont(size=14, weight="bold")
        ).grid(row=0, column=0, padx=20, pady=15, sticky="w")
        
        self.ls_filepath = ctk.CTkEntry(
            file_frame,
            placeholder_text="Nessun file selezionato",
            state="readonly"
        )
        self.ls_filepath.grid(row=0, column=1, padx=10, pady=15, sticky="ew")
        
        browse_btn = ctk.CTkButton(
            file_frame,
            text="Sfoglia",
            command=self.browse_split_file,
            width=100,
            fg_color=self.COLORS["accent_red"],
            hover_color=self.COLORS["accent_red_hover"]
        )
        browse_btn.grid(row=0, column=2, padx=20, pady=15)
        file_frame.columnconfigure(1, weight=1)
        
        # Split mode
        mode_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        mode_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(
            mode_frame,
            text="Modalità split:",
            font=ctk.CTkFont(size=14, weight="bold")
        ).pack(anchor="w", padx=20, pady=(15, 5))
        
        self.ls_mode = ctk.CTkOptionMenu(
            mode_frame,
            values=["Dividi in N parti", "X righe per parte"],
            fg_color=self.COLORS["accent_red"],
            button_color=self.COLORS["accent_red_hover"]
        )
        self.ls_mode.pack(fill="x", padx=20, pady=(5, 15))
        self.ls_mode.set("Dividi in N parti")
        
        # Value input
        value_frame = ctk.CTkFrame(frame, fg_color=self.COLORS["bg_secondary"], corner_radius=10)
        value_frame.pack(fill="x", pady=10)
        
        ctk.CTkLabel(
            value_frame,
            text="Valore:",
            font=ctk.CTkFont(size=14, weight="bold")
        ).grid(row=0, column=0, padx=20, pady=15, sticky="w")
        
        self.ls_value = ctk.CTkEntry(
            value_frame,
            placeholder_text="Es: 5 o 1000"
        )
        self.ls_value.grid(row=0, column=1, padx=20, pady=15, sticky="ew")
        value_frame.columnconfigure(1, weight=1)
        
        # Split button
        split_btn = ctk.CTkButton(
            frame,
            text="Dividi File",
            command=self.split_list,
            font=ctk.CTkFont(size=16, weight="bold"),
            height=50,
            fg_color=self.COLORS["accent_red"],
            hover_color=self.COLORS["accent_red_hover"]
        )
        split_btn.pack(fill="x", pady=20)
        
        # Progress bar
        self.ls_progress = ctk.CTkProgressBar(
            frame,
            progress_color=self.COLORS["accent_red"]
        )
        self.ls_progress.pack(fill="x", pady=10)
        self.ls_progress.set(0)
        
        # Statistics
        self.ls_stats = ctk.CTkTextbox(
            frame,
            height=150,
            font=ctk.CTkFont(size=12),
            fg_color=self.COLORS["bg_secondary"]
        )
        self.ls_stats.pack(fill="x", pady=10)
        self.ls_stats.insert("1.0", "Statistiche verranno mostrate qui dopo lo split...")
        self.ls_stats.configure(state="disabled")
    
    def browse_split_file(self):
        """Browse for file to split."""
        filename = filedialog.askopenfilename(
            title="Seleziona file da dividere",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if filename:
            self.ls_filepath.configure(state="normal")
            self.ls_filepath.delete(0, "end")
            self.ls_filepath.insert(0, filename)
            self.ls_filepath.configure(state="readonly")
    
    def split_list(self):
        """Split list in a separate thread."""
        try:
            filepath = self.ls_filepath.get()
            if not filepath or not os.path.exists(filepath):
                messagebox.showerror("Errore", "Seleziona un file valido!")
                return
            
            value_str = self.ls_value.get().strip()
            if not value_str or not value_str.isdigit():
                messagebox.showerror("Errore", "Inserisci un valore numerico valido!")
                return
            
            value = int(value_str)
            if value <= 0:
                messagebox.showerror("Errore", "Il valore deve essere positivo!")
                return
            
            mode = self.ls_mode.get()
            split_mode = "parts" if mode == "Dividi in N parti" else "lines"
            
            def run_split():
                self.ls_progress.set(0.2)
                start_time = time.time()
                
                # Split file
                parts = self.list_splitter.process_file(filepath, split_mode, value)
                self.ls_progress.set(0.6)
                
                # Save parts
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                base_filename = f"split_{timestamp}"
                files = self.list_splitter.save_parts(parts, base_filename)
                self.ls_progress.set(0.8)
                
                # Get statistics
                stats = self.list_splitter.get_statistics(parts)
                elapsed = time.time() - start_time
                
                self.ls_progress.set(1.0)
                
                # Update stats
                stats_text = f"""
SPLIT COMPLETATO!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Parti create: {stats['num_parts']}
Righe totali: {stats['total_lines']:,}
Righe min per parte: {stats['min_lines_per_part']:,}
Righe max per parte: {stats['max_lines_per_part']:,}
Righe medie per parte: {stats['avg_lines_per_part']:,.0f}
Tempo impiegato: {elapsed:.2f} secondi
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File creati:
{chr(10).join(f"  • {f}" for f in files)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
                self.ls_stats.configure(state="normal")
                self.ls_stats.delete("1.0", "end")
                self.ls_stats.insert("1.0", stats_text)
                self.ls_stats.configure(state="disabled")
                
                messagebox.showinfo("Successo", f"File diviso in {len(files)} parti!")
            
            Thread(target=run_split, daemon=True).start()
            
        except Exception as e:
            messagebox.showerror("Errore", f"Errore durante lo split: {str(e)}")


def main():
    """Main entry point for the application."""
    app = CarpanoTool()
    app.mainloop()


if __name__ == "__main__":
    main()
