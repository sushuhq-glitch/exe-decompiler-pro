import React from 'react';
import Editor from '@monaco-editor/react';
import './CodeViewer.css';

function CodeViewer({ code }) {
  return (
    <div className="code-viewer">
      <Editor
        height="100%"
        defaultLanguage="c"
        theme="vs-dark"
        value={code}
        options={{
          readOnly: true,
          minimap: { enabled: true },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true
        }}
      />
    </div>
  );
}

export default CodeViewer;
