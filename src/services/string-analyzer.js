/**
 * String Analyzer Module
 * Professional string extraction and analysis for PE executables
 * Supports ASCII, Unicode, UTF-8, and various string encodings
 * 
 * Features:
 * - Extract all printable strings from executable sections
 * - Identify string encoding (ASCII, Unicode, UTF-8, etc.)
 * - Find cross-references to strings
 * - Classify strings by type (path, URL, registry key, etc.)
 * - Extract strings from resources
 * - Detect encrypted/encoded strings
 * - Calculate string entropy for malware analysis
 * - Support for custom string patterns
 */

// Minimum string length for extraction
const MIN_STRING_LENGTH = 4;
const MAX_STRING_LENGTH = 1024;

// String type classifications
const STRING_TYPES = {
  ASCII: 'ASCII',
  UNICODE: 'Unicode',
  UTF8: 'UTF-8',
  WIDE_CHAR: 'Wide Character',
  ANSI: 'ANSI',
  RESOURCE: 'Resource String'
};

// String category classifications
const STRING_CATEGORIES = {
  PATH: 'File Path',
  URL: 'URL',
  REGISTRY: 'Registry Key',
  EMAIL: 'Email',
  IP_ADDRESS: 'IP Address',
  FILENAME: 'Filename',
  API_CALL: 'API Call',
  ERROR_MESSAGE: 'Error Message',
  DEBUG_STRING: 'Debug String',
  FORMAT_STRING: 'Format String',
  COMMAND: 'Command',
  UNKNOWN: 'Unknown'
};

// Character ranges for different encodings
const CHAR_RANGES = {
  ASCII_PRINTABLE: { min: 0x20, max: 0x7E },
  EXTENDED_ASCII: { min: 0x20, max: 0xFF },
  UNICODE_BMP: { min: 0x0020, max: 0xFFFF }
};

/**
 * Main string extraction function
 * @param {Uint8Array} data - Binary data to analyze
 * @param {Object} peData - Parsed PE structure
 * @param {Object} options - Extraction options
 * @returns {Array} Extracted strings with metadata
 */
export function extractAllStrings(data, peData = null, options = {}) {
  const {
    minLength = MIN_STRING_LENGTH,
    maxLength = MAX_STRING_LENGTH,
    includeUnicode = true,
    includeAscii = true,
    includeResources = true,
    calculateEntropy = true,
    findReferences = true,
    classifyStrings = true
  } = options;

  const strings = [];
  const stringSet = new Set(); // Deduplicate strings

  // Extract ASCII strings
  if (includeAscii) {
    const asciiStrings = extractAsciiStrings(data, minLength, maxLength, peData);
    for (const str of asciiStrings) {
      const key = `${str.type}:${str.value}`;
      if (!stringSet.has(key)) {
        strings.push(str);
        stringSet.add(key);
      }
    }
  }

  // Extract Unicode strings
  if (includeUnicode) {
    const unicodeStrings = extractUnicodeStrings(data, minLength, maxLength, peData);
    for (const str of unicodeStrings) {
      const key = `${str.type}:${str.value}`;
      if (!stringSet.has(key)) {
        strings.push(str);
        stringSet.add(key);
      }
    }
  }

  // Extract strings from resources
  if (includeResources && peData && peData.resources) {
    const resourceStrings = extractResourceStrings(data, peData);
    for (const str of resourceStrings) {
      const key = `${str.type}:${str.value}`;
      if (!stringSet.has(key)) {
        strings.push(str);
        stringSet.add(key);
      }
    }
  }

  // Post-processing: enhance strings with additional metadata
  for (let i = 0; i < strings.length; i++) {
    const str = strings[i];

    // Calculate entropy if requested
    if (calculateEntropy) {
      str.entropy = calculateStringEntropy(str.value);
      str.isEncoded = str.entropy > 7.0; // High entropy suggests encoding/encryption
    }

    // Classify string by category
    if (classifyStrings) {
      str.category = classifyString(str.value);
    }

    // Find cross-references if requested
    if (findReferences && peData) {
      str.references = findStringReferences(data, str.offset, peData);
      str.referenceCount = str.references.length;
    }

    // Get section name
    if (peData && peData.sections) {
      str.section = getSectionName(str.offset, peData.sections);
    }

    // Extract printable representation
    str.printable = getPrintableString(str.value);

    // Add language hints for Unicode strings
    if (str.type === STRING_TYPES.UNICODE) {
      str.language = detectStringLanguage(str.value);
    }
  }

  // Sort strings by offset
  strings.sort((a, b) => a.offset - b.offset);

  return strings;
}

