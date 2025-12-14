import React, { useState, useMemo } from 'react';
import './StringViewer.css';

/**
 * Professional String Viewer Component
 * Displays extracted strings with advanced filtering and export capabilities
 */
function StringViewer({ fileData, peData, onJumpToHex }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'ascii', 'unicode', 'base64'
  const [minLength, setMinLength] = useState(4);
  const [sortBy, setSortBy] = useState('address'); // 'address', 'length', 'type'
  const [selectedString, setSelectedString] = useState(null);

  /**
   * Extract all strings from binary data
   */
  const extractedStrings = useMemo(() => {
    if (!fileData || fileData.length === 0) {
      return [];
    }

    const strings = [];
    const data = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);

    // Extract ASCII strings
    let currentString = '';
    let startOffset = 0;

    for (let i = 0; i < data.length; i++) {
      const byte = data[i];

      // Printable ASCII characters (0x20-0x7E)
      if (byte >= 0x20 && byte <= 0x7E) {
        if (currentString.length === 0) {
          startOffset = i;
        }
        currentString += String.fromCharCode(byte);
      } else {
        if (currentString.length >= minLength) {
          strings.push({
            offset: startOffset,
            address: `0x${startOffset.toString(16).padStart(8, '0')}`,
            value: currentString,
            length: currentString.length,
            type: 'ASCII',
            section: getSectionName(startOffset, peData),
            encoding: 'ASCII'
          });
        }
        currentString = '';
      }
    }

    // Extract Unicode strings (UTF-16LE)
    for (let i = 0; i < data.length - 3; i += 2) {
      let unicodeString = '';
      let unicodeStart = i;
      let unicodeLength = 0;

      for (let j = i; j < data.length - 1; j += 2) {
        const char = data[j] | (data[j + 1] << 8);

        // Check for printable Unicode characters
        if ((char >= 0x20 && char <= 0x7E) || (char >= 0xA0 && char <= 0xFFFF)) {
          unicodeString += String.fromCharCode(char);
          unicodeLength += 2;
        } else if (char === 0) {
          // Null terminator
          if (unicodeString.length >= minLength) {
            strings.push({
              offset: unicodeStart,
              address: `0x${unicodeStart.toString(16).padStart(8, '0')}`,
              value: unicodeString,
              length: unicodeLength,
              type: 'Unicode',
              section: getSectionName(unicodeStart, peData),
              encoding: 'UTF-16LE'
            });
          }
          break;
        } else {
          // Non-printable character
          if (unicodeString.length >= minLength) {
            strings.push({
              offset: unicodeStart,
              address: `0x${unicodeStart.toString(16).padStart(8, '0')}`,
              value: unicodeString,
              length: unicodeLength,
              type: 'Unicode',
              section: getSectionName(unicodeStart, peData),
              encoding: 'UTF-16LE'
            });
          }
          break;
        }
      }
    }

    // Extract potential Base64 strings
    const base64Regex = /^[A-Za-z0-9+/]{20,}={0,2}$/;
    for (const str of strings) {
      if (str.type === 'ASCII' && base64Regex.test(str.value)) {
        try {
          // Try to decode Base64
          const decoded = atob(str.value);
          if (decoded.length > 0) {
            strings.push({
              ...str,
              type: 'Base64',
              decodedValue: decoded,
              decodedLength: decoded.length
            });
          }
        } catch (e) {
          // Not valid Base64
        }
      }
    }

    // Remove duplicates based on offset
    const uniqueStrings = [];
    const seenOffsets = new Set();

    for (const str of strings) {
      if (!seenOffsets.has(str.offset)) {
        seenOffsets.add(str.offset);
        uniqueStrings.push(str);
      }
    }

    return uniqueStrings;
  }, [fileData, peData, minLength]);

  /**
   * Get section name for a given offset
   */
  function getSectionName(offset, peData) {
    if (!peData || !peData.sections) {
      return 'Unknown';
    }

    for (const section of peData.sections) {
      if (offset >= section.pointerToRawData &&
          offset < section.pointerToRawData + section.sizeOfRawData) {
        return section.name;
      }
    }

    return 'Unknown';
  }

  /**
   * Filter and sort strings
   */
  const filteredStrings = useMemo(() => {
    let filtered = extractedStrings;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(str => 
        str.type.toLowerCase() === filterType.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(str =>
        str.value.toLowerCase().includes(searchLower) ||
        str.address.toLowerCase().includes(searchLower) ||
        (str.decodedValue && str.decodedValue.toLowerCase().includes(searchLower))
      );
    }

    // Sort strings
    filtered.sort((a, b) => {
      if (sortBy === 'address') {
        return a.offset - b.offset;
      } else if (sortBy === 'length') {
        return b.length - a.length;
      } else if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      }
      return 0;
    });

    return filtered;
  }, [extractedStrings, filterType, searchTerm, sortBy]);

  /**
   * Export strings to file
   */
  const exportStrings = async (format) => {
    let content = '';

    if (format === 'txt') {
      content = filteredStrings.map(str => 
        `[${str.address}] ${str.value}`
      ).join('\n');
    } else if (format === 'csv') {
      content = 'Address,Type,Section,Length,Value\n';
      content += filteredStrings.map(str =>
        `"${str.address}","${str.type}","${str.section}",${str.length},"${str.value.replace(/"/g, '""')}"`
      ).join('\n');
    } else if (format === 'json') {
      content = JSON.stringify(filteredStrings, null, 2);
    }

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strings.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Handle string click
   */
  const handleStringClick = (str) => {
    setSelectedString(str);
    if (onJumpToHex) {
      onJumpToHex(str.offset);
    }
  };

  /**
   * Get cross-references for a string (placeholder)
   */
  const getXRefs = (str) => {
    // This would require analyzing the code for references to this address
    // Placeholder implementation
    return [];
  };

  return (
    <div className="string-viewer">
      <div className="string-viewer-header">
        <h2 className="panel-title">String Viewer</h2>
        <div className="string-count">
          {filteredStrings.length} strings ({extractedStrings.length} total)
        </div>
      </div>

      <div className="string-viewer-toolbar">
        <div className="toolbar-section">
          <input
            type="text"
            className="search-input"
            placeholder="Search strings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="toolbar-section">
          <label>Type:</label>
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="ascii">ASCII</option>
            <option value="unicode">Unicode</option>
            <option value="base64">Base64</option>
          </select>
        </div>

        <div className="toolbar-section">
          <label>Min Length:</label>
          <input
            type="number"
            className="length-input"
            value={minLength}
            onChange={(e) => setMinLength(parseInt(e.target.value) || 4)}
            min="1"
            max="100"
          />
        </div>

        <div className="toolbar-section">
          <label>Sort by:</label>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="address">Address</option>
            <option value="length">Length</option>
            <option value="type">Type</option>
          </select>
        </div>

        <div className="toolbar-section">
          <button
            className="export-btn"
            onClick={() => exportStrings('txt')}
            title="Export as TXT"
          >
            Export TXT
          </button>
          <button
            className="export-btn"
            onClick={() => exportStrings('csv')}
            title="Export as CSV"
          >
            Export CSV
          </button>
          <button
            className="export-btn"
            onClick={() => exportStrings('json')}
            title="Export as JSON"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="string-table-container">
        <table className="string-table">
          <thead>
            <tr>
              <th>Address</th>
              <th>Type</th>
              <th>Section</th>
              <th>Length</th>
              <th>Value</th>
              <th>XRefs</th>
            </tr>
          </thead>
          <tbody>
            {filteredStrings.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  {extractedStrings.length === 0 ? 'No strings found' : 'No strings match the filter'}
                </td>
              </tr>
            ) : (
              filteredStrings.map((str, index) => (
                <tr
                  key={`${str.offset}-${index}`}
                  className={`string-row ${selectedString === str ? 'selected' : ''}`}
                  onClick={() => handleStringClick(str)}
                >
                  <td className="address-cell">{str.address}</td>
                  <td className="type-cell">
                    <span className={`type-badge type-${str.type.toLowerCase()}`}>
                      {str.type}
                    </span>
                  </td>
                  <td className="section-cell">{str.section}</td>
                  <td className="length-cell">{str.length}</td>
                  <td className="value-cell" title={str.value}>
                    {str.value.length > 80 ? str.value.substring(0, 80) + '...' : str.value}
                    {str.decodedValue && (
                      <div className="decoded-value" title={str.decodedValue}>
                        Decoded: {str.decodedValue.substring(0, 40)}...
                      </div>
                    )}
                  </td>
                  <td className="xrefs-cell">
                    {getXRefs(str).length || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedString && (
        <div className="string-details">
          <div className="details-header">String Details</div>
          <div className="details-content">
            <div className="detail-row">
              <span className="detail-label">Address:</span>
              <span className="detail-value">{selectedString.address}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{selectedString.type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Encoding:</span>
              <span className="detail-value">{selectedString.encoding}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Section:</span>
              <span className="detail-value">{selectedString.section}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Length:</span>
              <span className="detail-value">{selectedString.length} bytes</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Value:</span>
              <span className="detail-value value-full">{selectedString.value}</span>
            </div>
            {selectedString.decodedValue && (
              <div className="detail-row">
                <span className="detail-label">Decoded (Base64):</span>
                <span className="detail-value value-full">{selectedString.decodedValue}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StringViewer;
