/**
 * Intelligent Go Code Generator
 * Generates specific, targeted Go code based on deep analysis results
 * 
 * This generator creates application-specific code instead of generic templates by:
 * - Generating only imports that are actually used
 * - Creating constants from real strings found in binary
 * - Building utility functions based on API patterns
 * - Generating main() specific to detected application type
 */

/**
 * Main generation function - creates complete Go source code from analysis
 * @param {Object} analysis - Deep analysis results from intelligent-analyzer
 * @returns {string} Complete Go source code
 */
export function generateIntelligentGo(analysis) {
  console.log('[GENERATOR] Generating intelligent Go code for:', analysis.appType?.type || 'UNKNOWN');
  
  const parts = [];
  
  // Package declaration
  parts.push('package main\n');
  
  // Imports (smart - only what's needed)
  parts.push(generateSmartImports(analysis));
  
  // Constants (from real strings)
  parts.push(generateSmartConstants(analysis));
  
  // Type definitions
  parts.push(generateTypes(analysis));
  
  // Global variables
  parts.push(generateGlobalVars(analysis));
  
  // Utility functions (based on API patterns)
  parts.push(generateUtilityFunctions(analysis));
  
  // Main function (specific to app type)
  parts.push(generateSmartMain(analysis));
  
  const code = parts.join('\n');
  console.log('[GENERATOR] Generated', code.split('\n').length, 'lines of Go code');
  
  return code;
}

/**
 * Generate smart imports based on actual API usage
 */
function generateSmartImports(analysis) {
  const imports = new Set();
  const purposes = new Set(analysis.apiCalls.map(call => call.purpose));
  
  // Core imports - always needed
  imports.add('fmt');
  imports.add('log');
  
  // Network imports
  if (purposes.has('HTTP_CLIENT_INIT') || purposes.has('HTTP_SEND') || purposes.has('HTTP_REQUEST')) {
    imports.add('net/http');
    imports.add('io/ioutil');
  }
  
  if (purposes.has('SOCKET_INIT') || purposes.has('SOCKET_LISTEN')) {
    imports.add('net');
  }
  
  // File I/O imports
  if (purposes.has('FILE_OPEN') || purposes.has('FILE_READ') || purposes.has('FILE_WRITE')) {
    imports.add('os');
    imports.add('io/ioutil');
  }
  
  // Crypto imports
  if (purposes.has('CRYPTO_HASH')) {
    imports.add('crypto/sha256');
    imports.add('encoding/hex');
  }
  
  if (purposes.has('CRYPTO_ENCRYPT') || purposes.has('CRYPTO_DECRYPT')) {
    imports.add('crypto/aes');
    imports.add('crypto/cipher');
  }
  
  // System imports
  if (purposes.has('HWID_VOLUME') || purposes.has('HWID_COMPUTER')) {
    imports.add('syscall');
    imports.add('unsafe');
  }
  
  // Registry imports (Windows)
  if (purposes.has('REGISTRY_OPEN') || purposes.has('REGISTRY_READ') || purposes.has('REGISTRY_WRITE')) {
    imports.add('golang.org/x/sys/windows/registry');
  }
  
  // JSON - if we have HTTP or detected JSON strings
  if (purposes.has('HTTP_SEND') || analysis.strings.all.some(s => s.value.includes('json'))) {
    imports.add('encoding/json');
  }
  
  // Time - if we have sleep or time-related operations
  if (purposes.has('THREAD_SLEEP') || purposes.has('THREAD_WAIT')) {
    imports.add('time');
  }
  
  // Context - for HTTP and cancellation
  if (purposes.has('HTTP_SEND') || purposes.has('SOCKET_ACCEPT')) {
    imports.add('context');
  }
  
  // Process/exec - for process creation
  if (purposes.has('PROCESS_CREATE')) {
    imports.add('os/exec');
  }
  
  // Strings package - commonly needed
  imports.add('strings');
  
  // Format imports nicely
  const importsArray = Array.from(imports).sort();
  const lines = ['import ('];
  
  for (const imp of importsArray) {
    if (imp.includes('/')) {
      lines.push(`\t"${imp}"`);
    } else {
      lines.push(`\t"${imp}"`);
    }
  }
  
  lines.push(')\n');
  return lines.join('\n');
}

