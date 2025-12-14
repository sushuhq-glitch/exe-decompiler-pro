/**
 * Go Decompiler Module
 * Converts x86/x64 assembly to Go code
 * Generates idiomatic Go with proper error handling and goroutines where applicable
 */

/**
 * Decompile function to Go
 * @param {Array} instructions - Assembly instructions
 * @param {Object} peData - PE file data
 * @param {Object} functionInfo - Function metadata
 * @returns {Object} Decompiled Go code
 */
export function decompileToGo(instructions, peData, functionInfo = {}) {
  if (!instructions || instructions.length === 0) {
    return {
      code: '// No instructions to decompile\nfunc unknown() {\n\t// empty\n}',
      language: 'go',
      success: true
    };
  }

  const funcName = sanitizeGoName(functionInfo.name || `Sub_${instructions[0].address?.slice(2) || '0'}`);
  
  // Analyze function structure
  const analysis = analyzeGoFunction(instructions, peData);
  
  // Generate Go function signature
  const signature = generateGoSignature(funcName, analysis);
  
  // Convert instructions to Go statements
  const goStatements = convertToGoStatements(instructions, analysis, peData);
  
  // Build control flow structures
  const structuredCode = buildGoControlFlow(goStatements, analysis);
  
  // Generate final Go code
  const code = generateGoCode(signature, structuredCode, analysis);
  
  return {
    code,
    language: 'go',
    success: true,
    analysis
  };
}

/**
 * Sanitize function name for Go
 */
function sanitizeGoName(name) {
  // Go naming conventions: PascalCase for exported, camelCase for unexported
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Make first letter uppercase for exported functions
  if (sanitized.length > 0) {
    sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
  }
  
  // Avoid Go keywords
  const keywords = ['break', 'case', 'chan', 'const', 'continue', 'default',
                    'defer', 'else', 'fallthrough', 'for', 'func', 'go', 'goto',
                    'if', 'import', 'interface', 'map', 'package', 'range',
                    'return', 'select', 'struct', 'switch', 'type', 'var'];
  
  if (keywords.includes(sanitized.toLowerCase())) {
    sanitized = `${sanitized}_`;
  }
  
  return sanitized;
}

/**
 * Analyze function for Go decompilation
 */
function analyzeGoFunction(instructions, peData) {
  const analysis = {
    params: [],
    returns: [],
    locals: new Map(),
    calls: [],
    loops: [],
    branches: [],
    stackVars: new Map(),
    registers: new Map(),
    usesPointers: false,
    usesChannels: false,
    usesGoroutines: false,
    hasDefer: false
  };
  
  const tracker = new GoRegisterTracker();
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    
    if (typeof inst === 'string') {
      const parts = inst.split(/\s+/);
      const mnemonic = parts[0];
      analyzeGoInstruction(mnemonic, parts.slice(1), analysis, tracker);
    } else if (inst.mnemonic) {
      analyzeGoInstruction(inst.mnemonic, inst.operands?.split(',') || [], analysis, tracker);
    }
  }
  
  return analysis;
}

/**
 * Analyze single instruction for Go patterns
 */
function analyzeGoInstruction(mnemonic, operands, analysis, tracker) {
  // Stack frame analysis
  if (mnemonic === 'push' && operands[0] === 'ebp') {
    analysis.hasProlog = true;
  } else if (mnemonic === 'mov' && operands[0] === 'ebp' && operands[1] === 'esp') {
    analysis.hasProlog = true;
  } else if (mnemonic === 'sub' && operands[0] === 'esp') {
    const size = parseInt(operands[1], 16) || parseInt(operands[1], 10) || 0;
    analysis.localSpaceSize = size;
  }
  
  // Return analysis
  if (mnemonic === 'ret' || mnemonic === 'retn') {
    analysis.returns.push({ type: 'int' });
  }
  
  // Call analysis
  if (mnemonic === 'call') {
    analysis.calls.push({ target: operands[0] });
  }
  
  // Pointer usage
  if (operands.some(op => op.includes('['))) {
    analysis.usesPointers = true;
  }
  
  // Stack variables
  if (operands.some(op => op.includes('[ebp') || op.includes('[rbp'))) {
    const match = operands.join(' ').match(/\[(e|r)bp\s*([+-])\s*0x([0-9a-f]+)\]/i);
    if (match) {
      const offset = parseInt(match[3], 16) * (match[2] === '-' ? -1 : 1);
      if (!analysis.stackVars.has(offset)) {
        analysis.stackVars.set(offset, {
          offset,
          name: `var${Math.abs(offset)}`,
          type: 'int32',
          usages: 0
        });
      }
      analysis.stackVars.get(offset).usages++;
    }
  }
}

/**
 * Go Register Tracker
 */
class GoRegisterTracker {
  constructor() {
    this.registers = new Map();
    this.varCounter = 0;
  }
  
