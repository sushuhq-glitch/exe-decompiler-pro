/**
 * Python Decompiler Module
 * Converts x86/x64 assembly to Python code
 * Generates clean, idiomatic Python with proper indentation and type hints
 */

/**
 * Decompile function to Python
 * @param {Array} instructions - Assembly instructions
 * @param {Object} peData - PE file data
 * @param {Object} functionInfo - Function metadata
 * @returns {Object} Decompiled Python code
 */
export function decompileToPython(instructions, peData, functionInfo = {}) {
  if (!instructions || instructions.length === 0) {
    return {
      code: '# No instructions to decompile\ndef unknown():\n    pass',
      language: 'python',
      success: true
    };
  }

  const funcName = sanitizePythonName(functionInfo.name || `sub_${instructions[0].address?.slice(2) || '0'}`);
  
  // Analyze function structure
  const analysis = analyzePythonFunction(instructions, peData);
  
  // Generate Python function signature
  const signature = generatePythonSignature(funcName, analysis);
  
  // Convert instructions to Python statements
  const pythonStatements = convertToPythonStatements(instructions, analysis, peData);
  
  // Build control flow structures (if/else, while, for)
  const structuredCode = buildPythonControlFlow(pythonStatements, analysis);
  
  // Generate final Python code
  const code = generatePythonCode(signature, structuredCode, analysis);
  
  return {
    code,
    language: 'python',
    success: true,
    analysis
  };
}

/**
 * Sanitize function name for Python
 */
function sanitizePythonName(name) {
  // Python naming conventions: snake_case
  let sanitized = name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^[0-9]/, '_')
    .toLowerCase();
  
  // Avoid Python keywords
  const keywords = ['def', 'class', 'import', 'from', 'return', 'if', 'else', 
                    'elif', 'while', 'for', 'try', 'except', 'finally', 'with',
                    'as', 'pass', 'break', 'continue', 'lambda', 'yield', 'global',
                    'nonlocal', 'assert', 'del', 'raise', 'in', 'is', 'not', 'and',
                    'or', 'None', 'True', 'False'];
  
  if (keywords.includes(sanitized)) {
    sanitized = `_${sanitized}`;
  }
  
  return sanitized;
}

/**
 * Analyze function for Python decompilation
 */
function analyzePythonFunction(instructions, peData) {
  const analysis = {
    params: [],
    locals: new Map(),
    returns: [],
    calls: [],
    loops: [],
    branches: [],
    stackVars: new Map(),
    registers: new Map()
  };
  
  // Track register usage
  const registerTracker = new PythonRegisterTracker();
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    
    if (typeof inst === 'string') {
      // Parse string instruction
      const parts = inst.split(/\s+/);
      const mnemonic = parts[0];
      
      analyzePythonInstruction(mnemonic, parts.slice(1), analysis, registerTracker);
    } else if (inst.mnemonic) {
      analyzePythonInstruction(inst.mnemonic, inst.operands?.split(',') || [], analysis, registerTracker);
    }
  }
  
  return analysis;
}

/**
 * Analyze single instruction for Python patterns
 */
function analyzePythonInstruction(mnemonic, operands, analysis, tracker) {
  // Stack frame analysis
  if (mnemonic === 'push' && operands[0] === 'ebp') {
    analysis.hasProlog = true;
  } else if (mnemonic === 'mov' && operands[0] === 'ebp' && operands[1] === 'esp') {
    analysis.hasProlog = true;
  } else if (mnemonic === 'sub' && operands[0] === 'esp') {
    // Local variable space allocation
    const size = parseInt(operands[1], 16) || parseInt(operands[1], 10) || 0;
    analysis.localSpaceSize = size;
  }
  
  // Return analysis
  if (mnemonic === 'ret' || mnemonic === 'retn') {
    analysis.returns.push({ type: 'void' });
  }
  
  // Call analysis
  if (mnemonic === 'call') {
    analysis.calls.push({ target: operands[0] });
  }
  
  // Conditional branches
  if (mnemonic.startsWith('j') && mnemonic !== 'jmp') {
    analysis.branches.push({ type: mnemonic, target: operands[0] });
  }
  
  // Track variable usage in stack
  if (operands.some(op => op.includes('[ebp') || op.includes('[rbp'))) {
    const match = operands.join(' ').match(/\[(e|r)bp\s*([+-])\s*0x([0-9a-f]+)\]/i);
    if (match) {
      const offset = parseInt(match[3], 16) * (match[2] === '-' ? -1 : 1);
      if (!analysis.stackVars.has(offset)) {
        analysis.stackVars.set(offset, {
          offset,
          name: `var_${Math.abs(offset).toString(16)}`,
          type: 'int',
          usages: 0
        });
      }
      analysis.stackVars.get(offset).usages++;
    }
  }
}

