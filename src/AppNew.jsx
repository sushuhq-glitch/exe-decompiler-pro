import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from './screens/SplashScreen';
import Dashboard from './screens/Dashboard';
import FilePicker from './screens/FilePicker';
import LanguageSelector from './screens/LanguageSelector';
import ProgressScreen from './screens/ProgressScreen';
import SuccessScreen from './screens/SuccessScreen';
import { autoDecompile } from './services/auto-decompiler';

/**
 * New Modern App with Animated Workflow
 * Orchestrates the complete decompilation experience
 */
function AppNew() {
  const [screen, setScreen] = useState('splash');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('c');
  const [decompileResults, setDecompileResults] = useState(null);

  // Screen transitions
  const handleSplashComplete = () => {
    setScreen('dashboard');
  };

  const handleDecompileClick = () => {
    setScreen('filePicker');
  };

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setScreen('languageSelector');
  };

  const handleLanguageSelected = async (language) => {
    setSelectedLanguage(language);
    setScreen('progress');
    
    // Start decompilation process
    try {
      const results = await autoDecompile(
        selectedFile,
        language,
        (stage, progress) => {
          console.log(`${stage}: ${progress}%`);
        }
      );
      
      // Save to Desktop
      if (results.success) {
        const projectName = `DecompiledProject_${selectedFile.name.replace(/\.(exe|dll)$/i, '')}`;
        
        // Check if running in Electron
        if (window.electronAPI && window.electronAPI.saveToDesktop) {
          const saveResult = await window.electronAPI.saveToDesktop(projectName, results.files);
          
          if (saveResult.success) {
            setDecompileResults({
              outputPath: saveResult.path,
              fileName: selectedFile.name,
              stats: results.stats
            });
          }
        } else {
          // Demo mode - just set results without saving
          setDecompileResults({
            outputPath: `/Desktop/${projectName}`,
            fileName: selectedFile.name,
            stats: results.stats
          });
        }
      }
    } catch (error) {
      console.error('Decompilation error:', error);
      alert('Decompilation failed: ' + error.message);
      setScreen('dashboard');
    }
  };

  const handleProgressComplete = () => {
    setScreen('success');
  };

  const handleNewDecompile = () => {
    setSelectedFile(null);
    setSelectedLanguage('c');
    setDecompileResults(null);
    setScreen('dashboard');
  };

  const handleBack = () => {
    if (screen === 'filePicker') {
      setScreen('dashboard');
    } else if (screen === 'languageSelector') {
      setScreen('filePicker');
    }
  };

  return (
    <div className="app-new">
      <AnimatePresence mode="wait">
        {screen === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SplashScreen onComplete={handleSplashComplete} />
          </motion.div>
        )}

        {screen === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <Dashboard onDecompileClick={handleDecompileClick} />
          </motion.div>
        )}

        {screen === 'filePicker' && (
          <motion.div
            key="filePicker"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            <FilePicker 
              onFileSelected={handleFileSelected}
              onBack={handleBack}
            />
          </motion.div>
        )}

        {screen === 'languageSelector' && (
          <motion.div
            key="languageSelector"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            <LanguageSelector
              onLanguageSelected={handleLanguageSelected}
              onBack={handleBack}
            />
          </motion.div>
        )}

        {screen === 'progress' && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <ProgressScreen
              onComplete={handleProgressComplete}
              fileName={selectedFile?.name || 'Unknown'}
              language={selectedLanguage}
            />
          </motion.div>
        )}

        {screen === 'success' && decompileResults && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            <SuccessScreen
              onNewDecompile={handleNewDecompile}
              outputPath={decompileResults.outputPath}
              fileName={decompileResults.fileName}
              stats={decompileResults.stats}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AppNew;
