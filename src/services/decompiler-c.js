/**
 * C Language Decompiler
 * Converts x86/x64 assembly to C pseudocode
 * 
 * Features:
 * - Full C syntax generation
 * - Type inference from operations
 * - Control flow reconstruction
 * - Function calling conventions
 * - Struct and union detection
 * - Pointer arithmetic
 * - Array indexing
 * - Bitwise operations
 * - Windows API integration
 */

// C data types
const C_TYPES = {
  VOID: 'void',
  CHAR: 'char',
  SHORT: 'short',
  INT: 'int',
  LONG: 'long',
  FLOAT: 'float',
  DOUBLE: 'double',
  POINTER: '*',
  UNSIGNED: 'unsigned',
  SIGNED: 'signed',
  CONST: 'const',
  VOLATILE: 'volatile',
  STRUCT: 'struct',
  UNION: 'union',
  ENUM: 'enum'
};

// Register to variable mapping
const REGISTER_VARS = {
  'eax': 'result',
  'ebx': 'base',
  'ecx': 'counter',
  'edx': 'data',
  'esi': 'source',
  'edi': 'dest',
  'esp': 'stack_ptr',
  'ebp': 'frame_ptr',
  'rax': 'result',
  'rbx': 'base',
  'rcx': 'counter',
  'rdx': 'data',
  'rsi': 'source',
  'rdi': 'dest',
  'rsp': 'stack_ptr',
  'rbp': 'frame_ptr'
};

/**
 * Decompile to C language
 */
export function decompileToC(instructions, peData, functionInfo = {}) {
  const context = createContext(instructions, peData, functionInfo);
  
  // Analyze function prologue and epilogue
  analyzeFunctionFrame(context);
  
  // Build control flow graph
  buildControlFlow(context);
  
  // Infer types from operations
  inferTypes(context);
  
  // Convert instructions to C statements
  const statements = convertToStatements(context);
  
  // Reconstruct control flow structures
  const structured = structureControlFlow(statements, context);
  
  // Generate final C code
  const code = generateCCode(structured, context);
  
  return code;
}

/**
 * Create decompilation context
 */
function createContext(instructions, peData, functionInfo) {
  return {
    instructions,
    peData,
    functionInfo,
    variables: new Map(),
    types: new Map(),
    labels: new Map(),
    blocks: [],
    localVars: [],
    parameters: [],
    stackFrame: {
      frameSize: 0,
      savedRegisters: [],
      localSpace: 0
    },
    callingConvention: 'cdecl',
    hasReturn: false,
    returnType: C_TYPES.VOID
  };
}

/**
 * Analyze function prologue and epilogue
 */
function analyzeFunctionFrame(context) {
  const insts = context.instructions;
  
  // Check for standard prologue patterns
  if (insts.length > 0) {
    const first = insts[0];
    
    // push ebp; mov ebp, esp
    if (first.mnemonic === 'push' && first.operands.includes('ebp')) {
      context.stackFrame.savedRegisters.push('ebp');
      
      if (insts.length > 1 && insts[1].mnemonic === 'mov') {
        const mov = insts[1];
        if (mov.operands.includes('ebp') && mov.operands.includes('esp')) {
          context.callingConvention = 'stdcall';
        }
      }
    }
    
    // Look for sub esp, imm (stack allocation)
    for (let i = 0; i < Math.min(5, insts.length); i++) {
      const inst = insts[i];
      if (inst.mnemonic === 'sub' && inst.operands.includes('esp')) {
        // Extract immediate value
        const match = inst.operands.match(/0x([0-9A-Fa-f]+)/);
        if (match) {
          context.stackFrame.localSpace = parseInt(match[1], 16);
        }
      }
    }
  }
  
  // Analyze epilogue
  for (let i = Math.max(0, insts.length - 5); i < insts.length; i++) {
    const inst = insts[i];
    
    if (inst.mnemonic === 'ret') {
      context.hasReturn = true;
    }
    
    // Check for return value in eax/rax
    if (inst.mnemonic === 'mov' && inst.operands.includes('eax')) {
      context.returnType = C_TYPES.INT;
    }
  }
}

