/**
 * ============================================================================
 * STRING EXTRACTOR - ADVANCED STRING EXTRACTION
 * ============================================================================
 * 
 * Extracts all types of strings from binary data:
 * - ASCII strings
 * - UTF-16 LE/BE strings
 * - UTF-8 strings
 * - Base64 encoded strings
 * - URLs and email addresses
 * - File paths (Windows/Unix)
 * - Registry keys
 * - IP addresses
 * - Cryptographic keys/hashes
 * 
 * @author String Extraction Engine
 * @version 1.0.0
 */

// String detection constants
const MIN_BASE64_LENGTH = 20; // Minimum length for Base64 string detection
const MIN_HEX_STRING_LENGTH = 16; // Minimum length for hex string detection

/**
 * Main string extraction function
 */
export function extractStrings(binaryData, options = {}) {
  const extractor = new StringExtractor(binaryData, options);
  return extractor.extract();
}

/**
 * StringExtractor Class
 */
class StringExtractor {
  constructor(binaryData, options = {}) {
    this.binaryData = binaryData;
    this.options = {
      minLength: options.minLength || 4,
      extractASCII: options.extractASCII !== false,
      extractUTF16: options.extractUTF16 !== false,
      extractUTF8: options.extractUTF8 !== false,
      identifyTypes: options.identifyTypes !== false,
      ...options
    };
    this.strings = [];
  }
  
  /**
   * Extract all strings
   */
  extract() {
    if (this.options.extractASCII) {
      this.extractASCIIStrings();
    }
    
    if (this.options.extractUTF16) {
      this.extractUTF16Strings();
    }
    
    if (this.options.extractUTF8) {
      this.extractUTF8Strings();
    }
    
    if (this.options.identifyTypes) {
      this.identifyStringTypes();
    }
    
    // Remove duplicates
    this.removeDuplicates();
    
    // Sort by address
    this.strings.sort((a, b) => a.address - b.address);
    
    return this.strings;
  }
  
  /**
   * Extract ASCII strings
   */
  extractASCIIStrings() {
    let currentString = '';
    let startAddress = 0;
    const minLength = this.options.minLength;
    
    for (let i = 0; i < this.binaryData.length; i++) {
      const byte = this.binaryData[i];
      
      // Printable ASCII characters
      if (byte >= 32 && byte < 127) {
        if (currentString.length === 0) {
          startAddress = i;
        }
        currentString += String.fromCharCode(byte);
      } 
      // Null terminator or non-printable
      else {
        if (currentString.length >= minLength) {
          this.strings.push({
            address: startAddress,
            value: currentString,
            type: 'ASCII',
            length: currentString.length,
            encoding: 'ASCII'
          });
        }
        currentString = '';
      }
    }
    
    // Catch final string
    if (currentString.length >= minLength) {
      this.strings.push({
        address: startAddress,
        value: currentString,
        type: 'ASCII',
        length: currentString.length,
        encoding: 'ASCII'
      });
    }
  }
  
  /**
   * Extract UTF-16 LE strings
   */
  extractUTF16Strings() {
    let currentString = '';
    let startAddress = 0;
    const minLength = this.options.minLength;
    
    for (let i = 0; i < this.binaryData.length - 1; i += 2) {
      const byte1 = this.binaryData[i];
      const byte2 = this.binaryData[i + 1];
      
      // UTF-16 LE: high byte is 0 for ASCII range
      if (byte2 === 0 && byte1 >= 32 && byte1 < 127) {
        if (currentString.length === 0) {
          startAddress = i;
        }
        currentString += String.fromCharCode(byte1);
      } 
      // Null terminator
      else if (byte1 === 0 && byte2 === 0) {
        if (currentString.length >= minLength) {
          this.strings.push({
            address: startAddress,
            value: currentString,
            type: 'UTF16',
            length: currentString.length * 2,
            encoding: 'UTF-16LE'
          });
        }
        currentString = '';
      }
      // Non-printable
      else {
        if (currentString.length >= minLength) {
          this.strings.push({
            address: startAddress,
            value: currentString,
            type: 'UTF16',
            length: currentString.length * 2,
            encoding: 'UTF-16LE'
          });
        }
        currentString = '';
      }
    }
    
    if (currentString.length >= minLength) {
      this.strings.push({
        address: startAddress,
        value: currentString,
        type: 'UTF16',
        length: currentString.length * 2,
        encoding: 'UTF-16LE'
      });
    }
  }
  
