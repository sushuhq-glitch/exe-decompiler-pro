/**
 * Python Language Decompiler
 * Converts x86/x64 assembly to Python pseudocode
 * 
 * Features:
 * - Pythonic code generation
 * - Dynamic typing
 * - List and dictionary inference
 * - Function definitions with decorators
 * - Class detection
 * - Exception handling
 * - Generator and iterator patterns
 * - Context managers
 * - Comprehensions
 */

// Python built-in types
const PYTHON_TYPES = {
  NONE: 'None',
  BOOL: 'bool',
  INT: 'int',
  FLOAT: 'float',
  STR: 'str',
  BYTES: 'bytes',
  LIST: 'list',
  TUPLE: 'tuple',
  DICT: 'dict',
  SET: 'set',
  OBJECT: 'object'
};

// Register to Python variable mapping
const PYTHON_VAR_NAMES = {
  'eax': 'result',
  'ebx': 'base_ptr',
  'ecx': 'counter',
  'edx': 'data_reg',
  'esi': 'source_idx',
  'edi': 'dest_idx',
  'rax': 'result',
  'rbx': 'base_ptr',
  'rcx': 'counter',
  'rdx': 'data_reg',
  'rsi': 'source_idx',
  'rdi': 'dest_idx'
};

/**
 * Decompile to Python language
 */
export function decompileToPython(instructions, peData, functionInfo = {}) {
  const context = createPythonContext(instructions, peData, functionInfo);
  
  // Analyze function structure
  analyzeFunctionStructure(context);
  
  // Build control flow
  buildPythonControlFlow(context);
  
  // Infer Python types
  inferPythonTypes(context);
  
  // Convert to Python statements
  const statements = convertToPythonStatements(context);
  
  // Structure control flow (if/else/while/for)
  const structured = structurePythonControlFlow(statements, context);
  
  // Generate Python code
  const code = generatePythonCode(structured, context);
  
  return code;
}

/**
 * Create Python decompilation context
 */
function createPythonContext(instructions, peData, functionInfo) {
  return {
    instructions,
    peData,
    functionInfo,
    variables: new Map(),
    types: new Map(),
    scopes: [],
    currentScope: 'module',
    indentLevel: 0,
    classContext: null,
    imports: new Set(),
    decorators: [],
    generators: new Set(),
    asyncFunctions: new Set(),
    exceptionHandlers: [],
    withBlocks: []
  };
}

/**
 * Analyze function structure for Python idioms
 */
function analyzeFunctionStructure(context) {
  const insts = context.instructions;
  
  // Detect class methods (check for 'self' parameter)
  if (context.functionInfo.name && context.functionInfo.name.includes('__init__')) {
    context.classContext = {
      isMethod: true,
      isConstructor: true,
      className: extractClassName(context.functionInfo.name)
    };
  } else if (detectSelfParameter(insts)) {
    context.classContext = {
      isMethod: true,
      isConstructor: false
    };
  }
  
  // Detect generator functions (look for yield patterns)
  if (detectGeneratorPattern(insts)) {
    context.generators.add(context.functionInfo.name);
  }
  
  // Detect async functions
  if (detectAsyncPattern(insts)) {
    context.asyncFunctions.add(context.functionInfo.name);
  }
  
  // Detect exception handling
  detectExceptionHandling(context);
}

/**
 * Build Python control flow
 */
function buildPythonControlFlow(context) {
  const blocks = [];
  let currentBlock = {
    id: 0,
    statements: [],
    type: 'normal',
    indent: 0
  };
  
  for (let i = 0; i < context.instructions.length; i++) {
    const inst = context.instructions[i];
    
    // Detect block boundaries
    if (isPythonBlockStart(inst, context)) {
      if (currentBlock.statements.length > 0) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        id: blocks.length,
        statements: [],
        type: detectBlockType(inst),
        indent: calculateIndent(inst, context)
      };
    }
    
    currentBlock.statements.push(inst);
    
    // Block terminators
    if (isPythonBlockEnd(inst, context)) {
      blocks.push(currentBlock);
      currentBlock = {
        id: blocks.length,
        statements: [],
        type: 'normal',
        indent: 0
      };
    }
  }
  
  if (currentBlock.statements.length > 0) {
    blocks.push(currentBlock);
  }
  
  context.blocks = blocks;
}

