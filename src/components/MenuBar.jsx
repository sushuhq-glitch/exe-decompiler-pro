import React, { useState } from 'react';
import './MenuBar.css';

/**
 * IDA Pro Style Menu Bar Component
 * Provides main menu with File, Edit, View, Analysis, Options, Help
 * Exact replica of IDA Pro menu structure
 */
const MenuBar = ({ 
  onOpenFile, 
  onSaveProject, 
  onExportFunction,
  onDecompileAll,
  onShowStrings,
  onShowImports,
  onShowExports,
  onShowSegments,
  onAnalyzeCode,
  onSearchCode,
  onPreferences
}) => {
  const [activeMenu, setActiveMenu] = useState(null);

  /**
   * Toggle menu dropdown visibility
   */
  const toggleMenu = (menuName) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  /**
   * Close menu after item click
   */
  const handleMenuItemClick = (callback) => {
    setActiveMenu(null);
    if (callback) callback();
  };

  /**
   * Handle mouse enter for menu items (desktop app behavior)
   */
  const handleMouseEnter = (menuName) => {
    if (activeMenu !== null) {
      setActiveMenu(menuName);
    }
  };

  /**
   * Keyboard shortcuts display
   */
  const shortcuts = {
    openFile: 'Ctrl+O',
    saveProject: 'Ctrl+S',
    exportFunction: 'Ctrl+E',
    decompileAll: 'F5',
    searchCode: 'Ctrl+F',
    quit: 'Alt+F4'
  };

  return (
    <div className="ida-menubar">
      {/* File Menu */}
      <div 
        className={`menu-item ${activeMenu === 'file' ? 'active' : ''}`}
        onMouseEnter={() => handleMouseEnter('file')}
      >
        <button 
          className="menu-button"
          onClick={() => toggleMenu('file')}
        >
          File
        </button>
        {activeMenu === 'file' && (
          <div className="menu-dropdown">
            <div 
              className="menu-option"
              onClick={() => handleMenuItemClick(onOpenFile)}
            >
              <span>Open...</span>
              <span className="shortcut">{shortcuts.openFile}</span>
            </div>
            <div className="menu-divider"></div>
            <div 
              className="menu-option"
              onClick={() => handleMenuItemClick(onSaveProject)}
            >
              <span>Save Project</span>
              <span className="shortcut">{shortcuts.saveProject}</span>
            </div>
            <div 
              className="menu-option"
              onClick={() => handleMenuItemClick(onExportFunction)}
            >
              <span>Export Function...</span>
              <span className="shortcut">{shortcuts.exportFunction}</span>
            </div>
            <div className="menu-divider"></div>
            <div 
              className="menu-option"
              onClick={() => handleMenuItemClick(() => window.close())}
            >
              <span>Quit</span>
              <span className="shortcut">{shortcuts.quit}</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Menu */}
      <div 
        className={`menu-item ${activeMenu === 'edit' ? 'active' : ''}`}
        onMouseEnter={() => handleMouseEnter('edit')}
      >
        <button 
          className="menu-button"
          onClick={() => toggleMenu('edit')}
        >
          Edit
        </button>
        {activeMenu === 'edit' && (
          <div className="menu-dropdown">
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Copy</span>
              <span className="shortcut">Ctrl+C</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Copy All</span>
              <span className="shortcut">Ctrl+Shift+C</span>
            </div>
            <div className="menu-divider"></div>
            <div 
              className="menu-option"
              onClick={() => handleMenuItemClick(onSearchCode)}
            >
              <span>Search...</span>
              <span className="shortcut">{shortcuts.searchCode}</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Find Next</span>
              <span className="shortcut">F3</span>
            </div>
            <div className="menu-divider"></div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Go to Address...</span>
              <span className="shortcut">G</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Jump to Function...</span>
              <span className="shortcut">Ctrl+P</span>
            </div>
          </div>
        )}
      </div>

      {/* View Menu */}
      <div 
        className={`menu-item ${activeMenu === 'view' ? 'active' : ''}`}
        onMouseEnter={() => handleMouseEnter('view')}
      >
        <button 
          className="menu-button"
          onClick={() => toggleMenu('view')}
        >
          View
        </button>
        {activeMenu === 'view' && (
          <div className="menu-dropdown">
            <div 
              className="menu-option"
              onClick={() => handleMenuItemClick(onShowStrings)}
            >
              <span>Strings Window</span>
              <span className="shortcut">Shift+F12</span>
            </div>
            <div 
              className="menu-option"
              onClick={() => handleMenuItemClick(onShowImports)}
            >
              <span>Imports</span>
              <span className="shortcut">Ctrl+I</span>
            </div>
            <div 
              className="menu-option"
              onClick={() => handleMenuItemClick(onShowExports)}
            >
              <span>Exports</span>
              <span className="shortcut">Ctrl+Shift+E</span>
            </div>
            <div 
              className="menu-option"
              onClick={() => handleMenuItemClick(onShowSegments)}
            >
              <span>Segments</span>
              <span className="shortcut">Ctrl+Shift+S</span>
            </div>
            <div className="menu-divider"></div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Hex View</span>
              <span className="shortcut">F2</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Pseudocode</span>
              <span className="shortcut">F5</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Graph View</span>
              <span className="shortcut">Space</span>
            </div>
            <div className="menu-divider"></div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Function List</span>
              <span className="shortcut">Ctrl+L</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Names Window</span>
              <span className="shortcut">Shift+F4</span>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Menu */}
      <div 
        className={`menu-item ${activeMenu === 'analysis' ? 'active' : ''}`}
        onMouseEnter={() => handleMouseEnter('analysis')}
      >
        <button 
          className="menu-button"
          onClick={() => toggleMenu('analysis')}
        >
          Analysis
        </button>
        {activeMenu === 'analysis' && (
          <div className="menu-dropdown">
            <div 
              className="menu-option"
              onClick={() => handleMenuItemClick(onAnalyzeCode)}
            >
              <span>Analyze Program</span>
              <span className="shortcut">Ctrl+A</span>
            </div>
            <div 
              className="menu-option"
              onClick={() => handleMenuItemClick(onDecompileAll)}
            >
              <span>Decompile All Functions</span>
              <span className="shortcut">{shortcuts.decompileAll}</span>
            </div>
            <div className="menu-divider"></div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Make Function</span>
              <span className="shortcut">P</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Undefine Function</span>
              <span className="shortcut">U</span>
            </div>
            <div className="menu-divider"></div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Create Struct...</span>
              <span className="shortcut">Alt+Q</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Edit Struct...</span>
              <span className="shortcut">Alt+Q</span>
            </div>
            <div className="menu-divider"></div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Rename</span>
              <span className="shortcut">N</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Edit Comment</span>
              <span className="shortcut">:</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Edit Function Comment</span>
              <span className="shortcut">;</span>
            </div>
          </div>
        )}
      </div>

      {/* Options Menu */}
      <div 
        className={`menu-item ${activeMenu === 'options' ? 'active' : ''}`}
        onMouseEnter={() => handleMouseEnter('options')}
      >
        <button 
          className="menu-button"
          onClick={() => toggleMenu('options')}
        >
          Options
        </button>
        {activeMenu === 'options' && (
          <div className="menu-dropdown">
            <div 
              className="menu-option"
              onClick={() => handleMenuItemClick(onPreferences)}
            >
              <span>General...</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Colors...</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Fonts...</span>
            </div>
            <div className="menu-divider"></div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Disassembly...</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Decompiler...</span>
            </div>
            <div className="menu-divider"></div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Compiler...</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Processor Type...</span>
            </div>
          </div>
        )}
      </div>

      {/* Help Menu */}
      <div 
        className={`menu-item ${activeMenu === 'help' ? 'active' : ''}`}
        onMouseEnter={() => handleMouseEnter('help')}
      >
        <button 
          className="menu-button"
          onClick={() => toggleMenu('help')}
        >
          Help
        </button>
        {activeMenu === 'help' && (
          <div className="menu-dropdown">
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Contents</span>
              <span className="shortcut">F1</span>
            </div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Keyboard Shortcuts</span>
            </div>
            <div className="menu-divider"></div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>Check for Updates...</span>
            </div>
            <div className="menu-divider"></div>
            <div className="menu-option" onClick={() => handleMenuItemClick()}>
              <span>About EXE Decompiler Pro</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBar;
