/**
 * Pattern Recognition Engine
 * Detects common patterns and compiler signatures in executable code
 */

import { disassemble } from './disassembler.js';

// Function prologue patterns
const FUNCTION_PROLOGUES = [
  {
    name: 'MSVC x86 Standard',
    pattern: [0x55, 0x8B, 0xEC], // push ebp; mov ebp, esp
    compiler: 'MSVC',
    arch: 'x86'
  },
  {
    name: 'MSVC x86 with Stack Allocation',
    pattern: [0x55, 0x8B, 0xEC, 0x81, 0xEC], // push ebp; mov ebp, esp; sub esp, ...
    compiler: 'MSVC',
    arch: 'x86'
  },
  {
    name: 'GCC x86 Standard',
    pattern: [0x55, 0x89, 0xE5], // push ebp; mov ebp, esp
    compiler: 'GCC',
    arch: 'x86'
  },
  {
    name: 'x64 Standard',
    pattern: [0x55, 0x48, 0x89, 0xE5], // push rbp; mov rbp, rsp
    compiler: 'Generic',
    arch: 'x64'
  },
  {
    name: 'x64 with Frame Setup',
    pattern: [0x48, 0x89, 0x5C, 0x24], // mov [rsp+...], rbx
    compiler: 'MSVC',
    arch: 'x64'
  },
  {
    name: 'x64 SUB RSP',
    pattern: [0x48, 0x83, 0xEC], // sub rsp, imm8
    compiler: 'Generic',
    arch: 'x64'
  },
  {
    name: 'x86 SUB ESP',
    pattern: [0x81, 0xEC], // sub esp, imm32
    compiler: 'Generic',
    arch: 'x86'
  },
  {
    name: 'x86 ENTER',
    pattern: [0xC8], // enter imm16, imm8
    compiler: 'Borland',
    arch: 'x86'
  }
];

// Function epilogue patterns
const FUNCTION_EPILOGUES = [
  {
    name: 'Standard Leave+Ret',
    pattern: [0xC9, 0xC3], // leave; ret
    type: 'standard'
  },
  {
    name: 'Pop+Ret',
    pattern: [0x5D, 0xC3], // pop ebp; ret
    type: 'standard'
  },
  {
    name: 'Pop+Ret x64',
    pattern: [0x5D, 0xC3], // pop rbp; ret
    type: 'standard'
  },
  {
    name: 'Ret with Cleanup',
    pattern: [0xC2], // ret imm16
    type: 'stdcall'
  },
  {
    name: 'Add ESP+Ret',
    pattern: [0x83, 0xC4], // add esp, imm8; ret
    type: 'manual_cleanup'
  }
];

// Compiler-specific signatures
const COMPILER_SIGNATURES = {
  'MSVC': [
    { pattern: [0x55, 0x8B, 0xEC], weight: 10 },
    { pattern: [0x6A, 0xFF, 0x68], weight: 5 }, // Exception handler setup
    { pattern: [0x64, 0xA1, 0x00, 0x00, 0x00, 0x00], weight: 5 }, // fs:0 access
    { pattern: [0xE8], weight: 1 } // CALL instructions (common)
  ],
  'GCC': [
    { pattern: [0x55, 0x89, 0xE5], weight: 10 },
    { pattern: [0x83, 0xEC], weight: 5 }, // sub esp, imm8
    { pattern: [0x89, 0x45], weight: 3 } // mov [ebp+...], eax
  ],
  'MinGW': [
    { pattern: [0x55, 0x89, 0xE5], weight: 10 },
    { pattern: [0x83, 0xE4, 0xF0], weight: 5 }, // and esp, -16 (alignment)
    { pattern: [0x81, 0xEC], weight: 3 }
  ],
  'Borland': [
    { pattern: [0xC8], weight: 10 }, // ENTER instruction
    { pattern: [0x53, 0x56, 0x57], weight: 5 } // push ebx; push esi; push edi
  ],
  'Clang': [
    { pattern: [0x55, 0x48, 0x89, 0xE5], weight: 10 }, // x64
    { pattern: [0x48, 0x83, 0xEC], weight: 5 }
  ]
};