/**
 * Generate smart constants from real strings in binary
 */
function generateSmartConstants(analysis) {
  const lines = [];
  
  // Only add const block if we have constants
  const hasConstants = 
    analysis.endpoints.length > 0 ||
    analysis.filePaths.length > 0 ||
    analysis.errorMessages.length > 0;
  
  if (!hasConstants) {
    return '';
  }
  
  lines.push('// Constants extracted from binary');
  lines.push('const (');
  
  // URLs / API endpoints
  if (analysis.endpoints.length > 0) {
    const primaryEndpoint = analysis.endpoints[0];
    lines.push(`\tAPIEndpoint = "${primaryEndpoint}"`);
    
    for (let i = 1; i < Math.min(analysis.endpoints.length, 5); i++) {
      lines.push(`\tAPIEndpoint${i + 1} = "${analysis.endpoints[i]}"`);
    }
  }
  
  // File paths
  if (analysis.filePaths.length > 0) {
    const configPaths = analysis.filePaths.filter(p => 
      p.toLowerCase().includes('config') || 
      p.toLowerCase().includes('.ini') ||
      p.toLowerCase().includes('.json')
    );
    
    if (configPaths.length > 0) {
      lines.push(`\tConfigPath = "${configPaths[0]}"`);
    }
    
    const logPaths = analysis.filePaths.filter(p => p.toLowerCase().includes('log'));
    if (logPaths.length > 0) {
      lines.push(`\tLogPath = "${logPaths[0]}"`);
    }
  }
  
  // Error messages as constants
  if (analysis.errorMessages.length > 0) {
    for (let i = 0; i < Math.min(analysis.errorMessages.length, 3); i++) {
      const msg = analysis.errorMessages[i];
      const constName = 'Err' + msg.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '');
      lines.push(`\t${constName} = "${msg}"`);
    }
  }
  
  lines.push(')\n');
  return lines.join('\n');
}

/**
 * Generate type definitions based on application type
 */
function generateTypes(analysis) {
  const lines = [];
  const appType = analysis.appType?.type || 'CLI_TOOL';
  
  lines.push('// Type definitions');
  
  switch (appType) {
    case 'LICENSE_CHECKER':
      lines.push(`
type LicenseRequest struct {
\tHWID      string \`json:"hwid"\`
\tProductID string \`json:"product_id"\`
\tVersion   string \`json:"version"\`
}

type LicenseResponse struct {
\tValid     bool   \`json:"valid"\`
\tMessage   string \`json:"message"\`
\tExpiresAt string \`json:"expires_at,omitempty"\`
}
`);
      break;
      
    case 'HTTP_SERVER':
      lines.push(`
type Request struct {
\tID     string                 \`json:"id"\`
\tMethod string                 \`json:"method"\`
\tPath   string                 \`json:"path"\`
\tBody   map[string]interface{} \`json:"body,omitempty"\`
}

type Response struct {
\tSuccess bool        \`json:"success"\`
\tData    interface{} \`json:"data,omitempty"\`
\tError   string      \`json:"error,omitempty"\`
}
`);
      break;
      
    case 'FILE_PROCESSOR':
      lines.push(`
type ProcessOptions struct {
\tInputPath  string
\tOutputPath string
\tBufferSize int
\tEncrypt    bool
}
`);
      break;
  }
  
  return lines.join('\n');
}

/**
 * Generate global variables
 */
function generateGlobalVars(analysis) {
  const lines = ['// Global variables'];
  const purposes = new Set(analysis.apiCalls.map(call => call.purpose));
  
  if (purposes.has('HTTP_CLIENT_INIT')) {
    lines.push('var client *http.Client');
  }
  
  if (purposes.has('SOCKET_LISTEN')) {
    lines.push('var listener net.Listener');
  }
  
  lines.push('var logger *log.Logger\n');
  
  return lines.join('\n');
}

/**
 * Generate utility functions based on API patterns
 */
