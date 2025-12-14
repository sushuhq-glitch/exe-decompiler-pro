import React, { useState, useEffect } from 'react';
import './SecurityPanel.css';
import { analyzeSecuritySmall, calculateSecurityScore } from '../services/security-analysis';

/**
 * Professional Security Analysis Panel
 * Displays comprehensive security analysis results
 */
function SecurityPanel({ fileData, peData }) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set(['protection', 'entropy']));

  useEffect(() => {
    if (fileData && peData) {
      performAnalysis();
    }
  }, [fileData, peData]);

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const results = analyzeSecuritySmall(fileData, peData);
      results.score = calculateSecurityScore(results);
      setAnalysis(results);
    } catch (error) {
      console.error('Security analysis error:', error);
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

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-good';
    if (score >= 60) return 'score-medium';
    return 'score-bad';
  };

  const getSeverityClass = (severity) => {
    if (severity === 'high') return 'severity-high';
    if (severity === 'medium') return 'severity-medium';
    return 'severity-low';
  };

  if (!analysis) {
    return (
      <div className="security-panel">
        <div className="panel-header">
          <h2 className="panel-title">Security Analysis</h2>
        </div>
        <div className="panel-body">
          {isAnalyzing ? (
            <div className="loading-state">Analyzing security...</div>
          ) : (
            <div className="empty-state">No file loaded</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="security-panel">
      <div className="panel-header">
        <h2 className="panel-title">Security Analysis</h2>
        <div className={`security-score ${getScoreClass(analysis.score)}`}>
          Score: {analysis.score}/100
        </div>
      </div>

      <div className="panel-body">
        {/* Entropy Overview */}
        <div className="security-section">
          <div
            className="section-header"
            onClick={() => toggleSection('entropy')}
          >
            <span className="section-icon">{expandedSections.has('entropy') ? '▼' : '▶'}</span>
            <span className="section-title">Entropy Analysis</span>
            <span className={`section-badge ${analysis.entropy.overall > 7.5 ? 'warning' : ''}`}>
              {analysis.entropy.overall.toFixed(3)}
            </span>
          </div>
          {expandedSections.has('entropy') && (
            <div className="section-content">
              <div className="entropy-overview">
                <p>Overall Entropy: <strong>{analysis.entropy.overall.toFixed(3)}</strong></p>
                <p className="entropy-help">
                  High entropy (&gt; 7.5) may indicate packed or encrypted code
                </p>
              </div>

              {analysis.entropy.sections && analysis.entropy.sections.length > 0 && (
                <div className="entropy-sections">
                  <h4>Section Entropy</h4>
                  <table className="entropy-table">
                    <thead>
                      <tr>
                        <th>Section</th>
                        <th>Entropy</th>
                        <th>Size</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.entropy.sections.map((section, index) => (
                        <tr key={index}>
                          <td><code>{section.name}</code></td>
                          <td><code>{section.entropy.toFixed(3)}</code></td>
                          <td>{section.size} bytes</td>
                          <td>
                            {section.suspicious && (
                              <span className="badge badge-danger">Suspicious</span>
                            )}
                            {section.warning && !section.suspicious && (
                              <span className="badge badge-warning">High</span>
                            )}
                            {!section.warning && !section.suspicious && (
                              <span className="badge badge-success">Normal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Protection Mechanisms */}
        {analysis.protection && analysis.protection.length > 0 && (
          <div className="security-section">
            <div
              className="section-header"
              onClick={() => toggleSection('protection')}
            >
              <span className="section-icon">{expandedSections.has('protection') ? '▼' : '▶'}</span>
              <span className="section-title">Protection Mechanisms</span>
              <span className="section-badge">
                {analysis.protection.filter(p => p.enabled).length}/{analysis.protection.length}
              </span>
            </div>
            {expandedSections.has('protection') && (
              <div className="section-content">
                {analysis.protection.map((prot, index) => (
                  <div key={index} className="protection-item">
                    <div className="protection-header">
                      <span className="protection-name">{prot.name}</span>
                      <span className={`protection-status ${prot.enabled ? 'enabled' : 'disabled'}`}>
                        {prot.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="protection-description">{prot.description}</div>
                    <div className="protection-meta">
                      <span className="protection-importance">
                        Importance: {prot.importance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Anti-Debugging */}
        {analysis.antiDebug && analysis.antiDebug.length > 0 && (
          <div className="security-section warning-section">
            <div
              className="section-header"
              onClick={() => toggleSection('antidebug')}
            >
              <span className="section-icon">{expandedSections.has('antidebug') ? '▼' : '▶'}</span>
              <span className="section-title">Anti-Debugging</span>
              <span className="section-badge warning">{analysis.antiDebug.length}</span>
            </div>
            {expandedSections.has('antidebug') && (
              <div className="section-content">
                {analysis.antiDebug.map((detection, index) => (
                  <div key={index} className="detection-item">
                    <div className="detection-header">
                      <span className="detection-name">{detection.name}</span>
                      <span className={`severity-badge ${getSeverityClass(detection.severity)}`}>
                        {detection.severity}
                      </span>
                    </div>
                    <div className="detection-description">{detection.description}</div>
                    {detection.dll && (
                      <div className="detection-meta">
                        <code>{detection.dll}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Suspicious APIs */}
        {analysis.suspiciousAPIs && analysis.suspiciousAPIs.length > 0 && (
          <div className="security-section warning-section">
            <div
              className="section-header"
              onClick={() => toggleSection('suspiciousapis')}
            >
              <span className="section-icon">{expandedSections.has('suspiciousapis') ? '▼' : '▶'}</span>
              <span className="section-title">Suspicious API Usage</span>
              <span className="section-badge warning">{analysis.suspiciousAPIs.length}</span>
            </div>
            {expandedSections.has('suspiciousapis') && (
              <div className="section-content">
                {analysis.suspiciousAPIs.map((category, index) => (
                  <div key={index} className="api-category">
                    <div className="category-header">
                      <span className="category-name">{category.category}</span>
                      <span className={`severity-badge ${getSeverityClass(category.severity)}`}>
                        {category.severity}
                      </span>
                      <span className="api-count">{category.count} APIs</span>
                    </div>
                    <div className="category-apis">
                      {category.apis.slice(0, 10).map((api, apiIndex) => (
                        <div key={apiIndex} className="api-item">
                          <code>{api.name}</code>
                          <span className="api-dll">{api.dll}</span>
                        </div>
                      ))}
                      {category.apis.length > 10 && (
                        <div className="api-more">
                          ...and {category.apis.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Packed Sections */}
        {analysis.packedSections && analysis.packedSections.length > 0 && (
          <div className="security-section warning-section">
            <div
              className="section-header"
              onClick={() => toggleSection('packed')}
            >
              <span className="section-icon">{expandedSections.has('packed') ? '▼' : '▶'}</span>
              <span className="section-title">Suspicious Sections</span>
              <span className="section-badge warning">
                {analysis.packedSections.filter(s => s.suspicious).length}
              </span>
            </div>
            {expandedSections.has('packed') && (
              <div className="section-content">
                {analysis.packedSections.map((section, index) => (
                  <div key={index} className="packed-section">
                    <div className="packed-header">
                      <code>{section.name}</code>
                      <span className="suspicion-score">
                        Score: {section.suspicionScore}
                      </span>
                    </div>
                    <div className="packed-indicators">
                      {section.indicators.map((indicator, indIndex) => (
                        <div key={indIndex} className="indicator-badge">
                          {indicator}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SecurityPanel;
