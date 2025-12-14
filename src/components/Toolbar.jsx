import React from 'react';
import './Toolbar.css';

function Toolbar({ fileName, onOpenFile, onExport, onDecompileExe, isAnalyzing, isDecompiling }) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="app-title">EXE Decompiler Pro</h1>
        {fileName && <span className="file-name">{fileName}</span>}
        {isAnalyzing && <span className="analyzing-indicator">⏳ Analyzing...</span>}
        {isDecompiling && <span className="analyzing-indicator">🔄 Decompiling...</span>}
      </div>
      <div className="toolbar-center">
        <button className="decompile-button" onClick={onDecompileExe} disabled={!fileName || isAnalyzing || isDecompiling}>
          ⚡ DECOMPILE EXE
        </button>
      </div>
      <div className="toolbar-right">
        <button className="btn btn-primary" onClick={onOpenFile} disabled={isAnalyzing || isDecompiling}>
          📂 Open
        </button>
        <button className="btn btn-secondary" onClick={onExport} disabled={isAnalyzing || isDecompiling}>
          💾 Export
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
