function checkPasswordStrength(password) {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    
    // Character diversity checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    // Classification
    if (score <= 3) return 'WEAK';
    if (score <= 5) return 'MEDIUM';
    return 'STRONG';
}

function parsePasswordFile(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const results = {
        WEAK: [],
        MEDIUM: [],
        STRONG: []
    };
    
    for (const line of lines) {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const email = parts[0].trim();
            const password = parts.slice(1).join(':').trim();
            const strength = checkPasswordStrength(password);
            results[strength].push(line);
        }
    }
    
    return results;
}

module.exports = {
    checkPasswordStrength,
    parsePasswordFile
};
