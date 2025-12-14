/**
 * Utilities Module
 * Common utility functions for binary analysis, data manipulation, and formatting
 * 
 * Features:
 * - Binary data manipulation
 * - Number formatting and conversion
 * - String utilities
 * - Data structure helpers
 * - Validation functions
 * - Hash calculations
 * - Compression detection
 * - Pattern matching
 * - File format detection
 */

// ============================================================================
// BINARY DATA UTILITIES
// ============================================================================

/**
 * Read unsigned 8-bit integer
 */
export function readUInt8(data, offset) {
  if (offset < 0 || offset >= data.length) {
    throw new Error(`Offset ${offset} out of bounds`);
  }
  return data[offset];
}

/**
 * Read signed 8-bit integer
 */
export function readInt8(data, offset) {
  const value = readUInt8(data, offset);
  return value > 0x7F ? value - 0x100 : value;
}

/**
 * Read unsigned 16-bit integer (little-endian)
 */
export function readUInt16LE(data, offset) {
  if (offset < 0 || offset + 1 >= data.length) {
    throw new Error(`Offset ${offset} out of bounds`);
  }
  return data[offset] | (data[offset + 1] << 8);
}

/**
 * Read unsigned 16-bit integer (big-endian)
 */
export function readUInt16BE(data, offset) {
  if (offset < 0 || offset + 1 >= data.length) {
    throw new Error(`Offset ${offset} out of bounds`);
  }
  return (data[offset] << 8) | data[offset + 1];
}

/**
 * Read signed 16-bit integer (little-endian)
 */
export function readInt16LE(data, offset) {
  const value = readUInt16LE(data, offset);
  return value > 0x7FFF ? value - 0x10000 : value;
}

/**
 * Read signed 16-bit integer (big-endian)
 */
export function readInt16BE(data, offset) {
  const value = readUInt16BE(data, offset);
  return value > 0x7FFF ? value - 0x10000 : value;
}

/**
 * Read unsigned 32-bit integer (little-endian)
 */
export function readUInt32LE(data, offset) {
  if (offset < 0 || offset + 3 >= data.length) {
    throw new Error(`Offset ${offset} out of bounds`);
  }
  return (data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)) >>> 0;
}

/**
 * Read unsigned 32-bit integer (big-endian)
 */
export function readUInt32BE(data, offset) {
  if (offset < 0 || offset + 3 >= data.length) {
    throw new Error(`Offset ${offset} out of bounds`);
  }
  return ((data[offset] << 24) |
    (data[offset + 1] << 16) |
    (data[offset + 2] << 8) |
    data[offset + 3]) >>> 0;
}

/**
 * Read signed 32-bit integer (little-endian)
 */
export function readInt32LE(data, offset) {
  const value = readUInt32LE(data, offset);
  return value > 0x7FFFFFFF ? value - 0x100000000 : value;
}

/**
 * Read signed 32-bit integer (big-endian)
 */
export function readInt32BE(data, offset) {
  const value = readUInt32BE(data, offset);
  return value > 0x7FFFFFFF ? value - 0x100000000 : value;
}

/**
 * Read unsigned 64-bit integer (little-endian)
 * Returns as BigInt for precision
 */
export function readUInt64LE(data, offset) {
  if (offset < 0 || offset + 7 >= data.length) {
    throw new Error(`Offset ${offset} out of bounds`);
  }
  const low = readUInt32LE(data, offset);
  const high = readUInt32LE(data, offset + 4);
  return BigInt(high) * 0x100000000n + BigInt(low);
}

/**
 * Read unsigned 64-bit integer (big-endian)
 */
export function readUInt64BE(data, offset) {
  if (offset < 0 || offset + 7 >= data.length) {
    throw new Error(`Offset ${offset} out of bounds`);
  }
  const high = readUInt32BE(data, offset);
  const low = readUInt32BE(data, offset + 4);
  return BigInt(high) * 0x100000000n + BigInt(low);
}

/**
 * Read null-terminated string (ASCII)
 */
