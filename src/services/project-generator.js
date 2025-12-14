/**
 * Project Generator Module
 * Generates complete decompiled projects in various programming languages
 * Supports C, C++, Python, and Go output formats
 * 
 * Features:
 * - Generate complete project structure
 * - Create makefiles, build scripts, and project files
 * - Generate header files and declarations
 * - Create documentation and README files
 * - Support for multiple output languages
 * - Preserve function relationships and dependencies
 * - Generate stub implementations for unknown functions
 * - Create data structure definitions
 * - Export string tables and resources
 */

import { disassemble } from './disassembler.js';
import { decompileFunction } from './decompiler-core.js';
import { extractAllStrings } from './string-analyzer.js';
import { detectPatterns } from './patterns.js';

// Supported output languages
export const OUTPUT_LANGUAGES = {
  C: 'c',
  CPP: 'cpp',
  PYTHON: 'python',
  GO: 'go',
  ASSEMBLY: 'asm'
};

// Project template structures
const PROJECT_TEMPLATES = {
  [OUTPUT_LANGUAGES.C]: {
    extension: '.c',
    headerExtension: '.h',
    buildFile: 'Makefile',
    compiler: 'gcc'
  },
  [OUTPUT_LANGUAGES.CPP]: {
    extension: '.cpp',
    headerExtension: '.hpp',
    buildFile: 'CMakeLists.txt',
    compiler: 'g++'
  },
  [OUTPUT_LANGUAGES.PYTHON]: {
    extension: '.py',
    headerExtension: null,
    buildFile: 'requirements.txt',
    compiler: 'python3'
  },
  [OUTPUT_LANGUAGES.GO]: {
    extension: '.go',
    headerExtension: null,
    buildFile: 'go.mod',
    compiler: 'go'
  },
  [OUTPUT_LANGUAGES.ASSEMBLY]: {
    extension: '.asm',
    headerExtension: null,
    buildFile: 'build.sh',
    compiler: 'nasm'
  }
};

/**
 * Generate complete decompiled project
 * @param {Uint8Array} data - Binary executable data
 * @param {Object} peData - Parsed PE structure
 * @param {string} fileName - Original file name
 * @param {string} outputLanguage - Target language
 * @param {Object} options - Generation options
 * @param {Function} progressCallback - Progress reporting callback
 * @returns {Object} Project structure with files
 */
export async function generateProject(data, peData, fileName, outputLanguage = OUTPUT_LANGUAGES.C, options = {}, progressCallback = null) {
  const {
    includeComments = true,
    includeHeaders = true,
    includeStrings = true,
    includeResources = true,
    generateBuildFiles = true,
    generateDocumentation = true,
    optimizationLevel = 1,
    preserveNames = true,
    generateTests = false
  } = options;

  const projectName = fileName.replace(/\.[^.]+$/, '');
  const project = {
    name: projectName,
    language: outputLanguage,
    files: [],
    directories: [],
    metadata: {
      originalFile: fileName,
      generatedDate: new Date().toISOString(),
      architecture: peData.architecture,
      entryPoint: peData.entryPoint,
      imageBase: peData.imageBase
    }
  };

  try {
    // Phase 1: Analyze executable (10%)
    reportProgress(progressCallback, 0, 'Starting analysis...');
    
    reportProgress(progressCallback, 5, 'Detecting patterns and functions...');
    const patterns = detectPatterns(data, peData);
    
    reportProgress(progressCallback, 10, 'Extracting strings...');
    const strings = extractAllStrings(data, peData);

    // Phase 2: Decompile functions (20-70%)
    reportProgress(progressCallback, 15, 'Decompiling functions...');
    const functions = await decompileFunctions(data, peData, patterns, outputLanguage, progressCallback);

    // Phase 3: Generate source files (70-85%)
    reportProgress(progressCallback, 70, 'Generating source files...');
    await generateSourceFiles(project, functions, strings, peData, outputLanguage, options, progressCallback);

    // Phase 4: Generate headers (85-90%)
    if (includeHeaders && (outputLanguage === OUTPUT_LANGUAGES.C || outputLanguage === OUTPUT_LANGUAGES.CPP)) {
      reportProgress(progressCallback, 85, 'Generating header files...');
      await generateHeaderFiles(project, functions, peData, outputLanguage);
    }

    // Phase 5: Generate build files (90-95%)
    if (generateBuildFiles) {
      reportProgress(progressCallback, 90, 'Generating build files...');
      await generateBuildFiles(project, outputLanguage);
    }

    // Phase 6: Generate documentation (95-98%)
    if (generateDocumentation) {
      reportProgress(progressCallback, 95, 'Generating documentation...');
      await generateDocumentation(project, peData, patterns, strings);
    }

    // Phase 7: Generate auxiliary files (98-100%)
    reportProgress(progressCallback, 98, 'Generating auxiliary files...');
    await generateAuxiliaryFiles(project, strings, peData);

    reportProgress(progressCallback, 100, 'Project generation complete!');

  } catch (error) {
    console.error('Error generating project:', error);
    throw error;
  }

  return project;
}

