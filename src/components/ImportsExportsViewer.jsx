import React, { useState, useMemo } from 'react';
import './ImportsExportsViewer.css';

/**
 * Professional Imports/Exports Viewer
 * Displays imported and exported functions with grouping and cross-references
 */
function ImportsExportsViewer({ peData }) {
  const [activeTab, setActiveTab] = useState('imports'); // 'imports', 'exports'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDlls, setExpandedDlls] = useState(new Set());
  const [selectedFunction, setSelectedFunction] = useState(null);

  /**
   * Filter functions by search term
   */
  const filteredImports = useMemo(() => {
    if (!peData || !peData.imports) return [];

    const searchLower = searchTerm.toLowerCase();

    return peData.imports.map(dll => ({
      ...dll,
      functions: dll.functions.filter(func =>
        !searchTerm ||
        func.name?.toLowerCase().includes(searchLower) ||
        dll.dll.toLowerCase().includes(searchLower)
      )
    })).filter(dll => dll.functions.length > 0);
  }, [peData, searchTerm]);

  const filteredExports = useMemo(() => {
    if (!peData || !peData.exports) return [];

    const searchLower = searchTerm.toLowerCase();

    return peData.exports.filter(exp =>
      !searchTerm ||
      exp.name?.toLowerCase().includes(searchLower) ||
      exp.address?.toString(16).includes(searchLower)
    );
  }, [peData, searchTerm]);

  /**
   * Toggle DLL expansion
   */
  const toggleDll = (dllName) => {
    const newExpanded = new Set(expandedDlls);
    if (newExpanded.has(dllName)) {
      newExpanded.delete(dllName);
    } else {
      newExpanded.add(dllName);
    }
    setExpandedDlls(newExpanded);
  };

  /**
   * Get API documentation URL
   */
  const getDocumentationUrl = (functionName, dllName) => {
    // Microsoft API documentation base URL
    return `https://docs.microsoft.com/en-us/search/?terms=${encodeURIComponent(functionName)}`;
  };

  /**
   * Get function category
   */
  const getFunctionCategory = (functionName, dllName) => {
    const categories = {
      'kernel32.dll': {
        'CreateFile': 'File I/O',
        'ReadFile': 'File I/O',
        'WriteFile': 'File I/O',
        'CreateProcess': 'Process',
        'OpenProcess': 'Process',
        'VirtualAlloc': 'Memory',
        'VirtualProtect': 'Memory'
      },
      'user32.dll': {
        'MessageBox': 'UI',
        'CreateWindow': 'UI',
        'GetMessage': 'UI'
      },
      'ws2_32.dll': {
        'WSAStartup': 'Network',
        'socket': 'Network',
        'connect': 'Network',
        'send': 'Network',
        'recv': 'Network'
      },
      'advapi32.dll': {
        'RegOpenKey': 'Registry',
        'RegSetValue': 'Registry',
        'CryptEncrypt': 'Crypto',
        'CryptDecrypt': 'Crypto'
      }
    };

    const dllLower = dllName.toLowerCase();
    if (categories[dllLower] && categories[dllLower][functionName]) {
      return categories[dllLower][functionName];
    }

    return 'Other';
  };

  /**
   * Get DLL category
   */
  const getDllCategory = (dllName) => {
    const dllLower = dllName.toLowerCase();

    if (dllLower.includes('kernel') || dllLower.includes('ntdll')) {
      return { name: 'System', color: '#0e639c' };
    } else if (dllLower.includes('user') || dllLower.includes('gdi')) {
      return { name: 'UI', color: '#7d5d2d' };
    } else if (dllLower.includes('ws2') || dllLower.includes('wininet')) {
      return { name: 'Network', color: '#2d7d46' };
    } else if (dllLower.includes('crypt') || dllLower.includes('advapi')) {
      return { name: 'Security', color: '#7d2d4a' };
    } else if (dllLower.includes('msvc') || dllLower.includes('vcruntime')) {
      return { name: 'Runtime', color: '#4a2d7d' };
    } else if (dllLower.includes('d3d') || dllLower.includes('opengl')) {
      return { name: 'Graphics', color: '#2d4a7d' };
    }

    return { name: 'Other', color: '#3e3e42' };
  };

  /**
   * Render import function
   */
  const renderImportFunction = (func, dllName) => {
    const category = getFunctionCategory(func.name, dllName);
    const isSelected = selectedFunction && selectedFunction.name === func.name;

    return (
      <div
        key={func.name || func.ordinal}
        className={`function-item ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedFunction({ ...func, dll: dllName })}
      >
        <div className="function-main">
          <span className="function-name">
            {func.isOrdinal ? `Ordinal ${func.ordinal}` : func.name}
          </span>
          {category && <span className="function-category">{category}</span>}
        </div>
        <div className="function-actions">
          {func.name && (
            <button
              className="doc-link"
              onClick={(e) => {
                e.stopPropagation();
                window.open(getDocumentationUrl(func.name, dllName), '_blank');
              }}
              title="View Documentation"
            >
              Docs
            </button>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render export function
   */
  const renderExportFunction = (exp) => {
    const isSelected = selectedFunction && selectedFunction.name === exp.name;

    return (
      <div
        key={exp.name || exp.ordinal}
        className={`function-item ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedFunction(exp)}
      >
        <div className="function-main">
          <span className="function-name">{exp.name || `Ordinal ${exp.ordinal}`}</span>
          <span className="function-address">
            {exp.address ? `0x${exp.address.toString(16).padStart(8, '0')}` : 'N/A'}
          </span>
        </div>
        {exp.ordinal !== undefined && (
          <div className="function-meta">
            <span className="ordinal-badge">#{exp.ordinal}</span>
          </div>
        )}
      </div>
    );
  };

  const totalImports = peData?.imports?.reduce((sum, dll) => sum + dll.functions.length, 0) || 0;
  const totalExports = peData?.exports?.length || 0;

  return (
    <div className="imports-exports-viewer">
      <div className="viewer-header">
        <div className="tab-selector">
          <button
            className={`tab-btn ${activeTab === 'imports' ? 'active' : ''}`}
            onClick={() => setActiveTab('imports')}
          >
            Imports ({totalImports})
          </button>
          <button
            className={`tab-btn ${activeTab === 'exports' ? 'active' : ''}`}
            onClick={() => setActiveTab('exports')}
          >
            Exports ({totalExports})
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search functions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="viewer-body">
        {activeTab === 'imports' && (
          <div className="imports-list">
            {filteredImports.length === 0 ? (
              <div className="empty-state">
                {searchTerm ? 'No matching imports' : 'No imports found'}
              </div>
            ) : (
              filteredImports.map((dll) => {
                const category = getDllCategory(dll.dll);
                const isExpanded = expandedDlls.has(dll.dll);

                return (
                  <div key={dll.dll} className="dll-group">
                    <div
                      className="dll-header"
                      onClick={() => toggleDll(dll.dll)}
                    >
                      <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                      <span className="dll-name">{dll.dll}</span>
                      <span
                        className="dll-category"
                        style={{ background: category.color }}
                      >
                        {category.name}
                      </span>
                      <span className="function-count">{dll.functions.length}</span>
                    </div>

                    {isExpanded && (
                      <div className="dll-functions">
                        {dll.functions.map((func) => renderImportFunction(func, dll.dll))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'exports' && (
          <div className="exports-list">
            {filteredExports.length === 0 ? (
              <div className="empty-state">
                {searchTerm ? 'No matching exports' : 'No exports found'}
              </div>
            ) : (
              filteredExports.map((exp) => renderExportFunction(exp))
            )}
          </div>
        )}
      </div>

      {selectedFunction && (
        <div className="function-details">
          <div className="details-header">Function Details</div>
          <div className="details-content">
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{selectedFunction.name || 'Unknown'}</span>
            </div>
            {selectedFunction.dll && (
              <div className="detail-row">
                <span className="detail-label">DLL:</span>
                <span className="detail-value">{selectedFunction.dll}</span>
              </div>
            )}
            {selectedFunction.address !== undefined && (
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value">
                  {typeof selectedFunction.address === 'number'
                    ? `0x${selectedFunction.address.toString(16).padStart(8, '0')}`
                    : 'N/A'}
                </span>
              </div>
            )}
            {selectedFunction.ordinal !== undefined && (
              <div className="detail-row">
                <span className="detail-label">Ordinal:</span>
                <span className="detail-value">{selectedFunction.ordinal}</span>
              </div>
            )}
            {selectedFunction.isOrdinal !== undefined && (
              <div className="detail-row">
                <span className="detail-label">Import by:</span>
                <span className="detail-value">
                  {selectedFunction.isOrdinal ? 'Ordinal' : 'Name'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportsExportsViewer;
