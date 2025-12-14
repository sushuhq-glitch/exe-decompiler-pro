import React, { useState } from 'react';
import Toolbar from './components/Toolbar';
import FunctionList from './components/FunctionList';
import CodeViewer from './components/CodeViewer';
import HexViewer from './components/HexViewer';
import AnalysisPanel from './components/AnalysisPanel';
import StringViewer from './components/StringViewer';
import DIEPanel from './components/DIEPanel';
import SearchPanel from './components/SearchPanel';
import { parsePE, extractStrings } from './services/pe-parser';
import { disassemble } from './services/disassembler';
import { detectPatterns } from './services/patterns';
import { decompileFunction } from './services/decompiler-core';
import { decompileToPython } from './services/decompiler-python';
import { decompileToGolang } from './services/decompiler-golang';
import { decompileToCpp } from './services/decompiler-cpp';
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
  const [activeView, setActiveView] = useState('code'); // 'code', 'hex', 'analysis', 'strings', 'die', 'search'
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [decompileLanguage, setDecompileLanguage] = useState('c'); // 'c', 'python', 'golang', 'cpp'
  const [hexJumpOffset, setHexJumpOffset] = useState(null);
  
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
    
    // Decompile to selected language
    try {
      let decompiled;
      
      switch (decompileLanguage) {
        case 'python':
          decompiled = decompileToPython(selectedFunction.instructions, peData, selectedFunction);
          break;
        case 'golang':
          decompiled = decompileToGolang(selectedFunction.instructions, peData, selectedFunction);
          break;
        case 'cpp':
          decompiled = decompileToCpp(selectedFunction.instructions, peData, selectedFunction);
          break;
        case 'c':
        default:
          decompiled = decompileFunction(selectedFunction.instructions, peData, selectedFunction);
          break;
      }
      
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
              Code
            </button>
            <button
              className={`view-btn ${activeView === 'hex' ? 'active' : ''}`}
              onClick={() => setActiveView('hex')}
            >
              Hex
            </button>
            <button
              className={`view-btn ${activeView === 'strings' ? 'active' : ''}`}
              onClick={() => setActiveView('strings')}
            >
              Strings
            </button>
            <button
              className={`view-btn ${activeView === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveView('analysis')}
            >
              Analysis
            </button>
            <button
              className={`view-btn ${activeView === 'die' ? 'active' : ''}`}
              onClick={() => setActiveView('die')}
            >
              Detection
            </button>
            <button
              className={`view-btn ${activeView === 'search' ? 'active' : ''}`}
              onClick={() => setActiveView('search')}
            >
              Search
            </button>
            
            {activeView === 'code' && selectedFunction && (
              <div className="language-selector">
                <select
                  value={decompileLanguage}
                  onChange={(e) => setDecompileLanguage(e.target.value)}
                  className="language-select"
                >
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                  <option value="golang">Go</option>
                </select>
              </div>
            )}
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
                jumpToOffset={hexJumpOffset}
              />
            )}
            
            {activeView === 'strings' && (
              <StringViewer
                fileData={fileData}
                peData={peData}
                onJumpToHex={(offset) => {
                  setHexJumpOffset(offset);
                  setActiveView('hex');
                }}
              />
            )}
            
            {activeView === 'analysis' && (
              <AnalysisPanel analysisData={analysisData} />
            )}
            
            {activeView === 'die' && (
              <DIEPanel
                fileData={fileData}
                peData={peData}
              />
            )}
            
            {activeView === 'search' && (
              <SearchPanel
                fileData={fileData}
                peData={peData}
                onResultClick={(offset) => {
                  setHexJumpOffset(offset);
                  setActiveView('hex');
                }}
              />
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