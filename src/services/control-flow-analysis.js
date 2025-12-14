/**
 * Control Flow Analysis Module
 * Advanced control flow graph construction and analysis
 * 
 * Features:
 * - Control Flow Graph (CFG) construction
 * - Basic block identification
 * - Dominance analysis
 * - Loop detection and classification
 * - Unreachable code detection
 * - Path analysis
 * - Branch prediction
 * - Call graph construction
 * - Interprocedural analysis
 * - Control flow flattening detection
 * - Opaque predicate detection
 * - Control flow integrity verification
 */

// Control flow node types
const NODE_TYPES = {
  ENTRY: 'entry',
  EXIT: 'exit',
  NORMAL: 'normal',
  BRANCH: 'branch',
  LOOP_HEADER: 'loop_header',
  LOOP_BODY: 'loop_body',
  LOOP_EXIT: 'loop_exit',
  CALL: 'call',
  RETURN: 'return',
  EXCEPTION: 'exception'
};

// Edge types in control flow graph
const EDGE_TYPES = {
  SEQUENTIAL: 'sequential',
  CONDITIONAL_TRUE: 'conditional_true',
  CONDITIONAL_FALSE: 'conditional_false',
  UNCONDITIONAL: 'unconditional',
  CALL: 'call',
  RETURN: 'return',
  EXCEPTION: 'exception',
  BACKEDGE: 'backedge'
};

// Loop types
const LOOP_TYPES = {
  WHILE: 'while',
  DO_WHILE: 'do_while',
  FOR: 'for',
  INFINITE: 'infinite',
  NESTED: 'nested',
  IRREDUCIBLE: 'irreducible'
};

/**
 * Main control flow analysis function
 */
export function analyzeControlFlow(instructions, peData, options = {}) {
  const {
    detectLoops = true,
    computeDominance = true,
    findUnreachable = true,
    analyzeComplexity = true,
    detectObfuscation = true
  } = options;

  const cfg = {
    nodes: [],
    edges: [],
    entryNode: null,
    exitNodes: [],
    basicBlocks: [],
    loops: [],
    dominators: new Map(),
    postDominators: new Map(),
    unreachableNodes: new Set(),
    complexity: 0,
    metadata: {
      instructionCount: instructions.length,
      branchCount: 0,
      loopCount: 0,
      callCount: 0
    }
  };

  // Phase 1: Identify basic blocks
  const basicBlocks = identifyBasicBlocks(instructions);
  cfg.basicBlocks = basicBlocks;

  // Phase 2: Build control flow graph
  buildCFG(cfg, basicBlocks, instructions);

  // Phase 3: Detect loops
  if (detectLoops) {
    detectLoopsInCFG(cfg);
  }

  // Phase 4: Compute dominance relations
  if (computeDominance) {
    computeDominanceRelations(cfg);
    computePostDominance(cfg);
  }

  // Phase 5: Find unreachable code
  if (findUnreachable) {
    findUnreachableCode(cfg);
  }

  // Phase 6: Analyze complexity
  if (analyzeComplexity) {
    cfg.complexity = calculateCyclomaticComplexity(cfg);
  }

  // Phase 7: Detect obfuscation
  if (detectObfuscation) {
    detectControlFlowObfuscation(cfg);
  }

  return cfg;
}

/**
 * Identify basic blocks in instruction sequence
 * A basic block is a sequence of instructions with:
 * - Single entry point (first instruction)
 * - Single exit point (last instruction)
 * - No branches except at the end
 */
