import React from 'react';
import './FunctionList.css';

function FunctionList({ functions, selectedFunction, onFunctionClick, searchTerm, onSearchChange }) {
  return (
    <div className="function-list">
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search functions..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="function-items">
        {functions.length === 0 ? (
          <div className="empty-state">No functions loaded</div>
        ) : (
          functions.map((func, index) => (
            <div
              key={index}
              className={`function-item ${selectedFunction === func ? 'selected' : ''}`}
              onClick={() => onFunctionClick(func)}
            >
              <span className="function-name">{func.name}</span>
              <span className="function-address">{func.address}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FunctionList;