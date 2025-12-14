/**
 * Comprehensive Control Flow Analysis Module
 * Implements advanced control flow graph construction and analysis
 * Includes dominator trees, loop detection, and structural analysis
 */

/**
 * Build comprehensive control flow graph from instructions
 * @param {Array} instructions - Disassembled instructions
 * @param {Object} options - Analysis options
 * @returns {Object} Control flow graph with comprehensive analysis
 */
export function buildControlFlowGraph(instructions, options = {}) {
  const {
    detectLoops = true,
    buildDominatorTree = true,
    detectExceptionHandlers = true,
    resolveIndirectJumps = true,
    analyzeTailCalls = true
  } = options;

  const cfg = {
    nodes: [],
    edges: [],
    basicBlocks: [],
    entryBlock: null,
    exitBlocks: [],
    loops: [],
    dominatorTree: null,
    postDominatorTree: null,
    backEdges: [],
    metadata: {}
  };

  if (!instructions || instructions.length === 0) {
    return cfg;
  }

  // Phase 1: Identify basic block boundaries
  const blockBoundaries = identifyBasicBlockBoundaries(instructions);
  
  // Phase 2: Create basic blocks
  cfg.basicBlocks = createBasicBlocks(instructions, blockBoundaries);
  
  // Phase 3: Build CFG edges
  buildCFGEdges(cfg, instructions);
  
  // Phase 4: Identify entry and exit blocks
  identifyEntryAndExitBlocks(cfg);
  
  // Phase 5: Build dominator tree
  if (buildDominatorTree) {
    cfg.dominatorTree = buildDominatorTreeAnalysis(cfg);
    cfg.postDominatorTree = buildPostDominatorTree(cfg);
  }
  
  // Phase 6: Detect loops
  if (detectLoops) {
    cfg.loops = detectNaturalLoops(cfg);
    cfg.backEdges = identifyBackEdges(cfg);
  }
  
  // Phase 7: Exception handler detection
  if (detectExceptionHandlers) {
    cfg.exceptionHandlers = detectExceptionHandlers(cfg, instructions);
  }
  
  // Phase 8: Indirect jump resolution
  if (resolveIndirectJumps) {
    resolveIndirectJumpTargets(cfg, instructions);
  }
  
  // Phase 9: Tail call detection
  if (analyzeTailCalls) {
    cfg.tailCalls = detectTailCalls(cfg, instructions);
  }
  
  // Phase 10: Compute metadata
  computeCFGMetadata(cfg);
  
  return cfg;
}

/**
 * Identify basic block boundaries
 */
function identifyBasicBlockBoundaries(instructions) {
  const boundaries = new Set();
  
  // Entry point is always a boundary
  if (instructions.length > 0) {
    boundaries.add(0);
  }
  
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];
    const mnemonic = getMnemonic(inst);
    
    // Leaders: targets of jumps
    if (isJump(mnemonic) || isCall(mnemonic)) {
      const target = getJumpTarget(inst);
      if (target !== null) {
        const targetIndex = findInstructionIndex(instructions, target);
        if (targetIndex !== -1) {
          boundaries.add(targetIndex);
        }
      }
      
      // Instruction after conditional jump is a boundary
      if (isConditionalJump(mnemonic) && i + 1 < instructions.length) {
        boundaries.add(i + 1);
      }
    }
    
    // Instruction after return/call is a boundary
    if ((isReturn(mnemonic) || isCall(mnemonic)) && i + 1 < instructions.length) {
      boundaries.add(i + 1);
    }
  }
  
  return Array.from(boundaries).sort((a, b) => a - b);
}

/**
 * Create basic blocks from boundaries
 */