/**
 * Report progress to callback
 */
function reportProgress(callback, percentage, message) {
  if (callback && typeof callback === 'function') {
    callback({ percentage, message });
  }
}

/**
 * Decompile all detected functions
 */
async function decompileFunctions(data, peData, patterns, outputLanguage, progressCallback) {
  const functions = [];
  const detectedFunctions = patterns.functions || [];

  const totalFunctions = detectedFunctions.length;
  const progressStart = 20;
  const progressEnd = 70;
  const progressRange = progressEnd - progressStart;

  for (let i = 0; i < detectedFunctions.length; i++) {
    const func = detectedFunctions[i];
    
    // Report progress
    const progress = progressStart + (i / totalFunctions) * progressRange;
    reportProgress(progressCallback, Math.floor(progress), `Decompiling function ${i + 1}/${totalFunctions}: ${func.name}`);

    try {
      // Get function instructions
      let instructions = func.instructions;
      
      if (!instructions && func.addressNum && func.size) {
        // Disassemble function if not already done
        const funcOffset = func.addressNum - peData.imageBase;
        const funcData = data.slice(funcOffset, funcOffset + func.size);
        instructions = disassemble(funcData, func.addressNum, peData.architecture);
      }

      // Decompile function
      if (instructions && instructions.length > 0) {
        const decompiled = decompileFunction(instructions, peData, func);
        
        functions.push({
          name: func.name,
          address: func.address,
          addressNum: func.addressNum,
          size: func.size,
          signature: decompiled.signature,
          code: decompiled.code,
          locals: decompiled.locals || [],
          params: decompiled.params || [],
          instructions: instructions,
          complexity: func.complexity,
          compiler: func.compiler
        });
      } else {
        // Create stub function if no instructions
        functions.push(createStubFunction(func, outputLanguage));
      }
    } catch (error) {
      console.error(`Error decompiling function ${func.name}:`, error);
      // Create stub function on error
      functions.push(createStubFunction(func, outputLanguage));
    }

    // Allow UI to update
    if (i % 10 === 0) {
      await sleep(1);
    }
  }

  return functions;
}

/**
 * Create stub function for unknown/failed decompilation
 */
function createStubFunction(func, outputLanguage) {
  const stub = {
    name: func.name,
    address: func.address,
    addressNum: func.addressNum,
    size: func.size || 0,
    isStub: true
  };

  switch (outputLanguage) {
    case OUTPUT_LANGUAGES.C:
    case OUTPUT_LANGUAGES.CPP:
      stub.signature = `void ${func.name}()`;
      stub.code = `// Stub function - decompilation failed or unavailable\nvoid ${func.name}() {\n    // TODO: Implement\n    return;\n}\n`;
      break;

    case OUTPUT_LANGUAGES.PYTHON:
      stub.signature = `def ${func.name}()`;
      stub.code = `# Stub function - decompilation failed or unavailable\ndef ${func.name}():\n    # TODO: Implement\n    pass\n`;
      break;

    case OUTPUT_LANGUAGES.GO:
      stub.signature = `func ${func.name}()`;
      stub.code = `// Stub function - decompilation failed or unavailable\nfunc ${func.name}() {\n    // TODO: Implement\n}\n`;
      break;

    case OUTPUT_LANGUAGES.ASSEMBLY:
      stub.signature = `${func.name}:`;
      stub.code = `; Stub function - disassembly failed or unavailable\n${func.name}:\n    ret\n`;
      break;
  }

  return stub;
}