/**
 * Build control flow graph
 */
function buildControlFlow(context) {
  const blocks = [];
  let currentBlock = null;
  
  for (let i = 0; i < context.instructions.length; i++) {
    const inst = context.instructions[i];
    
    // Start new block at labels or after jumps
    if (!currentBlock || isBlockTerminator(context.instructions[i - 1])) {
      currentBlock = {
        id: blocks.length,
        start: i,
        end: i,
        instructions: [],
        successors: [],
        predecessors: []
      };
      blocks.push(currentBlock);
    }
    
    currentBlock.instructions.push(inst);
    currentBlock.end = i;
    
    // Handle control flow instructions
    if (isJump(inst)) {
      const target = extractJumpTarget(inst);
      if (target) {
        // Find target block
        const targetIndex = findInstructionByAddress(context.instructions, target);
        if (targetIndex >= 0) {
          currentBlock.successors.push(targetIndex);
        }
      }
      
      // Conditional jumps also have fall-through
      if (isConditionalJump(inst)) {
        currentBlock.successors.push(i + 1);
      }
    } else if (!isReturn(inst)) {
      // Normal fall-through
      if (i + 1 < context.instructions.length) {
        currentBlock.successors.push(i + 1);
      }
    }
  }
  
  context.blocks = blocks;
}

/**
 * Infer types from operations
 */
function inferTypes(context) {
  for (const inst of context.instructions) {
    // Integer operations
    if (['add', 'sub', 'mul', 'div', 'imul', 'idiv'].includes(inst.mnemonic)) {
      markAsInteger(context, inst.operands);
    }
    
    // Floating point operations
    if (['fadd', 'fsub', 'fmul', 'fdiv', 'fld', 'fst'].includes(inst.mnemonic)) {
      markAsFloat(context, inst.operands);
    }
    
    // Pointer operations
    if (inst.mnemonic === 'lea') {
      markAsPointer(context, inst.operands);
    }
    
    // Memory access
    if (inst.operands && inst.operands.includes('[')) {
      inferMemoryType(context, inst);
    }
  }
}

/**
 * Mark operands as integer type
 */
function markAsInteger(context, operands) {
  const regs = extractRegisters(operands);
  for (const reg of regs) {
    if (!context.types.has(reg)) {
      context.types.set(reg, C_TYPES.INT);
    }
  }
}

/**
 * Mark operands as float type
 */
function markAsFloat(context, operands) {
  const regs = extractRegisters(operands);
  for (const reg of regs) {
    context.types.set(reg, C_TYPES.FLOAT);
  }
}

/**
 * Mark operands as pointer type
 */
function markAsPointer(context, operands) {
  const regs = extractRegisters(operands);
  for (const reg of regs) {
    context.types.set(reg, C_TYPES.POINTER);
  }
}

/**
 * Infer type from memory access
 */
function inferMemoryType(context, inst) {
  // Analyze operand size
  const operand = inst.operands;
  
  if (operand.includes('byte ptr')) {
    // 8-bit access
    markAccessSize(context, inst, 1);
  } else if (operand.includes('word ptr')) {
    // 16-bit access
    markAccessSize(context, inst, 2);
  } else if (operand.includes('dword ptr')) {
    // 32-bit access
    markAccessSize(context, inst, 4);
  } else if (operand.includes('qword ptr')) {
    // 64-bit access
    markAccessSize(context, inst, 8);
  }
}

/**
 * Mark memory access size
 */
function markAccessSize(context, inst, size) {
  const regs = extractRegisters(inst.operands);
  for (const reg of regs) {
    if (!context.types.has(reg)) {
      switch (size) {
        case 1: context.types.set(reg, C_TYPES.CHAR); break;
        case 2: context.types.set(reg, C_TYPES.SHORT); break;
        case 4: context.types.set(reg, C_TYPES.INT); break;
        case 8: context.types.set(reg, C_TYPES.LONG); break;
      }
    }
  }
}

