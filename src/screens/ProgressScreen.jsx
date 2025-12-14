import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ProgressScreen.css';

/**
 * Animated Progress Screen
 * Shows stages with smooth percentage counter and animations
 */
function ProgressScreen({ onComplete, fileName, language }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const stages = [
    { name: 'Loading File', emoji: '📂', duration: 1000 },
    { name: 'Parsing PE Headers', emoji: '🔍', duration: 1500 },
    { name: 'Loading Strings', emoji: '📝', duration: 2000 },
    { name: 'Extracting Functions', emoji: '⚙️', duration: 2500 },
    { name: 'Disassembling Code', emoji: '🔨', duration: 3000 },
    { name: 'Decompiling to ' + language.toUpperCase(), emoji: '✨', duration: 3500 },
    { name: 'Generating Reports', emoji: '📊', duration: 1500 },
    { name: 'Saving to Desktop', emoji: '💾', duration: 1000 }
  ];

  useEffect(() => {
    const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 50;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);
      
      const remaining = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));
      setTimeRemaining(remaining);

      // Update current stage
      let cumulativeDuration = 0;
      for (let i = 0; i < stages.length; i++) {
        cumulativeDuration += stages[i].duration;
        if (elapsed < cumulativeDuration) {
          setCurrentStage(i);
          break;
        }
      }

      if (newProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => onComplete(), 500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [stages, onComplete]);

  return (
    <div className="progress-screen">
      <motion.div
        className="progress-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="progress-header"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2>Decompiling</h2>
          <p className="file-name">{fileName}</p>
        </motion.div>

        <div className="stages-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              className="current-stage"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="stage-emoji"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                {stages[currentStage].emoji}
              </motion.div>
              <h3>{stages[currentStage].name}...</h3>
              <motion.div
                className="percentage"
                key={progress}
              >
                {Math.floor(progress)}%
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="progress-bar-container">
          <motion.div
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
          <div className="progress-glow" style={{ left: `${progress}%` }} />
        </div>

        <div className="progress-info">
          <div className="time-remaining">
            ⏱️ Estimated: {timeRemaining}s remaining
          </div>
          <div className="stage-counter">
            Stage {currentStage + 1} of {stages.length}
          </div>
        </div>

        <div className="stages-list">
          {stages.map((stage, index) => (
            <motion.div
              key={index}
              className={`stage-item ${index < currentStage ? 'completed' : ''} ${index === currentStage ? 'active' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="stage-icon">
                {index < currentStage ? '✅' : index === currentStage ? '🔄' : '⏸️'}
              </div>
              <span>{stage.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default ProgressScreen;