/**
 * Generate source files from decompiled functions
 */
async function generateSourceFiles(project, functions, strings, peData, outputLanguage, options, progressCallback) {
  const template = PROJECT_TEMPLATES[outputLanguage];
  
  // Group functions by file (based on size and complexity)
  const fileGroups = groupFunctionsIntoFiles(functions, outputLanguage);

  for (let i = 0; i < fileGroups.length; i++) {
    const group = fileGroups[i];
    const fileName = group.name + template.extension;
    
    reportProgress(progressCallback, 70 + Math.floor((i / fileGroups.length) * 15), `Generating ${fileName}...`);

    let content = '';

    // Add file header comment
    content += generateFileHeader(project.name, fileName, outputLanguage);

    // Add includes/imports
    content += generateImports(outputLanguage, group.functions);

    // Add string declarations if needed
    if (options.includeStrings && i === 0) {
      content += generateStringDeclarations(strings, outputLanguage);
    }

    // Add function implementations
    for (const func of group.functions) {
      content += '\n';
      content += func.code;
      content += '\n';
    }

    project.files.push({
      name: fileName,
      path: `src/${fileName}`,
      content,
      type: 'source',
      language: outputLanguage
    });
  }
}

/**
 * Group functions into logical files
 */
function groupFunctionsIntoFiles(functions, outputLanguage) {
  const maxFunctionsPerFile = 50;
  const groups = [];

  // Sort functions by address
  const sortedFunctions = [...functions].sort((a, b) => a.addressNum - b.addressNum);

  for (let i = 0; i < sortedFunctions.length; i += maxFunctionsPerFile) {
    const groupFunctions = sortedFunctions.slice(i, i + maxFunctionsPerFile);
    const groupIndex = Math.floor(i / maxFunctionsPerFile) + 1;

    groups.push({
      name: `functions_${groupIndex}`,
      functions: groupFunctions
    });
  }

  // Always have at least one main file
  if (groups.length === 0) {
    groups.push({
      name: 'main',
      functions: []
    });
  }

  return groups;
}

/**
 * Generate file header comment
 */
function generateFileHeader(projectName, fileName, outputLanguage) {
  const commentChar = getCommentChar(outputLanguage);
  
  return `${commentChar} File: ${fileName}
${commentChar} Project: ${projectName}
${commentChar} Generated: ${new Date().toISOString()}
${commentChar} Decompiled with EXE Decompiler Pro
${commentChar}
${commentChar} This file was automatically generated from a compiled executable.
${commentChar} Manual review and testing is recommended before use.

`;
}

/**
 * Get comment character for language
 */
function getCommentChar(outputLanguage) {
  switch (outputLanguage) {
    case OUTPUT_LANGUAGES.PYTHON:
      return '#';
    case OUTPUT_LANGUAGES.ASSEMBLY:
      return ';';
    default:
      return '//';
  }
}

/**
 * Generate imports/includes for file
 */
function generateImports(outputLanguage, functions) {
  let imports = '';

  switch (outputLanguage) {
    case OUTPUT_LANGUAGES.C:
      imports += '#include <stdio.h>\n';
      imports += '#include <stdlib.h>\n';
      imports += '#include <string.h>\n';
      imports += '#include <stdint.h>\n';
      imports += '#include <windows.h>\n\n';
      break;

    case OUTPUT_LANGUAGES.CPP:
      imports += '#include <iostream>\n';
      imports += '#include <string>\n';
      imports += '#include <vector>\n';
      imports += '#include <memory>\n';
      imports += '#include <cstdint>\n';
      imports += '#include <windows.h>\n\n';
      break;

    case OUTPUT_LANGUAGES.PYTHON:
      imports += 'import sys\n';
      imports += 'import os\n';
      imports += 'import struct\n';
      imports += 'import ctypes\n\n';
      break;

    case OUTPUT_LANGUAGES.GO:
      imports += 'package main\n\n';
      imports += 'import (\n';
      imports += '    "fmt"\n';
      imports += '    "os"\n';
      imports += '    "syscall"\n';
      imports += '    "unsafe"\n';
      imports += ')\n\n';
      break;

    case OUTPUT_LANGUAGES.ASSEMBLY:
      imports += 'section .text\n';
      imports += 'global _start\n\n';
      break;
  }

  return imports;
}

