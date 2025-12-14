/**
 * PE (Portable Executable) Parser
 * Parses Windows PE/COFF executable format completely
 * Supports both 32-bit (PE32) and 64-bit (PE32+) executables
 */

// DOS Header constants
const DOS_SIGNATURE = 0x5A4D; // "MZ"
const DOS_HEADER_SIZE = 64;
const PE_SIGNATURE_OFFSET = 60; // e_lfanew location

// PE Signature
const PE_SIGNATURE = 0x4550; // "PE\0\0"

// Machine types
const IMAGE_FILE_MACHINE_I386 = 0x014C;
const IMAGE_FILE_MACHINE_AMD64 = 0x8664;

// Optional Header Magic
const IMAGE_NT_OPTIONAL_HDR32_MAGIC = 0x010B;
const IMAGE_NT_OPTIONAL_HDR64_MAGIC = 0x020B;

// Section characteristics
const IMAGE_SCN_CNT_CODE = 0x00000020;
const IMAGE_SCN_CNT_INITIALIZED_DATA = 0x00000040;
const IMAGE_SCN_CNT_UNINITIALIZED_DATA = 0x00000080;
const IMAGE_SCN_MEM_EXECUTE = 0x20000000;
const IMAGE_SCN_MEM_READ = 0x40000000;
const IMAGE_SCN_MEM_WRITE = 0x80000000;

/**
 * Main PE parsing function
 * @param {Uint8Array|Array} buffer - Raw executable file data
 * @returns {Object} Parsed PE structure
 */
export function parsePE(buffer) {
  try {
    // Ensure buffer is a Uint8Array for consistent access
    const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    
    // Validate minimum file size
    if (data.length < DOS_HEADER_SIZE) {
      throw new Error('File too small to be a valid PE file');
    }
    
    // Parse DOS header
    const dosHeader = parseDOSHeader(data);
    
    // Validate PE signature offset
    if (dosHeader.e_lfanew >= data.length - 4) {
      throw new Error('Invalid PE signature offset');
    }
    
    // Parse NT headers (includes File Header and Optional Header)
    const ntHeaders = parseNTHeaders(data, dosHeader.e_lfanew);
    
    // Calculate section headers offset
    const sectionOffset = dosHeader.e_lfanew + 4 + 20 + ntHeaders.fileHeader.sizeOfOptionalHeader;
    
    // Parse section headers
    const sections = parseSectionHeaders(data, sectionOffset, ntHeaders.fileHeader.numberOfSections);
    
    // Parse Import Directory
    const imports = parseImports(data, ntHeaders.optionalHeader, sections);
    
    // Parse Export Directory
    const exports = parseExports(data, ntHeaders.optionalHeader, sections);
    
    // Parse relocations if present
    const relocations = parseRelocations(data, ntHeaders.optionalHeader, sections);
    
    // Parse resources if present
    const resources = parseResources(data, ntHeaders.optionalHeader, sections);
    
    return {
      dosHeader,
      ntHeaders,
      sections,
      imports,
      exports,
      relocations,
      resources,
      architecture: ntHeaders.fileHeader.machine === IMAGE_FILE_MACHINE_AMD64 ? 'x64' : 'x86',
      entryPoint: ntHeaders.optionalHeader.addressOfEntryPoint,
      imageBase: ntHeaders.optionalHeader.imageBase,
      isValid: true
    };
  } catch (error) {
    console.error('PE parsing error:', error);
    return {
      isValid: false,
      error: error.message,
      dosHeader: null,
      ntHeaders: null,
      sections: [],
      imports: [],
      exports: [],
      relocations: [],
      resources: [],
      architecture: 'unknown',
      entryPoint: 0,
      imageBase: 0
    };
  }
}

/**
 * Parse DOS header (first 64 bytes of PE file)
 */
