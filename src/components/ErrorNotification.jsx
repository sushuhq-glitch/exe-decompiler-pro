import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ErrorNotification.css';

/**
 * Modern Error Notification Toast
 * Matches glassmorphism design theme
 */
function ErrorNotification({ message, onClose }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="error-notification-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="error-notification glass"
            initial={{ scale: 0.8, y: -50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <h3>Error</h3>
              <p>{message}</p>
            </div>
            <button className="error-close" onClick={onClose}>
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ErrorNotification;
