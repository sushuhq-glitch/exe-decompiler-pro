/**
 * Crypto Scanner - Detect cryptographic algorithms
 * Finds AES, RSA, MD5, SHA, RC4, Base64, and custom encryption
 */

/**
 * Scan for cryptographic algorithms
 * @param {Uint8Array} data - Raw file data
 * @param {Object} peData - Parsed PE data
 * @returns {Object} Crypto detection results
 */
export function scanCrypto(data, peData) {
  const results = {
    algorithms: [],
    constants: [],
    patterns: [],
    confidence: 0
  };

  // Check for known crypto constants
  checkAES(data, results);
  checkMD5(data, results);
  checkSHA(data, results);
  checkRC4(data, results);
  checkBase64(data, results);
  checkRSA(data, results);

  // Check imports for crypto APIs
  checkCryptoAPIs(peData, results);

  // Calculate overall confidence
  results.confidence = calculateCryptoConfidence(results);

  return results;
}

/**
 * Check for AES constants
 */
function checkAES(data, results) {
  // AES S-box first row
  const aesSbox = [0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5];
  
  if (findBytePattern(data, aesSbox)) {
    results.algorithms.push({
      name: 'AES',
      type: 'Symmetric Encryption',
      confidence: 85,
      location: 'S-box detected'
    });
    results.constants.push('AES S-box');
  }

  // AES Inverse S-box
  const aesInvSbox = [0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38];
  
  if (findBytePattern(data, aesInvSbox)) {
    results.constants.push('AES Inverse S-box');
  }

  // AES Round constants
  const aesRcon = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80];
  
  if (findBytePattern(data, aesRcon)) {
    results.constants.push('AES Round constants');
  }
}

/**
 * Check for MD5 constants
 */
function checkMD5(data, results) {
  // MD5 initialization constants
  const md5Constants = [
    0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476
  ];

  let found = 0;
  for (const constant of md5Constants) {
    if (findDwordPattern(data, [constant])) {
      found++;
    }
  }

  if (found >= 3) {
    results.algorithms.push({
      name: 'MD5',
      type: 'Hash Function',
      confidence: 90,
      location: 'Initialization constants detected'
    });
    results.constants.push('MD5 IV constants');
  }
}

/**
 * Check for SHA constants
 */
function checkSHA(data, results) {
  // SHA-1 constants
  const sha1Constants = [
    0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0
  ];

  let sha1Found = 0;
  for (const constant of sha1Constants) {
    if (findDwordPattern(data, [constant])) {
      sha1Found++;
    }
  }

  if (sha1Found >= 4) {
    results.algorithms.push({
      name: 'SHA-1',
      type: 'Hash Function',
      confidence: 85,
      location: 'Constants detected'
    });
    results.constants.push('SHA-1 constants');
  }

  // SHA-256 constants (first 8 fractional parts of sqrt of first 8 primes)
  const sha256Constants = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a
  ];

  let sha256Found = 0;
  for (const constant of sha256Constants) {
    if (findDwordPattern(data, [constant])) {
      sha256Found++;
    }
  }

  if (sha256Found >= 3) {
    results.algorithms.push({
      name: 'SHA-256',
      type: 'Hash Function',
      confidence: 85,
      location: 'Constants detected'
    });
    results.constants.push('SHA-256 constants');
  }
}

/**
 * Check for RC4
 */
function checkRC4(data, results) {
  // RC4 key scheduling pattern (0-255 initialization)
  const rc4Pattern = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  
  if (findBytePattern(data, rc4Pattern)) {
    // Check if it continues to 255
    const idx = data.indexOf(0);
    if (idx >= 0 && idx + 256 <= data.length) {
      let isRC4 = true;
      for (let i = 0; i < 256; i++) {
        if (data[idx + i] !== i) {
          isRC4 = false;
          break;
        }
      }
      
      if (isRC4) {
        results.algorithms.push({
          name: 'RC4',
          type: 'Stream Cipher',
          confidence: 80,
          location: 'Key scheduling array detected'
        });
        results.constants.push('RC4 S-box initialization');
      }
    }
  }
}

/**
 * Check for Base64
 */
function checkBase64(data, results) {
  // Base64 alphabet
  const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const alphabetBytes = Array.from(base64Alphabet).map(c => c.charCodeAt(0));
  
  // Check if first 20 chars of alphabet appear consecutively
  const pattern = alphabetBytes.slice(0, 20);
  
  if (findBytePattern(data, pattern)) {
    results.algorithms.push({
      name: 'Base64',
      type: 'Encoding',
      confidence: 90,
      location: 'Alphabet table detected'
    });
    results.constants.push('Base64 alphabet');
  }
}

