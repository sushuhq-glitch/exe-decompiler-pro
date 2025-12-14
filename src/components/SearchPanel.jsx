import React, { useState, useMemo } from 'react';
import './SearchPanel.css';

/**
 * Professional Search Panel Component
 * Supports hex search, string search, instruction search, and pattern matching
 */
function SearchPanel({ fileData, peData, onResultClick }) {
  const [searchMode, setSearchMode] = useState('string'); // 'string', 'hex', 'instruction', 'pattern'
  const [searchQuery, setSearchQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useWildcards, setUseWildcards] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  /**
   * Perform search based on mode
   */
  const performSearch = () => {
    if (!searchQuery || !fileData) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    setTimeout(() => {
      let results = [];

      switch (searchMode) {
        case 'string':
          results = searchStrings(fileData, searchQuery, caseSensitive);
          break;
        case 'hex':
          results = searchHex(fileData, searchQuery, useWildcards);
          break;
        case 'instruction':
          results = searchInstructions(fileData, peData, searchQuery);
          break;
        case 'pattern':
          results = searchPatterns(fileData, searchQuery);
          break;
        default:
          results = [];
      }

      setSearchResults(results);
      setIsSearching(false);
    }, 100);
  };

  /**
   * Search for string occurrences
   */
  const searchStrings = (data, query, caseSensitive) => {
    const results = [];
    const dataArray = data instanceof Uint8Array ? data : new Uint8Array(data);
    const searchBytes = new TextEncoder().encode(caseSensitive ? query : query.toLowerCase());
    
    for (let i = 0; i <= dataArray.length - searchBytes.length; i++) {
      let match = true;
      
      for (let j = 0; j < searchBytes.length; j++) {
        const dataByte = caseSensitive ? dataArray[i + j] : 
          String.fromCharCode(dataArray[i + j]).toLowerCase().charCodeAt(0);
        const searchByte = caseSensitive ? searchBytes[j] : 
          String.fromCharCode(searchBytes[j]).toLowerCase().charCodeAt(0);
        
        if (dataByte !== searchByte) {
          match = false;
          break;
        }
      }
      
      if (match) {
        // Extract context around match
        const contextStart = Math.max(0, i - 16);
        const contextEnd = Math.min(dataArray.length, i + query.length + 16);
        const context = Array.from(dataArray.slice(contextStart, contextEnd))
          .map(b => (b >= 0x20 && b <= 0x7E) ? String.fromCharCode(b) : '.')
          .join('');
        
        results.push({
          offset: i,
          address: `0x${i.toString(16).padStart(8, '0')}`,
          type: 'string',
          value: query,
          context,
          section: getSectionName(i, peData)
        });
      }
    }
    
    return results.slice(0, 1000); // Limit results
  };

  /**
   * Search for hex patterns
   */
  const searchHex = (data, query, useWildcards) => {
    const results = [];
    const dataArray = data instanceof Uint8Array ? data : new Uint8Array(data);
    
    // Parse hex query (supports wildcards like ?? or *)
    const hexQuery = query.replace(/\s+/g, '').toUpperCase();
    const pattern = [];
    const mask = [];
    
    for (let i = 0; i < hexQuery.length; i += 2) {
      const byte = hexQuery.substring(i, i + 2);
      
      if (useWildcards && (byte === '??' || byte === '**')) {
        pattern.push(0);
        mask.push(false); // Don't match this byte
      } else {
        const value = parseInt(byte, 16);
        if (isNaN(value)) {
          return []; // Invalid hex
        }
        pattern.push(value);
        mask.push(true); // Match this byte
      }
    }
    
    if (pattern.length === 0) {
      return results;
    }
    
    // Search for pattern
    for (let i = 0; i <= dataArray.length - pattern.length; i++) {
      let match = true;
      
      for (let j = 0; j < pattern.length; j++) {
        if (mask[j] && dataArray[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        const matchedBytes = Array.from(dataArray.slice(i, i + pattern.length))
          .map(b => b.toString(16).padStart(2, '0').toUpperCase())
          .join(' ');
        
        results.push({
          offset: i,
          address: `0x${i.toString(16).padStart(8, '0')}`,
          type: 'hex',
          value: matchedBytes,
          pattern: hexQuery,
          section: getSectionName(i, peData)
        });
      }
    }
    
    return results.slice(0, 1000); // Limit results
  };

  /**
   * Search for instruction mnemonics
   */
  const searchInstructions = (data, peData, query) => {
    const results = [];
    // This would require disassembling the code section
    // For now, return a placeholder
    
    if (!peData || !peData.sections) {
      return results;
    }
    
    // Find code sections
    const codeSections = peData.sections.filter(s => s.type === 'code');
    
    // In a full implementation, we would disassemble and search
    // For now, just return a message
    results.push({
      offset: 0,
      address: '0x00000000',
      type: 'info',
      value: `Instruction search: "${query}" - Feature requires full disassembly`,
      section: 'N/A'
    });
    
    return results;
  };

  /**
   * Search for byte patterns (more advanced than hex search)
   */
  const searchPatterns = (data, query) => {
    const results = [];
    const dataArray = data instanceof Uint8Array ? data : new Uint8Array(data);
    
    // Support various pattern formats:
    // - Hex: "55 8B EC"
    // - Wildcards: "55 ?? EC"
    // - Regex-like: "[55-60] 8B EC"
    
    // For simplicity, treat as hex search for now
    return searchHex(data, query, true);
  };

  /**
   * Get section name for offset
   */
  const getSectionName = (offset, peData) => {
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
  };

  /**
   * Handle result click
   */
  const handleResultClick = (result) => {
    if (onResultClick) {
      onResultClick(result.offset);
    }
  };

  /**
   * Handle key press in search input
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  return (
    <div className="search-panel">
      <div className="search-panel-header">
        <h2 className="panel-title">Advanced Search</h2>
      </div>

      <div className="search-panel-body">
        {/* Search Mode Selector */}
        <div className="search-mode-selector">
          <button
            className={`mode-btn ${searchMode === 'string' ? 'active' : ''}`}
            onClick={() => setSearchMode('string')}
          >
            String
          </button>
          <button
            className={`mode-btn ${searchMode === 'hex' ? 'active' : ''}`}
            onClick={() => setSearchMode('hex')}
          >
            Hex
          </button>
          <button
            className={`mode-btn ${searchMode === 'instruction' ? 'active' : ''}`}
            onClick={() => setSearchMode('instruction')}
          >
            Instruction
          </button>
          <button
            className={`mode-btn ${searchMode === 'pattern' ? 'active' : ''}`}
            onClick={() => setSearchMode('pattern')}
          >
            Pattern
          </button>
        </div>

        {/* Search Input */}
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            placeholder={getPlaceholder(searchMode)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="search-btn"
            onClick={performSearch}
            disabled={isSearching || !searchQuery}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Options */}
        <div className="search-options">
          {searchMode === 'string' && (
            <label className="option-checkbox">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              <span>Case sensitive</span>
            </label>
          )}
          {(searchMode === 'hex' || searchMode === 'pattern') && (
            <label className="option-checkbox">
              <input
                type="checkbox"
                checked={useWildcards}
                onChange={(e) => setUseWildcards(e.target.checked)}
              />
              <span>Use wildcards (??)</span>
            </label>
          )}
        </div>

        {/* Search Results */}
        <div className="search-results">
          <div className="results-header">
            <span className="results-title">Results</span>
            <span className="results-count">{searchResults.length} found</span>
          </div>

          <div className="results-list">
            {searchResults.length === 0 ? (
              <div className="no-results">
                {isSearching ? 'Searching...' : (searchQuery ? 'No results found' : 'Enter a search query')}
              </div>
            ) : (
              searchResults.map((result, index) => (
                <div
                  key={index}
                  className="result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="result-header">
                    <span className="result-address">{result.address}</span>
                    <span className="result-section">{result.section}</span>
                  </div>
                  <div className="result-content">
                    <span className={`result-type type-${result.type}`}>{result.type}</span>
                    <span className="result-value">{result.value}</span>
                  </div>
                  {result.context && (
                    <div className="result-context">{result.context}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get placeholder text for search input
 */
function getPlaceholder(mode) {
  switch (mode) {
    case 'string':
      return 'Enter string to search...';
    case 'hex':
      return 'Enter hex bytes (e.g., 55 8B EC or 55 ?? EC)...';
    case 'instruction':
      return 'Enter instruction mnemonic (e.g., call, jmp, mov)...';
    case 'pattern':
      return 'Enter pattern (e.g., 55 8B EC ?? ??)...';
    default:
      return 'Enter search query...';
  }
}

export default SearchPanel;
