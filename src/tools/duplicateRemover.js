function removeDuplicates(content) {
    const lines = content.split('\n');
    const originalCount = lines.length;
    
    // Use Set to remove duplicates while preserving order
    const uniqueLines = [...new Set(lines)];
    const uniqueCount = uniqueLines.length;
    const removedCount = originalCount - uniqueCount;
    
    return {
        content: uniqueLines.join('\n'),
        originalCount,
        uniqueCount,
        removedCount
    };
}

module.exports = {
    removeDuplicates
};