/**
 * Convert instructions to C statements
 */
function convertToStatements(context) {
  const statements = [];
  
  for (const inst of context.instructions) {
    const statement = instructionToC(inst, context);
    if (statement) {
      statements.push({
        address: inst.address,
        code: statement,
        instruction: inst
      });
    }
  }
  
  return statements;
}

/**
 * Convert single instruction to C statement
 */
function instructionToC(inst, context) {
  const mnemonic = inst.mnemonic.toLowerCase();
  
  switch (mnemonic) {
    case 'mov':
      return convertMov(inst, context);
    case 'add':
      return convertAdd(inst, context);
    case 'sub':
      return convertSub(inst, context);
    case 'mul':
    case 'imul':
      return convertMul(inst, context);
    case 'div':
    case 'idiv':
      return convertDiv(inst, context);
    case 'and':
      return convertAnd(inst, context);
    case 'or':
      return convertOr(inst, context);
    case 'xor':
      return convertXor(inst, context);
    case 'not':
      return convertNot(inst, context);
    case 'neg':
      return convertNeg(inst, context);
    case 'inc':
      return convertInc(inst, context);
    case 'dec':
      return convertDec(inst, context);
    case 'shl':
    case 'sal':
      return convertShl(inst, context);
    case 'shr':
    case 'sar':
      return convertShr(inst, context);
    case 'lea':
      return convertLea(inst, context);
    case 'push':
      return convertPush(inst, context);
    case 'pop':
      return convertPop(inst, context);
    case 'call':
      return convertCall(inst, context);
    case 'ret':
      return convertRet(inst, context);
    case 'jmp':
      return null; // Handled by control flow
    case 'je':
    case 'jz':
    case 'jne':
    case 'jnz':
    case 'jg':
    case 'jge':
    case 'jl':
    case 'jle':
      return null; // Handled by control flow
    case 'cmp':
    case 'test':
      return null; // Used for conditional jumps
    case 'nop':
      return null;
    default:
      return `// ${inst.mnemonic} ${inst.operands}`;
  }
}

/**
 * Convert MOV instruction
 */
function convertMov(inst, context) {
  const parts = splitOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToC(parts[0], context);
  const src = operandToC(parts[1], context);
  
  return `${dest} = ${src};`;
}

/**
 * Convert ADD instruction
 */
function convertAdd(inst, context) {
  const parts = splitOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToC(parts[0], context);
  const src = operandToC(parts[1], context);
  
  return `${dest} += ${src};`;
}

/**
 * Convert SUB instruction
 */
function convertSub(inst, context) {
  const parts = splitOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToC(parts[0], context);
  const src = operandToC(parts[1], context);
  
  return `${dest} -= ${src};`;
}

/**
 * Convert MUL/IMUL instruction
 */
function convertMul(inst, context) {
  const parts = splitOperands(inst.operands);
  
  if (parts.length === 1) {
    // Single operand: eax = eax * operand
    const src = operandToC(parts[0], context);
    return `result *= ${src};`;
  } else if (parts.length === 2) {
    const dest = operandToC(parts[0], context);
    const src = operandToC(parts[1], context);
    return `${dest} *= ${src};`;
  } else if (parts.length === 3) {
    const dest = operandToC(parts[0], context);
    const src1 = operandToC(parts[1], context);
    const src2 = operandToC(parts[2], context);
    return `${dest} = ${src1} * ${src2};`;
  }
  
  return null;
}

/**
 * Convert DIV/IDIV instruction
 */
function convertDiv(inst, context) {
  const parts = splitOperands(inst.operands);
  if (parts.length !== 1) return null;
  
  const src = operandToC(parts[0], context);
  return `result /= ${src};`;
}

/**
 * Convert AND instruction
 */