function generateUtilityFunctions(analysis) {
  const functions = [];
  const purposes = new Set(analysis.apiCalls.map(call => call.purpose));
  const appType = analysis.appType?.type || 'CLI_TOOL';
  
  // HWID function if needed
  if (purposes.has('HWID_VOLUME')) {
    functions.push(generateGetHWIDFunction(analysis));
  }
  
  // HTTP client function
  if (purposes.has('HTTP_SEND') || purposes.has('HTTP_REQUEST')) {
    functions.push(generateHTTPClientFunction(analysis, appType));
  }
  
  // File I/O functions
  if (purposes.has('FILE_READ') && purposes.has('FILE_WRITE')) {
    functions.push(generateFileProcessFunction(analysis));
  }
  
  // Crypto functions
  if (purposes.has('CRYPTO_HASH')) {
    functions.push(generateHashFunction());
  }
  
  if (purposes.has('CRYPTO_ENCRYPT')) {
    functions.push(generateEncryptFunction());
  }
  
  // Helper functions
  functions.push(generateHelperFunctions(analysis));
  
  return functions.join('\n\n');
}

/**
 * Generate GetHardwareID function
 */
function generateGetHWIDFunction(analysis) {
  return `// GetHardwareID retrieves unique hardware identifier
func GetHardwareID() (string, error) {
\tkernel32 := syscall.NewLazyDLL("kernel32.dll")
\tgetVolumeInfo := kernel32.NewProc("GetVolumeInformationA")
\t
\tvar serialNumber uint32
\tret, _, err := getVolumeInfo.Call(
\t\tuintptr(unsafe.Pointer(syscall.StringToUTF16Ptr("C:\\\\"))),
\t\t0, 0, uintptr(unsafe.Pointer(&serialNumber)),
\t\t0, 0, 0, 0,
\t)
\t
\tif ret == 0 {
\t\treturn "", fmt.Errorf("failed to get volume information: %v", err)
\t}
\t
\t// Convert to string
\thwidStr := fmt.Sprintf("%X", serialNumber)
\treturn hwidStr, nil
}`;
}

/**
 * Generate HTTP client function based on app type
 */
function generateHTTPClientFunction(analysis, appType) {
  if (appType === 'LICENSE_CHECKER') {
    const endpoint = analysis.endpoints[0] || 'https://api.example.com/check';
    
    return `// CheckLicense validates license with remote server
func CheckLicense(hwid string) (bool, error) {
\t// Build request
\treqData := LicenseRequest{
\t\tHWID:      hwid,
\t\tProductID: "app-001",
\t\tVersion:   "1.0.0",
\t}
\t
\tjsonData, err := json.Marshal(reqData)
\tif err != nil {
\t\treturn false, fmt.Errorf("failed to marshal request: %w", err)
\t}
\t
\t// Send HTTP request
\tresp, err := http.Post("${endpoint}", "application/json", strings.NewReader(string(jsonData)))
\tif err != nil {
\t\treturn false, fmt.Errorf("HTTP request failed: %w", err)
\t}
\tdefer resp.Body.Close()
\t
\t// Parse response
\tbody, err := ioutil.ReadAll(resp.Body)
\tif err != nil {
\t\treturn false, fmt.Errorf("failed to read response: %w", err)
\t}
\t
\tvar licenseResp LicenseResponse
\tif err := json.Unmarshal(body, &licenseResp); err != nil {
\t\treturn false, fmt.Errorf("failed to parse response: %w", err)
\t}
\t
\treturn licenseResp.Valid, nil
}`;
  } else {
    // Generic HTTP client
    return `// SendHTTPRequest sends HTTP request to endpoint
func SendHTTPRequest(method, url string, body []byte) ([]byte, error) {
\tvar req *http.Request
\tvar err error
\t
\tif body != nil {
\t\treq, err = http.NewRequest(method, url, strings.NewReader(string(body)))
\t} else {
\t\treq, err = http.NewRequest(method, url, nil)
\t}
\t
\tif err != nil {
\t\treturn nil, fmt.Errorf("failed to create request: %w", err)
\t}
\t
\treq.Header.Set("Content-Type", "application/json")
\t
\tclient := &http.Client{Timeout: 30 * time.Second}
\tresp, err := client.Do(req)
\tif err != nil {
\t\treturn nil, fmt.Errorf("HTTP request failed: %w", err)
\t}
\tdefer resp.Body.Close()
\t
\treturn ioutil.ReadAll(resp.Body)
}`;
  }
}

