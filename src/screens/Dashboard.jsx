import React from 'react';
import { motion } from 'framer-motion';
import './Dashboard.css';

/**
 * Main Dashboard with large "DECOMPILE EXE" button
 * Simple and beautiful entry point
 */
function Dashboard({ onDecompileClick }) {
  return (
    <div className="dashboard">
      <motion.div
        className="dashboard-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="hero-section"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="hero-icon">💻</div>
          <h1>EXE Decompiler Pro</h1>
          <p>Transform compiled executables into readable source code</p>
        </motion.div>

        <motion.button
          className="decompile-btn"
          onClick={onDecompileClick}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: '0 20px 60px rgba(102, 126, 234, 0.6)'
          }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="btn-icon">⚡</span>
          <span className="btn-text">DECOMPILE EXE</span>
        </motion.button>

        <motion.div
          className="features-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="feature-card glass">
            <div className="feature-icon">🔍</div>
            <h3>Deep Analysis</h3>
            <p>Complete function extraction and analysis</p>
          </div>
          <div className="feature-card glass">
            <div className="feature-icon">🌐</div>
            <h3>Multi-Language</h3>
            <p>Output to C, Python, Go, or C++</p>
          </div>
          <div className="feature-card glass">
            <div className="feature-icon">📊</div>
            <h3>Rich Reports</h3>
            <p>Detailed analysis and documentation</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
