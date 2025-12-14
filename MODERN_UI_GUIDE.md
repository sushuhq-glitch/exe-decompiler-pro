# Modern Animated Decompiler - User Guide

## Overview

EXE Decompiler Pro has been completely redesigned with a modern, animated interface that makes reverse engineering beautiful and intuitive.

## Features

### 🎨 Modern Glassmorphism Design
- Beautiful gradient backgrounds (Discord/Spotify-inspired)
- Glass-effect panels with backdrop blur
- Smooth color transitions throughout

### ⚡ Simple One-Button Workflow

1. **Splash Screen** - Beautiful animated welcome (3 seconds)
2. **Dashboard** - Large "DECOMPILE EXE" button to start
3. **File Picker** - Drag & drop or browse for .exe files
4. **Language Selector** - Choose output: C, Python, Go, or C++
5. **Progress Screen** - Animated stages with percentage counter
6. **Success Screen** - Confetti animation with stats

### 📊 Animated Progress System

The progress screen shows:
- Real-time percentage counter (0-100%)
- Stage-by-stage indicators:
  - 📂 Loading File
  - 🔍 Parsing PE Headers
  - 📝 Loading Strings
  - ⚙️ Extracting Functions
  - 🔨 Disassembling Code
  - ✨ Decompiling to [Language]
  - 📊 Generating Reports
  - 💾 Saving to Desktop
- Estimated time remaining
- Smooth emoji animations

### 💾 Automatic Desktop Output

Files are automatically saved to:
```
Desktop/DecompiledProject_[filename]/
├── main.[ext]              # Main decompiled code
├── functions/              # Individual function files
│   ├── main.c
│   ├── sub_401050.c
│   └── ...
├── strings.txt             # Extracted strings with offsets
├── imports.txt             # Imported DLL functions
├── analysis_report.html    # Beautiful HTML report
└── README.md               # Project documentation
```

### 🌐 Multi-Language Support

Choose your preferred output language:

- **C** - Classic C pseudocode (default)
- **Python** - Pythonic syntax with proper parameter conversion
- **Go** - Go-style functions with package structure
- **C++** - C++ with namespaces and headers

### 📈 Statistics Tracking

The success screen shows:
- Total functions decompiled
- Strings extracted
- Imports analyzed
- Files generated

## Demo Mode

For testing without an actual EXE file:
1. Click "DECOMPILE EXE" on dashboard
2. Click "Use Demo File" button
3. Continue through the workflow with sample data

## Keyboard Shortcuts

- **Enter** on dashboard - Start decompiling
- **Escape** - Go back (when available)

## Technical Details

### Architecture
- React 18.2 with Framer Motion for animations
- Electron for desktop integration
- Glassmorphism CSS with backdrop-filter
- Component-based screen system

### Performance
- Lazy loading of heavy animations
- Optimized re-renders
- Smooth 60fps animations
- Efficient decompilation pipeline

### Browser Compatibility
Works in Electron (Chromium-based) with full feature support including:
- CSS backdrop-filter
- CSS gradients
- Smooth animations
- Desktop file system access

## Development

### Running in Dev Mode
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Starting Electron App
```bash
npm start
```

## Customization

### Changing Colors
Edit the gradient colors in CSS files:
- Primary: `#667eea` to `#764ba2`
- Background: `#1a1a2e` to `#0f3460`

### Adding Languages
1. Add language to `LanguageSelector.jsx`
2. Implement converter in `auto-decompiler.js`
3. Update file extensions in `getFileExtension()`

### Adjusting Progress Stages
Modify the `stages` array in `ProgressScreen.jsx`:
```javascript
const stages = [
  { name: 'Your Stage', emoji: '🎯', duration: 2000 },
  // ... more stages
];
```

## Troubleshooting

### Issue: Desktop folder not found
**Solution:** The app uses `os.homedir()` + 'Desktop'. On Linux, ensure `~/Desktop` exists.

### Issue: Animations are laggy
**Solution:** Reduce `backdrop-filter` usage or disable in `*.css` files for better performance.

### Issue: File won't load
**Solution:** Ensure file is a valid PE executable (.exe or .dll). Try demo mode first.

## Credits

Built with ❤️ using:
- React & Framer Motion
- Electron
- Modern CSS (Glassmorphism)
- PE Parser & Decompiler Core

---

**Version:** 2.0.0  
**Last Updated:** December 2024
