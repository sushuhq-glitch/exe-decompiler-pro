/**
 * Shared Decompiler Utilities
 * Common regex patterns and helper functions used across all decompilers
 */

// Common regex patterns for operand parsing
export const REGEX_PATTERNS = {
  // Local variable patterns: [ebp-0xXX] or [rbp-0xXX]
  LOCAL_VAR: /\[(?:ebp|rbp)-0x([0-9a-fA-F]+)\]/,
  
  // Parameter patterns: [ebp+0xXX] or [rbp+0xXX]
  PARAM_VAR: /\[(?:ebp|rbp)\+0x([0-9a-fA-F]+)\]/,
  
  // Memory dereference patterns
  MEMORY_DEREF: /\[([^\]]+)\]/,
  
  // Immediate value patterns
  IMMEDIATE_HEX: /^0x[0-9a-fA-F]+$/,
  
  // Register patterns (basic)
  REGISTER: /^(?:eax|ebx|ecx|edx|esi|edi|ebp|esp|rax|rbx|rcx|rdx|rsi|rdi|rbp|rsp|r8|r9|r10|r11|r12|r13|r14|r15|al|bl|cl|dl|ah|bh|ch|dh|ax|bx|cx|dx|si|di|bp|sp)$/
};

// Common register lists
export const REGISTERS = {
  X86_32: ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'ebp', 'esp'],
  X86_64: ['rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'rbp', 'rsp'],
  X86_64_EXTENDED: ['r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15'],
  X86_8BIT: ['al', 'bl', 'cl', 'dl', 'ah', 'bh', 'ch', 'dh'],
  X86_16BIT: ['ax', 'bx', 'cx', 'dx', 'si', 'di', 'bp', 'sp'],
  
  // Combined list
  ALL: [
    'eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'ebp', 'esp',
    'rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'rbp', 'rsp',
    'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15',
    'al', 'bl', 'cl', 'dl', 'ah', 'bh', 'ch', 'dh',
    'ax', 'bx', 'cx', 'dx', 'si', 'di', 'bp', 'sp'
  ]
};

/**
 * Check if operand is a register
 */
export function isRegister(operand) {
  return REGISTERS.ALL.includes(operand);
}

/**
 * Parse local variable from operand
 */
export function parseLocalVariable(operand) {
  const match = operand.match(REGEX_PATTERNS.LOCAL_VAR);
  if (match) {
    const offset = parseInt(match[1], 16);
    return { isLocal: true, offset: -offset };
  }
  return null;
}

/**
 * Parse parameter from operand
 */
export function parseParameter(operand) {
  const match = operand.match(REGEX_PATTERNS.PARAM_VAR);
  if (match) {
    const offset = parseInt(match[1], 16);
    if (offset >= 8) {
      return { isParam: true, offset };
    }
  }
  return null;
}

/**
 * Parse memory dereference
 */
export function parseMemoryDereference(operand) {
  if (operand.startsWith('[') && operand.endsWith(']')) {
    const inner = operand.slice(1, -1);
    return { isDereference: true, inner };
  }
  return null;
}

/**
 * Check if operand is an immediate hex value
 */
export function isImmediateHex(operand) {
  return REGEX_PATTERNS.IMMEDIATE_HEX.test(operand);
}

/**
 * Sanitize function name for different languages
 */
export function sanitizeFunctionName(name, language) {
  const sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
  
  switch (language) {
    case 'python':
      return sanitized.toLowerCase();
    case 'golang':
      // Capitalize first letter for Go exported functions
      return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
    case 'cpp':
    case 'c':
    default:
      return sanitized;
  }
}

/**
 * Get function data for export scripts
 */
export function extractFunctionDataForExport(functionsData) {
  if (!functionsData || !Array.isArray(functionsData)) {
    return [];
  }
  
  return functionsData.map(f => ({
    address: f.addressNum,
    name: f.name,
    size: f.size || 0,
    instructionCount: f.instructionCount || 0
  }));
}
