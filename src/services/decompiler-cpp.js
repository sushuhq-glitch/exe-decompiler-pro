/**
 * C++ Decompiler Module
 * Converts x86/x64 assembly to C++ code
 * Supports classes, templates, STL, and modern C++ features
 */

/**
 * Decompile function to C++
 * @param {Array} instructions - Assembly instructions
 * @param {Object} peData - PE file data
 * @param {Object} functionInfo - Function metadata
 * @returns {Object} Decompiled C++ code
 */
export function decompileToCpp(instructions, peData, functionInfo = {}) {
  if (!instructions || instructions.length === 0) {
    return {
      code: '// No instructions to decompile\nvoid unknown() {\n    // empty\n}',
      language: 'cpp',
      success: true
    };
  }

  const funcName = sanitizeCppName(functionInfo.name || `Sub_${instructions[0].address?.slice(2) || '0'}`);
  
  // Analyze function structure for C++ patterns
  const analysis = analyzeCppFunction(instructions, peData);
  
  // Generate C++ function signature with modern features
  const signature = generateCppSignature(funcName, analysis);
  
  // Convert instructions to C++ statements
  const cppStatements = convertToCppStatements(instructions, analysis, peData);
  
  // Build control flow structures (if/else, while, for, range-for)
  const structuredCode = buildCppControlFlow(cppStatements, analysis);
  
  // Generate final C++ code
  const code = generateCppCode(signature, structuredCode, analysis);
  
  return {
    code,
    language: 'cpp',
    success: true,
    analysis
  };
}

/**
 * Sanitize function name for C++
 */
function sanitizeCppName(name) {
  // C++ naming conventions: PascalCase for types, camelCase for functions
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Make valid C++ identifier
  if (/^[0-9]/.test(sanitized)) {
    sanitized = `_${sanitized}`;
  }
  
  // Avoid C++ keywords
  const keywords = ['alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand',
                    'bitor', 'bool', 'break', 'case', 'catch', 'char', 'class',
                    'compl', 'const', 'constexpr', 'const_cast', 'continue', 'decltype',
                    'default', 'delete', 'do', 'double', 'dynamic_cast', 'else', 'enum',
                    'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend',
                    'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace',
                    'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or',
                    'or_eq', 'private', 'protected', 'public', 'register', 'reinterpret_cast',
                    'return', 'short', 'signed', 'sizeof', 'static', 'static_assert',
                    'static_cast', 'struct', 'switch', 'template', 'this', 'thread_local',
                    'throw', 'true', 'try', 'typedef', 'typeid', 'typename', 'union',
                    'unsigned', 'using', 'virtual', 'void', 'volatile', 'wchar_t',
                    'while', 'xor', 'xor_eq'];
  
  if (keywords.includes(sanitized.toLowerCase())) {
    sanitized = `_${sanitized}`;
  }
  
  return sanitized;
}

/**
 * Analyze function for C++ decompilation
 */
function analyzeCppFunction(instructions, peData) {
  const analysis = {
    params: [],
    returns: [],
    locals: new Map(),
    calls: [],
    loops: [],
    branches: [],
    stackVars: new Map(),
    registers: new Map(),
    usesSTL: false,
    usesExceptions: false,
    usesVirtualFunctions: false,
    usesTemplates: false,
    usesSmartPointers: false,
    className: null,
    memberFunction: false,
    isConstructor: false,
    isDestructor: false,
    isOperatorOverload: false,
    constMethod: false
  };
  
  const tracker = new CppRegisterTracker();
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    
    if (typeof inst === 'string') {
      const parts = inst.split(/\s+/);
      const mnemonic = parts[0];
      analyzeCppInstruction(mnemonic, parts.slice(1), analysis, tracker, peData);
    } else if (inst.mnemonic) {
      analyzeCppInstruction(inst.mnemonic, inst.operands?.split(',') || [], analysis, tracker, peData);
    }
  }
  
  // Detect C++ patterns from analysis
  detectCppPatterns(analysis, peData);
  
  return analysis;
}

/**
 * Analyze single instruction for C++ patterns
 */
