/**
 * Demo Data for Testing
 * Provides sample data when no real EXE file is available
 */

export function getDemoFileData() {
  // Create a small fake PE file buffer
  const buffer = new Array(1024).fill(0);
  
  // DOS signature "MZ"
  buffer[0] = 0x5A;
  buffer[1] = 0x4D;
  
  // e_lfanew at offset 60 (PE header offset)
  buffer[60] = 0x80;
  buffer[61] = 0x00;
  buffer[62] = 0x00;
  buffer[63] = 0x00;
  
  // PE signature "PE\0\0" at offset 0x80
  buffer[0x80] = 0x50;
  buffer[0x81] = 0x45;
  buffer[0x82] = 0x00;
  buffer[0x83] = 0x00;
  
  // Machine type (x86)
  buffer[0x84] = 0x4C;
  buffer[0x85] = 0x01;
  
  // Number of sections
  buffer[0x86] = 0x03;
  buffer[0x87] = 0x00;
  
  return {
    name: 'demo_app.exe',
    data: buffer,
    path: '/demo/demo_app.exe'
  };
}

export function getDemoDecompileResults() {
  return {
    success: true,
    stats: {
      functionsCount: 127,
      stringsCount: 453,
      importsCount: 89,
      filesGenerated: 15
    },
    files: {
      'main.c': `// Decompiled C Code
#include <stdio.h>
#include <stdint.h>

// Decompiled function: main
int __cdecl main() {
    int local_1;
    int local_2;
    
    local_1 = 0;
    local_2 = some_function();
    
    if (local_1 > 0) {
        do_something();
    }
    
    return 0;
}

// Decompiled function: sub_401050
void __cdecl sub_401050() {
    int var1 = 0;
    return;
}`,
      'functions/main.c': '// Main function code here',
      'functions/sub_401050.c': '// Sub function code here',
      'strings.txt': `# Extracted Strings

[0x1000] Hello World
[0x1020] Copyright 2024
[0x1040] Error: Invalid input
[0x1060] Success!
`,
      'imports.txt': `# Imported Functions

## kernel32.dll
  - GetModuleHandleA
  - GetProcAddress
  - LoadLibraryA
  - ExitProcess

## user32.dll
  - MessageBoxA
  - CreateWindowExA
  - ShowWindow
`,
      'analysis_report.html': '<!DOCTYPE html><html><head><title>Analysis Report</title></head><body><h1>Analysis Report</h1></body></html>',
      'README.md': `# Decompiled Project: demo_app

## Overview
This is a demo project showing the decompilation results.

## Statistics
- Functions: 127
- Strings: 453
- Architecture: x86

## Files Generated
- main.c
- functions/
- strings.txt
- imports.txt
- analysis_report.html
`
    }
  };
}