export function readCString(data, offset, maxLength = 1024) {
  const chars = [];
  let i = offset;
  
  while (i < data.length && i < offset + maxLength) {
    const byte = data[i];
    if (byte === 0) break;
    chars.push(byte);
    i++;
  }
  
  return String.fromCharCode(...chars);
}

/**
 * Read null-terminated wide string (UTF-16LE)
 */
export function readWString(data, offset, maxLength = 1024) {
  const chars = [];
  let i = offset;
  
  while (i + 1 < data.length && i < offset + maxLength * 2) {
    const char = data[i] | (data[i + 1] << 8);
    if (char === 0) break;
    chars.push(char);
    i += 2;
  }
  
  return String.fromCharCode(...chars);
}

/**
 * Read fixed-length string
 */
export function readFixedString(data, offset, length) {
  if (offset < 0 || offset + length > data.length) {
    throw new Error(`Offset ${offset} with length ${length} out of bounds`);
  }
  
  const chars = [];
  for (let i = 0; i < length; i++) {
    const byte = data[offset + i];
    if (byte === 0) break;
    chars.push(byte);
  }
  
  return String.fromCharCode(...chars);
}

/**
 * Write unsigned 8-bit integer
 */
export function writeUInt8(data, offset, value) {
  if (offset < 0 || offset >= data.length) {
    throw new Error(`Offset ${offset} out of bounds`);
  }
  data[offset] = value & 0xFF;
}

/**
 * Write unsigned 16-bit integer (little-endian)
 */
export function writeUInt16LE(data, offset, value) {
  if (offset < 0 || offset + 1 >= data.length) {
    throw new Error(`Offset ${offset} out of bounds`);
  }
  data[offset] = value & 0xFF;
  data[offset + 1] = (value >>> 8) & 0xFF;
}

/**
 * Write unsigned 32-bit integer (little-endian)
 */
export function writeUInt32LE(data, offset, value) {
  if (offset < 0 || offset + 3 >= data.length) {
    throw new Error(`Offset ${offset} out of bounds`);
  }
  data[offset] = value & 0xFF;
  data[offset + 1] = (value >>> 8) & 0xFF;
  data[offset + 2] = (value >>> 16) & 0xFF;
  data[offset + 3] = (value >>> 24) & 0xFF;
}

// ============================================================================
// NUMBER FORMATTING UTILITIES
// ============================================================================

/**
 * Format number as hexadecimal
 */
export function toHex(value, width = 0) {
  let hex = value.toString(16).toUpperCase();
  if (width > 0) {
    hex = hex.padStart(width, '0');
  }
  return '0x' + hex;
}

/**
 * Format number as binary
 */
export function toBinary(value, width = 0) {
  let bin = value.toString(2);
  if (width > 0) {
    bin = bin.padStart(width, '0');
  }
  return '0b' + bin;
}

/**
 * Format bytes as hex string
 */
export function bytesToHex(bytes, separator = ' ') {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(separator);
}

/**
 * Parse hex string to bytes
 */
export function hexToBytes(hex) {
  hex = hex.replace(/[^0-9A-Fa-f]/g, '');
  const bytes = [];
  
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  
  return new Uint8Array(bytes);
}

/**
 * Format file size for display
 */
export function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format percentage
 */
export function formatPercentage(value, total) {
  if (total === 0) return '0.00%';
  return ((value / total) * 100).toFixed(2) + '%';
}

/**
 * Format duration in milliseconds to human-readable
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Escape special characters in string
 */
export function escapeString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\0/g, '\\0');
}

/**
 * Unescape special characters in string
 */
export function unescapeString(str) {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\0/g, '\0')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

/**
 * Truncate string to maximum length
 */
export function truncateString(str, maxLength, ellipsis = '...') {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Pad string to fixed length
 */
export function padString(str, length, padChar = ' ', padLeft = false) {
  if (str.length >= length) return str;
  const padding = padChar.repeat(length - str.length);
  return padLeft ? padding + str : str + padding;
}

/**
 * Remove non-printable characters
 */
export function sanitizeString(str) {
  return str.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
}

/**
 * Check if string is valid identifier (variable name)
 */
export function isValidIdentifier(str) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str);
}

/**
 * Convert string to valid identifier
 */
