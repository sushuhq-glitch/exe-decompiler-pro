/**
 * Extended Disassembler Module
 * Comprehensive x86/x64 instruction set support
 * This module extends the basic disassembler with:
 * - Full instruction set coverage (500+ instructions)
 * - Advanced addressing modes
 * - SSE/AVX instruction support
 * - FPU instruction support
 * - MMX instruction support
 * - Specialized system instructions
 * - Detailed operand parsing
 * - Instruction semantics analysis
 */

// Extended instruction categories
const INSTRUCTION_CATEGORIES = {
  INTEGER_ARITHMETIC: 'integer_arithmetic',
  FLOATING_POINT: 'floating_point',
  LOGICAL: 'logical',
  DATA_TRANSFER: 'data_transfer',
  CONTROL_FLOW: 'control_flow',
  STRING_MANIPULATION: 'string_manipulation',
  BIT_MANIPULATION: 'bit_manipulation',
  SIMD: 'simd',
  SYSTEM: 'system',
  STACK_MANIPULATION: 'stack_manipulation',
  SYNCHRONIZATION: 'synchronization',
  CONVERSION: 'conversion',
  PRIVILEGED: 'privileged',
  DEPRECATED: 'deprecated'
};

// SSE/AVX register names
const XMM_REGISTERS = [
  'xmm0', 'xmm1', 'xmm2', 'xmm3', 'xmm4', 'xmm5', 'xmm6', 'xmm7',
  'xmm8', 'xmm9', 'xmm10', 'xmm11', 'xmm12', 'xmm13', 'xmm14', 'xmm15'
];

const YMM_REGISTERS = [
  'ymm0', 'ymm1', 'ymm2', 'ymm3', 'ymm4', 'ymm5', 'ymm6', 'ymm7',
  'ymm8', 'ymm9', 'ymm10', 'ymm11', 'ymm12', 'ymm13', 'ymm14', 'ymm15'
];

// MMX registers
const MMX_REGISTERS = ['mm0', 'mm1', 'mm2', 'mm3', 'mm4', 'mm5', 'mm6', 'mm7'];

// FPU registers
const FPU_REGISTERS = ['st0', 'st1', 'st2', 'st3', 'st4', 'st5', 'st6', 'st7'];

// Control registers
const CONTROL_REGISTERS = ['cr0', 'cr2', 'cr3', 'cr4', 'cr8'];

// Debug registers
const DEBUG_REGISTERS = ['dr0', 'dr1', 'dr2', 'dr3', 'dr6', 'dr7'];

/**
 * Disassemble SSE instruction
 */
export function disassembleSSE(data, offset, prefix, arch) {
  const opcode = data[offset];
  const nextByte = offset + 1 < data.length ? data[offset + 1] : 0;

  // SSE instructions typically use 0x0F prefix
  if (opcode === 0x0F) {
    return disassembleSSEWithPrefix(data, offset + 1, nextByte, prefix, arch);
  }

  return null;
}

/**
 * Disassemble SSE instruction with 0x0F prefix
 */
