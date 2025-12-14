import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getDemoFileData } from '../services/demo-data';
import './FilePicker.css';

/**
 * File Picker with Drag & Drop
 * Beautiful interface for selecting EXE files
 */
function FilePicker({ onFileSelected, onBack }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.exe') || file.name.endsWith('.dll')) {
        setSelectedFile(file);
      } else {
        alert('Please select a .exe or .dll file');
      }
    }
  }, []);

  const handleFileInput = async () => {
    // Check if running in Electron
    if (window.electronAPI && window.electronAPI.openFile) {
      const result = await window.electronAPI.openFile();
      if (result) {
        setSelectedFile({
          name: result.name,
          data: result.data,
          path: result.path
        });
      }
    } else {
      // Demo mode for web testing
      const demoData = getDemoFileData();
      setSelectedFile(demoData);
    }
  };

  const handleDemoFile = () => {
    const demoData = getDemoFileData();
    setSelectedFile(demoData);
  };

  const handleContinue = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
    }
  };

  return (
    <div className="file-picker">
      <motion.div
        className="file-picker-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Select Executable File
        </motion.h2>

        <motion.div
          className={`drop-zone glass ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          whileHover={{ scale: 1.02 }}
        >
          {!selectedFile ? (
            <>
              <div className="drop-icon">📁</div>
              <p className="drop-text">Drag & Drop your .exe file here</p>
              <p className="drop-subtext">or</p>
              <button className="browse-btn" onClick={handleFileInput}>
                Browse Files
              </button>
              <button className="browse-btn" onClick={handleDemoFile} style={{ marginTop: '10px', background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)' }}>
                Use Demo File
              </button>
            </>
          ) : (
            <>
              <div className="file-icon">✅</div>
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">
                {selectedFile.data ? 
                  `${(selectedFile.data.length / 1024).toFixed(2)} KB` :
                  'Ready to decompile'
                }
              </p>
              <button className="change-btn" onClick={handleFileInput}>
                Change File
              </button>
            </>
          )}
        </motion.div>

        {selectedFile && (
          <motion.button
            className="continue-btn"
            onClick={handleContinue}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Continue →
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

export default FilePicker;