/**
 * Generate string declarations
 */
function generateStringDeclarations(strings, outputLanguage) {
  let declarations = '';

  // Limit to first 100 strings to avoid huge files
  const limitedStrings = strings.slice(0, 100);

  switch (outputLanguage) {
    case OUTPUT_LANGUAGES.C:
    case OUTPUT_LANGUAGES.CPP:
      declarations += '// String constants\n';
      for (let i = 0; i < limitedStrings.length; i++) {
        const str = limitedStrings[i];
        const escapedValue = escapeString(str.value);
        declarations += `const char* str_${str.address.slice(2)} = "${escapedValue}";\n`;
      }
      declarations += '\n';
      break;

    case OUTPUT_LANGUAGES.PYTHON:
      declarations += '# String constants\n';
      for (let i = 0; i < limitedStrings.length; i++) {
        const str = limitedStrings[i];
        const escapedValue = escapeString(str.value);
        declarations += `STR_${str.address.slice(2)} = "${escapedValue}"\n`;
      }
      declarations += '\n';
      break;

    case OUTPUT_LANGUAGES.GO:
      declarations += '// String constants\n';
      declarations += 'const (\n';
      for (let i = 0; i < limitedStrings.length; i++) {
        const str = limitedStrings[i];
        const escapedValue = escapeString(str.value);
        declarations += `    str${str.address.slice(2)} = "${escapedValue}"\n`;
      }
      declarations += ')\n\n';
      break;
  }

  return declarations;
}

/**
 * Escape string for source code
 */
function escapeString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .slice(0, 200); // Limit length
}

/**
 * Generate header files
 */
async function generateHeaderFiles(project, functions, peData, outputLanguage) {
  const template = PROJECT_TEMPLATES[outputLanguage];
  const headerName = `${project.name}${template.headerExtension}`;

  let content = '';

  // Add header guard
  const guardName = `${project.name.toUpperCase()}_H`;
  content += `#ifndef ${guardName}\n`;
  content += `#define ${guardName}\n\n`;

  // Add includes
  content += '#include <stdint.h>\n';
  content += '#include <windows.h>\n\n';

  // Add type definitions
  content += '// Type definitions\n';
  content += 'typedef unsigned char uint8_t;\n';
  content += 'typedef unsigned short uint16_t;\n';
  content += 'typedef unsigned int uint32_t;\n';
  content += 'typedef unsigned long long uint64_t;\n\n';

  // Add function declarations
  content += '// Function declarations\n';
  for (const func of functions) {
    content += `${func.signature};\n`;
  }
  content += '\n';

  // Close header guard
  content += `#endif // ${guardName}\n`;

  project.files.push({
    name: headerName,
    path: `include/${headerName}`,
    content,
    type: 'header',
    language: outputLanguage
  });
}

/**
 * Generate build files
 */
async function generateBuildFiles(project, outputLanguage) {
  const template = PROJECT_TEMPLATES[outputLanguage];

  let content = '';
  let fileName = template.buildFile;

  switch (outputLanguage) {
    case OUTPUT_LANGUAGES.C:
      content = generateMakefile(project, template);
      break;

    case OUTPUT_LANGUAGES.CPP:
      content = generateCMakeLists(project);
      break;

    case OUTPUT_LANGUAGES.PYTHON:
      content = generateRequirementsTxt(project);
      break;

    case OUTPUT_LANGUAGES.GO:
      content = generateGoMod(project);
      break;

    case OUTPUT_LANGUAGES.ASSEMBLY:
      content = generateBuildSh(project);
      break;
  }

  project.files.push({
    name: fileName,
    path: fileName,
    content,
    type: 'build',
    language: 'makefile'
  });
}

/**
 * Generate Makefile for C projects
 */