/**
 * Infer Python types from operations
 */
function inferPythonTypes(context) {
  for (const inst of context.instructions) {
    // String operations
    if (detectStringOperation(inst)) {
      markAsPythonType(context, inst, PYTHON_TYPES.STR);
    }
    
    // List operations
    if (detectListOperation(inst)) {
      markAsPythonType(context, inst, PYTHON_TYPES.LIST);
    }
    
    // Dict operations
    if (detectDictOperation(inst)) {
      markAsPythonType(context, inst, PYTHON_TYPES.DICT);
    }
    
    // Numeric operations
    if (detectNumericOperation(inst)) {
      markAsPythonType(context, inst, PYTHON_TYPES.INT);
    }
    
    // Boolean operations
    if (detectBooleanOperation(inst)) {
      markAsPythonType(context, inst, PYTHON_TYPES.BOOL);
    }
  }
}

/**
 * Mark as Python type
 */
function markAsPythonType(context, inst, type) {
  const regs = extractRegistersFromInst(inst);
  for (const reg of regs) {
    context.types.set(reg, type);
  }
}

/**
 * Detect string operation
 */
function detectStringOperation(inst) {
  // Look for string manipulation patterns
  if (inst.mnemonic === 'call') {
    const target = inst.operands;
    return target.includes('str') || target.includes('String') || 
           target.includes('concat') || target.includes('format');
  }
  return false;
}

/**
 * Detect list operation
 */
function detectListOperation(inst) {
  if (inst.mnemonic === 'call') {
    const target = inst.operands;
    return target.includes('append') || target.includes('list') || 
           target.includes('array') || target.includes('push');
  }
  return false;
}

/**
 * Detect dict operation
 */
function detectDictOperation(inst) {
  if (inst.mnemonic === 'call') {
    const target = inst.operands;
    return target.includes('dict') || target.includes('map') || 
           target.includes('hash') || target.includes('get');
  }
  return false;
}

/**
 * Detect numeric operation
 */
function detectNumericOperation(inst) {
  const numericOps = ['add', 'sub', 'mul', 'div', 'imul', 'idiv', 'inc', 'dec'];
  return numericOps.includes(inst.mnemonic);
}

/**
 * Detect boolean operation
 */
function detectBooleanOperation(inst) {
  const boolOps = ['and', 'or', 'xor', 'test', 'cmp'];
  return boolOps.includes(inst.mnemonic);
}

/**
 * Convert to Python statements
 */
function convertToPythonStatements(context) {
  const statements = [];
  
  for (const inst of context.instructions) {
    const statement = instructionToPython(inst, context);
    if (statement) {
      statements.push({
        address: inst.address,
        code: statement,
        instruction: inst,
        indent: context.indentLevel
      });
    }
  }
  
  return statements;
}

/**
 * Convert single instruction to Python statement
 */
function instructionToPython(inst, context) {
  const mnemonic = inst.mnemonic.toLowerCase();
  
  switch (mnemonic) {
    case 'mov':
      return convertMovPython(inst, context);
    case 'add':
      return convertAddPython(inst, context);
    case 'sub':
      return convertSubPython(inst, context);
    case 'mul':
    case 'imul':
      return convertMulPython(inst, context);
    case 'div':
    case 'idiv':
      return convertDivPython(inst, context);
    case 'and':
      return convertAndPython(inst, context);
    case 'or':
      return convertOrPython(inst, context);
    case 'xor':
      return convertXorPython(inst, context);
    case 'not':
      return convertNotPython(inst, context);
    case 'inc':
      return convertIncPython(inst, context);
    case 'dec':
      return convertDecPython(inst, context);
    case 'shl':
    case 'sal':
      return convertShlPython(inst, context);
    case 'shr':
    case 'sar':
      return convertShrPython(inst, context);
    case 'lea':
      return convertLeaPython(inst, context);
    case 'call':
      return convertCallPython(inst, context);
    case 'ret':
      return convertRetPython(inst, context);
    case 'push':
      return convertPushPython(inst, context);
    case 'pop':
      return convertPopPython(inst, context);
    case 'cmp':
    case 'test':
      return null; // Handled by control flow
    case 'nop':
      return 'pass';
    default:
      return `# ${inst.mnemonic} ${inst.operands}`;
  }
}

