/**
 * DIE (Detect It Easy) Integration Service
 * Detects compilers, packers, languages, and frameworks
 */

/**
 * Main detection function
 */
export function detectExecutableInfo(fileData, peData) {
  const results = {
    compiler: detectCompiler(fileData, peData),
    packer: detectPacker(fileData, peData),
    language: detectLanguage(fileData, peData),
    framework: detectFramework(fileData, peData),
    libraries: detectLibraries(fileData, peData),
    protection: detectProtection(fileData, peData),
    entropy: calculateEntropy(fileData),
    overlay: detectOverlay(fileData, peData),
    timestamp: peData?.timestamp || null,
    architecture: peData?.architecture || 'Unknown'
  };
  
  return results;
}

/**
 * Detect compiler and version
 */
function detectCompiler(fileData, peData) {
  const detections = [];
  const data = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
  
  // MSVC Signatures
  const msvciSignatures = [
    {
      pattern: [0x55, 0x8B, 0xEC, 0x6A, 0xFF, 0x68],
      name: 'Microsoft Visual C++',
      version: '6.0',
      confidence: 0.8
    },
    {
      pattern: [0x55, 0x8B, 0xEC, 0x81, 0xEC],
      name: 'Microsoft Visual C++',
      version: '2003-2005',
      confidence: 0.7
    },
    {
      pattern: [0x40, 0x55, 0x56, 0x57, 0x41, 0x54],
      name: 'Microsoft Visual C++',
      version: '2015+',
      confidence: 0.75
    }
  ];
  
  // GCC Signatures
  const gccSignatures = [
    {
      pattern: [0x55, 0x89, 0xE5, 0x53, 0x83, 0xEC],
      name: 'GNU C++ (GCC)',
      version: '4.x',
      confidence: 0.8
    },
    {
      pattern: [0x55, 0x48, 0x89, 0xE5, 0x48, 0x83, 0xEC],
      name: 'GNU C++ (GCC)',
      version: '5.x+',
      confidence: 0.8
    }
  ];
  
  // Clang/LLVM Signatures
  const clangSignatures = [
    {
      pattern: [0x55, 0x48, 0x89, 0xE5, 0x48, 0x89, 0x7D],
      name: 'Clang/LLVM',
      version: '3.x+',
      confidence: 0.75
    }
  ];
  
  // Borland Signatures
  const borlandSignatures = [
    {
      pattern: [0x55, 0x8B, 0xEC, 0x33, 0xC0, 0x55],
      name: 'Borland C++',
      version: '5.x',
      confidence: 0.7
    }
  ];
  
  // Check all signatures
  const allSignatures = [
    ...msvciSignatures,
    ...gccSignatures,
    ...clangSignatures,
    ...borlandSignatures
  ];
  
  for (const sig of allSignatures) {
    if (searchPattern(data, sig.pattern)) {
      detections.push({
        name: sig.name,
        version: sig.version,
        confidence: sig.confidence,
        type: 'compiler'
      });
    }
  }
  
  // Check for rich header (MSVC specific)
  if (peData && hasRichHeader(data)) {
    const richInfo = parseRichHeader(data);
    if (richInfo) {
      detections.push({
        name: 'Microsoft Visual C++',
        version: richInfo.version,
        confidence: 0.9,
        type: 'compiler',
        details: richInfo
      });
    }
  }
  
  // Check import libraries
  if (peData && peData.imports) {
    for (const dll of peData.imports) {
      if (dll.dll.toLowerCase() === 'msvcr100.dll') {
        detections.push({
          name: 'Microsoft Visual C++',
          version: '2010',
          confidence: 0.9,
          type: 'compiler',
          source: 'imports'
        });
      } else if (dll.dll.toLowerCase() === 'msvcr120.dll') {
        detections.push({
          name: 'Microsoft Visual C++',
          version: '2013',
          confidence: 0.9,
          type: 'compiler',
          source: 'imports'
        });
      } else if (dll.dll.toLowerCase() === 'vcruntime140.dll') {
        detections.push({
          name: 'Microsoft Visual C++',
          version: '2015-2022',
          confidence: 0.9,
          type: 'compiler',
          source: 'imports'
        });
      }
    }
  }
  
  // Remove duplicates and sort by confidence
  const unique = [];
  const seen = new Set();
  
  detections.sort((a, b) => b.confidence - a.confidence);
  
  for (const det of detections) {
    const key = `${det.name}-${det.version}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(det);
    }
  }
  
  return unique;
}

/**
 * Detect packer/protector
 */
function detectPacker(fileData, peData) {
  const detections = [];
  const data = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
  
  // UPX Signatures
  const upxSignatures = [
    {
      pattern: [0x55, 0x50, 0x58, 0x21], // "UPX!"
      name: 'UPX',
      version: 'Generic',
      confidence: 0.95
    },
    {
      pattern: 'UPX0',
      name: 'UPX',
      version: 'Generic',
      confidence: 0.9,
      searchString: true
    }
  ];
  
  // Themida Signatures
  const themidaSignatures = [
    {
      pattern: [0x68, 0x00, 0x00, 0x00, 0x00, 0x68, 0x00, 0x00, 0x00, 0x00, 0xE8],
      name: 'Themida',
      version: '2.x',
      confidence: 0.7
    }
  ];
  
  // VMProtect Signatures
  const vmprotectSignatures = [
    {
      pattern: [0x68, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x35],
      name: 'VMProtect',
      version: '2.x-3.x',
      confidence: 0.65
    }
  ];
  
  // ASPack Signatures
  const aspackSignatures = [
    {
      pattern: [0x60, 0xE8, 0x03, 0x00, 0x00, 0x00, 0xE9, 0xEB],
      name: 'ASPack',
      version: '2.x',
      confidence: 0.8
    }
  ];
  
  // PECompact Signatures
  const pecompactSignatures = [
    {
      pattern: [0xB8, 0x00, 0x00, 0x00, 0x00, 0x60, 0x0B, 0xC0],
      name: 'PECompact',
      version: '2.x',
      confidence: 0.75
    }
  ];
  
  // Check all packer signatures
  const allPackerSigs = [
    ...upxSignatures,
    ...themidaSignatures,
    ...vmprotectSignatures,
    ...aspackSignatures,
    ...pecompactSignatures
  ];
  
  for (const sig of allPackerSigs) {
    if (sig.searchString) {
      if (searchString(data, sig.pattern)) {
        detections.push({
          name: sig.name,
          version: sig.version,
          confidence: sig.confidence,
          type: 'packer'
        });
      }
    } else {
      if (searchPattern(data, sig.pattern)) {
        detections.push({
          name: sig.name,
          version: sig.version,
          confidence: sig.confidence,
          type: 'packer'
        });
      }
    }
  }
  
  // Check section names for packers
  if (peData && peData.sections) {
    for (const section of peData.sections) {
      const sectionName = section.name.toLowerCase();
      
      if (sectionName === 'upx0' || sectionName === 'upx1') {
        detections.push({
          name: 'UPX',
          version: 'Detected by section',
          confidence: 0.95,
          type: 'packer',
          source: 'section names'
        });
      } else if (sectionName.includes('.themida')) {
        detections.push({
          name: 'Themida',
          version: 'Detected by section',
          confidence: 0.9,
          type: 'packer',
          source: 'section names'
        });
      } else if (sectionName.includes('.vmp')) {
        detections.push({
          name: 'VMProtect',
          version: 'Detected by section',
          confidence: 0.85,
          type: 'packer',
          source: 'section names'
        });
      } else if (sectionName.includes('aspack')) {
        detections.push({
          name: 'ASPack',
          version: 'Detected by section',
          confidence: 0.85,
          type: 'packer',
          source: 'section names'
        });
      }
    }
  }
  
  // Check entropy - high entropy suggests packing/encryption
  const entropy = calculateEntropy(data);
  if (entropy > 7.5) {
    detections.push({
      name: 'Unknown Packer/Encryptor',
      version: 'Detected by entropy',
      confidence: 0.6,
      type: 'packer',
      entropy: entropy
    });
  }
  
  // Remove duplicates
  const unique = [];
  const seen = new Set();
  
  detections.sort((a, b) => b.confidence - a.confidence);
  
  for (const det of detections) {
    const key = `${det.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(det);
    }
  }
  
  return unique;
}