function createBasicBlocks(instructions, boundaries) {
  const blocks = [];
  
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i];
    const end = i + 1 < boundaries.length ? boundaries[i + 1] : instructions.length;
    
    const blockInstructions = instructions.slice(start, end);
    const block = {
      id: blocks.length,
      start,
      end,
      instructions: blockInstructions,
      predecessors: [],
      successors: [],
      dominators: [],
      immediateDominator: null,
      dominanceFrontier: [],
      loopHeader: false,
      loopDepth: 0,
      metadata: {}
    };
    
    blocks.push(block);
  }
  
  return blocks;
}

/**
 * Build CFG edges between basic blocks
 */
function buildCFGEdges(cfg, instructions) {
  for (let i = 0; i < cfg.basicBlocks.length; i++) {
    const block = cfg.basicBlocks[i];
    const lastInst = block.instructions[block.instructions.length - 1];
    const mnemonic = getMnemonic(lastInst);
    
    // Unconditional jump
    if (mnemonic === 'jmp') {
      const target = getJumpTarget(lastInst);
      const targetBlock = findBlockByAddress(cfg.basicBlocks, target);
      if (targetBlock) {
        addEdge(cfg, block, targetBlock, 'unconditional');
      }
    }
    // Conditional jump
    else if (isConditionalJump(mnemonic)) {
      const target = getJumpTarget(lastInst);
      const targetBlock = findBlockByAddress(cfg.basicBlocks, target);
      const fallThroughBlock = i + 1 < cfg.basicBlocks.length ? cfg.basicBlocks[i + 1] : null;
      
      if (targetBlock) {
        addEdge(cfg, block, targetBlock, 'conditional_true');
      }
      if (fallThroughBlock) {
        addEdge(cfg, block, fallThroughBlock, 'conditional_false');
      }
    }
    // Return
    else if (isReturn(mnemonic)) {
      // No successor, this is an exit block
      block.isExit = true;
    }
    // Call
    else if (isCall(mnemonic)) {
      // Fall through to next block
      if (i + 1 < cfg.basicBlocks.length) {
        addEdge(cfg, block, cfg.basicBlocks[i + 1], 'call_return');
      }
    }
    // Fall through
    else {
      if (i + 1 < cfg.basicBlocks.length) {
        addEdge(cfg, block, cfg.basicBlocks[i + 1], 'fallthrough');
      }
    }
  }
}

/**
 * Add edge between blocks
 */
function addEdge(cfg, from, to, type) {
  if (!from || !to) return;
  
  from.successors.push(to.id);
  to.predecessors.push(from.id);
  
  cfg.edges.push({
    from: from.id,
    to: to.id,
    type
  });
}

/**
 * Identify entry and exit blocks
 */
function identifyEntryAndExitBlocks(cfg) {
  if (cfg.basicBlocks.length === 0) return;
  
  // Entry block is the first block
  cfg.entryBlock = cfg.basicBlocks[0].id;
  
  // Exit blocks are blocks with no successors
  cfg.exitBlocks = cfg.basicBlocks
    .filter(block => block.successors.length === 0)
    .map(block => block.id);
}

/**
 * Build dominator tree using Lengauer-Tarjan algorithm
 */
