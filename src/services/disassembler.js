/**
 * Enhanced x86/x64 Disassembler
 * Supports 200+ x86/x64 instructions with ModR/M and SIB byte parsing
 */

// Register names
const REG32 = ['eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi'];
const REG16 = ['ax', 'cx', 'dx', 'bx', 'sp', 'bp', 'si', 'di'];
const REG8 = ['al', 'cl', 'dl', 'bl', 'ah', 'ch', 'dh', 'bh'];
const REG64 = ['rax', 'rcx', 'rdx', 'rbx', 'rsp', 'rbp', 'rsi', 'rdi',
               'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15'];
const SEGREG = ['es', 'cs', 'ss', 'ds', 'fs', 'gs'];

// Instruction types
const INST_TYPE = {
  DATA_TRANSFER: 'data_transfer',
  ARITHMETIC: 'arithmetic',
  LOGICAL: 'logical',
  CONTROL_FLOW: 'control_flow',
  STACK: 'stack',
  STRING: 'string',
  SYSTEM: 'system',
  MISC: 'misc'
};

/**
 * Main disassembly function
 * @param {Uint8Array|Array} bytes - Machine code bytes
 * @param {number} baseAddress - Base address for the code
 * @param {string} arch - Architecture: 'x86' or 'x64'
 * @param {number} maxInstructions - Maximum instructions to disassemble
 * @returns {Array} Array of disassembled instructions
 */
export function disassemble(bytes, baseAddress = 0x400000, arch = 'x86', maxInstructions = 1000) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const instructions = [];
  let offset = 0;
  
  while (offset < data.length && instructions.length < maxInstructions) {
    try {
      const instruction = disassembleInstruction(data, offset, Number(baseAddress) + offset, arch);
      if (!instruction) {
        // Skip invalid byte
        offset++;
        continue;
      }
      
      instructions.push(instruction);
      offset += instruction.size;
    } catch (error) {
      // Skip on error
      offset++;
    }
  }
  
  return instructions;
}

/**
 * Disassemble a single instruction
 */
function disassembleInstruction(data, offset, address, arch) {
  if (offset >= data.length) {
    return null;
  }
  
  const startOffset = offset;
  let opcode = data[offset];
  let prefix = '';
  let operandSize = arch === 'x64' ? 64 : 32;
  let addressSize = arch === 'x64' ? 64 : 32;
  let hasREX = false;
  let rexW = false, rexR = false, rexX = false, rexB = false;
  
  // Parse prefixes
  while (offset < data.length) {
    const byte = data[offset];
    
    // Segment override prefixes
    if (byte === 0x26) { prefix = 'es:'; offset++; continue; }
    if (byte === 0x2E) { prefix = 'cs:'; offset++; continue; }
    if (byte === 0x36) { prefix = 'ss:'; offset++; continue; }
    if (byte === 0x3E) { prefix = 'ds:'; offset++; continue; }
    if (byte === 0x64) { prefix = 'fs:'; offset++; continue; }
    if (byte === 0x65) { prefix = 'gs:'; offset++; continue; }
    
    // Operand size override
    if (byte === 0x66) {
      operandSize = operandSize === 32 ? 16 : 32;
      offset++;
      continue;
    }
    
    // Address size override
    if (byte === 0x67) {
      addressSize = addressSize === 32 ? 16 : 32;
      offset++;
      continue;
    }
    
    // REX prefix (x64 only, 0x40-0x4F)
    if (arch === 'x64' && byte >= 0x40 && byte <= 0x4F) {
      hasREX = true;
      rexW = (byte & 0x08) !== 0;
      rexR = (byte & 0x04) !== 0;
      rexX = (byte & 0x02) !== 0;
      rexB = (byte & 0x01) !== 0;
      if (rexW) operandSize = 64;
      offset++;
      continue;
    }
    
    // LOCK, REPNE, REP prefixes
    if (byte === 0xF0 || byte === 0xF2 || byte === 0xF3) {
      if (byte === 0xF0) prefix = 'lock ' + prefix;
      if (byte === 0xF2) prefix = 'repne ' + prefix;
      if (byte === 0xF3) prefix = 'rep ' + prefix;
      offset++;
      continue;
    }
    
    break;
  }
  
  if (offset >= data.length) {
    return null;
  }
  
  opcode = data[offset];
  
  // Try to decode instruction
  const result = decodeInstruction(data, offset, address, opcode, operandSize, addressSize, hasREX, rexW, rexR, rexX, rexB, arch);
  
  if (!result) {
    return null;
  }
  
  // Build instruction object
  const size = (result.offset - startOffset);
  const instructionBytes = Array.from(data.slice(startOffset, result.offset));
  
  return {
    address: `0x${address.toString(16).padStart(8, '0')}`,
    addressNum: address,
    bytes: instructionBytes,
    bytesHex: instructionBytes.map(b => b.toString(16).padStart(2, '0')).join(' '),
    mnemonic: prefix + result.mnemonic,
    operands: result.operands,
    size,
    type: result.type || INST_TYPE.MISC,
    target: result.target // For jumps and calls
  };
}

