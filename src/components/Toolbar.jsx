import React from 'react';
import './Toolbar.css';

function Toolbar({ fileName, onOpenFile, onExport }) {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="app-title">🔥 EXE Decompiler Pro</h1>
        {fileName && <span className="file-name">{fileName}</span>}
      </div>
      <div className="toolbar-right">
        <button className="btn btn-primary" onClick={onOpenFile}>
          📂 Open EXE
        </button>
        <button className="btn btn-secondary" onClick={onExport}>
          💾 Export
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