/**
 * Generate file processing function
 */
function generateFileProcessFunction(analysis) {
  return `// ProcessFile reads input file, processes it, and writes to output
func ProcessFile(inputPath, outputPath string) error {
\t// Read input file
\tdata, err := ioutil.ReadFile(inputPath)
\tif err != nil {
\t\treturn fmt.Errorf("failed to read input file: %w", err)
\t}
\t
\tlog.Printf("Read %d bytes from %s", len(data), inputPath)
\t
\t// Process data (implement your transformation logic here)
\tprocessedData := transformData(data)
\t
\t// Write output file
\terr = ioutil.WriteFile(outputPath, processedData, 0644)
\tif err != nil {
\t\treturn fmt.Errorf("failed to write output file: %w", err)
\t}
\t
\tlog.Printf("Wrote %d bytes to %s", len(processedData), outputPath)
\treturn nil
}

// transformData applies transformation to data
func transformData(data []byte) []byte {
\t// Example: simple transformation
\tresult := make([]byte, len(data))
\tcopy(result, data)
\treturn result
}`;
}

/**
 * Generate hash function
 */
function generateHashFunction() {
  return `// HashData computes SHA256 hash of data
func HashData(data []byte) string {
\thash := sha256.Sum256(data)
\treturn hex.EncodeToString(hash[:])
}`;
}

/**
 * Generate encrypt function
 */
function generateEncryptFunction() {
  return `// EncryptData encrypts data using AES-256
func EncryptData(key, plaintext []byte) ([]byte, error) {
\tblock, err := aes.NewCipher(key)
\tif err != nil {
\t\treturn nil, fmt.Errorf("failed to create cipher: %w", err)
\t}
\t
\tgcm, err := cipher.NewGCM(block)
\tif err != nil {
\t\treturn nil, fmt.Errorf("failed to create GCM: %w", err)
\t}
\t
\tnonce := make([]byte, gcm.NonceSize())
\t// In production, use crypto/rand to generate nonce
\t
\tciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
\treturn ciphertext, nil
}`;
}

/**
 * Generate helper functions
 */
function generateHelperFunctions(analysis) {
  return `// Helper functions

// initLogger initializes the logger
func initLogger() {
\tlogger = log.New(os.Stdout, "[APP] ", log.LstdFlags)
}

// handleError logs error and exits if critical
func handleError(err error, critical bool) {
\tif err != nil {
\t\tlogger.Printf("ERROR: %v", err)
\t\tif critical {
\t\t\tos.Exit(1)
\t\t}
\t}
}`;
}

/**
 * Generate smart main function specific to app type
 */
function generateSmartMain(analysis) {
  const appType = analysis.appType?.type || 'CLI_TOOL';
  
  switch (appType) {
    case 'LICENSE_CHECKER':
      return generateLicenseCheckerMain(analysis);
    
    case 'HTTP_SERVER':
      return generateHTTPServerMain(analysis);
    
    case 'HTTP_CLIENT':
      return generateHTTPClientMain(analysis);
    
    case 'FILE_PROCESSOR':
      return generateFileProcessorMain(analysis);
    
    default:
      return generateGenericMain(analysis);
  }
}

/**
 * Generate main function for license checker
 */
function generateLicenseCheckerMain(analysis) {
  const hasRegistry = analysis.features.hasRegistry;
  
  return `
// main entry point
func main() {
\t// Initialize
\tinitLogger()
\tlogger.Println("Starting license validation...")
\t
\t// Get hardware ID
\thwid, err := GetHardwareID()
\tif err != nil {
\t\tlogger.Printf("Failed to get HWID: %v", err)
\t\tos.Exit(1)
\t}
\t
\tlogger.Printf("Hardware ID: %s", hwid)
\t
\t// Hash HWID for security
\thashedHWID := HashData([]byte(hwid))
\tlogger.Printf("Hashed HWID: %s", hashedHWID)
\t
\t// Check license with server
\tvalid, err := CheckLicense(hashedHWID)
\tif err != nil {
\t\tlogger.Printf("License check failed: %v", err)
\t\tos.Exit(1)
\t}
\t
\tif !valid {
\t\tlogger.Println("Invalid license")
\t\tos.Exit(1)
\t}
\t
\tlogger.Println("License valid")
${hasRegistry ? '\t\n\t// Save license status to registry\n\t// (Registry code here)\n' : ''}\t
\tos.Exit(0)
}`;
}

