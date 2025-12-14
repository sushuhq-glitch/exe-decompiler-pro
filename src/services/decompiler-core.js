/**
 * Decompiler Core
 * Converts assembly instructions to C pseudocode
 */

import { analyzeFunctionPatterns } from './patterns.js';

/**
 * Decompile a function from assembly to C pseudocode
 * @param {Array} instructions - Disassembled instructions
 * @param {Object} peData - PE file data
 * @param {Object} functionInfo - Function metadata
 * @returns {Object} Decompiled function
 */
export function decompileFunction(instructions, peData, functionInfo = {}) {
  if (!instructions || instructions.length === 0) {
    return {
      name: functionInfo.name || 'unknown',
      signature: 'void unknown() { }',
      locals: [],
      params: [],
      code: '// No instructions to decompile'
    };
  }
  
  const funcName = functionInfo.name || `sub_${instructions[0].address.slice(2)}`;
  
  // Analyze function patterns
  const patterns = analyzeFunctionPatterns(instructions);
  
  // Build control flow graph
  const cfg = buildControlFlowGraph(instructions);
  
  // Analyze stack frame
  const stackFrame = analyzeStackFrame(instructions);
  
  // Track register usage
  const registerState = new RegisterTracker();
  
  // Convert instructions to intermediate representation
  const statements = [];
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    const statement = convertInstructionToStatement(inst, registerState, stackFrame, peData, cfg);
    
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
  
  // Generate function signature
  const signature = generateFunctionSignature(funcName, stackFrame);
  
  // Generate final C code
  const cCode = generateCCode(funcName, signature, stackFrame, structuredCode);
  
  return {
    name: funcName,
    signature,
    locals: stackFrame.locals,
    params: stackFrame.params,
    code: cCode,
    patterns,
    cfg
  };
}

/**
 * Build Control Flow Graph
 */
function buildControlFlowGraph(instructions) {
  const cfg = {
    nodes: [],
    edges: [],
    blocks: []
  };
  
  // Identify basic block leaders (first instruction, jump targets, instruction after jump)
  const leaders = new Set();
  leaders.add(instructions[0].addressNum);
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    
    // Jump/call targets are leaders
    if (inst.target && inst.type === 'control_flow') {
      leaders.add(inst.target);
      
      // Instruction after jump is also a leader (for conditional jumps)
      if (i + 1 < instructions.length && !inst.mnemonic.startsWith('jmp')) {
        leaders.add(instructions[i + 1].addressNum);
      }
    }
    
    // Instruction after return
    if ((inst.mnemonic === 'ret' || inst.mnemonic === 'retn') && i + 1 < instructions.length) {
      leaders.add(instructions[i + 1].addressNum);
    }
  }
  
  // Build basic blocks
  const leaderArray = Array.from(leaders).sort((a, b) => a - b);
  const addressToBlock = new Map();
  
  for (let i = 0; i < leaderArray.length; i++) {
    const startAddr = leaderArray[i];
    const endAddr = i + 1 < leaderArray.length ? leaderArray[i + 1] : instructions[instructions.length - 1].addressNum + 10;
    
    const blockInstructions = instructions.filter(inst =>
      inst.addressNum >= startAddr && inst.addressNum < endAddr
    );
    
    if (blockInstructions.length > 0) {
      const block = {
        id: cfg.blocks.length,
        startAddress: startAddr,
        endAddress: blockInstructions[blockInstructions.length - 1].addressNum,
        instructions: blockInstructions,
        successors: [],
        predecessors: []
      };
      
      cfg.blocks.push(block);
      addressToBlock.set(startAddr, block);
    }
  }
  
  // Build edges between blocks
  for (const block of cfg.blocks) {
    const lastInst = block.instructions[block.instructions.length - 1];
    
    if (lastInst.type === 'control_flow') {
      // Add edge to target
      if (lastInst.target) {
        const targetBlock = addressToBlock.get(lastInst.target);
        if (targetBlock) {
          block.successors.push(targetBlock.id);
          targetBlock.predecessors.push(block.id);
        }
      }
      
      // For conditional jumps, also add fall-through edge
      if (!lastInst.mnemonic.startsWith('jmp') && !lastInst.mnemonic.startsWith('ret')) {
        const nextBlock = cfg.blocks.find(b => b.startAddress > block.endAddress);
        if (nextBlock) {
          block.successors.push(nextBlock.id);
          nextBlock.predecessors.push(block.id);
        }
      }
    } else {
      // Fall-through to next block
      const nextBlock = cfg.blocks.find(b => b.startAddress > block.endAddress);
      if (nextBlock) {
        block.successors.push(nextBlock.id);
        nextBlock.predecessors.push(block.id);
      }
    }
  }
  
  return cfg;
}

