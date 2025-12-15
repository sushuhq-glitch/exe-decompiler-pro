/**
 * Intelligent Binary Analyzer
 * Deep analysis of executable files to extract meaningful patterns and reconstruct application logic
 * 
 * This analyzer goes beyond generic templates by:
 * - Analyzing ALL strings from the binary
 * - Mapping ALL API calls to specific purposes
 * - Detecting application type (LICENSE_CHECKER, HTTP_SERVER, FILE_PROCESSOR, etc.)
 * - Reconstructing main logic flow based on API usage patterns
 */

// API Call Mapping - Maps Windows API calls to Go equivalents and purposes
const API_MAPPING = {
  // HTTP/Network APIs
  'WinHTTP.dll': {
    'WinHttpOpen': { purpose: 'HTTP_CLIENT_INIT', go: 'http.Client{}', confidence: 0.95 },
    'WinHttpConnect': { purpose: 'HTTP_CONNECT', go: 'http.NewRequest', confidence: 0.95 },
    'WinHttpOpenRequest': { purpose: 'HTTP_REQUEST', go: 'http.NewRequest', confidence: 0.95 },
    'WinHttpSendRequest': { purpose: 'HTTP_SEND', go: 'client.Do(req)', confidence: 0.95 },
    'WinHttpReceiveResponse': { purpose: 'HTTP_RECEIVE', go: 'resp.Body', confidence: 0.95 },
    'WinHttpReadData': { purpose: 'HTTP_READ', go: 'ioutil.ReadAll(resp.Body)', confidence: 0.95 },
    'WinHttpCloseHandle': { purpose: 'HTTP_CLOSE', go: 'defer resp.Body.Close()', confidence: 0.9 }
  },
  
  'WININET.dll': {
    'InternetOpenA': { purpose: 'HTTP_CLIENT_INIT', go: 'http.Client{}', confidence: 0.9 },
    'InternetConnectA': { purpose: 'HTTP_CONNECT', go: 'http.NewRequest', confidence: 0.9 },
    'HttpOpenRequestA': { purpose: 'HTTP_REQUEST', go: 'http.NewRequest', confidence: 0.9 },
    'HttpSendRequestA': { purpose: 'HTTP_SEND', go: 'client.Do(req)', confidence: 0.9 },
    'InternetReadFile': { purpose: 'HTTP_READ', go: 'ioutil.ReadAll', confidence: 0.9 },
    'InternetCloseHandle': { purpose: 'HTTP_CLOSE', go: 'defer close', confidence: 0.85 }
  },
  
  'WS2_32.dll': {
    'WSAStartup': { purpose: 'SOCKET_INIT', go: 'net.Listen', confidence: 0.9 },
    'socket': { purpose: 'SOCKET_CREATE', go: 'net.Listen', confidence: 0.85 },
    'bind': { purpose: 'SOCKET_BIND', go: 'net.Listen', confidence: 0.9 },
    'listen': { purpose: 'SOCKET_LISTEN', go: 'listener.Accept', confidence: 0.95 },
    'accept': { purpose: 'SOCKET_ACCEPT', go: 'conn, _ := listener.Accept()', confidence: 0.95 },
    'connect': { purpose: 'SOCKET_CONNECT', go: 'net.Dial', confidence: 0.9 },
    'send': { purpose: 'SOCKET_SEND', go: 'conn.Write', confidence: 0.9 },
    'recv': { purpose: 'SOCKET_RECV', go: 'conn.Read', confidence: 0.9 },
    'closesocket': { purpose: 'SOCKET_CLOSE', go: 'conn.Close', confidence: 0.9 }
  },
  
  // File I/O APIs
  'KERNEL32.dll': {
    'CreateFileA': { purpose: 'FILE_OPEN', go: 'os.Open', confidence: 0.95 },
    'CreateFileW': { purpose: 'FILE_OPEN', go: 'os.Open', confidence: 0.95 },
    'ReadFile': { purpose: 'FILE_READ', go: 'file.Read', confidence: 0.95 },
    'WriteFile': { purpose: 'FILE_WRITE', go: 'file.Write', confidence: 0.95 },
    'CloseHandle': { purpose: 'FILE_CLOSE', go: 'file.Close', confidence: 0.9 },
    'DeleteFileA': { purpose: 'FILE_DELETE', go: 'os.Remove', confidence: 0.95 },
    'GetFileSize': { purpose: 'FILE_SIZE', go: 'file.Stat', confidence: 0.9 },
    'SetFilePointer': { purpose: 'FILE_SEEK', go: 'file.Seek', confidence: 0.9 },
    
    // Process APIs
    'CreateProcessA': { purpose: 'PROCESS_CREATE', go: 'exec.Command', confidence: 0.95 },
    'CreateProcessW': { purpose: 'PROCESS_CREATE', go: 'exec.Command', confidence: 0.95 },
    'TerminateProcess': { purpose: 'PROCESS_KILL', go: 'process.Kill', confidence: 0.9 },
    'GetCurrentProcess': { purpose: 'PROCESS_SELF', go: 'os.Getpid', confidence: 0.85 },
    'OpenProcess': { purpose: 'PROCESS_OPEN', go: 'os.FindProcess', confidence: 0.85 },
    
    // Memory APIs
    'VirtualAlloc': { purpose: 'MEMORY_ALLOC', go: 'make([]byte, size)', confidence: 0.8 },
    'VirtualFree': { purpose: 'MEMORY_FREE', go: '// Go GC', confidence: 0.7 },
    'ReadProcessMemory': { purpose: 'MEMORY_READ', go: '// Memory read', confidence: 0.75 },
    'WriteProcessMemory': { purpose: 'MEMORY_WRITE', go: '// Memory write', confidence: 0.75 },
    
    // HWID / System Info
    'GetVolumeInformationA': { purpose: 'HWID_VOLUME', go: 'syscall.GetVolumeInformation', confidence: 0.95 },
    'GetVolumeInformationW': { purpose: 'HWID_VOLUME', go: 'syscall.GetVolumeInformation', confidence: 0.95 },
    'GetComputerNameA': { purpose: 'HWID_COMPUTER', go: 'os.Hostname', confidence: 0.9 },
    'GetComputerNameW': { purpose: 'HWID_COMPUTER', go: 'os.Hostname', confidence: 0.9 },
    'GetUserNameA': { purpose: 'SYSTEM_USER', go: 'os.Getenv("USERNAME")', confidence: 0.9 },
    
    // Registry APIs
    'RegOpenKeyExA': { purpose: 'REGISTRY_OPEN', go: 'registry.OpenKey', confidence: 0.9 },
    'RegQueryValueExA': { purpose: 'REGISTRY_READ', go: 'key.GetStringValue', confidence: 0.9 },
    'RegSetValueExA': { purpose: 'REGISTRY_WRITE', go: 'key.SetStringValue', confidence: 0.9 },
    'RegCloseKey': { purpose: 'REGISTRY_CLOSE', go: 'key.Close', confidence: 0.85 },
    
    // Thread APIs
    'CreateThread': { purpose: 'THREAD_CREATE', go: 'go func()', confidence: 0.85 },
    'Sleep': { purpose: 'THREAD_SLEEP', go: 'time.Sleep', confidence: 0.95 },
    'WaitForSingleObject': { purpose: 'THREAD_WAIT', go: 'time.Sleep', confidence: 0.75 }
  },
  
  // Cryptography APIs
  'ADVAPI32.dll': {
    'CryptAcquireContextA': { purpose: 'CRYPTO_INIT', go: 'crypto/rand', confidence: 0.85 },
    'CryptCreateHash': { purpose: 'CRYPTO_HASH_INIT', go: 'sha256.New()', confidence: 0.9 },
    'CryptHashData': { purpose: 'CRYPTO_HASH', go: 'sha256.Sum256', confidence: 0.95 },
    'CryptGetHashParam': { purpose: 'CRYPTO_HASH_GET', go: 'hash[:]', confidence: 0.85 },
    'CryptDeriveKey': { purpose: 'CRYPTO_KEY', go: 'aes.NewCipher', confidence: 0.8 },
    'CryptEncrypt': { purpose: 'CRYPTO_ENCRYPT', go: 'cipher.Seal', confidence: 0.85 },
    'CryptDecrypt': { purpose: 'CRYPTO_DECRYPT', go: 'cipher.Open', confidence: 0.85 },
    'CryptDestroyHash': { purpose: 'CRYPTO_CLEANUP', go: '// GC', confidence: 0.7 }
  },
  
  // User Interface APIs
  'USER32.dll': {
    'MessageBoxA': { purpose: 'UI_MESSAGEBOX', go: 'fmt.Println', confidence: 0.7 },
    'MessageBoxW': { purpose: 'UI_MESSAGEBOX', go: 'fmt.Println', confidence: 0.7 },
    'CreateWindowExA': { purpose: 'UI_WINDOW', go: '// UI framework', confidence: 0.6 },
    'ShowWindow': { purpose: 'UI_SHOW', go: '// UI framework', confidence: 0.6 },
    'GetMessageA': { purpose: 'UI_EVENT_LOOP', go: '// Event loop', confidence: 0.65 }
  }
};

