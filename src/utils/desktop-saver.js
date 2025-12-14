/**
 * Desktop File Saver Utility
 * Saves decompiled Go code to the user's Desktop
 */

/**
 * Save decompiled Go code to Desktop/main.go
 * @param {string} goCode - Complete Go source code
 * @returns {Promise<string>} Path to saved file
 */
export async function saveToDesktop(goCode) {
  if (!window.electronAPI || !window.electronAPI.saveToDesktop) {
    throw new Error('Desktop save API not available');
  }
  
  try {
    const result = await window.electronAPI.saveToDesktop(goCode, 'main.go');
    return result;
  } catch (error) {
    throw new Error(`Failed to save to desktop: ${error.message}`);
  }
}

/**
 * Get the Desktop path for the current OS
 * @returns {Promise<string>} Desktop directory path
 */
export async function getDesktopPath() {
  if (!window.electronAPI || !window.electronAPI.getDesktopPath) {
    throw new Error('Desktop path API not available');
  }
  
  try {
    const path = await window.electronAPI.getDesktopPath();
    return path;
  } catch (error) {
    throw new Error(`Failed to get desktop path: ${error.message}`);
  }
}

export default {
  saveToDesktop,
  getDesktopPath
};