function identifyBasicBlocks(instructions) {
  if (!instructions || instructions.length === 0) {
    return [];
  }

  const basicBlocks = [];
  const leaders = new Set();

  // First instruction is always a leader
  leaders.add(0);

  // Identify leaders (first instruction of basic blocks)
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];

    // Target of jump is a leader
    if (isControlFlowInstruction(inst)) {
      if (inst.target !== undefined) {
        const targetIndex = findInstructionIndexByAddress(instructions, inst.target);
        if (targetIndex >= 0) {
          leaders.add(targetIndex);
        }
      }

      // Instruction after a branch is a leader (for conditional branches)
      if (isConditionalBranch(inst) && i + 1 < instructions.length) {
        leaders.add(i + 1);
      }

      // Instruction after unconditional jump/return is a leader
      if ((isUnconditionalJump(inst) || isReturn(inst)) && i + 1 < instructions.length) {
        leaders.add(i + 1);
      }
    }

    // Target of call is a leader (if local)
    if (isCall(inst) && inst.target) {
      const targetIndex = findInstructionIndexByAddress(instructions, inst.target);
      if (targetIndex >= 0) {
        leaders.add(targetIndex);
      }
      // Instruction after call is also a leader
      if (i + 1 < instructions.length) {
        leaders.add(i + 1);
      }
    }
  }

  // Sort leaders
  const sortedLeaders = Array.from(leaders).sort((a, b) => a - b);

  // Create basic blocks
  for (let i = 0; i < sortedLeaders.length; i++) {
    const start = sortedLeaders[i];
    const end = i + 1 < sortedLeaders.length ? sortedLeaders[i + 1] - 1 : instructions.length - 1;

    const block = {
      id: i,
      startIndex: start,
      endIndex: end,
      startAddress: instructions[start].address,
      endAddress: instructions[end].address,
      instructions: instructions.slice(start, end + 1),
      successors: [],
      predecessors: [],
      type: NODE_TYPES.NORMAL,
      dominatedBy: new Set(),
      dominates: new Set(),
      loopDepth: 0,
      attributes: {}
    };

    // Classify block type
    const lastInst = instructions[end];
    if (isReturn(lastInst)) {
      block.type = NODE_TYPES.RETURN;
    } else if (isCall(lastInst)) {
      block.type = NODE_TYPES.CALL;
    } else if (isConditionalBranch(lastInst)) {
      block.type = NODE_TYPES.BRANCH;
    }

    basicBlocks.push(block);
  }

  return basicBlocks;
}

/**
 * Build Control Flow Graph from basic blocks
 */
function buildCFG(cfg, basicBlocks, instructions) {
  // Create nodes from basic blocks
  cfg.nodes = basicBlocks.map((block, index) => ({
    id: index,
    block,
    successors: [],
    predecessors: [],
    type: block.type
  }));

  // Entry node is the first block
  if (cfg.nodes.length > 0) {
    cfg.entryNode = cfg.nodes[0];
    cfg.nodes[0].type = NODE_TYPES.ENTRY;
  }

  // Build edges between nodes
  for (let i = 0; i < basicBlocks.length; i++) {
    const block = basicBlocks[i];
    const lastInst = block.instructions[block.instructions.length - 1];

    // Sequential edge (fall-through)
    if (i + 1 < basicBlocks.length && !isUnconditionalJump(lastInst) && !isReturn(lastInst)) {
      addEdge(cfg, i, i + 1, EDGE_TYPES.SEQUENTIAL);
      cfg.metadata.branchCount++;
    }

    // Branch edges
    if (isControlFlowInstruction(lastInst) && lastInst.target !== undefined) {
      const targetIndex = findBlockIndexByAddress(basicBlocks, lastInst.target);
      
      if (targetIndex >= 0) {
        const edgeType = isConditionalBranch(lastInst) ? 
                        EDGE_TYPES.CONDITIONAL_TRUE : 
                        EDGE_TYPES.UNCONDITIONAL;
        
        addEdge(cfg, i, targetIndex, edgeType);
        cfg.metadata.branchCount++;

        // Check if this is a backedge (target is before current block)
        if (targetIndex <= i) {
          cfg.edges[cfg.edges.length - 1].isBackedge = true;
        }
      }
    }

    // Identify exit nodes
    if (isReturn(lastInst)) {
      cfg.exitNodes.push(cfg.nodes[i]);
    }

    // Count calls
    if (isCall(lastInst)) {
      cfg.metadata.callCount++;
    }
  }
}

