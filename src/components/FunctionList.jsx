import React, { useState } from 'react';
import './FunctionList.css';

/**
 * Enhanced Function List Component
 * Tree structure with imported/internal/exported functions
 */
function FunctionList({ functions, selectedFunction, onFunctionClick, searchTerm, onSearchChange, imports = [], exports = [] }) {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['internal']));
  const [sortBy, setSortBy] = useState('address'); // 'address', 'name', 'size', 'complexity'
  
  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };
  
  // Categorize functions
  const internalFunctions = functions || [];
  const importedFunctions = imports || [];
  const exportedFunctions = exports || [];
  
  // Sort functions
  const sortFunctions = (funcList) => {
    return [...funcList].sort((a, b) => {
      if (sortBy === 'address') {
        const addrA = typeof a.addressNum === 'number' ? a.addressNum : parseInt(a.address, 16);
        const addrB = typeof b.addressNum === 'number' ? b.addressNum : parseInt(b.address, 16);
        return addrA - addrB;
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        return (b.size || 0) - (a.size || 0);
      } else if (sortBy === 'complexity') {
        const complexityOrder = { 'complex': 3, 'medium': 2, 'simple': 1 };
        return (complexityOrder[b.complexity] || 0) - (complexityOrder[a.complexity] || 0);
      }
      return 0;
    });
  };
  
  // Filter functions by search term
  const filterFunctions = (funcList) => {
    if (!searchTerm) return funcList;
    return funcList.filter(func =>
      func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (func.address && func.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };
  
  const filteredInternal = sortFunctions(filterFunctions(internalFunctions));
  const filteredImported = sortFunctions(filterFunctions(importedFunctions));
  const filteredExported = sortFunctions(filterFunctions(exportedFunctions));
  
  const getComplexityClass = (complexity) => {
    if (complexity === 'complex') return 'complexity-complex';
    if (complexity === 'medium') return 'complexity-medium';
    return 'complexity-simple';
  };
  
  const renderFunction = (func, type) => {
    const isSelected = selectedFunction && selectedFunction.name === func.name;
    const typeClass = type === 'imported' ? 'func-imported' : (type === 'exported' ? 'func-exported' : 'func-internal');
    
    return (
      <div
        key={func.name + func.address}
        className={`function-item ${typeClass} ${isSelected ? 'selected' : ''}`}
        onClick={() => onFunctionClick(func)}
        title={`${func.name}\nAddress: ${func.address}\nSize: ${func.size || 'N/A'} bytes`}
      >
        <div className="function-item-main">
          <span className="function-icon">{type === 'imported' ? 'I' : (type === 'exported' ? 'E' : 'F')}</span>
          <span className="function-name">{func.name}</span>
        </div>
        <div className="function-item-meta">
          <span className="function-address">{func.address}</span>
          {func.size && <span className="function-size">{func.size}b</span>}
          {func.complexity && (
            <span className={`function-complexity ${getComplexityClass(func.complexity)}`}>
              {func.complexity[0].toUpperCase()}
            </span>
          )}
          {func.instructionCount && (
            <span className="function-inst-count" title="Instruction count">
              {func.instructionCount}i
            </span>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="function-list-enhanced">
      <div className="function-list-header">
        <h2 className="header-title">Functions</h2>
        <div className="function-count">
          {filteredInternal.length + filteredImported.length + filteredExported.length}
        </div>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search functions..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="sort-container">
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
      
      <div className="function-categories">
        {filteredInternal.length > 0 && (
          <div className="function-category">
            <div
              className="category-header"
              onClick={() => toggleCategory('internal')}
            >
              <span className="category-icon">{expandedCategories.has('internal') ? '▼' : '▶'}</span>
              <span className="category-name">Internal Functions</span>
              <span className="category-count">{filteredInternal.length}</span>
            </div>
            {expandedCategories.has('internal') && (
              <div className="category-functions">
                {filteredInternal.map(func => renderFunction(func, 'internal'))}
              </div>
            )}
          </div>
        )}
        
        {filteredImported.length > 0 && (
          <div className="function-category">
            <div
              className="category-header"
              onClick={() => toggleCategory('imported')}
            >
              <span className="category-icon">{expandedCategories.has('imported') ? '▼' : '▶'}</span>
              <span className="category-name">Imported Functions</span>
              <span className="category-count">{filteredImported.length}</span>
            </div>
            {expandedCategories.has('imported') && (
              <div className="category-functions">
                {filteredImported.map(func => renderFunction(func, 'imported'))}
              </div>
            )}
          </div>
        )}
        
        {filteredExported.length > 0 && (
          <div className="function-category">
            <div
              className="category-header"
              onClick={() => toggleCategory('exported')}
            >
              <span className="category-icon">{expandedCategories.has('exported') ? '▼' : '▶'}</span>
              <span className="category-name">Exported Functions</span>
              <span className="category-count">{filteredExported.length}</span>
            </div>
            {expandedCategories.has('exported') && (
              <div className="category-functions">
                {filteredExported.map(func => renderFunction(func, 'exported'))}
              </div>
            )}
          </div>
        )}
        
        {filteredInternal.length === 0 && filteredImported.length === 0 && filteredExported.length === 0 && (
          <div className="empty-state">
            {searchTerm ? 'No matching functions found' : 'No functions loaded'}
          </div>
        )}
      </div>
    </div>
  );
}

export default FunctionList;