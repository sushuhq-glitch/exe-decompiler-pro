#!/usr/bin/env node

/**
 * Demo script to showcase the Keyword Generator functionality
 * Run with: node demo.js
 */

const KeywordGenerator = require('./src/tools/keywordGenerator');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       IL TOOL DI CARPANO - Keyword Generator Demo       ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Generate keywords for each language
const languages = ['IT', 'DE', 'MX', 'TW', 'AT'];
const languageNames = {
    'IT': 'Italiano',
    'DE': 'Deutsch',
    'MX': 'Español (México)',
    'TW': '中文 (Taiwan)',
    'AT': 'Deutsch (Österreich)'
};

languages.forEach(lang => {
    console.log(`\n${languageNames[lang]} (${lang}):`);
    console.log('─'.repeat(60));
    
    const startTime = Date.now();
    const keywords = KeywordGenerator.generateKeywords(lang, 20, true);
    const endTime = Date.now();
    
    keywords.slice(0, 10).forEach((kw, idx) => {
        console.log(`  ${idx + 1}. ${kw}`);
    });
    
    if (keywords.length > 10) {
        console.log(`  ... and ${keywords.length - 10} more`);
    }
    
    console.log(`\n  Generated: ${keywords.length} keywords in ${endTime - startTime}ms`);
});

console.log('\n\n╔════════════════════════════════════════════════════════════╗');
console.log('║              Format Examples                             ║');
console.log('╚════════════════════════════════════════════════════════════╝');

const sampleKeywords = KeywordGenerator.generateKeywords('IT', 5, false);

console.log('\n📄 TXT Format:');
console.log('─'.repeat(60));
console.log(KeywordGenerator.formatAsTXT(sampleKeywords));

console.log('\n📊 CSV Format:');
console.log('─'.repeat(60));
console.log(KeywordGenerator.formatAsCSV(sampleKeywords));

console.log('\n✅ Demo completed successfully!');
console.log('Run "npm start" to launch the full Electron application.\n');