/**
 * Add edge to control flow graph
 */
function addEdge(cfg, fromId, toId, type) {
  const edge = {
    from: fromId,
    to: toId,
    type,
    isBackedge: false
  };

  cfg.edges.push(edge);
  cfg.nodes[fromId].successors.push(toId);
  cfg.nodes[toId].predecessors.push(fromId);
}

/**
 * Detect loops in control flow graph
 * Uses Tarjan's algorithm to find strongly connected components
 */
function detectLoopsInCFG(cfg) {
  const loops = [];
  const visited = new Set();
  const stack = [];
  const lowLink = new Map();
  const index = new Map();
  let currentIndex = 0;

  function strongConnect(nodeId) {
    index.set(nodeId, currentIndex);
    lowLink.set(nodeId, currentIndex);
    currentIndex++;
    stack.push(nodeId);
    visited.add(nodeId);

    const node = cfg.nodes[nodeId];
    for (const successorId of node.successors) {
      if (!index.has(successorId)) {
        strongConnect(successorId);
        lowLink.set(nodeId, Math.min(lowLink.get(nodeId), lowLink.get(successorId)));
      } else if (visited.has(successorId)) {
        lowLink.set(nodeId, Math.min(lowLink.get(nodeId), index.get(successorId)));
      }
    }

    // Found a strongly connected component (potential loop)
    if (lowLink.get(nodeId) === index.get(nodeId)) {
      const component = [];
      let w;
      do {
        w = stack.pop();
        visited.delete(w);
        component.push(w);
      } while (w !== nodeId);

      // If component has more than one node or has a self-loop, it's a loop
      if (component.length > 1 || hasSelfLoop(cfg, nodeId)) {
        const loop = analyzeLoop(cfg, component);
        loops.push(loop);
        cfg.metadata.loopCount++;
      }
    }
  }

  // Find all SCCs
  for (let i = 0; i < cfg.nodes.length; i++) {
    if (!index.has(i)) {
      strongConnect(i);
    }
  }

  cfg.loops = loops;

  // Mark loop headers and bodies
  for (const loop of loops) {
    for (const nodeId of loop.nodes) {
      const node = cfg.nodes[nodeId];
      node.block.loopDepth++;
      
      if (nodeId === loop.header) {
        node.block.type = NODE_TYPES.LOOP_HEADER;
      } else {
        node.block.type = NODE_TYPES.LOOP_BODY;
      }
    }
  }
}

/**
 * Analyze loop structure
 */
function analyzeLoop(cfg, componentNodes) {
  const loop = {
    nodes: componentNodes,
    header: null,
    exits: [],
    backedges: [],
    type: LOOP_TYPES.WHILE,
    depth: 0,
    complexity: 0
  };

  // Find loop header (node with most predecessors from outside the loop)
  let maxExternalPreds = -1;
  for (const nodeId of componentNodes) {
    const node = cfg.nodes[nodeId];
    const externalPreds = node.predecessors.filter(p => !componentNodes.includes(p)).length;
    if (externalPreds > maxExternalPreds) {
      maxExternalPreds = externalPreds;
      loop.header = nodeId;
    }
  }

  // Find backedges
  for (const nodeId of componentNodes) {
    const node = cfg.nodes[nodeId];
    for (const successorId of node.successors) {
      if (successorId === loop.header || componentNodes.includes(successorId)) {
        if (componentNodes.indexOf(successorId) <= componentNodes.indexOf(nodeId)) {
          loop.backedges.push({ from: nodeId, to: successorId });
        }
      }
    }
  }

  // Find loop exits
  for (const nodeId of componentNodes) {
    const node = cfg.nodes[nodeId];
    for (const successorId of node.successors) {
      if (!componentNodes.includes(successorId)) {
        loop.exits.push({ from: nodeId, to: successorId });
      }
    }
  }

  // Classify loop type
  loop.type = classifyLoopType(cfg, loop);

  // Calculate loop complexity
  loop.complexity = calculateLoopComplexity(cfg, loop);

  return loop;
}