/**
 * Detect programming language
 */
function detectLanguage(fileData, peData) {
  const detections = [];
  
  if (!peData || !peData.imports) {
    return detections;
  }
  
  // Check imports for language indicators
  const importedDlls = peData.imports.map(dll => dll.dll.toLowerCase());
  
  // C/C++ indicators
  if (importedDlls.some(dll => dll.includes('msvcr') || dll.includes('vcruntime'))) {
    detections.push({
      name: 'C/C++',
      confidence: 0.9,
      evidence: 'MSVC runtime'
    });
  }
  
  // .NET indicators
  if (importedDlls.includes('mscoree.dll')) {
    detections.push({
      name: '.NET/C#',
      confidence: 0.95,
      evidence: '.NET CLR'
    });
  }
  
  // Delphi indicators
  if (importedDlls.includes('cc3270mt.dll') || importedDlls.includes('borlndmm.dll')) {
    detections.push({
      name: 'Delphi/Pascal',
      confidence: 0.9,
      evidence: 'Borland runtime'
    });
  }
  
  // Visual Basic indicators
  if (importedDlls.includes('msvbvm60.dll')) {
    detections.push({
      name: 'Visual Basic 6',
      confidence: 0.95,
      evidence: 'VB6 runtime'
    });
  }
  
  // Python indicators
  if (importedDlls.some(dll => dll.includes('python'))) {
    detections.push({
      name: 'Python',
      confidence: 0.9,
      evidence: 'Python DLL'
    });
  }
  
  // Go indicators - Go binaries are usually statically linked
  if (peData.sections && peData.sections.some(s => s.name === '.gopclntab')) {
    detections.push({
      name: 'Go',
      confidence: 0.95,
      evidence: 'Go symbol table'
    });
  }
  
  // Rust indicators
  if (peData.sections && peData.sections.some(s => s.name.includes('rust'))) {
    detections.push({
      name: 'Rust',
      confidence: 0.8,
      evidence: 'Rust section names'
    });
  }
  
  return detections;
}