function parseDOSHeader(data) {
  const signature = readUInt16LE(data, 0);
  
  if (signature !== DOS_SIGNATURE) {
    throw new Error(`Invalid DOS signature: 0x${signature.toString(16)}`);
  }
  
  return {
    e_magic: signature, // "MZ"
    e_cblp: readUInt16LE(data, 2), // Bytes on last page
    e_cp: readUInt16LE(data, 4), // Pages in file
    e_crlc: readUInt16LE(data, 6), // Relocations
    e_cparhdr: readUInt16LE(data, 8), // Size of header in paragraphs
    e_minalloc: readUInt16LE(data, 10), // Minimum extra paragraphs
    e_maxalloc: readUInt16LE(data, 12), // Maximum extra paragraphs
    e_ss: readUInt16LE(data, 14), // Initial SS value
    e_sp: readUInt16LE(data, 16), // Initial SP value
    e_csum: readUInt16LE(data, 18), // Checksum
    e_ip: readUInt16LE(data, 20), // Initial IP value
    e_cs: readUInt16LE(data, 22), // Initial CS value
    e_lfarlc: readUInt16LE(data, 24), // File address of relocation table
    e_ovno: readUInt16LE(data, 26), // Overlay number
    e_lfanew: readUInt32LE(data, PE_SIGNATURE_OFFSET) // PE header offset
  };
}

/**
 * Parse NT Headers (PE signature, File Header, Optional Header)
 */
function parseNTHeaders(data, offset) {
  const signature = readUInt32LE(data, offset);
  
  if (signature !== PE_SIGNATURE) {
    throw new Error(`Invalid PE signature: 0x${signature.toString(16)}`);
  }
  
  // Parse COFF File Header (20 bytes after signature)
  const fileHeaderOffset = offset + 4;
  const fileHeader = parseFileHeader(data, fileHeaderOffset);
  
  // Parse Optional Header (right after File Header)
  const optionalHeaderOffset = fileHeaderOffset + 20;
  const optionalHeader = parseOptionalHeader(data, optionalHeaderOffset, fileHeader.machine);
  
  return {
    signature,
    fileHeader,
    optionalHeader
  };
}

/**
 * Parse COFF File Header
 */
function parseFileHeader(data, offset) {
  const machine = readUInt16LE(data, offset);
  const numberOfSections = readUInt16LE(data, offset + 2);
  const timeDateStamp = readUInt32LE(data, offset + 4);
  const pointerToSymbolTable = readUInt32LE(data, offset + 8);
  const numberOfSymbols = readUInt32LE(data, offset + 12);
  const sizeOfOptionalHeader = readUInt16LE(data, offset + 16);
  const characteristics = readUInt16LE(data, offset + 18);
  
  return {
    machine,
    machineName: getMachineName(machine),
    numberOfSections,
    timeDateStamp,
    compilationDate: new Date(timeDateStamp * 1000).toISOString(),
    pointerToSymbolTable,
    numberOfSymbols,
    sizeOfOptionalHeader,
    characteristics,
    characteristicsFlags: parseCharacteristics(characteristics)
  };
}

/**
 * Parse Optional Header (PE32 or PE32+)
 */