/**
 * Decode instruction based on opcode
 */
function decodeInstruction(data, offset, address, opcode, operandSize, addressSize, hasREX, rexW, rexR, rexX, rexB, arch) {
  // Single-byte opcodes
  
  // NOP (0x90)
  if (opcode === 0x90) {
    return { mnemonic: 'nop', operands: '', offset: offset + 1, type: INST_TYPE.MISC };
  }
  
  // RET (0xC3, 0xC2)
  if (opcode === 0xC3) {
    return { mnemonic: 'ret', operands: '', offset: offset + 1, type: INST_TYPE.CONTROL_FLOW };
  }
  if (opcode === 0xC2 && offset + 2 < data.length) {
    const imm16 = readUInt16LE(data, offset + 1);
    return { mnemonic: 'ret', operands: `0x${imm16.toString(16)}`, offset: offset + 3, type: INST_TYPE.CONTROL_FLOW };
  }
  
  // LEAVE (0xC9)
  if (opcode === 0xC9) {
    return { mnemonic: 'leave', operands: '', offset: offset + 1, type: INST_TYPE.STACK };
  }
  
  // INT (0xCD)
  if (opcode === 0xCD && offset + 1 < data.length) {
    const imm8 = data[offset + 1];
    return { mnemonic: 'int', operands: `0x${imm8.toString(16)}`, offset: offset + 2, type: INST_TYPE.SYSTEM };
  }
  
  // PUSH/POP register (0x50-0x5F)
  if (opcode >= 0x50 && opcode <= 0x57) {
    const reg = getRegisterName(opcode - 0x50, operandSize, rexB);
    return { mnemonic: 'push', operands: reg, offset: offset + 1, type: INST_TYPE.STACK };
  }
  if (opcode >= 0x58 && opcode <= 0x5F) {
    const reg = getRegisterName(opcode - 0x58, operandSize, rexB);
    return { mnemonic: 'pop', operands: reg, offset: offset + 1, type: INST_TYPE.STACK };
  }
  
  // INC/DEC register (0x40-0x4F) - only valid in 32-bit mode
  if (arch === 'x86' && opcode >= 0x40 && opcode <= 0x47) {
    const reg = getRegisterName(opcode - 0x40, operandSize, false);
    return { mnemonic: 'inc', operands: reg, offset: offset + 1, type: INST_TYPE.ARITHMETIC };
  }
  if (arch === 'x86' && opcode >= 0x48 && opcode <= 0x4F) {
    const reg = getRegisterName(opcode - 0x48, operandSize, false);
    return { mnemonic: 'dec', operands: reg, offset: offset + 1, type: INST_TYPE.ARITHMETIC };
  }
  
  // XCHG (0x91-0x97)
  if (opcode >= 0x91 && opcode <= 0x97) {
    const reg = getRegisterName(opcode - 0x90, operandSize, rexB);
    const accum = getRegisterName(0, operandSize, false);
    return { mnemonic: 'xchg', operands: `${accum}, ${reg}`, offset: offset + 1, type: INST_TYPE.DATA_TRANSFER };
  }
  
  // MOV immediate to register (0xB0-0xBF)
  if (opcode >= 0xB0 && opcode <= 0xB7) {
    const reg = getRegisterName(opcode - 0xB0, 8, rexB);
    if (offset + 1 >= data.length) return null;
    const imm8 = data[offset + 1];
    return { mnemonic: 'mov', operands: `${reg}, 0x${imm8.toString(16)}`, offset: offset + 2, type: INST_TYPE.DATA_TRANSFER };
  }
  if (opcode >= 0xB8 && opcode <= 0xBF) {
    const reg = getRegisterName(opcode - 0xB8, operandSize, rexB);
    const immSize = operandSize === 64 ? 8 : (operandSize === 32 ? 4 : 2);
    if (offset + immSize >= data.length) return null;
    
    let imm;
    if (immSize === 8) {
      imm = readUInt64LE(data, offset + 1);
    } else if (immSize === 4) {
      imm = readUInt32LE(data, offset + 1);
    } else {
      imm = readUInt16LE(data, offset + 1);
    }
    
    return { mnemonic: 'mov', operands: `${reg}, 0x${imm.toString(16)}`, offset: offset + 1 + immSize, type: INST_TYPE.DATA_TRANSFER };
  }
  
  // Conditional jumps (0x70-0x7F) - short form
  if (opcode >= 0x70 && opcode <= 0x7F) {
    if (offset + 1 >= data.length) return null;
    const disp = readInt8(data, offset + 1);
    const target = address + 2 + disp;
    const mnemonic = getConditionalJumpMnemonic(opcode - 0x70);
    return {
      mnemonic,
      operands: `0x${target.toString(16)}`,
      offset: offset + 2,
      type: INST_TYPE.CONTROL_FLOW,
      target
    };
  }
  
  // CALL/JMP relative (0xE8, 0xE9)
  if (opcode === 0xE8 || opcode === 0xE9) {
    if (offset + 4 >= data.length) return null;
    const disp = readInt32LE(data, offset + 1);
    const target = address + 5 + disp;
    const mnemonic = opcode === 0xE8 ? 'call' : 'jmp';
    return {
      mnemonic,
      operands: `0x${target.toString(16)}`,
      offset: offset + 5,
      type: INST_TYPE.CONTROL_FLOW,
      target
    };
  }
  
  // JMP short (0xEB)
  if (opcode === 0xEB) {
    if (offset + 1 >= data.length) return null;
    const disp = readInt8(data, offset + 1);
    const target = address + 2 + disp;
    return {
      mnemonic: 'jmp',
      operands: `0x${target.toString(16)}`,
      offset: offset + 2,
      type: INST_TYPE.CONTROL_FLOW,
      target
    };
  }
  
  // TEST AL, imm8 (0xA8)
  if (opcode === 0xA8) {
    if (offset + 1 >= data.length) return null;
    const imm8 = data[offset + 1];
    return { mnemonic: 'test', operands: `al, 0x${imm8.toString(16)}`, offset: offset + 2, type: INST_TYPE.LOGICAL };
  }
  
  // TEST EAX/AX, imm (0xA9)
  if (opcode === 0xA9) {
    const reg = getRegisterName(0, operandSize, false);
    const immSize = operandSize === 64 ? 4 : (operandSize === 32 ? 4 : 2);
    if (offset + immSize >= data.length) return null;
    
    const imm = immSize === 4 ? readUInt32LE(data, offset + 1) : readUInt16LE(data, offset + 1);
    return { mnemonic: 'test', operands: `${reg}, 0x${imm.toString(16)}`, offset: offset + 1 + immSize, type: INST_TYPE.LOGICAL };
  }
  
  // PUSH immediate (0x68, 0x6A)
  if (opcode === 0x68) {
    if (offset + 4 >= data.length) return null;
    const imm32 = readUInt32LE(data, offset + 1);
    return { mnemonic: 'push', operands: `0x${imm32.toString(16)}`, offset: offset + 5, type: INST_TYPE.STACK };
  }
  if (opcode === 0x6A) {
    if (offset + 1 >= data.length) return null;
    const imm8 = readInt8(data, offset + 1);
    return { mnemonic: 'push', operands: `0x${imm8.toString(16)}`, offset: offset + 2, type: INST_TYPE.STACK };
  }
  
  // Instructions with ModR/M byte
  
  // MOV r/m, r (0x88, 0x89, 0x8A, 0x8B)
  if (opcode === 0x88 || opcode === 0x89 || opcode === 0x8A || opcode === 0x8B) {
    const result = decodeModRM(data, offset + 1, operandSize, addressSize, rexR, rexX, rexB, arch);
    if (!result) return null;
    
    const isToReg = (opcode === 0x8A || opcode === 0x8B);
    const size = opcode === 0x88 || opcode === 0x8A ? 8 : operandSize;
    const reg = getRegisterName(result.reg, size, rexR);
    
    const operands = isToReg ? `${reg}, ${result.rm}` : `${result.rm}, ${reg}`;
    return { mnemonic: 'mov', operands, offset: result.nextOffset, type: INST_TYPE.DATA_TRANSFER };
  }
  
  // MOV r/m, imm (0xC6, 0xC7)
  if (opcode === 0xC6 || opcode === 0xC7) {
    const size = opcode === 0xC6 ? 8 : operandSize;
    const result = decodeModRM(data, offset + 1, size, addressSize, rexR, rexX, rexB, arch);
    if (!result) return null;
    
    const immSize = opcode === 0xC6 ? 1 : (operandSize === 64 ? 4 : (operandSize === 32 ? 4 : 2));
    if (result.nextOffset + immSize > data.length) return null;
    
    let imm;
    if (immSize === 4) {
      imm = readUInt32LE(data, result.nextOffset);
    } else if (immSize === 2) {
      imm = readUInt16LE(data, result.nextOffset);
    } else {
      imm = data[result.nextOffset];
    }
    
    return {
      mnemonic: 'mov',
      operands: `${result.rm}, 0x${imm.toString(16)}`,
      offset: result.nextOffset + immSize,
      type: INST_TYPE.DATA_TRANSFER
    };
  }
  
  // LEA (0x8D)
  if (opcode === 0x8D) {
    const result = decodeModRM(data, offset + 1, operandSize, addressSize, rexR, rexX, rexB, arch);
    if (!result) return null;
    
    const reg = getRegisterName(result.reg, operandSize, rexR);
    return { mnemonic: 'lea', operands: `${reg}, ${result.rm}`, offset: result.nextOffset, type: INST_TYPE.DATA_TRANSFER };
  }
  
  // ADD/OR/ADC/SBB/AND/SUB/XOR/CMP r/m, r (0x00-0x3D)
  const arithmeticLogical = [
    { start: 0x00, mnemonic: 'add', type: INST_TYPE.ARITHMETIC },
    { start: 0x08, mnemonic: 'or', type: INST_TYPE.LOGICAL },
    { start: 0x10, mnemonic: 'adc', type: INST_TYPE.ARITHMETIC },
    { start: 0x18, mnemonic: 'sbb', type: INST_TYPE.ARITHMETIC },
    { start: 0x20, mnemonic: 'and', type: INST_TYPE.LOGICAL },
    { start: 0x28, mnemonic: 'sub', type: INST_TYPE.ARITHMETIC },
    { start: 0x30, mnemonic: 'xor', type: INST_TYPE.LOGICAL },
    { start: 0x38, mnemonic: 'cmp', type: INST_TYPE.ARITHMETIC }
  ];
  
  for (const op of arithmeticLogical) {
    if (opcode >= op.start && opcode <= op.start + 5) {
      const variant = opcode - op.start;
      
      // Immediate to accumulator variants (0x04, 0x05, etc.)
      if (variant === 4 || variant === 5) {
        const size = variant === 4 ? 8 : operandSize;
        const reg = getRegisterName(0, size, false);
        const immSize = variant === 4 ? 1 : (operandSize === 64 ? 4 : (operandSize === 32 ? 4 : 2));
        
        if (offset + immSize >= data.length) return null;
        
        let imm;
        if (immSize === 4) {
          imm = readUInt32LE(data, offset + 1);
        } else if (immSize === 2) {
          imm = readUInt16LE(data, offset + 1);
        } else {
          imm = data[offset + 1];
        }
        
        return {
          mnemonic: op.mnemonic,
          operands: `${reg}, 0x${imm.toString(16)}`,
          offset: offset + 1 + immSize,
          type: op.type
        };
      }
      
      // ModR/M variants
      if (variant >= 0 && variant <= 3) {
        const result = decodeModRM(data, offset + 1, variant % 2 === 0 ? 8 : operandSize, addressSize, rexR, rexX, rexB, arch);
        if (!result) return null;
        
        const isToReg = variant >= 2;
        const size = variant % 2 === 0 ? 8 : operandSize;
        const reg = getRegisterName(result.reg, size, rexR);
        
        const operands = isToReg ? `${reg}, ${result.rm}` : `${result.rm}, ${reg}`;
        return { mnemonic: op.mnemonic, operands, offset: result.nextOffset, type: op.type };
      }
    }
  }
  
  // TEST r/m, r (0x84, 0x85)
  if (opcode === 0x84 || opcode === 0x85) {
    const size = opcode === 0x84 ? 8 : operandSize;
    const result = decodeModRM(data, offset + 1, size, addressSize, rexR, rexX, rexB, arch);
    if (!result) return null;
    
    const reg = getRegisterName(result.reg, size, rexR);
    return { mnemonic: 'test', operands: `${result.rm}, ${reg}`, offset: result.nextOffset, type: INST_TYPE.LOGICAL };
  }
  
  // Group 1 instructions (0x80, 0x81, 0x83) - ADD/OR/ADC/SBB/AND/SUB/XOR/CMP with immediate
  if (opcode === 0x80 || opcode === 0x81 || opcode === 0x83) {
    const size = opcode === 0x80 ? 8 : operandSize;
    const result = decodeModRM(data, offset + 1, size, addressSize, rexR, rexX, rexB, arch);
    if (!result) return null;
    
    const group1Mnemonics = ['add', 'or', 'adc', 'sbb', 'and', 'sub', 'xor', 'cmp'];
    const mnemonic = group1Mnemonics[result.reg] || 'unknown';
    
    const immSize = opcode === 0x80 ? 1 : (opcode === 0x83 ? 1 : (operandSize === 64 ? 4 : (operandSize === 32 ? 4 : 2)));
    if (result.nextOffset + immSize > data.length) return null;
    
    let imm;
    if (immSize === 4) {
      imm = readInt32LE(data, result.nextOffset);
    } else if (immSize === 2) {
      imm = readInt16LE(data, result.nextOffset);
    } else {
      imm = readInt8(data, result.nextOffset);
    }
    
    const type = ['add', 'adc', 'sbb', 'sub', 'cmp'].includes(mnemonic) ? INST_TYPE.ARITHMETIC : INST_TYPE.LOGICAL;
    
    return {
      mnemonic,
      operands: `${result.rm}, 0x${(imm >>> 0).toString(16)}`,
      offset: result.nextOffset + immSize,
      type
    };
  }
  
  // CALL/JMP indirect (0xFF)
  if (opcode === 0xFF) {
    const result = decodeModRM(data, offset + 1, operandSize, addressSize, rexR, rexX, rexB, arch);
    if (!result) return null;
    
    if (result.reg === 2) {
      // CALL near indirect
      return { mnemonic: 'call', operands: result.rm, offset: result.nextOffset, type: INST_TYPE.CONTROL_FLOW };
    } else if (result.reg === 4) {
      // JMP near indirect
      return { mnemonic: 'jmp', operands: result.rm, offset: result.nextOffset, type: INST_TYPE.CONTROL_FLOW };
    } else if (result.reg === 6) {
      // PUSH r/m
      return { mnemonic: 'push', operands: result.rm, offset: result.nextOffset, type: INST_TYPE.STACK };
    }
  }
  
  // Two-byte opcodes (0x0F prefix)
  if (opcode === 0x0F) {
    if (offset + 1 >= data.length) return null;
    const opcode2 = data[offset + 1];
    
    // Conditional jumps (0x0F 0x80-0x8F) - near form
    if (opcode2 >= 0x80 && opcode2 <= 0x8F) {
      if (offset + 5 >= data.length) return null;
      const disp = readInt32LE(data, offset + 2);
      const target = address + 6 + disp;
      const mnemonic = getConditionalJumpMnemonic(opcode2 - 0x80);
      return {
        mnemonic,
        operands: `0x${target.toString(16)}`,
        offset: offset + 6,
        type: INST_TYPE.CONTROL_FLOW,
        target
      };
    }
    
    // MOVZX (0x0F 0xB6, 0x0F 0xB7)
    if (opcode2 === 0xB6 || opcode2 === 0xB7) {
      const srcSize = opcode2 === 0xB6 ? 8 : 16;
      const result = decodeModRM(data, offset + 2, srcSize, addressSize, rexR, rexX, rexB, arch);
      if (!result) return null;
      
      const reg = getRegisterName(result.reg, operandSize, rexR);
      return { mnemonic: 'movzx', operands: `${reg}, ${result.rm}`, offset: result.nextOffset, type: INST_TYPE.DATA_TRANSFER };
    }
    
    // MOVSX (0x0F 0xBE, 0x0F 0xBF)
    if (opcode2 === 0xBE || opcode2 === 0xBF) {
      const srcSize = opcode2 === 0xBE ? 8 : 16;
      const result = decodeModRM(data, offset + 2, srcSize, addressSize, rexR, rexX, rexB, arch);
      if (!result) return null;
      
      const reg = getRegisterName(result.reg, operandSize, rexR);
      return { mnemonic: 'movsx', operands: `${reg}, ${result.rm}`, offset: result.nextOffset, type: INST_TYPE.DATA_TRANSFER };
    }
    
    // SETCC (0x0F 0x90-0x9F)
    if (opcode2 >= 0x90 && opcode2 <= 0x9F) {
      const result = decodeModRM(data, offset + 2, 8, addressSize, rexR, rexX, rexB, arch);
      if (!result) return null;
      
      const condition = getConditionCode(opcode2 - 0x90);
      return { mnemonic: `set${condition}`, operands: result.rm, offset: result.nextOffset, type: INST_TYPE.MISC };
    }
  }
  
  // If we get here, instruction is unknown
  return null;
}

