/**
 * C++ Decompiler Module
 * Converts x86/x64 assembly to C++ pseudocode with object-oriented features
 */

/**
 * Decompile function to C++
 */
export function decompileToCpp(instructions, peData, functionInfo = {}) {
  if (!instructions || instructions.length === 0) {
    return {
      name: functionInfo.name || 'unknown',
      code: '// No instructions to decompile'
    };
  }

  const funcName = sanitizeCppName(functionInfo.name || `sub_${instructions[0].address?.slice(2) || '0'}`);
  
  // Analyze function
  const analysis = analyzeFunction(instructions);
  
  // Build control flow graph
  const cfg = buildControlFlowGraph(instructions);
  
  // Track register state
  const registerState = new RegisterTracker();
  
  // Convert instructions to C++ statements
  const statements = [];
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    const statement = convertInstructionToCpp(inst, registerState, analysis, peData);
    
    if (statement) {
      statements.push({
        address: inst.address,
        code: statement,
        originalAsm: `${inst.mnemonic} ${inst.operands}`.trim()
      });
    }
  }
  
  // Build control flow structures
  const structuredCode = buildControlFlowStructures(statements, cfg, instructions);
  
  // Generate final C++ code
  const cppCode = generateCppCode(funcName, analysis, structuredCode);
  
  return {
    name: funcName,
    code: cppCode,
    analysis
  };
}

/**
 * Sanitize function name for C++
 */
function sanitizeCppName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Analyze function characteristics
 */
function analyzeFunction(instructions) {
  const analysis = {
    params: [],
    locals: {},
    returnType: 'int',
    usesStack: false,
    callsCount: 0,
    jumpsCount: 0,
    complexity: 'simple',
    callingConvention: '__cdecl'
  };
  
  const localOffsets = new Set();
  const paramOffsets = new Set();
  
  for (const inst of instructions) {
    const operands = inst.operands || '';
    
    // Check for stack frame setup
    if (inst.mnemonic === 'push' && (operands === 'ebp' || operands === 'rbp')) {
      analysis.usesStack = true;
    }
    
    // Track local variables
    let match = operands.match(/\[(?:ebp|rbp)-0x([0-9a-fA-F]+)\]/);
    if (match) {
      const offset = parseInt(match[1], 16);
      localOffsets.add(offset);
    }
    
    // Track parameters
    match = operands.match(/\[(?:ebp|rbp)\+0x([0-9a-fA-F]+)\]/);
    if (match) {
      const offset = parseInt(match[1], 16);
      if (offset >= 8) {
        paramOffsets.add(offset);
      }
    }
    
    // Count calls and jumps
    if (inst.mnemonic === 'call') analysis.callsCount++;
    if (inst.mnemonic && inst.mnemonic.startsWith('j')) analysis.jumpsCount++;
  }
  
  // Create local variables
  const sortedLocals = Array.from(localOffsets).sort((a, b) => a - b);
  for (let i = 0; i < sortedLocals.length; i++) {
    analysis.locals[`local_${i + 1}`] = {
      offset: -sortedLocals[i],
      type: 'int'
    };
  }
  
  // Create parameters
  const sortedParams = Array.from(paramOffsets).sort((a, b) => a - b);
  for (let i = 0; i < sortedParams.length; i++) {
    analysis.params.push({
      name: `param_${i + 1}`,
      offset: sortedParams[i],
      type: 'int'
    });
  }
  
  // Calculate complexity
  const complexityScore = analysis.callsCount + analysis.jumpsCount * 2;
  if (complexityScore < 5) analysis.complexity = 'simple';
  else if (complexityScore < 15) analysis.complexity = 'medium';
  else analysis.complexity = 'complex';
  
  return analysis;
}

/**
 * Register state tracker
 */
class RegisterTracker {
  constructor() {
    this.registers = {};
    this.lastWrite = {};
  }
  
  write(reg, value) {
    this.registers[reg] = value;
    this.lastWrite[reg] = value;
  }
  
  read(reg) {
    return this.registers[reg] || null;
  }
}

/**
 * Convert instruction to C++ statement
 */