// Common Windows API functions
const COMMON_APIS = {
  'kernel32.dll': [
    'CreateFileA', 'CreateFileW', 'ReadFile', 'WriteFile', 'CloseHandle',
    'CreateThread', 'ExitProcess', 'GetProcAddress', 'LoadLibraryA', 'LoadLibraryW',
    'VirtualAlloc', 'VirtualFree', 'GetModuleHandleA', 'GetModuleHandleW',
    'CreateProcessA', 'CreateProcessW', 'TerminateProcess', 'GetCurrentProcess',
    'Sleep', 'GetTickCount', 'GetSystemTime', 'GetLocalTime'
  ],
  'user32.dll': [
    'MessageBoxA', 'MessageBoxW', 'CreateWindowExA', 'CreateWindowExW',
    'ShowWindow', 'UpdateWindow', 'GetMessageA', 'GetMessageW', 'DispatchMessageA',
    'TranslateMessage', 'PostQuitMessage', 'DefWindowProcA', 'RegisterClassA',
    'LoadIconA', 'LoadCursorA', 'GetDC', 'ReleaseDC'
  ],
  'advapi32.dll': [
    'RegOpenKeyExA', 'RegOpenKeyExW', 'RegCloseKey', 'RegQueryValueExA',
    'RegSetValueExA', 'RegCreateKeyExA', 'CryptAcquireContextA', 'CryptGenRandom'
  ],
  'ws2_32.dll': [
    'WSAStartup', 'socket', 'connect', 'send', 'recv', 'closesocket',
    'bind', 'listen', 'accept', 'WSACleanup', 'getaddrinfo', 'inet_addr'
  ],
  'msvcrt.dll': [
    'malloc', 'free', 'printf', 'scanf', 'fopen', 'fclose', 'fread', 'fwrite',
    'strlen', 'strcpy', 'strcmp', 'strcat', 'memcpy', 'memset', 'exit'
  ]
};

/**
 * Main pattern detection function
 * @param {Uint8Array|Array} code - Executable code bytes
 * @param {Object} peData - Parsed PE structure
 * @returns {Object} Detection results
 */
export function detectPatterns(code, peData) {
  const data = code instanceof Uint8Array ? code : new Uint8Array(code);
  
  // Find text section
  const textSection = peData.sections.find(s => s.name === '.text' || s.type === 'code');
  const codeStart = textSection ? textSection.pointerToRawData : 0;
  const codeSize = textSection ? textSection.sizeOfRawData : Math.min(data.length, 100000);
  const imageBase = peData.imageBase || 0x400000;
  
  // Detect functions
  const functions = detectFunctions(data, codeStart, codeSize, imageBase, peData.architecture);
  
  // Extract strings
  const strings = extractStrings(data, peData);
  
  // Detect API calls
  const apiCalls = detectAPICalls(peData, functions);
  
  // Detect compiler
  const compiler = detectCompiler(data, codeStart, codeSize);
  
  // Find string references in code
  const stringRefs = findStringReferences(data, codeStart, codeSize, strings, imageBase);
  
  return {
    functions,
    strings,
    apiCalls,
    compiler,
    stringRefs,
    statistics: {
      totalFunctions: functions.length,
      totalStrings: strings.length,
      totalAPICalls: apiCalls.length,
      codeSize: codeSize
    }
  };
}

/**
 * Detect function boundaries
 */