/**
 * Check for RSA
 */
function checkRSA(data, results) {
  // RSA often uses specific exponents (65537 is common)
  const commonExponent = 0x010001; // 65537
  
  if (findDwordPattern(data, [commonExponent])) {
    results.algorithms.push({
      name: 'RSA',
      type: 'Asymmetric Encryption',
      confidence: 70,
      location: 'Common public exponent detected'
    });
    results.patterns.push('RSA public exponent (65537)');
  }

  // Large prime patterns (RSA uses large primes)
  // Optimized: Sample every 256 bytes instead of every 4 bytes to avoid performance issues
  let largePrimes = 0;
  const SAMPLE_INTERVAL = 256;
  const MAX_PRIMES_TO_CHECK = 100;
  
  for (let i = 0; i < data.length - 4 && largePrimes < MAX_PRIMES_TO_CHECK; i += SAMPLE_INTERVAL) {
    const val = data[i] | (data[i+1] << 8) | (data[i+2] << 16) | (data[i+3] << 24);
    if (val > 1000000 && isProbablePrime(val)) {
      largePrimes++;
    }
  }

  if (largePrimes > 5) {
    results.patterns.push(`${largePrimes} large prime numbers detected (sampled)`);
  }
}

/**
 * Check crypto APIs in imports
 */
function checkCryptoAPIs(peData, results) {
  if (!peData?.imports) return;

  const cryptoAPIs = {
    'advapi32.dll': ['CryptAcquireContext', 'CryptCreateHash', 'CryptHashData', 
                     'CryptEncrypt', 'CryptDecrypt', 'CryptGenKey'],
    'bcrypt.dll': ['BCryptOpenAlgorithmProvider', 'BCryptEncrypt', 'BCryptDecrypt',
                   'BCryptGenerateSymmetricKey'],
    'crypt32.dll': ['CryptBinaryToString', 'CryptStringToBinary']
  };

  for (const dll of peData.imports) {
    const dllName = dll.dll.toLowerCase();
    if (cryptoAPIs[dllName]) {
      const found = [];
      for (const func of dll.functions) {
        if (cryptoAPIs[dllName].includes(func.name)) {
          found.push(func.name);
        }
      }

      if (found.length > 0) {
        results.algorithms.push({
          name: `Windows Crypto API (${dll.dll})`,
          type: 'Crypto Library',
          confidence: 95,
          location: `Imports: ${found.join(', ')}`
        });
      }
    }
  }
}

/**
 * Find byte pattern in data
 */
function findBytePattern(data, pattern) {
  const patternLen = pattern.length;
  for (let i = 0; i <= data.length - patternLen; i++) {
    let match = true;
    for (let j = 0; j < patternLen; j++) {
      if (data[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/**
 * Find DWORD pattern in data
 */
function findDwordPattern(data, dwords) {
  for (const dword of dwords) {
    const bytes = [
      dword & 0xFF,
      (dword >> 8) & 0xFF,
      (dword >> 16) & 0xFF,
      (dword >> 24) & 0xFF
    ];
    
    if (findBytePattern(data, bytes)) {
      return true;
    }
  }
  return false;
}

/**
 * Simple primality test (Miller-Rabin would be better)
 */
function isProbablePrime(n) {
  if (n < 2) return false;
  if (n === 2 || n === 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  
  let i = 5;
  while (i * i <= n) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
    i += 6;
  }
  return true;
}

/**
 * Calculate crypto confidence
 */
function calculateCryptoConfidence(results) {
  if (results.algorithms.length === 0) return 0;

  // Average confidence of detected algorithms
  const avgConfidence = results.algorithms.reduce((sum, alg) => sum + alg.confidence, 0) / results.algorithms.length;
  
  // Bonus for multiple types
  const uniqueTypes = new Set(results.algorithms.map(a => a.type)).size;
  const bonus = uniqueTypes * 5;

  return Math.min(avgConfidence + bonus, 100);
}

/**
 * Get crypto usage summary
 */
export function getCryptoSummary(cryptoResult) {
  if (cryptoResult.algorithms.length === 0) {
    return 'No cryptographic algorithms detected';
  }

  const types = {};
  for (const alg of cryptoResult.algorithms) {
    if (!types[alg.type]) {
      types[alg.type] = [];
    }
    types[alg.type].push(alg.name);
  }

  let summary = `Found ${cryptoResult.algorithms.length} cryptographic algorithm(s):\n`;
  for (const [type, algs] of Object.entries(types)) {
    summary += `- ${type}: ${algs.join(', ')}\n`;
  }

  return summary;
}