// Application type patterns
const APP_TYPE_PATTERNS = {
  LICENSE_CHECKER: {
    required: ['HTTP_CLIENT_INIT', 'HTTP_SEND', 'HWID_VOLUME'],
    optional: ['CRYPTO_HASH', 'REGISTRY_READ', 'SYSTEM_USER'],
    confidence: 0.9,
    description: 'License validation application'
  },
  
  HTTP_SERVER: {
    required: ['SOCKET_INIT', 'SOCKET_BIND', 'SOCKET_LISTEN', 'SOCKET_ACCEPT'],
    optional: ['FILE_READ', 'FILE_WRITE'],
    confidence: 0.95,
    description: 'HTTP/Network server application'
  },
  
  HTTP_CLIENT: {
    required: ['HTTP_CLIENT_INIT', 'HTTP_SEND', 'HTTP_READ'],
    optional: ['FILE_WRITE', 'CRYPTO_HASH'],
    confidence: 0.85,
    description: 'HTTP client / downloader application'
  },
  
  FILE_PROCESSOR: {
    required: ['FILE_OPEN', 'FILE_READ', 'FILE_WRITE'],
    optional: ['CRYPTO_ENCRYPT', 'CRYPTO_DECRYPT'],
    confidence: 0.8,
    description: 'File processing application'
  },
  
  MEMORY_TOOL: {
    required: ['PROCESS_OPEN', 'MEMORY_READ'],
    optional: ['MEMORY_WRITE', 'PROCESS_CREATE'],
    confidence: 0.85,
    description: 'Memory manipulation tool'
  },
  
  CLI_TOOL: {
    required: [],
    optional: ['FILE_READ', 'FILE_WRITE'],
    confidence: 0.5,
    description: 'Command-line utility'
  },
  
  SYSTEM_SERVICE: {
    required: ['REGISTRY_READ', 'REGISTRY_WRITE'],
    optional: ['PROCESS_CREATE', 'THREAD_CREATE'],
    confidence: 0.75,
    description: 'System service / daemon'
  }
};