/**
 * Analyze stack frame to identify local variables and parameters
 */
function analyzeStackFrame(instructions) {
  const stackFrame = {
    locals: [],
    params: [],
    stackSize: 0
  };
  
  // Look for stack allocation (sub esp/rsp, imm)
  for (const inst of instructions) {
    if ((inst.mnemonic === 'sub' && inst.operands.includes('esp')) ||
        (inst.mnemonic === 'sub' && inst.operands.includes('rsp'))) {
      const match = inst.operands.match(/0x([0-9a-fA-F]+)/);
      if (match) {
        stackFrame.stackSize = parseInt(match[1], 16);
        break;
      }
    }
  }
  
  // Identify local variable accesses
  const localOffsets = new Set();
  const paramOffsets = new Set();
  
  for (const inst of instructions) {
    const operands = inst.operands;
    
    // Look for [ebp-X] patterns (local variables)
    let match = operands.match(/\[ebp-0x([0-9a-fA-F]+)\]/);
    if (!match) {
      match = operands.match(/\[rbp-0x([0-9a-fA-F]+)\]/);
    }
    if (match) {
      const offset = parseInt(match[1], 16);
      localOffsets.add(offset);
    }
    
    // Look for [ebp+X] patterns (parameters, X >= 8)
    match = operands.match(/\[ebp\+0x([0-9a-fA-F]+)\]/);
    if (!match) {
      match = operands.match(/\[rbp\+0x([0-9a-fA-F]+)\]/);
    }
    if (match) {
      const offset = parseInt(match[1], 16);
      if (offset >= 8) {
        paramOffsets.add(offset);
      }
    }
  }
  
  // Create local variable entries
  const sortedLocals = Array.from(localOffsets).sort((a, b) => a - b);
  for (let i = 0; i < sortedLocals.length; i++) {
    stackFrame.locals.push({
      name: `local_${i + 1}`,
      offset: -sortedLocals[i],
      type: 'int', // Default type
      size: 4
    });
  }
  
  // Create parameter entries
  const sortedParams = Array.from(paramOffsets).sort((a, b) => a - b);
  for (let i = 0; i < sortedParams.length; i++) {
    stackFrame.params.push({
      name: `param_${i + 1}`,
      offset: sortedParams[i],
      type: 'int', // Default type
      size: 4
    });
  }
  
  return stackFrame;
}

/**
 * Register state tracker for data flow analysis
 */
class RegisterTracker {
  constructor() {
    this.registers = {};
    this.lastWrite = {};
  }
  
  write(reg, value, instruction) {
    this.registers[reg] = value;
    this.lastWrite[reg] = instruction;
  }
  
  read(reg) {
    return this.registers[reg] || null;
  }
  
  getLastWrite(reg) {
    return this.lastWrite[reg] || null;
  }
}

/**
 * Convert single instruction to statement
 */