function analyzeCppInstruction(mnemonic, operands, analysis, tracker, peData) {
  // Stack frame analysis
  if (mnemonic === 'push' && operands[0] === 'ebp') {
    analysis.hasProlog = true;
  } else if (mnemonic === 'mov' && operands[0] === 'ebp' && operands[1] === 'esp') {
    analysis.hasProlog = true;
  } else if (mnemonic === 'sub' && operands[0] === 'esp') {
    const size = parseInt(operands[1], 16) || parseInt(operands[1], 10) || 0;
    analysis.localSpaceSize = size;
  }
  
  // Return analysis
  if (mnemonic === 'ret' || mnemonic === 'retn') {
    analysis.returns.push({ type: 'auto' });
  }
  
  // Call analysis - detect C++ runtime calls
  if (mnemonic === 'call') {
    const target = operands[0] || '';
    analysis.calls.push({ target });
    
    // Detect STL usage
    if (target.includes('std::') || target.includes('vector') || target.includes('string') ||
        target.includes('map') || target.includes('list') || target.includes('set')) {
      analysis.usesSTL = true;
    }
    
    // Detect exception handling
    if (target.includes('throw') || target.includes('catch') || target.includes('CxxThrow')) {
      analysis.usesExceptions = true;
    }
    
    // Detect virtual function calls
    if (target.includes('vftable') || target.includes('vtable')) {
      analysis.usesVirtualFunctions = true;
    }
    
    // Detect smart pointers
    if (target.includes('unique_ptr') || target.includes('shared_ptr') || target.includes('weak_ptr')) {
      analysis.usesSmartPointers = true;
    }
  }
  
  // Conditional branches
  if (mnemonic.startsWith('j') && mnemonic !== 'jmp') {
    analysis.branches.push({ type: mnemonic, target: operands[0] });
  }
  
  // Track stack variables
  if (operands.some(op => op.includes('[ebp') || op.includes('[rbp'))) {
    const match = operands.join(' ').match(/\[(e|r)bp\s*([+-])\s*0x([0-9a-f]+)\]/i);
    if (match) {
      const offset = parseInt(match[3], 16) * (match[2] === '-' ? -1 : 1);
      if (!analysis.stackVars.has(offset)) {
        analysis.stackVars.set(offset, {
          offset,
          name: `var_${Math.abs(offset).toString(16)}`,
          type: 'auto',
          usages: 0
        });
      }
      analysis.stackVars.get(offset).usages++;
    }
  }
  
  // Detect 'this' pointer usage (ECX register on Windows x86)
  if (operands.includes('ecx') || operands.includes('rcx')) {
    if (mnemonic === 'mov' && operands[0] === 'ecx') {
      // Might be loading 'this' pointer
      analysis.memberFunction = true;
    }
  }
}

/**
 * Detect C++ specific patterns from analysis
 */
function detectCppPatterns(analysis, peData) {
  // Detect constructors/destructors from name
  const funcName = analysis.funcName || '';
  
  if (funcName.includes('ctor') || funcName.match(/^[A-Z]\w+::[A-Z]\w+$/)) {
    analysis.isConstructor = true;
    analysis.memberFunction = true;
  }
  
  if (funcName.includes('dtor') || funcName.includes('~')) {
    analysis.isDestructor = true;
    analysis.memberFunction = true;
  }
  
  // Detect operator overloads
  if (funcName.includes('operator')) {
    analysis.isOperatorOverload = true;
    analysis.memberFunction = true;
  }
  
  // Detect class name from member functions
  const classMatch = funcName.match(/^([A-Z]\w+)::/);
  if (classMatch) {
    analysis.className = classMatch[1];
    analysis.memberFunction = true;
  }
  
  // Detect template usage from calls
  if (analysis.calls.some(c => c.target.includes('<') && c.target.includes('>'))) {
    analysis.usesTemplates = true;
  }
}

/**
 * C++ Register Tracker
 */
class CppRegisterTracker {
  constructor() {
    this.registers = new Map();
    this.varCounter = 0;
    this.thisPointer = null;
  }
  
  getVar(register) {
    // Special handling for 'this' pointer
    if ((register === 'ecx' || register === 'rcx') && this.thisPointer) {
      return 'this';
    }
    
    if (!this.registers.has(register)) {
      this.registers.set(register, `var${this.varCounter++}`);
    }
    return this.registers.get(register);
  }
  
