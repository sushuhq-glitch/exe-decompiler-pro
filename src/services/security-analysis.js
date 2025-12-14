/**
 * Security Analysis Service
 * Performs comprehensive security analysis on executables
 */

/**
 * Main security analysis function
 */
export function analyzeSecuritySmall(fileData, peData) {
  return {
    entropy: calculateDetailedEntropy(fileData, peData),
    protection: analyzeProtectionMechanisms(peData),
    antiDebug: detectAntiDebugging(fileData, peData),
    suspiciousAPIs: detectSuspiciousAPIs(peData),
    packedSections: analyzeSectionsPacking(fileData, peData),
    imports: analyzeImports(peData),
    exports: analyzeExports(peData),
    resources: analyzeResources(peData),
    certificates: analyzeCertificates(peData),
    score: 0 // Will be calculated at the end
  };
}

/**
 * Calculate detailed entropy analysis
 */
function calculateDetailedEntropy(fileData, peData) {
  const data = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
  const results = {
    overall: calculateEntropy(data),
    sections: [],
    highEntropyRegions: []
  };
  
  // Calculate entropy for each section
  if (peData && peData.sections) {
    for (const section of peData.sections) {
      const start = section.pointerToRawData;
      const end = Math.min(start + section.sizeOfRawData, data.length);
      
      if (start < data.length && end > start) {
        const sectionData = data.slice(start, end);
        const entropy = calculateEntropy(sectionData);
        
        results.sections.push({
          name: section.name,
          entropy: entropy,
          size: end - start,
          suspicious: entropy > 7.5,
          warning: entropy > 7.0 && entropy <= 7.5
        });
        
        if (entropy > 7.5) {
          results.highEntropyRegions.push({
            name: section.name,
            offset: start,
            size: end - start,
            entropy: entropy
          });
        }
      }
    }
  }
  
  return results;
}

/**
 * Calculate entropy for a data buffer
 */
function calculateEntropy(data) {
  const frequencies = new Array(256).fill(0);
  
  for (let i = 0; i < data.length; i++) {
    frequencies[data[i]]++;
  }
  
  let entropy = 0;
  const length = data.length;
  
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const probability = frequencies[i] / length;
      entropy -= probability * Math.log2(probability);
    }
  }
  
  return entropy;
}

/**
 * Analyze protection mechanisms
 */
function analyzeProtectionMechanisms(peData) {
  const mechanisms = [];
  
  if (!peData || !peData.dllCharacteristics) {
    return mechanisms;
  }
  
  const characteristics = peData.dllCharacteristics;
  
  // DEP/NX
  mechanisms.push({
    name: 'DEP (Data Execution Prevention)',
    enabled: !!(characteristics & 0x0100),
    flag: 'IMAGE_DLLCHARACTERISTICS_NX_COMPAT',
    importance: 'high',
    description: 'Prevents execution of code in data segments'
  });
  
  // ASLR
  mechanisms.push({
    name: 'ASLR (Address Space Layout Randomization)',
    enabled: !!(characteristics & 0x0040),
    flag: 'IMAGE_DLLCHARACTERISTICS_DYNAMIC_BASE',
    importance: 'high',
    description: 'Randomizes memory addresses to prevent exploits'
  });
  
  // SafeSEH
  mechanisms.push({
    name: 'SafeSEH',
    enabled: !!(characteristics & 0x0400),
    flag: 'IMAGE_DLLCHARACTERISTICS_NO_SEH',
    importance: 'medium',
    description: 'Protects structured exception handlers'
  });
  
  // Control Flow Guard
  mechanisms.push({
    name: 'Control Flow Guard',
    enabled: !!(characteristics & 0x4000),
    flag: 'IMAGE_DLLCHARACTERISTICS_GUARD_CF',
    importance: 'high',
    description: 'Validates indirect call targets'
  });
  
  // High Entropy VA
  mechanisms.push({
    name: 'High Entropy VA (64-bit ASLR)',
    enabled: !!(characteristics & 0x0020),
    flag: 'IMAGE_DLLCHARACTERISTICS_HIGH_ENTROPY_VA',
    importance: 'medium',
    description: 'Enables 64-bit ASLR'
  });
  
  // Force Integrity
  mechanisms.push({
    name: 'Force Integrity',
    enabled: !!(characteristics & 0x0080),
    flag: 'IMAGE_DLLCHARACTERISTICS_FORCE_INTEGRITY',
    importance: 'medium',
    description: 'Enforces code signing'
  });
  
  // Terminal Server Aware
  mechanisms.push({
    name: 'Terminal Server Aware',
    enabled: !!(characteristics & 0x8000),
    flag: 'IMAGE_DLLCHARACTERISTICS_TERMINAL_SERVER_AWARE',
    importance: 'low',
    description: 'Aware of terminal server environment'
  });
  
  return mechanisms;
}

/**
 * Detect anti-debugging techniques
 */