/**
 * Main analysis function - performs deep analysis of executable
 * @param {Uint8Array} fileData - Raw binary data
 * @param {Object} peData - Parsed PE structure
 * @param {Object} patterns - Detected patterns from pattern engine
 * @returns {Object} Comprehensive analysis results
 */
export function analyzeExecutableDeep(fileData, peData, patterns) {
  console.log('[ANALYZER] Starting deep analysis...');
  
  const analysis = {
    strings: extractAndCategorizeStrings(fileData),
    apiCalls: analyzeAPICallsDetailed(peData),
    appType: null,
    mainLogic: [],
    confidence: 0,
    features: {
      hasNetwork: false,
      hasFileIO: false,
      hasCrypto: false,
      hasRegistry: false,
      hasHWID: false,
      hasMultithreading: false
    },
    endpoints: [],
    filePaths: [],
    registryKeys: [],
    errorMessages: [],
    commandFlags: []
  };
  
  // Analyze features based on API calls
  analyzeFeatures(analysis);
  
  // Detect application type
  analysis.appType = detectApplicationType(analysis.apiCalls);
  
  // Reconstruct main logic flow
  analysis.mainLogic = reconstructMainLogic(analysis);
  
  // Calculate overall confidence
  analysis.confidence = calculateAnalysisConfidence(analysis);
  
  console.log('[ANALYZER] Analysis complete:', {
    appType: analysis.appType?.type || 'UNKNOWN',
    apiCallCount: analysis.apiCalls.length,
    stringCount: analysis.strings.all.length,
    confidence: analysis.confidence
  });
  
  return analysis;
}

