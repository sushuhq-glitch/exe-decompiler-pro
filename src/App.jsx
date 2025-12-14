import React, { useState } from 'react';
import Toolbar from './components/Toolbar';
import FunctionList from './components/FunctionList';
import CodeViewer from './components/CodeViewer';
import HexViewer from './components/HexViewer';
import AnalysisPanel from './components/AnalysisPanel';
import { parsePE, extractStrings } from './services/pe-parser';
import { disassemble } from './services/disassembler';
import { detectPatterns } from './services/patterns';
import { decompileFunction } from './services/decompiler-core';
import './App.css';

/**
 * Enhanced Main Application
 * Orchestrates all components and services for professional decompilation
 */
function App() {
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState(null);
  const [fileSize, setFileSize] = useState(0);
  const [peData, setPeData] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeView, setActiveView] = useState('code'); // 'code', 'hex', 'analysis'
  const [statusMessage, setStatusMessage] = useState('Ready');
  
  /**
   * Handle file opening and analysis
   */
  const handleOpenFile = async () => {
    try {
      setIsAnalyzing(true);
      setStatusMessage('Loading file...');
      
      const result = await window.electronAPI.openFile();
      if (!result) {
        setIsAnalyzing(false);
        setStatusMessage('Ready');
        return;
      }
      
      setFileName(result.name);
      setFileData(result.data);
      setFileSize(result.data.length);
      setStatusMessage('Parsing PE headers...');
      
      // Parse PE structure
      const parsedPE = parsePE(result.data);
      setPeData(parsedPE);
      
      if (!parsedPE.isValid) {
        setStatusMessage('Error: Invalid PE file');
        setIsAnalyzing(false);
        return;
      }
      
      setStatusMessage('Detecting patterns...');
      
      // Detect patterns and functions
      const detectedPatterns = detectPatterns(result.data, parsedPE);
      setPatterns(detectedPatterns);
      
      setStatusMessage(`Analysis complete. Found ${detectedPatterns.functions.length} functions.`);
      setIsAnalyzing(false);
      
    } catch (error) {
      console.error('Error opening file:', error);
      setStatusMessage('Error: ' + error.message);
      setIsAnalyzing(false);
    }
  };
  
  /**
   * Handle function selection and decompilation
   */
  const handleFunctionClick = (func) => {
    setSelectedFunction(func);
    setActiveView('code');
    setStatusMessage(`Selected function: ${func.name}`);
  };
  
  /**
   * Handle export to file
   */
  const handleExport = async () => {
    try {
      if (!selectedFunction) {
        setStatusMessage('No function selected');
        return;
      }
      
      // Decompile the function if not already done
      let cCode = selectedFunction.code;
      
      if (!cCode && selectedFunction.instructions) {
        setStatusMessage('Decompiling function...');
        const decompiled = decompileFunction(selectedFunction.instructions, peData, selectedFunction);
        cCode = decompiled.code;
      }
      
      const defaultName = fileName.replace('.exe', `_${selectedFunction.name}.c`);
      await window.electronAPI.saveFile(cCode, defaultName);
      setStatusMessage('Exported successfully');
    } catch (error) {
      console.error('Error exporting:', error);
      setStatusMessage('Export failed: ' + error.message);
    }
  };
  
  /**
   * Keyboard shortcuts
   */
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // F5 - Decompile selected function
      if (e.key === 'F5' && selectedFunction) {
        e.preventDefault();
        setActiveView('code');
      }
      
      // Ctrl+O - Open file
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
      
      // Ctrl+E - Export
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFunction]);
  
  // Prepare data for components
  const functions = patterns?.functions || [];
  
  // Create imported functions list from imports
  const importedFunctions = [];
  if (peData?.imports) {
    for (const dll of peData.imports) {
      for (const func of dll.functions) {
        if (!func.isOrdinal) {
          importedFunctions.push({
            name: func.name,
            address: `Import: ${dll.dll}`,
            dll: dll.dll,
            type: 'imported'
          });
        }
      }
    }
  }
  
  // Create exported functions list
  const exportedFunctions = peData?.exports?.map(exp => ({
    name: exp.name,
    address: exp.address?.toString(16) || '',
    type: 'exported',
    ordinal: exp.ordinal
  })) || [];
  
  // Get assembly and decompiled code for selected function
  let assemblyCode = '';
  let decompiledCode = '';
  
  if (selectedFunction && selectedFunction.instructions) {
    assemblyCode = selectedFunction.instructions;
    
    // Decompile on the fly
    try {
      const decompiled = decompileFunction(selectedFunction.instructions, peData, selectedFunction);
      decompiledCode = decompiled.code;
    } catch (error) {
      decompiledCode = `// Error decompiling function\n// ${error.message}`;
    }
  } else if (selectedFunction && selectedFunction.code) {
    decompiledCode = selectedFunction.code;
  }
  
  // Prepare hex viewer highlights
  const hexHighlights = [];
  if (peData && peData.sections) {
    for (const section of peData.sections) {
      let color = 'blue';
      if (section.type === 'code') color = 'green';
      else if (section.type === 'resource') color = 'yellow';
      
      hexHighlights.push({
        offset: section.pointerToRawData,
        length: Math.min(section.sizeOfRawData, 256), // Limit highlight size
        color,
        label: section.name
      });
    }
  }
  
  // Prepare analysis data
  const analysisData = peData ? {
    peData,
    patterns,
    fileName,
    fileSize
  } : null;
  
  return (
    <div className="app-enhanced">
      <Toolbar
        fileName={fileName}
        onOpenFile={handleOpenFile}
        onExport={handleExport}
        isAnalyzing={isAnalyzing}
      />
      
      <div className="main-layout">
        <FunctionList
          functions={functions}
          imports={importedFunctions}
          exports={exportedFunctions}
          selectedFunction={selectedFunction}
          onFunctionClick={handleFunctionClick}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        <div className="center-panel">
          <div className="view-selector">
            <button
              className={`view-btn ${activeView === 'code' ? 'active' : ''}`}
              onClick={() => setActiveView('code')}
            >
              💻 Code
            </button>
            <button
              className={`view-btn ${activeView === 'hex' ? 'active' : ''}`}
              onClick={() => setActiveView('hex')}
            >
              🔢 Hex
            </button>
            <button
              className={`view-btn ${activeView === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveView('analysis')}
            >
              📊 Analysis
            </button>
          </div>
          
          <div className="view-content">
            {activeView === 'code' && (
              <CodeViewer
                assembly={assemblyCode}
                decompiled={decompiledCode || '// Select a function to view decompiled code'}
              />
            )}
            
            {activeView === 'hex' && (
              <HexViewer
                data={fileData}
                highlights={hexHighlights}
              />
            )}
            
            {activeView === 'analysis' && (
              <AnalysisPanel analysisData={analysisData} />
            )}
          </div>
        </div>
      </div>
      
      <div className="status-bar">
        <span className="status-message">{statusMessage}</span>
        {fileSize > 0 && (
          <span className="status-info">
            Size: {(fileSize / 1024).toFixed(2)} KB
          </span>
        )}
        {peData && (
          <span className="status-info">
            Arch: {peData.architecture}
          </span>
        )}
        {functions.length > 0 && (
          <span className="status-info">
            Functions: {functions.length}
          </span>
        )}
      </div>
    </div>
  );
}

export default App;