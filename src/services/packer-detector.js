/**
 * Packer Detector - Detect packers and protectors
 * Identifies UPX, Themida, VMProtect, ASPack, PECompact, etc.
 */

/**
 * Detect packer/protector
 * @param {Object} peData - Parsed PE data
 * @param {Uint8Array} rawData - Raw file data
 * @returns {Object} Packer detection results
 */
export function detectPacker(peData, rawData) {
  const results = {
    isPacked: false,
    packers: [],
    indicators: [],
    entropy: 0,
    confidence: 0
  };

  if (!peData || !peData.sections) {
    return results;
  }

  // Check for known packer signatures
  checkUPX(peData, results);
  checkThemida(peData, results);
  checkVMProtect(peData, results);
  checkASPack(peData, results);
  checkPECompact(peData, results);
  checkArmadillo(peData, results);

  // Analyze entropy
  analyzeEntropy(peData, rawData, results);

  // Check section characteristics
  analyzeSections(peData, results);

  // Check import table
  analyzeImports(peData, results);

  // Calculate overall confidence
  results.confidence = calculateConfidence(results);
  results.isPacked = results.packers.length > 0 || results.confidence > 70;

  return results;
}

/**
 * Check for UPX packer
 */
function checkUPX(peData, results) {
  // UPX section names: UPX0, UPX1, UPX!
  const upxSections = peData.sections.filter(s => 
    s.name.includes('UPX') || s.name.match(/^UPX[0-9!]/)
  );

  if (upxSections.length > 0) {
    results.packers.push({
      name: 'UPX',
      version: 'Unknown',
      confidence: 95
    });
    results.indicators.push('UPX section names detected');
  }

  // Check for UPX stub pattern
  if (peData.sections.some(s => s.name === 'UPX0' && s.virtualSize === 0)) {
    results.indicators.push('UPX empty section pattern');
  }
}

/**
 * Check for Themida
 */
function checkThemida(peData, results) {
  // Themida section names: .themida, .winlice
  const themidaSections = peData.sections.filter(s =>
    s.name.toLowerCase().includes('themida') ||
    s.name.toLowerCase().includes('winlice')
  );

  if (themidaSections.length > 0) {
    results.packers.push({
      name: 'Themida',
      version: 'Unknown',
      confidence: 90
    });
    results.indicators.push('Themida section names detected');
  }

  // Check for Themida imports
  if (peData.imports) {
    const themidaAPIs = ['VM_Fish_Red_00', 'VM_Tiger_White_00'];
    for (const dll of peData.imports) {
      for (const func of dll.functions) {
        if (themidaAPIs.some(api => func.name?.includes(api))) {
          results.indicators.push('Themida VM API detected');
        }
      }
    }
  }
}

/**
 * Check for VMProtect
 */
function checkVMProtect(peData, results) {
  // VMProtect section names: .vmp, .vmp0, .vmp1
  const vmpSections = peData.sections.filter(s =>
    s.name.toLowerCase().startsWith('.vmp')
  );

  if (vmpSections.length > 0) {
    results.packers.push({
      name: 'VMProtect',
      version: 'Unknown',
      confidence: 90
    });
    results.indicators.push('VMProtect section names detected');
  }

  // Check for unusual section count (VMProtect often adds many sections)
  if (peData.sections.length > 10) {
    results.indicators.push(`Unusual section count: ${peData.sections.length}`);
  }
}

/**
 * Check for ASPack
 */
function checkASPack(peData, results) {
  // ASPack section names: .aspack, .adata
  const aspackSections = peData.sections.filter(s =>
    s.name.toLowerCase().includes('aspack') ||
    s.name.toLowerCase() === '.adata'
  );

  if (aspackSections.length > 0) {
    results.packers.push({
      name: 'ASPack',
      version: 'Unknown',
      confidence: 85
    });
    results.indicators.push('ASPack section names detected');
  }
}

/**
 * Check for PECompact
 */
function checkPECompact(peData, results) {
  // PECompact section names: PEC2, PECompact2
  const pecSections = peData.sections.filter(s =>
    s.name.toLowerCase().includes('pecompact') ||
    s.name.toLowerCase().startsWith('pec')
  );

  if (pecSections.length > 0) {
    results.packers.push({
      name: 'PECompact',
      version: 'Unknown',
      confidence: 85
    });
    results.indicators.push('PECompact section names detected');
  }
}

/**
 * Check for Armadillo
 */
function checkArmadillo(peData, results) {
  // Armadillo section names: .adata, .rsrc
  const armadilloSections = peData.sections.filter(s =>
    s.name.toLowerCase() === '.adata'
  );

  // Armadillo often has specific import patterns
  if (peData.imports) {
    let armadilloImports = 0;
    for (const dll of peData.imports) {
      if (dll.dll.toLowerCase().includes('kernel32')) {
        for (const func of dll.functions) {
          if (['VirtualProtect', 'VirtualAlloc', 'LoadLibrary'].includes(func.name)) {
            armadilloImports++;
          }
        }
      }
    }

    if (armadilloSections.length > 0 && armadilloImports > 2) {
      results.packers.push({
        name: 'Armadillo',
        version: 'Unknown',
        confidence: 75
      });
      results.indicators.push('Armadillo patterns detected');
    }
  }
}