function convertInstructionToStatement(inst, registerState, stackFrame, peData, cfg) {
  const mnemonic = inst.mnemonic;
  const operands = inst.operands;
  
  // Skip some instructions
  if (mnemonic === 'nop') {
    return null;
  }
  
  // Function prologue/epilogue
  if (mnemonic === 'push' && operands === 'ebp') {
    return null; // Part of prologue
  }
  if (mnemonic === 'push' && operands === 'rbp') {
    return null; // Part of prologue
  }
  if (mnemonic === 'mov' && (operands === 'ebp, esp' || operands === 'rbp, rsp')) {
    return null; // Part of prologue
  }
  if (mnemonic === 'pop' && (operands === 'ebp' || operands === 'rbp')) {
    return null; // Part of epilogue
  }
  if (mnemonic === 'leave' || mnemonic === 'ret' || mnemonic === 'retn') {
    return null; // Epilogue
  }
  
  // MOV instruction
  if (mnemonic === 'mov') {
    return convertMovInstruction(operands, registerState, stackFrame);
  }
  
  // LEA instruction
  if (mnemonic === 'lea') {
    return convertLeaInstruction(operands, registerState, stackFrame);
  }
  
  // Arithmetic operations
  if (['add', 'sub', 'imul', 'mul', 'div', 'idiv', 'inc', 'dec', 'neg'].includes(mnemonic)) {
    return convertArithmeticInstruction(mnemonic, operands, registerState, stackFrame);
  }
  
  // Logical operations
  if (['and', 'or', 'xor', 'not', 'shl', 'shr', 'sal', 'sar'].includes(mnemonic)) {
    return convertLogicalInstruction(mnemonic, operands, registerState, stackFrame);
  }
  
  // Comparison
  if (mnemonic === 'cmp' || mnemonic === 'test') {
    registerState.write('__cmp', operands, inst);
    return `// ${mnemonic} ${operands}`;
  }
  
  // Push/Pop
  if (mnemonic === 'push') {
    return `// push ${formatOperand(operands, stackFrame)}`;
  }
  if (mnemonic === 'pop') {
    return `${formatOperand(operands, stackFrame)} = stack_pop()`;
  }
  
  // Call instruction
  if (mnemonic === 'call') {
    return convertCallInstruction(operands, peData);
  }
  
  // Jump instructions - handled by control flow builder
  if (mnemonic.startsWith('j')) {
    return null;
  }
  
  // Default: comment with original instruction
  return `// ${mnemonic} ${operands}`;
}

/**
 * Convert MOV instruction
 */
function convertMovInstruction(operands, registerState, stackFrame) {
  const parts = operands.split(',').map(s => s.trim());
  if (parts.length !== 2) return `// mov ${operands}`;
  
  const dest = formatOperand(parts[0], stackFrame);
  const src = formatOperand(parts[1], stackFrame);
  
  // Track register state
  if (isRegister(parts[0])) {
    registerState.write(parts[0], src, null);
  }
  
  return `${dest} = ${src};`;
}

/**
 * Convert LEA instruction
 */
function convertLeaInstruction(operands, registerState, stackFrame) {
  const parts = operands.split(',').map(s => s.trim());
  if (parts.length !== 2) return `// lea ${operands}`;
  
  const dest = formatOperand(parts[0], stackFrame);
  const src = parts[1];
  
  // LEA calculates address
  if (src.startsWith('[') && src.endsWith(']')) {
    const addr = src.slice(1, -1);
    const addrFormatted = formatOperand(addr, stackFrame);
    return `${dest} = &(${addrFormatted});`;
  }
  
  return `${dest} = ${src};`;
}

/**
 * Convert arithmetic instruction
 */
