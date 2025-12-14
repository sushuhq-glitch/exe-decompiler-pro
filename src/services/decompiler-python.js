/**
 * Python Decompiler Module
 * Converts x86/x64 assembly to Python pseudocode
 */

/**
 * Decompile function to Python
 */
export function decompileToPython(instructions, peData, functionInfo = {}) {
  if (!instructions || instructions.length === 0) {
    return {
      name: functionInfo.name || 'unknown',
      code: '# No instructions to decompile'
    };
  }

  const funcName = sanitizePythonName(functionInfo.name || `sub_${instructions[0].address?.slice(2) || '0'}`);
  
  // Analyze function
  const analysis = analyzeFunction(instructions);
  
  // Build control flow graph
  const cfg = buildControlFlowGraph(instructions);
  
  // Track register state
  const registerState = new RegisterTracker();
  
  // Convert instructions to Python statements
  const statements = [];
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    const statement = convertInstructionToPython(inst, registerState, analysis, peData);
    
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
  
  // Generate final Python code
  const pythonCode = generatePythonCode(funcName, analysis, structuredCode);
  
  return {
    name: funcName,
    code: pythonCode,
    analysis
  };
}

/**
 * Sanitize function name for Python
 */
function sanitizePythonName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

/**
 * Analyze function characteristics
 */