function convertAnd(inst, context) {
  const parts = splitOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToC(parts[0], context);
  const src = operandToC(parts[1], context);
  
  return `${dest} &= ${src};`;
}

/**
 * Convert OR instruction
 */
function convertOr(inst, context) {
  const parts = splitOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToC(parts[0], context);
  const src = operandToC(parts[1], context);
  
  return `${dest} |= ${src};`;
}

/**
 * Convert XOR instruction
 */
function convertXor(inst, context) {
  const parts = splitOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToC(parts[0], context);
  const src = operandToC(parts[1], context);
  
  // Special case: xor reg, reg = zeroing
  if (parts[0] === parts[1]) {
    return `${dest} = 0;`;
  }
  
  return `${dest} ^= ${src};`;
}

/**
 * Convert NOT instruction
 */
function convertNot(inst, context) {
  const operand = operandToC(inst.operands, context);
  return `${operand} = ~${operand};`;
}

/**
 * Convert NEG instruction
 */
function convertNeg(inst, context) {
  const operand = operandToC(inst.operands, context);
  return `${operand} = -${operand};`;
}

/**
 * Convert INC instruction
 */
function convertInc(inst, context) {
  const operand = operandToC(inst.operands, context);
  return `${operand}++;`;
}

/**
 * Convert DEC instruction
 */
function convertDec(inst, context) {
  const operand = operandToC(inst.operands, context);
  return `${operand}--;`;
}

/**
 * Convert SHL/SAL instruction
 */
function convertShl(inst, context) {
  const parts = splitOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToC(parts[0], context);
  const src = operandToC(parts[1], context);
  
  return `${dest} <<= ${src};`;
}

/**
 * Convert SHR/SAR instruction
 */
function convertShr(inst, context) {
  const parts = splitOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToC(parts[0], context);
  const src = operandToC(parts[1], context);
  
  return `${dest} >>= ${src};`;
}

/**
 * Convert LEA instruction
 */
function convertLea(inst, context) {
  const parts = splitOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToC(parts[0], context);
  const src = parts[1];
  
  // Extract address expression
  const addr = src.replace(/[\[\]]/g, '').trim();
  return `${dest} = &(${addr});`;
}

/**
 * Convert PUSH instruction
 */
function convertPush(inst, context) {
  const operand = operandToC(inst.operands, context);
  return `// push ${operand}`;
}

/**
 * Convert POP instruction
 */
function convertPop(inst, context) {
  const operand = operandToC(inst.operands, context);
  return `// pop ${operand}`;
}

/**
 * Convert CALL instruction
 */
function convertCall(inst, context) {
  const target = inst.operands;
  
  // Check if it's a known API function
  const apiFunc = findApiFunction(target, context);
  if (apiFunc) {
    return `${apiFunc}();`;
  }
  
  // Check if it's a local function
  if (target.match(/^(sub_|func_)/)) {
    return `${target}();`;
  }
  
  return `call_function(${target});`;
}

/**
 * Convert RET instruction
 */
function convertRet(inst, context) {
  if (context.returnType !== C_TYPES.VOID) {
    return 'return result;';
  }
  return 'return;';
}

/**
 * Convert operand to C expression
 */
function operandToC(operand, context) {
  if (!operand) return '';
  
  operand = operand.trim();
  
  // Register
  if (isRegister(operand)) {
    return registerToVar(operand);
  }
  
  // Immediate value
  if (operand.match(/^0x[0-9A-Fa-f]+$/) || operand.match(/^-?\d+$/)) {
    return operand;
  }
  
  // Memory reference [...]
  if (operand.startsWith('[') && operand.endsWith(']')) {
    return convertMemoryReference(operand, context);
  }
  
  // Label or symbol
  return operand;
}

/**
 * Convert memory reference to C pointer dereference
 */
