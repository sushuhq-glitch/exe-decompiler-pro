/**
 * Go Decompiler - Convert assembly to Go code
 * Generates idiomatic Go with proper error handling
 */

export function decompileToGo(instructions, peData, functionInfo) {
  const ctx = {
    code: [],
    indent: 0,
    vars: new Map(),
    peData,
    functionInfo
  };

  generateFunctionHeader(ctx);
  generateVariables(ctx, instructions);

  for (let i = 0; i < instructions.length; i++) {
    const instr = instructions[i];
    processInstruction(ctx, instr);
  }

  ctx.indent = 0;
  ctx.code.push('}');

  return ctx.code.join('\n');
}

function generateFunctionHeader(ctx) {
  const funcName = goizeName(ctx.functionInfo?.name || 'Function');
  
  ctx.code.push('package main');
  ctx.code.push('');
  ctx.code.push('// ' + funcName);
  if (ctx.functionInfo?.address) {
    ctx.code.push(`// Address: 0x${ctx.functionInfo.address.toString(16)}`);
  }
  ctx.code.push('// Decompiled from assembly');
  ctx.code.push(`func ${funcName}() error {`);
  ctx.indent = 1;
}

function generateVariables(ctx, instructions) {
  const registers = ['eax', 'ebx', 'ecx', 'edx'];
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

  if (usedRegs.size > 0) {
    addLine(ctx, '// Register variables');
    for (const reg of usedRegs) {
      addLine(ctx, `var ${reg} uint32`);
    }
    addLine(ctx, '');
  }
}

function processInstruction(ctx, instr) {
  if (typeof instr !== 'string') return;
  
  const line = instr.trim();
  if (!line) return;

  addLine(ctx, `// ${line}`);

  const parts = line.split(/\s+/);
  const opcode = parts[0]?.toLowerCase();

  switch (opcode) {
    case 'mov':
      const ops = parts.slice(1).join(' ').split(',').map(s => s.trim());
      if (ops.length === 2) {
        addLine(ctx, `${ops[0]} = ${ops[1]}`);
      }
      break;
    case 'call':
      addLine(ctx, `${goizeName(parts[1])}()`);
      break;
    case 'ret':
      addLine(ctx, 'return nil');
      break;
    default:
      addLine(ctx, `// TODO: ${opcode}`);
  }
}

function goizeName(name) {
  // Capitalize first letter for exported functions
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, '_');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function addLine(ctx, line) {
  const indent = '\t'.repeat(ctx.indent);
  ctx.code.push(indent + line);
}

export function generateCompleteGo(functions, peData) {
  let code = [];
  
  code.push('package main');
  code.push('');
  code.push('import (');
  code.push('\t"fmt"');
  code.push('\t"syscall"');
  code.push('\t"unsafe"');
  code.push(')');
  code.push('');
  code.push('func main() error {');
  code.push('\tfmt.Println("Decompiled program")');
  code.push('\treturn nil');
  code.push('}');
  code.push('');

  for (const func of functions) {
    code.push(func.code || '// Function code not available');
    code.push('');
  }

  return code.join('\n');
}