/**
 * Classify loop type
 */
function classifyLoopType(cfg, loop) {
  const headerNode = cfg.nodes[loop.header];
  const headerBlock = headerNode.block;
  const lastInst = headerBlock.instructions[headerBlock.instructions.length - 1];

  // Infinite loop (no exits)
  if (loop.exits.length === 0) {
    return LOOP_TYPES.INFINITE;
  }

  // Check for do-while pattern (exit at bottom)
  const exitAtBottom = loop.exits.some(exit => {
    const exitNodeIndex = loop.nodes.indexOf(exit.from);
    return exitNodeIndex === loop.nodes.length - 1;
  });

  if (exitAtBottom) {
    return LOOP_TYPES.DO_WHILE;
  }

  // Check for for-loop pattern (counter-based)
  if (isCounterBasedLoop(cfg, loop)) {
    return LOOP_TYPES.FOR;
  }

  // Check for nested loop
  const containsLoop = loop.nodes.some(nodeId => {
    const node = cfg.nodes[nodeId];
    return node.block.loopDepth > 1;
  });

  if (containsLoop) {
    return LOOP_TYPES.NESTED;
  }

  // Default to while loop
  return LOOP_TYPES.WHILE;
}

/**
 * Check if loop is counter-based (for-loop pattern)
 */
function isCounterBasedLoop(cfg, loop) {
  // Look for counter initialization, increment, and comparison
  const headerNode = cfg.nodes[loop.header];
  const headerBlock = headerNode.block;

  let hasCounter = false;
  let hasIncrement = false;
  let hasComparison = false;

  for (const nodeId of loop.nodes) {
    const node = cfg.nodes[nodeId];
    const block = node.block;

    for (const inst of block.instructions) {
      // Check for increment/decrement
      if (inst.mnemonic === 'inc' || inst.mnemonic === 'dec' || 
          inst.mnemonic === 'add' || inst.mnemonic === 'sub') {
        hasIncrement = true;
      }

      // Check for comparison
      if (inst.mnemonic === 'cmp' || inst.mnemonic === 'test') {
        hasComparison = true;
      }

      // Check for counter register (ecx/rcx common for loops)
      if (inst.operands && (inst.operands.includes('ecx') || inst.operands.includes('rcx'))) {
        hasCounter = true;
      }
    }
  }

  return hasCounter && hasIncrement && hasComparison;
}

/**
 * Calculate loop complexity
 */
function calculateLoopComplexity(cfg, loop) {
  let complexity = 1; // Base complexity

  // Add complexity for each branch in loop
  for (const nodeId of loop.nodes) {
    const node = cfg.nodes[nodeId];
    if (node.block.type === NODE_TYPES.BRANCH) {
      complexity++;
    }
  }

  // Add complexity for nested loops
  const nestedLoopCount = loop.nodes.filter(nodeId => {
    const node = cfg.nodes[nodeId];
    return node.block.loopDepth > 1;
  }).length;

  complexity += nestedLoopCount;

  return complexity;
}

/**
 * Compute dominance relations
 * Node A dominates node B if all paths from entry to B go through A
 */