function convertMemoryReference(operand, context) {
  // Remove brackets and size specifiers
  let expr = operand.replace(/[\[\]]/g, '');
  expr = expr.replace(/byte ptr |word ptr |dword ptr |qword ptr /g, '');
  expr = expr.trim();
  
  // Convert registers
  for (const [reg, varName] of Object.entries(REGISTER_VARS)) {
    expr = expr.replace(new RegExp(`\\b${reg}\\b`, 'g'), varName);
  }
  
  // Handle common patterns
  if (expr.match(/^[a-z_]+$/)) {
    // Simple register: *ptr
    return `*${expr}`;
  }
  
  if (expr.includes('+')) {
    // Offset: *(ptr + offset)
    return `*(${expr})`;
  }
  
  if (expr.includes('*')) {
    // Scaled index: *(base + index * scale)
    return `*(${expr})`;
  }
  
  return `*((int*)${expr})`;
}

/**
 * Check if operand is a register
 */
function isRegister(operand) {
  const registers = [
    'eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'esp', 'ebp',
    'rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'rsp', 'rbp',
    'al', 'bl', 'cl', 'dl', 'ah', 'bh', 'ch', 'dh',
    'ax', 'bx', 'cx', 'dx', 'si', 'di', 'sp', 'bp'
  ];
  return registers.includes(operand.toLowerCase());
}

/**
 * Convert register to C variable name
 */
function registerToVar(register) {
  const reg = register.toLowerCase();
  return REGISTER_VARS[reg] || reg;
}

/**
 * Split operands string
 */
function splitOperands(operands) {
  if (!operands) return [];
  
  const parts = [];
  let current = '';
  let depth = 0;
  
  for (let i = 0; i < operands.length; i++) {
    const char = operands[i];
    
    if (char === '[') depth++;
    else if (char === ']') depth--;
    
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current) {
    parts.push(current.trim());
  }
  
  return parts;
}

/**
 * Extract registers from operands
 */
function extractRegisters(operands) {
  if (!operands) return [];
  
  const registers = [];
  const regPattern = /\b(eax|ebx|ecx|edx|esi|edi|esp|ebp|rax|rbx|rcx|rdx|rsi|rdi|rsp|rbp|r\d+[dwb]?)\b/gi;
  
  let match;
  while ((match = regPattern.exec(operands)) !== null) {
    registers.push(match[1].toLowerCase());
  }
  
  return registers;
}

/**
 * Find API function name
 */
function findApiFunction(target, context) {
  if (!context.peData || !context.peData.imports) {
    return null;
  }
  
  // Check imports
  for (const dll of context.peData.imports) {
    for (const func of dll.functions) {
      if (func.name && target.includes(func.name)) {
        return func.name;
      }
    }
  }
  
  return null;
}

/**
 * Structure control flow
 */
function structureControlFlow(statements, context) {
  const structured = [];
  let i = 0;
  
  while (i < statements.length) {
    const stmt = statements[i];
    const inst = stmt.instruction;
    
    // Check for loop patterns
    const loopEnd = detectLoop(statements, i, context);
    if (loopEnd > i) {
      structured.push({
        type: 'loop',
        body: statements.slice(i, loopEnd)
      });
      i = loopEnd;
      continue;
    }
    
    // Check for if-then-else patterns
    const ifEnd = detectIfStatement(statements, i, context);
    if (ifEnd > i) {
      structured.push({
        type: 'if',
        condition: extractCondition(inst, context),
        body: statements.slice(i + 1, ifEnd)
      });
      i = ifEnd;
      continue;
    }
    
    // Regular statement
    structured.push(stmt);
    i++;
  }
  
  return structured;
}

/**
 * Detect loop pattern
 */
function detectLoop(statements, start, context) {
  // Simple loop detection: look for backward jumps
  for (let i = start; i < statements.length; i++) {
    const inst = statements[i].instruction;
    
    if (isJump(inst)) {
      const target = extractJumpTarget(inst);
      if (target) {
        // Check if jump goes backward
        const targetIndex = findStatementByAddress(statements, target);
        if (targetIndex >= 0 && targetIndex <= start) {
          return i + 1;
        }
      }
    }
  }
  
  return start;
}