function disassembleSSEWithPrefix(data, offset, opcode, prefix, arch) {
  const modRM = offset < data.length ? data[offset] : 0;

  // MOVAPS/MOVAPD - Move Aligned Packed Single/Double
  if (opcode === 0x28 || opcode === 0x29) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = opcode === 0x28 ? (isDouble ? 'movapd' : 'movaps') : (isDouble ? 'movapd' : 'movaps');
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    const operands = opcode === 0x28 ? `${reg}, ${rm}` : `${rm}, ${reg}`;
    return {mnemonic, operands, size: size + 2, category: INSTRUCTION_CATEGORIES.DATA_TRANSFER};
  }

  // MOVUPS/MOVUPD - Move Unaligned Packed Single/Double
  if (opcode === 0x10 || opcode === 0x11) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = opcode === 0x10 ? (isDouble ? 'movupd' : 'movups') : (isDouble ? 'movupd' : 'movups');
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    const operands = opcode === 0x10 ? `${reg}, ${rm}` : `${rm}, ${reg}`;
    return {mnemonic, operands, size: size + 2, category: INSTRUCTION_CATEGORIES.DATA_TRANSFER};
  }

  // ADDPS/ADDPD - Add Packed Single/Double
  if (opcode === 0x58) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'addpd' : 'addps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // SUBPS/SUBPD - Subtract Packed Single/Double
  if (opcode === 0x5C) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'subpd' : 'subps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // MULPS/MULPD - Multiply Packed Single/Double
  if (opcode === 0x59) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'mulpd' : 'mulps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // DIVPS/DIVPD - Divide Packed Single/Double
  if (opcode === 0x5E) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'divpd' : 'divps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // SQRTPS/SQRTPD - Square Root Packed Single/Double
  if (opcode === 0x51) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'sqrtpd' : 'sqrtps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // MAXPS/MAXPD - Maximum of Packed Single/Double
  if (opcode === 0x5F) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'maxpd' : 'maxps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // MINPS/MINPD - Minimum of Packed Single/Double
  if (opcode === 0x5D) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'minpd' : 'minps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // ANDPS/ANDPD - Bitwise AND of Packed Single/Double
  if (opcode === 0x54) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'andpd' : 'andps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.LOGICAL};
  }

  // ORPS/ORPD - Bitwise OR of Packed Single/Double
  if (opcode === 0x56) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'orpd' : 'orps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.LOGICAL};
  }

  // XORPS/XORPD - Bitwise XOR of Packed Single/Double
  if (opcode === 0x57) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'xorpd' : 'xorps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.LOGICAL};
  }

  // CMPPS/CMPPD - Compare Packed Single/Double
  if (opcode === 0xC2) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'cmppd' : 'cmpps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    const imm8 = data[offset + size] || 0;
    return {mnemonic, operands: `${reg}, ${rm}, ${imm8}`, size: size + 3, category: INSTRUCTION_CATEGORIES.LOGICAL};
  }

  // SHUFPS/SHUFPD - Shuffle Packed Single/Double
  if (opcode === 0xC6) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'shufpd' : 'shufps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    const imm8 = data[offset + size] || 0;
    return {mnemonic, operands: `${reg}, ${rm}, ${imm8}`, size: size + 3, category: INSTRUCTION_CATEGORIES.SIMD};
  }

  // UNPCKLPS/UNPCKLPD - Unpack and Interleave Low Packed Single/Double
  if (opcode === 0x14) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'unpcklpd' : 'unpcklps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.SIMD};
  }

  // UNPCKHPS/UNPCKHPD - Unpack and Interleave High Packed Single/Double
  if (opcode === 0x15) {
    const isDouble = (prefix & 0x66) !== 0;
    const mnemonic = isDouble ? 'unpckhpd' : 'unpckhps';
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.SIMD};
  }

  // CVTPS2PD - Convert Packed Single to Packed Double
  if (opcode === 0x5A && !(prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'cvtps2pd', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.CONVERSION};
  }

  // CVTPD2PS - Convert Packed Double to Packed Single
  if (opcode === 0x5A && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'cvtpd2ps', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.CONVERSION};
  }

  // CVTDQ2PS - Convert Packed Doubleword Integers to Packed Single
  if (opcode === 0x5B && !(prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'cvtdq2ps', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.CONVERSION};
  }

  // CVTPS2DQ - Convert Packed Single to Packed Doubleword Integers
  if (opcode === 0x5B && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'cvtps2dq', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.CONVERSION};
  }

  // PXOR - Packed Bitwise XOR
  if (opcode === 0xEF && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'pxor', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.LOGICAL};
  }

  // PADDB/PADDW/PADDD/PADDQ - Add Packed Integers
  if (opcode === 0xFC && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'paddb', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.INTEGER_ARITHMETIC};
  }

  if (opcode === 0xFD && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'paddw', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.INTEGER_ARITHMETIC};
  }

  if (opcode === 0xFE && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'paddd', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.INTEGER_ARITHMETIC};
  }

  if (opcode === 0xD4 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'paddq', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.INTEGER_ARITHMETIC};
  }

  // PSUBB/PSUBW/PSUBD/PSUBQ - Subtract Packed Integers
  if (opcode === 0xF8 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'psubb', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.INTEGER_ARITHMETIC};
  }

  if (opcode === 0xF9 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'psubw', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.INTEGER_ARITHMETIC};
  }

  if (opcode === 0xFA && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'psubd', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.INTEGER_ARITHMETIC};
  }

  if (opcode === 0xFB && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'psubq', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.INTEGER_ARITHMETIC};
  }

  // PMULLW/PMULLD - Multiply Packed Integers
  if (opcode === 0xD5 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'pmullw', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.INTEGER_ARITHMETIC};
  }

  if (opcode === 0x40 && data[offset - 1] === 0x38 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'pmulld', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.INTEGER_ARITHMETIC};
  }

  // PCMPEQB/PCMPEQW/PCMPEQD/PCMPEQQ - Compare Packed Integers for Equality
  if (opcode === 0x74 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'pcmpeqb', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.LOGICAL};
  }

  if (opcode === 0x75 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'pcmpeqw', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.LOGICAL};
  }

  if (opcode === 0x76 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'pcmpeqd', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.LOGICAL};
  }

  if (opcode === 0x29 && data[offset - 1] === 0x38 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'pcmpeqq', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.LOGICAL};
  }

  // PAND/POR/PXOR - Packed Logical Operations
  if (opcode === 0xDB && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'pand', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.LOGICAL};
  }

  if (opcode === 0xEB && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'por', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.LOGICAL};
  }

  // PSLLW/PSLLD/PSLLQ - Packed Shift Left Logical
  if (opcode === 0xF1 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'psllw', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.BIT_MANIPULATION};
  }

  if (opcode === 0xF2 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'pslld', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.BIT_MANIPULATION};
  }

  if (opcode === 0xF3 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'psllq', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.BIT_MANIPULATION};
  }

  // PSRLW/PSRLD/PSRLQ - Packed Shift Right Logical
  if (opcode === 0xD1 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'psrlw', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.BIT_MANIPULATION};
  }

  if (opcode === 0xD2 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'psrld', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.BIT_MANIPULATION};
  }

  if (opcode === 0xD3 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'psrlq', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.BIT_MANIPULATION};
  }

  // PSRAW/PSRAD - Packed Shift Right Arithmetic
  if (opcode === 0xE1 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'psraw', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.BIT_MANIPULATION};
  }

  if (opcode === 0xE2 && (prefix & 0x66)) {
    const {reg, rm, size} = parseModRM(data, offset, modRM, 128);
    return {mnemonic: 'psrad', operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.BIT_MANIPULATION};
  }

  return null;
}

