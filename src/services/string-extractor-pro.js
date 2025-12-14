/**
 * String Extractor Pro - 100% Working String Extraction
 * Extracts ALL types of strings from PE executables
 * - ASCII strings
 * - Unicode UTF-16LE/BE
 * - UTF-8 strings
 * - Base64 encoded
 * - XOR encrypted
 * - ROT13 obfuscated
 * - URLs, emails, IPs, registry keys, file paths
 */

// Minimum string length for ASCII
const MIN_STRING_LENGTH = 4;

/**
 * Main string extraction function
 * @param {Uint8Array} data - Raw executable data
 * @param {Object} peData - Parsed PE structure (optional)
 * @returns {Array} Array of extracted strings with metadata
 */
export function extractAllStrings(data, peData = null) {
  const strings = [];
  const seen = new Set(); // Avoid duplicates

  console.log(`Starting string extraction from ${data.length} bytes...`);

  // 1. Extract ASCII strings
  const asciiStrings = extractASCIIStrings(data);
  console.log(`Found ${asciiStrings.length} ASCII strings`);
  for (const str of asciiStrings) {
    const key = `${str.address}-${str.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      strings.push(str);
    }
  }

  // 2. Extract Unicode UTF-16LE strings
  const unicodeLE = extractUnicodeStrings(data, true);
  console.log(`Found ${unicodeLE.length} Unicode LE strings`);
  for (const str of unicodeLE) {
    const key = `${str.address}-${str.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      strings.push(str);
    }
  }

  // 3. Extract Unicode UTF-16BE strings
  const unicodeBE = extractUnicodeStrings(data, false);
  console.log(`Found ${unicodeBE.length} Unicode BE strings`);
  for (const str of unicodeBE) {
    const key = `${str.address}-${str.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      strings.push(str);
    }
  }

  // 4. Extract UTF-8 strings
  const utf8Strings = extractUTF8Strings(data);
  console.log(`Found ${utf8Strings.length} UTF-8 strings`);
  for (const str of utf8Strings) {
    const key = `${str.address}-${str.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      strings.push(str);
    }
  }

  // 5. Detect special patterns (URLs, emails, IPs, registry, paths)
  const patterns = detectPatterns(strings);
  console.log(`Detected ${patterns.length} special patterns`);

  // 6. Try to decode Base64 strings
  const base64Strings = findBase64Strings(strings);
  console.log(`Found ${base64Strings.length} Base64 strings`);
  
  // 7. Try XOR decryption (common single-byte XOR keys)
  const xorStrings = tryXORDecryption(data);
  console.log(`Found ${xorStrings.length} XOR encrypted strings`);
  for (const str of xorStrings) {
    const key = `${str.address}-${str.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      strings.push(str);
    }
  }

  // 8. ROT13 detection
  const rot13Strings = findROT13Strings(strings);
  console.log(`Found ${rot13Strings.length} ROT13 strings`);

  // Combine all strings and sort by address
  const allStrings = [...strings, ...patterns, ...base64Strings, ...rot13Strings];
  allStrings.sort((a, b) => a.address - b.address);

  // Add section information if PE data is available
  if (peData && peData.sections) {
    for (const str of allStrings) {
      str.section = getSectionName(str.address, peData.sections);
    }
  }

  console.log(`Total strings extracted: ${allStrings.length}`);
  return allStrings;
}

/**
 * Extract ASCII strings (printable characters)
 */
function extractASCIIStrings(data) {
  const strings = [];
  let currentString = '';
  let startAddress = 0;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    
    // Printable ASCII range (0x20-0x7E) plus common control chars
    if ((byte >= 0x20 && byte <= 0x7E) || byte === 0x09 || byte === 0x0A || byte === 0x0D) {
      if (currentString.length === 0) {
        startAddress = i;
      }
      currentString += String.fromCharCode(byte);
    } else {
      // String ended
      if (currentString.length >= MIN_STRING_LENGTH) {
        // Clean up string (remove trailing/leading whitespace)
        const cleaned = currentString.trim();
        if (cleaned.length >= MIN_STRING_LENGTH) {
          strings.push({
            address: startAddress,
            value: cleaned,
            length: cleaned.length,
            type: 'ASCII',
            encoding: 'ASCII'
          });
        }
      }
      currentString = '';
    }
  }

  // Handle last string
  if (currentString.length >= MIN_STRING_LENGTH) {
    const cleaned = currentString.trim();
    if (cleaned.length >= MIN_STRING_LENGTH) {
      strings.push({
        address: startAddress,
        value: cleaned,
        length: cleaned.length,
        type: 'ASCII',
        encoding: 'ASCII'
      });
    }
  }

  return strings;
}

/**
 * Extract Unicode UTF-16 strings (LE or BE)
 */
function extractUnicodeStrings(data, littleEndian = true) {
  const strings = [];
  let currentString = '';
  let startAddress = 0;

  for (let i = 0; i < data.length - 1; i += 2) {
    let charCode;
    
    if (littleEndian) {
      charCode = data[i] | (data[i + 1] << 8);
    } else {
      charCode = (data[i] << 8) | data[i + 1];
    }

    // Check if it's a printable character or whitespace
    if ((charCode >= 0x20 && charCode <= 0x7E) || 
        charCode === 0x09 || charCode === 0x0A || charCode === 0x0D ||
        (charCode >= 0xA0 && charCode <= 0xFFFF && charCode !== 0xFFFD)) {
      
      if (currentString.length === 0) {
        startAddress = i;
      }
      currentString += String.fromCharCode(charCode);
    } else if (charCode === 0x00) {
      // Null terminator - end of string
      if (currentString.length >= MIN_STRING_LENGTH) {
        const cleaned = currentString.trim();
        if (cleaned.length >= MIN_STRING_LENGTH) {
          strings.push({
            address: startAddress,
            value: cleaned,
            length: cleaned.length,
            type: littleEndian ? 'Unicode LE' : 'Unicode BE',
            encoding: littleEndian ? 'UTF-16LE' : 'UTF-16BE'
          });
        }
      }
      currentString = '';
    } else {
      // Invalid character - reset
      if (currentString.length >= MIN_STRING_LENGTH) {
        const cleaned = currentString.trim();
        if (cleaned.length >= MIN_STRING_LENGTH) {
          strings.push({
            address: startAddress,
            value: cleaned,
            length: cleaned.length,
            type: littleEndian ? 'Unicode LE' : 'Unicode BE',
            encoding: littleEndian ? 'UTF-16LE' : 'UTF-16BE'
          });
        }
      }
      currentString = '';
    }
  }

  return strings;
}

/**
 * Extract UTF-8 strings
 */
function extractUTF8Strings(data) {
  const strings = [];
  let i = 0;
  
  while (i < data.length) {
    let currentString = '';
    let startAddress = i;
    let validUTF8 = true;
    
    while (i < data.length && validUTF8) {
      const byte = data[i];
      
      // Single-byte character (ASCII)
      if ((byte & 0x80) === 0) {
        if ((byte >= 0x20 && byte <= 0x7E) || byte === 0x09 || byte === 0x0A || byte === 0x0D) {
          currentString += String.fromCharCode(byte);
          i++;
        } else if (byte === 0) {
          break; // Null terminator
        } else {
          validUTF8 = false;
        }
      }
      // Multi-byte UTF-8 character
      else if ((byte & 0xE0) === 0xC0) {
        // 2-byte character
        if (i + 1 < data.length && (data[i + 1] & 0xC0) === 0x80) {
          const charCode = ((byte & 0x1F) << 6) | (data[i + 1] & 0x3F);
          currentString += String.fromCharCode(charCode);
          i += 2;
        } else {
          validUTF8 = false;
        }
      }
      else if ((byte & 0xF0) === 0xE0) {
        // 3-byte character
        if (i + 2 < data.length && 
            (data[i + 1] & 0xC0) === 0x80 && 
            (data[i + 2] & 0xC0) === 0x80) {
          const charCode = ((byte & 0x0F) << 12) | 
                          ((data[i + 1] & 0x3F) << 6) | 
                          (data[i + 2] & 0x3F);
          try {
            currentString += String.fromCharCode(charCode);
          } catch (e) {
            validUTF8 = false;
          }
          i += 3;
        } else {
          validUTF8 = false;
        }
      }
      else {
        validUTF8 = false;
      }
    }
    
    if (currentString.length >= MIN_STRING_LENGTH) {
      const cleaned = currentString.trim();
      if (cleaned.length >= MIN_STRING_LENGTH) {
        strings.push({
          address: startAddress,
          value: cleaned,
          length: cleaned.length,
          type: 'UTF-8',
          encoding: 'UTF-8'
        });
      }
    }
    
    if (validUTF8) {
      i++;
    } else {
      i++;
    }
  }
  
  return strings;
}

/**
 * Detect special patterns in strings
 */
function detectPatterns(strings) {
  const patterns = [];
  
  // URL pattern
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  // Email pattern
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  // IP address pattern
  const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  // Registry key pattern
  const regKeyRegex = /(?:HKEY_[A-Z_]+|HKLM|HKCU|HKCR|HKU|HKCC)\\[^\s<>"]+/gi;
  // File path pattern
  const pathRegex = /[A-Za-z]:\\(?:[^\s<>"|?*]+\\)*[^\s<>"|?*]*/g;

  for (const str of strings) {
    const value = str.value;
    
    // Check URL
    const urls = value.match(urlRegex);
    if (urls) {
      for (const url of urls) {
        patterns.push({
          ...str,
          value: url,
          type: 'URL',
          pattern: 'URL'
        });
      }
    }
    
    // Check Email
    const emails = value.match(emailRegex);
    if (emails) {
      for (const email of emails) {
        patterns.push({
          ...str,
          value: email,
          type: 'Email',
          pattern: 'Email'
        });
      }
    }
    
    // Check IP
    const ips = value.match(ipRegex);
    if (ips) {
      for (const ip of ips) {
        patterns.push({
          ...str,
          value: ip,
          type: 'IP Address',
          pattern: 'IP'
        });
      }
    }
    
    // Check Registry
    const regKeys = value.match(regKeyRegex);
    if (regKeys) {
      for (const key of regKeys) {
        patterns.push({
          ...str,
          value: key,
          type: 'Registry Key',
          pattern: 'Registry'
        });
      }
    }
    
    // Check File Path
    const paths = value.match(pathRegex);
    if (paths) {
      for (const path of paths) {
        if (path.length >= MIN_STRING_LENGTH) {
          patterns.push({
            ...str,
            value: path,
            type: 'File Path',
            pattern: 'Path'
          });
        }
      }
    }
  }
  
  return patterns;
}

/**
 * Find Base64 encoded strings
 */
function findBase64Strings(strings) {
  const base64Strings = [];
  const base64Regex = /^[A-Za-z0-9+/]{20,}={0,2}$/;
  
  for (const str of strings) {
    if (base64Regex.test(str.value)) {
      try {
        // Try to decode - atob throws DOMException for invalid Base64
        const decoded = atob(str.value);
        if (decoded && decoded.length >= MIN_STRING_LENGTH) {
          // Check if decoded string is printable
          let isPrintable = true;
          for (let i = 0; i < decoded.length; i++) {
            const code = decoded.charCodeAt(i);
            if (code < 0x20 && code !== 0x09 && code !== 0x0A && code !== 0x0D) {
              if (code !== 0x00 || i < decoded.length - 1) {
                isPrintable = false;
                break;
              }
            }
          }
          
          if (isPrintable) {
            base64Strings.push({
              ...str,
              type: 'Base64',
              decoded: decoded.trim(),
              encoding: 'Base64'
            });
          }
        }
      } catch (e) {
        // Not valid Base64 - atob throws DOMException for malformed input
        if (e instanceof DOMException || e.name === 'InvalidCharacterError') {
          // Expected error for invalid Base64
        } else {
          console.error('Unexpected error decoding Base64:', e);
        }
      }
    }
  }
  
  return base64Strings;
}

/**
 * Try XOR decryption with common single-byte keys
 */
function tryXORDecryption(data) {
  const xorStrings = [];
  const keysToTry = [0x00, 0x01, 0x20, 0x42, 0x55, 0x66, 0x77, 0x88, 0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF];
  
  for (const key of keysToTry) {
    let currentString = '';
    let startAddress = 0;
    
    for (let i = 0; i < data.length; i++) {
      const decrypted = data[i] ^ key;
      
      // Check if it's printable ASCII
      if (decrypted >= 0x20 && decrypted <= 0x7E) {
        if (currentString.length === 0) {
          startAddress = i;
        }
        currentString += String.fromCharCode(decrypted);
      } else {
        if (currentString.length >= MIN_STRING_LENGTH * 2) { // Higher threshold for XOR
          xorStrings.push({
            address: startAddress,
            value: currentString.trim(),
            length: currentString.length,
            type: 'XOR Encrypted',
            encoding: 'XOR',
            key: '0x' + key.toString(16).padStart(2, '0').toUpperCase()
          });
        }
        currentString = '';
      }
    }
  }
  
  return xorStrings;
}

/**
 * Find ROT13 obfuscated strings
 */
function findROT13Strings(strings) {
  const rot13Strings = [];
  
  function rot13(str) {
    return str.replace(/[a-zA-Z]/g, (char) => {
      const start = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(start + (char.charCodeAt(0) - start + 13) % 26);
    });
  }
  
  for (const str of strings) {
    const decoded = rot13(str.value);
    // Check if decoded version looks more like English text
    const originalWords = str.value.split(/\s+/).filter(w => w.length >= 3);
    const decodedWords = decoded.split(/\s+/).filter(w => w.length >= 3);
    
    // Simple heuristic: if decoded has more vowels, it might be ROT13
    const countVowels = (s) => (s.match(/[aeiou]/gi) || []).length;
    const originalVowels = countVowels(str.value);
    const decodedVowels = countVowels(decoded);
    
    if (decodedVowels > originalVowels * 1.5 && decodedWords.length >= 2) {
      rot13Strings.push({
        ...str,
        type: 'ROT13',
        decoded: decoded,
        encoding: 'ROT13'
      });
    }
  }
  
  return rot13Strings;
}

/**
 * Get section name for an address
 */
function getSectionName(address, sections) {
  for (const section of sections) {
    if (address >= section.pointerToRawData && 
        address < section.pointerToRawData + section.sizeOfRawData) {
      return section.name;
    }
  }
  return 'Unknown';
}

/**
 * Format strings for display in table
 */
export function formatStringsForDisplay(strings) {
  return strings.map(str => ({
    address: '0x' + str.address.toString(16).padStart(8, '0').toUpperCase(),
    type: str.type || str.encoding || 'ASCII',
    length: str.length || str.value.length,
    value: str.value,
    section: str.section || '',
    decoded: str.decoded || null,
    key: str.key || null
  }));
}

/**
 * Export strings to various formats
 */
export function exportStrings(strings, format = 'txt') {
  if (format === 'txt') {
    return strings.map(s => 
      `[${s.address}] ${s.type} (${s.length}): ${s.value}`
    ).join('\n');
  } else if (format === 'csv') {
    let csv = 'Address,Type,Length,Value,Section\n';
    csv += strings.map(s => 
      `${s.address},"${s.type}",${s.length},"${s.value.replace(/"/g, '""')}","${s.section || ''}"`
    ).join('\n');
    return csv;
  } else if (format === 'json') {
    return JSON.stringify(strings, null, 2);
  }
  return '';
}