function generateMakefile(project, template) {
  return `# Makefile for ${project.name}
# Generated: ${new Date().toISOString()}

CC = ${template.compiler}
CFLAGS = -Wall -Wextra -O2 -g
LDFLAGS = -luser32 -lkernel32 -lgdi32
TARGET = ${project.name}.exe

SOURCES = $(wildcard src/*.c)
OBJECTS = $(SOURCES:.c=.o)

all: $(TARGET)

$(TARGET): $(OBJECTS)
\t$(CC) $(OBJECTS) -o $(TARGET) $(LDFLAGS)

%.o: %.c
\t$(CC) $(CFLAGS) -c $< -o $@

clean:
\tdel /Q src\\*.o $(TARGET)

run: $(TARGET)
\t.\\$(TARGET)

.PHONY: all clean run
`;
}

/**
 * Generate CMakeLists.txt for C++ projects
 */
function generateCMakeLists(project) {
  return `# CMakeLists.txt for ${project.name}
# Generated: ${new Date().toISOString()}

cmake_minimum_required(VERSION 3.10)
project(${project.name})

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add source files
file(GLOB SOURCES "src/*.cpp")

# Create executable
add_executable(${project.name} \${SOURCES})

# Link libraries
if(WIN32)
    target_link_libraries(${project.name} user32 kernel32 gdi32)
endif()

# Set compiler flags
if(MSVC)
    target_compile_options(${project.name} PRIVATE /W4)
else()
    target_compile_options(${project.name} PRIVATE -Wall -Wextra -O2)
endif()
`;
}

/**
 * Generate requirements.txt for Python projects
 */
function generateRequirementsTxt(project) {
  return `# Python requirements for ${project.name}
# Generated: ${new Date().toISOString()}

# Core dependencies
pywin32>=305
# Add other dependencies as needed
`;
}

/**
 * Generate go.mod for Go projects
 */
function generateGoMod(project) {
  return `module ${project.name}

go 1.20

// Generated: ${new Date().toISOString()}
`;
}

/**
 * Generate build.sh for Assembly projects
 */
function generateBuildSh(project) {
  return `#!/bin/bash
# Build script for ${project.name}
# Generated: ${new Date().toISOString()}

nasm -f win32 src/*.asm -o ${project.name}.o
ld -m i386pe ${project.name}.o -o ${project.name}.exe
`;
}

/**
 * Generate documentation
 */
async function generateDocumentation(project, peData, patterns, strings) {
  // Generate README.md
  let readme = `# ${project.name}

Decompiled project generated from executable using EXE Decompiler Pro.

## Project Information

- **Original File**: ${project.metadata.originalFile}
- **Architecture**: ${project.metadata.architecture}
- **Entry Point**: 0x${project.metadata.entryPoint?.toString(16).toUpperCase()}
- **Image Base**: 0x${project.metadata.imageBase?.toString(16).toUpperCase()}
- **Generated**: ${project.metadata.generatedDate}
- **Output Language**: ${project.language}

## Statistics

- **Functions**: ${patterns.functions?.length || 0}
- **Strings**: ${strings.length}
- **Imports**: ${peData.imports?.length || 0} DLLs
- **Exports**: ${peData.exports?.length || 0} functions
- **Sections**: ${peData.sections?.length || 0}

## Building

`;

  // Add build instructions based on language
  switch (project.language) {
    case OUTPUT_LANGUAGES.C:
      readme += `\`\`\`bash
make
\`\`\`
`;
      break;

    case OUTPUT_LANGUAGES.CPP:
      readme += `\`\`\`bash
mkdir build
cd build
cmake ..
make
\`\`\`
`;
      break;

    case OUTPUT_LANGUAGES.PYTHON:
      readme += `\`\`\`bash
pip install -r requirements.txt
python src/main.py
\`\`\`
`;
      break;

    case OUTPUT_LANGUAGES.GO:
      readme += `\`\`\`bash
go build
\`\`\`
`;
      break;
  }

  readme += `
## Notes

This is a decompiled project and may not perfectly represent the original source code.
Manual review and testing is highly recommended before using in production.

## Functions

The project contains ${patterns.functions?.length || 0} detected functions:

`;

  // List first 20 functions
  const functionsToList = (patterns.functions || []).slice(0, 20);
  for (const func of functionsToList) {
    readme += `- \`${func.name}\` at ${func.address} (${func.size} bytes, ${func.complexity})\n`;
  }

  if (patterns.functions?.length > 20) {
    readme += `\n... and ${patterns.functions.length - 20} more functions.\n`;
  }

  readme += `
## Imports

`;

  // List imported DLLs
  for (const dll of (peData.imports || []).slice(0, 10)) {
    readme += `- **${dll.dll}**: ${dll.functions?.length || 0} functions\n`;
  }

  project.files.push({
    name: 'README.md',
    path: 'README.md',
    content: readme,
    type: 'documentation',
    language: 'markdown'
  });
}

