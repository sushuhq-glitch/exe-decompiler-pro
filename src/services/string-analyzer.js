/**
 * Advanced String Analyzer Module
 * Extracts and analyzes strings from PE files with progress tracking
 * Supports ASCII, Unicode, obfuscated strings, and more
 */

/**
 * Extract all strings from binary data with progress callback
 * @param {Uint8Array} data - Binary data
 * @param {Object} options - Extraction options
 * @param {Function} progressCallback - Progress callback (0-100)
 * @returns {Promise<Array>} Array of extracted strings
 */
export async function extractStringsWithProgress(data, options = {}, progressCallback = null) {
  const {
    minLength = 4,
    maxLength = 1000,
    includeUnicode = true,
    includeAscii = true,
    detectObfuscated = true,
    detectBase64 = true,
    detectXOR = true,
    detectURLs = true,
    detectPaths = true,
    detectRegistry = true
  } = options;

  const strings = [];
  const totalPasses = 1 + 
    (includeUnicode ? 2 : 0) + 
    (detectObfuscated ? 1 : 0) + 
    (detectBase64 ? 1 : 0) + 
    (detectXOR ? 1 : 0);
  
  let currentPass = 0;

  // Pass 1: ASCII strings
  if (includeAscii) {
    if (progressCallback) progressCallback(Math.floor((currentPass / totalPasses) * 100));
    const asciiStrings = await extractASCIIStrings(data, minLength, maxLength);
    strings.push(...asciiStrings);
    currentPass++;
  }

  // Pass 2: UTF-16LE Unicode strings
  if (includeUnicode) {
    if (progressCallback) progressCallback(Math.floor((currentPass / totalPasses) * 100));
    const utf16LEStrings = await extractUTF16LEStrings(data, minLength, maxLength);
    strings.push(...utf16LEStrings);
    currentPass++;
  }

  // Pass 3: UTF-16BE Unicode strings
  if (includeUnicode) {
    if (progressCallback) progressCallback(Math.floor((currentPass / totalPasses) * 100));
    const utf16BEStrings = await extractUTF16BEStrings(data, minLength, maxLength);
    strings.push(...utf16BEStrings);
    currentPass++;
  }

  // Pass 4: Obfuscated strings
  if (detectObfuscated) {
    if (progressCallback) progressCallback(Math.floor((currentPass / totalPasses) * 100));
    const obfuscatedStrings = await extractObfuscatedStrings(data, minLength);
    strings.push(...obfuscatedStrings);
    currentPass++;
  }

  // Pass 5: Base64 encoded strings
  if (detectBase64) {
    if (progressCallback) progressCallback(Math.floor((currentPass / totalPasses) * 100));
    const base64Strings = await extractBase64Strings(data, minLength);
    strings.push(...base64Strings);
    currentPass++;
  }

  // Pass 6: XOR encrypted strings
  if (detectXOR) {
    if (progressCallback) progressCallback(Math.floor((currentPass / totalPasses) * 100));
    const xorStrings = await extractXORStrings(data, minLength);
    strings.push(...xorStrings);
    currentPass++;
  }

  // Final pass: Enrich strings with metadata
  if (progressCallback) progressCallback(95);
  const enrichedStrings = enrichStrings(strings, {
    detectURLs,
    detectPaths,
    detectRegistry
  });

  if (progressCallback) progressCallback(100);

  return enrichedStrings;
}

/**
 * Extract ASCII strings
 */
async function extractASCIIStrings(data, minLength, maxLength) {
  const strings = [];
  let currentString = [];
  let startOffset = 0;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];

    // Printable ASCII: 0x20-0x7E
    if (byte >= 0x20 && byte <= 0x7E) {
      if (currentString.length === 0) {
        startOffset = i;
      }
      currentString.push(byte);
    } else {
      if (currentString.length >= minLength && currentString.length <= maxLength) {
        const str = String.fromCharCode(...currentString);
        strings.push({
          value: str,
          address: `0x${startOffset.toString(16).toUpperCase()}`,
          offset: startOffset,
          length: currentString.length,
          type: 'ASCII',
          encoding: 'ASCII',
          confidence: 1.0
        });
      }
      currentString = [];
    }

    // Yield control periodically for UI updates
    if (i % 10000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // Handle string at end of file
  if (currentString.length >= minLength && currentString.length <= maxLength) {
    const str = String.fromCharCode(...currentString);
    strings.push({
      value: str,
      address: `0x${startOffset.toString(16).toUpperCase()}`,
      offset: startOffset,
      length: currentString.length,
      type: 'ASCII',
      encoding: 'ASCII',
      confidence: 1.0
    });
  }

  return strings;
}