export function toValidIdentifier(str) {
  // Replace invalid characters with underscore
  let identifier = str.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Ensure starts with letter or underscore
  if (!/^[a-zA-Z_]/.test(identifier)) {
    identifier = '_' + identifier;
  }
  
  return identifier;
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => 
      index === 0 ? letter.toLowerCase() : letter.toUpperCase()
    )
    .replace(/\s+/g, '');
}

/**
 * Convert string to snake_case
 */
export function toSnakeCase(str) {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Convert string to PascalCase
 */
export function toPascalCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, letter => letter.toUpperCase())
    .replace(/\s+/g, '');
}

// ============================================================================
// HASH UTILITIES
// ============================================================================

/**
 * Calculate CRC32 checksum
 */
export function calculateCRC32(data) {
  const table = makeCRC32Table();
  let crc = 0xFFFFFFFF;
  
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xFF];
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Make CRC32 lookup table
 */
function makeCRC32Table() {
  const table = new Array(256);
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  return table;
}

/**
 * Calculate MD5 hash (simplified implementation)
 * Note: This is a basic implementation, use crypto APIs for production
 */
export function calculateMD5(data) {
  // This is a placeholder - in production, use crypto.subtle.digest or similar
  // For now, return a simple hash based on data
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash;
  }
  return toHex(hash >>> 0, 8);
}

/**
 * Calculate simple hash for data comparison
 */
export function simpleHash(data) {
  let h = 0;
  for (let i = 0; i < data.length; i++) {
    h = Math.imul(31, h) + data[i] | 0;
  }
  return h >>> 0;
}

// ============================================================================
// PATTERN MATCHING UTILITIES
// ============================================================================

/**
 * Find byte pattern in data
 */
export function findPattern(data, pattern, startOffset = 0) {
  const matches = [];
  
  for (let i = startOffset; i <= data.length - pattern.length; i++) {
    let found = true;
    
    for (let j = 0; j < pattern.length; j++) {
      if (pattern[j] !== null && data[i + j] !== pattern[j]) {
        found = false;
        break;
      }
    }
    
    if (found) {
      matches.push(i);
    }
  }
  
  return matches;
}

/**
 * Find all occurrences of byte pattern
 */
export function findAllPatterns(data, pattern) {
  return findPattern(data, pattern, 0);
}

/**
 * Check if pattern matches at offset
 */
export function matchesPattern(data, offset, pattern) {
  if (offset + pattern.length > data.length) {
    return false;
  }
  
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== null && data[offset + i] !== pattern[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Create wildcard pattern (null = any byte)
 */
export function createPattern(patternString) {
  const parts = patternString.split(' ');
  const pattern = [];
  
  for (const part of parts) {
    if (part === '??' || part === '?') {
      pattern.push(null);
    } else {
      pattern.push(parseInt(part, 16));
    }
  }
  
  return pattern;
}

/**
 * Pattern to string representation
 */
export function patternToString(pattern) {
  return pattern.map(b => b === null ? '??' : b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

// ============================================================================
// DATA STRUCTURE UTILITIES
// ============================================================================

/**
 * Deep clone object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Uint8Array) {
    return new Uint8Array(obj);
  }
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}

/**
 * Merge objects deeply
 */
export function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return deepMerge(target, ...sources);
}

/**
 * Check if value is object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Sort array by key
 */
export function sortByKey(array, key, descending = false) {
  return array.sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return descending ? 1 : -1;
    if (aVal > bVal) return descending ? -1 : 1;
    return 0;
  });
}

/**
 * Group array by key
 */
export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const value = item[key];
    groups[value] = groups[value] || [];
    groups[value].push(item);
    return groups;
  }, {});
}

/**
 * Remove duplicates from array
 */