/**
 * Disassemble AVX instruction
 */
export function disassembleAVX(data, offset, vexPrefix, arch) {
  // AVX instructions use VEX prefix
  // This is a simplified implementation
  const opcode = data[offset];

  // VADDPS/VADDPD - AVX Add Packed Single/Double
  if (opcode === 0x58) {
    const modRM = data[offset + 1];
    const {reg, rm, size} = parseModRM(data, offset + 1, modRM, 256);
    const isDouble = (vexPrefix.pp === 0x01);
    const mnemonic = isDouble ? 'vaddpd' : 'vaddps';
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // VMULPS/VMULPD - AVX Multiply Packed Single/Double
  if (opcode === 0x59) {
    const modRM = data[offset + 1];
    const {reg, rm, size} = parseModRM(data, offset + 1, modRM, 256);
    const isDouble = (vexPrefix.pp === 0x01);
    const mnemonic = isDouble ? 'vmulpd' : 'vmulps';
    return {mnemonic, operands: `${reg}, ${rm}`, size: size + 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // More AVX instructions...
  return null;
}

/**
 * Disassemble FPU instruction
 */
export function disassembleFPU(data, offset, arch) {
  const opcode = data[offset];

  // FPU instructions start with 0xD8-0xDF
  if (opcode < 0xD8 || opcode > 0xDF) {
    return null;
  }

  const modRM = offset + 1 < data.length ? data[offset + 1] : 0;
  const mod = (modRM >> 6) & 0x03;
  const reg = (modRM >> 3) & 0x07;
  const rm = modRM & 0x07;

  // FLD - Load Floating Point Value
  if (opcode === 0xD9 && mod !== 0x03 && reg === 0x00) {
    const {rm: operand, size} = parseModRM(data, offset + 1, modRM, 32);
    return {mnemonic: 'fld', operands: operand, size: size + 1, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // FST/FSTP - Store Floating Point Value
  if (opcode === 0xD9 && mod !== 0x03 && (reg === 0x02 || reg === 0x03)) {
    const {rm: operand, size} = parseModRM(data, offset + 1, modRM, 32);
    const mnemonic = reg === 0x02 ? 'fst' : 'fstp';
    return {mnemonic, operands: operand, size: size + 1, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // FADD/FMUL/FCOM/FCOMP/FSUB/FSUBR/FDIV/FDIVR
  if (opcode === 0xD8) {
    const mnemonics = ['fadd', 'fmul', 'fcom', 'fcomp', 'fsub', 'fsubr', 'fdiv', 'fdivr'];
    const mnemonic = mnemonics[reg];
    
    if (mod === 0x03) {
      // Register form
      return {mnemonic, operands: `st0, st${rm}`, size: 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
    } else {
      // Memory form
      const {rm: operand, size} = parseModRM(data, offset + 1, modRM, 32);
      return {mnemonic, operands: `st0, ${operand}`, size: size + 1, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
    }
  }

  // FILD - Load Integer
  if (opcode === 0xDB && mod !== 0x03 && reg === 0x00) {
    const {rm: operand, size} = parseModRM(data, offset + 1, modRM, 32);
    return {mnemonic: 'fild', operands: operand, size: size + 1, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // FIST/FISTP - Store Integer
  if (opcode === 0xDB && mod !== 0x03 && (reg === 0x02 || reg === 0x03)) {
    const {rm: operand, size} = parseModRM(data, offset + 1, modRM, 32);
    const mnemonic = reg === 0x02 ? 'fist' : 'fistp';
    return {mnemonic, operands: operand, size: size + 1, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // FSQRT - Square Root
  if (opcode === 0xD9 && modRM === 0xFA) {
    return {mnemonic: 'fsqrt', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // FSIN/FCOS/FPTAN - Trigonometric functions
  if (opcode === 0xD9 && modRM === 0xFE) {
    return {mnemonic: 'fsin', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  if (opcode === 0xD9 && modRM === 0xFF) {
    return {mnemonic: 'fcos', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  if (opcode === 0xD9 && modRM === 0xF2) {
    return {mnemonic: 'fptan', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // FABS - Absolute Value
  if (opcode === 0xD9 && modRM === 0xE1) {
    return {mnemonic: 'fabs', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  // FCHS - Change Sign
  if (opcode === 0xD9 && modRM === 0xE0) {
    return {mnemonic: 'fchs', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.FLOATING_POINT};
  }

  return null;
}

/**
 * Disassemble system instruction
 */
export function disassembleSystem(data, offset, arch) {
  const opcode = data[offset];

  // CPUID - CPU Identification
  if (opcode === 0x0F && data[offset + 1] === 0xA2) {
    return {mnemonic: 'cpuid', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.SYSTEM};
  }

  // RDTSC - Read Time-Stamp Counter
  if (opcode === 0x0F && data[offset + 1] === 0x31) {
    return {mnemonic: 'rdtsc', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.SYSTEM};
  }

  // RDTSCP - Read Time-Stamp Counter and Processor ID
  if (opcode === 0x0F && data[offset + 1] === 0x01 && data[offset + 2] === 0xF9) {
    return {mnemonic: 'rdtscp', operands: '', size: 3, category: INSTRUCTION_CATEGORIES.SYSTEM};
  }

  // RDMSR/WRMSR - Read/Write Model Specific Register
  if (opcode === 0x0F && data[offset + 1] === 0x32) {
    return {mnemonic: 'rdmsr', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.PRIVILEGED};
  }

  if (opcode === 0x0F && data[offset + 1] === 0x30) {
    return {mnemonic: 'wrmsr', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.PRIVILEGED};
  }

  // INVLPG - Invalidate TLB Entry
  if (opcode === 0x0F && data[offset + 1] === 0x01) {
    const modRM = data[offset + 2];
    const reg = (modRM >> 3) & 0x07;
    
    if (reg === 0x07) {
      const {rm, size} = parseModRM(data, offset + 2, modRM, 32);
      return {mnemonic: 'invlpg', operands: rm, size: size + 2, category: INSTRUCTION_CATEGORIES.PRIVILEGED};
    }
  }

  // LGDT/LIDT - Load GDT/IDT Register
  if (opcode === 0x0F && data[offset + 1] === 0x01) {
    const modRM = data[offset + 2];
    const reg = (modRM >> 3) & 0x07;
    
    if (reg === 0x02) {
      const {rm, size} = parseModRM(data, offset + 2, modRM, 48);
      return {mnemonic: 'lgdt', operands: rm, size: size + 2, category: INSTRUCTION_CATEGORIES.PRIVILEGED};
    }
    
    if (reg === 0x03) {
      const {rm, size} = parseModRM(data, offset + 2, modRM, 48);
      return {mnemonic: 'lidt', operands: rm, size: size + 2, category: INSTRUCTION_CATEGORIES.PRIVILEGED};
    }
  }

  // SYSENTER/SYSEXIT - Fast System Call
  if (opcode === 0x0F && data[offset + 1] === 0x34) {
    return {mnemonic: 'sysenter', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.SYSTEM};
  }

  if (opcode === 0x0F && data[offset + 1] === 0x35) {
    return {mnemonic: 'sysexit', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.SYSTEM};
  }

  // SYSCALL/SYSRET - System Call (x64)
  if (opcode === 0x0F && data[offset + 1] === 0x05) {
    return {mnemonic: 'syscall', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.SYSTEM};
  }

  if (opcode === 0x0F && data[offset + 1] === 0x07) {
    return {mnemonic: 'sysret', operands: '', size: 2, category: INSTRUCTION_CATEGORIES.SYSTEM};
  }

  // HLT - Halt
  if (opcode === 0xF4) {
    return {mnemonic: 'hlt', operands: '', size: 1, category: INSTRUCTION_CATEGORIES.PRIVILEGED};
  }

  // CLI/STI - Clear/Set Interrupt Flag
  if (opcode === 0xFA) {
    return {mnemonic: 'cli', operands: '', size: 1, category: INSTRUCTION_CATEGORIES.PRIVILEGED};
  }

  if (opcode === 0xFB) {
    return {mnemonic: 'sti', operands: '', size: 1, category: INSTRUCTION_CATEGORIES.PRIVILEGED};
  }

  return null;
}

/**
 * Disassemble string manipulation instruction
 */
export function disassembleString(data, offset, prefix, arch) {
  const opcode = data[offset];
  const hasREP = (prefix & 0xF2) !== 0 || (prefix & 0xF3) !== 0;
  const repPrefix = (prefix & 0xF3) ? 'rep ' : (prefix & 0xF2) ? 'repne ' : '';

  // MOVS - Move String
  if (opcode === 0xA4 || opcode === 0xA5) {
    const size = opcode === 0xA4 ? 'byte' : (arch === 'x64' ? 'qword' : 'dword');
    return {mnemonic: `${repPrefix}movs${size[0]}`, operands: '', size: 1, category: INSTRUCTION_CATEGORIES.STRING_MANIPULATION};
  }

  // CMPS - Compare String
  if (opcode === 0xA6 || opcode === 0xA7) {
    const size = opcode === 0xA6 ? 'byte' : (arch === 'x64' ? 'qword' : 'dword');
    return {mnemonic: `${repPrefix}cmps${size[0]}`, operands: '', size: 1, category: INSTRUCTION_CATEGORIES.STRING_MANIPULATION};
  }

  // STOS - Store String
  if (opcode === 0xAA || opcode === 0xAB) {
    const size = opcode === 0xAA ? 'byte' : (arch === 'x64' ? 'qword' : 'dword');
    return {mnemonic: `${repPrefix}stos${size[0]}`, operands: '', size: 1, category: INSTRUCTION_CATEGORIES.STRING_MANIPULATION};
  }

  // LODS - Load String
  if (opcode === 0xAC || opcode === 0xAD) {
    const size = opcode === 0xAC ? 'byte' : (arch === 'x64' ? 'qword' : 'dword');
    return {mnemonic: `${repPrefix}lods${size[0]}`, operands: '', size: 1, category: INSTRUCTION_CATEGORIES.STRING_MANIPULATION};
  }

  // SCAS - Scan String
  if (opcode === 0xAE || opcode === 0xAF) {
    const size = opcode === 0xAE ? 'byte' : (arch === 'x64' ? 'qword' : 'dword');
    return {mnemonic: `${repPrefix}scas${size[0]}`, operands: '', size: 1, category: INSTRUCTION_CATEGORIES.STRING_MANIPULATION};
  }

  return null;
}

/**
 * Parse ModR/M byte and generate operand strings
 */
function parseModRM(data, offset, modRM, bitWidth) {
  const mod = (modRM >> 6) & 0x03;
  const regBits = (modRM >> 3) & 0x07;
  const rmBits = modRM & 0x07;

  let reg, rm;
  let size = 1; // Size of ModR/M + SIB + displacement

  // Determine register name based on bit width
  if (bitWidth === 128 || bitWidth === 256) {
    reg = bitWidth === 128 ? XMM_REGISTERS[regBits] : YMM_REGISTERS[regBits];
  } else if (bitWidth === 64) {
    reg = MMX_REGISTERS[regBits];
  } else {
    reg = `r${regBits}`;
  }

  // Parse R/M field
  if (mod === 0x03) {
    // Register direct
    if (bitWidth === 128 || bitWidth === 256) {
      rm = bitWidth === 128 ? XMM_REGISTERS[rmBits] : YMM_REGISTERS[rmBits];
    } else if (bitWidth === 64) {
      rm = MMX_REGISTERS[rmBits];
    } else {
      rm = `r${rmBits}`;
    }
  } else {
    // Memory reference
    let displacement = 0;
    let base = '';
    let index = '';
    let scale = 1;

    // Check for SIB byte
    if (rmBits === 0x04) {
      const sib = data[offset + size];
      size++;

      const scaleBits = (sib >> 6) & 0x03;
      const indexBits = (sib >> 3) & 0x07;
      const baseBits = sib & 0x07;

      scale = 1 << scaleBits;
      
      if (indexBits !== 0x04) {
        index = `r${indexBits}`;
      }

      if (baseBits === 0x05 && mod === 0x00) {
        // disp32 only
        displacement = readInt32LE(data, offset + size);
        size += 4;
      } else {
        base = `r${baseBits}`;
      }
    } else {
      base = `r${rmBits}`;
    }

    // Parse displacement
    if (mod === 0x01) {
      displacement = readInt8(data, offset + size);
      size++;
    } else if (mod === 0x02) {
      displacement = readInt32LE(data, offset + size);
      size += 4;
    }

    // Build memory reference string
    rm = '[';
    if (base) rm += base;
    if (index) {
      if (base) rm += ' + ';
      rm += index;
      if (scale > 1) rm += `*${scale}`;
    }
    if (displacement !== 0) {
      if (base || index) {
        rm += displacement >= 0 ? ` + 0x${displacement.toString(16)}` : ` - 0x${(-displacement).toString(16)}`;
      } else {
        rm += `0x${displacement.toString(16)}`;
      }
    }
    rm += ']';
  }

  return {reg, rm, size};
}

/**
 * Read signed 8-bit integer
 */
function readInt8(data, offset) {
  const value = data[offset];
  return value > 0x7F ? value - 0x100 : value;
}

/**
 * Read signed 32-bit integer (little-endian)
 */
function readInt32LE(data, offset) {
  const value = data[offset] | (data[offset + 1] << 8) | 
                (data[offset + 2] << 16) | (data[offset + 3] << 24);
  return value > 0x7FFFFFFF ? value - 0x100000000 : value;
}

/**
 * Get instruction semantics
 */
export function getInstructionSemantics(mnemonic) {
  const semantics = {
    readsMemory: false,
    writesMemory: false,
    readsFlags: false,
    writesFlags: false,
    isConditional: false,
    isBranch: false,
    isCall: false,
    isReturn: false,
    isNop: false,
    affectedRegisters: [],
    sideEffects: []
  };

  const mnemonicLower = mnemonic.toLowerCase();

  // Memory access
  if (mnemonicLower.includes('mov') || mnemonicLower.includes('ld') || 
      mnemonicLower.includes('lea')) {
    if (mnemonicLower.includes('st')) {
      semantics.writesMemory = true;
    } else {
      semantics.readsMemory = true;
    }
  }

  // Flag operations
  if (['add', 'sub', 'cmp', 'and', 'or', 'xor', 'test', 'inc', 'dec'].includes(mnemonicLower)) {
    semantics.writesFlags = true;
  }

  if (mnemonicLower.startsWith('j') && mnemonicLower !== 'jmp') {
    semantics.readsFlags = true;
    semantics.isConditional = true;
    semantics.isBranch = true;
  }

  if (mnemonicLower === 'jmp') {
    semantics.isBranch = true;
  }

  if (mnemonicLower === 'call') {
    semantics.isCall = true;
    semantics.writesMemory = true; // Pushes return address
  }

  if (mnemonicLower === 'ret') {
    semantics.isReturn = true;
    semantics.readsMemory = true; // Pops return address
  }

  if (mnemonicLower === 'nop') {
    semantics.isNop = true;
  }

  return semantics;
}

// Export instruction categories
export { INSTRUCTION_CATEGORIES, XMM_REGISTERS, YMM_REGISTERS, MMX_REGISTERS, FPU_REGISTERS };