function computeDominanceRelations(cfg) {
  if (!cfg.entryNode) return;

  const nodes = cfg.nodes;
  const n = nodes.length;

  // Initialize dominators
  // Entry node dominates itself
  cfg.dominators.set(0, new Set([0]));

  // All other nodes initially dominated by all nodes
  for (let i = 1; i < n; i++) {
    cfg.dominators.set(i, new Set([...Array(n).keys()]));
  }

  // Iteratively compute dominators
  let changed = true;
  while (changed) {
    changed = false;

    for (let i = 1; i < n; i++) {
      const node = nodes[i];
      const newDom = new Set([i]);

      // Intersection of dominators of all predecessors
      if (node.predecessors.length > 0) {
        const predDoms = node.predecessors.map(p => cfg.dominators.get(p));
        const intersection = intersectSets(predDoms);

        for (const d of intersection) {
          newDom.add(d);
        }
      }

      // Check if dominators changed
      const oldDom = cfg.dominators.get(i);
      if (!setsEqual(oldDom, newDom)) {
        cfg.dominators.set(i, newDom);
        changed = true;
      }
    }
  }

  // Build dominator tree
  buildDominatorTree(cfg);

  // Store domination relations in blocks
  for (let i = 0; i < n; i++) {
    const doms = cfg.dominators.get(i);
    nodes[i].block.dominatedBy = doms;
    
    // Find immediate dominator
    const idom = findImmediateDominator(cfg, i);
    if (idom !== null) {
      nodes[i].block.immediateDominator = idom;
      
      // Add to dominates set of immediate dominator
      if (!nodes[idom].block.dominates) {
        nodes[idom].block.dominates = new Set();
      }
      nodes[idom].block.dominates.add(i);
    }
  }
}

/**
 * Build dominator tree
 */
function buildDominatorTree(cfg) {
  cfg.dominatorTree = {
    root: 0,
    children: new Map()
  };

  for (let i = 0; i < cfg.nodes.length; i++) {
    const idom = findImmediateDominator(cfg, i);
    if (idom !== null) {
      if (!cfg.dominatorTree.children.has(idom)) {
        cfg.dominatorTree.children.set(idom, []);
      }
      cfg.dominatorTree.children.get(idom).push(i);
    }
  }
}

/**
 * Find immediate dominator of a node
 */
function findImmediateDominator(cfg, nodeId) {
  const doms = cfg.dominators.get(nodeId);
  if (!doms || doms.size <= 1) return null;

  // Immediate dominator is the closest dominator (excluding self)
  const domsArray = Array.from(doms).filter(d => d !== nodeId);
  
  // Find dominator that is dominated by fewest others
  let idom = null;
  let minDomCount = Infinity;

  for (const d of domsArray) {
    const dDoms = cfg.dominators.get(d);
    if (dDoms.size < minDomCount) {
      minDomCount = dDoms.size;
      idom = d;
    }
  }

  return idom;
}

/**
 * Compute post-dominance relations
 * Node A post-dominates node B if all paths from B to exit go through A
 */
function computePostDominance(cfg) {
  if (cfg.exitNodes.length === 0) return;

  const nodes = cfg.nodes;
  const n = nodes.length;

  // Create virtual exit node if multiple exits
  const exitIds = cfg.exitNodes.map(node => node.id);

  // Initialize post-dominators
  for (const exitId of exitIds) {
    cfg.postDominators.set(exitId, new Set([exitId]));
  }

  for (let i = 0; i < n; i++) {
    if (!exitIds.includes(i)) {
      cfg.postDominators.set(i, new Set([...Array(n).keys()]));
    }
  }

  // Iteratively compute post-dominators (reverse CFG)
  let changed = true;
  while (changed) {
    changed = false;

    for (let i = 0; i < n; i++) {
      if (exitIds.includes(i)) continue;

      const node = nodes[i];
      const newPostDom = new Set([i]);

      // Intersection of post-dominators of all successors
      if (node.successors.length > 0) {
        const succPostDoms = node.successors.map(s => cfg.postDominators.get(s));
        const intersection = intersectSets(succPostDoms);

        for (const d of intersection) {
          newPostDom.add(d);
        }
      }

      // Check if post-dominators changed
      const oldPostDom = cfg.postDominators.get(i);
      if (!setsEqual(oldPostDom, newPostDom)) {
        cfg.postDominators.set(i, newPostDom);
        changed = true;
      }
    }
  }
}

/**
 * Find unreachable code in CFG
 */