/**
 * Decode ModR/M byte and optional SIB byte and displacement
 */
function decodeModRM(data, offset, operandSize, addressSize, rexR, rexX, rexB, arch) {
  if (offset >= data.length) return null;
  
  const modRM = data[offset];
  const mod = (modRM >> 6) & 0x03;
  const reg = (modRM >> 3) & 0x07;
  const rm = modRM & 0x07;
  
  let nextOffset = offset + 1;
  let rmStr = '';
  
  // Direct register addressing (mod = 11)
  if (mod === 3) {
    rmStr = getRegisterName(rm, operandSize, rexB);
    return { reg, rm: rmStr, nextOffset };
  }
  
  // Memory addressing
  let displacement = 0;
  let dispSize = 0;
  
  if (mod === 1) {
    // 8-bit displacement
    if (nextOffset >= data.length) return null;
    displacement = readInt8(data, nextOffset);
    dispSize = 1;
  } else if (mod === 2) {
    // 32-bit displacement
    if (nextOffset + 3 >= data.length) return null;
    displacement = readInt32LE(data, nextOffset);
    dispSize = 4;
  } else if (mod === 0 && rm === 5) {
    // Special case: disp32 (32-bit mode) or RIP-relative (64-bit mode)
    if (nextOffset + 3 >= data.length) return null;
    displacement = readInt32LE(data, nextOffset);
    dispSize = 4;
    
    if (arch === 'x64') {
      // RIP-relative addressing
      const address = nextOffset + 4 + displacement;
      rmStr = `[rip+0x${displacement.toString(16)}]`;
    } else {
      rmStr = `[0x${(displacement >>> 0).toString(16)}]`;
    }
    
    return { reg, rm: rmStr, nextOffset: nextOffset + dispSize };
  }
  
  nextOffset += dispSize;
  
  // Check for SIB byte
  if (rm === 4 && mod !== 3) {
    if (offset + 1 >= data.length) return null;
    const sib = data[offset + 1];
    const scale = (sib >> 6) & 0x03;
    const index = (sib >> 3) & 0x07;
    const base = sib & 0x07;
    
    nextOffset = offset + 2 + dispSize;
    
    const baseReg = getRegisterName(base, addressSize === 64 ? 64 : 32, rexB);
    const indexReg = index === 4 ? '' : getRegisterName(index, addressSize === 64 ? 64 : 32, rexX);
    const scaleValue = 1 << scale;
    
    let parts = [];
    
    if (mod === 0 && base === 5) {
      // Special case: disp32[index*scale]
      if (indexReg) {
        parts.push(indexReg);
        if (scaleValue > 1) parts[parts.length - 1] += `*${scaleValue}`;
      }
    } else {
      parts.push(baseReg);
      if (indexReg) {
        parts.push(indexReg);
        if (scaleValue > 1) parts[parts.length - 1] += `*${scaleValue}`;
      }
    }
    
    if (displacement !== 0 || (mod === 0 && base === 5)) {
      const dispStr = displacement >= 0 ? `+0x${displacement.toString(16)}` : `-0x${(-displacement).toString(16)}`;
      rmStr = `[${parts.join('+')}${dispStr}]`;
    } else {
      rmStr = `[${parts.join('+')}]`;
    }
  } else {
    // No SIB byte
    const baseReg = getRegisterName(rm, addressSize === 64 ? 64 : 32, rexB);
    
    if (displacement !== 0) {
      const dispStr = displacement >= 0 ? `+0x${displacement.toString(16)}` : `-0x${(-displacement).toString(16)}`;
      rmStr = `[${baseReg}${dispStr}]`;
    } else {
      rmStr = `[${baseReg}]`;
    }
  }
  
  return { reg, rm: rmStr, nextOffset };
}