/**
 * Extract and categorize strings from binary
 */
function extractAndCategorizeStrings(fileData) {
  const strings = {
    all: [],
    urls: [],
    filePaths: [],
    registryKeys: [],
    errorMessages: [],
    apiEndpoints: [],
    commandFlags: []
  };
  
  let currentString = '';
  let stringStart = 0;
  
  for (let i = 0; i < fileData.length; i++) {
    const byte = fileData[i];
    
    // Printable ASCII characters
    if (byte >= 32 && byte <= 126) {
      if (currentString.length === 0) {
        stringStart = i;
      }
      currentString += String.fromCharCode(byte);
    } else if (currentString.length >= 4) {
      const str = {
        offset: stringStart,
        value: currentString,
        length: currentString.length
      };
      
      strings.all.push(str);
      categorizeString(currentString, strings);
      currentString = '';
    } else {
      currentString = '';
    }
  }
  
  console.log('[ANALYZER] Extracted strings:', {
    total: strings.all.length,
    urls: strings.urls.length,
    filePaths: strings.filePaths.length,
    errorMessages: strings.errorMessages.length
  });
  
  return strings;
}

/**
 * Categorize a string into specific types
 */
function categorizeString(str, strings) {
  const lower = str.toLowerCase();
  
  // URL detection
  if (lower.includes('http://') || lower.includes('https://') || lower.includes('ftp://')) {
    strings.urls.push(str);
  }
  
  // API endpoint detection (after URL check to avoid duplicates)
  if (lower.includes('/api/') || lower.includes('/v1/') || lower.includes('/v2/')) {
    strings.apiEndpoints.push(str);
  }
  
  // File path detection
  if (str.includes(':\\') || // Windows absolute path
      str.includes('C:\\') || str.includes('D:\\') ||
      str.match(/^\/[a-z]+\//i) || // Unix absolute path
      lower.includes('.exe') || lower.includes('.dll') ||
      lower.includes('.txt') || lower.includes('.log') ||
      lower.includes('.json') || lower.includes('.xml') ||
      lower.includes('.ini') || lower.includes('.conf')) {
    strings.filePaths.push(str);
  }
  
  // Registry key detection
  if (str.includes('HKEY_') || str.includes('\\Software\\') || 
      str.includes('\\CurrentVersion\\') || str.includes('\\Microsoft\\')) {
    strings.registryKeys.push(str);
  }
  
  // Error message detection
  if (lower.includes('error') || lower.includes('fail') ||
      lower.includes('invalid') || lower.includes('cannot') ||
      lower.includes('unable') || lower.includes('denied')) {
    strings.errorMessages.push(str);
  }
  
  // Command flag detection
  if (str.match(/^-[a-z]/i) || str.match(/^--[a-z]/i) ||
      str === '-h' || str === '--help' || str === '-v' || str === '--version') {
    strings.commandFlags.push(str);
  }
}

/**
 * Analyze API calls from PE imports
 */
function analyzeAPICallsDetailed(peData) {
  const apiCalls = [];
  
  if (!peData || !peData.imports) {
    return apiCalls;
  }
  
  for (const dll of peData.imports) {
    const dllName = dll.dll;
    // Try exact match first, then case-insensitive
    let dllMapping = API_MAPPING[dllName];
    if (!dllMapping) {
      // Try uppercase version
      dllMapping = API_MAPPING[dllName.toUpperCase()];
    }
    
    if (!dllMapping) {
      continue;
    }
    
    for (const func of dll.functions) {
      if (func.isOrdinal) {
        continue;
      }
      
      const funcName = func.name;
      const apiInfo = dllMapping[funcName];
      
      if (apiInfo) {
        apiCalls.push({
          dll: dllName,
          function: funcName,
          purpose: apiInfo.purpose,
          goEquivalent: apiInfo.go,
          confidence: apiInfo.confidence
        });
      }
    }
  }
  
  console.log('[ANALYZER] Analyzed API calls:', apiCalls.length);
  return apiCalls;
}

/**
 * Analyze features based on API calls
 */
function analyzeFeatures(analysis) {
  const purposes = new Set(analysis.apiCalls.map(call => call.purpose));
  
  analysis.features.hasNetwork = 
    purposes.has('HTTP_CLIENT_INIT') || 
    purposes.has('HTTP_SEND') ||
    purposes.has('SOCKET_INIT') ||
    purposes.has('SOCKET_LISTEN');
  
  analysis.features.hasFileIO = 
    purposes.has('FILE_OPEN') ||
    purposes.has('FILE_READ') ||
    purposes.has('FILE_WRITE');
  
  analysis.features.hasCrypto = 
    purposes.has('CRYPTO_HASH') ||
    purposes.has('CRYPTO_ENCRYPT') ||
    purposes.has('CRYPTO_DECRYPT');
  
  analysis.features.hasRegistry = 
    purposes.has('REGISTRY_OPEN') ||
    purposes.has('REGISTRY_READ') ||
    purposes.has('REGISTRY_WRITE');
  
  analysis.features.hasHWID = 
    purposes.has('HWID_VOLUME') ||
    purposes.has('HWID_COMPUTER');
  
  analysis.features.hasMultithreading = 
    purposes.has('THREAD_CREATE') ||
    purposes.has('THREAD_WAIT');
  
  // Extract endpoints and file paths from strings
  analysis.endpoints = analysis.strings.urls;
  analysis.filePaths = analysis.strings.filePaths;
  analysis.registryKeys = analysis.strings.registryKeys;
  analysis.errorMessages = analysis.strings.errorMessages;
  analysis.commandFlags = analysis.strings.commandFlags;
}

/**
 * Detect application type based on API usage patterns
 */
function detectApplicationType(apiCalls) {
  const purposes = new Set(apiCalls.map(call => call.purpose));
  let bestMatch = null;
  let highestScore = 0;
  
  for (const [typeName, pattern] of Object.entries(APP_TYPE_PATTERNS)) {
    let score = 0;
    let matchedRequired = 0;
    let matchedOptional = 0;
    
    // Check required purposes
    for (const purpose of pattern.required) {
      if (purposes.has(purpose)) {
        matchedRequired++;
        score += 10;
      }
    }
    
    // Check optional purposes
    for (const purpose of pattern.optional) {
      if (purposes.has(purpose)) {
        matchedOptional++;
        score += 3;
      }
    }
    
    // Must match all required purposes
    if (matchedRequired === pattern.required.length && score > highestScore) {
      highestScore = score;
      bestMatch = {
        type: typeName,
        description: pattern.description,
        confidence: pattern.confidence,
        matchedRequired: matchedRequired,
        matchedOptional: matchedOptional,
        score: score
      };
    }
  }
  
  // Default to CLI_TOOL if no specific match
  if (!bestMatch) {
    bestMatch = {
      type: 'CLI_TOOL',
      description: 'Command-line utility',
      confidence: 0.5,
      matchedRequired: 0,
      matchedOptional: 0,
      score: 0
    };
  }
  
  console.log('[ANALYZER] Detected app type:', bestMatch.type, 'confidence:', bestMatch.confidence);
  return bestMatch;
}

/**
 * Reconstruct main logic flow based on API patterns
 */
function reconstructMainLogic(analysis) {
  const logic = [];
  const apiCalls = analysis.apiCalls;
  const purposes = apiCalls.map(call => call.purpose);
  const appType = analysis.appType?.type || 'CLI_TOOL';
  
  // Build logic flow based on application type
  switch (appType) {
    case 'LICENSE_CHECKER':
      logic.push({ step: 'INIT', description: 'Initialize application' });
      
      if (purposes.includes('HWID_VOLUME') || purposes.includes('HWID_COMPUTER')) {
        logic.push({ step: 'GET_HWID', description: 'Get hardware ID from system' });
      }
      
      if (purposes.includes('CRYPTO_HASH')) {
        logic.push({ step: 'HASH_HWID', description: 'Hash hardware ID for security' });
      }
      
      if (purposes.includes('HTTP_CLIENT_INIT') || purposes.includes('HTTP_SEND')) {
        logic.push({ step: 'HTTP_REQUEST', description: 'Send license validation request' });
        logic.push({ step: 'HTTP_RECEIVE', description: 'Receive validation response' });
      }
      
      logic.push({ step: 'VALIDATE_RESPONSE', description: 'Validate server response' });
      
      if (purposes.includes('REGISTRY_WRITE')) {
        logic.push({ step: 'SAVE_LICENSE', description: 'Save license to registry' });
      }
      
      logic.push({ step: 'EXIT', description: 'Exit with status code' });
      break;
      
    case 'HTTP_SERVER':
      logic.push({ step: 'INIT', description: 'Initialize server' });
      logic.push({ step: 'SETUP_ROUTES', description: 'Configure routes and handlers' });
      logic.push({ step: 'START_LISTENING', description: 'Start listening on port' });
      logic.push({ step: 'ACCEPT_LOOP', description: 'Accept incoming connections' });
      logic.push({ step: 'HANDLE_REQUEST', description: 'Process each request' });
      logic.push({ step: 'SEND_RESPONSE', description: 'Send response to client' });
      break;
      
    case 'HTTP_CLIENT':
      logic.push({ step: 'INIT', description: 'Initialize HTTP client' });
      logic.push({ step: 'BUILD_REQUEST', description: 'Build HTTP request' });
      logic.push({ step: 'SEND_REQUEST', description: 'Send request to server' });
      logic.push({ step: 'RECEIVE_RESPONSE', description: 'Receive and parse response' });
      
      if (purposes.includes('FILE_WRITE')) {
        logic.push({ step: 'SAVE_TO_FILE', description: 'Save response to file' });
      }
      
      logic.push({ step: 'EXIT', description: 'Exit with status' });
      break;
      
    case 'FILE_PROCESSOR':
      logic.push({ step: 'INIT', description: 'Initialize file processor' });
      logic.push({ step: 'OPEN_INPUT', description: 'Open input file' });
      logic.push({ step: 'READ_DATA', description: 'Read file data' });
      
      if (purposes.includes('CRYPTO_ENCRYPT') || purposes.includes('CRYPTO_DECRYPT')) {
        logic.push({ step: 'PROCESS_DATA', description: 'Encrypt/decrypt data' });
      } else {
        logic.push({ step: 'PROCESS_DATA', description: 'Transform data' });
      }
      
      logic.push({ step: 'WRITE_OUTPUT', description: 'Write processed data' });
      logic.push({ step: 'CLOSE_FILES', description: 'Close file handles' });
      logic.push({ step: 'EXIT', description: 'Exit with status' });
      break;
      
    default:
      logic.push({ step: 'INIT', description: 'Initialize application' });
      logic.push({ step: 'MAIN_LOGIC', description: 'Execute main functionality' });
      logic.push({ step: 'EXIT', description: 'Exit' });
  }
  
  return logic;
}

/**
 * Calculate overall analysis confidence
 */
function calculateAnalysisConfidence(analysis) {
  let confidence = 0;
  let factors = 0;
  
  // App type detection confidence
  if (analysis.appType) {
    confidence += analysis.appType.confidence * 100;
    factors++;
  }
  
  // String analysis confidence
  if (analysis.strings.urls.length > 0) {
    confidence += 80;
    factors++;
  }
  
  if (analysis.strings.filePaths.length > 0) {
    confidence += 60;
    factors++;
  }
  
  if (analysis.strings.errorMessages.length > 0) {
    confidence += 40;
    factors++;
  }
  
  // API call analysis confidence
  if (analysis.apiCalls.length > 5) {
    confidence += 90;
    factors++;
  } else if (analysis.apiCalls.length > 0) {
    confidence += 50;
    factors++;
  }
  
  // Calculate average if we have factors
  if (factors > 0) {
    confidence = confidence / factors;
  } else {
    confidence = 30; // Minimum baseline
  }
  
  return Math.min(95, Math.max(30, confidence));
}