/**
 * Analyze section entropy
 */
function analyzeEntropy(peData, rawData, results) {
  if (!rawData || !peData.sections) return;

  let totalEntropy = 0;
  let highEntropySections = 0;

  for (const section of peData.sections) {
    const start = section.pointerToRawData;
    const size = Math.min(section.sizeOfRawData, rawData.length - start);
    
    if (size > 0 && start + size <= rawData.length) {
      const sectionData = rawData.slice(start, start + size);
      const entropy = calculateEntropy(sectionData);
      section.entropy = entropy;

      totalEntropy += entropy;

      // High entropy (>7.0) suggests encryption/compression
      if (entropy > 7.0) {
        highEntropySections++;
        results.indicators.push(`High entropy in ${section.name}: ${entropy.toFixed(2)}`);
      }
    }
  }

  results.entropy = totalEntropy / peData.sections.length;

  if (highEntropySections >= 2) {
    results.indicators.push(`${highEntropySections} sections with high entropy (possible packing)`);
  }
}

/**
 * Calculate Shannon entropy
 */
function calculateEntropy(data) {
  const freq = new Array(256).fill(0);
  
  // Count byte frequencies
  for (let i = 0; i < data.length; i++) {
    freq[data[i]]++;
  }

  // Calculate entropy
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      const p = freq[i] / data.length;
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

/**
 * Analyze section characteristics
 */
function analyzeSections(peData, results) {
  // Check for unusual section names
  const standardSections = ['.text', '.data', '.rdata', '.rsrc', '.reloc', '.idata', '.edata'];
  const unusualSections = peData.sections.filter(s => 
    !standardSections.some(std => s.name.toLowerCase().startsWith(std))
  );

  if (unusualSections.length > 3) {
    results.indicators.push(`${unusualSections.length} non-standard section names`);
  }

  // Check for executable sections with write permission
  const execWriteSections = peData.sections.filter(s =>
    s.characteristics && 
    (s.characteristics & 0x20000000) && // Executable
    (s.characteristics & 0x80000000)    // Writable
  );

  if (execWriteSections.length > 0) {
    results.indicators.push('Sections with both execute and write permissions');
  }

  // Check for very small or very large sections
  for (const section of peData.sections) {
    if (section.virtualSize > 0 && section.sizeOfRawData === 0) {
      results.indicators.push(`Virtual section detected: ${section.name}`);
    }
  }
}

/**
 * Analyze import table
 */
function analyzeImports(peData, results) {
  if (!peData.imports || peData.imports.length === 0) {
    results.indicators.push('No imports (highly suspicious)');
    return;
  }

  // Very few imports might indicate packing
  const totalImports = peData.imports.reduce((acc, dll) => acc + dll.functions.length, 0);
  if (totalImports < 10) {
    results.indicators.push(`Very few imports: ${totalImports}`);
  }

  // Check for suspicious import patterns
  const suspiciousDLLs = ['kernel32.dll', 'ntdll.dll'];
  let suspiciousAPIs = 0;

  for (const dll of peData.imports) {
    if (suspiciousDLLs.includes(dll.dll.toLowerCase())) {
      for (const func of dll.functions) {
        if (['VirtualProtect', 'VirtualAlloc', 'LoadLibraryA', 'GetProcAddress'].includes(func.name)) {
          suspiciousAPIs++;
        }
      }
    }
  }

  if (suspiciousAPIs > 3) {
    results.indicators.push('Multiple dynamic loading APIs (possible unpacking)');
  }
}

/**
 * Calculate overall confidence
 */
function calculateConfidence(results) {
  let confidence = 0;

  // Base confidence from detected packers
  if (results.packers.length > 0) {
    confidence = Math.max(...results.packers.map(p => p.confidence));
  }

  // Add confidence from indicators
  confidence += Math.min(results.indicators.length * 5, 30);

  // High entropy adds confidence
  if (results.entropy > 7.0) {
    confidence += 20;
  } else if (results.entropy > 6.5) {
    confidence += 10;
  }

  return Math.min(confidence, 100);
}

/**
 * Get unpacking recommendations
 */
export function getUnpackingRecommendations(packerResult) {
  const recommendations = [];

  if (!packerResult.isPacked) {
    return ['No packing detected - file appears to be unpacked'];
  }

  for (const packer of packerResult.packers) {
    switch (packer.name) {
      case 'UPX':
        recommendations.push('Use UPX unpacker: upx -d filename.exe');
        break;
      case 'Themida':
        recommendations.push('Themida is difficult to unpack - consider using a debugger with anti-anti-debug plugins');
        break;
      case 'VMProtect':
        recommendations.push('VMProtect requires manual unpacking or specialized tools');
        break;
      case 'ASPack':
        recommendations.push('Use ASPack unpacker or generic unpacking tools');
        break;
      default:
        recommendations.push(`Try generic unpacking tools for ${packer.name}`);
    }
  }

  if (packerResult.entropy > 7.0) {
    recommendations.push('High entropy detected - likely encrypted or compressed');
  }

  return recommendations;
}