  setVar(register, value) {
    this.registers.set(register, value);
  }
  
  setThisPointer() {
    this.thisPointer = true;
  }
}

/**
 * Generate C++ function signature
 */
function generateCppSignature(name, analysis) {
  let signature = '';
  
  // Add class scope if member function
  if (analysis.className && !analysis.isConstructor && !analysis.isDestructor) {
    name = `${analysis.className}::${name}`;
  } else if (analysis.memberFunction && !analysis.className) {
    // Generic class name
    name = `ClassName::${name}`;
  }
  
  // Add template declaration if needed
  if (analysis.usesTemplates) {
    signature += 'template<typename T>\n';
  }
  
  // Constructor signature
  if (analysis.isConstructor) {
    const params = analysis.params.length > 0
      ? analysis.params.map(p => `${p.type || 'auto'} ${p.name}`).join(', ')
      : '';
    return signature + `${analysis.className || 'ClassName'}(${params})`;
  }
  
  // Destructor signature
  if (analysis.isDestructor) {
    return signature + `~${analysis.className || 'ClassName'}()`;
  }
  
  // Operator overload signature
  if (analysis.isOperatorOverload) {
    const op = extractOperator(name);
    const returnType = analysis.returns.length > 0 ? analysis.returns[0].type || 'auto' : 'auto';
    return signature + `${returnType} operator${op}(${generateParamList(analysis)})`;
  }
  
  // Regular function signature
  const returnType = analysis.returns.length > 0 ? analysis.returns[0].type || 'auto' : 'void';
  const params = generateParamList(analysis);
  const constQualifier = analysis.constMethod ? ' const' : '';
  
  return signature + `${returnType} ${name}(${params})${constQualifier}`;
}

/**
 * Extract operator from function name
 */
function extractOperator(name) {
  if (name.includes('operator+')) return '+';
  if (name.includes('operator-')) return '-';
  if (name.includes('operator*')) return '*';
  if (name.includes('operator/')) return '/';
  if (name.includes('operator=')) return '=';
  if (name.includes('operator[]')) return '[]';
  if (name.includes('operator()')) return '()';
  return '+';
}

/**
 * Generate parameter list
 */
function generateParamList(analysis) {
  if (analysis.params.length === 0) return '';
  
  return analysis.params.map(p => {
    const type = p.type || 'auto';
    const name = p.name || 'param';
    const ref = p.isReference ? '&' : '';
    const constQual = p.isConst ? 'const ' : '';
    return `${constQual}${type}${ref} ${name}`;
  }).join(', ');
}

/**
 * Convert assembly instructions to C++ statements
 */
function convertToCppStatements(instructions, analysis, peData) {
  const statements = [];
  const tracker = new CppRegisterTracker();
  
  // Set this pointer if member function
  if (analysis.memberFunction) {
    tracker.setThisPointer();
  }
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    let cppCode = null;
    
    if (typeof inst === 'string') {
      cppCode = convertStringInstructionToCpp(inst, tracker, analysis);
    } else {
      cppCode = convertInstructionObjectToCpp(inst, tracker, analysis, peData);
    }
    
    if (cppCode) {
      statements.push({
        address: inst.address || `0x${i.toString(16)}`,
        code: cppCode,
        original: inst
      });
    }
  }
  
  return statements;
}

/**
 * Convert string instruction to C++
 */
function convertStringInstructionToCpp(instStr, tracker, analysis) {
  const parts = instStr.trim().split(/\s+/);
  if (parts.length === 0) return null;
  
  const mnemonic = parts[0].toLowerCase();
  const operands = parts.slice(1).join(' ').split(',').map(s => s.trim());
  
  return convertMnemonicToCpp(mnemonic, operands, tracker, analysis);
}

/**
 * Convert instruction object to C++
 */
function convertInstructionObjectToCpp(inst, tracker, analysis, peData) {
  if (!inst.mnemonic) return null;
  
  const mnemonic = inst.mnemonic.toLowerCase();
  const operands = inst.operands ? inst.operands.split(',').map(s => s.trim()) : [];
  
  return convertMnemonicToCpp(mnemonic, operands, tracker, analysis);
}

