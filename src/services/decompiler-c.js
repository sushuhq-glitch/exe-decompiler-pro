/**
 * C Decompiler - Convert assembly to C code
 * Generates proper C code with Windows API types and patterns
 */

/**
 * Decompile to C code
 * @param {Array} instructions - Assembly instructions
 * @param {Object} peData - PE file data
 * @param {Object} functionInfo - Function metadata
 * @returns {string} C code
 */
export function decompileToC(instructions, peData, functionInfo) {
  const ctx = {
    code: [],
    indent: 0,
    vars: new Map(),
    labels: new Map(),
    peData,
    functionInfo
  };

  // Generate function header
  generateFunctionHeader(ctx);

  // Generate variable declarations
  generateVariableDeclarations(ctx, instructions);

  // Process instructions
  for (let i = 0; i < instructions.length; i++) {
    const instr = instructions[i];
    processInstruction(ctx, instr, i);
  }

  // Generate function footer
  generateFunctionFooter(ctx);

  return ctx.code.join('\n');
}

/**
 * Generate function header
 */
function generateFunctionHeader(ctx) {
  const funcName = ctx.functionInfo?.name || 'sub_' + (ctx.functionInfo?.address || '0').toString(16);
  
  ctx.code.push('/**');
  ctx.code.push(` * Function: ${funcName}`);
  if (ctx.functionInfo?.address) {
    ctx.code.push(` * Address: 0x${ctx.functionInfo.address.toString(16)}`);
  }
  ctx.code.push(' * Decompiled from assembly');
  ctx.code.push(' */');
  ctx.code.push(`void ${funcName}() {`);
  ctx.indent = 1;
}

/**
 * Generate variable declarations
 */