function convertArithmeticInstruction(mnemonic, operands, registerState, stackFrame) {
  const parts = operands.split(',').map(s => s.trim());
  
  if (mnemonic === 'inc') {
    const dest = formatOperand(operands, stackFrame);
    return `${dest}++;`;
  }
  
  if (mnemonic === 'dec') {
    const dest = formatOperand(operands, stackFrame);
    return `${dest}--;`;
  }
  
  if (mnemonic === 'neg') {
    const dest = formatOperand(operands, stackFrame);
    return `${dest} = -${dest};`;
  }
  
  if (parts.length === 2) {
    const dest = formatOperand(parts[0], stackFrame);
    const src = formatOperand(parts[1], stackFrame);
    
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
 * Convert logical instruction
 */
function convertLogicalInstruction(mnemonic, operands, registerState, stackFrame) {
  const parts = operands.split(',').map(s => s.trim());
  
  if (mnemonic === 'not') {
    const dest = formatOperand(operands, stackFrame);
    return `${dest} = ~${dest};`;
  }
  
  if (parts.length === 2) {
    const dest = formatOperand(parts[0], stackFrame);
    const src = formatOperand(parts[1], stackFrame);
    
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
      // Special case: xor reg, reg => reg = 0
      if (mnemonic === 'xor' && parts[0] === parts[1]) {
        return `${dest} = 0;`;
      }
      
      return `${dest} = ${dest} ${op} ${src};`;
    }
  }
  
  return `// ${mnemonic} ${operands}`;
}

/**
 * Convert CALL instruction
 */
function convertCallInstruction(operands, peData) {
  // Try to resolve function name from imports
  let functionName = operands;
  
  // Check if it's an indirect call through IAT
  if (operands.startsWith('[') && operands.includes('0x')) {
    const match = operands.match(/0x([0-9a-fA-F]+)/);
    if (match && peData && peData.imports) {
      const addr = parseInt(match[1], 16);
      
      // Search for function in imports
      for (const dll of peData.imports) {
        for (const func of dll.functions) {
          // This is simplified - in reality we'd need to match IAT entries
          if (func.name && !func.isOrdinal) {
            functionName = func.name;
            break;
          }
        }
      }
    }
  }
  
  // Format as function call
  if (functionName.startsWith('[')) {
    return `(*${functionName})();`;
  } else if (functionName.startsWith('0x')) {
    return `sub_${functionName.slice(2)}();`;
  } else {
    return `${functionName}();`;
  }
}

/**
 * Build control flow structures (if, while, for)
 */
function buildControlFlowStructures(statements, cfg, instructions) {
  const structured = [];
  const visited = new Set();
  
  function processBlock(blockId, indent = 0) {
    if (visited.has(blockId)) return;
    visited.add(blockId);
    
    const block = cfg.blocks[blockId];
    if (!block) return;
    
    // Add statements from this block
    for (const inst of block.instructions) {
      const stmt = statements.find(s => s.address === inst.address);
      if (stmt && stmt.code) {
        structured.push({
          indent,
          code: stmt.code,
          address: stmt.address
        });
      }
    }
    
    // Check last instruction for control flow
    const lastInst = block.instructions[block.instructions.length - 1];
    
    if (lastInst && lastInst.mnemonic && lastInst.mnemonic.startsWith('j') && lastInst.mnemonic !== 'jmp') {
      // Conditional jump - create if statement
      const condition = getConditionFromJump(lastInst.mnemonic);
      
      structured.push({
        indent,
        code: `if (${condition}) {`,
        address: lastInst.address
      });
      
      // Target block (then branch)
      if (block.successors.length > 0) {
        const targetBlockId = block.successors[0];
        processBlock(targetBlockId, indent + 1);
      }
      
      structured.push({
        indent,
        code: '}',
        address: ''
      });
      
      // Fall-through block (else branch)
      if (block.successors.length > 1) {
        const fallThroughId = block.successors[1];
        processBlock(fallThroughId, indent);
      }
    } else if (lastInst && lastInst.mnemonic === 'jmp' && lastInst.target) {
      // Unconditional jump
      // Check if it's a loop (backward jump)
      if (lastInst.target < lastInst.addressNum) {
        structured.push({
          indent,
          code: '// Loop detected',
          address: lastInst.address
        });
      }
      
      // Process successors
      for (const succId of block.successors) {
        if (!visited.has(succId)) {
          processBlock(succId, indent);
        }
      }
    } else {
      // Fall through to next block
      for (const succId of block.successors) {
        if (!visited.has(succId)) {
          processBlock(succId, indent);
        }
      }
    }
  }
  
  // Start with first block
  if (cfg.blocks.length > 0) {
    processBlock(0, 0);
  }
  
  return structured;
}

/**
 * Get condition from conditional jump mnemonic
 */
function getConditionFromJump(mnemonic) {
  const conditions = {
    'je': 'equal',
    'jz': 'zero',
    'jne': '!equal',
    'jnz': '!zero',
    'jg': 'greater',
    'jge': 'greater_or_equal',
    'jl': 'less',
    'jle': 'less_or_equal',
    'ja': 'above',
    'jae': 'above_or_equal',
    'jb': 'below',
    'jbe': 'below_or_equal',
    'js': 'sign',
    'jns': '!sign',
    'jo': 'overflow',
    'jno': '!overflow'
  };
  
  return conditions[mnemonic] || 'condition';
}

/**
 * Generate function signature
 */
function generateFunctionSignature(funcName, stackFrame) {
  const returnType = 'int'; // Default return type
  const params = stackFrame.params.map(p => `${p.type} ${p.name}`).join(', ');
  
  const convention = '__cdecl'; // Default calling convention
  
  if (params.length > 0) {
    return `${returnType} ${convention} ${funcName}(${params})`;
  } else {
    return `${returnType} ${convention} ${funcName}()`;
  }
}

/**
 * Generate final C code
 */
function generateCCode(funcName, signature, stackFrame, structuredCode) {
  let code = `// Decompiled function: ${funcName}\n`;
  code += `// WARNING: This is machine-generated pseudocode and may not be completely accurate\n\n`;
  code += `${signature} {\n`;
  
  // Declare local variables
  if (stackFrame.locals.length > 0) {
    for (const local of stackFrame.locals) {
      code += `    ${local.type} ${local.name};\n`;
    }
    code += '\n';
  }
  
  // Add statements
  for (const stmt of structuredCode) {
    const indentStr = '    ' + '    '.repeat(stmt.indent);
    code += `${indentStr}${stmt.code}\n`;
  }
  
  // Add return if not present in the structured code
  const hasReturn = structuredCode.some(stmt => 
    stmt.code && typeof stmt.code === 'string' && /^\s*return\s/.test(stmt.code)
  );
  if (!hasReturn) {
    code += '    \n    return 0;\n';
  }
  
  code += '}';
  
  return code;
}

/**
 * Format operand for C code
 */
function formatOperand(operand, stackFrame) {
  operand = operand.trim();
  
  // Check for local variable
  let match = operand.match(/\[(?:ebp|rbp)-0x([0-9a-fA-F]+)\]/);
  if (match) {
    const offset = parseInt(match[1], 16);
    const local = stackFrame.locals.find(l => l.offset === -offset);
    return local ? local.name : `local_${offset}`;
  }
  
  // Check for parameter
  match = operand.match(/\[(?:ebp|rbp)\+0x([0-9a-fA-F]+)\]/);
  if (match) {
    const offset = parseInt(match[1], 16);
    const param = stackFrame.params.find(p => p.offset === offset);
    return param ? param.name : `param_${offset}`;
  }
  
  // Memory dereference
  if (operand.startsWith('[') && operand.endsWith(']')) {
    const inner = operand.slice(1, -1);
    return `*((int*)${formatOperand(inner, stackFrame)})`;
  }
  
  // Immediate value
  if (operand.startsWith('0x')) {
    return operand;
  }
  
  // Register
  if (isRegister(operand)) {
    // Map register to temp variable
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
 * Decompile multiple functions
 */
export function decompileFunctions(functionsData, peData) {
  const results = [];
  
  for (const func of functionsData) {
    const decompiled = decompileFunction(func.instructions, peData, func);
    results.push(decompiled);
  }
  
  return results;
}
