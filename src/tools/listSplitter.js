function splitByParts(content, numParts) {
    const lines = content.split('\n');
    const totalLines = lines.length;
    const linesPerPart = Math.ceil(totalLines / numParts);
    
    const parts = [];
    for (let i = 0; i < numParts; i++) {
        const start = i * linesPerPart;
        const end = Math.min(start + linesPerPart, totalLines);
        const partLines = lines.slice(start, end);
        
        if (partLines.length > 0) {
            parts.push(partLines.join('\n'));
        }
    }
    
    return parts;
}

function splitByLines(content, linesPerFile) {
    const lines = content.split('\n');
    const totalLines = lines.length;
    const numParts = Math.ceil(totalLines / linesPerFile);
    
    const parts = [];
    for (let i = 0; i < numParts; i++) {
        const start = i * linesPerFile;
        const end = Math.min(start + linesPerFile, totalLines);
        const partLines = lines.slice(start, end);
        
        if (partLines.length > 0) {
            parts.push(partLines.join('\n'));
        }
    }
    
    return parts;
}

module.exports = {
    splitByParts,
    splitByLines
};
