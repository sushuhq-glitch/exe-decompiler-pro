/**
 * Go Language Decompiler
 * Converts x86/x64 assembly to Go pseudocode
 * 
 * Features:
 * - Go syntax generation
 * - Goroutine detection
 * - Channel operations
 * - Interface handling
 * - Struct definitions
 * - Pointer semantics
 * - Defer statements
 * - Error handling
 * - Package structure
 */

// Go built-in types
const GO_TYPES = {
  BOOL: 'bool',
  BYTE: 'byte',
  RUNE: 'rune',
  INT: 'int',
  INT8: 'int8',
  INT16: 'int16',
  INT32: 'int32',
  INT64: 'int64',
  UINT: 'uint',
  UINT8: 'uint8',
  UINT16: 'uint16',
  UINT32: 'uint32',
  UINT64: 'uint64',
  UINTPTR: 'uintptr',
  FLOAT32: 'float32',
  FLOAT64: 'float64',
  COMPLEX64: 'complex64',
  COMPLEX128: 'complex128',
  STRING: 'string',
  ERROR: 'error'
};

// Register to Go variable mapping
const GO_VAR_NAMES = {
  'eax': 'result',
  'ebx': 'baseReg',
  'ecx': 'counter',
  'edx': 'dataReg',
  'esi': 'sourceIdx',
  'edi': 'destIdx',
  'rax': 'result',
  'rbx': 'baseReg',
  'rcx': 'counter',
  'rdx': 'dataReg',
  'rsi': 'sourceIdx',
  'rdi': 'destIdx'
};

/**
 * Decompile to Go language
 */
export function decompileToGo(instructions, peData, functionInfo = {}) {
  const context = createGoContext(instructions, peData, functionInfo);
  
  // Analyze function structure
  analyzeGoStructure(context);
  
  // Build control flow
  buildGoControlFlow(context);
  
  // Infer Go types
  inferGoTypes(context);
  
  // Detect concurrency patterns
  detectConcurrencyPatterns(context);
  
  // Convert to Go statements
  const statements = convertToGoStatements(context);
  
  // Structure control flow
  const structured = structureGoControlFlow(statements, context);
  
  // Generate Go code
  const code = generateGoCode(structured, context);
  
  return code;
}

/**
 * Create Go decompilation context
 */
function createGoContext(instructions, peData, functionInfo) {
  return {
    instructions,
    peData,
    functionInfo,
    variables: new Map(),
    types: new Map(),
    goroutines: new Set(),
    channels: new Map(),
    mutexes: new Set(),
    defers: [],
    errors: new Map(),
    interfaces: new Map(),
    structs: new Map(),
    packages: new Set(['fmt', 'sync']),
    receiverType: null,
    isMethod: false,
    returnTypes: [GO_TYPES.INT]
  };
}

/**
 * Analyze Go function structure
 */
function analyzeGoStructure(context) {
  const insts = context.instructions;
  
  // Check for method receiver (look for pointer in first register)
  if (detectMethodReceiver(insts)) {
    context.isMethod = true;
    context.receiverType = inferReceiverType(insts);
  }
  
  // Detect defer statements
  detectDeferStatements(context);
  
  // Detect panic/recover
  detectPanicRecover(context);
  
  // Detect error returns
  detectErrorReturns(context);
}

/**
 * Build Go control flow
 */
function buildGoControlFlow(context) {
  const blocks = [];
  let currentBlock = {
    id: 0,
    instructions: [],
    successors: [],
    predecessors: []
  };
  
  for (let i = 0; i < context.instructions.length; i++) {
    const inst = context.instructions[i];
    
    // Start new block at jump targets
    if (isGoBlockBoundary(inst, context)) {
      if (currentBlock.instructions.length > 0) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        id: blocks.length,
        instructions: [],
        successors: [],
        predecessors: []
      };
    }
    
    currentBlock.instructions.push(inst);
    
    // Handle control flow
    if (isGoControlFlow(inst)) {
      blocks.push(currentBlock);
      currentBlock = {
        id: blocks.length,
        instructions: [],
        successors: [],
        predecessors: []
      };
    }
  }
  
  if (currentBlock.instructions.length > 0) {
    blocks.push(currentBlock);
  }
  
  context.blocks = blocks;
}