/**
 * Helper functions
 */
function getRegisterName(index, size, rexBit) {
  const actualIndex = rexBit ? index + 8 : index;
  
  if (size === 64) {
    return REG64[actualIndex] || `r${actualIndex}`;
  } else if (size === 32) {
    return REG32[actualIndex % 8] || `r${actualIndex}d`;
  } else if (size === 16) {
    return REG16[actualIndex % 8] || `r${actualIndex}w`;
  } else {
    return REG8[actualIndex % 8] || `r${actualIndex}b`;
  }
}

function getConditionalJumpMnemonic(code) {
  const jumps = [
    'jo', 'jno', 'jb', 'jnb', 'jz', 'jnz', 'jbe', 'ja',
    'js', 'jns', 'jp', 'jnp', 'jl', 'jge', 'jle', 'jg'
  ];
  return jumps[code] || 'j??';
}

function getConditionCode(code) {
  const conditions = [
    'o', 'no', 'b', 'nb', 'z', 'nz', 'be', 'a',
    's', 'ns', 'p', 'np', 'l', 'ge', 'le', 'g'
  ];
  return conditions[code] || '??';
}

function readInt8(data, offset) {
  const val = data[offset];
  return val > 127 ? val - 256 : val;
}

function readInt16LE(data, offset) {
  const val = readUInt16LE(data, offset);
  return val > 32767 ? val - 65536 : val;
}