/**
 * Detect frameworks
 */
function detectFramework(fileData, peData) {
  const detections = [];
  
  if (!peData || !peData.imports) {
    return detections;
  }
  
  const importedDlls = peData.imports.map(dll => dll.dll.toLowerCase());
  
  // Qt Framework
  if (importedDlls.some(dll => dll.includes('qt5') || dll.includes('qt6'))) {
    detections.push({
      name: 'Qt Framework',
      version: importedDlls.find(dll => dll.includes('qt6')) ? '6.x' : '5.x',
      confidence: 0.95
    });
  }
  
  // MFC (Microsoft Foundation Classes)
  if (importedDlls.some(dll => dll.includes('mfc'))) {
    detections.push({
      name: 'Microsoft Foundation Classes (MFC)',
      confidence: 0.95
    });
  }
  
  // .NET Framework
  if (importedDlls.includes('mscoree.dll')) {
    detections.push({
      name: '.NET Framework',
      confidence: 0.95
    });
  }
  
  // wxWidgets
  if (importedDlls.some(dll => dll.includes('wx'))) {
    detections.push({
      name: 'wxWidgets',
      confidence: 0.85
    });
  }
  
  return detections;
}

/**
 * Detect libraries
 */
function detectLibraries(fileData, peData) {
  const libraries = [];
  
  if (!peData || !peData.imports) {
    return libraries;
  }
  
  for (const dll of peData.imports) {
    const dllName = dll.dll.toLowerCase();
    
    // Categorize known libraries
    let category = 'system';
    let description = '';
    
    if (dllName.includes('d3d') || dllName.includes('opengl')) {
      category = 'graphics';
      description = '3D Graphics';
    } else if (dllName.includes('ws2') || dllName.includes('wininet')) {
      category = 'network';
      description = 'Network/Internet';
    } else if (dllName.includes('crypt')) {
      category = 'cryptography';
      description = 'Cryptography';
    } else if (dllName.includes('msvc') || dllName.includes('vcruntime')) {
      category = 'runtime';
      description = 'C/C++ Runtime';
    } else if (dllName.includes('shell32') || dllName.includes('user32')) {
      category = 'ui';
      description = 'User Interface';
    }
    
    libraries.push({
      name: dll.dll,
      category,
      description,
      functionCount: dll.functions.length
    });
  }
  
  return libraries;
}