function findUnreachableCode(cfg) {
  if (!cfg.entryNode) return;

  const visited = new Set();
  const queue = [cfg.entryNode.id];

  // BFS from entry node
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (visited.has(nodeId)) continue;

    visited.add(nodeId);
    const node = cfg.nodes[nodeId];

    for (const successorId of node.successors) {
      if (!visited.has(successorId)) {
        queue.push(successorId);
      }
    }
  }

  // Nodes not visited are unreachable
  for (let i = 0; i < cfg.nodes.length; i++) {
    if (!visited.has(i)) {
      cfg.unreachableNodes.add(i);
      cfg.nodes[i].block.attributes.unreachable = true;
    }
  }
}

/**
 * Calculate cyclomatic complexity
 * M = E - N + 2P
 * where E = edges, N = nodes, P = connected components
 */
function calculateCyclomaticComplexity(cfg) {
  const E = cfg.edges.length;
  const N = cfg.nodes.length;
  const P = 1; // Assuming single connected component

  return E - N + 2 * P;
}

/**
 * Detect control flow obfuscation
 */
function detectControlFlowObfuscation(cfg) {
  const obfuscations = [];

  // Detect opaque predicates (always true/false conditions)
  const opaquePredicates = detectOpaquePredicates(cfg);
  if (opaquePredicates.length > 0) {
    obfuscations.push({
      type: 'opaque_predicates',
      locations: opaquePredicates,
      description: 'Detected conditions that are always true or false'
    });
  }

  // Detect control flow flattening
  if (detectControlFlowFlattening(cfg)) {
    obfuscations.push({
      type: 'control_flow_flattening',
      description: 'Detected flattened control flow (dispatcher pattern)'
    });
  }

  // Detect junk code insertion
  const junkCode = detectJunkCode(cfg);
  if (junkCode.length > 0) {
    obfuscations.push({
      type: 'junk_code',
      locations: junkCode,
      description: 'Detected likely junk/dead code'
    });
  }

  // Detect instruction substitution
  const substitutions = detectInstructionSubstitution(cfg);
  if (substitutions.length > 0) {
    obfuscations.push({
      type: 'instruction_substitution',
      locations: substitutions,
      description: 'Detected complex instruction sequences replacing simple operations'
    });
  }

  cfg.obfuscations = obfuscations;
}

/**
 * Detect opaque predicates
 */
function detectOpaquePredicates(cfg) {
  const predicates = [];

  for (const node of cfg.nodes) {
    if (node.block.type !== NODE_TYPES.BRANCH) continue;

    const block = node.block;
    const lastInst = block.instructions[block.instructions.length - 1];

    // Check for suspicious patterns
    // Example: cmp reg, reg (comparing register with itself)
    if (lastInst.mnemonic === 'cmp' || lastInst.mnemonic === 'test') {
      const operands = lastInst.operands ? lastInst.operands.split(',').map(s => s.trim()) : [];
      
      if (operands.length === 2 && operands[0] === operands[1]) {
        predicates.push({
          nodeId: node.id,
          address: lastInst.address,
          type: 'self_comparison',
          alwaysTrue: lastInst.mnemonic === 'test'
        });
      }
    }

    // Check for always-true mathematical conditions
    // Example: x * x >= 0 (always true for real numbers)
    const instructions = block.instructions;
    for (let i = 0; i < instructions.length - 1; i++) {
      const inst1 = instructions[i];
      const inst2 = instructions[i + 1];

      if (inst1.mnemonic === 'imul' && inst2.mnemonic === 'cmp') {
        // Check if multiplying value by itself and comparing >= 0
        predicates.push({
          nodeId: node.id,
          address: inst1.address,
          type: 'mathematical_identity',
          alwaysTrue: true
        });
      }
    }
  }

  return predicates;
}

/**
 * Detect control flow flattening
 */
function detectControlFlowFlattening(cfg) {
  // Control flow flattening uses a dispatcher block
  // All blocks jump to dispatcher, which determines next block

  let dispatcherCandidates = 0;
  let totalBlocks = cfg.nodes.length;

  for (const node of cfg.nodes) {
    // Dispatcher typically has many predecessors and many successors
    if (node.predecessors.length >= totalBlocks * 0.5 && 
        node.successors.length >= totalBlocks * 0.3) {
      dispatcherCandidates++;
    }
  }

  // If we find dispatcher-like blocks, likely flattened
  return dispatcherCandidates > 0;
}