  /**
   * Extract UTF-8 strings (basic implementation)
   */
  extractUTF8Strings() {
    // UTF-8 detection is complex - this is a simplified version
    let currentString = '';
    let startAddress = 0;
    const minLength = this.options.minLength;
    
    for (let i = 0; i < this.binaryData.length; i++) {
      const byte = this.binaryData[i];
      
      // Single byte UTF-8 (ASCII)
      if (byte < 128) {
        if (byte >= 32 && byte < 127) {
          if (currentString.length === 0) {
            startAddress = i;
          }
          currentString += String.fromCharCode(byte);
        } else if (byte === 0 && currentString.length >= minLength) {
          this.strings.push({
            address: startAddress,
            value: currentString,
            type: 'UTF8',
            length: currentString.length,
            encoding: 'UTF-8'
          });
          currentString = '';
        }
      }
      // Multi-byte UTF-8
      else if (byte >= 0xC0 && byte <= 0xDF && i + 1 < this.binaryData.length) {
        // 2-byte sequence
        const byte2 = this.binaryData[i + 1];
        if ((byte2 & 0xC0) === 0x80) {
          const codePoint = ((byte & 0x1F) << 6) | (byte2 & 0x3F);
          if (codePoint >= 32 && codePoint < 127) {
            if (currentString.length === 0) {
              startAddress = i;
            }
            currentString += String.fromCharCode(codePoint);
          }
          i++; // Skip next byte
        }
      }
    }
  }
  
  /**
   * Identify string types (URLs, paths, IPs, etc.)
   */
  identifyStringTypes() {
    for (const str of this.strings) {
      // URLs
      if (this.isURL(str.value)) {
        str.type = 'URL';
        str.subtype = this.getURLType(str.value);
      }
      // Email addresses
      else if (this.isEmail(str.value)) {
        str.type = 'Email';
      }
      // File paths
      else if (this.isFilePath(str.value)) {
        str.type = 'Path';
        str.subtype = this.isWindowsPath(str.value) ? 'Windows' : 'Unix';
      }
      // Registry keys
      else if (this.isRegistryKey(str.value)) {
        str.type = 'Registry';
      }
      // IP addresses
      else if (this.isIPAddress(str.value)) {
        str.type = 'IP';
        str.subtype = this.isIPv4(str.value) ? 'IPv4' : 'IPv6';
      }
      // Base64
      else if (this.isBase64(str.value)) {
        str.type = 'Base64';
      }
      // Hex strings (potential keys/hashes)
      else if (this.isHexString(str.value)) {
        str.type = 'Hex';
        str.subtype = this.getHexType(str.value);
      }
      // User agent strings
      else if (this.isUserAgent(str.value)) {
        str.type = 'UserAgent';
      }
      // JSON
      else if (this.isJSON(str.value)) {
        str.type = 'JSON';
      }
      // XML
      else if (this.isXML(str.value)) {
        str.type = 'XML';
      }
      // SQL queries
      else if (this.isSQL(str.value)) {
        str.type = 'SQL';
      }
    }
  }
  
  /**
   * Check if string is a URL
   */
  isURL(str) {
    return /^(https?|ftp):\/\/[^\s]+$/i.test(str);
  }
  
  /**
   * Get URL type
   */
  getURLType(str) {
    if (str.startsWith('https://')) return 'HTTPS';
    if (str.startsWith('http://')) return 'HTTP';
    if (str.startsWith('ftp://')) return 'FTP';
    return 'Other';
  }
  