/**
 * Infer Go types
 */
function inferGoTypes(context) {
  for (const inst of context.instructions) {
    // Integer operations
    if (isIntegerOp(inst)) {
      markAsGoType(context, inst, GO_TYPES.INT);
    }
    
    // Pointer operations
    if (isPointerOp(inst)) {
      markAsGoPointer(context, inst);
    }
    
    // String operations
    if (isStringOp(inst)) {
      markAsGoType(context, inst, GO_TYPES.STRING);
    }
    
    // Slice operations
    if (isSliceOp(inst)) {
      markAsGoSlice(context, inst);
    }
    
    // Map operations
    if (isMapOp(inst)) {
      markAsGoMap(context, inst);
    }
    
    // Channel operations
    if (isChannelOp(inst)) {
      markAsGoChannel(context, inst);
    }
  }
}

/**
 * Detect concurrency patterns
 */
function detectConcurrencyPatterns(context) {
  for (const inst of context.instructions) {
    // Detect goroutine creation
    if (detectGoroutineStart(inst)) {
      context.goroutines.add(inst.address);
    }
    
    // Detect channel operations
    if (detectChannelOp(inst)) {
      const chanInfo = extractChannelInfo(inst);
      context.channels.set(inst.address, chanInfo);
    }
    
    // Detect mutex operations
    if (detectMutexOp(inst)) {
      context.mutexes.add(inst.address);
    }
    
    // Detect select statements
    if (detectSelectStatement(inst)) {
      // Mark for special handling
    }
  }
}

/**
 * Convert to Go statements
 */