/**
 * Python Register Tracker
 */
class PythonRegisterTracker {
  constructor() {
    this.registers = new Map();
    this.varCounter = 0;
  }
  
  getVar(register) {
    if (!this.registers.has(register)) {
      this.registers.set(register, `var_${this.varCounter++}`);
    }
    return this.registers.get(register);
  }
  
  setVar(register, value) {
    this.registers.set(register, value);
  }
  
  clear(register) {
    this.registers.delete(register);
  }
}

/**
 * Generate Python function signature
 */
function generatePythonSignature(name, analysis) {
  const params = analysis.params.length > 0 
    ? analysis.params.map(p => p.name).join(', ')
    : '';
  
  // Add type hints if available
  const typeHints = analysis.params.length > 0
    ? analysis.params.map(p => `${p.name}: ${p.type || 'int'}`).join(', ')
    : '';
  
  const returnType = analysis.returns.length > 0 
    ? analysis.returns[0].type || 'None'
    : 'None';
  
  if (typeHints) {
    return `def ${name}(${typeHints}) -> ${returnType}:`;
  }
  
  return `def ${name}(${params}):`;
}

/**
 * Convert assembly instructions to Python statements
 */
function convertToPythonStatements(instructions, analysis, peData) {
  const statements = [];
  const tracker = new PythonRegisterTracker();
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    let pythonCode = null;
    
    if (typeof inst === 'string') {
      pythonCode = convertStringInstructionToPython(inst, tracker, analysis);
    } else {
      pythonCode = convertInstructionObjectToPython(inst, tracker, analysis, peData);
    }
    
    if (pythonCode) {
      statements.push({
        address: inst.address || `0x${i.toString(16)}`,
        code: pythonCode,
        original: inst
      });
    }
  }
  
  return statements;
}

/**
 * Convert string instruction to Python
 */
function convertStringInstructionToPython(instStr, tracker, analysis) {
  const parts = instStr.trim().split(/\s+/);
  if (parts.length === 0) return null;
  
  const mnemonic = parts[0].toLowerCase();
  const operands = parts.slice(1).join(' ').split(',').map(s => s.trim());
  
  return convertMnemonicToPython(mnemonic, operands, tracker, analysis);
}

/**
 * Convert instruction object to Python
 */
function convertInstructionObjectToPython(inst, tracker, analysis, peData) {
  if (!inst.mnemonic) return null;
  
  const mnemonic = inst.mnemonic.toLowerCase();
  const operands = inst.operands ? inst.operands.split(',').map(s => s.trim()) : [];
  
  return convertMnemonicToPython(mnemonic, operands, tracker, analysis);
}

/**
 * Convert mnemonic to Python code
 */
