import React, { useState } from 'react';
import './Toolbar.css';

function Toolbar({ fileName, onOpenFile, onExportFunction, onExportHTML, onExportIDA, onExportGhidra, onExportJSON, isAnalyzing }) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const handleExportClick = () => {
    setShowExportMenu(!showExportMenu);
  };
  
  const handleExportOption = (exportFn) => {
    setShowExportMenu(false);
    if (exportFn) exportFn();
  };
  
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="app-title">EXE Decompiler Pro</h1>
        {fileName && <span className="file-name">{fileName}</span>}
        {isAnalyzing && <span className="analyzing-indicator">Analyzing...</span>}
      </div>
      <div className="toolbar-right">
        <button className="btn btn-primary" onClick={onOpenFile} disabled={isAnalyzing}>
          Open EXE
        </button>
        <div className="export-dropdown">
          <button className="btn btn-secondary" onClick={handleExportClick} disabled={isAnalyzing}>
            Export ▼
          </button>
          {showExportMenu && (
            <div className="export-menu">
              <button onClick={() => handleExportOption(onExportFunction)}>Function Code</button>
              <button onClick={() => handleExportOption(onExportHTML)}>HTML Report</button>
              <button onClick={() => handleExportOption(onExportIDA)}>IDA Script</button>
              <button onClick={() => handleExportOption(onExportGhidra)}>Ghidra Script</button>
              <button onClick={() => handleExportOption(onExportJSON)}>JSON Database</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Toolbar;