function convertInstructionToCpp(inst, registerState, analysis, peData) {
  const mnemonic = inst.mnemonic;
  const operands = inst.operands || '';
  
  // Skip prologue/epilogue
  if (mnemonic === 'nop') return null;
  if (mnemonic === 'push' && (operands === 'ebp' || operands === 'rbp')) return null;
  if (mnemonic === 'mov' && (operands === 'ebp, esp' || operands === 'rbp, rsp')) return null;
  if (mnemonic === 'pop' && (operands === 'ebp' || operands === 'rbp')) return null;
  if (mnemonic === 'leave' || mnemonic === 'ret' || mnemonic === 'retn') return null;
  
  // MOV instruction
  if (mnemonic === 'mov') {
    return convertMovToCpp(operands, registerState, analysis);
  }
  
  // LEA instruction
  if (mnemonic === 'lea') {
    return convertLeaToCpp(operands, registerState, analysis);
  }
  
  // Arithmetic operations
  if (['add', 'sub', 'imul', 'mul', 'div', 'idiv', 'inc', 'dec', 'neg'].includes(mnemonic)) {
    return convertArithmeticToCpp(mnemonic, operands, registerState, analysis);
  }
  
  // Logical operations
  if (['and', 'or', 'xor', 'not', 'shl', 'shr', 'sal', 'sar'].includes(mnemonic)) {
    return convertLogicalToCpp(mnemonic, operands, registerState, analysis);
  }
  
  // Comparison
  if (mnemonic === 'cmp' || mnemonic === 'test') {
    registerState.write('__cmp', operands);
    return `// ${mnemonic} ${operands}`;
  }
  
  // Push/Pop
  if (mnemonic === 'push') {
    return `// push ${formatOperandCpp(operands, analysis)}`;
  }
  if (mnemonic === 'pop') {
    return `${formatOperandCpp(operands, analysis)} = stack_pop();`;
  }
  
  // Call instruction
  if (mnemonic === 'call') {
    return convertCallToCpp(operands, peData);
  }
  
  // Jump instructions - handled by control flow builder
  if (mnemonic.startsWith('j')) {
    return null;
  }
  
  // Default: comment
  return `// ${mnemonic} ${operands}`;
}

/**
 * Convert MOV to C++
 */
function convertMovToCpp(operands, registerState, analysis) {
  const parts = operands.split(',').map(s => s.trim());
  if (parts.length !== 2) return `// mov ${operands}`;
  
  const dest = formatOperandCpp(parts[0], analysis);
  const src = formatOperandCpp(parts[1], analysis);
  
  if (isRegister(parts[0])) {
    registerState.write(parts[0], src);
  }
  
  return `${dest} = ${src};`;
}

/**
 * Convert LEA to C++
 */
function convertLeaToCpp(operands, registerState, analysis) {
  const parts = operands.split(',').map(s => s.trim());
  if (parts.length !== 2) return `// lea ${operands}`;
  
  const dest = formatOperandCpp(parts[0], analysis);
  const src = parts[1];
  
  if (src.startsWith('[') && src.endsWith(']')) {
    const addr = src.slice(1, -1);
    const addrFormatted = formatOperandCpp(addr, analysis);
    return `${dest} = reinterpret_cast<int>(&(${addrFormatted}));`;
  }
  
  return `${dest} = ${src};`;
}

/**
 * Convert arithmetic instruction to C++
 */
function convertArithmeticToCpp(mnemonic, operands, registerState, analysis) {
  const parts = operands.split(',').map(s => s.trim());
  
  if (mnemonic === 'inc') {
    const dest = formatOperandCpp(operands, analysis);
    return `${dest}++;`;
  }
  
  if (mnemonic === 'dec') {
    const dest = formatOperandCpp(operands, analysis);
    return `${dest}--;`;
  }
  
  if (mnemonic === 'neg') {
    const dest = formatOperandCpp(operands, analysis);
    return `${dest} = -${dest};`;
  }
  
  if (parts.length === 2) {
    const dest = formatOperandCpp(parts[0], analysis);
    const src = formatOperandCpp(parts[1], analysis);
    
    const operators = {
      'add': '+',
      'sub': '-',
      'imul': '*',
      'mul': '*'
    };
    
    const op = operators[mnemonic];
    if (op) {
      return `${dest} = ${dest} ${op} ${src};`;
    }
  }
  
  return `// ${mnemonic} ${operands}`;
}

/**
 * Convert logical instruction to C++
 */
function convertLogicalToCpp(mnemonic, operands, registerState, analysis) {
  const parts = operands.split(',').map(s => s.trim());
  
  if (mnemonic === 'not') {
    const dest = formatOperandCpp(operands, analysis);
    return `${dest} = ~${dest};`;
  }
  
  if (parts.length === 2) {
    const dest = formatOperandCpp(parts[0], analysis);
    const src = formatOperandCpp(parts[1], analysis);
    
    // XOR reg, reg => reg = 0
    if (mnemonic === 'xor' && parts[0] === parts[1]) {
      return `${dest} = 0;`;
    }
    
    const operators = {
      'and': '&',
      'or': '|',
      'xor': '^',
      'shl': '<<',
      'shr': '>>',
      'sal': '<<',
      'sar': '>>'
    };
    
    const op = operators[mnemonic];
    if (op) {
      return `${dest} = ${dest} ${op} ${src};`;
    }
  }
  
  return `// ${mnemonic} ${operands}`;
}

/**
 * Convert CALL to C++
 */
function convertCallToCpp(operands, peData) {
  let functionName = operands;
  
  // Try to resolve function name
  if (operands.startsWith('[') && operands.includes('0x')) {
    const match = operands.match(/0x([0-9a-fA-F]+)/);
    if (match && peData && peData.imports) {
      for (const dll of peData.imports) {
        for (const func of dll.functions) {
          if (func.name && !func.isOrdinal) {
            functionName = sanitizeCppName(func.name);
            break;
          }
        }
      }
    }
  }
  
  // Format as function call
  if (functionName.startsWith('[')) {
    return `(*reinterpret_cast<void(*)()>(${functionName}))();`;
  } else if (functionName.startsWith('0x')) {
    return `sub_${functionName.slice(2)}();`;
  } else {
    return `${functionName}();`;
  }
}