export function unique(array) {
  return [...new Set(array)];
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate PE signature
 */
export function isValidPE(data) {
  if (data.length < 64) return false;
  
  // Check DOS signature "MZ"
  if (data[0] !== 0x4D || data[1] !== 0x5A) return false;
  
  // Get PE offset
  const peOffset = readUInt32LE(data, 60);
  if (peOffset >= data.length - 4) return false;
  
  // Check PE signature "PE\0\0"
  if (data[peOffset] !== 0x50 || data[peOffset + 1] !== 0x45) return false;
  if (data[peOffset + 2] !== 0x00 || data[peOffset + 3] !== 0x00) return false;
  
  return true;
}

/**
 * Validate address range
 */
export function isValidAddress(address, min, max) {
  return address >= min && address <= max;
}

/**
 * Validate offset in data
 */
export function isValidOffset(offset, data) {
  return offset >= 0 && offset < data.length;
}

/**
 * Check if value is power of 2
 */
export function isPowerOfTwo(value) {
  return value > 0 && (value & (value - 1)) === 0;
}

/**
 * Align value to boundary
 */
export function align(value, alignment) {
  return Math.ceil(value / alignment) * alignment;
}

/**
 * Check if address is aligned
 */
export function isAligned(address, alignment) {
  return address % alignment === 0;
}

// ============================================================================
// COMPRESSION DETECTION
// ============================================================================

/**
 * Detect if data is compressed
 */
export function detectCompression(data) {
  // Check for common compression signatures
  
  // GZIP (1F 8B)
  if (data.length >= 2 && data[0] === 0x1F && data[1] === 0x8B) {
    return { type: 'gzip', offset: 0 };
  }
  
  // ZIP (50 4B)
  if (data.length >= 4 && data[0] === 0x50 && data[1] === 0x4B) {
    return { type: 'zip', offset: 0 };
  }
  
  // RAR (52 61 72 21)
  if (data.length >= 4 && data[0] === 0x52 && data[1] === 0x61 && data[2] === 0x72 && data[3] === 0x21) {
    return { type: 'rar', offset: 0 };
  }
  
  // 7-Zip (37 7A BC AF 27 1C)
  if (data.length >= 6 && data[0] === 0x37 && data[1] === 0x7A && data[2] === 0xBC && 
      data[3] === 0xAF && data[4] === 0x27 && data[5] === 0x1C) {
    return { type: '7z', offset: 0 };
  }
  
  // LZMA
  if (data.length >= 5 && data[0] === 0x5D && data[1] === 0x00 && data[2] === 0x00) {
    return { type: 'lzma', offset: 0 };
  }
  
  // Check entropy - high entropy suggests compression/encryption
  const entropy = calculateEntropy(data.slice(0, Math.min(data.length, 1024)));
  if (entropy > 7.5) {
    return { type: 'unknown_compressed', offset: 0, entropy };
  }
  
  return null;
}

/**
 * Calculate entropy of data
 */
export function calculateEntropy(data) {
  const freq = new Array(256).fill(0);
  
  for (let i = 0; i < data.length; i++) {
    freq[data[i]]++;
  }
  
  let entropy = 0;
  const len = data.length;
  
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      const p = freq[i] / len;
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}

// ============================================================================
// FILE FORMAT DETECTION
// ============================================================================

/**
 * Detect file format by signature
 */
export function detectFileFormat(data) {
  if (data.length < 4) return 'unknown';
  
  // PE/EXE
  if (data[0] === 0x4D && data[1] === 0x5A) {
    return 'pe';
  }
  
  // ELF
  if (data[0] === 0x7F && data[1] === 0x45 && data[2] === 0x4C && data[3] === 0x46) {
    return 'elf';
  }
  
  // Mach-O (32-bit)
  if (data[0] === 0xFE && data[1] === 0xED && data[2] === 0xFA && data[3] === 0xCE) {
    return 'macho32';
  }
  
  // Mach-O (64-bit)
  if (data[0] === 0xFE && data[1] === 0xED && data[2] === 0xFA && data[3] === 0xCF) {
    return 'macho64';
  }
  
  // PDF
  if (data[0] === 0x25 && data[1] === 0x50 && data[2] === 0x44 && data[3] === 0x46) {
    return 'pdf';
  }
  
  // PNG
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
    return 'png';
  }
  
  // JPEG
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
    return 'jpeg';
  }
  
  // GIF
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) {
    return 'gif';
  }
  
  return 'unknown';
}

// ============================================================================
// MEMORY UTILITIES
// ============================================================================

/**
 * Virtual address to file offset (RVA to file offset)
 */
