/**
 * Automatic Full Decompilation Service
 * Handles complete decompilation with multi-language output
 * Saves to Desktop with complete project structure
 */

import { parsePE, extractStrings } from './pe-parser';
import { detectPatterns } from './patterns';
import { disassemble } from './disassembler';
import { decompileFunction } from './decompiler-core';

/**
 * Main auto decompilation function
 * @param {Object} fileData - File data with name and buffer
 * @param {string} language - Target language: 'c', 'python', 'go', 'cpp'
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Object} Decompilation results
 */
export async function autoDecompile(fileData, language, progressCallback) {
  const results = {
    success: false,
    outputPath: null,
    stats: {
      functionsCount: 0,
      stringsCount: 0,
      importsCount: 0,
      filesGenerated: 0
    },
    files: {}
  };

  try {
    // Stage 1: Parse PE file
    progressCallback('Parsing PE Headers', 10);
    const peData = parsePE(fileData.data);
    
    if (!peData.isValid) {
      throw new Error('Invalid PE file');
    }

    // Stage 2: Extract strings
    progressCallback('Loading Strings', 20);
    const strings = extractStrings(fileData.data);
    results.stats.stringsCount = strings.length;

    // Stage 3: Detect patterns and functions
    progressCallback('Extracting Functions', 35);
    const patterns = detectPatterns(fileData.data, peData);
    results.stats.functionsCount = patterns.functions.length;

    // Stage 4: Disassemble functions
    progressCallback('Disassembling Code', 50);
    const disassembledFunctions = [];
    for (const func of patterns.functions) {
      try {
        const instructions = func.instructions || [];
        if (instructions.length > 0) {
          disassembledFunctions.push({
            ...func,
            instructions
          });
        }
      } catch (error) {
        console.error(`Error disassembling ${func.name}:`, error);
      }
    }

    // Stage 5: Decompile to target language
    progressCallback(`Decompiling to ${language.toUpperCase()}`, 65);
    const decompiledFunctions = [];
    for (const func of disassembledFunctions) {
      try {
        const decompiled = decompileFunction(func.instructions, peData, func);
        decompiledFunctions.push({
          ...func,
          ...decompiled,
          decompiledCode: convertToLanguage(decompiled.code, language)
        });
      } catch (error) {
        console.error(`Error decompiling ${func.name}:`, error);
      }
    }

    // Stage 6: Count imports
    results.stats.importsCount = 0;
    if (peData.imports) {
      for (const dll of peData.imports) {
        results.stats.importsCount += dll.functions.length;
      }
    }

    // Stage 7: Generate output files
    progressCallback('Generating Reports', 80);
    results.files = generateOutputFiles(
      fileData.name,
      peData,
      strings,
      decompiledFunctions,
      language
    );

    // Stage 8: Prepare for saving
    progressCallback('Saving to Desktop', 95);
    results.stats.filesGenerated = Object.keys(results.files).length;
    
    results.success = true;
    return results;
    
  } catch (error) {
    console.error('Auto decompilation error:', error);
    results.error = error.message;
    return results;
  }
}

/**
 * Convert C code to target language
 */
function convertToLanguage(cCode, language) {
  if (language === 'c') {
    return cCode;
  }
  
  if (language === 'python') {
    return convertToPython(cCode);
  }
  
  if (language === 'go') {
    return convertToGo(cCode);
  }
  
  if (language === 'cpp') {
    return convertToCpp(cCode);
  }
  
  return cCode;
}

/**
 * Convert C pseudocode to Python-style
 */
