import React, { useState, useRef, useEffect } from 'react';
import './HexViewer.css';

/**
 * Professional Hex Viewer Component
 * Displays binary data in hexadecimal format with ASCII panel
 */
function HexViewer({ data, highlights = [], onSelect }) {
  const [selectedOffset, setSelectedOffset] = useState(null);
  const [selectedLength, setSelectedLength] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [jumpAddress, setJumpAddress] = useState('');
  const [viewOffset, setViewOffset] = useState(0);
  const containerRef = useRef(null);
  
  const BYTES_PER_ROW = 16;
  const ROWS_PER_PAGE = 30;
  const BYTES_PER_PAGE = BYTES_PER_ROW * ROWS_PER_PAGE;
  
  // Convert data to Uint8Array if needed
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data || []);
  
  // Calculate visible range
  const startOffset = viewOffset;
  const endOffset = Math.min(startOffset + BYTES_PER_PAGE, bytes.length);
  
  /**
   * Render a single row of hex data
   */
  const renderRow = (offset) => {
    const rowBytes = [];
    const rowAscii = [];
    
    for (let i = 0; i < BYTES_PER_ROW; i++) {
      const byteOffset = offset + i;
      
      if (byteOffset >= bytes.length) {
        rowBytes.push(
          <span key={i} className="hex-byte empty">  </span>
        );
        rowAscii.push(
          <span key={i} className="ascii-char empty"> </span>
        );
        continue;
      }
      
      const byte = bytes[byteOffset];
      const hexValue = byte.toString(16).padStart(2, '0').toUpperCase();
      const asciiChar = (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
      
      // Check if this byte is highlighted
      const highlight = highlights.find(h =>
        byteOffset >= h.offset && byteOffset < h.offset + h.length
      );
      
      // Check if this byte is selected
      const isSelected = selectedOffset !== null &&
        byteOffset >= selectedOffset &&
        byteOffset < selectedOffset + selectedLength;
      
      const byteClass = `hex-byte ${highlight ? `highlight-${highlight.color}` : ''} ${isSelected ? 'selected' : ''}`;
      const asciiClass = `ascii-char ${highlight ? `highlight-${highlight.color}` : ''} ${isSelected ? 'selected' : ''}`;
      
      rowBytes.push(
        <span
          key={i}
          className={byteClass}
          onClick={() => handleByteClick(byteOffset)}
          title={highlight ? highlight.label : `Offset: 0x${byteOffset.toString(16)}`}
        >
          {hexValue}
        </span>
      );
      
      rowAscii.push(
        <span
          key={i}
          className={asciiClass}
          onClick={() => handleByteClick(byteOffset)}
        >
          {asciiChar}
        </span>
      );
    }
    
    return (
      <div key={offset} className="hex-row">
        <span className="hex-address">{`0x${offset.toString(16).padStart(8, '0').toUpperCase()}`}</span>
        <span className="hex-bytes">{rowBytes}</span>
        <span className="hex-ascii">{rowAscii}</span>
      </div>
    );
  };
  
  /**
   * Handle byte click for selection
   */
  const handleByteClick = (offset) => {
    setSelectedOffset(offset);
    setSelectedLength(1);
    
    if (onSelect) {
      onSelect(offset, 1);
    }
  };
  
  /**
   * Handle search
   */
  const handleSearch = () => {
    if (!searchTerm) return;
    
    // Convert search term to bytes
    let searchBytes = [];
    
    if (searchTerm.startsWith('0x')) {
      // Hex search
      const hex = searchTerm.slice(2).replace(/\s/g, '');
      for (let i = 0; i < hex.length; i += 2) {
        searchBytes.push(parseInt(hex.slice(i, i + 2), 16));
      }
    } else {
      // Text search
      for (let i = 0; i < searchTerm.length; i++) {
        searchBytes.push(searchTerm.charCodeAt(i));
      }
    }
    
    // Search for pattern
    for (let i = 0; i < bytes.length - searchBytes.length; i++) {
      let found = true;
      for (let j = 0; j < searchBytes.length; j++) {
        if (bytes[i + j] !== searchBytes[j]) {
          found = false;
          break;
        }
      }
      
      if (found) {
        // Found match, jump to it
        setViewOffset(Math.floor(i / BYTES_PER_ROW) * BYTES_PER_ROW);
        setSelectedOffset(i);
        setSelectedLength(searchBytes.length);
        return;
      }
    }
    
    alert('Pattern not found');
  };
  
  /**
   * Handle jump to address
   */
  const handleJumpToAddress = () => {
    if (!jumpAddress) return;
    
    let address = 0;
    if (jumpAddress.startsWith('0x')) {
      address = parseInt(jumpAddress, 16);
    } else {
      address = parseInt(jumpAddress, 10);
    }
    
    if (isNaN(address) || address < 0 || address >= bytes.length) {
      alert('Invalid address');
      return;
    }
    
    setViewOffset(Math.floor(address / BYTES_PER_ROW) * BYTES_PER_ROW);
    setSelectedOffset(address);
    setSelectedLength(1);
  };
  
  /**
   * Handle scroll
   */
  const handleScroll = (direction) => {
    if (direction === 'up') {
      setViewOffset(Math.max(0, viewOffset - BYTES_PER_PAGE));
    } else if (direction === 'down') {
      setViewOffset(Math.min(bytes.length - BYTES_PER_ROW, viewOffset + BYTES_PER_PAGE));
    } else if (direction === 'pageup') {
      setViewOffset(Math.max(0, viewOffset - BYTES_PER_PAGE * 5));
    } else if (direction === 'pagedown') {
      setViewOffset(Math.min(bytes.length - BYTES_PER_ROW, viewOffset + BYTES_PER_PAGE * 5));
    }
  };
  
  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!containerRef.current?.contains(document.activeElement)) return;
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleScroll('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleScroll('down');
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        handleScroll('pageup');
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        handleScroll('pagedown');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewOffset]);
  
  // Render rows
  const rows = [];
  for (let offset = startOffset; offset < endOffset; offset += BYTES_PER_ROW) {
    rows.push(renderRow(offset));
  }
  
  return (
    <div className="hex-viewer" ref={containerRef} tabIndex={0}>
      <div className="hex-viewer-toolbar">
        <div className="hex-viewer-search">
          <input
            type="text"
            className="hex-search-input"
            placeholder="Search (hex: 0x1234 or text)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="hex-btn" onClick={handleSearch}>
            🔍 Search
          </button>
        </div>
        
        <div className="hex-viewer-jump">
          <input
            type="text"
            className="hex-jump-input"
            placeholder="Jump to address (0x...)"
            value={jumpAddress}
            onChange={(e) => setJumpAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleJumpToAddress()}
          />
          <button className="hex-btn" onClick={handleJumpToAddress}>
            ➜ Jump
          </button>
        </div>
        
        <div className="hex-viewer-info">
          {selectedOffset !== null && (
            <span>
              Selected: 0x{selectedOffset.toString(16).toUpperCase()} ({selectedLength} byte{selectedLength !== 1 ? 's' : ''})
            </span>
          )}
          {bytes.length > 0 && (
            <span>
              Size: {bytes.length} bytes (0x{bytes.length.toString(16).toUpperCase()})
            </span>
          )}
        </div>
      </div>
      
      <div className="hex-viewer-header">
        <span className="hex-header-address">Address</span>
        <span className="hex-header-bytes">
          {Array.from({ length: BYTES_PER_ROW }, (_, i) => (
            <span key={i} className="hex-header-byte">
              {i.toString(16).toUpperCase()}
            </span>
          ))}
        </span>
        <span className="hex-header-ascii">ASCII</span>
      </div>
      
      <div className="hex-viewer-content">
        {bytes.length === 0 ? (
          <div className="hex-viewer-empty">No data to display</div>
        ) : (
          rows
        )}
      </div>
      
      <div className="hex-viewer-footer">
        <div className="hex-viewer-navigation">
          <button className="hex-btn" onClick={() => handleScroll('up')} disabled={viewOffset === 0}>
            ▲ Up
          </button>
          <button className="hex-btn" onClick={() => handleScroll('down')} disabled={viewOffset >= bytes.length - BYTES_PER_ROW}>
            ▼ Down
          </button>
          <button className="hex-btn" onClick={() => handleScroll('pageup')} disabled={viewOffset === 0}>
            ⇑ Page Up
          </button>
          <button className="hex-btn" onClick={() => handleScroll('pagedown')} disabled={viewOffset >= bytes.length - BYTES_PER_ROW}>
            ⇓ Page Down
          </button>
          <button className="hex-btn" onClick={() => setViewOffset(0)} disabled={viewOffset === 0}>
            ⇱ Top
          </button>
          <button className="hex-btn" onClick={() => setViewOffset(Math.floor(bytes.length / BYTES_PER_ROW) * BYTES_PER_ROW - BYTES_PER_PAGE)} disabled={viewOffset >= bytes.length - BYTES_PER_PAGE}>
            ⇲ Bottom
          </button>
        </div>
        
        <div className="hex-viewer-legend">
          {highlights.length > 0 && (
            <>
              <span className="legend-label">Legend:</span>
              {highlights.map((h, idx) => (
                <span key={idx} className={`legend-item highlight-${h.color}`}>
                  {h.label || h.color}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default HexViewer;