/**
 * Extract UTF-16LE Unicode strings
 */
async function extractUTF16LEStrings(data, minLength, maxLength) {
  const strings = [];
  let currentString = [];
  let startOffset = 0;

  for (let i = 0; i < data.length - 1; i += 2) {
    const lowByte = data[i];
    const highByte = data[i + 1];

    // UTF-16LE: low byte is character, high byte is usually 0 for ASCII range
    if (lowByte >= 0x20 && lowByte <= 0x7E && highByte === 0) {
      if (currentString.length === 0) {
        startOffset = i;
      }
      currentString.push(lowByte);
    } else {
      if (currentString.length >= minLength && currentString.length <= maxLength) {
        const str = String.fromCharCode(...currentString);
        strings.push({
          value: str,
          address: `0x${startOffset.toString(16).toUpperCase()}`,
          offset: startOffset,
          length: currentString.length,
          type: 'Unicode',
          encoding: 'UTF-16LE',
          confidence: 0.9
        });
      }
      currentString = [];
    }

    if (i % 10000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  if (currentString.length >= minLength && currentString.length <= maxLength) {
    const str = String.fromCharCode(...currentString);
    strings.push({
      value: str,
      address: `0x${startOffset.toString(16).toUpperCase()}`,
      offset: startOffset,
      length: currentString.length,
      type: 'Unicode',
      encoding: 'UTF-16LE',
      confidence: 0.9
    });
  }

  return strings;
}

/**
 * Extract UTF-16BE Unicode strings
 */
async function extractUTF16BEStrings(data, minLength, maxLength) {
  const strings = [];
  let currentString = [];
  let startOffset = 0;

  for (let i = 0; i < data.length - 1; i += 2) {
    const highByte = data[i];
    const lowByte = data[i + 1];

    // UTF-16BE: high byte is usually 0, low byte is character for ASCII range
    if (lowByte >= 0x20 && lowByte <= 0x7E && highByte === 0) {
      if (currentString.length === 0) {
        startOffset = i;
      }
      currentString.push(lowByte);
    } else {
      if (currentString.length >= minLength && currentString.length <= maxLength) {
        const str = String.fromCharCode(...currentString);
        strings.push({
          value: str,
          address: `0x${startOffset.toString(16).toUpperCase()}`,
          offset: startOffset,
          length: currentString.length,
          type: 'Unicode',
          encoding: 'UTF-16BE',
          confidence: 0.8
        });
      }
      currentString = [];
    }

    if (i % 10000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  if (currentString.length >= minLength && currentString.length <= maxLength) {
    const str = String.fromCharCode(...currentString);
    strings.push({
      value: str,
      address: `0x${startOffset.toString(16).toUpperCase()}`,
      offset: startOffset,
      length: currentString.length,
      type: 'Unicode',
      encoding: 'UTF-16BE',
      confidence: 0.8
    });
  }

  return strings;
}

/**
 * Extract obfuscated strings (stack strings, character arrays)
 */
async function extractObfuscatedStrings(data, minLength) {
  const strings = [];

  // Look for character array patterns
  // Common pattern: series of bytes followed by null terminators
  for (let i = 0; i < data.length - minLength * 2; i++) {
    const sequence = [];
    let offset = i;

    // Try to detect character arrays
    for (let j = 0; j < 50; j++) {
      if (offset + 1 >= data.length) break;

      const byte = data[offset];
      if (byte >= 0x20 && byte <= 0x7E) {
        sequence.push(byte);
        offset++;
        // Skip potential padding bytes
        if (data[offset] === 0) offset++;
      } else {
        break;
      }
    }

    if (sequence.length >= minLength) {
      const str = String.fromCharCode(...sequence);
      strings.push({
        value: str,
        address: `0x${i.toString(16).toUpperCase()}`,
        offset: i,
        length: sequence.length,
        type: 'Obfuscated',
        encoding: 'Stack String',
        confidence: 0.6
      });
    }

    if (i % 5000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return strings;
}

/**
 * Extract Base64 encoded strings
 */
async function extractBase64Strings(data, minLength) {
  const strings = [];
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  let currentString = [];
  let startOffset = 0;

  for (let i = 0; i < data.length; i++) {
    const char = String.fromCharCode(data[i]);

    if (base64Chars.includes(char)) {
      if (currentString.length === 0) {
        startOffset = i;
      }
      currentString.push(data[i]);
    } else {
      if (currentString.length >= minLength * 4) { // Base64 is 4/3 longer
        const base64Str = String.fromCharCode(...currentString);
        
        // Try to decode
        try {
          const decoded = atob(base64Str);
          if (decoded.length >= minLength && isPrintable(decoded)) {
            strings.push({
              value: decoded,
              address: `0x${startOffset.toString(16).toUpperCase()}`,
              offset: startOffset,
              length: decoded.length,
              type: 'Base64',
              encoding: 'Base64',
              encoded: base64Str,
              confidence: 0.7
            });
          }
        } catch (e) {
          // Invalid Base64, ignore
        }
      }
      currentString = [];
    }

    if (i % 10000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return strings;
}

/**
 * Extract XOR encrypted strings
 */
async function extractXORStrings(data, minLength) {
  const strings = [];
  const commonKeys = [0x00, 0x01, 0xFF, 0xAA, 0x55, 0x20, 0x42];

  // Try common single-byte XOR keys
  for (const key of commonKeys) {
    const decoded = [];
    let validChars = 0;

    for (let i = 0; i < Math.min(data.length, 1000); i++) {
      const byte = data[i] ^ key;
      decoded.push(byte);

      if (byte >= 0x20 && byte <= 0x7E) {
        validChars++;
      }
    }

    // If high percentage of printable characters, might be XOR encrypted
    if (validChars / decoded.length > 0.7) {
      let currentString = [];
      let startOffset = 0;

      for (let i = 0; i < data.length; i++) {
        const byte = data[i] ^ key;

        if (byte >= 0x20 && byte <= 0x7E) {
          if (currentString.length === 0) {
            startOffset = i;
          }
          currentString.push(byte);
        } else {
          if (currentString.length >= minLength) {
            const str = String.fromCharCode(...currentString);
            strings.push({
              value: str,
              address: `0x${startOffset.toString(16).toUpperCase()}`,
              offset: startOffset,
              length: currentString.length,
              type: 'XOR',
              encoding: `XOR-${key.toString(16)}`,
              key: key,
              confidence: 0.5
            });
          }
          currentString = [];
        }

        if (i % 10000 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
  }

  return strings;
}

/**
 * Check if string is printable
 */
function isPrintable(str) {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if ((code < 0x20 || code > 0x7E) && code !== 0x0A && code !== 0x0D && code !== 0x09) {
      return false;
    }
  }
  return true;
}

/**
 * Enrich strings with metadata and categorization
 */
function enrichStrings(strings, options) {
  const { detectURLs, detectPaths, detectRegistry } = options;

  return strings.map(str => {
    const enriched = { ...str };

    // Detect URLs
    if (detectURLs) {
      if (/^https?:\/\//i.test(str.value) || 
          /^ftp:\/\//i.test(str.value) ||
          /www\./i.test(str.value)) {
        enriched.category = 'URL';
        enriched.subtype = 'Web URL';
      }
    }

    // Detect file paths
    if (detectPaths) {
      if (/^[A-Za-z]:\\/i.test(str.value) || 
          /^\\\\/.test(str.value) ||
          /\.exe|\.dll|\.sys|\.bat|\.cmd|\.ps1/i.test(str.value)) {
        enriched.category = 'Path';
        enriched.subtype = 'File Path';
      }
    }

    // Detect registry keys
    if (detectRegistry) {
      if (/^HKEY_/i.test(str.value) ||
          /^HKLM|HKCU|HKCR|HKU|HKCC/i.test(str.value)) {
        enriched.category = 'Registry';
        enriched.subtype = 'Registry Key';
      }
    }

    // Detect emails
    if (/@.+\..+/.test(str.value)) {
      enriched.category = 'Email';
      enriched.subtype = 'Email Address';
    }

    // Detect IP addresses
    if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(str.value)) {
      enriched.category = 'Network';
      enriched.subtype = 'IP Address';
    }

    // Detect format strings
    if (/%[sdxfcp]/i.test(str.value)) {
      enriched.category = 'Format';
      enriched.subtype = 'Format String';
    }

    // Detect error messages
    if (/error|exception|fail|invalid|cannot|unable/i.test(str.value)) {
      enriched.category = 'Error';
      enriched.subtype = 'Error Message';
    }

    // Detect API/function names
    if (/^[A-Z][a-zA-Z0-9]+[AW]?$/.test(str.value) && str.length < 50) {
      enriched.category = 'API';
      enriched.subtype = 'Function Name';
    }

    // Default category
    if (!enriched.category) {
      enriched.category = 'String';
      enriched.subtype = 'Plain Text';
    }

    return enriched;
  });
}

/**
 * Analyze string patterns and statistics
 */
export function analyzeStringPatterns(strings) {
  const analysis = {
    total: strings.length,
    byType: {},
    byCategory: {},
    byEncoding: {},
    averageLength: 0,
    maxLength: 0,
    minLength: Infinity,
    suspicious: [],
    interesting: []
  };

  let totalLength = 0;

  for (const str of strings) {
    // Count by type
    analysis.byType[str.type] = (analysis.byType[str.type] || 0) + 1;

    // Count by category
    if (str.category) {
      analysis.byCategory[str.category] = (analysis.byCategory[str.category] || 0) + 1;
    }

    // Count by encoding
    analysis.byEncoding[str.encoding] = (analysis.byEncoding[str.encoding] || 0) + 1;

    // Length statistics
    totalLength += str.length;
    analysis.maxLength = Math.max(analysis.maxLength, str.length);
    analysis.minLength = Math.min(analysis.minLength, str.length);

    // Detect suspicious strings
    if (str.category === 'URL' || str.category === 'Email' || str.category === 'Network') {
      analysis.suspicious.push(str);
    }

    // Detect interesting strings
    if (str.type === 'XOR' || str.type === 'Base64' || str.type === 'Obfuscated') {
      analysis.interesting.push(str);
    }
  }

  analysis.averageLength = strings.length > 0 ? totalLength / strings.length : 0;

  return analysis;
}

/**
 * Export strings to various formats
 */
export function exportStrings(strings, format = 'txt') {
  if (format === 'txt') {
    return strings.map(s => `${s.address}: ${s.value}`).join('\n');
  } else if (format === 'csv') {
    let csv = 'Address,Type,Encoding,Length,Category,Value\n';
    for (const str of strings) {
      csv += `${str.address},${str.type},${str.encoding},${str.length},${str.category || ''},`;
      csv += `"${str.value.replace(/"/g, '""')}"\n`;
    }
    return csv;
  } else if (format === 'json') {
    return JSON.stringify(strings, null, 2);
  }
  
  return '';
}

/**
 * Search strings with advanced filtering
 */
export function searchStrings(strings, query, options = {}) {
  const {
    caseSensitive = false,
    regex = false,
    category = null,
    type = null,
    minLength = 0,
    maxLength = Infinity
  } = options;

  let filtered = strings;

  // Apply filters
  if (category) {
    filtered = filtered.filter(s => s.category === category);
  }

  if (type) {
    filtered = filtered.filter(s => s.type === type);
  }

  filtered = filtered.filter(s => s.length >= minLength && s.length <= maxLength);

  // Apply search query
  if (query) {
    if (regex) {
      try {
        const re = new RegExp(query, caseSensitive ? '' : 'i');
        filtered = filtered.filter(s => re.test(s.value));
      } catch (e) {
        // Invalid regex, fall back to plain search
        const q = caseSensitive ? query : query.toLowerCase();
        filtered = filtered.filter(s => {
          const val = caseSensitive ? s.value : s.value.toLowerCase();
          return val.includes(q);
        });
      }
    } else {
      const q = caseSensitive ? query : query.toLowerCase();
      filtered = filtered.filter(s => {
        const val = caseSensitive ? s.value : s.value.toLowerCase();
        return val.includes(q);
      });
    }
  }

  return filtered;
}