function convertMnemonicToPython(mnemonic, operands, tracker, analysis) {
  // Data movement
  if (mnemonic === 'mov' && operands.length >= 2) {
    const dest = convertOperandToPython(operands[0], tracker);
    const src = convertOperandToPython(operands[1], tracker);
    return `${dest} = ${src}`;
  }
  
  if (mnemonic === 'lea' && operands.length >= 2) {
    const dest = convertOperandToPython(operands[0], tracker);
    const src = convertOperandToPython(operands[1], tracker);
    return `${dest} = ${src}  # address of`;
  }
  
  // Arithmetic
  if (mnemonic === 'add' && operands.length >= 2) {
    const dest = convertOperandToPython(operands[0], tracker);
    const src = convertOperandToPython(operands[1], tracker);
    return `${dest} += ${src}`;
  }
  
  if (mnemonic === 'sub' && operands.length >= 2) {
    const dest = convertOperandToPython(operands[0], tracker);
    const src = convertOperandToPython(operands[1], tracker);
    return `${dest} -= ${src}`;
  }
  
  if (mnemonic === 'mul' || mnemonic === 'imul') {
    if (operands.length >= 2) {
      const dest = convertOperandToPython(operands[0], tracker);
      const src = convertOperandToPython(operands[1], tracker);
      return `${dest} *= ${src}`;
    }
  }
  
  if (mnemonic === 'div' || mnemonic === 'idiv') {
    if (operands.length >= 1) {
      const divisor = convertOperandToPython(operands[0], tracker);
      return `eax = eax // ${divisor}  # integer division`;
    }
  }
  
  if (mnemonic === 'inc' && operands.length >= 1) {
    const dest = convertOperandToPython(operands[0], tracker);
    return `${dest} += 1`;
  }
  
  if (mnemonic === 'dec' && operands.length >= 1) {
    const dest = convertOperandToPython(operands[0], tracker);
    return `${dest} -= 1`;
  }
  
  // Logical operations
  if (mnemonic === 'and' && operands.length >= 2) {
    const dest = convertOperandToPython(operands[0], tracker);
    const src = convertOperandToPython(operands[1], tracker);
    return `${dest} &= ${src}`;
  }
  
  if (mnemonic === 'or' && operands.length >= 2) {
    const dest = convertOperandToPython(operands[0], tracker);
    const src = convertOperandToPython(operands[1], tracker);
    return `${dest} |= ${src}`;
  }
  
  if (mnemonic === 'xor' && operands.length >= 2) {
    const dest = convertOperandToPython(operands[0], tracker);
    const src = convertOperandToPython(operands[1], tracker);
    // Special case: xor reg, reg = zero
    if (dest === src) {
      return `${dest} = 0`;
    }
    return `${dest} ^= ${src}`;
  }
  
  if (mnemonic === 'not' && operands.length >= 1) {
    const dest = convertOperandToPython(operands[0], tracker);
    return `${dest} = ~${dest}`;
  }
  
  if (mnemonic === 'shl' && operands.length >= 2) {
    const dest = convertOperandToPython(operands[0], tracker);
    const count = convertOperandToPython(operands[1], tracker);
    return `${dest} <<= ${count}`;
  }
  
  if (mnemonic === 'shr' && operands.length >= 2) {
    const dest = convertOperandToPython(operands[0], tracker);
    const count = convertOperandToPython(operands[1], tracker);
    return `${dest} >>= ${count}`;
  }
  
  // Stack operations
  if (mnemonic === 'push' && operands.length >= 1) {
    const src = convertOperandToPython(operands[0], tracker);
    return `stack.append(${src})`;
  }
  
  if (mnemonic === 'pop' && operands.length >= 1) {
    const dest = convertOperandToPython(operands[0], tracker);
    return `${dest} = stack.pop()`;
  }
  
  // Comparison
  if (mnemonic === 'cmp' && operands.length >= 2) {
    const op1 = convertOperandToPython(operands[0], tracker);
    const op2 = convertOperandToPython(operands[1], tracker);
    return `# compare ${op1} with ${op2}`;
  }
  
  if (mnemonic === 'test' && operands.length >= 2) {
    const op1 = convertOperandToPython(operands[0], tracker);
    const op2 = convertOperandToPython(operands[1], tracker);
    return `# test ${op1} & ${op2}`;
  }
  
  // Control flow
  if (mnemonic === 'call' && operands.length >= 1) {
    const target = operands[0];
    // Try to resolve function name
    const funcName = resolveFunctionName(target);
    return `${funcName}()`;
  }
  
  if (mnemonic === 'ret' || mnemonic === 'retn') {
    return `return`;
  }
  
  if (mnemonic === 'jmp') {
    return `# goto ${operands[0] || 'address'}`;
  }
  
  // Conditional jumps
  const condJumps = {
    'je': 'if', 'jz': 'if',
    'jne': 'if not', 'jnz': 'if not',
    'jg': 'if >', 'jl': 'if <',
    'jge': 'if >=', 'jle': 'if <=',
    'ja': 'if >', 'jb': 'if <',
    'jae': 'if >=', 'jbe': 'if <='
  };
  
  if (condJumps[mnemonic]) {
    return `# ${condJumps[mnemonic]} jump to ${operands[0] || 'address'}`;
  }
  
  // Default: comment the instruction
  return `# ${mnemonic} ${operands.join(', ')}`;
}

