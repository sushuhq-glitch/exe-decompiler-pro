/**
 * Desktop Saver - Save decompiled files to Desktop
 * Creates organized folder structure with all outputs
 */

import { formatStringsForDisplay, exportStrings } from '../services/string-extractor-pro';

/**
 * Get desktop path (cross-platform)
 */
export async function getDesktopPath() {
  if (window.electronAPI && window.electronAPI.getDesktopPath) {
    return await window.electronAPI.getDesktopPath();
  }
  
  // Fallback for non-Electron environments
  return null;
}

/**
 * Save decompiled project to Desktop
 * @param {string} exeName - Original EXE filename
 * @param {Object} decompiledData - All decompiled code and analysis
 * @param {string} language - Target language (c, python, go, javascript, rust)
 * @returns {Promise<string>} Path to created folder
 */
export async function saveToDesktop(exeName, decompiledData, language) {
  try {
    const desktopPath = await getDesktopPath();
    if (!desktopPath) {
      throw new Error('Could not determine Desktop path');
    }

    // Create folder name
    const baseName = exeName.replace(/\.exe$/i, '');
    const folderName = `Decompiled_${baseName}_${language}`;
    const projectPath = `${desktopPath}/${folderName}`;

    console.log(`Creating project at: ${projectPath}`);

    // Create project structure
    const structure = createProjectStructure(decompiledData, language, baseName);

    // Use Electron API to create files
    if (window.electronAPI && window.electronAPI.createProject) {
      await window.electronAPI.createProject(projectPath, structure);
      return projectPath;
    } else {
      // Fallback: download as ZIP
      await downloadAsZip(folderName, structure);
      return 'Downloaded as ZIP';
    }
  } catch (error) {
    console.error('Error saving to Desktop:', error);
    throw error;
  }
}

/**
 * Create project file structure
 */
function createProjectStructure(data, language, baseName) {
  const ext = getFileExtension(language);
  const structure = {
    files: [],
    folders: ['src']
  };

  // Main decompiled file
  if (data.mainCode) {
    structure.files.push({
      path: `main.${ext}`,
      content: data.mainCode
    });
  }

  // Individual functions in src/
  if (data.functions) {
    for (const func of data.functions) {
      structure.files.push({
        path: `src/${func.name}.${ext}`,
        content: func.code
      });
    }
  }

  // Strings export
  if (data.strings) {
    const formattedStrings = formatStringsForDisplay(data.strings);
    structure.files.push({
      path: 'strings.txt',
      content: exportStrings(formattedStrings, 'txt')
    });
  }

  // Imports list
  if (data.imports) {
    let importsContent = '=== IMPORTED FUNCTIONS ===\n\n';
    for (const dll of data.imports) {
      importsContent += `\n${dll.dll}:\n`;
      for (const func of dll.functions) {
        if (!func.isOrdinal) {
          importsContent += `  - ${func.name}\n`;
        }
      }
    }
    structure.files.push({
      path: 'imports.txt',
      content: importsContent
    });
  }

  // Analysis JSON
  if (data.analysis) {
    structure.files.push({
      path: 'analysis.json',
      content: JSON.stringify(data.analysis, null, 2)
    });
  }

  // Security report HTML
  if (data.securityReport) {
    structure.files.push({
      path: 'security_report.html',
      content: generateSecurityReportHTML(data.securityReport, baseName)
    });
  }

  // README
  structure.files.push({
    path: 'README.md',
    content: generateREADME(baseName, language, data)
  });

  // Build script
  structure.files.push({
    path: language === 'c' ? 'build.bat' : 'build.sh',
    content: generateBuildScript(language)
  });

  return structure;
}

/**
 * Get file extension for language
 */
function getFileExtension(language) {
  const extensions = {
    c: 'c',
    python: 'py',
    go: 'go',
    javascript: 'js',
    rust: 'rs'
  };
  return extensions[language] || 'txt';
}

/**
 * Generate README.md
 */
function generateREADME(exeName, language, data) {
  const stats = {
    functions: data.functions?.length || 0,
    strings: data.strings?.length || 0,
    imports: data.imports?.reduce((acc, dll) => acc + dll.functions.length, 0) || 0,
    size: data.fileSize || 0
  };

  return `# Decompiled: ${exeName}

## Project Information

**Original File:** ${exeName}  
**Target Language:** ${language.toUpperCase()}  
**Decompiled Date:** ${new Date().toISOString()}  
**File Size:** ${(stats.size / 1024).toFixed(2)} KB

## Statistics

- **Functions:** ${stats.functions}
- **Strings:** ${stats.strings}
- **Imports:** ${stats.imports}
- **Architecture:** ${data.architecture || 'x86'}

## Files

- \`main.${getFileExtension(language)}\` - Main decompiled code
- \`src/\` - Individual function files
- \`strings.txt\` - All extracted strings
- \`imports.txt\` - Imported DLL functions
- \`analysis.json\` - Complete analysis data
- \`security_report.html\` - Security analysis report

## Building

See \`build.${language === 'c' ? 'bat' : 'sh'}\` for compilation instructions.

## Notes

This is a decompiled/reconstructed version of the original executable.
The code may not be 100% accurate and may require manual adjustments.

---

Generated by **EXE Decompiler Pro**
`;
}

