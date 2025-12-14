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
import { decompileToGo } from './services/go-decompiler-complete';
import { saveToDesktop } from './utils/desktop-saver';
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
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  
  /**
   * Handle file opening and analysis
   */
  const handleOpenFile = async () => {
    try {
      // RESET STATE
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setAnalysisStage('Loading file...');
      setStatusMessage('Loading file...');
      
      // STEP 1: Load file (0-10%)
      const result = await window.electronAPI.openFile();
      if (!result) {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        setAnalysisStage('');
        setStatusMessage('Ready');
        return;
      }
      
      setFileName(result.name);
      setFileData(result.data);
      setFileSize(result.data.length);
      
      setAnalysisProgress(10);
      setStatusMessage('File loaded');
      
      // STEP 2: Parse PE structure (10-50%)
      setAnalysisProgress(25);
      setAnalysisStage('Parsing PE structure...');
      setStatusMessage('Parsing PE structure...');
      
      const parsedPE = parsePE(result.data);
      console.log('PE Data:', parsedPE); // DEBUG
      
      if (!parsedPE || !parsedPE.isValid) {
        setStatusMessage('❌ Failed to parse PE structure - invalid PE file');
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        setAnalysisStage('');
        return;
      }
      
      setPeData(parsedPE);
      setAnalysisProgress(50);
      setStatusMessage('PE structure parsed');
      
      // STEP 3: Extract strings (50-60%)
      setAnalysisProgress(55);
      setAnalysisStage('Extracting strings...');
      setStatusMessage('Extracting strings...');
      
      const strings = extractStrings(result.data);
      console.log('Strings:', strings.length); // DEBUG
      
      setAnalysisProgress(60);
      
      // STEP 4: Detect patterns (60-80%)
      setAnalysisProgress(65);
      setAnalysisStage('Detecting patterns...');
      setStatusMessage('Detecting patterns...');
      
      const detectedPatterns = detectPatterns(result.data, parsedPE);
      console.log('Patterns:', detectedPatterns); // DEBUG
      
      if (!detectedPatterns) {
        setStatusMessage('❌ Failed to detect patterns - file may be packed/encrypted');
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        setAnalysisStage('');
        return;
      }
      
      setPatterns(detectedPatterns);
      setAnalysisProgress(80);
      
      // STEP 5: Disassemble functions (80-95%)
      setAnalysisProgress(85);
      setAnalysisStage('Disassembling functions...');
      setStatusMessage('Disassembling functions...');
      
      // Give UI time to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setAnalysisProgress(95);
      
      // STEP 6: Complete (95-100%)
      setAnalysisProgress(100);
      setAnalysisStage('Ready');
      setStatusMessage('✅ Analysis complete - ready to decompile!');
      setIsAnalyzing(false);
      
    } catch (error) {
      console.error('Error opening file:', error);
      setStatusMessage('❌ Error: ' + error.message);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisStage('');
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
   * Handle Go decompilation - generates complete main.go file
   */
  const handleGoDecompile = async () => {
    try {
      if (!fileData) {
        setStatusMessage('❌ No file loaded');
        return;
      }
      if (!peData) {
        setStatusMessage('❌ PE structure not analyzed - try reopening file');
        return;
      }
      if (!patterns) {
        setStatusMessage('❌ Patterns not detected - file may be packed/encrypted');
        return;
      }
      
      setIsAnalyzing(true);
      setStatusMessage('Decompiling to Go... This may take a moment...');
      
      // Convert fileData array to Uint8Array
      const uint8Data = new Uint8Array(fileData);
      
      // Decompile to complete Go source
      const goSourceCode = decompileToGo(uint8Data, peData, patterns);
      
      setStatusMessage('Saving to Desktop/main.go...');
      
      // Save to Desktop
      const savedPath = await saveToDesktop(goSourceCode);
      
      setStatusMessage(`✅ Successfully decompiled! Saved to: ${savedPath}`);
      setIsAnalyzing(false);
      
      // Show success notification
      setTimeout(() => {
        if (statusMessage.includes('Successfully decompiled')) {
          setStatusMessage('Ready');
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error decompiling to Go:', error);
      setStatusMessage('❌ Go decompilation failed: ' + error.message);
      setIsAnalyzing(false);
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
          {/* Large Go Decompile Button */}
          {fileData && (
            <div className="decompile-action">
              {analysisProgress < 100 ? (
                <>
                  <div className="analyzing-indicator">
                    <div className="spinner"></div>
                    <div className="analyzing-text">{analysisStage} {analysisProgress}%</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${analysisProgress}%` }}></div>
                  </div>
                </>
              ) : (
                <>
                  <button
                    className="decompile-btn"
                    onClick={handleGoDecompile}
                    disabled={isAnalyzing}
                  >
                    🚀 DECOMPILE .EXE TO GO
                  </button>
                  <div className="decompile-info">
                    Generates complete main.go file with 1000-5000 lines • Saves to Desktop
                  </div>
                </>
              )}
            </div>
          )}
          
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