/**
 * Generate main function for HTTP server
 */
function generateHTTPServerMain(analysis) {
  return `
// main entry point
func main() {
\t// Initialize
\tinitLogger()
\tlogger.Println("Starting HTTP server...")
\t
\t// Setup routes
\thttp.HandleFunc("/", handleRoot)
\thttp.HandleFunc("/api/status", handleStatus)
\t
\t// Start server
\tport := ":8080"
\tlogger.Printf("Listening on %s", port)
\t
\terr := http.ListenAndServe(port, nil)
\tif err != nil {
\t\tlogger.Printf("Server error: %v", err)
\t\tos.Exit(1)
\t}
}

// HTTP Handlers

func handleRoot(w http.ResponseWriter, r *http.Request) {
\tw.Header().Set("Content-Type", "application/json")
\tjson.NewEncoder(w).Encode(Response{
\t\tSuccess: true,
\t\tData:    "Server is running",
\t})
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
\tw.Header().Set("Content-Type", "application/json")
\tjson.NewEncoder(w).Encode(Response{
\t\tSuccess: true,
\t\tData: map[string]interface{}{
\t\t\t"status": "healthy",
\t\t\t"uptime": "unknown",
\t\t},
\t})
}`;
}

/**
 * Generate main function for HTTP client
 */
function generateHTTPClientMain(analysis) {
  const endpoint = analysis.endpoints[0] || 'https://api.example.com/data';
  
  return `
// main entry point
func main() {
\t// Initialize
\tinitLogger()
\tlogger.Println("Starting HTTP client...")
\t
\t// Send request
\tbody, err := SendHTTPRequest("GET", "${endpoint}", nil)
\tif err != nil {
\t\tlogger.Printf("Request failed: %v", err)
\t\tos.Exit(1)
\t}
\t
\tlogger.Printf("Response: %s", string(body))
\t
\t// Optionally save to file
\tif len(body) > 0 {
\t\terr = ioutil.WriteFile("output.json", body, 0644)
\t\tif err != nil {
\t\t\tlogger.Printf("Failed to save output: %v", err)
\t\t} else {
\t\t\tlogger.Println("Response saved to output.json")
\t\t}
\t}
\t
\tos.Exit(0)
}`;
}

/**
 * Generate main function for file processor
 */
function generateFileProcessorMain(analysis) {
  return `
// main entry point
func main() {
\t// Initialize
\tinitLogger()
\tlogger.Println("Starting file processor...")
\t
\t// Parse command line arguments
\tif len(os.Args) < 3 {
\t\tlogger.Println("Usage: program <input> <output>")
\t\tos.Exit(1)
\t}
\t
\tinputPath := os.Args[1]
\toutputPath := os.Args[2]
\t
\t// Process file
\terr := ProcessFile(inputPath, outputPath)
\tif err != nil {
\t\tlogger.Printf("Processing failed: %v", err)
\t\tos.Exit(1)
\t}
\t
\tlogger.Println("Processing complete")
\tos.Exit(0)
}`;
}

/**
 * Generate generic main function
 */
function generateGenericMain(analysis) {
  return `
// main entry point
func main() {
\t// Initialize
\tinitLogger()
\tlogger.Println("Starting application...")
\t
\t// Main application logic
\tlogger.Println("Executing main functionality...")
\t
\t// Example: Print detected strings
${analysis.strings.urls.length > 0 ? `\tlogger.Println("Detected URLs:")
\tfor _, url := range []string{${analysis.strings.urls.slice(0, 3).map(u => `"${u}"`).join(', ')}} {
\t\tlogger.Printf("  - %s", url)
\t}
` : ''}\t
\tlogger.Println("Application complete")
\tos.Exit(0)
}`;
}
