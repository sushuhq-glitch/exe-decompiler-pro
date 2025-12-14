import React, { useState } from 'react';
import './AnalysisPanel.css';

/**
 * Analysis Panel Component
 * Displays comprehensive analysis results in tabs
 */
function AnalysisPanel({ analysisData }) {
  const [activeTab, setActiveTab] = useState('fileInfo');
  const [searchTerm, setSearchTerm] = useState('');
  
  if (!analysisData) {
    return (
      <div className="analysis-panel">
        <div className="analysis-empty">
          No analysis data available. Load a file to begin.
        </div>
      </div>
    );
  }
  
  const tabs = [
    { id: 'fileInfo', label: '📄 File Info', icon: '📄' },
    { id: 'sections', label: '📦 Sections', icon: '📦' },
    { id: 'imports', label: '📥 Imports', icon: '📥' },
    { id: 'exports', label: '📤 Exports', icon: '📤' },
    { id: 'strings', label: '📝 Strings', icon: '📝' },
    { id: 'functions', label: '⚙️ Functions', icon: '⚙️' }
  ];
  
  return (
    <div className="analysis-panel">
      <div className="analysis-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`analysis-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label.replace(/^.+ /, '')}</span>
          </button>
        ))}
      </div>
      
      <div className="analysis-content">
        {activeTab === 'fileInfo' && <FileInfoTab data={analysisData} />}
        {activeTab === 'sections' && <SectionsTab data={analysisData} />}
        {activeTab === 'imports' && <ImportsTab data={analysisData} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
        {activeTab === 'exports' && <ExportsTab data={analysisData} />}
        {activeTab === 'strings' && <StringsTab data={analysisData} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
        {activeTab === 'functions' && <FunctionsTab data={analysisData} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
      </div>
    </div>
  );
}

/**
 * File Info Tab
 */
function FileInfoTab({ data }) {
  const { peData, fileName, fileSize } = data;
  
  if (!peData || !peData.isValid) {
    return <div className="tab-content-empty">Invalid or corrupted PE file</div>;
  }
  
  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp * 1000).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };
  
  return (
    <div className="tab-content">
      <div className="info-section">
        <h3>Basic Information</h3>
        <table className="info-table">
          <tbody>
            <tr>
              <td className="info-label">File Name:</td>
              <td className="info-value">{fileName || 'Unknown'}</td>
            </tr>
            <tr>
              <td className="info-label">File Size:</td>
              <td className="info-value">{formatBytes(fileSize || 0)}</td>
            </tr>
            <tr>
              <td className="info-label">Architecture:</td>
              <td className="info-value">{peData.architecture}</td>
            </tr>
            <tr>
              <td className="info-label">Subsystem:</td>
              <td className="info-value">{peData.ntHeaders?.optionalHeader?.subsystemName || 'Unknown'}</td>
            </tr>
            <tr>
              <td className="info-label">Compilation Date:</td>
              <td className="info-value">{formatDate(peData.ntHeaders?.fileHeader?.timeDateStamp)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="info-section">
        <h3>PE Headers</h3>
        <table className="info-table">
          <tbody>
            <tr>
              <td className="info-label">Image Base:</td>
              <td className="info-value">0x{peData.imageBase?.toString(16).toUpperCase()}</td>
            </tr>
            <tr>
              <td className="info-label">Entry Point:</td>
              <td className="info-value">0x{peData.entryPoint?.toString(16).toUpperCase()}</td>
            </tr>
            <tr>
              <td className="info-label">Sections:</td>
              <td className="info-value">{peData.sections?.length || 0}</td>
            </tr>
            <tr>
              <td className="info-label">Imports:</td>
              <td className="info-value">{peData.imports?.length || 0} DLLs</td>
            </tr>
            <tr>
              <td className="info-label">Exports:</td>
              <td className="info-value">{peData.exports?.length || 0} functions</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {peData.ntHeaders?.fileHeader?.characteristicsFlags && (
        <div className="info-section">
          <h3>Characteristics</h3>
          <div className="characteristics-list">
            {peData.ntHeaders.fileHeader.characteristicsFlags.map((flag, idx) => (
              <span key={idx} className="characteristic-badge">{flag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Sections Tab
 */
function SectionsTab({ data }) {
  const { peData } = data;
  
  if (!peData || !peData.sections || peData.sections.length === 0) {
    return <div className="tab-content-empty">No sections found</div>;
  }
  
  const getSectionTypeClass = (type) => {
    if (type === 'code') return 'section-code';
    if (type === 'data' || type === 'data-readonly') return 'section-data';
    if (type === 'resource') return 'section-resource';
    return 'section-other';
  };
  
  return (
    <div className="tab-content">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Virtual Address</th>
            <th>Virtual Size</th>
            <th>Raw Size</th>
            <th>Type</th>
            <th>Flags</th>
          </tr>
        </thead>
        <tbody>
          {peData.sections.map((section, idx) => (
            <tr key={idx}>
              <td>
                <span className={`section-badge ${getSectionTypeClass(section.type)}`}>
                  {section.name}
                </span>
              </td>
              <td className="mono">0x{section.virtualAddress?.toString(16).toUpperCase()}</td>
              <td>{section.virtualSize} bytes</td>
              <td>{section.sizeOfRawData} bytes</td>
              <td>{section.type}</td>
              <td className="flags-cell">
                {section.flags?.slice(0, 3).map((flag, i) => (
                  <span key={i} className="flag-badge">{flag}</span>
                ))}
                {section.flags?.length > 3 && <span className="flag-more">+{section.flags.length - 3}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Imports Tab
 */
function ImportsTab({ data, searchTerm, setSearchTerm }) {
  const { peData } = data;
  const [expandedDlls, setExpandedDlls] = useState(new Set());
  
  if (!peData || !peData.imports || peData.imports.length === 0) {
    return <div className="tab-content-empty">No imports found</div>;
  }
  
  const toggleDll = (dllName) => {
    const newExpanded = new Set(expandedDlls);
    if (newExpanded.has(dllName)) {
      newExpanded.delete(dllName);
    } else {
      newExpanded.add(dllName);
    }
    setExpandedDlls(newExpanded);
  };
  
  const filteredImports = peData.imports.map(dll => ({
    ...dll,
    functions: dll.functions.filter(func =>
      !searchTerm || func.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(dll => dll.functions.length > 0);
  
  return (
    <div className="tab-content">
      <div className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search functions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="imports-list">
        {filteredImports.map((dll, idx) => (
          <div key={idx} className="import-dll">
            <div
              className="dll-header"
              onClick={() => toggleDll(dll.dll)}
            >
              <span className="dll-icon">{expandedDlls.has(dll.dll) ? '▼' : '▶'}</span>
              <span className="dll-name">{dll.dll}</span>
              <span className="dll-count">({dll.functions.length} functions)</span>
            </div>
            
            {expandedDlls.has(dll.dll) && (
              <div className="dll-functions">
                {dll.functions.map((func, funcIdx) => (
                  <div key={funcIdx} className="function-item">
                    <span className="function-name">{func.name}</span>
                    {!func.isOrdinal && func.hint !== undefined && (
                      <span className="function-hint">Hint: {func.hint}</span>
                    )}
                    {func.isOrdinal && (
                      <span className="function-ordinal">Ordinal</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Exports Tab
 */
function ExportsTab({ data }) {
  const { peData } = data;
  
  if (!peData || !peData.exports || peData.exports.length === 0) {
    return <div className="tab-content-empty">No exports found</div>;
  }
  
  return (
    <div className="tab-content">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Ordinal</th>
            <th>RVA</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {peData.exports.map((exp, idx) => (
            <tr key={idx}>
              <td className="export-name">{exp.name}</td>
              <td>{exp.ordinal}</td>
              <td className="mono">0x{exp.rva?.toString(16).toUpperCase()}</td>
              <td className="mono">0x{exp.address?.toString(16).toUpperCase()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Strings Tab
 */
function StringsTab({ data, searchTerm, setSearchTerm }) {
  const { patterns } = data;
  const [minLength, setMinLength] = useState(4);
  const [typeFilter, setTypeFilter] = useState('all');
  
  if (!patterns || !patterns.strings || patterns.strings.length === 0) {
    return <div className="tab-content-empty">No strings found</div>;
  }
  
  const filteredStrings = patterns.strings.filter(str => {
    if (str.length < minLength) return false;
    if (typeFilter !== 'all' && str.type !== typeFilter) return false;
    if (searchTerm && !str.value.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });
  
  return (
    <div className="tab-content">
      <div className="strings-toolbar">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search strings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-box">
          <label>Min Length:</label>
          <input
            type="number"
            className="filter-input"
            value={minLength}
            onChange={(e) => setMinLength(parseInt(e.target.value) || 4)}
            min="1"
            max="100"
          />
        </div>
        
        <div className="filter-box">
          <label>Type:</label>
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="ASCII">ASCII</option>
            <option value="Unicode">Unicode</option>
          </select>
        </div>
        
        <div className="strings-count">
          {filteredStrings.length} / {patterns.strings.length} strings
        </div>
      </div>
      
      <div className="strings-list">
        {filteredStrings.slice(0, 1000).map((str, idx) => (
          <div key={idx} className="string-item">
            <span className="string-address mono">0x{str.address?.slice(2)}</span>
            <span className={`string-type type-${str.type?.toLowerCase()}`}>{str.type}</span>
            <span className="string-length">[{str.length}]</span>
            <span className="string-value" title={str.value}>
              {str.value.length > 60 ? str.value.substring(0, 60) + '...' : str.value}
            </span>
          </div>
        ))}
        {filteredStrings.length > 1000 && (
          <div className="strings-more">
            ... and {filteredStrings.length - 1000} more strings (showing first 1000)
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Functions Tab
 */
function FunctionsTab({ data, searchTerm, setSearchTerm }) {
  const { patterns } = data;
  const [sortBy, setSortBy] = useState('address');
  
  if (!patterns || !patterns.functions || patterns.functions.length === 0) {
    return <div className="tab-content-empty">No functions detected</div>;
  }
  
  let sortedFunctions = [...patterns.functions];
  
  // Apply search filter
  if (searchTerm) {
    sortedFunctions = sortedFunctions.filter(func =>
      func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Apply sorting
  sortedFunctions.sort((a, b) => {
    if (sortBy === 'address') {
      return a.addressNum - b.addressNum;
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'size') {
      return b.size - a.size;
    } else if (sortBy === 'complexity') {
      const complexityOrder = { 'complex': 3, 'medium': 2, 'simple': 1 };
      return (complexityOrder[b.complexity] || 0) - (complexityOrder[a.complexity] || 0);
    }
    return 0;
  });
  
  const getComplexityClass = (complexity) => {
    if (complexity === 'complex') return 'complexity-complex';
    if (complexity === 'medium') return 'complexity-medium';
    return 'complexity-simple';
  };
  
  return (
    <div className="tab-content">
      <div className="functions-toolbar">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search functions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="sort-box">
          <label>Sort by:</label>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="address">Address</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="complexity">Complexity</option>
          </select>
        </div>
        
        <div className="functions-count">
          {sortedFunctions.length} / {patterns.functions.length} functions
        </div>
      </div>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Size</th>
            <th>Instructions</th>
            <th>Complexity</th>
            <th>Prologue</th>
          </tr>
        </thead>
        <tbody>
          {sortedFunctions.slice(0, 500).map((func, idx) => (
            <tr key={idx}>
              <td className="function-name">{func.name}</td>
              <td className="mono">{func.address}</td>
              <td>{func.size} bytes</td>
              <td>{func.instructionCount || 0}</td>
              <td>
                <span className={`complexity-badge ${getComplexityClass(func.complexity)}`}>
                  {func.complexity}
                </span>
              </td>
              <td className="prologue-cell" title={func.prologue}>
                {func.compiler || 'Unknown'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {sortedFunctions.length > 500 && (
        <div className="functions-more">
          ... and {sortedFunctions.length - 500} more functions (showing first 500)
        </div>
      )}
    </div>
  );
}

export default AnalysisPanel;