function parseOptionalHeader(data, offset, machine) {
  const magic = readUInt16LE(data, offset);
  const is64Bit = magic === IMAGE_NT_OPTIONAL_HDR64_MAGIC;
  
  let currentOffset = offset;
  
  const header = {
    magic,
    isPE32Plus: is64Bit,
    majorLinkerVersion: readUInt8(data, currentOffset + 2),
    minorLinkerVersion: readUInt8(data, currentOffset + 3),
    sizeOfCode: readUInt32LE(data, currentOffset + 4),
    sizeOfInitializedData: readUInt32LE(data, currentOffset + 8),
    sizeOfUninitializedData: readUInt32LE(data, currentOffset + 12),
    addressOfEntryPoint: readUInt32LE(data, currentOffset + 16),
    baseOfCode: readUInt32LE(data, currentOffset + 20)
  };
  
  // Base of data only in PE32
  if (!is64Bit) {
    header.baseOfData = readUInt32LE(data, currentOffset + 24);
    currentOffset += 28;
  } else {
    currentOffset += 24;
  }
  
  // Image base (32-bit or 64-bit)
  if (is64Bit) {
    header.imageBase = readUInt64LE(data, currentOffset);
    currentOffset += 8;
  } else {
    header.imageBase = readUInt32LE(data, currentOffset);
    currentOffset += 4;
  }
  
  // Standard fields
  header.sectionAlignment = readUInt32LE(data, currentOffset);
  header.fileAlignment = readUInt32LE(data, currentOffset + 4);
  header.majorOperatingSystemVersion = readUInt16LE(data, currentOffset + 8);
  header.minorOperatingSystemVersion = readUInt16LE(data, currentOffset + 10);
  header.majorImageVersion = readUInt16LE(data, currentOffset + 12);
  header.minorImageVersion = readUInt16LE(data, currentOffset + 14);
  header.majorSubsystemVersion = readUInt16LE(data, currentOffset + 16);
  header.minorSubsystemVersion = readUInt16LE(data, currentOffset + 18);
  header.win32VersionValue = readUInt32LE(data, currentOffset + 20);
  header.sizeOfImage = readUInt32LE(data, currentOffset + 24);
  header.sizeOfHeaders = readUInt32LE(data, currentOffset + 28);
  header.checkSum = readUInt32LE(data, currentOffset + 32);
  header.subsystem = readUInt16LE(data, currentOffset + 36);
  header.subsystemName = getSubsystemName(header.subsystem);
  header.dllCharacteristics = readUInt16LE(data, currentOffset + 38);
  
  currentOffset += 40;
  
  // Size fields (32-bit or 64-bit)
  if (is64Bit) {
    header.sizeOfStackReserve = readUInt64LE(data, currentOffset);
    header.sizeOfStackCommit = readUInt64LE(data, currentOffset + 8);
    header.sizeOfHeapReserve = readUInt64LE(data, currentOffset + 16);
    header.sizeOfHeapCommit = readUInt64LE(data, currentOffset + 24);
    currentOffset += 32;
  } else {
    header.sizeOfStackReserve = readUInt32LE(data, currentOffset);
    header.sizeOfStackCommit = readUInt32LE(data, currentOffset + 4);
    header.sizeOfHeapReserve = readUInt32LE(data, currentOffset + 8);
    header.sizeOfHeapCommit = readUInt32LE(data, currentOffset + 12);
    currentOffset += 16;
  }
  
  header.loaderFlags = readUInt32LE(data, currentOffset);
  header.numberOfRvaAndSizes = readUInt32LE(data, currentOffset + 4);
  currentOffset += 8;
  
  // Parse Data Directories
  header.dataDirectories = [];
  const dataDirectoryNames = [
    'Export', 'Import', 'Resource', 'Exception', 'Security',
    'BaseReloc', 'Debug', 'Architecture', 'GlobalPtr', 'TLS',
    'LoadConfig', 'BoundImport', 'IAT', 'DelayImport', 'CLRRuntime', 'Reserved'
  ];
  
  for (let i = 0; i < Math.min(header.numberOfRvaAndSizes, 16); i++) {
    header.dataDirectories.push({
      name: dataDirectoryNames[i],
      virtualAddress: readUInt32LE(data, currentOffset + i * 8),
      size: readUInt32LE(data, currentOffset + i * 8 + 4)
    });
  }
  
  return header;
}

/**
 * Parse section headers
 */
function parseSectionHeaders(data, offset, count) {
  const sections = [];
  const SECTION_HEADER_SIZE = 40;
  
  for (let i = 0; i < count; i++) {
    const sectionOffset = offset + (i * SECTION_HEADER_SIZE);
    
    if (sectionOffset + SECTION_HEADER_SIZE > data.length) {
      break;
    }
    
    // Read section name (8 bytes, null-terminated ASCII)
    let name = '';
    for (let j = 0; j < 8; j++) {
      const char = data[sectionOffset + j];
      if (char === 0) break;
      name += String.fromCharCode(char);
    }
    
    const section = {
      name,
      virtualSize: readUInt32LE(data, sectionOffset + 8),
      virtualAddress: readUInt32LE(data, sectionOffset + 12),
      sizeOfRawData: readUInt32LE(data, sectionOffset + 16),
      pointerToRawData: readUInt32LE(data, sectionOffset + 20),
      pointerToRelocations: readUInt32LE(data, sectionOffset + 24),
      pointerToLinenumbers: readUInt32LE(data, sectionOffset + 28),
      numberOfRelocations: readUInt16LE(data, sectionOffset + 32),
      numberOfLinenumbers: readUInt16LE(data, sectionOffset + 34),
      characteristics: readUInt32LE(data, sectionOffset + 36)
    };
    
    // Parse characteristics flags
    section.flags = parseSectionCharacteristics(section.characteristics);
    section.type = getSectionType(section.name, section.characteristics);
    
    sections.push(section);
  }
  
  return sections;
}

/**
 * Parse Import Directory Table
 */
