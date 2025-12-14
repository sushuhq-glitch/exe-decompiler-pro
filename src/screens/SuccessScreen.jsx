import React from 'react';
import { motion } from 'framer-motion';
import './SuccessScreen.css';

/**
 * Success Screen
 * Beautiful completion screen showing where files were saved
 */
function SuccessScreen({ onNewDecompile, outputPath, fileName, stats }) {
  const openFolder = async () => {
    if (outputPath && window.electronAPI.openFolder) {
      await window.electronAPI.openFolder(outputPath);
    }
  };

  return (
    <div className="success-screen">
      <motion.div
        className="success-content"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="success-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            delay: 0.2,
            type: 'spring',
            stiffness: 200,
            damping: 10
          }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 0.5,
              delay: 0.5,
              repeat: 2
            }}
          >
            ✅
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Decompilation Complete!
        </motion.h2>

        <motion.p
          className="success-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Successfully decompiled <strong>{fileName}</strong>
        </motion.p>

        <motion.div
          className="output-info glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="info-row">
            <span className="info-icon">📁</span>
            <div className="info-text">
              <div className="info-label">Saved to:</div>
              <div className="info-value">{outputPath}</div>
            </div>
          </div>

          {stats && (
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">⚙️</div>
                <div className="stat-value">{stats.functionsCount || 0}</div>
                <div className="stat-label">Functions</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">📝</div>
                <div className="stat-value">{stats.stringsCount || 0}</div>
                <div className="stat-label">Strings</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">📦</div>
                <div className="stat-value">{stats.importsCount || 0}</div>
                <div className="stat-label">Imports</div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">📄</div>
                <div className="stat-value">{stats.filesGenerated || 0}</div>
                <div className="stat-label">Files</div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          className="actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <button
            className="open-folder-btn"
            onClick={openFolder}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📂 Open Folder
          </button>
          <button
            className="new-decompile-btn"
            onClick={onNewDecompile}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⚡ Decompile Another
          </button>
        </motion.div>

        <motion.div
          className="confetti"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="confetti-piece"
              initial={{ 
                x: 0, 
                y: 0, 
                opacity: 1,
                scale: 0
              }}
              animate={{ 
                x: (Math.random() - 0.5) * 1000,
                y: Math.random() * 800 + 200,
                opacity: 0,
                scale: 1,
                rotate: Math.random() * 360
              }}
              transition={{ 
                duration: 2,
                delay: i * 0.02,
                ease: 'easeOut'
              }}
              style={{
                background: `hsl(${Math.random() * 360}, 70%, 60%)`
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default SuccessScreen;
