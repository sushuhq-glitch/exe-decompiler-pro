import React, { useState, useRef, useEffect } from 'react';
import './CFGViewer.css';

/**
 * Professional Control Flow Graph Viewer
 * Visualizes function control flow with interactive graph
 */
function CFGViewer({ functionData, peData }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [graph, setGraph] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  /**
   * Build control flow graph from function data
   */
  useEffect(() => {
    if (!functionData || !functionData.instructions) {
      setGraph(null);
      return;
    }

    const cfg = buildControlFlowGraph(functionData.instructions);
    layoutGraph(cfg);
    setGraph(cfg);
  }, [functionData]);

  /**
   * Draw graph on canvas
   */
  useEffect(() => {
    if (!graph || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges first (so they appear behind nodes)
    drawEdges(ctx, graph);

    // Draw nodes
    drawNodes(ctx, graph, selectedNode);

    ctx.restore();
  }, [graph, zoom, pan, selectedNode]);

  /**
   * Build control flow graph
   */
  function buildControlFlowGraph(instructions) {
    const cfg = {
      nodes: [],
      edges: [],
      entryNode: null
    };

    if (!instructions || instructions.length === 0) {
      return cfg;
    }

    // Identify basic block leaders
    const leaders = new Set();
    leaders.add(instructions[0].addressNum);

    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];

      // Jump/call targets are leaders
      if (inst.target && inst.type === 'control_flow') {
        leaders.add(inst.target);

        // Instruction after conditional jump is leader
        if (i + 1 < instructions.length && !inst.mnemonic.startsWith('jmp')) {
          leaders.add(instructions[i + 1].addressNum);
        }
      }

      // Instruction after return is leader
      if ((inst.mnemonic === 'ret' || inst.mnemonic === 'retn') && i + 1 < instructions.length) {
        leaders.add(instructions[i + 1].addressNum);
      }
    }

    // Build basic blocks
    const leaderArray = Array.from(leaders).sort((a, b) => a - b);
    const addressToNode = new Map();

    for (let i = 0; i < leaderArray.length; i++) {
      const startAddr = leaderArray[i];
      const endAddr = i + 1 < leaderArray.length ? leaderArray[i + 1] : 
        instructions[instructions.length - 1].addressNum + 10;

      const blockInstructions = instructions.filter(inst =>
        inst.addressNum >= startAddr && inst.addressNum < endAddr
      );

      if (blockInstructions.length > 0) {
        const node = {
          id: cfg.nodes.length,
          startAddress: startAddr,
          endAddress: blockInstructions[blockInstructions.length - 1].addressNum,
          instructions: blockInstructions,
          successors: [],
          predecessors: [],
          x: 0,
          y: 0,
          width: 200,
          height: 0
        };

        // Calculate node height based on instruction count
        node.height = Math.max(60, 20 + blockInstructions.length * 18);

        cfg.nodes.push(node);
        addressToNode.set(startAddr, node);

        if (i === 0) {
          cfg.entryNode = node;
        }
      }
    }

    // Build edges
    for (const node of cfg.nodes) {
      const lastInst = node.instructions[node.instructions.length - 1];

      if (lastInst.type === 'control_flow') {
        // Add edge to target
        if (lastInst.target) {
          const targetNode = addressToNode.get(lastInst.target);
          if (targetNode) {
            const edge = {
              from: node.id,
              to: targetNode.id,
              type: lastInst.mnemonic.startsWith('j') ? 'conditional' : 'call'
            };
            cfg.edges.push(edge);
            node.successors.push(targetNode.id);
            targetNode.predecessors.push(node.id);
          }
        }

        // For conditional jumps, add fall-through edge
        if (!lastInst.mnemonic.startsWith('jmp') && !lastInst.mnemonic.startsWith('ret')) {
          const nextNode = cfg.nodes.find(n => n.startAddress > node.endAddress);
          if (nextNode) {
            const edge = {
              from: node.id,
              to: nextNode.id,
              type: 'fallthrough'
            };
            cfg.edges.push(edge);
            node.successors.push(nextNode.id);
            nextNode.predecessors.push(node.id);
          }
        }
      } else {
        // Fall-through to next block
        const nextNode = cfg.nodes.find(n => n.startAddress > node.endAddress);
        if (nextNode) {
          const edge = {
            from: node.id,
            to: nextNode.id,
            type: 'fallthrough'
          };
          cfg.edges.push(edge);
          node.successors.push(nextNode.id);
          nextNode.predecessors.push(node.id);
        }
      }
    }

    return cfg;
  }

  /**
   * Layout graph using hierarchical layout
   */
  function layoutGraph(cfg) {
    if (!cfg || cfg.nodes.length === 0) return;

    // Simple hierarchical layout
    const layers = [];
    const visited = new Set();
    const nodeLayer = new Map();

    // BFS to assign layers
    const queue = [cfg.entryNode || cfg.nodes[0]];
    nodeLayer.set(queue[0].id, 0);

    while (queue.length > 0) {
      const node = queue.shift();
      if (visited.has(node.id)) continue;
      visited.add(node.id);

      const layer = nodeLayer.get(node.id);

      if (!layers[layer]) {
        layers[layer] = [];
      }
      layers[layer].push(node);

      // Add successors to next layer
      for (const succId of node.successors) {
        const succ = cfg.nodes[succId];
        if (!nodeLayer.has(succId)) {
          nodeLayer.set(succId, layer + 1);
          queue.push(succ);
        }
      }
    }

    // Position nodes
    const layerSpacing = 150;
    const nodeSpacing = 250;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const layerWidth = layer.length * nodeSpacing;
      const startX = -layerWidth / 2 + nodeSpacing / 2;

      for (let j = 0; j < layer.length; j++) {
        const node = layer[j];
        node.x = startX + j * nodeSpacing;
        node.y = i * layerSpacing + 50;
      }
    }
  }

  /**
   * Draw edges on canvas
   */
  function drawEdges(ctx, cfg) {
    for (const edge of cfg.edges) {
      const fromNode = cfg.nodes[edge.from];
      const toNode = cfg.nodes[edge.to];

      if (!fromNode || !toNode) continue;

      const fromX = fromNode.x + fromNode.width / 2;
      const fromY = fromNode.y + fromNode.height;
      const toX = toNode.x + toNode.width / 2;
      const toY = toNode.y;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);

      // Draw curved line for back edges (loops)
      if (toNode.y < fromNode.y) {
        const controlX = fromX + 80;
        const controlY = (fromY + toY) / 2;
        ctx.quadraticCurveTo(controlX, fromY, controlX, controlY);
        ctx.quadraticCurveTo(controlX, toY, toX, toY);
      } else {
        ctx.lineTo(toX, toY);
      }

      // Style based on edge type
      if (edge.type === 'conditional') {
        ctx.strokeStyle = '#4fc1ff';
        ctx.lineWidth = 2;
      } else if (edge.type === 'call') {
        ctx.strokeStyle = '#ce9178';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
      } else {
        ctx.strokeStyle = '#858585';
        ctx.lineWidth = 1.5;
      }

      ctx.stroke();
      ctx.setLineDash([]);

      // Draw arrowhead
      drawArrowhead(ctx, fromX, fromY, toX, toY);
    }
  }

  /**
   * Draw arrowhead
   */
  function drawArrowhead(ctx, fromX, fromY, toX, toY) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowSize = 8;

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowSize * Math.cos(angle - Math.PI / 6),
      toY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - arrowSize * Math.cos(angle + Math.PI / 6),
      toY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }

  /**
   * Draw nodes on canvas
   */
  function drawNodes(ctx, cfg, selectedNode) {
    for (const node of cfg.nodes) {
      const isSelected = selectedNode && selectedNode.id === node.id;

      // Draw node background
      ctx.fillStyle = isSelected ? '#094771' : '#2d2d30';
      ctx.strokeStyle = isSelected ? '#1177bb' : '#3e3e42';
      ctx.lineWidth = isSelected ? 3 : 1;

      ctx.fillRect(node.x, node.y, node.width, node.height);
      ctx.strokeRect(node.x, node.y, node.width, node.height);

      // Draw node header
      ctx.fillStyle = '#252526';
      ctx.fillRect(node.x, node.y, node.width, 24);

      // Draw header text
      ctx.fillStyle = '#4fc1ff';
      ctx.font = '12px Consolas, monospace';
      ctx.fillText(
        `0x${node.startAddress.toString(16).padStart(8, '0')}`,
        node.x + 8,
        node.y + 16
      );

      // Draw instructions
      ctx.fillStyle = '#d4d4d4';
      ctx.font = '11px Consolas, monospace';

      const maxInstructions = Math.min(node.instructions.length, 10);
      for (let i = 0; i < maxInstructions; i++) {
        const inst = node.instructions[i];
        const text = `${inst.mnemonic} ${inst.operands || ''}`.trim();
        const truncated = text.length > 28 ? text.substring(0, 25) + '...' : text;
        ctx.fillText(truncated, node.x + 8, node.y + 40 + i * 18);
      }

      if (node.instructions.length > maxInstructions) {
        ctx.fillStyle = '#858585';
        ctx.fillText('...', node.x + 8, node.y + 40 + maxInstructions * 18);
      }
    }
  }

  /**
   * Handle mouse down
   */
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a node
    if (graph) {
      for (const node of graph.nodes) {
        const nodeX = node.x * zoom + pan.x;
        const nodeY = node.y * zoom + pan.y;
        const nodeW = node.width * zoom;
        const nodeH = node.height * zoom;

        if (x >= nodeX && x <= nodeX + nodeW && y >= nodeY && y <= nodeY + nodeH) {
          setSelectedNode(node);
          return;
        }
      }
    }

    // Start panning
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  /**
   * Handle mouse move
   */
  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  /**
   * Handle mouse up
   */
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  /**
   * Handle zoom
   */
  const handleZoom = (delta) => {
    const newZoom = Math.max(0.25, Math.min(2.0, zoom + delta));
    setZoom(newZoom);
  };

  /**
   * Reset view
   */
  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 400, y: 50 });
  };

  /**
   * Export to PNG
   */
  const exportToPNG = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'cfg.png';
    a.click();
  };

  return (
    <div className="cfg-viewer" ref={containerRef}>
      <div className="cfg-toolbar">
        <div className="toolbar-group">
          <button className="cfg-btn" onClick={() => handleZoom(0.1)} title="Zoom In">
            +
          </button>
          <span className="zoom-level">{(zoom * 100).toFixed(0)}%</span>
          <button className="cfg-btn" onClick={() => handleZoom(-0.1)} title="Zoom Out">
            -
          </button>
        </div>
        <div className="toolbar-group">
          <button className="cfg-btn" onClick={resetView} title="Reset View">
            Reset
          </button>
          <button className="cfg-btn" onClick={exportToPNG} title="Export to PNG">
            Export PNG
          </button>
        </div>
        {selectedNode && (
          <div className="selected-info">
            Block: 0x{selectedNode.startAddress.toString(16).padStart(8, '0')} 
            ({selectedNode.instructions.length} instructions)
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="cfg-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {!graph && (
        <div className="cfg-empty">
          Select a function to view its control flow graph
        </div>
      )}
    </div>
  );
}

export default CFGViewer;