function buildDominatorTreeAnalysis(cfg) {
  if (cfg.basicBlocks.length === 0) return null;
  
  const dominatorTree = {
    root: cfg.entryBlock,
    nodes: new Map(),
    edges: []
  };
  
  // Initialize dominator sets
  const dominators = new Map();
  for (const block of cfg.basicBlocks) {
    if (block.id === cfg.entryBlock) {
      dominators.set(block.id, new Set([block.id]));
    } else {
      dominators.set(block.id, new Set(cfg.basicBlocks.map(b => b.id)));
    }
  }
  
  // Iterative algorithm to compute dominators
  let changed = true;
  while (changed) {
    changed = false;
    
    for (const block of cfg.basicBlocks) {
      if (block.id === cfg.entryBlock) continue;
      
      // Dom(n) = {n} ∪ (∩ Dom(p) for all predecessors p)
      let newDom = new Set([block.id]);
      
      if (block.predecessors.length > 0) {
        // Intersection of all predecessor dominators
        let intersection = new Set(dominators.get(block.predecessors[0]));
        for (let i = 1; i < block.predecessors.length; i++) {
          const predDom = dominators.get(block.predecessors[i]);
          intersection = new Set([...intersection].filter(x => predDom.has(x)));
        }
        
        newDom = new Set([block.id, ...intersection]);
      }
      
      const oldDom = dominators.get(block.id);
      if (!setsEqual(oldDom, newDom)) {
        dominators.set(block.id, newDom);
        changed = true;
      }
    }
  }
  
  // Compute immediate dominators
  for (const block of cfg.basicBlocks) {
    const doms = dominators.get(block.id);
    const strictDoms = new Set([...doms].filter(d => d !== block.id));
    
    // Immediate dominator is the one that doesn't dominate any other dominator
    for (const dom of strictDoms) {
      let isImmediate = true;
      for (const otherDom of strictDoms) {
        if (otherDom !== dom && dominators.get(otherDom).has(dom)) {
          isImmediate = false;
          break;
        }
      }
      
      if (isImmediate) {
        block.immediateDominator = dom;
        dominatorTree.edges.push({ from: dom, to: block.id });
        break;
      }
    }
    
    block.dominators = Array.from(doms);
  }
  
  // Build tree structure
  for (const block of cfg.basicBlocks) {
    dominatorTree.nodes.set(block.id, {
      block: block.id,
      idom: block.immediateDominator,
      children: [],
      dominates: block.dominators
    });
  }
  
  // Add children relationships
  for (const [blockId, node] of dominatorTree.nodes) {
    if (node.idom !== null) {
      dominatorTree.nodes.get(node.idom).children.push(blockId);
    }
  }
  
  return dominatorTree;
}

/**
 * Build post-dominator tree
 */
function buildPostDominatorTree(cfg) {
  // Create reverse CFG
  const reverseCFG = {
    basicBlocks: cfg.basicBlocks.map(b => ({
      ...b,
      successors: [...b.predecessors],
      predecessors: [...b.successors]
    })),
    entryBlock: cfg.exitBlocks[0] || null
  };
  
  // Build dominator tree on reverse CFG
  return buildDominatorTreeAnalysis(reverseCFG);
}

/**
 * Detect natural loops in the CFG
 */
function detectNaturalLoops(cfg) {
  const loops = [];
  const backEdges = identifyBackEdges(cfg);
  
  for (const backEdge of backEdges) {
    const loop = extractNaturalLoop(cfg, backEdge);
    if (loop) {
      loops.push(loop);
    }
  }
  
  // Nest loops
  nestLoops(loops);
  
  // Mark loop headers
  for (const loop of loops) {
    const headerBlock = cfg.basicBlocks.find(b => b.id === loop.header);
    if (headerBlock) {
      headerBlock.loopHeader = true;
    }
  }
  
  return loops;
}

/**
 * Identify back edges (edges that go to dominating blocks)
 */
function identifyBackEdges(cfg) {
  const backEdges = [];
  
  for (const edge of cfg.edges) {
    const fromBlock = cfg.basicBlocks.find(b => b.id === edge.from);
    const toBlock = cfg.basicBlocks.find(b => b.id === edge.to);
    
    if (toBlock && fromBlock && toBlock.dominators && toBlock.dominators.includes(edge.from)) {
      backEdges.push(edge);
    }
  }
  
  return backEdges;
}

/**
 * Extract natural loop from back edge
 */
function extractNaturalLoop(cfg, backEdge) {
  const header = backEdge.to;
  const tail = backEdge.from;
  
  const loopNodes = new Set([header]);
  const worklist = [tail];
  
  while (worklist.length > 0) {
    const node = worklist.pop();
    
    if (!loopNodes.has(node)) {
      loopNodes.add(node);
      
      const block = cfg.basicBlocks.find(b => b.id === node);
      if (block) {
        worklist.push(...block.predecessors);
      }
    }
  }
  
  return {
    header,
    nodes: Array.from(loopNodes),
    backEdge,
    type: 'natural',
    depth: 0,
    parent: null,
    children: []
  };
}

