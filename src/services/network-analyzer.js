/**
 * Network Analyzer - Detect network capabilities and C2 patterns
 * Analyzes network APIs, URLs, IPs, and suspicious patterns
 */

/**
 * Analyze network capabilities
 * @param {Object} peData - Parsed PE data
 * @param {Array} strings - Extracted strings
 * @returns {Object} Network analysis results
 */
export function analyzeNetwork(peData, strings) {
  const results = {
    hasNetworkCapabilities: false,
    apis: [],
    urls: [],
    ips: [],
    domains: [],
    ports: [],
    protocols: [],
    suspiciousPatterns: [],
    c2Indicators: [],
    riskLevel: 'low'
  };

  // Analyze network APIs
  analyzeNetworkAPIs(peData, results);

  // Extract network artifacts from strings
  extractNetworkArtifacts(strings, results);

  // Detect C2 patterns
  detectC2Patterns(results);

  // Calculate risk level
  results.riskLevel = calculateNetworkRisk(results);

  return results;
}

/**
 * Analyze network-related APIs
 */
function analyzeNetworkAPIs(peData, results) {
  if (!peData?.imports) return;

  const networkAPIs = {
    'ws2_32.dll': {
      socket: ['WSAStartup', 'socket', 'WSASocket'],
      connect: ['connect', 'WSAConnect'],
      send: ['send', 'WSASend', 'sendto'],
      recv: ['recv', 'WSARecv', 'recvfrom'],
      dns: ['gethostbyname', 'getaddrinfo', 'GetAddrInfoW'],
      other: ['bind', 'listen', 'accept', 'select', 'shutdown']
    },
    'wininet.dll': {
      http: ['InternetOpen', 'InternetOpenUrl', 'InternetReadFile', 
             'HttpSendRequest', 'HttpQueryInfo'],
      ftp: ['FtpOpenFile', 'FtpGetFile', 'FtpPutFile'],
      other: ['InternetConnect', 'InternetCloseHandle']
    },
    'winhttp.dll': {
      http: ['WinHttpOpen', 'WinHttpConnect', 'WinHttpSendRequest',
             'WinHttpReceiveResponse', 'WinHttpReadData']
    },
    'urlmon.dll': {
      download: ['URLDownloadToFile', 'URLDownloadToCacheFile']
    }
  };

  for (const dll of peData.imports) {
    const dllName = dll.dll.toLowerCase();
    if (networkAPIs[dllName]) {
      for (const func of dll.functions) {
        for (const [category, apis] of Object.entries(networkAPIs[dllName])) {
          if (apis.includes(func.name)) {
            results.apis.push({
              dll: dll.dll,
              function: func.name,
              category: category,
              risk: getRiskLevel(func.name)
            });
            results.hasNetworkCapabilities = true;
          }
        }
      }
    }
  }
}

/**
 * Extract network artifacts from strings
 */
function extractNetworkArtifacts(strings, results) {
  if (!strings) return;

  for (const str of strings) {
    // URLs
    if (str.type === 'URL' || /^https?:\/\//i.test(str.value)) {
      results.urls.push({
        value: str.value,
        address: str.address
      });
      
      // Extract domain
      const domain = extractDomain(str.value);
      if (domain && !results.domains.includes(domain)) {
        results.domains.push(domain);
      }
    }

    // IP addresses
    if (str.type === 'IP Address' || /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(str.value)) {
      const ipMatch = str.value.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
      if (ipMatch) {
        results.ips.push({
          value: ipMatch[1],
          address: str.address
        });
      }
    }

    // Port numbers (common format: :8080, port 443, etc.)
    const portMatch = str.value.match(/:(\d{2,5})\b|port\s+(\d{2,5})/i);
    if (portMatch) {
      const port = parseInt(portMatch[1] || portMatch[2]);
      if (port > 0 && port < 65536 && !results.ports.includes(port)) {
        results.ports.push(port);
      }
    }

    // Protocol references
    const protocols = ['http', 'https', 'ftp', 'smtp', 'pop3', 'imap', 'ssh', 'telnet'];
    for (const proto of protocols) {
      if (str.value.toLowerCase().includes(proto) && !results.protocols.includes(proto)) {
        results.protocols.push(proto);
      }
    }
  }
}

/**
 * Detect C2 (Command & Control) patterns
 */