/**
 * Extract ASCII strings from binary data
 */
function extractAsciiStrings(data, minLength, maxLength, peData) {
  const strings = [];
  let currentString = [];
  let stringStart = 0;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];

    // Check if byte is printable ASCII (0x20-0x7E)
    if (isPrintableAscii(byte)) {
      if (currentString.length === 0) {
        stringStart = i;
      }
      currentString.push(byte);

      // Prevent extremely long strings
      if (currentString.length >= maxLength) {
        const value = String.fromCharCode(...currentString);
        strings.push(createStringObject(value, stringStart, i + 1, STRING_TYPES.ASCII));
        currentString = [];
      }
    } else if (byte === 0x00 || !isPrintableAscii(byte)) {
      // String terminator or non-printable character
      if (currentString.length >= minLength) {
        const value = String.fromCharCode(...currentString);
        strings.push(createStringObject(value, stringStart, i, STRING_TYPES.ASCII));
      }
      currentString = [];
    }
  }

  // Handle string at end of file
  if (currentString.length >= minLength) {
    const value = String.fromCharCode(...currentString);
    strings.push(createStringObject(value, stringStart, data.length, STRING_TYPES.ASCII));
  }

  return strings;
}

/**
 * Extract Unicode (UTF-16LE) strings from binary data
 */
function extractUnicodeStrings(data, minLength, maxLength, peData) {
  const strings = [];
  let currentString = [];
  let stringStart = 0;

  // Scan for UTF-16LE strings (2 bytes per character)
  for (let i = 0; i < data.length - 1; i += 2) {
    const char = data[i] | (data[i + 1] << 8);

    // Check if character is printable Unicode
    if (isPrintableUnicode(char)) {
      if (currentString.length === 0) {
        stringStart = i;
      }
      currentString.push(char);

      // Prevent extremely long strings
      if (currentString.length >= maxLength) {
        const value = String.fromCharCode(...currentString);
        strings.push(createStringObject(value, stringStart, i + 2, STRING_TYPES.UNICODE));
        currentString = [];
      }
    } else if (char === 0x0000 || !isPrintableUnicode(char)) {
      // String terminator or non-printable character
      if (currentString.length >= minLength) {
        const value = String.fromCharCode(...currentString);
        strings.push(createStringObject(value, stringStart, i, STRING_TYPES.UNICODE));
      }
      currentString = [];
    }
  }

  // Handle string at end of file
  if (currentString.length >= minLength) {
    const value = String.fromCharCode(...currentString);
    strings.push(createStringObject(value, stringStart, data.length, STRING_TYPES.UNICODE));
  }

  return strings;
}

/**
 * Extract strings from resource section
 */
function extractResourceStrings(data, peData) {
  const strings = [];

  if (!peData.resources || peData.resources.length === 0) {
    return strings;
  }

  // Iterate through resources
  for (const resource of peData.resources) {
    if (resource.type === 'STRING_TABLE' || resource.type === 'RT_STRING') {
      // String table resources
      const resourceData = extractResourceData(data, resource, peData);
      if (resourceData) {
        const resourceStrings = parseStringTable(resourceData, resource.offset);
        strings.push(...resourceStrings);
      }
    } else if (resource.type === 'RT_DIALOG' || resource.type === 'RT_MENU') {
      // Dialog and menu resources often contain strings
      const resourceData = extractResourceData(data, resource, peData);
      if (resourceData) {
        const resourceStrings = extractAsciiStrings(resourceData, MIN_STRING_LENGTH, MAX_STRING_LENGTH);
        for (const str of resourceStrings) {
          str.offset += resource.offset;
          str.type = STRING_TYPES.RESOURCE;
          strings.push(str);
        }
      }
    }
  }

  return strings;
}

/**
 * Extract resource data from PE file
 */