  /**
   * Check if string is an email
   */
  isEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }
  
  /**
   * Check if string is a file path
   */
  isFilePath(str) {
    return this.isWindowsPath(str) || this.isUnixPath(str);
  }
  
  /**
   * Check if string is a Windows path
   */
  isWindowsPath(str) {
    return /^[A-Za-z]:\\[^\s]+$/.test(str) || /^\\\\[^\s]+/.test(str);
  }
  
  /**
   * Check if string is a Unix path
   */
  isUnixPath(str) {
    return /^\/[a-zA-Z0-9_\-./]+$/.test(str);
  }
  
  /**
   * Check if string is a registry key
   */
  isRegistryKey(str) {
    return /^(HKEY_|HKLM|HKCU|HKCR|HKU|HKCC)/.test(str);
  }
  
  /**
   * Check if string is an IP address
   */
  isIPAddress(str) {
    return this.isIPv4(str) || this.isIPv6(str);
  }
  
  /**
   * Check if string is IPv4
   */
  isIPv4(str) {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(str);
  }
  
  /**
   * Check if string is IPv6
   */
  isIPv6(str) {
    return /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/.test(str);
  }
  
  /**
   * Check if string is Base64
   */
  isBase64(str) {
    if (str.length < MIN_BASE64_LENGTH) return false;
    const pattern = new RegExp(`^[A-Za-z0-9+/]{${MIN_BASE64_LENGTH},}={0,2}$`);
    return pattern.test(str) && str.length % 4 === 0;
  }
  
  /**
   * Check if string is hex
   */
  isHexString(str) {
    if (str.length < MIN_HEX_STRING_LENGTH) return false;
    const pattern = new RegExp(`^[0-9a-fA-F]{${MIN_HEX_STRING_LENGTH},}$`);
    return pattern.test(str);
  }
  
  /**
   * Get hex string type (MD5, SHA1, SHA256, etc.)
   */
  getHexType(str) {
    const len = str.length;
    if (len === 32) return 'MD5';
    if (len === 40) return 'SHA1';
    if (len === 64) return 'SHA256';
    if (len === 128) return 'SHA512';
    return 'Unknown';
  }
  
  /**
   * Check if string is a user agent
   */
  isUserAgent(str) {
    return str.includes('Mozilla/') || str.includes('Chrome/') || str.includes('Safari/');
  }
  
  /**
   * Check if string is JSON
   */
  isJSON(str) {
    if (str.length < 10) return false;
    const trimmed = str.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
           (trimmed.startsWith('[') && trimmed.endsWith(']'));
  }
  
  /**
   * Check if string is XML
   */
  isXML(str) {
    return str.includes('<?xml') || (str.startsWith('<') && str.endsWith('>'));
  }
  
  /**
   * Check if string is SQL
   */
  isSQL(str) {
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
    const upper = str.toUpperCase();
    return sqlKeywords.some(kw => upper.includes(kw));
  }
  
  /**
   * Remove duplicate strings
   */
  removeDuplicates() {
    const unique = new Map();
    
    for (const str of this.strings) {
      const key = `${str.address}_${str.value}`;
      if (!unique.has(key)) {
        unique.set(key, str);
      }
    }
    
    this.strings = Array.from(unique.values());
  }
}

/**
 * Export specific string types
 */
export function extractURLs(binaryData) {
  const strings = extractStrings(binaryData);
  return strings.filter(s => s.type === 'URL');
}

export function extractPaths(binaryData) {
  const strings = extractStrings(binaryData);
  return strings.filter(s => s.type === 'Path');
}

export function extractIPs(binaryData) {
  const strings = extractStrings(binaryData);
  return strings.filter(s => s.type === 'IP');
}

export function extractBase64(binaryData) {
  const strings = extractStrings(binaryData);
  return strings.filter(s => s.type === 'Base64');
}

export default extractStrings;