/**
 * Convert mnemonic to C++ code
 */
function convertMnemonicToCpp(mnemonic, operands, tracker, analysis) {
  // Data movement
  if (mnemonic === 'mov' && operands.length >= 2) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    const src = convertOperandToCpp(operands[1], tracker, analysis);
    
    // Special case: initialize this pointer
    if (dest === 'this') {
      return '// this pointer initialized';
    }
    
    return `${dest} = ${src};`;
  }
  
  if (mnemonic === 'lea' && operands.length >= 2) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    const src = convertOperandToCpp(operands[1], tracker, analysis);
    return `${dest} = &(${src});`;
  }
  
  // Arithmetic operations
  if (mnemonic === 'add' && operands.length >= 2) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    const src = convertOperandToCpp(operands[1], tracker, analysis);
    return `${dest} += ${src};`;
  }
  
  if (mnemonic === 'sub' && operands.length >= 2) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    const src = convertOperandToCpp(operands[1], tracker, analysis);
    return `${dest} -= ${src};`;
  }
  
  if (mnemonic === 'mul' || mnemonic === 'imul') {
    if (operands.length >= 2) {
      const dest = convertOperandToCpp(operands[0], tracker, analysis);
      const src = convertOperandToCpp(operands[1], tracker, analysis);
      return `${dest} *= ${src};`;
    }
  }
  
  if (mnemonic === 'div' || mnemonic === 'idiv') {
    if (operands.length >= 1) {
      const divisor = convertOperandToCpp(operands[0], tracker, analysis);
      return `eax = eax / ${divisor};`;
    }
  }
  
  if (mnemonic === 'inc' && operands.length >= 1) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    return `++${dest};`;
  }
  
  if (mnemonic === 'dec' && operands.length >= 1) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    return `--${dest};`;
  }
  
  // Logical operations
  if (mnemonic === 'and' && operands.length >= 2) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    const src = convertOperandToCpp(operands[1], tracker, analysis);
    return `${dest} &= ${src};`;
  }
  
  if (mnemonic === 'or' && operands.length >= 2) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    const src = convertOperandToCpp(operands[1], tracker, analysis);
    return `${dest} |= ${src};`;
  }
  
  if (mnemonic === 'xor' && operands.length >= 2) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    const src = convertOperandToCpp(operands[1], tracker, analysis);
    if (dest === src) {
      return `${dest} = 0;`;
    }
    return `${dest} ^= ${src};`;
  }
  
  if (mnemonic === 'not' && operands.length >= 1) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    return `${dest} = ~${dest};`;
  }
  
  if (mnemonic === 'shl' && operands.length >= 2) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    const count = convertOperandToCpp(operands[1], tracker, analysis);
    return `${dest} <<= ${count};`;
  }
  
  if (mnemonic === 'shr' && operands.length >= 2) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    const count = convertOperandToCpp(operands[1], tracker, analysis);
    return `${dest} >>= ${count};`;
  }
  
  // Stack operations
  if (mnemonic === 'push' && operands.length >= 1) {
    const src = convertOperandToCpp(operands[0], tracker, analysis);
    if (analysis.usesSTL) {
      return `stack.push(${src});`;
    }
    return `// push ${src}`;
  }
  
  if (mnemonic === 'pop' && operands.length >= 1) {
    const dest = convertOperandToCpp(operands[0], tracker, analysis);
    if (analysis.usesSTL) {
      return `${dest} = stack.top(); stack.pop();`;
    }
    return `// pop ${dest}`;
  }
  
  // Comparison
  if (mnemonic === 'cmp' && operands.length >= 2) {
    const op1 = convertOperandToCpp(operands[0], tracker, analysis);
    const op2 = convertOperandToCpp(operands[1], tracker, analysis);
    return `// compare ${op1} with ${op2}`;
  }
  
  if (mnemonic === 'test' && operands.length >= 2) {
    const op1 = convertOperandToCpp(operands[0], tracker, analysis);
    const op2 = convertOperandToCpp(operands[1], tracker, analysis);
    return `// test ${op1} & ${op2}`;
  }
  
  // Control flow
  if (mnemonic === 'call' && operands.length >= 1) {
    const target = operands[0];
    const funcName = resolveCppFunctionName(target, analysis);
    
    // Member function call
    if (analysis.memberFunction && target.includes('::')) {
      return `${funcName}();`;
    }
    
    // STL function call
    if (funcName.includes('std::')) {
      return `${funcName}();`;
    }
    
    return `${funcName}();`;
  }
  
  if (mnemonic === 'ret' || mnemonic === 'retn') {
    if (analysis.isConstructor || analysis.isDestructor) {
      return '// return from constructor/destructor';
    }
    return 'return;';
  }
  
  if (mnemonic === 'jmp') {
    return `// goto ${operands[0] || 'label'}`;
  }
  
  // Conditional jumps
  const condJumps = {
    'je': '==', 'jz': '==',
    'jne': '!=', 'jnz': '!=',
    'jg': '>', 'jl': '<',
    'jge': '>=', 'jle': '<=',
    'ja': '>', 'jb': '<',
    'jae': '>=', 'jbe': '<='
  };
  
  if (condJumps[mnemonic]) {
    return `// if ${condJumps[mnemonic]} goto ${operands[0] || 'label'}`;
  }
  
  // Default
  return `// ${mnemonic} ${operands.join(', ')}`;
}