function extractResourceData(data, resource, peData) {
  try {
    const offset = resource.offset || 0;
    const size = resource.size || 0;

    if (offset + size <= data.length) {
      return data.slice(offset, offset + size);
    }
  } catch (error) {
    console.error('Error extracting resource data:', error);
  }
  return null;
}

/**
 * Parse string table from resource data
 */
function parseStringTable(data, baseOffset) {
  const strings = [];
  let offset = 0;

  while (offset < data.length - 2) {
    // String table format: 2-byte length followed by string data
    const length = data[offset] | (data[offset + 1] << 8);
    offset += 2;

    if (length === 0 || offset + length * 2 > data.length) {
      break;
    }

    // Extract Unicode string
    const chars = [];
    for (let i = 0; i < length; i++) {
      const char = data[offset] | (data[offset + 1] << 8);
      chars.push(char);
      offset += 2;
    }

    const value = String.fromCharCode(...chars);
    if (value.length >= MIN_STRING_LENGTH) {
      strings.push(createStringObject(value, baseOffset + offset - length * 2, baseOffset + offset, STRING_TYPES.RESOURCE));
    }
  }

  return strings;
}

/**
 * Create string object with metadata
 */
function createStringObject(value, startOffset, endOffset, type) {
  return {
    value,
    offset: startOffset,
    endOffset,
    length: value.length,
    type,
    address: `0x${startOffset.toString(16).toUpperCase()}`,
    category: STRING_CATEGORIES.UNKNOWN,
    section: null,
    entropy: 0,
    isEncoded: false,
    references: [],
    referenceCount: 0,
    printable: value,
    language: null
  };
}

/**
 * Check if byte is printable ASCII
 */
function isPrintableAscii(byte) {
  return byte >= CHAR_RANGES.ASCII_PRINTABLE.min && byte <= CHAR_RANGES.ASCII_PRINTABLE.max;
}

/**
 * Check if character is printable Unicode
 */
function isPrintableUnicode(char) {
  // Basic Latin, Latin-1 Supplement, and common Unicode ranges
  if (char >= 0x20 && char <= 0x7E) return true; // ASCII
  if (char >= 0xA0 && char <= 0xFF) return true; // Latin-1 Supplement
  if (char >= 0x100 && char <= 0x17F) return true; // Latin Extended-A
  if (char >= 0x180 && char <= 0x24F) return true; // Latin Extended-B
  if (char >= 0x400 && char <= 0x4FF) return true; // Cyrillic
  if (char >= 0x4E00 && char <= 0x9FFF) return true; // CJK Unified Ideographs
  return false;
}

/**
 * Calculate Shannon entropy of a string
 * High entropy (> 7.0) suggests encryption or encoding
 */
function calculateStringEntropy(str) {
  if (!str || str.length === 0) return 0;

  const freq = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    freq[char] = (freq[char] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;

  for (const char in freq) {
    const p = freq[char] / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Classify string by category (path, URL, registry, etc.)
 */
function classifyString(str) {
  // URL patterns
  if (/^https?:\/\//i.test(str) || /^ftp:\/\//i.test(str)) {
    return STRING_CATEGORIES.URL;
  }

  // Email patterns
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str)) {
    return STRING_CATEGORIES.EMAIL;
  }

  // IP address patterns
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(str)) {
    return STRING_CATEGORIES.IP_ADDRESS;
  }

  // Registry key patterns
  if (/^HKEY_/i.test(str) || /^HKLM\\/i.test(str) || /^HKCU\\/i.test(str)) {
    return STRING_CATEGORIES.REGISTRY;
  }

  // File path patterns (Windows)
  if (/^[A-Za-z]:\\/.test(str) || /^\\\\/.test(str)) {
    return STRING_CATEGORIES.PATH;
  }

  // Unix path patterns
  if (/^\/[a-zA-Z0-9_\-./]+/.test(str)) {
    return STRING_CATEGORIES.PATH;
  }

  // Filename patterns
  if (/\.[a-zA-Z0-9]{1,4}$/.test(str) && str.indexOf('\\') === -1 && str.indexOf('/') === -1) {
    return STRING_CATEGORIES.FILENAME;
  }

  // API call patterns (PascalCase or camelCase)
  if (/^[A-Z][a-zA-Z0-9]*[A-Z]/.test(str) && str.length <= 64) {
    return STRING_CATEGORIES.API_CALL;
  }

  // Error message patterns
  if (/^(Error|Warning|Failed|Invalid|Cannot|Unable)/i.test(str)) {
    return STRING_CATEGORIES.ERROR_MESSAGE;
  }

  // Debug string patterns
  if (/^(Debug|Trace|Log|Info)/i.test(str)) {
    return STRING_CATEGORIES.DEBUG_STRING;
  }

  // Format string patterns
  if (/%[sdifxXpouc]/.test(str) || /\{[0-9]+\}/.test(str)) {
    return STRING_CATEGORIES.FORMAT_STRING;
  }

  // Command patterns
  if (/^(cmd|powershell|bash|sh|python|perl)/i.test(str)) {
    return STRING_CATEGORIES.COMMAND;
  }

  return STRING_CATEGORIES.UNKNOWN;
}