function detectFunctions(data, start, size, imageBase, arch = 'x86') {
  const functions = [];
  const end = Math.min(start + size, data.length);
  
  // Scan for function prologues
  for (let i = start; i < end - 10; i++) {
    for (const prologue of FUNCTION_PROLOGUES) {
      if (matchesPattern(data, i, prologue.pattern)) {
        // Found a potential function
        const address = imageBase + i;
        const addressHex = `0x${address.toString(16).toUpperCase()}`;
        
        // Try to find function end
        const functionEnd = findFunctionEnd(data, i, Math.min(i + 4096, end));
        const functionSize = functionEnd - i;
        
        // Disassemble function to get instruction count
        const instructions = disassemble(
          data.slice(i, functionEnd),
          address,
          arch,
          1000
        );
        
        // Calculate complexity
        const complexity = calculateComplexity(instructions);
        
        functions.push({
          name: `sub_${addressHex.slice(2)}`,
          address: addressHex,
          addressNum: address,
          offset: i,
          size: functionSize,
          prologue: prologue.name,
          compiler: prologue.compiler,
          architecture: prologue.arch,
          instructionCount: instructions.length,
          complexity: complexity,
          instructions: instructions
        });
        
        // Skip past this function
        i = functionEnd - 1;
        break;
      }
    }
  }
  
  // Remove duplicates and overlapping functions
  const uniqueFunctions = removeDuplicateFunctions(functions);
  
  return uniqueFunctions;
}

/**
 * Find the end of a function
 */
function findFunctionEnd(data, start, maxEnd) {
  const searchLimit = Math.min(start + 4096, maxEnd);
  
  for (let i = start; i < searchLimit - 2; i++) {
    // Look for epilogue patterns
    for (const epilogue of FUNCTION_EPILOGUES) {
      if (matchesPattern(data, i, epilogue.pattern)) {
        // Found epilogue, function ends after the pattern
        return i + epilogue.pattern.length;
      }
    }
    
    // Simple RET detection
    if (data[i] === 0xC3) {
      return i + 1;
    }
    
    // RET with immediate
    if (data[i] === 0xC2 && i + 2 < searchLimit) {
      return i + 3;
    }
  }
  
  // If no epilogue found, return a reasonable default size
  return Math.min(start + 256, maxEnd);
}

/**
 * Calculate function complexity score
 */
function calculateComplexity(instructions) {
  let score = 0;
  
  for (const inst of instructions) {
    // Control flow increases complexity
    if (inst.type === 'control_flow') {
      if (inst.mnemonic.startsWith('j') && inst.mnemonic !== 'jmp') {
        score += 2; // Conditional jumps
      } else if (inst.mnemonic === 'call') {
        score += 1;
      }
    }
    
    // Loops increase complexity
    if (inst.target && inst.target < inst.addressNum) {
      score += 3; // Backward jump (likely loop)
    }
  }
  
  // Classify complexity
  if (score < 5) return 'simple';
  if (score < 15) return 'medium';
  return 'complex';
}

/**
 * Remove duplicate and overlapping functions
 */
function removeDuplicateFunctions(functions) {
  const unique = [];
  const seen = new Set();
  
  // Sort by address
  functions.sort((a, b) => a.addressNum - b.addressNum);
  
  for (const func of functions) {
    if (seen.has(func.addressNum)) {
      continue;
    }
    
    // Check for overlap with previous function
    if (unique.length > 0) {
      const prev = unique[unique.length - 1];
      const prevEnd = prev.offset + prev.size;
      
      if (func.offset < prevEnd) {
        // Overlapping, skip this one
        continue;
      }
    }
    
    seen.add(func.addressNum);
    unique.push(func);
  }
  
  return unique;
}

/**
 * Extract strings from PE file
 */