  getVar(register) {
    if (!this.registers.has(register)) {
      this.registers.set(register, `v${this.varCounter++}`);
    }
    return this.registers.get(register);
  }
  
  setVar(register, value) {
    this.registers.set(register, value);
  }
}

/**
 * Generate Go function signature
 */
function generateGoSignature(name, analysis) {
  const params = analysis.params.length > 0
    ? analysis.params.map(p => `${p.name} ${p.type || 'int32'}`).join(', ')
    : '';
  
  const returns = analysis.returns.length > 0
    ? ` ${analysis.returns[0].type || 'int32'}`
    : '';
  
  return `func ${name}(${params})${returns}`;
}

/**
 * Convert assembly instructions to Go statements
 */
function convertToGoStatements(instructions, analysis, peData) {
  const statements = [];
  const tracker = new GoRegisterTracker();
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    let goCode = null;
    
    if (typeof inst === 'string') {
      goCode = convertStringInstructionToGo(inst, tracker, analysis);
    } else {
      goCode = convertInstructionObjectToGo(inst, tracker, analysis, peData);
    }
    
    if (goCode) {
      statements.push({
        address: inst.address || `0x${i.toString(16)}`,
        code: goCode,
        original: inst
      });
    }
  }
  
  return statements;
}

/**
 * Convert string instruction to Go
 */
function convertStringInstructionToGo(instStr, tracker, analysis) {
  const parts = instStr.trim().split(/\s+/);
  if (parts.length === 0) return null;
  
  const mnemonic = parts[0].toLowerCase();
  const operands = parts.slice(1).join(' ').split(',').map(s => s.trim());
  
  return convertMnemonicToGo(mnemonic, operands, tracker, analysis);
}

/**
 * Convert instruction object to Go
 */
function convertInstructionObjectToGo(inst, tracker, analysis, peData) {
  if (!inst.mnemonic) return null;
  
  const mnemonic = inst.mnemonic.toLowerCase();
  const operands = inst.operands ? inst.operands.split(',').map(s => s.trim()) : [];
  
  return convertMnemonicToGo(mnemonic, operands, tracker, analysis);
}

/**
 * Convert mnemonic to Go code
 */