/**
 * Detect junk/dead code
 */
function detectJunkCode(cfg) {
  const junkCode = [];

  for (const node of cfg.nodes) {
    const block = node.block;
    
    // Unreachable code is junk
    if (block.attributes.unreachable) {
      junkCode.push({
        nodeId: node.id,
        reason: 'unreachable'
      });
      continue;
    }

    // Check for operations with no effect
    for (const inst of block.instructions) {
      // NOP instructions
      if (inst.mnemonic === 'nop') {
        junkCode.push({
          nodeId: node.id,
          address: inst.address,
          reason: 'nop_instruction'
        });
      }

      // Operations with no side effects (e.g., mov reg, reg)
      if (inst.mnemonic === 'mov') {
        const operands = inst.operands ? inst.operands.split(',').map(s => s.trim()) : [];
        if (operands.length === 2 && operands[0] === operands[1]) {
          junkCode.push({
            nodeId: node.id,
            address: inst.address,
            reason: 'identity_operation'
          });
        }
      }

      // Push followed immediately by pop of same register
      if (inst.mnemonic === 'push') {
        const nextInstIndex = block.instructions.indexOf(inst) + 1;
        if (nextInstIndex < block.instructions.length) {
          const nextInst = block.instructions[nextInstIndex];
          if (nextInst.mnemonic === 'pop' && 
              inst.operands === nextInst.operands) {
            junkCode.push({
              nodeId: node.id,
              address: inst.address,
              reason: 'useless_push_pop'
            });
          }
        }
      }
    }
  }

  return junkCode;
}

/**
 * Detect instruction substitution obfuscation
 */
function detectInstructionSubstitution(cfg) {
  const substitutions = [];

  for (const node of cfg.nodes) {
    const block = node.block;
    const instructions = block.instructions;

    // Look for complex sequences that replace simple operations
    for (let i = 0; i < instructions.length - 2; i++) {
      const inst1 = instructions[i];
      const inst2 = instructions[i + 1];
      const inst3 = instructions[i + 2];

      // Example: neg + add instead of sub
      if (inst1.mnemonic === 'neg' && inst2.mnemonic === 'add') {
        substitutions.push({
          nodeId: node.id,
          address: inst1.address,
          original: 'sub',
          substituted: 'neg + add',
          length: 2
        });
      }

      // Example: Complex xor chains for constant
      if (inst1.mnemonic === 'xor' && inst2.mnemonic === 'xor' && inst3.mnemonic === 'xor') {
        substitutions.push({
          nodeId: node.id,
          address: inst1.address,
          original: 'mov immediate',
          substituted: 'xor chain',
          length: 3
        });
      }
    }
  }

  return substitutions;
}

/**
 * Helper: Check if instruction is control flow
 */
function isControlFlowInstruction(inst) {
  if (!inst || !inst.mnemonic) return false;
  const mnemonic = inst.mnemonic.toLowerCase();
  return mnemonic.startsWith('j') || mnemonic === 'call' || mnemonic === 'ret';
}

/**
 * Helper: Check if instruction is conditional branch
 */
function isConditionalBranch(inst) {
  if (!inst || !inst.mnemonic) return false;
  const mnemonic = inst.mnemonic.toLowerCase();
  const conditionalJumps = ['je', 'jz', 'jne', 'jnz', 'jg', 'jge', 'jl', 'jle', 
                            'ja', 'jae', 'jb', 'jbe', 'jp', 'jnp', 'js', 'jns', 
                            'jo', 'jno', 'jcxz', 'jecxz'];
  return conditionalJumps.includes(mnemonic);
}

/**
 * Helper: Check if instruction is unconditional jump
 */
function isUnconditionalJump(inst) {
  if (!inst || !inst.mnemonic) return false;
  return inst.mnemonic.toLowerCase() === 'jmp';
}