/**
 * Detect protection mechanisms
 */
function detectProtection(fileData, peData) {
  const protections = [];
  
  if (!peData) {
    return protections;
  }
  
  // Check for DEP (Data Execution Prevention)
  if (peData.dllCharacteristics) {
    if (peData.dllCharacteristics & 0x0100) {
      protections.push({
        name: 'DEP (NX)',
        enabled: true,
        description: 'Data Execution Prevention'
      });
    }
  }
  
  // Check for ASLR (Address Space Layout Randomization)
  if (peData.dllCharacteristics) {
    if (peData.dllCharacteristics & 0x0040) {
      protections.push({
        name: 'ASLR',
        enabled: true,
        description: 'Address Space Layout Randomization'
      });
    }
  }
  
  // Check for SafeSEH
  if (peData.dllCharacteristics) {
    if (peData.dllCharacteristics & 0x0400) {
      protections.push({
        name: 'SafeSEH',
        enabled: true,
        description: 'Safe Structured Exception Handling'
      });
    }
  }
  
  // Check for Control Flow Guard
  if (peData.dllCharacteristics) {
    if (peData.dllCharacteristics & 0x4000) {
      protections.push({
        name: 'CFG',
        enabled: true,
        description: 'Control Flow Guard'
      });
    }
  }
  
  return protections;
}

/**
 * Calculate entropy of data
 */
function calculateEntropy(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const frequencies = new Array(256).fill(0);
  
  // Count byte frequencies
  for (let i = 0; i < bytes.length; i++) {
    frequencies[bytes[i]]++;
  }
  
  // Calculate entropy
  let entropy = 0;
  const length = bytes.length;
  
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const probability = frequencies[i] / length;
      entropy -= probability * Math.log2(probability);
    }
  }
  
  return entropy;
}

/**
 * Detect overlay data
 */
function detectOverlay(fileData, peData) {
  if (!peData || !peData.sections) {
    return null;
  }
  
  // Calculate expected file size based on PE sections
  let maxOffset = 0;
  
  for (const section of peData.sections) {
    const sectionEnd = section.pointerToRawData + section.sizeOfRawData;
    if (sectionEnd > maxOffset) {
      maxOffset = sectionEnd;
    }
  }
  
  const actualSize = fileData.length;
  
  if (actualSize > maxOffset) {
    const overlaySize = actualSize - maxOffset;
    return {
      present: true,
      offset: maxOffset,
      size: overlaySize,
      sizeHex: `0x${overlaySize.toString(16)}`
    };
  }
  
  return {
    present: false
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

// Module-level TextEncoder for efficiency
const textEncoder = new TextEncoder();

/**
 * Helper: Search for string
 */
function searchString(data, str) {
  const pattern = textEncoder.encode(str);
  return searchPattern(data, Array.from(pattern));
}

/**
 * Helper: Check for Rich header
 */
function hasRichHeader(data) {
  // Search for "Rich" signature
  const richSignature = [0x52, 0x69, 0x63, 0x68]; // "Rich"
  return searchPattern(data.slice(0, 512), richSignature);
}

/**
 * Helper: Parse Rich header
 */
function parseRichHeader(data) {
  // Simplified Rich header parsing
  // In reality, this would be more complex
  return {
    version: 'Detected',
    tools: []
  };
}