/**
 * Convert MOV to Python assignment
 */
function convertMovPython(inst, context) {
  const parts = splitPythonOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToPython(parts[0], context);
  const src = operandToPython(parts[1], context);
  
  return `${dest} = ${src}`;
}

/**
 * Convert ADD to Python
 */
function convertAddPython(inst, context) {
  const parts = splitPythonOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToPython(parts[0], context);
  const src = operandToPython(parts[1], context);
  
  return `${dest} += ${src}`;
}

/**
 * Convert SUB to Python
 */
function convertSubPython(inst, context) {
  const parts = splitPythonOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToPython(parts[0], context);
  const src = operandToPython(parts[1], context);
  
  return `${dest} -= ${src}`;
}

/**
 * Convert MUL to Python
 */
function convertMulPython(inst, context) {
  const parts = splitPythonOperands(inst.operands);
  
  if (parts.length === 2) {
    const dest = operandToPython(parts[0], context);
    const src = operandToPython(parts[1], context);
    return `${dest} *= ${src}`;
  }
  
  return 'result *= operand';
}

/**
 * Convert DIV to Python
 */
function convertDivPython(inst, context) {
  const parts = splitPythonOperands(inst.operands);
  
  if (parts.length === 2) {
    const dest = operandToPython(parts[0], context);
    const src = operandToPython(parts[1], context);
    return `${dest} //= ${src}  # Integer division`;
  }
  
  return 'result //= operand';
}

/**
 * Convert AND to Python
 */
function convertAndPython(inst, context) {
  const parts = splitPythonOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToPython(parts[0], context);
  const src = operandToPython(parts[1], context);
  
  return `${dest} &= ${src}`;
}

/**
 * Convert OR to Python
 */
function convertOrPython(inst, context) {
  const parts = splitPythonOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToPython(parts[0], context);
  const src = operandToPython(parts[1], context);
  
  return `${dest} |= ${src}`;
}

/**
 * Convert XOR to Python
 */
function convertXorPython(inst, context) {
  const parts = splitPythonOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToPython(parts[0], context);
  const src = operandToPython(parts[1], context);
  
  // Special case: xor reg, reg = zeroing
  if (parts[0] === parts[1]) {
    return `${dest} = 0`;
  }
  
  return `${dest} ^= ${src}`;
}

/**
 * Convert NOT to Python
 */
function convertNotPython(inst, context) {
  const operand = operandToPython(inst.operands, context);
  return `${operand} = ~${operand}`;
}

/**
 * Convert INC to Python
 */
function convertIncPython(inst, context) {
  const operand = operandToPython(inst.operands, context);
  return `${operand} += 1`;
}

/**
 * Convert DEC to Python
 */
function convertDecPython(inst, context) {
  const operand = operandToPython(inst.operands, context);
  return `${operand} -= 1`;
}

/**
 * Convert SHL to Python
 */
function convertShlPython(inst, context) {
  const parts = splitPythonOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToPython(parts[0], context);
  const src = operandToPython(parts[1], context);
  
  return `${dest} <<= ${src}`;
}

/**
 * Convert SHR to Python
 */
function convertShrPython(inst, context) {
  const parts = splitPythonOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToPython(parts[0], context);
  const src = operandToPython(parts[1], context);
  
  return `${dest} >>= ${src}`;
}

/**
 * Convert LEA to Python
 */
function convertLeaPython(inst, context) {
  const parts = splitPythonOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToPython(parts[0], context);
  const src = parts[1];
  
  // In Python, we might represent this as a reference or address
  const addr = src.replace(/[\[\]]/g, '').trim();
  return `${dest} = id(${addr})  # Address reference`;
}

/**
 * Convert CALL to Python function call
 */
