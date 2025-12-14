/**
 * Golang Decompiler Module
 * Converts x86/x64 assembly to Go pseudocode
 */

/**
 * Decompile function to Golang
 */
export function decompileToGolang(instructions, peData, functionInfo = {}) {
  if (!instructions || instructions.length === 0) {
    return {
      name: functionInfo.name || 'unknown',
      code: '// No instructions to decompile'
    };
  }

  const funcName = sanitizeGoName(functionInfo.name || `Sub${instructions[0].address?.slice(2) || '0'}`);
  
  // Analyze function
  const analysis = analyzeFunction(instructions);
  
  // Build control flow graph
  const cfg = buildControlFlowGraph(instructions);
  
  // Track register state
  const registerState = new RegisterTracker();
  
  // Convert instructions to Go statements
  const statements = [];
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    const statement = convertInstructionToGo(inst, registerState, analysis, peData);
    
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
  
  // Generate final Go code
  const goCode = generateGoCode(funcName, analysis, structuredCode);
  
  return {
    name: funcName,
    code: goCode,
    analysis
  };
}

/**
 * Sanitize function name for Go
 */
function sanitizeGoName(name) {
  // Capitalize first letter for exported functions
  let goName = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (goName.length > 0) {
    goName = goName.charAt(0).toUpperCase() + goName.slice(1);
  }
  return goName;
}

/**
 * Analyze function characteristics
 */
