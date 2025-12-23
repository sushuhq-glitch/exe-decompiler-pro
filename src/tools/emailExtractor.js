function extractEmails(text) {
    // Comprehensive email regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    const matches = text.match(emailRegex);
    if (!matches) {
        return [];
    }
    
    // Return unique emails
    return [...new Set(matches)];
}

module.exports = {
    extractEmails
};
