// Import modules using require (nodeIntegration enabled)
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Import tool modules
const KeywordGenerator = require('./tools/keywordGenerator');
const PasswordChecker = require('./tools/passwordChecker');
const DuplicateRemover = require('./tools/duplicateRemover');
const EmailExtractor = require('./tools/emailExtractor');
const ListSplitter = require('./tools/listSplitter');

// Navigation
document.addEventListener('DOMContentLoaded', () => {
    setupWindowControls();
    setupNavigation();
    setupKeywordGenerator();
    setupPasswordChecker();
    setupDuplicateRemover();
    setupEmailExtractor();
    setupListSplitter();
});

// Window Controls
function setupWindowControls() {
    document.getElementById('minimize-btn').addEventListener('click', () => {
        ipcRenderer.send('minimize-window');
    });
    
    document.getElementById('close-btn').addEventListener('click', () => {
        ipcRenderer.send('close-window');
    });
}

function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const cards = document.querySelectorAll('.card[data-nav]');
    
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateToPage(page);
        });
    });
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const page = card.getAttribute('data-nav');
            navigateToPage(page);
        });
    });
}

function navigateToPage(pageName) {
    // Update menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        if (page.id === `${pageName}-page`) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });
}

// Keyword Generator
function setupKeywordGenerator() {
    const generateBtn = document.getElementById('kg-generate');
    
    // Configuration: chunk size for progress updates (keywords per chunk)
    const GENERATION_CHUNK_SIZE = 10000;
    
    generateBtn.addEventListener('click', async () => {
        const language = document.getElementById('kg-language').value;
        const count = parseInt(document.getElementById('kg-count').value);
        const format = document.getElementById('kg-format').value;
        const removeDuplicates = document.getElementById('kg-remove-duplicates').checked;
        
        if (count < 1 || count > 200000) {
            alert('Il numero di keywords deve essere tra 1 e 200000');
            return;
        }
        
        // Show progress
        const progressContainer = document.getElementById('kg-progress');
        const progressBar = document.getElementById('kg-progress-bar');
        const progressText = document.getElementById('kg-progress-text');
        const statsContainer = document.getElementById('kg-stats');
        
        progressContainer.style.display = 'block';
        statsContainer.style.display = 'none';
        generateBtn.disabled = true;
        
        const startTime = Date.now();
        
        // Generate keywords in chunks for real progress updates
        const chunkSize = GENERATION_CHUNK_SIZE;
        const keywords = [];
        let generated = 0;
        
        const generateChunk = () => {
            const remaining = count - generated;
            const currentChunk = Math.min(chunkSize, remaining);
            
            if (currentChunk > 0) {
                // Generate chunk
                for (let i = 0; i < currentChunk; i++) {
                    keywords.push(KeywordGenerator.generateKeyword(language));
                }
                
                generated += currentChunk;
                const progress = (generated / count) * 100;
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}%`;
                
                // Continue to next chunk
                setTimeout(generateChunk, 0);
            } else {
                // Generation complete
                completeGeneration();
            }
        };
        
        const completeGeneration = async () => {
            try {
                // Apply duplicate removal if needed
                let finalKeywords = keywords;
                if (removeDuplicates) {
                    finalKeywords = [...new Set(keywords)];
                }
                
                let content;
                let extension;
                if (format === 'csv') {
                    content = KeywordGenerator.formatAsCSV(finalKeywords);
                    extension = 'csv';
                } else {
                    content = KeywordGenerator.formatAsTXT(finalKeywords);
                    extension = 'txt';
                }
                
                progressBar.style.width = '100%';
                progressText.textContent = '100%';
                
                const endTime = Date.now();
                const timeTaken = (endTime - startTime) / 1000;
                const speed = Math.round(finalKeywords.length / timeTaken);
                const fileSize = (new Blob([content]).size / 1024).toFixed(2);
                
                // Update stats
                document.getElementById('kg-stat-count').textContent = finalKeywords.length;
                document.getElementById('kg-stat-time').textContent = `${timeTaken.toFixed(2)}s`;
                document.getElementById('kg-stat-speed').textContent = `${speed}/s`;
                document.getElementById('kg-stat-size').textContent = `${fileSize} KB`;
                
                statsContainer.style.display = 'block';
                
                // Save file
                const defaultName = `keywords_${language}_${Date.now()}.${extension}`;
                const result = await ipcRenderer.invoke('save-file', { defaultName, content });
                
                if (result.success) {
                    alert(`Keywords salvate in: ${result.path}`);
                } else {
                    alert(`Errore nel salvataggio: ${result.error}`);
                }
                generateBtn.disabled = false;
                progressContainer.style.display = 'none';
            } catch (error) {
                alert(`Errore: ${error.message}`);
                generateBtn.disabled = false;
                progressContainer.style.display = 'none';
            }
        };
        
        // Start generation
        setTimeout(generateChunk, 100);
    });
}

// Password Checker
let pcSelectedFile = null;

function setupPasswordChecker() {
    const selectBtn = document.getElementById('pc-select-file');
    const checkBtn = document.getElementById('pc-check');
    const fileName = document.getElementById('pc-file-name');
    
    selectBtn.addEventListener('click', async () => {
        const filePath = await ipcRenderer.invoke('select-file');
        if (filePath) {
            pcSelectedFile = filePath;
            fileName.textContent = filePath;
            checkBtn.disabled = false;
        }
    });
    
    checkBtn.addEventListener('click', async () => {
        if (!pcSelectedFile) return;
        
        const outputMode = document.getElementById('pc-output-mode').value;
        const progressContainer = document.getElementById('pc-progress');
        const progressBar = document.getElementById('pc-progress-bar');
        const progressText = document.getElementById('pc-progress-text');
        const statsContainer = document.getElementById('pc-stats');
        
        progressContainer.style.display = 'block';
        statsContainer.style.display = 'none';
        checkBtn.disabled = true;
        
        // Read file
        const result = await ipcRenderer.invoke('read-file', pcSelectedFile);
        if (!result.success) {
            alert(`Errore nella lettura del file: ${result.error}`);
            checkBtn.disabled = false;
            progressContainer.style.display = 'none';
            return;
        }
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }, 100);
        
        setTimeout(async () => {
            try {
                const results = PasswordChecker.parsePasswordFile(result.content);
                
                clearInterval(progressInterval);
                progressBar.style.width = '100%';
                progressText.textContent = '100%';
                
                const total = results.WEAK.length + results.MEDIUM.length + results.STRONG.length;
                
                // Update stats
                document.getElementById('pc-stat-total').textContent = total;
                document.getElementById('pc-stat-weak').textContent = results.WEAK.length;
                document.getElementById('pc-stat-medium').textContent = results.MEDIUM.length;
                document.getElementById('pc-stat-strong').textContent = results.STRONG.length;
                
                statsContainer.style.display = 'block';
                
                // Save files
                if (outputMode === 'separate') {
                    const files = [
                        { name: 'passwords_WEAK.txt', content: results.WEAK.join('\n') },
                        { name: 'passwords_MEDIUM.txt', content: results.MEDIUM.join('\n') },
                        { name: 'passwords_STRONG.txt', content: results.STRONG.join('\n') }
                    ];
                    
                    const saveResult = await ipcRenderer.invoke('save-multiple-files', files);
                    if (saveResult.success) {
                        alert(`File salvati in: ${saveResult.paths[0].substring(0, saveResult.paths[0].lastIndexOf('/'))}`);
                    } else {
                        alert(`Errore nel salvataggio: ${saveResult.error}`);
                    }
                } else {
                    const content = results.STRONG.join('\n');
                    const defaultName = 'passwords_STRONG.txt';
                    const saveResult = await ipcRenderer.invoke('save-file', { defaultName, content });
                    if (saveResult.success) {
                        alert(`File salvato in: ${saveResult.path}`);
                    } else {
                        alert(`Errore nel salvataggio: ${saveResult.error}`);
                    }
                }
                
                checkBtn.disabled = false;
                progressContainer.style.display = 'none';
            } catch (error) {
                clearInterval(progressInterval);
                alert(`Errore: ${error.message}`);
                checkBtn.disabled = false;
                progressContainer.style.display = 'none';
            }
        }, 500);
    });
}

// Duplicate Remover
let drSelectedFile = null;

function setupDuplicateRemover() {
    const selectBtn = document.getElementById('dr-select-file');
    const removeBtn = document.getElementById('dr-remove');
    const fileName = document.getElementById('dr-file-name');
    
    selectBtn.addEventListener('click', async () => {
        const filePath = await ipcRenderer.invoke('select-file');
        if (filePath) {
            drSelectedFile = filePath;
            fileName.textContent = filePath;
            removeBtn.disabled = false;
        }
    });
    
    removeBtn.addEventListener('click', async () => {
        if (!drSelectedFile) return;
        
        const progressContainer = document.getElementById('dr-progress');
        const progressBar = document.getElementById('dr-progress-bar');
        const progressText = document.getElementById('dr-progress-text');
        const statsContainer = document.getElementById('dr-stats');
        
        progressContainer.style.display = 'block';
        statsContainer.style.display = 'none';
        removeBtn.disabled = true;
        
        // Read file
        const result = await ipcRenderer.invoke('read-file', drSelectedFile);
        if (!result.success) {
            alert(`Errore nella lettura del file: ${result.error}`);
            removeBtn.disabled = false;
            progressContainer.style.display = 'none';
            return;
        }
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }, 100);
        
        setTimeout(async () => {
            try {
                const dupeResult = DuplicateRemover.removeDuplicates(result.content);
                
                clearInterval(progressInterval);
                progressBar.style.width = '100%';
                progressText.textContent = '100%';
                
                // Update stats
                document.getElementById('dr-stat-original').textContent = dupeResult.originalCount;
                document.getElementById('dr-stat-unique').textContent = dupeResult.uniqueCount;
                document.getElementById('dr-stat-removed').textContent = dupeResult.removedCount;
                
                statsContainer.style.display = 'block';
                
                // Save file
                const defaultName = 'output_no_duplicates.txt';
                const saveResult = await ipcRenderer.invoke('save-file', { 
                    defaultName, 
                    content: dupeResult.content 
                });
                
                if (saveResult.success) {
                    alert(`File salvato in: ${saveResult.path}`);
                } else {
                    alert(`Errore nel salvataggio: ${saveResult.error}`);
                }
                
                removeBtn.disabled = false;
                progressContainer.style.display = 'none';
            } catch (error) {
                clearInterval(progressInterval);
                alert(`Errore: ${error.message}`);
                removeBtn.disabled = false;
                progressContainer.style.display = 'none';
            }
        }, 500);
    });
}

// Email Extractor
let eeSelectedFile = null;

function setupEmailExtractor() {
    const sourceSelect = document.getElementById('ee-source');
    const textGroup = document.getElementById('ee-text-group');
    const fileGroup = document.getElementById('ee-file-group');
    const selectBtn = document.getElementById('ee-select-file');
    const extractBtn = document.getElementById('ee-extract');
    const fileName = document.getElementById('ee-file-name');
    
    sourceSelect.addEventListener('change', () => {
        if (sourceSelect.value === 'text') {
            textGroup.style.display = 'block';
            fileGroup.style.display = 'none';
            eeSelectedFile = null;
        } else {
            textGroup.style.display = 'none';
            fileGroup.style.display = 'block';
        }
    });
    
    selectBtn.addEventListener('click', async () => {
        const filePath = await ipcRenderer.invoke('select-file');
        if (filePath) {
            eeSelectedFile = filePath;
            fileName.textContent = filePath;
        }
    });
    
    extractBtn.addEventListener('click', async () => {
        const source = sourceSelect.value;
        let text = '';
        
        if (source === 'text') {
            text = document.getElementById('ee-text-input').value;
            if (!text.trim()) {
                alert('Inserisci del testo');
                return;
            }
        } else {
            if (!eeSelectedFile) {
                alert('Seleziona un file');
                return;
            }
            
            const result = await ipcRenderer.invoke('read-file', eeSelectedFile);
            if (!result.success) {
                alert(`Errore nella lettura del file: ${result.error}`);
                return;
            }
            text = result.content;
        }
        
        const progressContainer = document.getElementById('ee-progress');
        const progressBar = document.getElementById('ee-progress-bar');
        const progressText = document.getElementById('ee-progress-text');
        const statsContainer = document.getElementById('ee-stats');
        
        progressContainer.style.display = 'block';
        statsContainer.style.display = 'none';
        extractBtn.disabled = true;
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 90) progress = 90;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }, 100);
        
        setTimeout(async () => {
            try {
                const emails = EmailExtractor.extractEmails(text);
                
                clearInterval(progressInterval);
                progressBar.style.width = '100%';
                progressText.textContent = '100%';
                
                // Update stats
                document.getElementById('ee-stat-found').textContent = emails.length;
                document.getElementById('ee-stat-unique').textContent = emails.length;
                
                statsContainer.style.display = 'block';
                
                if (emails.length === 0) {
                    alert('Nessuna email trovata');
                    extractBtn.disabled = false;
                    progressContainer.style.display = 'none';
                    return;
                }
                
                // Save file
                const content = emails.join('\n');
                const defaultName = 'extracted_emails.txt';
                const saveResult = await ipcRenderer.invoke('save-file', { defaultName, content });
                
                if (saveResult.success) {
                    alert(`Email estratte e salvate in: ${saveResult.path}`);
                } else {
                    alert(`Errore nel salvataggio: ${saveResult.error}`);
                }
                
                extractBtn.disabled = false;
                progressContainer.style.display = 'none';
            } catch (error) {
                clearInterval(progressInterval);
                alert(`Errore: ${error.message}`);
                extractBtn.disabled = false;
                progressContainer.style.display = 'none';
            }
        }, 500);
    });
}

// List Splitter
let lsSelectedFile = null;

function setupListSplitter() {
    const selectBtn = document.getElementById('ls-select-file');
    const splitBtn = document.getElementById('ls-split');
    const fileName = document.getElementById('ls-file-name');
    const splitMode = document.getElementById('ls-split-mode');
    const partsGroup = document.getElementById('ls-parts-group');
    const linesGroup = document.getElementById('ls-lines-group');
    
    splitMode.addEventListener('change', () => {
        if (splitMode.value === 'parts') {
            partsGroup.style.display = 'block';
            linesGroup.style.display = 'none';
        } else {
            partsGroup.style.display = 'none';
            linesGroup.style.display = 'block';
        }
    });
    
    selectBtn.addEventListener('click', async () => {
        const filePath = await ipcRenderer.invoke('select-file');
        if (filePath) {
            lsSelectedFile = filePath;
            fileName.textContent = filePath;
            splitBtn.disabled = false;
        }
    });
    
    splitBtn.addEventListener('click', async () => {
        if (!lsSelectedFile) return;
        
        const mode = splitMode.value;
        const parts = parseInt(document.getElementById('ls-parts').value);
        const linesPerFile = parseInt(document.getElementById('ls-lines').value);
        
        if (mode === 'parts' && (parts < 2 || parts > 100)) {
            alert('Il numero di parti deve essere tra 2 e 100');
            return;
        }
        
        if (mode === 'lines' && linesPerFile < 1) {
            alert('Il numero di righe deve essere almeno 1');
            return;
        }
        
        const progressContainer = document.getElementById('ls-progress');
        const progressBar = document.getElementById('ls-progress-bar');
        const progressText = document.getElementById('ls-progress-text');
        const statsContainer = document.getElementById('ls-stats');
        
        progressContainer.style.display = 'block';
        statsContainer.style.display = 'none';
        splitBtn.disabled = true;
        
        // Read file
        const result = await ipcRenderer.invoke('read-file', lsSelectedFile);
        if (!result.success) {
            alert(`Errore nella lettura del file: ${result.error}`);
            splitBtn.disabled = false;
            progressContainer.style.display = 'none';
            return;
        }
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }, 100);
        
        setTimeout(async () => {
            try {
                let splitParts;
                if (mode === 'parts') {
                    splitParts = ListSplitter.splitByParts(result.content, parts);
                } else {
                    splitParts = ListSplitter.splitByLines(result.content, linesPerFile);
                }
                
                clearInterval(progressInterval);
                progressBar.style.width = '100%';
                progressText.textContent = '100%';
                
                const totalLines = result.content.split('\n').length;
                
                // Update stats
                document.getElementById('ls-stat-total').textContent = totalLines;
                document.getElementById('ls-stat-files').textContent = splitParts.length;
                
                statsContainer.style.display = 'block';
                
                // Prepare files
                const files = splitParts.map((content, index) => ({
                    name: `part_${index + 1}.txt`,
                    content
                }));
                
                const saveResult = await ipcRenderer.invoke('save-multiple-files', files);
                if (saveResult.success) {
                    alert(`File divisi e salvati in: ${saveResult.paths[0].substring(0, saveResult.paths[0].lastIndexOf('/'))}`);
                } else {
                    alert(`Errore nel salvataggio: ${saveResult.error}`);
                }
                
                splitBtn.disabled = false;
                progressContainer.style.display = 'none';
            } catch (error) {
                clearInterval(progressInterval);
                alert(`Errore: ${error.message}`);
                splitBtn.disabled = false;
                progressContainer.style.display = 'none';
            }
        }, 500);
    });
}