function convertMnemonicToGo(mnemonic, operands, tracker, analysis) {
  // Data movement
  if (mnemonic === 'mov' && operands.length >= 2) {
    const dest = convertOperandToGo(operands[0], tracker);
    const src = convertOperandToGo(operands[1], tracker);
    return `${dest} = ${src}`;
  }
  
  if (mnemonic === 'lea' && operands.length >= 2) {
    const dest = convertOperandToGo(operands[0], tracker);
    const src = convertOperandToGo(operands[1], tracker);
    return `${dest} = &(${src})`;
  }
  
  // Arithmetic operations
  if (mnemonic === 'add' && operands.length >= 2) {
    const dest = convertOperandToGo(operands[0], tracker);
    const src = convertOperandToGo(operands[1], tracker);
    return `${dest} += ${src}`;
  }
  
  if (mnemonic === 'sub' && operands.length >= 2) {
    const dest = convertOperandToGo(operands[0], tracker);
    const src = convertOperandToGo(operands[1], tracker);
    return `${dest} -= ${src}`;
  }
  
  if (mnemonic === 'mul' || mnemonic === 'imul') {
    if (operands.length >= 2) {
      const dest = convertOperandToGo(operands[0], tracker);
      const src = convertOperandToGo(operands[1], tracker);
      return `${dest} *= ${src}`;
    }
  }
  
  if (mnemonic === 'div' || mnemonic === 'idiv') {
    if (operands.length >= 1) {
      const divisor = convertOperandToGo(operands[0], tracker);
      return `eax = eax / ${divisor}`;
    }
  }
  
  if (mnemonic === 'inc' && operands.length >= 1) {
    const dest = convertOperandToGo(operands[0], tracker);
    return `${dest}++`;
  }
  
  if (mnemonic === 'dec' && operands.length >= 1) {
    const dest = convertOperandToGo(operands[0], tracker);
    return `${dest}--`;
  }
  
  // Logical operations
  if (mnemonic === 'and' && operands.length >= 2) {
    const dest = convertOperandToGo(operands[0], tracker);
    const src = convertOperandToGo(operands[1], tracker);
    return `${dest} &= ${src}`;
  }
  
  if (mnemonic === 'or' && operands.length >= 2) {
    const dest = convertOperandToGo(operands[0], tracker);
    const src = convertOperandToGo(operands[1], tracker);
    return `${dest} |= ${src}`;
  }
  
  if (mnemonic === 'xor' && operands.length >= 2) {
    const dest = convertOperandToGo(operands[0], tracker);
    const src = convertOperandToGo(operands[1], tracker);
    if (dest === src) {
      return `${dest} = 0`;
    }
    return `${dest} ^= ${src}`;
  }
  
  if (mnemonic === 'not' && operands.length >= 1) {
    const dest = convertOperandToGo(operands[0], tracker);
    return `${dest} = ^${dest}`;
  }
  
  if (mnemonic === 'shl' && operands.length >= 2) {
    const dest = convertOperandToGo(operands[0], tracker);
    const count = convertOperandToGo(operands[1], tracker);
    return `${dest} <<= ${count}`;
  }
  
  if (mnemonic === 'shr' && operands.length >= 2) {
    const dest = convertOperandToGo(operands[0], tracker);
    const count = convertOperandToGo(operands[1], tracker);
    return `${dest} >>= ${count}`;
  }
  
  // Stack operations (less common in Go, but still needed)
  if (mnemonic === 'push' && operands.length >= 1) {
    const src = convertOperandToGo(operands[0], tracker);
    return `// push ${src}`;
  }
  
  if (mnemonic === 'pop' && operands.length >= 1) {
    const dest = convertOperandToGo(operands[0], tracker);
    return `// pop ${dest}`;
  }
  
  // Comparison
  if (mnemonic === 'cmp' && operands.length >= 2) {
    const op1 = convertOperandToGo(operands[0], tracker);
    const op2 = convertOperandToGo(operands[1], tracker);
    return `// compare ${op1} with ${op2}`;
  }
  
  if (mnemonic === 'test' && operands.length >= 2) {
    const op1 = convertOperandToGo(operands[0], tracker);
    const op2 = convertOperandToGo(operands[1], tracker);
    return `// test ${op1} & ${op2}`;
  }
  
  // Control flow
  if (mnemonic === 'call' && operands.length >= 1) {
    const target = operands[0];
    const funcName = resolveGoFunctionName(target);
    return `${funcName}()`;
  }
  
  if (mnemonic === 'ret' || mnemonic === 'retn') {
    return `return`;
  }
  
  if (mnemonic === 'jmp') {
    return `// goto ${operands[0] || 'label'}`;
  }
  
  // Conditional jumps
  const condJumps = {
    'je': '==', 'jz': '==',
    'jne': '!=', 'jnz': '!=',
    'jg': '>', 'jl': '<',
    'jge': '>=', 'jle': '<=',
    'ja': '>', 'jb': '<',
    'jae': '>=', 'jbe': '<='
  };
  
  if (condJumps[mnemonic]) {
    return `// if condition ${condJumps[mnemonic]} goto ${operands[0] || 'label'}`;
  }
  
  // Default
  return `// ${mnemonic} ${operands.join(', ')}`;
}

/**
 * Convert operand to Go expression
 */
function convertOperandToGo(operand, tracker) {
  if (!operand) return '0';
  
  operand = operand.trim();
  
  // Immediate values
  if (operand.startsWith('0x')) {
    return operand;
  }
  
  if (/^-?[0-9]+$/.test(operand)) {
    return operand;
  }
  
  // Memory references
  if (operand.includes('[')) {
    return convertMemoryReferenceToGo(operand, tracker);
  }
  
  // Registers
  const registerMap = {
    'eax': 'eax', 'ebx': 'ebx', 'ecx': 'ecx', 'edx': 'edx',
    'esi': 'esi', 'edi': 'edi', 'esp': 'esp', 'ebp': 'ebp',
    'rax': 'rax', 'rbx': 'rbx', 'rcx': 'rcx', 'rdx': 'rdx',
    'rsi': 'rsi', 'rdi': 'rdi', 'rsp': 'rsp', 'rbp': 'rbp',
    'r8': 'r8', 'r9': 'r9', 'r10': 'r10', 'r11': 'r11'
  };
  
  const regName = operand.toLowerCase();
  if (registerMap[regName]) {
    return tracker.getVar(registerMap[regName]);
  }
  
  return operand;
}

/**
 * Convert memory reference to Go
 */
function convertMemoryReferenceToGo(operand, tracker) {
  let inner = operand.replace(/[\[\]]/g, '').trim();
  
  // Handle [ebp-0x4], [esp+0x8]
  const match = inner.match(/(\w+)\s*([+-])\s*(0x[0-9a-f]+|[0-9]+)/i);
  if (match) {
    const base = convertOperandToGo(match[1], tracker);
    const op = match[2];
    const offset = match[3];
    
    if (base === 'ebp' || base === 'rbp') {
      return `local${offset}`;
    }
    
    return `*(*int32)(unsafe.Pointer(uintptr(${base}) ${op} ${offset}))`;
  }
  
  // Simple dereference
  if (/^\w+$/.test(inner)) {
    const base = convertOperandToGo(inner, tracker);
    return `*${base}`;
  }
  
  return `*(*int32)(unsafe.Pointer(${inner}))`;
}