function analyzeFunction(instructions) {
  const analysis = {
    params: [],
    locals: {},
    returnType: 'int32',
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
    analysis.locals[`local${i + 1}`] = {
      offset: -sortedLocals[i],
      type: 'int32'
    };
  }
  
  // Create parameters
  const sortedParams = Array.from(paramOffsets).sort((a, b) => a - b);
  for (let i = 0; i < sortedParams.length; i++) {
    analysis.params.push({
      name: `param${i + 1}`,
      offset: sortedParams[i],
      type: 'int32'
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
 * Convert instruction to Go statement
 */
function convertInstructionToGo(inst, registerState, analysis, peData) {
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
    return convertMovToGo(operands, registerState, analysis);
  }
  
  // LEA instruction
  if (mnemonic === 'lea') {
    return convertLeaToGo(operands, registerState, analysis);
  }
  
  // Arithmetic operations
  if (['add', 'sub', 'imul', 'mul', 'div', 'idiv', 'inc', 'dec', 'neg'].includes(mnemonic)) {
    return convertArithmeticToGo(mnemonic, operands, registerState, analysis);
  }
  
  // Logical operations
  if (['and', 'or', 'xor', 'not', 'shl', 'shr', 'sal', 'sar'].includes(mnemonic)) {
    return convertLogicalToGo(mnemonic, operands, registerState, analysis);
  }
  
  // Comparison
  if (mnemonic === 'cmp' || mnemonic === 'test') {
    registerState.write('__cmp', operands);
    return `// ${mnemonic} ${operands}`;
  }
  
  // Push/Pop
  if (mnemonic === 'push') {
    return `// push ${formatOperandGo(operands, analysis)}`;
  }
  if (mnemonic === 'pop') {
    return `${formatOperandGo(operands, analysis)} = stackPop()`;
  }
  
  // Call instruction
  if (mnemonic === 'call') {
    return convertCallToGo(operands, peData);
  }
  
  // Jump instructions - handled by control flow builder
  if (mnemonic.startsWith('j')) {
    return null;
  }
  
  // Default: comment
  return `// ${mnemonic} ${operands}`;
}

/**
 * Convert MOV to Go
 */
function convertMovToGo(operands, registerState, analysis) {
  const parts = operands.split(',').map(s => s.trim());
  if (parts.length !== 2) return `// mov ${operands}`;
  
  const dest = formatOperandGo(parts[0], analysis);
  const src = formatOperandGo(parts[1], analysis);
  
  if (isRegister(parts[0])) {
    registerState.write(parts[0], src);
  }
  
  return `${dest} = ${src}`;
}

/**
 * Convert LEA to Go
 */
function convertLeaToGo(operands, registerState, analysis) {
  const parts = operands.split(',').map(s => s.trim());
  if (parts.length !== 2) return `// lea ${operands}`;
  
  const dest = formatOperandGo(parts[0], analysis);
  const src = parts[1];
  
  if (src.startsWith('[') && src.endsWith(']')) {
    const addr = src.slice(1, -1);
    return `${dest} = unsafe.Pointer(&${formatOperandGo(addr, analysis)})`;
  }
  
  return `${dest} = ${src}`;
}

/**
 * Convert arithmetic instruction to Go
 */
function convertArithmeticToGo(mnemonic, operands, registerState, analysis) {
  const parts = operands.split(',').map(s => s.trim());
  
  if (mnemonic === 'inc') {
    const dest = formatOperandGo(operands, analysis);
    return `${dest}++`;
  }
  
  if (mnemonic === 'dec') {
    const dest = formatOperandGo(operands, analysis);
    return `${dest}--`;
  }
  
  if (mnemonic === 'neg') {
    const dest = formatOperandGo(operands, analysis);
    return `${dest} = -${dest}`;
  }
  
  if (parts.length === 2) {
    const dest = formatOperandGo(parts[0], analysis);
    const src = formatOperandGo(parts[1], analysis);
    
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
  
  return `// ${mnemonic} ${operands}`;
}

/**
 * Convert logical instruction to Go
 */
function convertLogicalToGo(mnemonic, operands, registerState, analysis) {
  const parts = operands.split(',').map(s => s.trim());
  
  if (mnemonic === 'not') {
    const dest = formatOperandGo(operands, analysis);
    return `${dest} = ^${dest}`;
  }
  
  if (parts.length === 2) {
    const dest = formatOperandGo(parts[0], analysis);
    const src = formatOperandGo(parts[1], analysis);
    
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
  
  return `// ${mnemonic} ${operands}`;
}

/**
 * Convert CALL to Go
 */
function convertCallToGo(operands, peData) {
  let functionName = operands;
  
  // Try to resolve function name
  if (operands.startsWith('[') && operands.includes('0x')) {
    const match = operands.match(/0x([0-9a-fA-F]+)/);
    if (match && peData && peData.imports) {
      for (const dll of peData.imports) {
        for (const func of dll.functions) {
          if (func.name && !func.isOrdinal) {
            functionName = sanitizeGoName(func.name);
            break;
          }
        }
      }
    }
  }
  
  if (functionName.startsWith('[')) {
    return `callFunction(${functionName})`;
  } else if (functionName.startsWith('0x')) {
    return `Sub${functionName.slice(2)}()`;
  } else {
    return `${sanitizeGoName(functionName)}()`;
  }
}

/**
 * Format operand for Go
 */
function formatOperandGo(operand, analysis) {
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
    return `local${offset}`;
  }
  
  // Check for parameter
  match = operand.match(/\[(?:ebp|rbp)\+0x([0-9a-fA-F]+)\]/);
  if (match) {
    const offset = parseInt(match[1], 16);
    const param = analysis.params.find(p => p.offset === offset);
    return param ? param.name : `param${offset}`;
  }
  
  // Memory dereference
  if (operand.startsWith('[') && operand.endsWith(']')) {
    const inner = operand.slice(1, -1);
    return `*(*int32)(unsafe.Pointer(${formatOperandGo(inner, analysis)}))`;
  }
  
  // Immediate value
  if (operand.startsWith('0x')) {
    return operand;
  }
  
  // Register
  if (isRegister(operand)) {
    return `reg${operand.toUpperCase()}`;
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
 * Generate final Go code
 */
function generateGoCode(funcName, analysis, structuredCode) {
  let code = `// Decompiled function: ${funcName}\n`;
  code += `// WARNING: This is machine-generated pseudocode\n\n`;
  code += `package main\n\n`;
  code += `import "unsafe"\n\n`;
  code += `func ${funcName}(`;
  code += analysis.params.map(p => `${p.name} ${p.type}`).join(', ');
  code += `) ${analysis.returnType} {\n`;
  
  // Declare local variables
  if (Object.keys(analysis.locals).length > 0) {
    for (const [localName, local] of Object.entries(analysis.locals)) {
      code += `\tvar ${localName} ${local.type}\n`;
    }
    code += '\n';
  }
  
  // Add statements
  if (structuredCode.length > 0) {
    for (const stmt of structuredCode) {
      const indentStr = '\t' + '\t'.repeat(stmt.indent);
      code += `${indentStr}${stmt.code}\n`;
    }
  }
  
  // Add return if not present
  const hasReturn = structuredCode.some(stmt => 
    stmt.code && stmt.code.trim().startsWith('return')
  );
  if (!hasReturn) {
    code += '\t\n\treturn 0\n';
  }
  
  code += '}';
  
  return code;
}