/**
 * Convert operand to C++ expression
 */
function convertOperandToCpp(operand, tracker, analysis) {
  if (!operand) return '0';
  
  operand = operand.trim();
  
  // Immediate values
  if (operand.startsWith('0x')) {
    return operand;
  }
  
  if (/^-?[0-9]+$/.test(operand)) {
    return operand;
  }
  
  // Memory references
  if (operand.includes('[')) {
    return convertMemoryReferenceToCpp(operand, tracker, analysis);
  }
  
  // Registers
  const registerMap = {
    'eax': 'eax', 'ebx': 'ebx', 'ecx': 'ecx', 'edx': 'edx',
    'esi': 'esi', 'edi': 'edi', 'esp': 'esp', 'ebp': 'ebp',
    'rax': 'rax', 'rbx': 'rbx', 'rcx': 'rcx', 'rdx': 'rdx',
    'rsi': 'rsi', 'rdi': 'rdi', 'rsp': 'rsp', 'rbp': 'rbp'
  };
  
  const regName = operand.toLowerCase();
  if (registerMap[regName]) {
    return tracker.getVar(registerMap[regName]);
  }
  
  return operand;
}

/**
 * Convert memory reference to C++
 */
function convertMemoryReferenceToCpp(operand, tracker, analysis) {
  let inner = operand.replace(/[\[\]]/g, '').trim();
  
  // Handle [ebp-0x4], [esp+0x8]
  const match = inner.match(/(\w+)\s*([+-])\s*(0x[0-9a-f]+|[0-9]+)/i);
  if (match) {
    const base = convertOperandToCpp(match[1], tracker, analysis);
    const op = match[2];
    const offset = match[3];
    
    if (base === 'ebp' || base === 'rbp') {
      // Local variable or member access
      if (analysis.memberFunction) {
        return `this->member_${offset}`;
      }
      return `local_${offset}`;
    }
    
    return `*(${base} ${op} ${offset})`;
  }
  
  // Simple dereference
  if (/^\w+$/.test(inner)) {
    const base = convertOperandToCpp(inner, tracker, analysis);
    return `*${base}`;
  }
  
  return `*reinterpret_cast<int*>(${inner})`;
}

/**
 * Resolve function name for C++
 */
function resolveCppFunctionName(target, analysis) {
  // Extract function name from mangled or decorated name
  if (target.includes('::')) {
    return target; // Already scoped
  }
  
  if (target.includes('?')) {
    // MSVC name mangling
    return demangleMSVC(target);
  }
  
  if (target.startsWith('_Z')) {
    // Itanium ABI name mangling
    return demangleItanium(target);
  }
  
  if (target.startsWith('0x')) {
    return `Func_${target.slice(2)}`;
  }
  
  return sanitizeCppName(target);
}