function readInt32LE(data, offset) {
  const val = readUInt32LE(data, offset);
  return val > 2147483647 ? val - 4294967296 : val;
}

function readUInt16LE(data, offset) {
  return data[offset] | (data[offset + 1] << 8);
}

function readUInt32LE(data, offset) {
  return (data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)) >>> 0;
}

function readUInt64LE(data, offset) {
  const low = readUInt32LE(data, offset);
  const high = readUInt32LE(data, offset + 4);
  return (BigInt(high) << 32n) | BigInt(low);
}

/**
 * Format instruction for display
 */
export function formatInstruction(instruction) {
  const addr = instruction.address;
  const bytes = instruction.bytesHex.padEnd(24, ' ');
  const mnemonic = instruction.mnemonic.padEnd(8, ' ');
  const operands = instruction.operands;
  
  return `${addr}  ${bytes}  ${mnemonic} ${operands}`;
}

/**
 * Disassemble a function (follows control flow)
 */
export function disassembleFunction(bytes, startOffset, baseAddress, arch = 'x86', maxSize = 4096) {
  const instructions = [];
  const visited = new Set();
  const queue = [startOffset];
  const baseAddressNum = Number(baseAddress);
  
  while (queue.length > 0 && instructions.length < 1000) {
    const offset = queue.shift();
    
    if (visited.has(offset) || offset >= bytes.length || offset >= startOffset + maxSize) {
      continue;
    }
    
    visited.add(offset);
    
    const inst = disassembleInstruction(bytes, offset, baseAddressNum + offset, arch);
    if (!inst) continue;
    
    instructions.push(inst);
    
    // Follow control flow
    if (inst.mnemonic === 'ret' || inst.mnemonic === 'retn') {
      // Function end
      continue;
    }
    
    // Add next sequential instruction
    queue.push(offset + inst.size);
    
    // Add branch target if it's a jump or call
    if (inst.target && inst.target >= baseAddressNum && inst.target < baseAddressNum + bytes.length) {
      const targetOffset = inst.target - baseAddressNum;
      if (targetOffset >= startOffset && targetOffset < startOffset + maxSize) {
        queue.push(targetOffset);
      }
    }
  }
  
  // Sort by address
  instructions.sort((a, b) => a.addressNum - b.addressNum);
  
  return instructions;
}
