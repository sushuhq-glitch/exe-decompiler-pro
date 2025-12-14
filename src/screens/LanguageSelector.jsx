import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './LanguageSelector.css';

/**
 * Language Selector Screen
 * Choose output language: C, Python, Go, C++
 */
function LanguageSelector({ onLanguageSelected, onBack }) {
  const [selectedLanguage, setSelectedLanguage] = useState('c');

  const languages = [
    { id: 'c', name: 'C', icon: '🔧', description: 'Classic C pseudocode', color: '#5C6BC0' },
    { id: 'python', name: 'Python', icon: '🐍', description: 'Pythonic syntax', color: '#66BB6A' },
    { id: 'go', name: 'Go', icon: '🐹', description: 'Modern Go-style', color: '#29B6F6' },
    { id: 'cpp', name: 'C++', icon: '⚙️', description: 'C++ with classes', color: '#EC407A' }
  ];

  const handleContinue = () => {
    onLanguageSelected(selectedLanguage);
  };

  return (
    <div className="language-selector">
      <motion.div
        className="language-selector-content"
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
          Choose Output Language
        </motion.h2>

        <motion.div
          className="languages-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {languages.map((lang, index) => (
            <motion.div
              key={lang.id}
              className={`language-card glass ${selectedLanguage === lang.id ? 'selected' : ''}`}
              onClick={() => setSelectedLanguage(lang.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              style={{
                borderColor: selectedLanguage === lang.id ? lang.color : 'transparent'
              }}
            >
              <div className="lang-icon" style={{ 
                background: selectedLanguage === lang.id ? lang.color : 'rgba(255,255,255,0.1)' 
              }}>
                {lang.icon}
              </div>
              <h3>{lang.name}</h3>
              <p>{lang.description}</p>
              {selectedLanguage === lang.id && (
                <motion.div
                  className="check-mark"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.button
          className="continue-btn"
          onClick={handleContinue}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Decompiling →
        </motion.button>
      </motion.div>
    </div>
  );
}

export default LanguageSelector;