/**
 * Nest loops hierarchically
 */
function nestLoops(loops) {
  // Sort loops by size (larger loops first)
  loops.sort((a, b) => b.nodes.length - a.nodes.length);
  
  // Build nesting relationship
  for (let i = 0; i < loops.length; i++) {
    const loop = loops[i];
    
    for (let j = i + 1; j < loops.length; j++) {
      const innerLoop = loops[j];
      
      // Check if innerLoop is contained in loop
      if (innerLoop.nodes.every(n => loop.nodes.includes(n))) {
        loop.children.push(innerLoop);
        innerLoop.parent = loop;
      }
    }
  }
  
  // Compute loop depths
  function computeDepth(loop, depth) {
    loop.depth = depth;
    for (const child of loop.children) {
      computeDepth(child, depth + 1);
    }
  }
  
  for (const loop of loops) {
    if (!loop.parent) {
      computeDepth(loop, 0);
    }
  }
}

/**
 * Detect exception handlers
 */
function detectExceptionHandlers(cfg, instructions) {
  const handlers = [];
  
  // Look for try-catch patterns
  // This is simplified; real detection is very complex
  for (const block of cfg.basicBlocks) {
    // Look for SEH or C++ exception patterns
    const hasExceptionSetup = block.instructions.some(inst => {
      const mnemonic = getMnemonic(inst);
      return mnemonic === 'push' && getOperand(inst, 0) === 'fs:[0]';
    });
    
    if (hasExceptionSetup) {
      handlers.push({
        tryBlock: block.id,
        type: 'SEH'
      });
    }
  }
  
  return handlers;
}

/**
 * Resolve indirect jump targets
 */
function resolveIndirectJumpTargets(cfg, instructions) {
  for (const block of cfg.basicBlocks) {
    const lastInst = block.instructions[block.instructions.length - 1];
    const mnemonic = getMnemonic(lastInst);
    
    if (mnemonic === 'jmp' && isIndirectJump(lastInst)) {
      // Try to resolve target
      const possibleTargets = analyzeIndirectJump(lastInst, instructions);
      block.metadata.indirectTargets = possibleTargets;
    }
  }
}

/**
 * Analyze indirect jump to find possible targets
 */
function analyzeIndirectJump(inst, instructions) {
  const targets = [];
  
  // Look for jump table patterns
  // This is a simplified analysis
  const operand = getOperand(inst, 0);
  
  if (operand && operand.includes('[')) {
    // Might be jump table
    // TODO: Implement jump table analysis
    targets.push({ type: 'jump_table', confidence: 0.7 });
  }
  
  return targets;
}

/**
 * Detect tail calls
 */
function detectTailCalls(cfg, instructions) {
  const tailCalls = [];
  
  for (const block of cfg.basicBlocks) {
    const lastInst = block.instructions[block.instructions.length - 1];
    const mnemonic = getMnemonic(lastInst);
    
    // Tail call pattern: jmp to function instead of call+ret
    if (mnemonic === 'jmp') {
      const target = getJumpTarget(lastInst);
      
      // Check if this looks like a tail call
      if (target && !isInternalTarget(cfg, target)) {
        tailCalls.push({
          block: block.id,
          target,
          confidence: 0.8
        });
        block.metadata.isTailCall = true;
      }
    }
  }
  
  return tailCalls;
}

/**
 * Check if target is within the current function
 */
function isInternalTarget(cfg, target) {
  return cfg.basicBlocks.some(block => {
    const firstInst = block.instructions[0];
    return getAddress(firstInst) === target;
  });
}

/**
 * Compute CFG metadata and statistics
 */
