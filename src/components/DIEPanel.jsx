import React, { useState, useEffect } from 'react';
import './DIEPanel.css';
import { detectExecutableInfo } from '../services/die-detector';

/**
 * Professional DIE (Detect It Easy) Results Panel
 * Displays compiler, packer, language, and framework detection results
 */
function DIEPanel({ fileData, peData }) {
  const [dieResults, setDieResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set(['compiler', 'packer', 'language']));

  useEffect(() => {
    if (fileData && peData) {
      analyzeDIE();
    }
  }, [fileData, peData]);

  const analyzeDIE = async () => {
    setIsAnalyzing(true);
    try {
      const results = detectExecutableInfo(fileData, peData);
      setDieResults(results);
    } catch (error) {
      console.error('DIE analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'confidence-high';
    if (confidence >= 0.7) return 'confidence-medium';
    return 'confidence-low';
  };

  const getEntropyClass = (entropy) => {
    if (entropy >= 7.5) return 'entropy-high';
    if (entropy >= 6.5) return 'entropy-medium';
    return 'entropy-low';
  };

  if (!dieResults) {
    return (
      <div className="die-panel">
        <div className="panel-header">
          <h2 className="panel-title">Detection Results</h2>
        </div>
        <div className="panel-body">
          {isAnalyzing ? (
            <div className="loading-state">Analyzing executable...</div>
          ) : (
            <div className="empty-state">No file loaded</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="die-panel">
      <div className="panel-header">
        <h2 className="panel-title">Detection Results</h2>
        <button className="refresh-btn" onClick={analyzeDIE} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      <div className="panel-body">
        {/* Overview Section */}
        <div className="die-section overview-section">
          <div className="section-content">
            <div className="overview-grid">
              <div className="overview-item">
                <span className="item-label">Architecture:</span>
                <span className="item-value">{dieResults.architecture}</span>
              </div>
              <div className="overview-item">
                <span className="item-label">Entropy:</span>
                <span className={`item-value ${getEntropyClass(dieResults.entropy)}`}>
                  {dieResults.entropy.toFixed(3)}
                </span>
              </div>
              {dieResults.timestamp && (
                <div className="overview-item">
                  <span className="item-label">Timestamp:</span>
                  <span className="item-value">{new Date(dieResults.timestamp * 1000).toLocaleString()}</span>
                </div>
              )}
              {dieResults.overlay && dieResults.overlay.present && (
                <div className="overview-item">
                  <span className="item-label">Overlay:</span>
                  <span className="item-value warning">
                    {dieResults.overlay.size} bytes at {dieResults.overlay.sizeHex}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compiler Detection */}
        {dieResults.compiler && dieResults.compiler.length > 0 && (
          <div className="die-section">
            <div
              className="section-header"
              onClick={() => toggleSection('compiler')}
            >
              <span className="section-icon">{expandedSections.has('compiler') ? '▼' : '▶'}</span>
              <span className="section-title">Compiler</span>
              <span className="section-badge">{dieResults.compiler.length}</span>
            </div>
            {expandedSections.has('compiler') && (
              <div className="section-content">
                {dieResults.compiler.map((comp, index) => (
                  <div key={index} className="detection-item">
                    <div className="detection-main">
                      <span className="detection-name">{comp.name}</span>
                      {comp.version && (
                        <span className="detection-version">{comp.version}</span>
                      )}
                    </div>
                    <div className="detection-meta">
                      <span className={`confidence-badge ${getConfidenceColor(comp.confidence)}`}>
                        {(comp.confidence * 100).toFixed(0)}% confidence
                      </span>
                      {comp.source && (
                        <span className="detection-source">via {comp.source}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Packer Detection */}
        {dieResults.packer && dieResults.packer.length > 0 && (
          <div className="die-section packer-section">
            <div
              className="section-header"
              onClick={() => toggleSection('packer')}
            >
              <span className="section-icon">{expandedSections.has('packer') ? '▼' : '▶'}</span>
              <span className="section-title">Packer/Protector</span>
              <span className="section-badge warning">{dieResults.packer.length}</span>
            </div>
            {expandedSections.has('packer') && (
              <div className="section-content">
                {dieResults.packer.map((packer, index) => (
                  <div key={index} className="detection-item warning">
                    <div className="detection-main">
                      <span className="detection-name">{packer.name}</span>
                      {packer.version && (
                        <span className="detection-version">{packer.version}</span>
                      )}
                    </div>
                    <div className="detection-meta">
                      <span className={`confidence-badge ${getConfidenceColor(packer.confidence)}`}>
                        {(packer.confidence * 100).toFixed(0)}% confidence
                      </span>
                      {packer.entropy && (
                        <span className="detection-source">
                          Entropy: {packer.entropy.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Language Detection */}
        {dieResults.language && dieResults.language.length > 0 && (
          <div className="die-section">
            <div
              className="section-header"
              onClick={() => toggleSection('language')}
            >
              <span className="section-icon">{expandedSections.has('language') ? '▼' : '▶'}</span>
              <span className="section-title">Programming Language</span>
              <span className="section-badge">{dieResults.language.length}</span>
            </div>
            {expandedSections.has('language') && (
              <div className="section-content">
                {dieResults.language.map((lang, index) => (
                  <div key={index} className="detection-item">
                    <div className="detection-main">
                      <span className="detection-name">{lang.name}</span>
                    </div>
                    <div className="detection-meta">
                      <span className={`confidence-badge ${getConfidenceColor(lang.confidence)}`}>
                        {(lang.confidence * 100).toFixed(0)}% confidence
                      </span>
                      {lang.evidence && (
                        <span className="detection-source">{lang.evidence}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Framework Detection */}
        {dieResults.framework && dieResults.framework.length > 0 && (
          <div className="die-section">
            <div
              className="section-header"
              onClick={() => toggleSection('framework')}
            >
              <span className="section-icon">{expandedSections.has('framework') ? '▼' : '▶'}</span>
              <span className="section-title">Framework</span>
              <span className="section-badge">{dieResults.framework.length}</span>
            </div>
            {expandedSections.has('framework') && (
              <div className="section-content">
                {dieResults.framework.map((fw, index) => (
                  <div key={index} className="detection-item">
                    <div className="detection-main">
                      <span className="detection-name">{fw.name}</span>
                      {fw.version && (
                        <span className="detection-version">{fw.version}</span>
                      )}
                    </div>
                    <div className="detection-meta">
                      <span className={`confidence-badge ${getConfidenceColor(fw.confidence)}`}>
                        {(fw.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Protection Mechanisms */}
        {dieResults.protection && dieResults.protection.length > 0 && (
          <div className="die-section">
            <div
              className="section-header"
              onClick={() => toggleSection('protection')}
            >
              <span className="section-icon">{expandedSections.has('protection') ? '▼' : '▶'}</span>
              <span className="section-title">Protection Mechanisms</span>
              <span className="section-badge">{dieResults.protection.length}</span>
            </div>
            {expandedSections.has('protection') && (
              <div className="section-content">
                {dieResults.protection.map((prot, index) => (
                  <div key={index} className="protection-item">
                    <div className="protection-main">
                      <span className="protection-name">{prot.name}</span>
                      <span className={`protection-status ${prot.enabled ? 'enabled' : 'disabled'}`}>
                        {prot.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {prot.description && (
                      <div className="protection-description">{prot.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Libraries */}
        {dieResults.libraries && dieResults.libraries.length > 0 && (
          <div className="die-section">
            <div
              className="section-header"
              onClick={() => toggleSection('libraries')}
            >
              <span className="section-icon">{expandedSections.has('libraries') ? '▼' : '▶'}</span>
              <span className="section-title">Detected Libraries</span>
              <span className="section-badge">{dieResults.libraries.length}</span>
            </div>
            {expandedSections.has('libraries') && (
              <div className="section-content">
                <div className="libraries-grid">
                  {dieResults.libraries.slice(0, 20).map((lib, index) => (
                    <div key={index} className="library-item">
                      <div className="library-name">{lib.name}</div>
                      <div className="library-meta">
                        <span className={`library-category category-${lib.category}`}>
                          {lib.category}
                        </span>
                        <span className="library-count">{lib.functionCount} functions</span>
                      </div>
                    </div>
                  ))}
                </div>
                {dieResults.libraries.length > 20 && (
                  <div className="libraries-more">
                    ...and {dieResults.libraries.length - 20} more libraries
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DIEPanel;