function extractStrings(data, peData) {
  const strings = [];
  const minLength = 4;
  
  // Look in data sections
  const dataSections = peData.sections.filter(s =>
    s.type === 'data' || s.type === 'data-readonly' || s.name === '.rdata' || s.name === '.data'
  );
  
  for (const section of dataSections) {
    const start = section.pointerToRawData;
    const size = Math.min(section.sizeOfRawData, data.length - start);
    
    if (start < 0 || start >= data.length) continue;
    
    let currentString = '';
    let startOffset = 0;
    
    for (let i = start; i < start + size && i < data.length; i++) {
      const byte = data[i];
      
      // ASCII printable characters
      if (byte >= 32 && byte <= 126) {
        if (currentString.length === 0) {
          startOffset = i;
        }
        currentString += String.fromCharCode(byte);
      } else if (byte === 0 && currentString.length >= minLength) {
        const rva = section.virtualAddress + (startOffset - start);
        const address = peData.imageBase + rva;
        
        strings.push({
          value: currentString,
          address: `0x${address.toString(16).toUpperCase()}`,
          addressNum: address,
          offset: startOffset,
          length: currentString.length,
          section: section.name,
          type: 'ASCII'
        });
        currentString = '';
      } else {
        currentString = '';
      }
    }
  }
  
  // Also scan for Unicode strings (simplified - check for patterns like "T\0e\0x\0t\0")
  for (const section of dataSections) {
    const start = section.pointerToRawData;
    const size = Math.min(section.sizeOfRawData, data.length - start);
    
    if (start < 0 || start >= data.length) continue;
    
    let currentString = '';
    let startOffset = 0;
    
    for (let i = start; i < start + size - 1 && i < data.length - 1; i += 2) {
      const byte1 = data[i];
      const byte2 = data[i + 1];
      
      // Check for ASCII character followed by null byte (UTF-16 LE)
      if (byte1 >= 32 && byte1 <= 126 && byte2 === 0) {
        if (currentString.length === 0) {
          startOffset = i;
        }
        currentString += String.fromCharCode(byte1);
      } else if (byte1 === 0 && byte2 === 0 && currentString.length >= minLength) {
        const rva = section.virtualAddress + (startOffset - start);
        const address = peData.imageBase + rva;
        
        strings.push({
          value: currentString,
          address: `0x${address.toString(16).toUpperCase()}`,
          addressNum: address,
          offset: startOffset,
          length: currentString.length,
          section: section.name,
          type: 'Unicode'
        });
        currentString = '';
      } else {
        currentString = '';
      }
    }
  }
  
  // Sort by address and limit
  strings.sort((a, b) => a.addressNum - b.addressNum);
  
  // Remove duplicates
  const uniqueStrings = [];
  const seen = new Set();
  
  for (const str of strings) {
    const key = `${str.value}-${str.offset}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueStrings.push(str);
    }
  }
  
  return uniqueStrings.slice(0, 10000); // Limit to 10k strings
}

/**
 * Detect API calls in functions
 */
function detectAPICalls(peData, functions) {
  const apiCalls = [];
  
  // Get imported functions
  const imports = peData.imports || [];
  
  for (const importDll of imports) {
    for (const func of importDll.functions) {
      apiCalls.push({
        dll: importDll.dll,
        function: func.name,
        hint: func.hint,
        isOrdinal: func.isOrdinal,
        type: categorizeAPI(importDll.dll, func.name)
      });
    }
  }
  
  return apiCalls;
}

/**
 * Categorize API function
 */
function categorizeAPI(dll, funcName) {
  const dllLower = dll.toLowerCase();
  
  if (dllLower.includes('kernel32')) {
    if (funcName.includes('File') || funcName.includes('Read') || funcName.includes('Write')) {
      return 'File I/O';
    }
    if (funcName.includes('Process') || funcName.includes('Thread')) {
      return 'Process/Thread';
    }
    if (funcName.includes('Memory') || funcName.includes('Virtual')) {
      return 'Memory';
    }
    return 'System';
  }
  
  if (dllLower.includes('user32')) {
    return 'GUI';
  }
  
  if (dllLower.includes('advapi32')) {
    return 'Registry/Security';
  }
  
  if (dllLower.includes('ws2_32') || dllLower.includes('wsock32')) {
    return 'Network';
  }
  
  if (dllLower.includes('msvcr') || dllLower.includes('ucrtbase')) {
    return 'C Runtime';
  }
  
  return 'Other';
}

/**
 * Find string references in code
 */
function findStringReferences(data, codeStart, codeSize, strings, imageBase) {
  const refs = [];
  const end = Math.min(codeStart + codeSize, data.length);
  
  // Create a map of string addresses for quick lookup
  const stringMap = new Map();
  for (const str of strings) {
    stringMap.set(str.addressNum, str);
  }
  
  // Scan code for string address references
  // Look for MOV/LEA/PUSH with immediate values that match string addresses
  for (let i = codeStart; i < end - 4; i++) {
    const byte = data[i];
    
    // Check for PUSH imm32 (0x68)
    if (byte === 0x68) {
      const imm32 = readUInt32LE(data, i + 1);
      if (stringMap.has(imm32)) {
        refs.push({
          codeAddress: `0x${(imageBase + i).toString(16).toUpperCase()}`,
          stringAddress: `0x${imm32.toString(16).toUpperCase()}`,
          string: stringMap.get(imm32).value,
          type: 'push'
        });
      }
    }
    
    // Check for MOV reg, imm32 (0xB8-0xBF)
    if (byte >= 0xB8 && byte <= 0xBF) {
      const imm32 = readUInt32LE(data, i + 1);
      if (stringMap.has(imm32)) {
        refs.push({
          codeAddress: `0x${(imageBase + i).toString(16).toUpperCase()}`,
          stringAddress: `0x${imm32.toString(16).toUpperCase()}`,
          string: stringMap.get(imm32).value,
          type: 'mov'
        });
      }
    }
  }
  
  return refs;
}

/**
 * Detect compiler from code patterns
 */
function detectCompiler(data, start, size) {
  const scores = {};
  const end = Math.min(start + size, data.length);
  
  // Initialize scores
  for (const compiler in COMPILER_SIGNATURES) {
    scores[compiler] = 0;
  }
  
  // Scan for compiler signatures
  for (let i = start; i < end - 10; i++) {
    for (const compiler in COMPILER_SIGNATURES) {
      const signatures = COMPILER_SIGNATURES[compiler];
      
      for (const sig of signatures) {
        if (matchesPattern(data, i, sig.pattern)) {
          scores[compiler] += sig.weight;
        }
      }
    }
  }
  
  // Find compiler with highest score
  let maxScore = 0;
  let detectedCompiler = 'Unknown';
  
  for (const compiler in scores) {
    if (scores[compiler] > maxScore) {
      maxScore = scores[compiler];
      detectedCompiler = compiler;
    }
  }
  
  // Need minimum score threshold
  if (maxScore < 10) {
    detectedCompiler = 'Unknown';
  }
  
  return {
    name: detectedCompiler,
    confidence: Math.min(100, (maxScore / 50) * 100),
    scores
  };
}

/**
 * Check if data matches pattern at offset
 */
function matchesPattern(data, offset, pattern) {
  if (offset + pattern.length > data.length) {
    return false;
  }
  
  for (let i = 0; i < pattern.length; i++) {
    if (data[offset + i] !== pattern[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Read unsigned 32-bit little-endian integer
 */
function readUInt32LE(data, offset) {
  return (data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)) >>> 0;
}

/**
 * Analyze function for specific patterns
 */
export function analyzeFunctionPatterns(instructions) {
  const patterns = {
    hasLoop: false,
    hasSwitch: false,
    hasRecursion: false,
    callCount: 0,
    jumpCount: 0,
    stackSize: 0
  };
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    
    // Count calls
    if (inst.mnemonic === 'call') {
      patterns.callCount++;
      
      // Check for recursion (call to self)
      if (inst.target === instructions[0].addressNum) {
        patterns.hasRecursion = true;
      }
    }
    
    // Count jumps
    if (inst.mnemonic.startsWith('j')) {
      patterns.jumpCount++;
      
      // Check for loops (backward jump)
      if (inst.target && inst.target < inst.addressNum) {
        patterns.hasLoop = true;
      }
    }
    
    // Look for switch/jump table pattern
    if (inst.mnemonic === 'jmp' && inst.operands.includes('[')) {
      patterns.hasSwitch = true;
    }
    
    // Estimate stack allocation
    if (inst.mnemonic === 'sub' && inst.operands.includes('esp')) {
      const match = inst.operands.match(/0x([0-9a-fA-F]+)/);
      if (match) {
        patterns.stackSize = parseInt(match[1], 16);
      }
    }
    if (inst.mnemonic === 'sub' && inst.operands.includes('rsp')) {
      const match = inst.operands.match(/0x([0-9a-fA-F]+)/);
      if (match) {
        patterns.stackSize = parseInt(match[1], 16);
      }
    }
  }
  
  return patterns;
}