function parseImports(data, optionalHeader, sections) {
  const imports = [];
  
  try {
    const importDir = optionalHeader.dataDirectories[1]; // Import directory
    if (!importDir || importDir.virtualAddress === 0) {
      return imports;
    }
    
    const importOffset = rvaToFileOffset(importDir.virtualAddress, sections);
    if (importOffset === -1) {
      return imports;
    }
    
    let currentOffset = importOffset;
    const IMPORT_DESCRIPTOR_SIZE = 20;
    
    // Read import descriptors until null entry
    while (currentOffset + IMPORT_DESCRIPTOR_SIZE <= data.length) {
      const originalFirstThunk = readUInt32LE(data, currentOffset);
      const timeDateStamp = readUInt32LE(data, currentOffset + 4);
      const forwarderChain = readUInt32LE(data, currentOffset + 8);
      const nameRVA = readUInt32LE(data, currentOffset + 12);
      const firstThunk = readUInt32LE(data, currentOffset + 16);
      
      // Null entry marks end of imports
      if (nameRVA === 0 && firstThunk === 0) {
        break;
      }
      
      // Read DLL name
      const nameOffset = rvaToFileOffset(nameRVA, sections);
      const dllName = nameOffset !== -1 ? readString(data, nameOffset) : 'Unknown';
      
      // Parse imported functions
      const functions = parseImportFunctions(data, originalFirstThunk || firstThunk, sections, optionalHeader.isPE32Plus);
      
      imports.push({
        dll: dllName,
        functions,
        timeDateStamp,
        forwarderChain
      });
      
      currentOffset += IMPORT_DESCRIPTOR_SIZE;
    }
  } catch (error) {
    console.error('Error parsing imports:', error);
  }
  
  return imports;
}

/**
 * Parse imported functions for a DLL
 */
function parseImportFunctions(data, thunkRVA, sections, is64Bit) {
  const functions = [];
  
  if (thunkRVA === 0) {
    return functions;
  }
  
  const thunkOffset = rvaToFileOffset(thunkRVA, sections);
  if (thunkOffset === -1) {
    return functions;
  }
  
  const thunkSize = is64Bit ? 8 : 4;
  let currentOffset = thunkOffset;
  
  while (currentOffset + thunkSize <= data.length) {
    const thunkValue = is64Bit ? readUInt64LE(data, currentOffset) : readUInt32LE(data, currentOffset);
    
    if (thunkValue === 0) {
      break;
    }
    
    const ordinalFlag = is64Bit ? 0x8000000000000000n : 0x80000000;
    
    if ((is64Bit && thunkValue >= ordinalFlag) || (!is64Bit && thunkValue >= ordinalFlag)) {
      // Import by ordinal
      const ordinal = is64Bit ? Number(thunkValue & 0xFFFFn) : (thunkValue & 0xFFFF);
      functions.push({
        name: `Ordinal_${ordinal}`,
        ordinal,
        isOrdinal: true
      });
    } else {
      // Import by name
      const nameRVA = Number(thunkValue & (is64Bit ? 0x7FFFFFFFFFFFFFFFn : 0x7FFFFFFF));
      const nameOffset = rvaToFileOffset(nameRVA, sections);
      
      if (nameOffset !== -1 && nameOffset + 2 < data.length) {
        const hint = readUInt16LE(data, nameOffset);
        const functionName = readString(data, nameOffset + 2);
        
        functions.push({
          name: functionName,
          hint,
          isOrdinal: false
        });
      }
    }
    
    currentOffset += thunkSize;
    
    // Safety limit
    if (functions.length > 10000) {
      break;
    }
  }
  
  return functions;
}

/**
 * Parse Export Directory Table
 */