function generateVariableDeclarations(ctx, instructions) {
  const registers = new Set(['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'esp', 'ebp']);
  
  // Detect used registers
  const usedRegs = new Set();
  for (const instr of instructions) {
    if (typeof instr === 'string') {
      for (const reg of registers) {
        if (instr.includes(reg)) {
          usedRegs.add(reg);
        }
      }
    }
  }

  // Generate register variables
  if (usedRegs.size > 0) {
    addLine(ctx, '// Register variables');
    for (const reg of usedRegs) {
      addLine(ctx, `DWORD ${reg} = 0;`);
      ctx.vars.set(reg, 'DWORD');
    }
    addLine(ctx, '');
  }

  // Generate stack frame variables
  if (usedRegs.has('ebp') || usedRegs.has('esp')) {
    addLine(ctx, '// Stack frame');
    addLine(ctx, 'DWORD local_var[256];');
    addLine(ctx, '');
  }
}

/**
 * Process single instruction
 */
function processInstruction(ctx, instr, index) {
  if (typeof instr !== 'string') return;

  const line = instr.trim();
  if (!line) return;

  // Add comment with original assembly
  addLine(ctx, `// ${line}`);

  // Parse instruction
  const parts = line.split(/\s+/);
  const opcode = parts[0]?.toLowerCase();

  switch (opcode) {
    case 'mov':
      handleMov(ctx, parts.slice(1).join(' '));
      break;
    case 'push':
      handlePush(ctx, parts[1]);
      break;
    case 'pop':
      handlePop(ctx, parts[1]);
      break;
    case 'call':
      handleCall(ctx, parts[1]);
      break;
    case 'jmp':
    case 'je':
    case 'jne':
    case 'jz':
    case 'jnz':
    case 'jg':
    case 'jl':
      handleJump(ctx, opcode, parts[1]);
      break;
    case 'cmp':
    case 'test':
      handleCompare(ctx, parts.slice(1).join(' '));
      break;
    case 'add':
    case 'sub':
    case 'mul':
    case 'div':
    case 'and':
    case 'or':
    case 'xor':
      handleArithmetic(ctx, opcode, parts.slice(1).join(' '));
      break;
    case 'ret':
    case 'retn':
      handleReturn(ctx);
      break;
    case 'nop':
      addLine(ctx, '// NOP');
      break;
    default:
      addLine(ctx, `// TODO: ${opcode}`);
  }
}

/**
 * Handle MOV instruction
 */
function handleMov(ctx, operands) {
  const [dest, src] = parseOperands(operands);
  if (dest && src) {
    addLine(ctx, `${dest} = ${src};`);
  }
}

/**
 * Handle PUSH instruction
 */
function handlePush(ctx, operand) {
  addLine(ctx, `// PUSH ${operand}`);
}

/**
 * Handle POP instruction
 */
function handlePop(ctx, operand) {
  if (operand) {
    addLine(ctx, `${operand} = stack_pop();`);
  }
}

/**
 * Handle CALL instruction
 */
function handleCall(ctx, target) {
  // Try to resolve function name
  const funcName = resolveFunctionName(target, ctx.peData);
  addLine(ctx, `${funcName}();`);
}

/**
 * Handle jump instructions
 */
function handleJump(ctx, opcode, target) {
  const condition = getJumpCondition(opcode);
  
  if (opcode === 'jmp') {
    addLine(ctx, `goto label_${target};`);
  } else {
    addLine(ctx, `if (${condition}) {`);
    ctx.indent++;
    addLine(ctx, `goto label_${target};`);
    ctx.indent--;
    addLine(ctx, `}`);
  }
}

/**
 * Handle compare instructions
 */
function handleCompare(ctx, operands) {
  const [op1, op2] = parseOperands(operands);
  if (op1 && op2) {
    addLine(ctx, `// Compare: ${op1} with ${op2}`);
  }
}

/**
 * Handle arithmetic operations
 */
function handleArithmetic(ctx, opcode, operands) {
  const [dest, src] = parseOperands(operands);
  if (dest && src) {
    const operator = getArithmeticOperator(opcode);
    addLine(ctx, `${dest} ${operator}= ${src};`);
  } else if (dest) {
    // Unary operation
    addLine(ctx, `${dest} = ${opcode}(${dest});`);
  }
}

/**
 * Handle return instruction
 */
function handleReturn(ctx) {
  addLine(ctx, 'return;');
}

/**
 * Generate function footer
 */
function generateFunctionFooter(ctx) {
  ctx.indent = 0;
  ctx.code.push('}');
}

/**
 * Parse operands
 */
function parseOperands(operands) {
  const parts = operands.split(',').map(s => s.trim());
  return parts.map(cleanOperand);
}

/**
 * Clean operand for C code
 */
function cleanOperand(op) {
  // Remove brackets for memory access
  if (op.startsWith('[') && op.endsWith(']')) {
    const inner = op.slice(1, -1);
    return `*(DWORD*)&${inner}`;
  }
  
  // Convert hex to C format
  if (op.startsWith('0x') || /^[0-9A-Fa-f]+h$/.test(op)) {
    const hex = op.replace('h', '');
    return '0x' + hex;
  }
  
  return op;
}

/**
 * Resolve function name from address
 */
function resolveFunctionName(address, peData) {
  // Try to find in imports
  if (peData?.imports) {
    for (const dll of peData.imports) {
      for (const func of dll.functions) {
        if (func.address === address || func.name === address) {
          return func.name;
        }
      }
    }
  }
  
  // Return generic name
  return `sub_${address}`;
}

/**
 * Get jump condition
 */
function getJumpCondition(opcode) {
  const conditions = {
    je: 'equal',
    jne: '!equal',
    jz: 'zero',
    jnz: '!zero',
    jg: 'greater',
    jl: 'less'
  };
  return conditions[opcode] || 'true';
}

/**
 * Get arithmetic operator
 */
function getArithmeticOperator(opcode) {
  const operators = {
    add: '+',
    sub: '-',
    mul: '*',
    div: '/',
    and: '&',
    or: '|',
    xor: '^'
  };
  return operators[opcode] || '+';
}

/**
 * Add line with indentation
 */
function addLine(ctx, line) {
  const indent = '  '.repeat(ctx.indent);
  ctx.code.push(indent + line);
}

/**
 * Generate complete C file with headers
 */
export function generateCompleteC(functions, peData) {
  let code = [];
  
  // Add headers
  code.push('/**');
  code.push(' * Decompiled C Code');
  code.push(' * Generated by EXE Decompiler Pro');
  code.push(' */');
  code.push('');
  code.push('#include <windows.h>');
  code.push('#include <stdio.h>');
  code.push('#include <stdlib.h>');
  code.push('');
  code.push('// Type definitions');
  code.push('typedef unsigned char BYTE;');
  code.push('typedef unsigned short WORD;');
  code.push('typedef unsigned long DWORD;');
  code.push('typedef void* HANDLE;');
  code.push('');

  // Add function prototypes
  code.push('// Function prototypes');
  for (const func of functions) {
    const name = func.name || `sub_${func.address?.toString(16)}`;
    code.push(`void ${name}();`);
  }
  code.push('');

  // Add main function
  code.push('int main(int argc, char* argv[]) {');
  code.push('  // Entry point');
  code.push('  return 0;');
  code.push('}');
  code.push('');

  // Add all functions
  for (const func of functions) {
    code.push('');
    code.push(func.code || '// Function code not available');
  }

  return code.join('\n');
}