/**
 * Detect if statement pattern
 */
function detectIfStatement(statements, start, context) {
  const inst = statements[start].instruction;
  
  if (!isConditionalJump(inst)) {
    return start;
  }
  
  const target = extractJumpTarget(inst);
  if (target) {
    const targetIndex = findStatementByAddress(statements, target);
    if (targetIndex > start) {
      return targetIndex;
    }
  }
  
  return start;
}

/**
 * Extract condition from jump instruction
 */
function extractCondition(inst, context) {
  const mnemonic = inst.mnemonic.toLowerCase();
  
  switch (mnemonic) {
    case 'je':
    case 'jz':
      return '== 0';
    case 'jne':
    case 'jnz':
      return '!= 0';
    case 'jg':
      return '> 0';
    case 'jge':
      return '>= 0';
    case 'jl':
      return '< 0';
    case 'jle':
      return '<= 0';
    default:
      return 'condition';
  }
}

/**
 * Generate final C code
 */
function generateCCode(structured, context) {
  let code = '';
  
  // Function signature
  const funcName = context.functionInfo.name || 'function';
  const returnType = context.returnType === C_TYPES.VOID ? 'void' : 'int';
  
  code += `${returnType} ${funcName}() {\n`;
  
  // Local variables
  if (context.stackFrame.localSpace > 0) {
    code += `    // Local variables (${context.stackFrame.localSpace} bytes)\n`;
    code += `    int local_var[${Math.ceil(context.stackFrame.localSpace / 4)}];\n`;
  }
  
  // Register variables
  code += `    int result, base, counter, data;\n`;
  code += `    void *source, *dest;\n`;
  code += '\n';
  
  // Function body
  for (const item of structured) {
    if (typeof item === 'object' && item.type) {
      // Structured element
      switch (item.type) {
        case 'loop':
          code += '    while (1) {\n';
          for (const stmt of item.body) {
            code += `        ${stmt.code}\n`;
          }
          code += '    }\n';
          break;
          
        case 'if':
          code += `    if (${item.condition}) {\n`;
          for (const stmt of item.body) {
            code += `        ${stmt.code}\n`;
          }
          code += '    }\n';
          break;
      }
    } else if (item.code) {
      // Regular statement
      code += `    ${item.code}\n`;
    }
  }
  
  code += '}\n';
  
  return code;
}

/**
 * Helper: Check if instruction is a jump
 */
function isJump(inst) {
  return inst && inst.type === 'control_flow' && inst.mnemonic.startsWith('j');
}

/**
 * Helper: Check if instruction is a conditional jump
 */
function isConditionalJump(inst) {
  const conditionals = ['je', 'jz', 'jne', 'jnz', 'jg', 'jge', 'jl', 'jle', 'ja', 'jae', 'jb', 'jbe'];
  return inst && conditionals.includes(inst.mnemonic.toLowerCase());
}

/**
 * Helper: Check if instruction is a return
 */
function isReturn(inst) {
  return inst && inst.mnemonic === 'ret';
}

/**
 * Helper: Check if instruction terminates a basic block
 */
function isBlockTerminator(inst) {
  if (!inst) return false;
  return isJump(inst) || isReturn(inst);
}

/**
 * Helper: Extract jump target address
 */
function extractJumpTarget(inst) {
  if (!inst || !inst.target) return null;
  return inst.target;
}

/**
 * Helper: Find instruction by address
 */
function findInstructionByAddress(instructions, address) {
  for (let i = 0; i < instructions.length; i++) {
    if (instructions[i].addressNum === address) {
      return i;
    }
  }
  return -1;
}

/**
 * Helper: Find statement by address
 */
function findStatementByAddress(statements, address) {
  for (let i = 0; i < statements.length; i++) {
    if (statements[i].address === address) {
      return i;
    }
  }
  return -1;
}