function analyzeFunction(instructions) {
  const analysis = {
    params: [],
    locals: {},
    usesStack: false,
    callsCount: 0,
    jumpsCount: 0,
    complexity: 'simple'
  };
  
  const localOffsets = new Set();
  const paramOffsets = new Set();
  
  for (const inst of instructions) {
    const operands = inst.operands || '';
    
    // Check for stack frame setup
    if (inst.mnemonic === 'push' && (operands === 'ebp' || operands === 'rbp')) {
      analysis.usesStack = true;
    }
    
    // Track local variables [ebp-X] or [rbp-X]
    let match = operands.match(/\[(?:ebp|rbp)-0x([0-9a-fA-F]+)\]/);
    if (match) {
      const offset = parseInt(match[1], 16);
      localOffsets.add(offset);
    }
    
    // Track parameters [ebp+X] or [rbp+X]
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
 * Convert instruction to Python statement
 */
function convertInstructionToPython(inst, registerState, analysis, peData) {
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
    return convertMovToPython(operands, registerState, analysis);
  }
  
  // LEA instruction
  if (mnemonic === 'lea') {
    return convertLeaToPython(operands, registerState, analysis);
  }
  
  // Arithmetic operations
  if (['add', 'sub', 'imul', 'mul', 'div', 'idiv', 'inc', 'dec', 'neg'].includes(mnemonic)) {
    return convertArithmeticToPython(mnemonic, operands, registerState, analysis);
  }
  
  // Logical operations
  if (['and', 'or', 'xor', 'not', 'shl', 'shr', 'sal', 'sar'].includes(mnemonic)) {
    return convertLogicalToPython(mnemonic, operands, registerState, analysis);
  }
  
  // Comparison
  if (mnemonic === 'cmp' || mnemonic === 'test') {
    registerState.write('__cmp', operands);
    return `# ${mnemonic} ${operands}`;
  }
  
  // Push/Pop
  if (mnemonic === 'push') {
    return `# push ${formatOperandPython(operands, analysis)}`;
  }
  if (mnemonic === 'pop') {
    return `${formatOperandPython(operands, analysis)} = stack_pop()`;
  }
  
  // Call instruction
  if (mnemonic === 'call') {
    return convertCallToPython(operands, peData);
  }
  
  // Jump instructions - handled by control flow builder
  if (mnemonic.startsWith('j')) {
    return null;
  }
  
  // Default: comment
  return `# ${mnemonic} ${operands}`;
}

/**
 * Convert MOV to Python
 */
function convertMovToPython(operands, registerState, analysis) {
  const parts = operands.split(',').map(s => s.trim());
  if (parts.length !== 2) return `# mov ${operands}`;
  
  const dest = formatOperandPython(parts[0], analysis);
  const src = formatOperandPython(parts[1], analysis);
  
  if (isRegister(parts[0])) {
    registerState.write(parts[0], src);
  }
  
  return `${dest} = ${src}`;
}

/**
 * Convert LEA to Python
 */
function convertLeaToPython(operands, registerState, analysis) {
  const parts = operands.split(',').map(s => s.trim());
  if (parts.length !== 2) return `# lea ${operands}`;
  
  const dest = formatOperandPython(parts[0], analysis);
  const src = parts[1];
  
  if (src.startsWith('[') && src.endsWith(']')) {
    const addr = src.slice(1, -1);
    return `${dest} = ctypes.addressof(${formatOperandPython(addr, analysis)})`;
  }
  
  return `${dest} = ${src}`;
}

/**
 * Convert arithmetic instruction to Python
 */
function convertArithmeticToPython(mnemonic, operands, registerState, analysis) {
  const parts = operands.split(',').map(s => s.trim());
  
  if (mnemonic === 'inc') {
    const dest = formatOperandPython(operands, analysis);
    return `${dest} += 1`;
  }
  
  if (mnemonic === 'dec') {
    const dest = formatOperandPython(operands, analysis);
    return `${dest} -= 1`;
  }
  
  if (mnemonic === 'neg') {
    const dest = formatOperandPython(operands, analysis);
    return `${dest} = -${dest}`;
  }
  
  if (parts.length === 2) {
    const dest = formatOperandPython(parts[0], analysis);
    const src = formatOperandPython(parts[1], analysis);
    
    const operators = {
      'add': '+=',
      'sub': '-=',
      'imul': '*=',
      'mul': '*='
    };
    
    const op = operators[mnemonic];
    if (op) {
      return `${dest} ${op} ${src}`;
    }
  }
  
  return `# ${mnemonic} ${operands}`;
}

/**
 * Convert logical instruction to Python
 */
function convertLogicalToPython(mnemonic, operands, registerState, analysis) {
  const parts = operands.split(',').map(s => s.trim());
  
  if (mnemonic === 'not') {
    const dest = formatOperandPython(operands, analysis);
    return `${dest} = ~${dest}`;
  }
  
  if (parts.length === 2) {
    const dest = formatOperandPython(parts[0], analysis);
    const src = formatOperandPython(parts[1], analysis);
    
    // XOR reg, reg => reg = 0
    if (mnemonic === 'xor' && parts[0] === parts[1]) {
      return `${dest} = 0`;
    }
    
    const operators = {
      'and': '&=',
      'or': '|=',
      'xor': '^=',
      'shl': '<<=',
      'shr': '>>=',
      'sal': '<<=',
      'sar': '>>='
    };
    
    const op = operators[mnemonic];
    if (op) {
      return `${dest} ${op} ${src}`;
    }
  }
  
  return `# ${mnemonic} ${operands}`;
}

/**
 * Convert CALL to Python
 */
function convertCallToPython(operands, peData) {
  let functionName = operands;
  
  // Try to resolve function name
  if (operands.startsWith('[') && operands.includes('0x')) {
    const match = operands.match(/0x([0-9a-fA-F]+)/);
    if (match && peData && peData.imports) {
      for (const dll of peData.imports) {
        for (const func of dll.functions) {
          if (func.name && !func.isOrdinal) {
            functionName = sanitizePythonName(func.name);
            break;
          }
        }
      }
    }
  }
  
  if (functionName.startsWith('[')) {
    return `call_function(${functionName})`;
  } else if (functionName.startsWith('0x')) {
    return `sub_${functionName.slice(2)}()`;
  } else {
    return `${sanitizePythonName(functionName)}()`;
  }
}

/**
 * Format operand for Python
 */
function formatOperandPython(operand, analysis) {
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
    return `ctypes.cast(${formatOperandPython(inner, analysis)}, ctypes.POINTER(ctypes.c_int)).contents.value`;
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
 * Generate final Python code
 */
function generatePythonCode(funcName, analysis, structuredCode) {
  let code = `# Decompiled function: ${funcName}\n`;
  code += `# WARNING: This is machine-generated pseudocode\n\n`;
  code += `import ctypes\n\n`;
  code += `def ${funcName}(`;
  code += analysis.params.map(p => p.name).join(', ');
  code += `):\n`;
  
  // Declare local variables
  if (Object.keys(analysis.locals).length > 0) {
    for (const localName of Object.keys(analysis.locals)) {
      code += `    ${localName} = 0\n`;
    }
    code += '\n';
  }
  
  // Add statements
  if (structuredCode.length === 0) {
    code += '    pass\n';
  } else {
    for (const stmt of structuredCode) {
      const indentStr = '    ' + '    '.repeat(stmt.indent);
      code += `${indentStr}${stmt.code}\n`;
    }
  }
  
  // Add return if not present
  const hasReturn = structuredCode.some(stmt => 
    stmt.code && stmt.code.trim().startsWith('return')
  );
  if (!hasReturn) {
    code += '    \n    return 0\n';
  }
  
  return code;
}