function detectAntiDebugging(fileData, peData) {
  const detections = [];
  const data = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
  
  // API-based anti-debug
  const antiDebugAPIs = [
    'IsDebuggerPresent',
    'CheckRemoteDebuggerPresent',
    'NtQueryInformationProcess',
    'ZwQueryInformationProcess',
    'OutputDebugString',
    'DebugActiveProcess',
    'NtSetInformationThread',
    'ZwSetInformationThread'
  ];
  
  if (peData && peData.imports) {
    for (const dll of peData.imports) {
      for (const func of dll.functions) {
        if (antiDebugAPIs.includes(func.name)) {
          detections.push({
            type: 'API',
            name: func.name,
            dll: dll.dll,
            severity: 'high',
            description: `Potential anti-debugging API: ${func.name}`
          });
        }
      }
    }
  }
  
  // Instruction-based anti-debug patterns
  const patterns = [
    {
      pattern: [0x64, 0xA1, 0x30, 0x00, 0x00, 0x00], // mov eax, fs:[30h] - PEB access
      name: 'PEB Access',
      severity: 'medium',
      description: 'Accessing Process Environment Block (common in anti-debug)'
    },
    {
      pattern: [0x64, 0x8B, 0x15, 0x30, 0x00, 0x00, 0x00], // mov edx, fs:[30h]
      name: 'PEB Access',
      severity: 'medium',
      description: 'Accessing Process Environment Block'
    },
    {
      pattern: [0xCC], // int 3 - breakpoint
      name: 'Software Breakpoint',
      severity: 'low',
      description: 'Software breakpoint instruction (may be anti-debug)'
    },
    {
      pattern: [0xCD, 0x03], // int 3 alternative
      name: 'Software Breakpoint Alternative',
      severity: 'low',
      description: 'Alternative breakpoint instruction'
    },
    {
      pattern: [0xF1], // int 1 - single step
      name: 'Single Step Exception',
      severity: 'medium',
      description: 'Single step exception (anti-tracing)'
    }
  ];
  
  for (const pat of patterns) {
    if (searchPattern(data, pat.pattern)) {
      detections.push({
        type: 'Pattern',
        name: pat.name,
        severity: pat.severity,
        description: pat.description
      });
    }
  }
  
  return detections;
}

/**
 * Detect suspicious APIs
 */
function detectSuspiciousAPIs(peData) {
  const suspicious = [];
  
  if (!peData || !peData.imports) {
    return suspicious;
  }
  
  const apiCategories = {
    'Process Manipulation': {
      apis: ['CreateProcess', 'OpenProcess', 'TerminateProcess', 'CreateRemoteThread', 'WriteProcessMemory', 'VirtualAllocEx'],
      severity: 'high'
    },
    'Registry Manipulation': {
      apis: ['RegSetValue', 'RegCreateKey', 'RegDeleteKey', 'RegOpenKey'],
      severity: 'medium'
    },
    'File Operations': {
      apis: ['CreateFile', 'DeleteFile', 'MoveFile', 'CopyFile', 'WriteFile'],
      severity: 'medium'
    },
    'Network Activity': {
      apis: ['InternetOpen', 'HttpSendRequest', 'send', 'recv', 'WSAStartup', 'socket', 'connect'],
      severity: 'medium'
    },
    'Cryptography': {
      apis: ['CryptEncrypt', 'CryptDecrypt', 'CryptAcquireContext', 'CryptGenRandom'],
      severity: 'medium'
    },
    'Keylogging': {
      apis: ['GetAsyncKeyState', 'SetWindowsHookEx', 'GetKeyState'],
      severity: 'high'
    },
    'Screen Capture': {
      apis: ['BitBlt', 'GetDC', 'GetWindowDC'],
      severity: 'medium'
    },
    'DLL Injection': {
      apis: ['LoadLibrary', 'GetProcAddress', 'VirtualAlloc', 'WriteProcessMemory', 'CreateRemoteThread'],
      severity: 'high'
    },
    'Service Management': {
      apis: ['CreateService', 'StartService', 'DeleteService', 'OpenSCManager'],
      severity: 'high'
    },
    'Privilege Escalation': {
      apis: ['AdjustTokenPrivileges', 'LookupPrivilegeValue', 'OpenProcessToken'],
      severity: 'high'
    }
  };
  
  const categoryDetections = {};
  
  for (const dll of peData.imports) {
    for (const func of dll.functions) {
      for (const [category, info] of Object.entries(apiCategories)) {
        if (info.apis.some(api => func.name && func.name.includes(api))) {
          if (!categoryDetections[category]) {
            categoryDetections[category] = {
              category,
              severity: info.severity,
              apis: [],
              count: 0
            };
          }
          
          categoryDetections[category].apis.push({
            name: func.name,
            dll: dll.dll
          });
          categoryDetections[category].count++;
        }
      }
    }
  }
  
  return Object.values(categoryDetections);
}