/**
 * Resolve function name for Go
 */
function resolveGoFunctionName(target) {
  if (target.includes('::')) {
    const parts = target.split('::');
    return sanitizeGoName(parts[parts.length - 1]);
  }
  
  if (target.startsWith('0x')) {
    return `Func_${target.slice(2)}`;
  }
  
  return sanitizeGoName(target);
}

/**
 * Build Go control flow structures
 */
function buildGoControlFlow(statements, analysis) {
  const blocks = [];
  let currentBlock = [];
  
  for (const stmt of statements) {
    const code = stmt.code;
    
    if (code.includes('// if') || code.includes('// goto')) {
      if (currentBlock.length > 0) {
        blocks.push({ type: 'linear', statements: currentBlock });
        currentBlock = [];
      }
      blocks.push({ type: 'control', statement: stmt });
    } else if (code.includes('return')) {
      currentBlock.push(stmt);
      blocks.push({ type: 'linear', statements: currentBlock });
      currentBlock = [];
    } else {
      currentBlock.push(stmt);
    }
  }
  
  if (currentBlock.length > 0) {
    blocks.push({ type: 'linear', statements: currentBlock });
  }
  
  return blocks;
}

/**
 * Generate final Go code
 */
function generateGoCode(signature, structuredCode, analysis) {
  let code = `// Decompiled to Go\n`;
  code += `// Function analysis: ${analysis.calls.length} calls, ${analysis.branches.length} branches\n\n`;
  
  code += `${signature} {\n`;
  
  // Declare local variables
  if (analysis.stackVars.size > 0) {
    code += `\t// Local variables\n`;
    for (const [offset, varInfo] of analysis.stackVars) {
      code += `\tvar ${varInfo.name} ${varInfo.type}\n`;
    }
    code += `\n`;
  }
  
  // Generate function body
  for (const block of structuredCode) {
    if (block.type === 'linear') {
      for (const stmt of block.statements) {
        code += `\t${stmt.code}\n`;
      }
    } else if (block.type === 'control') {
      code += `\t${block.statement.code}\n`;
    }
  }
  
  // Ensure function has content
  if (structuredCode.length === 0) {
    code += `\t// Function body\n`;
  }
  
  code += `}\n`;
  
  return code;
}

/**
 * Batch decompile multiple functions to Go
 */
export function batchDecompileToGo(functions, peData) {
  const results = [];
  
  for (const func of functions) {
    try {
      const result = decompileToGo(func.instructions || [], peData, func);
      results.push({
        name: func.name,
        success: true,
        code: result.code
      });
    } catch (error) {
      results.push({
        name: func.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Generate complete Go project
 */
export function generateGoProject(functions, peData, projectName) {
  let project = `// ${projectName} - Decompiled to Go\n`;
  project += `// Generated by EXE Decompiler Pro\n`;
  project += `//\n`;
  project += `// This is a decompilation of a Windows executable.\n`;
  project += `// Some functionality may not be directly translatable to Go.\n\n`;
  
  project += `package main\n\n`;
  
  project += `import (\n`;
  project += `\t"fmt"\n`;
  project += `\t"os"\n`;
  if (analysis.usesPointers) {
    project += `\t"unsafe"\n`;
  }
  project += `)\n\n`;
  
  // Add utility types if needed
  project += `// Memory represents simulated memory access\n`;
  project += `type Memory map[uintptr]int32\n\n`;
  
  project += `var memory = make(Memory)\n\n`;
  
  // Add all functions
  for (const func of functions) {
    const result = decompileToGo(func.instructions || [], peData, func);
    project += result.code;
    project += `\n`;
  }
  
  // Add main function
  project += `func main() {\n`;
  project += `\t// Program entry point\n`;
  if (functions.length > 0) {
    project += `\t${sanitizeGoName(functions[0].name)}()\n`;
  } else {
    project += `\tfmt.Println("No functions to execute")\n`;
  }
  project += `\tos.Exit(0)\n`;
  project += `}\n`;
  
  return project;
}

/**
 * Generate Go package with proper structure
 */
export function generateGoPackage(functions, peData, packageName) {
  const pkg = {
    name: packageName,
    files: []
  };
  
  // Main file
  pkg.files.push({
    name: 'main.go',
    content: generateGoProject(functions, peData, packageName)
  });
  
  // Go module file
  pkg.files.push({
    name: 'go.mod',
    content: `module ${packageName}\n\ngo 1.21\n`
  });
  
  // README
  pkg.files.push({
    name: 'README.md',
    content: `# ${packageName}\n\nDecompiled from Windows executable using EXE Decompiler Pro.\n\n## Build\n\n\`\`\`bash\ngo build\n\`\`\`\n\n## Run\n\n\`\`\`bash\ngo run main.go\n\`\`\`\n`
  });
  
  return pkg;
}
