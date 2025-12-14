/**
 * ============================================================================
 * DESKTOP SAVER UTILITY
 * ============================================================================
 * 
 * Saves decompiled files to the user's desktop in a structured folder.
 * 
 * Output structure:
 * Desktop/Decompiled_<filename>_go/
 * ├── main.go                    (500-2000+ lines of Go code)
 * ├── go.mod                     (Go module file)
 * ├── README.md                  (Build instructions)
 * ├── strings.txt                (All extracted strings)
 * ├── imports.txt                (All imports)
 * └── analysis.json              (Analysis data)
 * 
 * @author Desktop Saver
 * @version 1.0.0
 */

/**
 * This is a client-side module that communicates with the Electron main process
 * The actual file operations are handled by the Electron IPC handler
 */

/**
 * Save decompilation results to desktop (called from renderer)
 */
export async function saveToDesktop(data) {
  if (window.electronAPI && window.electronAPI.saveToDesktop) {
    return await window.electronAPI.saveToDesktop(data);
  }
  
  // Fallback for non-Electron environments
  console.warn('Electron API not available, cannot save to desktop');
  return {
    success: false,
    error: 'Electron API not available'
  };
}

export default {
  saveToDesktop
};