/**
 * Analyze sections for packing indicators
 */
function analyzeSectionsPacking(fileData, peData) {
  const results = [];
  
  if (!peData || !peData.sections) {
    return results;
  }
  
  for (const section of peData.sections) {
    const indicators = [];
    let suspicionScore = 0;
    
    // Check for unusual names
    const standardNames = ['.text', '.data', '.rdata', '.bss', '.rsrc', '.reloc', '.idata', '.edata'];
    if (!standardNames.includes(section.name) && !section.name.startsWith('.')) {
      indicators.push('Non-standard section name');
      suspicionScore += 10;
    }
    
    // Check for executable data sections
    if (section.type === 'data' && (section.characteristics & 0x20000000)) {
      indicators.push('Executable data section');
      suspicionScore += 20;
    }
    
    // Check for writable code sections
    if (section.type === 'code' && (section.characteristics & 0x80000000)) {
      indicators.push('Writable code section');
      suspicionScore += 20;
    }
    
    // Check virtual vs raw size discrepancy
    if (section.virtualSize > section.sizeOfRawData * 2) {
      indicators.push('Large virtual/raw size ratio');
      suspicionScore += 15;
    }
    
    // Check entropy (already calculated elsewhere, just reference it)
    const data = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
    const start = section.pointerToRawData;
    const end = Math.min(start + section.sizeOfRawData, data.length);
    
    if (start < data.length && end > start) {
      const sectionData = data.slice(start, end);
      const entropy = calculateEntropy(sectionData);
      
      if (entropy > 7.5) {
        indicators.push('Very high entropy (likely packed/encrypted)');
        suspicionScore += 30;
      } else if (entropy > 7.0) {
        indicators.push('High entropy (possibly packed)');
        suspicionScore += 15;
      }
    }
    
    if (indicators.length > 0) {
      results.push({
        name: section.name,
        indicators,
        suspicionScore,
        suspicious: suspicionScore >= 30
      });
    }
  }
  
  return results;
}

/**
 * Analyze imports for suspicious patterns
 */
function analyzeImports(peData) {
  if (!peData || !peData.imports) {
    return {
      total: 0,
      dlls: 0,
      suspicious: false
    };
  }
  
  let totalFunctions = 0;
  for (const dll of peData.imports) {
    totalFunctions += dll.functions.length;
  }
  
  return {
    total: totalFunctions,
    dlls: peData.imports.length,
    suspicious: peData.imports.length < 3 && totalFunctions < 10 // Suspiciously few imports
  };
}

/**
 * Analyze exports
 */
function analyzeExports(peData) {
  if (!peData || !peData.exports) {
    return {
      count: 0,
      hasSuspicious: false
    };
  }
  
  return {
    count: peData.exports.length,
    hasSuspicious: peData.exports.length > 100 // Unusually many exports
  };
}

/**
 * Analyze resources
 */
function analyzeResources(peData) {
  // Simplified resource analysis
  return {
    present: !!(peData && peData.sections && peData.sections.some(s => s.name === '.rsrc')),
    suspicious: false
  };
}

/**
 * Analyze digital signatures/certificates
 */
function analyzeCertificates(peData) {
  // Simplified certificate analysis
  // In a real implementation, this would parse the certificate table
  return {
    signed: false,
    valid: false,
    issuer: null
  };
}

/**
 * Helper: Search for byte pattern
 */
function searchPattern(data, pattern) {
  const patternLength = pattern.length;
  
  for (let i = 0; i <= data.length - patternLength; i++) {
    let match = true;
    
    for (let j = 0; j < patternLength; j++) {
      if (data[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    
    if (match) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate overall security score
 */
export function calculateSecurityScore(analysis) {
  let score = 100; // Start with perfect score
  
  // Deduct for missing protections
  if (analysis.protection) {
    const criticalProtections = analysis.protection.filter(p => p.importance === 'high' && !p.enabled);
    score -= criticalProtections.length * 15;
    
    const mediumProtections = analysis.protection.filter(p => p.importance === 'medium' && !p.enabled);
    score -= mediumProtections.length * 5;
  }
  
  // Deduct for high entropy
  if (analysis.entropy && analysis.entropy.overall > 7.5) {
    score -= 20;
  }
  
  // Deduct for anti-debugging
  if (analysis.antiDebug && analysis.antiDebug.length > 0) {
    score -= analysis.antiDebug.length * 5;
  }
  
  // Deduct for suspicious APIs
  if (analysis.suspiciousAPIs && analysis.suspiciousAPIs.length > 0) {
    const highSeverity = analysis.suspiciousAPIs.filter(api => api.severity === 'high');
    score -= highSeverity.length * 10;
  }
  
  // Deduct for packed sections
  if (analysis.packedSections) {
    const suspicious = analysis.packedSections.filter(s => s.suspicious);
    score -= suspicious.length * 10;
  }
  
  return Math.max(0, Math.min(100, score));
}