/**
 * Demangle MSVC decorated names (simplified)
 */
function demangleMSVC(name) {
  // Simplified MSVC demangling
  // Real demangling is very complex
  if (name.includes('?')) {
    // Extract class and function name
    const parts = name.split('@');
    if (parts.length >= 2) {
      return `${parts[1]}::${parts[0].replace('?', '')}`;
    }
  }
  return name;
}

/**
 * Demangle Itanium ABI names (simplified)
 */
function demangleItanium(name) {
  // Simplified Itanium ABI demangling
  // Real demangling is very complex
  if (name.startsWith('_Z')) {
    // Basic extraction
    return name.replace('_Z', '').replace(/\d+/g, '::');
  }
  return name;
}

/**
 * Build C++ control flow structures
 */
function buildCppControlFlow(statements, analysis) {
  const blocks = [];
  let currentBlock = [];
  
  for (const stmt of statements) {
    const code = stmt.code;
    
    // Detect control flow
    if (code.includes('// if') || code.includes('// goto')) {
      if (currentBlock.length > 0) {
        blocks.push({ type: 'linear', statements: currentBlock });
        currentBlock = [];
      }
      blocks.push({ type: 'control', statement: stmt });
    } else if (code.includes('return')) {
      currentBlock.push(stmt);
      blocks.push({ type: 'linear', statements: currentBlock });
      currentBlock = [];
    } else {
      currentBlock.push(stmt);
    }
  }
  
  if (currentBlock.length > 0) {
    blocks.push({ type: 'linear', statements: currentBlock });
  }
  
  return blocks;
}

/**
 * Generate final C++ code
 */
function generateCppCode(signature, structuredCode, analysis) {
  let code = '// Decompiled to C++\n';
  code += `// Analysis: ${analysis.calls.length} calls, ${analysis.branches.length} branches\n`;
  
  // Add required includes
  code += '\n// Required includes\n';
  code += '#include <cstdint>\n';
  
  if (analysis.usesSTL) {
    code += '#include <vector>\n';
    code += '#include <string>\n';
    code += '#include <algorithm>\n';
  }
  
  if (analysis.usesSmartPointers) {
    code += '#include <memory>\n';
  }
  
  if (analysis.usesExceptions) {
    code += '#include <exception>\n';
  }
  
  code += '\n';
  
  // Add namespace if needed
  if (analysis.usesSTL) {
    code += 'using namespace std;\n\n';
  }
  
  // Function signature
  code += `${signature} {\n`;
  
  // Constructor initialization list
  if (analysis.isConstructor && analysis.memberFunction) {
    code += '    // Constructor initialization\n';
  }
  
  // Declare local variables
  if (analysis.stackVars.size > 0) {
    code += '    // Local variables\n';
    for (const [offset, varInfo] of analysis.stackVars) {
      code += `    ${varInfo.type} ${varInfo.name};\n`;
    }
    code += '\n';
  }
  
  // Exception handling wrapper if needed
  if (analysis.usesExceptions) {
    code += '    try {\n';
  }
  
  const indent = analysis.usesExceptions ? '        ' : '    ';
  
  // Generate function body
  for (const block of structuredCode) {
    if (block.type === 'linear') {
      for (const stmt of block.statements) {
        code += `${indent}${stmt.code}\n`;
      }
    } else if (block.type === 'control') {
      code += `${indent}${block.statement.code}\n`;
    }
  }
  
  if (analysis.usesExceptions) {
    code += '    } catch (const std::exception& e) {\n';
    code += '        // Exception handling\n';
    code += '    }\n';
  }
  
  code += '}\n';
  
  return code;
}

/**
 * Batch decompile multiple functions to C++
 */