/**
 * Generate auxiliary files
 */
async function generateAuxiliaryFiles(project, strings, peData) {
  // Generate .gitignore
  const gitignore = `# Build outputs
*.o
*.obj
*.exe
*.dll
*.so
*.dylib
*.a
*.lib

# Build directories
build/
dist/
out/

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Python
__pycache__/
*.pyc
*.pyo
*.egg-info/

# Go
*.test
vendor/
`;

  project.files.push({
    name: '.gitignore',
    path: '.gitignore',
    content: gitignore,
    type: 'config',
    language: 'text'
  });

  // Generate strings.txt
  let stringsFile = `# Extracted Strings\n`;
  stringsFile += `# Total: ${strings.length}\n\n`;

  for (const str of strings.slice(0, 500)) {
    stringsFile += `${str.address} [${str.type}] ${str.value}\n`;
  }

  project.files.push({
    name: 'strings.txt',
    path: 'strings.txt',
    content: stringsFile,
    type: 'data',
    language: 'text'
  });

  // Generate project structure info
  let structure = `# Project Structure\n\n`;
  structure += `${project.name}/\n`;
  structure += `├── src/          # Source files\n`;
  structure += `├── include/      # Header files (C/C++)\n`;
  structure += `├── README.md     # Project documentation\n`;
  structure += `├── strings.txt   # Extracted strings\n`;
  
  switch (project.language) {
    case OUTPUT_LANGUAGES.C:
      structure += `└── Makefile      # Build configuration\n`;
      break;
    case OUTPUT_LANGUAGES.CPP:
      structure += `└── CMakeLists.txt # Build configuration\n`;
      break;
    case OUTPUT_LANGUAGES.PYTHON:
      structure += `└── requirements.txt # Python dependencies\n`;
      break;
    case OUTPUT_LANGUAGES.GO:
      structure += `└── go.mod        # Go module configuration\n`;
      break;
  }

  project.files.push({
    name: 'STRUCTURE.txt',
    path: 'STRUCTURE.txt',
    content: structure,
    type: 'documentation',
    language: 'text'
  });
}

/**
 * Save project to disk
 * @param {Object} project - Project structure
 * @param {string} basePath - Base path to save project (e.g., Desktop/DecompiledProject_name)
 */
export async function saveProjectToDisk(project, basePath) {
  // This will be handled by Electron's file system APIs
  // For now, return the project structure for the main process to save
  return {
    basePath,
    files: project.files,
    directories: [
      'src',
      'include',
      'build',
      'docs'
    ]
  };
}

/**
 * Sleep utility for async operations
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Validate project structure
 */
export function validateProject(project) {
  const errors = [];

  if (!project.name) {
    errors.push('Project name is required');
  }

  if (!project.language) {
    errors.push('Project language is required');
  }

  if (!project.files || project.files.length === 0) {
    errors.push('Project must contain at least one file');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get project summary
 */
export function getProjectSummary(project) {
  const sourceFiles = project.files.filter(f => f.type === 'source');
  const headerFiles = project.files.filter(f => f.type === 'header');
  const buildFiles = project.files.filter(f => f.type === 'build');
  const docFiles = project.files.filter(f => f.type === 'documentation');

  let totalSize = 0;
  let totalLines = 0;

  for (const file of project.files) {
    totalSize += file.content.length;
    totalLines += file.content.split('\n').length;
  }

  return {
    name: project.name,
    language: project.language,
    fileCount: project.files.length,
    sourceFiles: sourceFiles.length,
    headerFiles: headerFiles.length,
    buildFiles: buildFiles.length,
    documentationFiles: docFiles.length,
    totalSize: formatFileSize(totalSize),
    totalLines,
    generatedDate: project.metadata.generatedDate
  };
}