/**
 * Find cross-references to a string
 */
function findStringReferences(data, stringOffset, peData) {
  const references = [];

  if (!peData || !peData.sections) {
    return references;
  }

  // Find code sections
  const codeSections = peData.sections.filter(s => s.type === 'code' || s.flags?.includes('EXECUTE'));

  for (const section of codeSections) {
    const sectionStart = section.pointerToRawData || 0;
    const sectionEnd = sectionStart + (section.sizeOfRawData || 0);

    if (sectionEnd > data.length) continue;

    // Calculate virtual address of string
    const stringVA = peData.imageBase + stringOffset;

    // Scan section for references (32-bit addresses)
    for (let i = sectionStart; i < sectionEnd - 4; i++) {
      const value = data[i] | (data[i + 1] << 8) | (data[i + 2] << 16) | (data[i + 3] << 24);

      if (value === stringVA) {
        references.push({
          offset: i,
          address: `0x${i.toString(16).toUpperCase()}`,
          section: section.name,
          type: 'direct'
        });
      }
    }
  }

  return references;
}

/**
 * Get section name for a given offset
 */
function getSectionName(offset, sections) {
  for (const section of sections) {
    const start = section.pointerToRawData || 0;
    const end = start + (section.sizeOfRawData || 0);

    if (offset >= start && offset < end) {
      return section.name;
    }
  }
  return null;
}

/**
 * Get printable representation of string
 */
function getPrintableString(str) {
  // Replace non-printable characters with escape sequences
  return str.replace(/[\x00-\x1F\x7F-\x9F]/g, (char) => {
    const code = char.charCodeAt(0);
    switch (code) {
      case 0x00: return '\\0';
      case 0x07: return '\\a';
      case 0x08: return '\\b';
      case 0x09: return '\\t';
      case 0x0A: return '\\n';
      case 0x0D: return '\\r';
      case 0x1B: return '\\e';
      default: return `\\x${code.toString(16).padStart(2, '0')}`;
    }
  });
}

/**
 * Detect string language based on character ranges
 */
function detectStringLanguage(str) {
  let hasCyrillic = false;
  let hasCJK = false;
  let hasLatin = false;
  let hasArabic = false;
  let hasHebrew = false;

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    if (code >= 0x0400 && code <= 0x04FF) hasCyrillic = true;
    else if (code >= 0x4E00 && code <= 0x9FFF) hasCJK = true;
    else if (code >= 0x0041 && code <= 0x007A) hasLatin = true;
    else if (code >= 0x0600 && code <= 0x06FF) hasArabic = true;
    else if (code >= 0x0590 && code <= 0x05FF) hasHebrew = true;
  }

  if (hasCJK) return 'CJK (Chinese/Japanese/Korean)';
  if (hasCyrillic) return 'Cyrillic (Russian/Ukrainian/etc.)';
  if (hasArabic) return 'Arabic';
  if (hasHebrew) return 'Hebrew';
  if (hasLatin) return 'Latin';

  return 'Unknown';
}

/**
 * Search strings by pattern
 */
