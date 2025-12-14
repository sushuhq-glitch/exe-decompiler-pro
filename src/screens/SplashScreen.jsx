import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import './SplashScreen.css';

/**
 * Animated Splash Screen
 * Shows beautiful loading animation on app startup
 */
function SplashScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="splash-screen">
      <motion.div
        className="splash-content"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="splash-icon"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          ⚡
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          EXE Decompiler Pro
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Advanced Reverse Engineering Tool
        </motion.p>
        
        <motion.div
          className="loading-bar"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}

export default SplashScreen;