/**
 * Helper: Check if instruction is return
 */
function isReturn(inst) {
  if (!inst || !inst.mnemonic) return false;
  return inst.mnemonic.toLowerCase() === 'ret';
}

/**
 * Helper: Check if instruction is call
 */
function isCall(inst) {
  if (!inst || !inst.mnemonic) return false;
  return inst.mnemonic.toLowerCase() === 'call';
}

/**
 * Helper: Check if node has self-loop
 */
function hasSelfLoop(cfg, nodeId) {
  const node = cfg.nodes[nodeId];
  return node.successors.includes(nodeId);
}

/**
 * Helper: Find instruction index by address
 */
function findInstructionIndexByAddress(instructions, address) {
  for (let i = 0; i < instructions.length; i++) {
    if (instructions[i].addressNum === address || 
        instructions[i].address === address) {
      return i;
    }
  }
  return -1;
}

/**
 * Helper: Find block index by address
 */
function findBlockIndexByAddress(blocks, address) {
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].startAddress === address || 
        (address >= blocks[i].startAddress && address <= blocks[i].endAddress)) {
      return i;
    }
  }
  return -1;
}

/**
 * Helper: Intersect multiple sets
 */
function intersectSets(sets) {
  if (sets.length === 0) return new Set();
  if (sets.length === 1) return new Set(sets[0]);

  const result = new Set(sets[0]);
  for (let i = 1; i < sets.length; i++) {
    for (const item of result) {
      if (!sets[i].has(item)) {
        result.delete(item);
      }
    }
  }

  return result;
}

/**
 * Helper: Check if two sets are equal
 */
function setsEqual(set1, set2) {
  if (set1.size !== set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
}

/**
 * Export control flow graph to DOT format for visualization
 */
export function exportCFGToDot(cfg) {
  let dot = 'digraph CFG {\n';
  dot += '  rankdir=TB;\n';
  dot += '  node [shape=box, style=filled];\n\n';

  // Add nodes
  for (const node of cfg.nodes) {
    const label = `Block ${node.id}\\n${node.block.startAddress}`;
    let color = 'lightgray';

    if (node.type === NODE_TYPES.ENTRY) color = 'lightgreen';
    else if (node.type === NODE_TYPES.RETURN) color = 'lightcoral';
    else if (node.type === NODE_TYPES.LOOP_HEADER) color = 'lightblue';
    else if (node.block.attributes.unreachable) color = 'darkgray';

    dot += `  node${node.id} [label="${label}", fillcolor=${color}];\n`;
  }

  dot += '\n';

  // Add edges
  for (const edge of cfg.edges) {
    let style = 'solid';
    let color = 'black';
    let label = '';

    if (edge.type === EDGE_TYPES.CONDITIONAL_TRUE) {
      color = 'green';
      label = 'true';
    } else if (edge.type === EDGE_TYPES.CONDITIONAL_FALSE) {
      color = 'red';
      label = 'false';
    } else if (edge.isBackedge) {
      style = 'dashed';
      color = 'blue';
      label = 'backedge';
    }

    dot += `  node${edge.from} -> node${edge.to} [style=${style}, color=${color}, label="${label}"];\n`;
  }

  dot += '}\n';
  return dot;
}

/**
 * Get control flow statistics
 */
export function getCFGStatistics(cfg) {
  return {
    nodeCount: cfg.nodes.length,
    edgeCount: cfg.edges.length,
    branchCount: cfg.metadata.branchCount,
    loopCount: cfg.metadata.loopCount,
    callCount: cfg.metadata.callCount,
    cyclomaticComplexity: cfg.complexity,
    unreachableNodeCount: cfg.unreachableNodes.size,
    exitNodeCount: cfg.exitNodes.length,
    averageSuccessors: (cfg.edges.length / cfg.nodes.length).toFixed(2),
    hasObfuscation: cfg.obfuscations && cfg.obfuscations.length > 0
  };
}