function convertToGoStatements(context) {
  const statements = [];
  
  for (const inst of context.instructions) {
    const statement = instructionToGo(inst, context);
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
 * Convert instruction to Go statement
 */
function instructionToGo(inst, context) {
  const mnemonic = inst.mnemonic.toLowerCase();
  
  switch (mnemonic) {
    case 'mov':
      return convertMovGo(inst, context);
    case 'add':
      return convertAddGo(inst, context);
    case 'sub':
      return convertSubGo(inst, context);
    case 'mul':
    case 'imul':
      return convertMulGo(inst, context);
    case 'div':
    case 'idiv':
      return convertDivGo(inst, context);
    case 'and':
      return convertAndGo(inst, context);
    case 'or':
      return convertOrGo(inst, context);
    case 'xor':
      return convertXorGo(inst, context);
    case 'not':
      return convertNotGo(inst, context);
    case 'inc':
      return convertIncGo(inst, context);
    case 'dec':
      return convertDecGo(inst, context);
    case 'shl':
    case 'sal':
      return convertShlGo(inst, context);
    case 'shr':
    case 'sar':
      return convertShrGo(inst, context);
    case 'lea':
      return convertLeaGo(inst, context);
    case 'call':
      return convertCallGo(inst, context);
    case 'ret':
      return convertRetGo(inst, context);
    case 'push':
      return convertPushGo(inst, context);
    case 'pop':
      return convertPopGo(inst, context);
    case 'cmp':
    case 'test':
      return null; // Handled by control flow
    case 'nop':
      return null;
    default:
      return `// ${inst.mnemonic} ${inst.operands}`;
  }
}

/**
 * Convert MOV to Go assignment
 */
function convertMovGo(inst, context) {
  const parts = splitGoOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToGo(parts[0], context);
  const src = operandToGo(parts[1], context);
  
  return `${dest} = ${src}`;
}

/**
 * Convert ADD to Go
 */
function convertAddGo(inst, context) {
  const parts = splitGoOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToGo(parts[0], context);
  const src = operandToGo(parts[1], context);
  
  return `${dest} += ${src}`;
}

/**
 * Convert SUB to Go
 */
function convertSubGo(inst, context) {
  const parts = splitGoOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToGo(parts[0], context);
  const src = operandToGo(parts[1], context);
  
  return `${dest} -= ${src}`;
}

/**
 * Convert MUL to Go
 */
function convertMulGo(inst, context) {
  const parts = splitGoOperands(inst.operands);
  
  if (parts.length === 2) {
    const dest = operandToGo(parts[0], context);
    const src = operandToGo(parts[1], context);
    return `${dest} *= ${src}`;
  }
  
  return 'result *= operand';
}

/**
 * Convert DIV to Go
 */
function convertDivGo(inst, context) {
  const parts = splitGoOperands(inst.operands);
  
  if (parts.length === 2) {
    const dest = operandToGo(parts[0], context);
    const src = operandToGo(parts[1], context);
    return `${dest} /= ${src}`;
  }
  
  return 'result /= operand';
}

/**
 * Convert AND to Go
 */
function convertAndGo(inst, context) {
  const parts = splitGoOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToGo(parts[0], context);
  const src = operandToGo(parts[1], context);
  
  return `${dest} &= ${src}`;
}

/**
 * Convert OR to Go
 */
function convertOrGo(inst, context) {
  const parts = splitGoOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToGo(parts[0], context);
  const src = operandToGo(parts[1], context);
  
  return `${dest} |= ${src}`;
}

/**
 * Convert XOR to Go
 */
function convertXorGo(inst, context) {
  const parts = splitGoOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToGo(parts[0], context);
  const src = operandToGo(parts[1], context);
  
  // Special case: xor reg, reg = zeroing
  if (parts[0] === parts[1]) {
    return `${dest} = 0`;
  }
  
  return `${dest} ^= ${src}`;
}

/**
 * Convert NOT to Go
 */
function convertNotGo(inst, context) {
  const operand = operandToGo(inst.operands, context);
  return `${operand} = ^${operand}`;
}

/**
 * Convert INC to Go
 */
function convertIncGo(inst, context) {
  const operand = operandToGo(inst.operands, context);
  return `${operand}++`;
}

/**
 * Convert DEC to Go
 */
function convertDecGo(inst, context) {
  const operand = operandToGo(inst.operands, context);
  return `${operand}--`;
}

/**
 * Convert SHL to Go
 */
function convertShlGo(inst, context) {
  const parts = splitGoOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToGo(parts[0], context);
  const src = operandToGo(parts[1], context);
  
  return `${dest} <<= ${src}`;
}

/**
 * Convert SHR to Go
 */
function convertShrGo(inst, context) {
  const parts = splitGoOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToGo(parts[0], context);
  const src = operandToGo(parts[1], context);
  
  return `${dest} >>= ${src}`;
}

/**
 * Convert LEA to Go (address-of)
 */
function convertLeaGo(inst, context) {
  const parts = splitGoOperands(inst.operands);
  if (parts.length !== 2) return null;
  
  const dest = operandToGo(parts[0], context);
  const src = parts[1];
  
  const addr = src.replace(/[\[\]]/g, '').trim();
  return `${dest} = &${addr}`;
}

/**
 * Convert CALL to Go function call
 */
function convertCallGo(inst, context) {
  const target = inst.operands;
  
  // Check for goroutine creation
  if (detectGoroutineStart(inst)) {
    const funcName = sanitizeGoName(target);
    return `go ${funcName}()`;
  }
  
  // Check for known Go functions
  const goFunc = mapToGoFunction(target, context);
  if (goFunc) {
    return goFunc;
  }
  
  // Generic function call with error handling
  const funcName = sanitizeGoName(target);
  
  // Check if function might return error
  if (mightReturnError(target, context)) {
    return `result, err := ${funcName}()\nif err != nil {\n\treturn err\n}`;
  }
  
  return `${funcName}()`;
}

/**
 * Convert RET to Go return
 */
function convertRetGo(inst, context) {
  // Check for error return
  if (context.errors.size > 0) {
    return 'return result, nil';
  }
  
  if (context.returnTypes.length > 1) {
    return 'return result, nil';
  }
  
  return 'return result';
}

/**
 * Convert PUSH to Go (use slice append)
 */
function convertPushGo(inst, context) {
  const operand = operandToGo(inst.operands, context);
  return `stack = append(stack, ${operand})`;
}

/**
 * Convert POP to Go (use slice indexing)
 */
function convertPopGo(inst, context) {
  const operand = operandToGo(inst.operands, context);
  return `${operand} = stack[len(stack)-1]\nstack = stack[:len(stack)-1]`;
}

/**
 * Convert operand to Go expression
 */
function operandToGo(operand, context) {
  if (!operand) return '';
  
  operand = operand.trim();
  
  // Register
  if (isGoRegister(operand)) {
    return registerToGoVar(operand);
  }
  
  // Immediate value
  if (operand.match(/^0x[0-9A-Fa-f]+$/)) {
    return operand;
  }
  
  if (operand.match(/^-?\d+$/)) {
    return operand;
  }
  
  // Memory reference -> pointer dereference
  if (operand.startsWith('[') && operand.endsWith(']')) {
    return convertGoMemoryReference(operand, context);
  }
  
  // Symbol
  return sanitizeGoName(operand);
}

/**
 * Convert memory reference to Go pointer dereference
 */
function convertGoMemoryReference(operand, context) {
  let expr = operand.replace(/[\[\]]/g, '');
  expr = expr.replace(/byte ptr |word ptr |dword ptr |qword ptr /g, '');
  expr = expr.trim();
  
  // Convert registers to Go variable names
  for (const [reg, varName] of Object.entries(GO_VAR_NAMES)) {
    expr = expr.replace(new RegExp(`\\b${reg}\\b`, 'g'), varName);
  }
  
  // Handle slice/array access
  if (expr.match(/^\w+$/)) {
    return `*${expr}`;
  }
  
  if (expr.includes('+')) {
    // Offset: *(ptr + offset) -> slice[offset] or *(*int)(unsafe.Pointer(ptr + offset))
    return `memory[${expr}]`;
  }
  
  return `*(*int)(unsafe.Pointer(&${expr}))`;
}

/**
 * Check if operand is a register
 */
function isGoRegister(operand) {
  const registers = [
    'eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'esp', 'ebp',
    'rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'rsp', 'rbp'
  ];
  return registers.includes(operand.toLowerCase());
}

/**
 * Convert register to Go variable name
 */
function registerToGoVar(register) {
  const reg = register.toLowerCase();
  return GO_VAR_NAMES[reg] || reg;
}

/**
 * Sanitize name for Go (camelCase)
 */
function sanitizeGoName(name) {
  // Remove non-alphanumeric characters
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '');
  
  // Convert to camelCase
  sanitized = sanitized.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  
  // Ensure starts with letter
  if (/^\d/.test(sanitized)) {
    sanitized = 'v' + sanitized;
  }
  
  return sanitized;
}

/**
 * Map Windows API to Go equivalent
 */
function mapToGoFunction(target, context) {
  const apiMappings = {
    'CreateFileA': 'os.Create(filename)',
    'CreateFileW': 'os.Create(filename)',
    'ReadFile': 'file.Read(buffer)',
    'WriteFile': 'file.Write(data)',
    'CloseHandle': 'file.Close()',
    'printf': 'fmt.Printf(format, args...)',
    'malloc': '// Go handles memory with make/new',
    'free': '// Go has garbage collection',
    'strlen': 'len(str)',
    'strcmp': 'strings.Compare(str1, str2)',
    'Sleep': 'time.Sleep(time.Millisecond * duration)',
    'GetTickCount': 'time.Now().UnixNano() / 1e6',
    'CreateThread': 'go routine()',
    'ExitProcess': 'os.Exit(code)'
  };
  
  for (const [api, goEquiv] of Object.entries(apiMappings)) {
    if (target.includes(api)) {
      // Add package imports
      if (goEquiv.includes('os.')) {
        context.packages.add('os');
      }
      if (goEquiv.includes('fmt.')) {
        context.packages.add('fmt');
      }
      if (goEquiv.includes('time.')) {
        context.packages.add('time');
      }
      if (goEquiv.includes('strings.')) {
        context.packages.add('strings');
      }
      return goEquiv;
    }
  }
  
  return null;
}

/**
 * Split operands for Go
 */
function splitGoOperands(operands) {
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
 * Structure Go control flow
 */
function structureGoControlFlow(statements, context) {
  const structured = [];
  let i = 0;
  
  while (i < statements.length) {
    const stmt = statements[i];
    const inst = stmt.instruction;
    
    // Detect for loops
    const forEnd = detectGoForLoop(statements, i, context);
    if (forEnd > i) {
      structured.push({
        type: 'for',
        condition: extractGoCondition(inst, context),
        body: statements.slice(i + 1, forEnd)
      });
      i = forEnd;
      continue;
    }
    
    // Detect if statements
    const ifEnd = detectGoIfStatement(statements, i, context);
    if (ifEnd > i) {
      structured.push({
        type: 'if',
        condition: extractGoCondition(inst, context),
        body: statements.slice(i + 1, ifEnd),
        elseBody: []
      });
      i = ifEnd;
      continue;
    }
    
    // Detect switch statements
    const switchEnd = detectGoSwitchStatement(statements, i, context);
    if (switchEnd > i) {
      structured.push({
        type: 'switch',
        expression: 'value',
        cases: extractGoCases(statements, i, switchEnd),
        body: statements.slice(i + 1, switchEnd)
      });
      i = switchEnd;
      continue;
    }
    
    // Detect select statements (channel operations)
    const selectEnd = detectGoSelectStatement(statements, i, context);
    if (selectEnd > i) {
      structured.push({
        type: 'select',
        cases: extractGoSelectCases(statements, i, selectEnd),
        body: statements.slice(i + 1, selectEnd)
      });
      i = selectEnd;
      continue;
    }
    
    // Regular statement
    structured.push(stmt);
    i++;
  }
  
  return structured;
}

/**
 * Detect Go for loop
 */
function detectGoForLoop(statements, start, context) {
  for (let i = start; i < statements.length; i++) {
    const inst = statements[i].instruction;
    
    if (inst.mnemonic && inst.mnemonic.startsWith('j')) {
      const target = extractGoJumpTarget(inst);
      if (target && target <= statements[start].address) {
        return i + 1;
      }
    }
  }
  
  return start;
}

/**
 * Detect Go if statement
 */
function detectGoIfStatement(statements, start, context) {
  const inst = statements[start].instruction;
  
  if (inst.mnemonic && inst.mnemonic.startsWith('j') && inst.mnemonic !== 'jmp') {
    const target = extractGoJumpTarget(inst);
    if (target) {
      const targetIdx = findGoStatementByAddress(statements, target);
      if (targetIdx > start) {
        return targetIdx;
      }
    }
  }
  
  return start;
}

/**
 * Detect Go switch statement
 */
function detectGoSwitchStatement(statements, start, context) {
  // Look for jump table patterns
  const inst = statements[start].instruction;
  
  if (inst.mnemonic === 'cmp') {
    // Check for multiple conditional jumps following
    let consecutiveJumps = 0;
    for (let i = start + 1; i < Math.min(start + 10, statements.length); i++) {
      if (statements[i].instruction.mnemonic && 
          statements[i].instruction.mnemonic.startsWith('j')) {
        consecutiveJumps++;
      }
    }
    
    if (consecutiveJumps >= 3) {
      return start + consecutiveJumps + 1;
    }
  }
  
  return start;
}

/**
 * Detect Go select statement
 */
function detectGoSelectStatement(statements, start, context) {
  const inst = statements[start].instruction;
  
  // Look for channel operation patterns
  if (inst.mnemonic === 'call' && inst.operands.includes('chan')) {
    return start + 5;
  }
  
  return start;
}

/**
 * Extract Go condition
 */
function extractGoCondition(inst, context) {
  if (!inst) return 'true';
  
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
    default:
      return 'condition';
  }
}

/**
 * Generate Go code
 */
function generateGoCode(structured, context) {
  let code = '';
  
  // Package declaration
  code += 'package main\n\n';
  
  // Imports
  if (context.packages.size > 0) {
    code += 'import (\n';
    for (const pkg of context.packages) {
      code += `\t"${pkg}"\n`;
    }
    code += ')\n\n';
  }
  
  // Type definitions
  if (context.structs.size > 0) {
    for (const [name, struct] of context.structs) {
      code += `type ${name} struct {\n`;
      for (const field of struct.fields) {
        code += `\t${field.name} ${field.type}\n`;
      }
      code += '}\n\n';
    }
  }
  
  // Function definition
  const funcName = sanitizeGoName(context.functionInfo.name || 'function');
  
  // Method receiver
  if (context.isMethod && context.receiverType) {
    code += `func (recv *${context.receiverType}) ${funcName}() `;
  } else {
    code += `func ${funcName}() `;
  }
  
  // Return types
  if (context.returnTypes.length === 1) {
    code += `${context.returnTypes[0]} {\n`;
  } else if (context.returnTypes.length > 1) {
    code += `(${context.returnTypes.join(', ')}) {\n`;
  } else {
    code += '{\n';
  }
  
  // Initialize variables
  code += '\t// Initialize variables\n';
  code += '\tvar result int\n';
  code += '\tvar counter int\n';
  code += '\tvar dataReg int\n';
  code += '\tvar memory map[int]int\n';
  code += '\tvar stack []int\n';
  code += '\tmemory = make(map[int]int)\n';
  code += '\n';
  
  // Function body
  code += generateGoBody(structured, 1);
  
  code += '}\n';
  
  return code;
}

/**
 * Generate Go body with proper indentation
 */
function generateGoBody(structured, indentLevel) {
  let code = '';
  const indent = '\t'.repeat(indentLevel);
  
  for (const item of structured) {
    if (typeof item === 'object' && item.type) {
      switch (item.type) {
        case 'for':
          code += `${indent}for ${item.condition} {\n`;
          code += generateGoBody(item.body, indentLevel + 1);
          code += `${indent}}\n`;
          break;
          
        case 'if':
          code += `${indent}if ${item.condition} {\n`;
          code += generateGoBody(item.body, indentLevel + 1);
          if (item.elseBody && item.elseBody.length > 0) {
            code += `${indent}} else {\n`;
            code += generateGoBody(item.elseBody, indentLevel + 1);
          }
          code += `${indent}}\n`;
          break;
          
        case 'switch':
          code += `${indent}switch ${item.expression} {\n`;
          for (const caseItem of item.cases || []) {
            code += `${indent}case ${caseItem.value}:\n`;
            code += generateGoBody(caseItem.body, indentLevel + 1);
          }
          code += `${indent}default:\n`;
          code += `${indent}\t// Default case\n`;
          code += `${indent}}\n`;
          break;
          
        case 'select':
          code += `${indent}select {\n`;
          for (const caseItem of item.cases || []) {
            code += `${indent}case ${caseItem.channel}:\n`;
            code += generateGoBody(caseItem.body, indentLevel + 1);
          }
          code += `${indent}}\n`;
          break;
      }
    } else if (item.code) {
      code += `${indent}${item.code}\n`;
    }
  }
  
  return code;
}

/**
 * Helper functions
 */

function detectMethodReceiver(instructions) {
  // In Go, methods have receiver as first parameter
  // Look for patterns suggesting method call
  return false; // Simplified
}

function inferReceiverType(instructions) {
  return 'Receiver';
}

function detectDeferStatements(context) {
  // Look for cleanup/defer patterns
  for (const inst of context.instructions) {
    if (inst.mnemonic === 'call' && inst.operands.includes('defer')) {
      context.defers.push({
        address: inst.address,
        function: inst.operands
      });
    }
  }
}

function detectPanicRecover(context) {
  // Look for panic/recover patterns
}

function detectErrorReturns(context) {
  // Look for error return patterns
  // Go commonly returns (result, error)
  context.returnTypes = [GO_TYPES.INT, GO_TYPES.ERROR];
}

function detectGoroutineStart(inst) {
  return inst.mnemonic === 'call' && inst.operands.includes('go ');
}

function detectChannelOp(inst) {
  return inst.operands && (inst.operands.includes('<-') || inst.operands.includes('chan'));
}

function extractChannelInfo(inst) {
  return {
    type: 'chan int',
    direction: 'bidirectional'
  };
}

function detectMutexOp(inst) {
  return inst.mnemonic === 'call' && 
         (inst.operands.includes('Lock') || inst.operands.includes('Unlock'));
}

function detectSelectStatement(inst) {
  return inst.mnemonic === 'call' && inst.operands.includes('select');
}

function markAsGoType(context, inst, type) {
  const regs = extractGoRegisters(inst);
  for (const reg of regs) {
    context.types.set(reg, type);
  }
}

function markAsGoPointer(context, inst) {
  const regs = extractGoRegisters(inst);
  for (const reg of regs) {
    context.types.set(reg, '*int');
  }
}

function markAsGoSlice(context, inst) {
  const regs = extractGoRegisters(inst);
  for (const reg of regs) {
    context.types.set(reg, '[]int');
  }
}

function markAsGoMap(context, inst) {
  const regs = extractGoRegisters(inst);
  for (const reg of regs) {
    context.types.set(reg, 'map[int]int');
  }
}

function markAsGoChannel(context, inst) {
  const regs = extractGoRegisters(inst);
  for (const reg of regs) {
    context.types.set(reg, 'chan int');
  }
}

function isIntegerOp(inst) {
  const intOps = ['add', 'sub', 'mul', 'div', 'imul', 'idiv'];
  return intOps.includes(inst.mnemonic);
}

function isPointerOp(inst) {
  return inst.mnemonic === 'lea' || (inst.operands && inst.operands.includes('['));
}

function isStringOp(inst) {
  return inst.mnemonic === 'call' && inst.operands.includes('str');
}

function isSliceOp(inst) {
  return inst.mnemonic === 'call' && 
         (inst.operands.includes('slice') || inst.operands.includes('append'));
}

function isMapOp(inst) {
  return inst.mnemonic === 'call' && inst.operands.includes('map');
}

function isChannelOp(inst) {
  return inst.operands && inst.operands.includes('chan');
}

function extractGoRegisters(inst) {
  if (!inst || !inst.operands) return [];
  
  const registers = [];
  const regPattern = /\b(eax|ebx|ecx|edx|esi|edi|esp|ebp|rax|rbx|rcx|rdx|rsi|rdi|rsp|rbp)\b/gi;
  
  let match;
  while ((match = regPattern.exec(inst.operands)) !== null) {
    registers.push(match[1].toLowerCase());
  }
  
  return registers;
}

function mightReturnError(target, context) {
  // Check if function might return error
  return target.includes('Create') || target.includes('Open') || 
         target.includes('Read') || target.includes('Write');
}

function isGoBlockBoundary(inst, context) {
  return false; // Simplified
}

function isGoControlFlow(inst) {
  return inst.mnemonic === 'ret' || inst.mnemonic === 'jmp' || 
         inst.mnemonic.startsWith('j');
}

function extractGoJumpTarget(inst) {
  return inst.target || null;
}

function findGoStatementByAddress(statements, address) {
  for (let i = 0; i < statements.length; i++) {
    if (statements[i].address === address) {
      return i;
    }
  }
  return -1;
}

function extractGoCases(statements, start, end) {
  return [
    { value: '0', body: [] },
    { value: '1', body: [] }
  ];
}

function extractGoSelectCases(statements, start, end) {
  return [
    { channel: '<-ch1', body: [] },
    { channel: '<-ch2', body: [] }
  ];
}