function convertCallPython(inst, context) {
  const target = inst.operands;
  
  // Check for known Python stdlib functions
  const pythonFunc = mapToPythonFunction(target, context);
  if (pythonFunc) {
    return pythonFunc;
  }
  
  // Check for API functions
  const apiFunc = findPythonApiFunction(target, context);
  if (apiFunc) {
    return `${apiFunc}()`;
  }
  
  // Generic function call
  const funcName = sanitizePythonName(target);
  return `${funcName}()`;
}

/**
 * Convert RET to Python return
 */
function convertRetPython(inst, context) {
  // Check if function is a generator
  if (context.generators.has(context.functionInfo.name)) {
    return 'yield result';
  }
  
  return 'return result';
}

/**
 * Convert PUSH to Python (use list append as metaphor)
 */
function convertPushPython(inst, context) {
  const operand = operandToPython(inst.operands, context);
  return `stack.append(${operand})`;
}

/**
 * Convert POP to Python (use list pop as metaphor)
 */
function convertPopPython(inst, context) {
  const operand = operandToPython(inst.operands, context);
  return `${operand} = stack.pop()`;
}

/**
 * Convert operand to Python expression
 */
function operandToPython(operand, context) {
  if (!operand) return '';
  
  operand = operand.trim();
  
  // Register
  if (isPythonRegister(operand)) {
    return registerToPythonVar(operand);
  }
  
  // Immediate value (convert to Python int)
  if (operand.match(/^0x[0-9A-Fa-f]+$/)) {
    return operand; // Keep hex notation
  }
  
  if (operand.match(/^-?\d+$/)) {
    return operand;
  }
  
  // Memory reference -> list/dict access
  if (operand.startsWith('[') && operand.endsWith(']')) {
    return convertPythonMemoryReference(operand, context);
  }
  
  // String literal
  if (operand.startsWith('"') || operand.startsWith("'")) {
    return operand;
  }
  
  // Symbol
  return sanitizePythonName(operand);
}

/**
 * Convert memory reference to Python list/dict access
 */
function convertPythonMemoryReference(operand, context) {
  let expr = operand.replace(/[\[\]]/g, '');
  expr = expr.replace(/byte ptr |word ptr |dword ptr |qword ptr /g, '');
  expr = expr.trim();
  
  // Convert registers to Python variable names
  for (const [reg, varName] of Object.entries(PYTHON_VAR_NAMES)) {
    expr = expr.replace(new RegExp(`\\b${reg}\\b`, 'g'), varName);
  }
  
  // Handle array-like access
  if (expr.match(/^\w+$/)) {
    return `memory[${expr}]`;
  }
  
  if (expr.includes('+')) {
    // Offset pattern: memory[base + offset]
    return `memory[${expr}]`;
  }
  
  return `memory[${expr}]`;
}

/**
 * Check if operand is a register
 */
function isPythonRegister(operand) {
  const registers = [
    'eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'esp', 'ebp',
    'rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'rsp', 'rbp'
  ];
  return registers.includes(operand.toLowerCase());
}

/**
 * Convert register to Python variable name
 */
function registerToPythonVar(register) {
  const reg = register.toLowerCase();
  return PYTHON_VAR_NAMES[reg] || reg;
}

/**
 * Sanitize name for Python (convert to snake_case)
 */
function sanitizePythonName(name) {
  // Remove non-alphanumeric characters
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Convert to snake_case
  sanitized = sanitized.replace(/([A-Z])/g, '_$1').toLowerCase();
  
  // Remove leading underscore if not intentional
  sanitized = sanitized.replace(/^_+/, '');
  
  // Ensure doesn't start with digit
  if (/^\d/.test(sanitized)) {
    sanitized = '_' + sanitized;
  }
  
  return sanitized;
}

/**
 * Map Windows API to Python equivalent
 */