export function searchStrings(strings, searchTerm, options = {}) {
  const {
    caseSensitive = false,
    useRegex = false,
    searchInValue = true,
    searchInCategory = true,
    searchInSection = true
  } = options;

  if (!searchTerm) {
    return strings;
  }

  const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  return strings.filter(str => {
    if (searchInValue) {
      const value = caseSensitive ? str.value : str.value.toLowerCase();
      if (useRegex) {
        try {
          const regex = new RegExp(searchTerm, caseSensitive ? '' : 'i');
          if (regex.test(str.value)) return true;
        } catch (e) {
          // Invalid regex, fall back to simple search
          if (value.includes(term)) return true;
        }
      } else {
        if (value.includes(term)) return true;
      }
    }

    if (searchInCategory && str.category) {
      const category = caseSensitive ? str.category : str.category.toLowerCase();
      if (category.includes(term)) return true;
    }

    if (searchInSection && str.section) {
      const section = caseSensitive ? str.section : str.section.toLowerCase();
      if (section.includes(term)) return true;
    }

    return false;
  });
}

/**
 * Filter strings by type
 */
export function filterStringsByType(strings, types) {
  if (!types || types.length === 0) {
    return strings;
  }

  return strings.filter(str => types.includes(str.type));
}

/**
 * Filter strings by category
 */
export function filterStringsByCategory(strings, categories) {
  if (!categories || categories.length === 0) {
    return strings;
  }

  return strings.filter(str => categories.includes(str.category));
}

/**
 * Filter strings by length range
 */
export function filterStringsByLength(strings, minLength, maxLength) {
  return strings.filter(str => str.length >= minLength && str.length <= maxLength);
}

/**
 * Filter strings by section
 */
export function filterStringsBySection(strings, sections) {
  if (!sections || sections.length === 0) {
    return strings;
  }

  return strings.filter(str => str.section && sections.includes(str.section));
}

/**
 * Filter strings by entropy (encoded/encrypted detection)
 */
export function filterStringsByEntropy(strings, minEntropy, maxEntropy) {
  return strings.filter(str => str.entropy >= minEntropy && str.entropy <= maxEntropy);
}

/**
 * Export strings to various formats
 */
export function exportStrings(strings, format = 'text') {
  switch (format) {
    case 'text':
      return exportStringsText(strings);
    case 'csv':
      return exportStringsCsv(strings);
    case 'json':
      return exportStringsJson(strings);
    case 'html':
      return exportStringsHtml(strings);
    default:
      return exportStringsText(strings);
  }
}

/**
 * Export strings to plain text
 */
function exportStringsText(strings) {
  let output = '# String Analysis Report\n';
  output += `# Total Strings: ${strings.length}\n`;
  output += `# Generated: ${new Date().toISOString()}\n\n`;

  for (const str of strings) {
    output += `${str.address} [${str.type}] [${str.length}] ${str.section || 'N/A'} - ${str.value}\n`;
  }

  return output;
}

/**
 * Export strings to CSV
 */
