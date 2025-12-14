import React, { useState } from 'react';
import Toolbar from './components/Toolbar';
import FunctionList from './components/FunctionList';
import CodeViewer from './components/CodeViewer';
import { analyzeExecutable } from './services/decompiler';
import './App.css';

function App() {
  const [fileName, setFileName] = useState('');
  const [functions, setFunctions] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [decompiledCode, setDecompiledCode] = useState('// Select a function and press F5 to decompile');
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenFile = async () => {
    try {
      const fileData = await window.electronAPI.openFile();
      if (fileData) {
        setFileName(fileData.name);
        const analysisResult = analyzeExecutable(fileData.data);
        setFunctions(analysisResult.functions);
        setDecompiledCode('// File loaded. Select a function to decompile.');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      setDecompiledCode('// Error loading file: ' + error.message);
    }
  };

  const handleExport = async () => {
    if (decompiledCode) {
      await window.electronAPI.saveFile(decompiledCode, fileName.replace('.exe', '.c'));
    }
  };

  const handleFunctionClick = (func) => {
    setSelectedFunction(func);
    setDecompiledCode(func.code);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'F5' && selectedFunction) {
      e.preventDefault();
      setDecompiledCode(selectedFunction.code);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFunction]);

  const filteredFunctions = functions.filter(func =>
    func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    func.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app">
      <Toolbar
        fileName={fileName}
        onOpenFile={handleOpenFile}
        onExport={handleExport}
      />
      <div className="main-content">
        <FunctionList
          functions={filteredFunctions}
          selectedFunction={selectedFunction}
          onFunctionClick={handleFunctionClick}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <CodeViewer code={decompiledCode} />
      </div>
    </div>
  );
}

export default App;