function detectC2Patterns(results) {
  // Suspicious ports
  const suspiciousPorts = [4444, 5555, 6666, 8080, 8888, 9999, 31337, 12345];
  for (const port of results.ports) {
    if (suspiciousPorts.includes(port)) {
      results.c2Indicators.push({
        type: 'Suspicious Port',
        value: port,
        description: `Port ${port} is commonly used by malware`
      });
    }
  }

  // Multiple URLs/IPs might indicate C2 fallback
  if (results.urls.length > 5) {
    results.c2Indicators.push({
      type: 'Multiple URLs',
      value: results.urls.length,
      description: 'Multiple URLs detected - possible C2 fallback mechanism'
    });
  }

  if (results.ips.length > 3) {
    results.c2Indicators.push({
      type: 'Multiple IP Addresses',
      value: results.ips.length,
      description: 'Multiple hardcoded IPs - possible C2 servers'
    });
  }

  // Suspicious domains
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.top', '.xyz'];
  for (const domain of results.domains) {
    if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
      results.c2Indicators.push({
        type: 'Suspicious Domain',
        value: domain,
        description: 'Domain uses TLD commonly associated with malware'
      });
    }
  }

  // DGA-like patterns (Domain Generation Algorithm)
  for (const domain of results.domains) {
    if (isDGALike(domain)) {
      results.c2Indicators.push({
        type: 'DGA Pattern',
        value: domain,
        description: 'Domain appears to be algorithmically generated'
      });
    }
  }

  // HTTP download capability
  const hasDownload = results.apis.some(api => 
    api.category === 'download' || 
    api.function.includes('Download')
  );
  
  if (hasDownload && results.urls.length > 0) {
    results.suspiciousPatterns.push({
      type: 'Download Capability',
      description: 'Can download files from URLs - possible payload dropper'
    });
  }

  // Raw sockets with hardcoded IPs
  const hasRawSockets = results.apis.some(api => 
    api.category === 'socket' && api.function.includes('socket')
  );
  
  if (hasRawSockets && results.ips.length > 0) {
    results.suspiciousPatterns.push({
      type: 'Raw Socket Communication',
      description: 'Uses raw sockets with hardcoded IPs - possible C2 communication'
    });
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const match = url.match(/^https?:\/\/([^/:]+)/i);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

/**
 * Check if domain looks like DGA (Domain Generation Algorithm)
 */
function isDGALike(domain) {
  // DGA domains often have:
  // - Long random strings
  // - Low vowel ratio
  // - High entropy
  
  const name = domain.split('.')[0]; // Get subdomain/hostname
  if (name.length < 10) return false;

  // Count vowels
  const vowels = (name.match(/[aeiou]/gi) || []).length;
  const vowelRatio = vowels / name.length;

  // DGA typically has low vowel ratio
  if (vowelRatio < 0.2) return true;

  // Check for consecutive consonants
  const consonantRuns = name.match(/[^aeiou]{5,}/gi);
  if (consonantRuns && consonantRuns.length > 0) return true;

  return false;
}

/**
 * Get risk level for API
 */
function getRiskLevel(apiName) {
  const highRisk = ['URLDownloadToFile', 'InternetOpenUrl'];
  const mediumRisk = ['HttpSendRequest', 'send', 'recv'];
  
  if (highRisk.includes(apiName)) return 'high';
  if (mediumRisk.includes(apiName)) return 'medium';
  return 'low';
}

/**
 * Calculate overall network risk
 */
function calculateNetworkRisk(results) {
  let score = 0;

  // APIs
  score += results.apis.filter(a => a.risk === 'high').length * 10;
  score += results.apis.filter(a => a.risk === 'medium').length * 5;

  // C2 indicators
  score += results.c2Indicators.length * 15;

  // Suspicious patterns
  score += results.suspiciousPatterns.length * 10;

  // Multiple destinations
  if (results.urls.length > 3) score += 10;
  if (results.ips.length > 2) score += 10;

  if (score >= 50) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

/**
 * Get network summary
 */
export function getNetworkSummary(networkResult) {
  if (!networkResult.hasNetworkCapabilities) {
    return 'No network capabilities detected';
  }

  let summary = `Network Analysis:\n`;
  summary += `- APIs: ${networkResult.apis.length} network-related functions\n`;
  summary += `- URLs: ${networkResult.urls.length}\n`;
  summary += `- IPs: ${networkResult.ips.length}\n`;
  summary += `- Domains: ${networkResult.domains.length}\n`;
  summary += `- Risk Level: ${networkResult.riskLevel.toUpperCase()}\n`;

  if (networkResult.c2Indicators.length > 0) {
    summary += `\n⚠️ ${networkResult.c2Indicators.length} C2 indicator(s) detected!`;
  }

  return summary;
}