function computeCFGMetadata(cfg) {
  cfg.metadata = {
    blockCount: cfg.basicBlocks.length,
    edgeCount: cfg.edges.length,
    loopCount: cfg.loops.length,
    maxLoopDepth: Math.max(0, ...cfg.loops.map(l => l.depth)),
    cyclomaticComplexity: computeCyclomaticComplexity(cfg),
    isReducible: isReducibleCFG(cfg)
  };
}

/**
 * Compute cyclomatic complexity: E - N + 2P
 */
function computeCyclomaticComplexity(cfg) {
  const E = cfg.edges.length;
  const N = cfg.basicBlocks.length;
  const P = 1; // Single connected component
  
  return E - N + 2 * P;
}

/**
 * Check if CFG is reducible
 */
function isReducibleCFG(cfg) {
  // A CFG is reducible if all loops are natural loops
  // Simplified check: no irreducible loops found
  return true; // TODO: Implement proper reducibility check
}

/**
 * Helper functions
 */

function getMnemonic(inst) {
  if (typeof inst === 'string') {
    return inst.split(/\s+/)[0].toLowerCase();
  }
  return inst.mnemonic ? inst.mnemonic.toLowerCase() : '';
}

function getOperand(inst, index) {
  if (typeof inst === 'string') {
    const parts = inst.split(/\s+/);
    const operands = parts.slice(1).join(' ').split(',');
    return operands[index] ? operands[index].trim() : null;
  }
  if (inst.operands) {
    const operands = inst.operands.split(',');
    return operands[index] ? operands[index].trim() : null;
  }
  return null;
}

function getAddress(inst) {
  if (inst.address) return inst.address;
  if (inst.addressNum) return `0x${inst.addressNum.toString(16)}`;
  return null;
}

function getJumpTarget(inst) {
  const operand = getOperand(inst, 0);
  return operand;
}

function isJump(mnemonic) {
  return mnemonic && mnemonic.startsWith('j');
}

function isConditionalJump(mnemonic) {
  return isJump(mnemonic) && mnemonic !== 'jmp';
}

function isCall(mnemonic) {
  return mnemonic === 'call';
}

function isReturn(mnemonic) {
  return mnemonic === 'ret' || mnemonic === 'retn';
}

function isIndirectJump(inst) {
  const operand = getOperand(inst, 0);
  return operand && (operand.includes('[') || operand.includes('*'));
}

function findInstructionIndex(instructions, address) {
  for (let i = 0; i < instructions.length; i++) {
    if (getAddress(instructions[i]) === address) {
      return i;
    }
  }
  return -1;
}