function exportStringsCsv(strings) {
  let output = 'Address,Type,Length,Section,Category,Entropy,References,Value\n';

  for (const str of strings) {
    const value = str.value.replace(/"/g, '""'); // Escape quotes
    output += `"${str.address}","${str.type}","${str.length}","${str.section || ''}","${str.category}","${str.entropy.toFixed(2)}","${str.referenceCount}","${value}"\n`;
  }

  return output;
}

/**
 * Export strings to JSON
 */
function exportStringsJson(strings) {
  return JSON.stringify(strings, null, 2);
}

/**
 * Export strings to HTML
 */
function exportStringsHtml(strings) {
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>String Analysis Report</title>
  <style>
    body { font-family: monospace; background: #2B2B2B; color: #D4D4D4; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #4A4A4A; padding: 8px; text-align: left; }
    th { background: #3C3C3C; }
    tr:hover { background: #3C3C3C; }
  </style>
</head>
<body>
  <h1>String Analysis Report</h1>
  <p>Total Strings: ${strings.length}</p>
  <p>Generated: ${new Date().toISOString()}</p>
  <table>
    <thead>
      <tr>
        <th>Address</th>
        <th>Type</th>
        <th>Length</th>
        <th>Section</th>
        <th>Category</th>
        <th>Entropy</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
`;

  for (const str of strings) {
    const value = str.value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html += `      <tr>
        <td>${str.address}</td>
        <td>${str.type}</td>
        <td>${str.length}</td>
        <td>${str.section || 'N/A'}</td>
        <td>${str.category}</td>
        <td>${str.entropy.toFixed(2)}</td>
        <td>${value}</td>
      </tr>
`;
  }

  html += `    </tbody>
  </table>
</body>
</html>`;

  return html;
}

/**
 * Get string statistics
 */
export function getStringStatistics(strings) {
  const stats = {
    total: strings.length,
    byType: {},
    byCategory: {},
    bySection: {},
    averageLength: 0,
    averageEntropy: 0,
    encodedCount: 0,
    withReferences: 0
  };

  let totalLength = 0;
  let totalEntropy = 0;

  for (const str of strings) {
    // Count by type
    stats.byType[str.type] = (stats.byType[str.type] || 0) + 1;

    // Count by category
    stats.byCategory[str.category] = (stats.byCategory[str.category] || 0) + 1;

    // Count by section
    if (str.section) {
      stats.bySection[str.section] = (stats.bySection[str.section] || 0) + 1;
    }

    // Accumulate length and entropy
    totalLength += str.length;
    totalEntropy += str.entropy;

    // Count encoded strings
    if (str.isEncoded) {
      stats.encodedCount++;
    }

    // Count strings with references
    if (str.referenceCount > 0) {
      stats.withReferences++;
    }
  }

  stats.averageLength = strings.length > 0 ? totalLength / strings.length : 0;
  stats.averageEntropy = strings.length > 0 ? totalEntropy / strings.length : 0;

  return stats;
}

/**
 * Find similar strings (using Levenshtein distance)
 */
export function findSimilarStrings(strings, targetString, maxDistance = 3) {
  const similar = [];

  for (const str of strings) {
    const distance = levenshteinDistance(str.value, targetString);
    if (distance <= maxDistance && distance > 0) {
      similar.push({
        ...str,
        distance
      });
    }
  }

  // Sort by distance
  similar.sort((a, b) => a.distance - b.distance);

  return similar;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Detect string patterns (repeated sequences)
 */
export function detectStringPatterns(strings) {
  const patterns = {};

  for (const str of strings) {
    // Look for repeated substrings
    for (let len = 3; len <= Math.min(str.value.length / 2, 10); len++) {
      for (let i = 0; i <= str.value.length - len * 2; i++) {
        const pattern = str.value.substr(i, len);
        const remaining = str.value.substr(i + len);

        if (remaining.includes(pattern)) {
          patterns[pattern] = (patterns[pattern] || 0) + 1;
        }
      }
    }
  }

  // Sort patterns by frequency
  const sortedPatterns = Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100); // Top 100 patterns

  return sortedPatterns.map(([pattern, count]) => ({ pattern, count }));
}

/**
 * Analyze string for potential vulnerabilities
 */
export function analyzeStringVulnerabilities(str) {
  const vulnerabilities = [];

  // SQL Injection patterns
  if (/SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER/i.test(str.value)) {
    if (/%s|%d|\?|:/.test(str.value)) {
      vulnerabilities.push({
        type: 'SQL Injection',
        severity: 'High',
        description: 'String contains SQL keywords with potential injection points'
      });
    }
  }

  // Command Injection patterns
  if (/cmd|powershell|bash|sh|exec|system/i.test(str.value)) {
    if (/\||&|;|`|\$\(/.test(str.value)) {
      vulnerabilities.push({
        type: 'Command Injection',
        severity: 'High',
        description: 'String contains command execution with shell metacharacters'
      });
    }
  }

  // Path Traversal patterns
  if (/\.\.\/|\.\.\\/.test(str.value)) {
    vulnerabilities.push({
      type: 'Path Traversal',
      severity: 'Medium',
      description: 'String contains path traversal sequences'
    });
  }

  // Hardcoded credentials
  if (/password|passwd|pwd|secret|key|token/i.test(str.value)) {
    if (str.length > 8 && str.entropy > 4.0) {
      vulnerabilities.push({
        type: 'Hardcoded Credentials',
        severity: 'High',
        description: 'Potential hardcoded password or secret key'
      });
    }
  }

  // Buffer overflow potential
  if (str.length > 256) {
    vulnerabilities.push({
      type: 'Buffer Overflow Risk',
      severity: 'Low',
      description: 'Very long string may cause buffer overflow if not properly handled'
    });
  }

  return vulnerabilities;
}

// Export all string types and categories for UI
export { STRING_TYPES, STRING_CATEGORIES };