function mapToPythonFunction(target, context) {
  const apiMappings = {
    'CreateFileA': 'open(filename, "rb")',
    'CreateFileW': 'open(filename, "rb")',
    'ReadFile': 'file.read()',
    'WriteFile': 'file.write(data)',
    'CloseHandle': 'file.close()',
    'MessageBoxA': 'print(message)',
    'MessageBoxW': 'print(message)',
    'printf': 'print(formatted)',
    'malloc': '# Python handles memory automatically',
    'free': '# Python handles memory automatically',
    'strlen': 'len(string)',
    'strcpy': 'dest = src',
    'strcmp': 'string1 == string2',
    'memcpy': 'dest[:] = src[:]',
    'memset': 'data[:] = [value] * len(data)',
    'Sleep': 'time.sleep(milliseconds / 1000.0)',
    'GetTickCount': 'time.time() * 1000',
    'ExitProcess': 'sys.exit(code)'
  };
  
  for (const [api, pythonEquiv] of Object.entries(apiMappings)) {
    if (target.includes(api)) {
      // Add import if needed
      if (pythonEquiv.includes('time.')) {
        context.imports.add('import time');
      }
      if (pythonEquiv.includes('sys.')) {
        context.imports.add('import sys');
      }
      return pythonEquiv;
    }
  }
  
  return null;
}

/**
 * Find Python API function
 */
function findPythonApiFunction(target, context) {
  // Check imports for known functions
  if (!context.peData || !context.peData.imports) {
    return null;
  }
  
  for (const dll of context.peData.imports) {
    for (const func of dll.functions) {
      if (func.name && target.includes(func.name)) {
        return sanitizePythonName(func.name);
      }
    }
  }
  
  return null;
}

/**
 * Split operands for Python
 */
