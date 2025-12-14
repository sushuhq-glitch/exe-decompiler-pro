/**
 * Export Service
 * Handles exporting analysis data to various formats
 */

/**
 * Export function to specified language
 */
export function exportFunction(functionData, language, peData) {
  let code = '';
  
  switch (language) {
    case 'c':
      code = exportToC(functionData, peData);
      break;
    case 'cpp':
      code = exportToCpp(functionData, peData);
      break;
    case 'python':
      code = exportToPython(functionData, peData);
      break;
    case 'golang':
      code = exportToGolang(functionData, peData);
      break;
    default:
      code = exportToC(functionData, peData);
  }
  
  return code;
}

/**
 * Export to C
 */
function exportToC(functionData, peData) {
  // Use existing decompiler
  return functionData.code || '// No code available';
}

/**
 * Export to C++
 */
function exportToCpp(functionData, peData) {
  return functionData.code || '// No code available';
}

/**
 * Export to Python
 */
function exportToPython(functionData, peData) {
  return functionData.code || '# No code available';
}

/**
 * Export to Golang
 */
function exportToGolang(functionData, peData) {
  return functionData.code || '// No code available';
}

/**
 * Generate HTML analysis report
 */
export function generateHTMLReport(peData, analysisData, fileName) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analysis Report - ${fileName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1, h2, h3 {
            color: #4fc1ff;
        }
        .section {
            background: #252526;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            padding: 20px;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #3e3e42;
        }
        th {
            background: #2d2d30;
            color: #4fc1ff;
            font-weight: 600;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge-success {
            background: #2d7d46;
            color: #ffffff;
        }
        .badge-warning {
            background: #d7ba7d;
            color: #1e1e1e;
        }
        .badge-danger {
            background: #f48771;
            color: #1e1e1e;
        }
        .badge-info {
            background: #0e639c;
            color: #ffffff;
        }
        code {
            background: #2d2d30;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }
        .timestamp {
            color: #858585;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Executable Analysis Report</h1>
        <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
        
        <div class="section">
            <h2>File Information</h2>
            <table>
                <tr>
                    <th>Property</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>File Name</td>
                    <td><code>${fileName}</code></td>
                </tr>
                <tr>
                    <td>Architecture</td>
                    <td><code>${peData?.architecture || 'Unknown'}</code></td>
                </tr>
                <tr>
                    <td>File Size</td>
                    <td>${analysisData?.fileSize ? `${(analysisData.fileSize / 1024).toFixed(2)} KB` : 'Unknown'}</td>
                </tr>
                <tr>
                    <td>Sections</td>
                    <td>${peData?.sections?.length || 0}</td>
                </tr>
                <tr>
                    <td>Functions Detected</td>
                    <td>${analysisData?.patterns?.functions?.length || 0}</td>
                </tr>
            </table>
        </div>
        
        ${peData?.sections ? generateSectionsHTML(peData.sections) : ''}
        ${peData?.imports ? generateImportsHTML(peData.imports) : ''}
        ${peData?.exports && peData.exports.length > 0 ? generateExportsHTML(peData.exports) : ''}
        
        <div class="section">
            <h2>Summary</h2>
            <p>This report provides a comprehensive analysis of the executable file. 
            For detailed function analysis, use the EXE Decompiler Pro application.</p>
        </div>
    </div>
</body>
</html>
`;
  
  return html;
}

/**
 * Generate sections HTML
 */
function generateSectionsHTML(sections) {
  let html = '<div class="section"><h2>PE Sections</h2><table>';
  html += '<tr><th>Name</th><th>Virtual Address</th><th>Size</th><th>Characteristics</th></tr>';
  
  for (const section of sections) {
    html += `<tr>
      <td><code>${section.name}</code></td>
      <td><code>0x${section.virtualAddress?.toString(16).padStart(8, '0') || '00000000'}</code></td>
      <td>${section.virtualSize || 0} bytes</td>
      <td><span class="badge badge-info">${section.type || 'Unknown'}</span></td>
    </tr>`;
  }
  
  html += '</table></div>';
  return html;
}

/**
 * Generate imports HTML
 */
function generateImportsHTML(imports) {
  let html = '<div class="section"><h2>Imported DLLs</h2><table>';
  html += '<tr><th>DLL Name</th><th>Functions</th></tr>';
  
  for (const dll of imports) {
    html += `<tr>
      <td><code>${dll.dll}</code></td>
      <td>${dll.functions.length}</td>
    </tr>`;
  }
  
  html += '</table></div>';
  return html;
}

/**
 * Generate exports HTML
 */
function generateExportsHTML(exports) {
  let html = '<div class="section"><h2>Exported Functions</h2><table>';
  html += '<tr><th>Name</th><th>Ordinal</th><th>Address</th></tr>';
  
  for (const exp of exports.slice(0, 50)) {
    html += `<tr>
      <td><code>${exp.name || 'N/A'}</code></td>
      <td>${exp.ordinal || 'N/A'}</td>
      <td><code>0x${exp.address?.toString(16).padStart(8, '0') || '00000000'}</code></td>
    </tr>`;
  }
  
  if (exports.length > 50) {
    html += `<tr><td colspan="3">...and ${exports.length - 50} more</td></tr>`;
  }
  
  html += '</table></div>';
  return html;
}

/**
 * Generate IDA Python script
 */
export function generateIDAScript(peData, analysisData) {
  const script = `# IDA Python Script
# Generated by EXE Decompiler Pro
# File: ${analysisData.fileName || 'unknown'}

import idaapi
import idc

def apply_analysis():
    """Apply analysis from EXE Decompiler Pro"""
    
    # Set function names
    functions = ${JSON.stringify((analysisData?.patterns?.functions || []).map(f => ({
      address: f.addressNum,
      name: f.name
    })), null, 4)}
    
    for func in functions:
        addr = func['address']
        name = func['name']
        
        # Create function if not exists
        if not idc.get_func_attr(addr, idc.FUNCATTR_START):
            idc.add_func(addr)
        
        # Set function name
        idc.set_name(addr, name, idc.SN_NOWARN)
        print(f"Created function {name} at 0x{addr:08X}")
    
    print("Analysis complete!")

if __name__ == "__main__":
    apply_analysis()
`;
  
  return script;
}

/**
 * Generate Ghidra Python script
 */
export function generateGhidraScript(peData, analysisData) {
  const script = `# Ghidra Python Script
# Generated by EXE Decompiler Pro
# File: ${analysisData.fileName || 'unknown'}
#@category Analysis

from ghidra.program.model.symbol import SourceType
from ghidra.program.model.listing import Function

def apply_analysis():
    """Apply analysis from EXE Decompiler Pro"""
    
    currentProgram = getCurrentProgram()
    listing = currentProgram.getListing()
    symbolTable = currentProgram.getSymbolTable()
    
    # Function data
    functions = ${JSON.stringify((analysisData?.patterns?.functions || []).map(f => ({
      address: f.addressNum,
      name: f.name
    })), null, 4)}
    
    for func_data in functions:
        addr = toAddr(func_data['address'])
        name = func_data['name']
        
        # Create function if not exists
        func = listing.getFunctionAt(addr)
        if func is None:
            func = createFunction(addr, name)
        else:
            func.setName(name, SourceType.USER_DEFINED)
        
        print("Created function {} at {}".format(name, addr))
    
    print("Analysis complete!")

if __name__ == "__main__":
    apply_analysis()
`;
  
  return script;
}

/**
 * Generate JSON database
 */
export function generateJSONDatabase(peData, analysisData, dieResults, securityAnalysis) {
  const database = {
    metadata: {
      fileName: analysisData?.fileName || 'unknown',
      generatedAt: new Date().toISOString(),
      generatorVersion: '1.0.0'
    },
    peHeader: {
      architecture: peData?.architecture || 'Unknown',
      imageBase: peData?.imageBase || 0,
      entryPoint: peData?.entryPoint || 0,
      subsystem: peData?.subsystem || 'Unknown'
    },
    sections: peData?.sections || [],
    imports: peData?.imports || [],
    exports: peData?.exports || [],
    functions: (analysisData?.patterns?.functions || []).map(f => ({
      name: f.name,
      address: f.addressNum,
      size: f.size,
      complexity: f.complexity,
      instructionCount: f.instructionCount
    })),
    detection: dieResults || {},
    security: securityAnalysis || {}
  };
  
  return JSON.stringify(database, null, 2);
}

/**
 * Download file helper
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