function parseExports(data, optionalHeader, sections) {
  const exports = [];
  
  try {
    const exportDir = optionalHeader.dataDirectories[0]; // Export directory
    if (!exportDir || exportDir.virtualAddress === 0) {
      return exports;
    }
    
    const exportOffset = rvaToFileOffset(exportDir.virtualAddress, sections);
    if (exportOffset === -1) {
      return exports;
    }
    
    // Parse export directory structure
    const characteristics = readUInt32LE(data, exportOffset);
    const timeDateStamp = readUInt32LE(data, exportOffset + 4);
    const majorVersion = readUInt16LE(data, exportOffset + 8);
    const minorVersion = readUInt16LE(data, exportOffset + 10);
    const nameRVA = readUInt32LE(data, exportOffset + 12);
    const base = readUInt32LE(data, exportOffset + 16);
    const numberOfFunctions = readUInt32LE(data, exportOffset + 20);
    const numberOfNames = readUInt32LE(data, exportOffset + 24);
    const addressOfFunctions = readUInt32LE(data, exportOffset + 28);
    const addressOfNames = readUInt32LE(data, exportOffset + 32);
    const addressOfNameOrdinals = readUInt32LE(data, exportOffset + 36);
    
    // Read DLL name
    const nameOffset = rvaToFileOffset(nameRVA, sections);
    const dllName = nameOffset !== -1 ? readString(data, nameOffset) : 'Unknown';
    
    // Parse exported functions
    const functionsOffset = rvaToFileOffset(addressOfFunctions, sections);
    const namesOffset = rvaToFileOffset(addressOfNames, sections);
    const ordinalsOffset = rvaToFileOffset(addressOfNameOrdinals, sections);
    
    if (functionsOffset !== -1 && namesOffset !== -1 && ordinalsOffset !== -1) {
      for (let i = 0; i < numberOfNames && i < 10000; i++) {
        const nameRVA = readUInt32LE(data, namesOffset + i * 4);
        const nameOff = rvaToFileOffset(nameRVA, sections);
        const name = nameOff !== -1 ? readString(data, nameOff) : `Unknown_${i}`;
        
        const ordinal = readUInt16LE(data, ordinalsOffset + i * 2);
        const functionRVA = readUInt32LE(data, functionsOffset + ordinal * 4);
        
        exports.push({
          name,
          ordinal: base + ordinal,
          rva: functionRVA,
          address: optionalHeader.imageBase + functionRVA
        });
      }
    }
  } catch (error) {
    console.error('Error parsing exports:', error);
  }
  
  return exports;
}

/**
 * Parse Base Relocation Table
 */
function parseRelocations(data, optionalHeader, sections) {
  const relocations = [];
  
  try {
    const relocDir = optionalHeader.dataDirectories[5]; // Base relocation directory
    if (!relocDir || relocDir.virtualAddress === 0) {
      return relocations;
    }
    
    const relocOffset = rvaToFileOffset(relocDir.virtualAddress, sections);
    if (relocOffset === -1) {
      return relocations;
    }
    
    let currentOffset = relocOffset;
    const endOffset = relocOffset + relocDir.size;
    
    while (currentOffset + 8 <= endOffset && currentOffset + 8 <= data.length) {
      const pageRVA = readUInt32LE(data, currentOffset);
      const blockSize = readUInt32LE(data, currentOffset + 4);
      
      if (blockSize === 0 || blockSize > 0x10000) {
        break;
      }
      
      const entriesCount = (blockSize - 8) / 2;
      const entries = [];
      
      for (let i = 0; i < entriesCount && currentOffset + 8 + i * 2 + 2 <= data.length; i++) {
        const entry = readUInt16LE(data, currentOffset + 8 + i * 2);
        const type = entry >> 12;
        const offset = entry & 0x0FFF;
        
        if (type !== 0) {
          entries.push({
            type,
            offset,
            rva: pageRVA + offset
          });
        }
      }
      
      if (entries.length > 0) {
        relocations.push({
          pageRVA,
          blockSize,
          entries
        });
      }
      
      currentOffset += blockSize;
      
      // Safety limit
      if (relocations.length > 1000) {
        break;
      }
    }
  } catch (error) {
    console.error('Error parsing relocations:', error);
  }
  
  return relocations;
}

/**
 * Parse Resource Directory (simplified)
 */
function parseResources(data, optionalHeader, sections) {
  const resources = [];
  
  try {
    const resourceDir = optionalHeader.dataDirectories[2]; // Resource directory
    if (!resourceDir || resourceDir.virtualAddress === 0) {
      return resources;
    }
    
    // Resource parsing is complex, returning basic info for now
    resources.push({
      rva: resourceDir.virtualAddress,
      size: resourceDir.size,
      note: 'Resource directory found - detailed parsing not implemented'
    });
  } catch (error) {
    console.error('Error parsing resources:', error);
  }
  
  return resources;
}

/**
 * Convert RVA (Relative Virtual Address) to file offset
 */
function rvaToFileOffset(rva, sections) {
  for (const section of sections) {
    if (rva >= section.virtualAddress && rva < section.virtualAddress + section.virtualSize) {
      return section.pointerToRawData + (rva - section.virtualAddress);
    }
  }
  return -1;
}

/**
 * Helper functions for reading data
 */
function readUInt8(data, offset) {
  return data[offset];
}

function readUInt16LE(data, offset) {
  return data[offset] | (data[offset + 1] << 8);
}

function readUInt32LE(data, offset) {
  return (data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)) >>> 0;
}