/**
 * Convert operand to Python expression
 */
function convertOperandToPython(operand, tracker) {
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
    return convertMemoryReferenceToPython(operand, tracker);
  }
  
  // Registers - convert to Python variables
  const registerMap = {
    'eax': 'eax', 'ebx': 'ebx', 'ecx': 'ecx', 'edx': 'edx',
    'esi': 'esi', 'edi': 'edi', 'esp': 'esp', 'ebp': 'ebp',
    'rax': 'rax', 'rbx': 'rbx', 'rcx': 'rcx', 'rdx': 'rdx',
    'rsi': 'rsi', 'rdi': 'rdi', 'rsp': 'rsp', 'rbp': 'rbp',
    'al': 'al', 'bl': 'bl', 'cl': 'cl', 'dl': 'dl',
    'ah': 'ah', 'bh': 'bh', 'ch': 'ch', 'dh': 'dh',
    'ax': 'ax', 'bx': 'bx', 'cx': 'cx', 'dx': 'dx',
    'r8': 'r8', 'r9': 'r9', 'r10': 'r10', 'r11': 'r11',
    'r12': 'r12', 'r13': 'r13', 'r14': 'r14', 'r15': 'r15'
  };
  
  const regName = operand.toLowerCase();
  if (registerMap[regName]) {
    return tracker.getVar(registerMap[regName]);
  }
  
  return operand;
}

/**
 * Convert memory reference to Python
 */
function convertMemoryReferenceToPython(operand, tracker) {
  // Remove brackets
  let inner = operand.replace(/[\[\]]/g, '').trim();
  
  // Handle [ebp-0x4], [esp+0x8], etc.
  const match = inner.match(/(\w+)\s*([+-])\s*(0x[0-9a-f]+|[0-9]+)/i);
  if (match) {
    const base = convertOperandToPython(match[1], tracker);
    const op = match[2];
    const offset = match[3];
    
    if (base === 'ebp' || base === 'rbp') {
      // Local variable or parameter
      return `local_${offset}`;
    }
    
    return `memory[${base} ${op} ${offset}]`;
  }
  
  // Simple register dereference: [eax]
  if (/^\w+$/.test(inner)) {
    const base = convertOperandToPython(inner, tracker);
    return `memory[${base}]`;
  }
  
  return `memory[${inner}]`;
}

/**
 * Resolve function name from address or import
 */
function resolveFunctionName(target) {
  // Try to extract meaningful name
  if (target.includes('::')) {
    const parts = target.split('::');
    return sanitizePythonName(parts[parts.length - 1]);
  }
  
  if (target.startsWith('0x')) {
    return `func_${target.slice(2)}`;
  }
  
  return sanitizePythonName(target);
}

/**
 * Build Python control flow structures
 */