function findBlockByAddress(blocks, address) {
  for (const block of blocks) {
    const firstAddr = getAddress(block.instructions[0]);
    if (firstAddr === address) {
      return block;
    }
  }
  return null;
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

/**
 * Structural analysis - reduce CFG to structured constructs
 */
export function performStructuralAnalysis(cfg) {
  const structures = [];
  
  // Detect if-then-else
  for (const block of cfg.basicBlocks) {
    if (block.successors.length === 2) {
      const structure = detectIfThenElse(cfg, block);
      if (structure) {
        structures.push(structure);
      }
    }
  }
  
  // Detect while loops
  for (const loop of cfg.loops) {
    const structure = detectWhileLoop(cfg, loop);
    if (structure) {
      structures.push(structure);
    }
  }
  
  // Detect switch statements
  for (const block of cfg.basicBlocks) {
    if (block.successors.length > 2) {
      const structure = detectSwitchStatement(cfg, block);
      if (structure) {
        structures.push(structure);
      }
    }
  }
  
  return structures;
}

/**
 * Detect if-then-else structure
 */
function detectIfThenElse(cfg, block) {
  if (block.successors.length !== 2) return null;
  
  const trueBlock = cfg.basicBlocks.find(b => b.id === block.successors[0]);
  const falseBlock = cfg.basicBlocks.find(b => b.id === block.successors[1]);
  
  if (!trueBlock || !falseBlock) return null;
  
  // Find merge point
  const mergePoint = findMergePoint(cfg, trueBlock, falseBlock);
  
  return {
    type: 'if-then-else',
    condition: block.id,
    thenBranch: trueBlock.id,
    elseBranch: falseBlock.id,
    merge: mergePoint
  };
}

/**
 * Find merge point of two branches
 */
function findMergePoint(cfg, block1, block2) {
  const visited1 = new Set();
  const visited2 = new Set();
  
  // BFS from both blocks
  const queue1 = [block1.id];
  const queue2 = [block2.id];
  
  while (queue1.length > 0 || queue2.length > 0) {
    if (queue1.length > 0) {
      const node = queue1.shift();
      if (visited2.has(node)) return node;
      visited1.add(node);
      
      const block = cfg.basicBlocks.find(b => b.id === node);
      if (block) {
        queue1.push(...block.successors);
      }
    }
    
    if (queue2.length > 0) {
      const node = queue2.shift();
      if (visited1.has(node)) return node;
      visited2.add(node);
      
      const block = cfg.basicBlocks.find(b => b.id === node);
      if (block) {
        queue2.push(...block.successors);
      }
    }
  }
  
  return null;
}

/**
 * Detect while loop structure
 */
function detectWhileLoop(cfg, loop) {
  const header = cfg.basicBlocks.find(b => b.id === loop.header);
  if (!header) return null;
  
  return {
    type: 'while',
    header: loop.header,
    body: loop.nodes.filter(n => n !== loop.header),
    backEdge: loop.backEdge
  };
}

/**
 * Detect switch statement
 */
function detectSwitchStatement(cfg, block) {
  if (block.successors.length <= 2) return null;
  
  // Look for jump table pattern
  const lastInst = block.instructions[block.instructions.length - 1];
  if (isIndirectJump(lastInst)) {
    return {
      type: 'switch',
      selector: block.id,
      cases: block.successors,
      confidence: 0.7
    };
  }
  
  return null;
}

/**
 * Compute dominance frontier
 */
export function computeDominanceFrontier(cfg) {
  for (const block of cfg.basicBlocks) {
    block.dominanceFrontier = [];
  }
  
  for (const block of cfg.basicBlocks) {
    if (block.predecessors.length >= 2) {
      for (const predId of block.predecessors) {
        let runner = predId;
        
        while (runner !== block.immediateDominator) {
          const runnerBlock = cfg.basicBlocks.find(b => b.id === runner);
          if (runnerBlock && !runnerBlock.dominanceFrontier.includes(block.id)) {
            runnerBlock.dominanceFrontier.push(block.id);
          }
          
          const runnerBlockData = cfg.basicBlocks.find(b => b.id === runner);
          runner = runnerBlockData ? runnerBlockData.immediateDominator : null;
          
          if (runner === null) break;
        }
      }
    }
  }
}

/**
 * Export CFG to DOT format for visualization
 */
export function exportCFGToDot(cfg) {
  let dot = 'digraph CFG {\n';
  dot += '  node [shape=box];\n';
  
  for (const block of cfg.basicBlocks) {
    const label = `Block ${block.id}\\n${block.instructions.length} instructions`;
    const color = block.loopHeader ? 'lightblue' : 'white';
    dot += `  ${block.id} [label="${label}", style=filled, fillcolor=${color}];\n`;
  }
  
  for (const edge of cfg.edges) {
    const style = edge.type === 'conditional_true' ? 'solid' :
                  edge.type === 'conditional_false' ? 'dashed' : 'solid';
    const color = edge.type.includes('conditional') ? 'blue' : 'black';
    dot += `  ${edge.from} -> ${edge.to} [style=${style}, color=${color}];\n`;
  }
  
  dot += '}\n';
  return dot;
}