function convertToPython(cCode) {
  let pyCode = cCode;
  
  // Replace function signatures
  pyCode = pyCode.replace(/int __cdecl (\w+)\((.*?)\) \{/g, 'def $1($2):');
  pyCode = pyCode.replace(/void __cdecl (\w+)\((.*?)\) \{/g, 'def $1($2):');
  
  // Replace int declarations
  pyCode = pyCode.replace(/\s+int (\w+);/g, '\n    $1 = 0  # int');
  
  // Replace braces
  pyCode = pyCode.replace(/\}/g, '');
  
  // Replace semicolons
  pyCode = pyCode.replace(/;/g, '');
  
  // Add Python comment style
  pyCode = pyCode.replace(/\/\//g, '#');
  
  return `# Python-style decompiled code\n${pyCode}`;
}

/**
 * Convert C pseudocode to Go-style
 */
function convertToGo(cCode) {
  let goCode = cCode;
  
  // Replace function signatures
  goCode = goCode.replace(/int __cdecl (\w+)\((.*?)\) \{/g, 'func $1($2) int {');
  goCode = goCode.replace(/void __cdecl (\w+)\((.*?)\) \{/g, 'func $1($2) {');
  
  // Replace int declarations
  goCode = goCode.replace(/\s+int (\w+);/g, '\n    var $1 int');
  
  return `// Go-style decompiled code\npackage main\n\n${goCode}`;
}

/**
 * Convert C pseudocode to C++ style
 */
function convertToCpp(cCode) {
  let cppCode = cCode;
  
  // Add C++ namespace and headers
  cppCode = `// C++ decompiled code
#include <iostream>
#include <cstdint>

namespace Decompiled {

${cCode}

} // namespace Decompiled
`;
  
  return cppCode;
}

/**
 * Generate all output files
 */
function generateOutputFiles(fileName, peData, strings, functions, language) {
  const files = {};
  const baseName = fileName.replace(/\.(exe|dll)$/i, '');
  const ext = getFileExtension(language);
  
  // Main file with all functions
  files[`main${ext}`] = generateMainFile(functions, language);
  
  // Individual function files in functions/ directory
  for (let i = 0; i < Math.min(functions.length, 50); i++) {
    const func = functions[i];
    files[`functions/${func.name}${ext}`] = func.decompiledCode || func.code || '// Empty function';
  }
  
  // Strings file
  files['strings.txt'] = generateStringsFile(strings);
  
  // Imports file
  files['imports.txt'] = generateImportsFile(peData);
  
  // Analysis report HTML
  files['analysis_report.html'] = generateAnalysisReport(baseName, peData, functions, strings);
  
  // README
  files['README.md'] = generateReadme(baseName, peData, functions.length, strings.length, language);
  
  return files;
}

/**
 * Get file extension for language
 */
function getFileExtension(language) {
  const extensions = {
    'c': '.c',
    'python': '.py',
    'go': '.go',
    'cpp': '.cpp'
  };
  return extensions[language] || '.c';
}

/**
 * Generate main file with all functions
 */
function generateMainFile(functions, language) {
  let code = '';
  
  if (language === 'python') {
    code = '# Decompiled Python Code\n\n';
  } else if (language === 'go') {
    code = 'package main\n\n';
  } else if (language === 'cpp') {
    code = '#include <iostream>\n#include <cstdint>\n\n';
  } else {
    code = '// Decompiled C Code\n#include <stdio.h>\n#include <stdint.h>\n\n';
  }
  
  for (const func of functions.slice(0, 20)) {
    code += (func.decompiledCode || func.code || '// Function not available') + '\n\n';
  }
  
  return code;
}

/**
 * Generate strings file
 */
function generateStringsFile(strings) {
  let content = '# Extracted Strings\n\n';
  
  for (const str of strings.slice(0, 500)) {
    content += `[0x${str.offset.toString(16).toUpperCase()}] ${str.value}\n`;
  }
  
  return content;
}

/**
 * Generate imports file
 */
function generateImportsFile(peData) {
  let content = '# Imported Functions\n\n';
  
  if (peData.imports) {
    for (const dll of peData.imports) {
      content += `\n## ${dll.dll}\n`;
      for (const func of dll.functions.slice(0, 100)) {
        if (!func.isOrdinal) {
          content += `  - ${func.name}\n`;
        } else {
          content += `  - Ordinal ${func.ordinal}\n`;
        }
      }
    }
  }
  
  return content;
}

/**
 * Generate HTML analysis report
 */
function generateAnalysisReport(fileName, peData, functions, strings) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Decompilation Report - ${fileName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      margin: 0;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    h1 { font-size: 48px; margin: 0 0 10px 0; }
    h2 { font-size: 32px; margin: 40px 0 20px 0; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: rgba(255, 255, 255, 0.1);
      padding: 20px;
      border-radius: 15px;
      text-align: center;
    }
    .stat-value { font-size: 48px; font-weight: bold; }
    .stat-label { font-size: 18px; opacity: 0.8; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
    th { background: rgba(255,255,255,0.1); }
    .footer { margin-top: 40px; text-align: center; opacity: 0.7; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚡ Decompilation Report</h1>
    <p><strong>File:</strong> ${fileName}</p>
    <p><strong>Architecture:</strong> ${peData.architecture}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    
    <h2>📊 Statistics</h2>
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${functions.length}</div>
        <div class="stat-label">Functions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${strings.length}</div>
        <div class="stat-label">Strings</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${peData.imports?.length || 0}</div>
        <div class="stat-label">DLLs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${peData.sections?.length || 0}</div>
        <div class="stat-label">Sections</div>
      </div>
    </div>
    
    <h2>⚙️ Functions</h2>
    <table>
      <tr><th>Name</th><th>Address</th></tr>
      ${functions.slice(0, 50).map(f => 
        `<tr><td>${f.name}</td><td>${f.address}</td></tr>`
      ).join('')}
    </table>
    
    <h2>🔍 PE Information</h2>
    <p><strong>Entry Point:</strong> 0x${peData.entryPoint?.toString(16) || '0'}</p>
    <p><strong>Image Base:</strong> 0x${peData.imageBase?.toString(16) || '0'}</p>
    <p><strong>Sections:</strong> ${peData.sections?.map(s => s.name).join(', ') || 'None'}</p>
    
    <div class="footer">
      <p>Generated by EXE Decompiler Pro</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate README file
 */
function generateReadme(fileName, peData, functionsCount, stringsCount, language) {
  return `# Decompiled Project: ${fileName}

## Overview
This project was automatically decompiled from **${fileName}** using EXE Decompiler Pro.

## Statistics
- **Functions:** ${functionsCount}
- **Strings:** ${stringsCount}
- **Architecture:** ${peData.architecture}
- **Output Language:** ${language.toUpperCase()}

## Project Structure
\`\`\`
.
├── main.${getFileExtension(language).slice(1)} - Main decompiled code
├── functions/                                     - Individual function files
├── strings.txt                                     - Extracted strings
├── imports.txt                                     - Imported functions
├── analysis_report.html                            - Detailed HTML report
└── README.md                                       - This file
\`\`\`

## Files Description

### main.${getFileExtension(language).slice(1)}
Contains the main decompiled code with all major functions.

### functions/
Directory containing individual decompiled functions as separate files for easier analysis.

### strings.txt
All ASCII strings extracted from the executable with their offsets.

### imports.txt
List of all imported functions organized by DLL.

### analysis_report.html
Beautiful HTML report with comprehensive analysis. Open in a web browser for best experience.

## Notes
- This is machine-generated pseudocode and may not be completely accurate
- Some functions may be incomplete or simplified
- Manual review and refinement is recommended
- Not all features of the original executable may be represented

## Tools Used
- **EXE Decompiler Pro** - Advanced reverse engineering tool
- **PE Parser** - For executable format analysis
- **Pattern Detection** - For function identification
- **Multi-language Output** - Supporting C, Python, Go, and C++

---
Generated on ${new Date().toLocaleString()}
`;
}