/**
 * Generate build script
 */
function generateBuildScript(language) {
  const scripts = {
    c: `@echo off
REM Build script for decompiled C code
REM Requires: Microsoft Visual Studio or MinGW

echo Building decompiled project...

REM Using MSVC
cl /nologo main.c /Fe:rebuilt.exe

REM Or using MinGW
REM gcc main.c -o rebuilt.exe

echo Build complete!
pause
`,
    python: `#!/bin/bash
# Build script for decompiled Python code

echo "Creating Python executable..."
# Install dependencies
pip install -r requirements.txt 2>/dev/null || echo "No requirements file"

# Create standalone executable (requires PyInstaller)
# pip install pyinstaller
# pyinstaller --onefile main.py

echo "Python project ready to run: python main.py"
`,
    go: `#!/bin/bash
# Build script for decompiled Go code

echo "Building Go project..."
go build -o rebuilt main.go

echo "Build complete: ./rebuilt"
`,
    javascript: `#!/bin/bash
# Build script for decompiled JavaScript code

echo "Building JavaScript project..."
# Install dependencies
npm install 2>/dev/null || echo "No package.json"

# Run with Node.js
echo "Run with: node main.js"
`,
    rust: `#!/bin/bash
# Build script for decompiled Rust code

echo "Building Rust project..."
cargo build --release

echo "Build complete: target/release/rebuilt"
`
  };

  return scripts[language] || '# No build script available';
}

/**
 * Generate security report HTML
 */
function generateSecurityReportHTML(report, exeName) {
  const score = report.score || 0;
  const scoreColor = score < 30 ? '#00ff88' : score < 70 ? '#ffaa00' : '#ff4444';
  const scoreEmoji = score < 30 ? '🟢' : score < 70 ? '🟡' : '🔴';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Report - ${exeName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #0a0e27;
      color: #f1f1f1;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 { color: #00d9ff; }
    h2 { color: #e94560; margin-top: 30px; }
    .score {
      font-size: 72px;
      text-align: center;
      color: ${scoreColor};
      margin: 30px 0;
    }
    .section {
      background: #16213e;
      border: 1px solid #1a1a2e;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .finding {
      background: #0f3460;
      padding: 15px;
      margin: 10px 0;
      border-left: 3px solid #e94560;
      border-radius: 4px;
    }
    .safe {
      border-left-color: #00ff88;
    }
    .warning {
      border-left-color: #ffaa00;
    }
    .danger {
      border-left-color: #ff4444;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #1a1a2e;
    }
    th {
      background: #0f3460;
      color: #00d9ff;
    }
  </style>
</head>
<body>
  <h1>🛡️ Security Analysis Report</h1>
  <p><strong>File:</strong> ${exeName}</p>
  <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>

  <div class="score">
    ${scoreEmoji} ${score}/100
  </div>

  <div class="section">
    <h2>Summary</h2>
    <p>${report.summary || 'Analysis complete'}</p>
  </div>

  ${report.findings ? generateFindingsHTML(report.findings) : ''}
  
  ${report.details ? generateDetailsHTML(report.details) : ''}

  <div class="section">
    <h2>Recommendations</h2>
    ${report.recommendations ? 
      '<ul>' + report.recommendations.map(r => `<li>${r}</li>`).join('') + '</ul>' :
      '<p>No specific recommendations</p>'
    }
  </div>

  <footer style="margin-top: 50px; text-align: center; color: #707080;">
    <p>Generated by <strong>EXE Decompiler Pro</strong></p>
  </footer>
</body>
</html>`;
}

function generateFindingsHTML(findings) {
  let html = '<div class="section"><h2>Findings</h2>';
  for (const finding of findings) {
    const className = finding.severity === 'high' ? 'danger' : 
                     finding.severity === 'medium' ? 'warning' : 'safe';
    html += `<div class="finding ${className}">
      <strong>${finding.title}</strong>
      <p>${finding.description}</p>
    </div>`;
  }
  html += '</div>';
  return html;
}

function generateDetailsHTML(details) {
  let html = '<div class="section"><h2>Technical Details</h2>';
  html += '<table><thead><tr><th>Category</th><th>Value</th></tr></thead><tbody>';
  for (const [key, value] of Object.entries(details)) {
    html += `<tr><td>${key}</td><td>${value}</td></tr>`;
  }
  html += '</tbody></table></div>';
  return html;
}

/**
 * Download as ZIP (fallback for non-Electron)
 */
async function downloadAsZip(folderName, structure) {
  // This would require a ZIP library in browser
  console.warn('ZIP download not implemented - requires Electron environment');
  throw new Error('This feature requires Electron. Please use the desktop application.');
}

/**
 * Open Desktop folder in file explorer
 */
export async function openDesktopFolder() {
  if (window.electronAPI && window.electronAPI.openDesktopFolder) {
    await window.electronAPI.openDesktopFolder();
  }
}