function readUInt64LE(data, offset) {
  const low = readUInt32LE(data, offset);
  const high = readUInt32LE(data, offset + 4);
  return BigInt(high) * 0x100000000n + BigInt(low);
}

function readString(data, offset, maxLength = 256) {
  let str = '';
  for (let i = 0; i < maxLength && offset + i < data.length; i++) {
    const char = data[offset + i];
    if (char === 0) break;
    str += String.fromCharCode(char);
  }
  return str;
}

/**
 * Helper functions for parsing flags and names
 */
function getMachineName(machine) {
  const machines = {
    0x014C: 'x86 (Intel 386)',
    0x8664: 'x64 (AMD64)',
    0x0200: 'Intel Itanium',
    0x01C0: 'ARM',
    0xAA64: 'ARM64'
  };
  return machines[machine] || `Unknown (0x${machine.toString(16)})`;
}

function getSubsystemName(subsystem) {
  const subsystems = {
    0: 'Unknown',
    1: 'Native',
    2: 'Windows GUI',
    3: 'Windows CUI (Console)',
    7: 'POSIX CUI',
    9: 'Windows CE GUI',
    10: 'EFI Application',
    11: 'EFI Boot Service Driver',
    12: 'EFI Runtime Driver',
    13: 'EFI ROM',
    14: 'Xbox',
    16: 'Windows Boot Application'
  };
  return subsystems[subsystem] || `Unknown (${subsystem})`;
}

function parseCharacteristics(flags) {
  const characteristics = [];
  const flagMap = {
    0x0001: 'RELOCS_STRIPPED',
    0x0002: 'EXECUTABLE_IMAGE',
    0x0004: 'LINE_NUMS_STRIPPED',
    0x0008: 'LOCAL_SYMS_STRIPPED',
    0x0010: 'AGGRESSIVE_WS_TRIM',
    0x0020: 'LARGE_ADDRESS_AWARE',
    0x0080: 'BYTES_REVERSED_LO',
    0x0100: '32BIT_MACHINE',
    0x0200: 'DEBUG_STRIPPED',
    0x0400: 'REMOVABLE_RUN_FROM_SWAP',
    0x0800: 'NET_RUN_FROM_SWAP',
    0x1000: 'SYSTEM',
    0x2000: 'DLL',
    0x4000: 'UP_SYSTEM_ONLY',
    0x8000: 'BYTES_REVERSED_HI'
  };
  
  for (const [flag, name] of Object.entries(flagMap)) {
    if (flags & parseInt(flag)) {
      characteristics.push(name);
    }
  }
  
  return characteristics;
}

function parseSectionCharacteristics(flags) {
  const characteristics = [];
  const flagMap = {
    0x00000020: 'CODE',
    0x00000040: 'INITIALIZED_DATA',
    0x00000080: 'UNINITIALIZED_DATA',
    0x02000000: 'DISCARDABLE',
    0x04000000: 'NOT_CACHED',
    0x08000000: 'NOT_PAGED',
    0x10000000: 'SHARED',
    0x20000000: 'EXECUTE',
    0x40000000: 'READ',
    0x80000000: 'WRITE'
  };
  
  for (const [flag, name] of Object.entries(flagMap)) {
    if (flags & parseInt(flag)) {
      characteristics.push(name);
    }
  }
  
  return characteristics;
}

function getSectionType(name, characteristics) {
  if (characteristics & IMAGE_SCN_CNT_CODE) {
    return 'code';
  } else if (characteristics & IMAGE_SCN_CNT_INITIALIZED_DATA) {
    if (name.startsWith('.rdata') || name.startsWith('.idata')) {
      return 'data-readonly';
    }
    return 'data';
  } else if (characteristics & IMAGE_SCN_CNT_UNINITIALIZED_DATA) {
    return 'bss';
  } else if (name.startsWith('.rsrc')) {
    return 'resource';
  }
  return 'unknown';
}

/**
 * Extract all strings from PE file
 */
export function extractStrings(buffer, minLength = 4) {
  const strings = [];
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  
  let currentString = '';
  let startOffset = 0;
  
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    
    // Check if printable ASCII
    if (byte >= 32 && byte <= 126) {
      if (currentString.length === 0) {
        startOffset = i;
      }
      currentString += String.fromCharCode(byte);
    } else if (byte === 0 && currentString.length >= minLength) {
      strings.push({
        offset: startOffset,
        value: currentString,
        length: currentString.length
      });
      currentString = '';
    } else {
      currentString = '';
    }
  }
  
  return strings;
}