function buildPythonControlFlow(statements, analysis) {
  // Group statements into logical blocks
  const blocks = [];
  let currentBlock = [];
  
  for (const stmt of statements) {
    const code = stmt.code;
    
    // Detect control flow changes
    if (code.includes('# if') || code.includes('# while') || code.includes('# goto')) {
      if (currentBlock.length > 0) {
        blocks.push({ type: 'linear', statements: currentBlock });
        currentBlock = [];
      }
      blocks.push({ type: 'control', statement: stmt });
    } else if (code.includes('return')) {
      currentBlock.push(stmt);
      if (currentBlock.length > 0) {
        blocks.push({ type: 'linear', statements: currentBlock });
        currentBlock = [];
      }
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
 * Generate final Python code
 */
function generatePythonCode(signature, structuredCode, analysis) {
  let code = `# Decompiled to Python\n`;
  code += `# Function analysis: ${analysis.calls.length} calls, ${analysis.branches.length} branches\n\n`;
  
  // Add imports if needed
  if (analysis.calls.some(c => c.target.includes('kernel32') || c.target.includes('user32'))) {
    code += `import ctypes\nfrom ctypes import windll\n\n`;
  }
  
  code += `${signature}\n`;
  
  // Add docstring
  code += `    """\n`;
  code += `    Decompiled function\n`;
  if (analysis.params.length > 0) {
    code += `    \n`;
    code += `    Args:\n`;
    for (const param of analysis.params) {
      code += `        ${param.name}: ${param.type || 'int'}\n`;
    }
  }
  code += `    """\n`;
  
  // Initialize local variables
  if (analysis.stackVars.size > 0) {
    code += `    # Local variables\n`;
    for (const [offset, varInfo] of analysis.stackVars) {
      code += `    ${varInfo.name} = 0\n`;
    }
    code += `\n`;
  }
  
  // Generate function body
  for (const block of structuredCode) {
    if (block.type === 'linear') {
      for (const stmt of block.statements) {
        code += `    ${stmt.code}\n`;
      }
    } else if (block.type === 'control') {
      code += `    ${block.statement.code}\n`;
    }
  }
  
  // Ensure function has a body
  if (structuredCode.length === 0) {
    code += `    pass\n`;
  }
  
  return code;
}

/**
 * Batch decompile multiple functions to Python
 */
export function batchDecompileToPython(functions, peData) {
  const results = [];
  
  for (const func of functions) {
    try {
      const result = decompileToPython(func.instructions || [], peData, func);
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
 * Generate complete Python project
 */
export function generatePythonProject(functions, peData, projectName) {
  let project = `#!/usr/bin/env python3\n`;
  project += `"""\n`;
  project += `${projectName} - Decompiled to Python\n`;
  project += `Generated by EXE Decompiler Pro\n`;
  project += `\n`;
  project += `This is a decompilation of a Windows executable.\n`;
  project += `Some functionality may not be directly translatable to Python.\n`;
  project += `"""\n\n`;
  
  project += `import sys\n`;
  project += `import struct\n`;
  project += `from typing import Optional, List, Dict\n\n`;
  
  // Add utility classes
  project += `class Memory:\n`;
  project += `    """Simulated memory access"""\n`;
  project += `    def __init__(self):\n`;
  project += `        self.data = {}\n`;
  project += `    \n`;
  project += `    def __getitem__(self, addr):\n`;
  project += `        return self.data.get(addr, 0)\n`;
  project += `    \n`;
  project += `    def __setitem__(self, addr, value):\n`;
  project += `        self.data[addr] = value\n\n`;
  
  project += `# Global memory\n`;
  project += `memory = Memory()\n`;
  project += `stack = []\n\n`;
  
  // Add all functions
  for (const func of functions) {
    const result = decompileToPython(func.instructions || [], peData, func);
    project += result.code;
    project += `\n\n`;
  }
  
  // Add main entry point
  project += `if __name__ == '__main__':\n`;
  project += `    # Program entry point\n`;
  project += `    try:\n`;
  if (functions.length > 0) {
    project += `        ${sanitizePythonName(functions[0].name)}()\n`;
  } else {
    project += `        print("No functions to execute")\n`;
  }
  project += `    except Exception as e:\n`;
  project += `        print(f"Error: {e}")\n`;
  project += `        sys.exit(1)\n`;
  
  return project;
}