export function rvaToOffset(rva, sections, imageBase = 0) {
  for (const section of sections) {
    const sectionStart = section.virtualAddress;
    const sectionEnd = sectionStart + section.virtualSize;
    
    if (rva >= sectionStart && rva < sectionEnd) {
      const offset = rva - sectionStart + section.pointerToRawData;
      return offset;
    }
  }
  
  return null;
}

/**
 * File offset to virtual address
 */
export function offsetToRva(offset, sections) {
  for (const section of sections) {
    const sectionStart = section.pointerToRawData;
    const sectionEnd = sectionStart + section.sizeOfRawData;
    
    if (offset >= sectionStart && offset < sectionEnd) {
      const rva = offset - sectionStart + section.virtualAddress;
      return rva;
    }
  }
  
  return null;
}

/**
 * Calculate virtual address from RVA and image base
 */
export function rvaToVa(rva, imageBase) {
  return imageBase + rva;
}

/**
 * Calculate RVA from virtual address
 */
export function vaToRva(va, imageBase) {
  return va - imageBase;
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

/**
 * Convert timestamp to date string
 */
export function timestampToDate(timestamp) {
  if (!timestamp || timestamp === 0) return 'N/A';
  try {
    return new Date(timestamp * 1000).toISOString();
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format date for display
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  return d.toLocaleString();
}

/**
 * Get elapsed time string
 */
export function getElapsedTime(startTime) {
  const elapsed = Date.now() - startTime;
  return formatDuration(elapsed);
}

// ============================================================================
// MATH UTILITIES
// ============================================================================

/**
 * Clamp value between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Map value from one range to another
 */
export function map(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

/**
 * Round to decimal places
 */
export function roundTo(value, decimals) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Calculate percentage
 */
export function percentage(value, total) {
  if (total === 0) return 0;
  return (value / total) * 100;
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Fill array with value
 */
export function fillArray(length, value) {
  return new Array(length).fill(value);
}

/**
 * Create range array
 */
export function range(start, end, step = 1) {
  const result = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Sum array values
 */
export function sum(array) {
  return array.reduce((acc, val) => acc + val, 0);
}

/**
 * Average of array values
 */
export function average(array) {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
}

/**
 * Find minimum value in array
 */
export function min(array) {
  return Math.min(...array);
}

/**
 * Find maximum value in array
 */
export function max(array) {
  return Math.max(...array);
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Dump hex view of data
 */
export function hexDump(data, offset = 0, length = 256, bytesPerLine = 16) {
  const lines = [];
  const end = Math.min(offset + length, data.length);
  
  for (let i = offset; i < end; i += bytesPerLine) {
    const lineOffset = toHex(i, 8);
    const lineEnd = Math.min(i + bytesPerLine, end);
    
    // Hex bytes
    const hexBytes = [];
    for (let j = i; j < lineEnd; j++) {
      hexBytes.push(data[j].toString(16).padStart(2, '0').toUpperCase());
    }
    
    // Pad if needed
    while (hexBytes.length < bytesPerLine) {
      hexBytes.push('  ');
    }
    
    // ASCII representation
    const ascii = [];
    for (let j = i; j < lineEnd; j++) {
      const byte = data[j];
      ascii.push(byte >= 0x20 && byte <= 0x7E ? String.fromCharCode(byte) : '.');
    }
    
    lines.push(`${lineOffset}  ${hexBytes.join(' ')}  ${ascii.join('')}`);
  }
  
  return lines.join('\n');
}

/**
 * Print object as formatted JSON
 */
export function prettyPrint(obj) {
  return JSON.stringify(obj, null, 2);
}

/**
 * Measure execution time
 */
export function measureTime(fn, label = 'Operation') {
  const start = Date.now();
  const result = fn();
  const elapsed = Date.now() - start;
  console.log(`${label} took ${elapsed}ms`);
  return result;
}

/**
 * Async measure execution time
 */
export async function measureTimeAsync(fn, label = 'Operation') {
  const start = Date.now();
  const result = await fn();
  const elapsed = Date.now() - start;
  console.log(`${label} took ${elapsed}ms`);
  return result;
}