export function batchDecompileToCpp(functions, peData) {
  const results = [];
  
  for (const func of functions) {
    try {
      const result = decompileToCpp(func.instructions || [], peData, func);
      results.push({
        name: func.name,
        success: true,
        code: result.code
      });
    } catch (error) {
      results.push({
        name: func.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Generate complete C++ project
 */
export function generateCppProject(functions, peData, projectName) {
  let project = '// ' + projectName + ' - Decompiled to C++\n';
  project += '// Generated by EXE Decompiler Pro\n';
  project += '//\n';
  project += '// This is a decompilation of a Windows executable.\n';
  project += '// Some functionality may not be directly translatable to C++.\n\n';
  
  // Add includes
  project += '#include <iostream>\n';
  project += '#include <cstdint>\n';
  project += '#include <memory>\n';
  project += '#include <vector>\n';
  project += '#include <string>\n';
  project += '#include <exception>\n\n';
  
  project += 'using namespace std;\n\n';
  
  // Add utility classes
  project += '// Utility classes\n';
  project += 'class Memory {\n';
  project += 'public:\n';
  project += '    uint8_t* data;\n';
  project += '    size_t size;\n';
  project += '    \n';
  project += '    Memory(size_t s) : size(s) {\n';
  project += '        data = new uint8_t[s];\n';
  project += '    }\n';
  project += '    \n';
  project += '    ~Memory() {\n';
  project += '        delete[] data;\n';
  project += '    }\n';
  project += '    \n';
  project += '    uint8_t& operator[](size_t index) {\n';
  project += '        return data[index];\n';
  project += '    }\n';
  project += '};\n\n';
  
  // Add all functions
  for (const func of functions) {
    const result = decompileToCpp(func.instructions || [], peData, func);
    project += result.code;
    project += '\n';
  }
  
  // Add main function
  project += 'int main(int argc, char* argv[]) {\n';
  project += '    // Program entry point\n';
  project += '    try {\n';
  if (functions.length > 0) {
    project += `        ${sanitizeCppName(functions[0].name)}();\n`;
  } else {
    project += '        cout << "No functions to execute" << endl;\n';
  }
  project += '    } catch (const exception& e) {\n';
  project += '        cerr << "Error: " << e.what() << endl;\n';
  project += '        return 1;\n';
  project += '    }\n';
  project += '    return 0;\n';
  project += '}\n';
  
  return project;
}

/**
 * Generate C++ class from functions
 */
export function generateCppClass(functions, className, peData) {
  let classCode = `// ${className} class - Decompiled\n\n`;
  
  // Header
  classCode += `#ifndef ${className.toUpperCase()}_H\n`;
  classCode += `#define ${className.toUpperCase()}_H\n\n`;
  
  classCode += '#include <cstdint>\n';
  classCode += '#include <memory>\n\n';
  
  classCode += `class ${className} {\n`;
  classCode += 'public:\n';
  
  // Detect constructors, destructors, and methods
  const constructors = functions.filter(f => f.name.includes('ctor') || f.name.includes(className));
  const destructors = functions.filter(f => f.name.includes('dtor') || f.name.includes('~'));
  const methods = functions.filter(f => !constructors.includes(f) && !destructors.includes(f));
  
  // Add constructor declarations
  for (const ctor of constructors) {
    classCode += `    ${className}();\n`;
  }
  
  // Add destructor declaration
  if (destructors.length > 0) {
    classCode += `    ~${className}();\n`;
  }
  
  classCode += '\n';
  
  // Add method declarations
  for (const method of methods) {
    const name = sanitizeCppName(method.name);
    classCode += `    void ${name}();\n`;
  }
  
  classCode += '\n';
  classCode += 'private:\n';
  classCode += '    // Private members\n';
  classCode += '    uint32_t member_data;\n';
  
  classCode += '};\n\n';
  classCode += '#endif\n';
  
  return classCode;
}

/**
 * Generate modern C++ with STL and smart pointers
 */
export function generateModernCpp(functions, peData, projectName) {
  let code = '// ' + projectName + ' - Modern C++17/20\n';
  code += '// Generated by EXE Decompiler Pro\n\n';
  
  code += '#include <iostream>\n';
  code += '#include <memory>\n';
  code += '#include <vector>\n';
  code += '#include <optional>\n';
  code += '#include <variant>\n';
  code += '#include <string_view>\n\n';
  
  code += 'using namespace std::literals;\n\n';
  
  // Generate with modern features
  for (const func of functions) {
    const result = decompileToCpp(func.instructions || [], peData, func);
    code += result.code;
    code += '\n';
  }
  
  return code;
}