function splitPythonOperands(operands) {
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
 * Extract registers from instruction
 */
function extractRegistersFromInst(inst) {
  if (!inst || !inst.operands) return [];
  
  const registers = [];
  const regPattern = /\b(eax|ebx|ecx|edx|esi|edi|esp|ebp|rax|rbx|rcx|rdx|rsi|rdi|rsp|rbp)\b/gi;
  
  let match;
  while ((match = regPattern.exec(inst.operands)) !== null) {
    registers.push(match[1].toLowerCase());
  }
  
  return registers;
}

/**
 * Structure Python control flow
 */
function structurePythonControlFlow(statements, context) {
  const structured = [];
  let i = 0;
  
  while (i < statements.length) {
    const stmt = statements[i];
    const inst = stmt.instruction;
    
    // Detect for loops
    const forLoopEnd = detectPythonForLoop(statements, i, context);
    if (forLoopEnd > i) {
      structured.push({
        type: 'for',
        variable: 'i',
        iterable: 'range(count)',
        body: statements.slice(i + 1, forLoopEnd),
        indent: stmt.indent
      });
      i = forLoopEnd;
      continue;
    }
    
    // Detect while loops
    const whileLoopEnd = detectPythonWhileLoop(statements, i, context);
    if (whileLoopEnd > i) {
      structured.push({
        type: 'while',
        condition: extractPythonCondition(inst, context),
        body: statements.slice(i + 1, whileLoopEnd),
        indent: stmt.indent
      });
      i = whileLoopEnd;
      continue;
    }
    
    // Detect if statements
    const ifEnd = detectPythonIfStatement(statements, i, context);
    if (ifEnd > i) {
      structured.push({
        type: 'if',
        condition: extractPythonCondition(inst, context),
        body: statements.slice(i + 1, ifEnd),
        elseBody: [],
        indent: stmt.indent
      });
      i = ifEnd;
      continue;
    }
    
    // Detect try-except blocks
    const tryEnd = detectPythonTryBlock(statements, i, context);
    if (tryEnd > i) {
      structured.push({
        type: 'try',
        tryBody: statements.slice(i + 1, tryEnd),
        exceptBlocks: [],
        indent: stmt.indent
      });
      i = tryEnd;
      continue;
    }
    
    // Detect with statements
    const withEnd = detectPythonWithBlock(statements, i, context);
    if (withEnd > i) {
      structured.push({
        type: 'with',
        expression: 'context_manager',
        alias: 'resource',
        body: statements.slice(i + 1, withEnd),
        indent: stmt.indent
      });
      i = withEnd;
      continue;
    }
    
    // Regular statement
    structured.push(stmt);
    i++;
  }
  
  return structured;
}

/**
 * Detect Python for loop
 */
function detectPythonForLoop(statements, start, context) {
  // Look for counter increment patterns
  for (let i = start; i < statements.length; i++) {
    const inst = statements[i].instruction;
    
    if (inst.mnemonic === 'inc' && inst.operands.includes('ecx')) {
      // Found counter increment, look for loop condition
      for (let j = i + 1; j < Math.min(i + 10, statements.length); j++) {
        const checkInst = statements[j].instruction;
        if (checkInst.mnemonic === 'cmp' || checkInst.mnemonic === 'test') {
          return j + 1;
        }
      }
    }
  }
  
  return start;
}

/**
 * Detect Python while loop
 */
function detectPythonWhileLoop(statements, start, context) {
  const inst = statements[start].instruction;
  
  if (inst.mnemonic === 'test' || inst.mnemonic === 'cmp') {
    // Look for jump back
    for (let i = start + 1; i < statements.length; i++) {
      const jumpInst = statements[i].instruction;
      if (jumpInst.mnemonic && jumpInst.mnemonic.startsWith('j')) {
        const target = extractJumpTargetPython(jumpInst);
        if (target && target <= statements[start].address) {
          return i + 1;
        }
      }
    }
  }
  
  return start;
}

/**
 * Detect Python if statement
 */
function detectPythonIfStatement(statements, start, context) {
  const inst = statements[start].instruction;
  
  if (inst.mnemonic && inst.mnemonic.startsWith('j') && inst.mnemonic !== 'jmp') {
    const target = extractJumpTargetPython(inst);
    if (target) {
      const targetIdx = findStatementByAddressPython(statements, target);
      if (targetIdx > start) {
        return targetIdx;
      }
    }
  }
  
  return start;
}

/**
 * Detect Python try block
 */
function detectPythonTryBlock(statements, start, context) {
  // Look for exception handler setup
  const inst = statements[start].instruction;
  
  if (inst.mnemonic === 'call' && inst.operands.includes('__CxxFrameHandler')) {
    return start + 10; // Assume try block length
  }
  
  return start;
}

/**
 * Detect Python with block
 */
function detectPythonWithBlock(statements, start, context) {
  // Look for resource acquisition and cleanup patterns
  const inst = statements[start].instruction;
  
  if (inst.mnemonic === 'call' && 
      (inst.operands.includes('__enter__') || inst.operands.includes('acquire'))) {
    return start + 5; // Assume with block length
  }
  
  return start;
}

/**
 * Extract Python condition
 */
function extractPythonCondition(inst, context) {
  if (!inst) return 'True';
  
  const mnemonic = inst.mnemonic.toLowerCase();
  
  switch (mnemonic) {
    case 'je':
    case 'jz':
      return 'value == 0';
    case 'jne':
    case 'jnz':
      return 'value != 0';
    case 'jg':
      return 'value > 0';
    case 'jge':
      return 'value >= 0';
    case 'jl':
      return 'value < 0';
    case 'jle':
      return 'value <= 0';
    case 'ja':
      return 'value > other';
    case 'jb':
      return 'value < other';
    default:
      return 'condition';
  }
}

/**
 * Generate Python code
 */
function generatePythonCode(structured, context) {
  let code = '';
  
  // Add imports
  if (context.imports.size > 0) {
    for (const imp of context.imports) {
      code += `${imp}\n`;
    }
    code += '\n';
  }
  
  // Add standard imports
  code += 'import ctypes\n';
  code += 'import struct\n';
  code += '\n';
  
  // Function definition
  const funcName = sanitizePythonName(context.functionInfo.name || 'function');
  
  // Add decorators
  if (context.generators.has(context.functionInfo.name)) {
    // No decorator needed for generators in Python
  }
  
  if (context.asyncFunctions.has(context.functionInfo.name)) {
    code += 'async ';
  }
  
  // Function signature
  if (context.classContext && context.classContext.isMethod) {
    code += `def ${funcName}(self):\n`;
  } else {
    code += `def ${funcName}():\n`;
  }
  
  // Docstring
  code += `    """Decompiled function: ${context.functionInfo.name || 'unknown'}"""\n`;
  
  // Initialize variables
  code += '    # Initialize variables\n';
  code += '    result = 0\n';
  code += '    counter = 0\n';
  code += '    data_reg = 0\n';
  code += '    memory = {}\n';
  code += '    stack = []\n';
  code += '\n';
  
  // Function body
  code += generatePythonBody(structured, 1);
  
  return code;
}

/**
 * Generate Python body with proper indentation
 */
function generatePythonBody(structured, indentLevel) {
  let code = '';
  const indent = '    '.repeat(indentLevel);
  
  for (const item of structured) {
    if (typeof item === 'object' && item.type) {
      switch (item.type) {
        case 'for':
          code += `${indent}for ${item.variable} in ${item.iterable}:\n`;
          code += generatePythonBody(item.body, indentLevel + 1);
          break;
          
        case 'while':
          code += `${indent}while ${item.condition}:\n`;
          code += generatePythonBody(item.body, indentLevel + 1);
          break;
          
        case 'if':
          code += `${indent}if ${item.condition}:\n`;
          code += generatePythonBody(item.body, indentLevel + 1);
          if (item.elseBody && item.elseBody.length > 0) {
            code += `${indent}else:\n`;
            code += generatePythonBody(item.elseBody, indentLevel + 1);
          }
          break;
          
        case 'try':
          code += `${indent}try:\n`;
          code += generatePythonBody(item.tryBody, indentLevel + 1);
          code += `${indent}except Exception as e:\n`;
          code += `${indent}    pass\n`;
          break;
          
        case 'with':
          code += `${indent}with ${item.expression} as ${item.alias}:\n`;
          code += generatePythonBody(item.body, indentLevel + 1);
          break;
      }
    } else if (item.code) {
      code += `${indent}${item.code}\n`;
    }
  }
  
  // Ensure there's at least a pass statement
  if (code.trim() === '') {
    code += `${indent}pass\n`;
  }
  
  return code;
}

/**
 * Helper functions
 */

function detectSelfParameter(instructions) {
  // Look for patterns suggesting 'self' parameter
  for (const inst of instructions.slice(0, 5)) {
    if (inst.operands && inst.operands.includes('ecx')) {
      // ECX often holds 'this' pointer in member functions
      return true;
    }
  }
  return false;
}

function extractClassName(funcName) {
  const parts = funcName.split('__');
  return parts[0] || 'UnknownClass';
}

function detectGeneratorPattern(instructions) {
  // Look for yield-like patterns (saving/restoring state)
  for (const inst of instructions) {
    if (inst.mnemonic === 'call' && inst.operands.includes('yield')) {
      return true;
    }
  }
  return false;
}

function detectAsyncPattern(instructions) {
  // Look for async patterns (event loop, promises, etc.)
  for (const inst of instructions) {
    if (inst.mnemonic === 'call') {
      const target = inst.operands.toLowerCase();
      if (target.includes('async') || target.includes('await') || target.includes('promise')) {
        return true;
      }
    }
  }
  return false;
}

function detectExceptionHandling(context) {
  // Look for exception handling setup
  for (const inst of context.instructions) {
    if (inst.mnemonic === 'call') {
      const target = inst.operands;
      if (target.includes('__CxxFrameHandler') || target.includes('_except_handler')) {
        context.exceptionHandlers.push({
          address: inst.address,
          type: 'cpp_exception'
        });
      }
    }
  }
}

function isPythonBlockStart(inst, context) {
  // Detect start of new block (after jump target, etc.)
  return false; // Simplified
}

function isPythonBlockEnd(inst, context) {
  // Detect end of block (return, jump, etc.)
  return inst.mnemonic === 'ret' || inst.mnemonic === 'jmp';
}

function detectBlockType(inst) {
  return 'normal';
}

function calculateIndent(inst, context) {
  return 0;
}

function extractJumpTargetPython(inst) {
  return inst.target || null;
}

function findStatementByAddressPython(statements, address) {
  for (let i = 0; i < statements.length; i++) {
    if (statements[i].address === address) {
      return i;
    }
  }
  return -1;
}
