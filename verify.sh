#!/bin/bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  IL TOOL DI CARPANO - Verification Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if command -v node &> /dev/null; then
    echo "  Node.js version: $(node --version)"
else
    echo "  ✗ Node.js not found!"
    exit 1
fi

# Check npm
echo "✓ Checking npm..."
if command -v npm &> /dev/null; then
    echo "  npm version: $(npm --version)"
else
    echo "  ✗ npm not found!"
    exit 1
fi

# Check package.json
echo "✓ Checking package.json..."
if [ -f "package.json" ]; then
    echo "  package.json exists"
else
    echo "  ✗ package.json not found!"
    exit 1
fi

# Check main files
echo "✓ Checking main files..."
files=("main.js" "preload.js" "src/index.html" "src/styles.css" "src/renderer.js")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file not found!"
        exit 1
    fi
done

# Check tool modules
echo "✓ Checking tool modules..."
tools=("keywordGenerator.js" "passwordChecker.js" "duplicateRemover.js" "emailExtractor.js" "listSplitter.js")
for tool in "${tools[@]}"; do
    if [ -f "src/tools/$tool" ]; then
        echo "  ✓ src/tools/$tool"
    else
        echo "  ✗ src/tools/$tool not found!"
        exit 1
    fi
done

# Check JavaScript syntax
echo "✓ Checking JavaScript syntax..."
for file in main.js preload.js src/renderer.js src/tools/*.js; do
    if node -c "$file" 2>/dev/null; then
        echo "  ✓ $file"
    else
        echo "  ✗ Syntax error in $file"
        exit 1
    fi
done

# Check dependencies
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  node_modules directory exists"
    if [ -d "node_modules/electron" ]; then
        echo "  Electron installed"
    else
        echo "  ⚠ Electron not installed. Run: npm install"
    fi
else
    echo "  ⚠ node_modules not found. Run: npm install"
fi

# Test keyword generator
echo "✓ Testing Keyword Generator..."
if node -e "const kg = require('./src/tools/keywordGenerator'); const kw = kg.generateKeywords('IT', 10, true); console.log('  Generated', kw.length, 'keywords')"; then
    echo "  Keyword Generator works!"
else
    echo "  ✗ Keyword Generator test failed!"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ All checks passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ready to run:"
echo "  npm start     - Launch the application"
echo "  npm run dev   - Launch with DevTools"
echo "  node demo.js  - Run demo script"
echo ""
