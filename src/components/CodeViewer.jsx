import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './CodeViewer.css';

/**
 * Enhanced Code Viewer Component
 * Dual-pane view with Assembly and C code, synchronized scrolling
 */
function CodeViewer({ assembly = '', decompiled = '', highlights = [], onLineClick }) {
  const [viewMode, setViewMode] = useState('split'); // 'asm', 'c', 'split'
  const [selectedLine, setSelectedLine] = useState(null);
  const asmEditorRef = useRef(null);
  const cEditorRef = useRef(null);
  const [syncScroll, setSyncScroll] = useState(true);
  
  /**
   * Handle assembly editor mount
   */
  const handleAsmEditorMount = (editor) => {
    asmEditorRef.current = editor;
    
    // Add click handler
    editor.onMouseDown((e) => {
      const position = e.target.position;
      if (position) {
        setSelectedLine(position.lineNumber);
        if (onLineClick) {
          onLineClick(position.lineNumber, 'asm');
        }
      }
    });
    
    // Sync scrolling
    if (syncScroll) {
      editor.onDidScrollChange(() => {
        if (cEditorRef.current && syncScroll) {
          const scrollTop = editor.getScrollTop();
          cEditorRef.current.setScrollTop(scrollTop);
        }
      });
    }
  };
  
  /**
   * Handle C editor mount
   */
  const handleCEditorMount = (editor) => {
    cEditorRef.current = editor;
    
    // Add click handler
    editor.onMouseDown((e) => {
      const position = e.target.position;
      if (position) {
        setSelectedLine(position.lineNumber);
        if (onLineClick) {
          onLineClick(position.lineNumber, 'c');
        }
      }
    });
    
    // Sync scrolling
    if (syncScroll) {
      editor.onDidScrollChange(() => {
        if (asmEditorRef.current && syncScroll) {
          const scrollTop = editor.getScrollTop();
          asmEditorRef.current.setScrollTop(scrollTop);
        }
      });
    }
  };
  
  /**
   * Format assembly code with addresses
   */
  const formatAssembly = (asmCode) => {
    if (!asmCode) return '// No assembly code available';
    if (typeof asmCode === 'string') return asmCode;
    
    // If asmCode is an array of instruction objects
    if (Array.isArray(asmCode)) {
      return asmCode.map(inst => {
        const addr = inst.address || '0x00000000';
        const bytes = inst.bytesHex || '';
        const mnemonic = inst.mnemonic || '';
        const operands = inst.operands || '';
        const bytesFormatted = bytes.padEnd(24, ' ');
        const mnemonicFormatted = mnemonic.padEnd(8, ' ');
        return `${addr}  ${bytesFormatted}  ${mnemonicFormatted} ${operands}`;
      }).join('\n');
    }
    
    return asmCode;
  };
  
  const formattedAsm = formatAssembly(assembly);
  const formattedC = decompiled || '// No decompiled code available\n// Select a function to decompile';
  
  return (
    <div className="code-viewer-enhanced">
      <div className="code-viewer-toolbar">
        <div className="view-mode-selector">
          <button
            className={`view-mode-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split View"
          >
            ⚏ Split
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'asm' ? 'active' : ''}`}
            onClick={() => setViewMode('asm')}
            title="Assembly Only"
          >
            📋 Assembly
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'c' ? 'active' : ''}`}
            onClick={() => setViewMode('c')}
            title="C Code Only"
          >
            💻 C Code
          </button>
        </div>
        
        <div className="toolbar-controls">
          <label className="sync-scroll-toggle">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(e) => setSyncScroll(e.target.checked)}
            />
            <span>Sync Scroll</span>
          </label>
        </div>
      </div>
      
      <div className={`code-viewer-panes mode-${viewMode}`}>
        {(viewMode === 'asm' || viewMode === 'split') && (
          <div className="code-pane asm-pane">
            <div className="code-pane-header">
              <span className="pane-title">Assembly</span>
              <span className="pane-info">{formattedAsm.split('\n').length} lines</span>
            </div>
            <div className="code-pane-content">
              <Editor
                height="100%"
                defaultLanguage="plaintext"
                theme="vs-dark"
                value={formattedAsm}
                onMount={handleAsmEditorMount}
                options={{
                  readOnly: true,
                  minimap: { enabled: viewMode === 'asm' },
                  fontSize: 13,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 4,
                  renderWhitespace: 'none',
                  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
                }}
              />
            </div>
          </div>
        )}
        
        {(viewMode === 'c' || viewMode === 'split') && (
          <div className="code-pane c-pane">
            <div className="code-pane-header">
              <span className="pane-title">Decompiled C</span>
              <span className="pane-info">{formattedC.split('\n').length} lines</span>
            </div>
            <div className="code-pane-content">
              <Editor
                height="100%"
                defaultLanguage="c"
                theme="vs-dark"
                value={formattedC}
                onMount={handleCEditorMount}
                options={{
                  readOnly: true,
                  minimap: { enabled: viewMode === 'c' },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  glyphMargin: false,
                  folding: true,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 4,
                  renderWhitespace: 'none'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeViewer;