/**
 * Format operand for C++
 */
function formatOperandCpp(operand, analysis) {
  operand = operand.trim();
  
  // Check for local variable
  let match = operand.match(/\[(?:ebp|rbp)-0x([0-9a-fA-F]+)\]/);
  if (match) {
    const offset = parseInt(match[1], 16);
    for (const [name, local] of Object.entries(analysis.locals)) {
      if (local.offset === -offset) {
        return name;
      }
    }
    return `local_${offset}`;
  }
  
  // Check for parameter
  match = operand.match(/\[(?:ebp|rbp)\+0x([0-9a-fA-F]+)\]/);
  if (match) {
    const offset = parseInt(match[1], 16);
    const param = analysis.params.find(p => p.offset === offset);
    return param ? param.name : `param_${offset}`;
  }
  
  // Memory dereference
  if (operand.startsWith('[') && operand.endsWith(']')) {
    const inner = operand.slice(1, -1);
    return `*reinterpret_cast<int*>(${formatOperandCpp(inner, analysis)})`;
  }
  
  // Immediate value
  if (operand.startsWith('0x')) {
    return operand;
  }
  
  // Register
  if (isRegister(operand)) {
    return `reg_${operand}`;
  }
  
  return operand;
}

/**
 * Check if operand is a register
 */
function isRegister(operand) {
  const registers = [
    'eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'ebp', 'esp',
    'rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'rbp', 'rsp',
    'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15',
    'al', 'bl', 'cl', 'dl', 'ah', 'bh', 'ch', 'dh',
    'ax', 'bx', 'cx', 'dx', 'si', 'di', 'bp', 'sp'
  ];
  return registers.includes(operand);
}

/**
 * Build control flow graph
 */
function buildControlFlowGraph(instructions) {
  const cfg = {
    blocks: [],
    edges: []
  };
  
  // Identify basic block leaders
  const leaders = new Set();
  leaders.add(instructions[0].addressNum);
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    
    if (inst.target && inst.type === 'control_flow') {
      leaders.add(inst.target);
      if (i + 1 < instructions.length && !inst.mnemonic.startsWith('jmp')) {
        leaders.add(instructions[i + 1].addressNum);
      }
    }
  }
  
  // Build blocks
  const leaderArray = Array.from(leaders).sort((a, b) => a - b);
  
  for (let i = 0; i < leaderArray.length; i++) {
    const startAddr = leaderArray[i];
    const endAddr = i + 1 < leaderArray.length ? leaderArray[i + 1] : instructions[instructions.length - 1].addressNum + 10;
    
    const blockInstructions = instructions.filter(inst =>
      inst.addressNum >= startAddr && inst.addressNum < endAddr
    );
    
    if (blockInstructions.length > 0) {
      cfg.blocks.push({
        id: cfg.blocks.length,
        startAddress: startAddr,
        instructions: blockInstructions,
        successors: [],
        predecessors: []
      });
    }
  }
  
  return cfg;
}

/**
 * Build control flow structures
 */
function buildControlFlowStructures(statements, cfg, instructions) {
  const structured = [];
  const visited = new Set();
  
  function processBlock(blockId, indent = 0) {
    if (visited.has(blockId)) return;
    visited.add(blockId);
    
    const block = cfg.blocks[blockId];
    if (!block) return;
    
    // Add statements from block
    for (const inst of block.instructions) {
      const stmt = statements.find(s => s.address === inst.address);
      if (stmt && stmt.code) {
        structured.push({
          indent,
          code: stmt.code
        });
      }
    }
    
    // Process successors
    for (const succId of block.successors) {
      if (!visited.has(succId)) {
        processBlock(succId, indent);
      }
    }
  }
  
  if (cfg.blocks.length > 0) {
    processBlock(0, 0);
  }
  
  return structured;
}

/**
 * Generate final C++ code
 */
function generateCppCode(funcName, analysis, structuredCode) {
  let code = `// Decompiled function: ${funcName}\n`;
  code += `// WARNING: This is machine-generated pseudocode\n\n`;
  code += `#include <cstdint>\n\n`;
  code += `${analysis.returnType} ${analysis.callingConvention} ${funcName}(`;
  code += analysis.params.map(p => `${p.type} ${p.name}`).join(', ');
  code += `) {\n`;
  
  // Declare local variables
  if (Object.keys(analysis.locals).length > 0) {
    for (const [localName, local] of Object.entries(analysis.locals)) {
      code += `    ${local.type} ${localName};\n`;
    }
    code += '\n';
  }
  
  // Add statements
  for (const stmt of structuredCode) {
    const indentStr = '    ' + '    '.repeat(stmt.indent);
    code += `${indentStr}${stmt.code}\n`;
  }
  
  // Add return if not present
  const hasReturn = structuredCode.some(stmt => 
    stmt.code && stmt.code.trim().startsWith('return')
  );
  if (!hasReturn) {
    code += '    \n    return 0;\n';
  }
  
  code += '}';
  
  return code;
}
