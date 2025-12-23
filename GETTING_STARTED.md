# Getting Started with IL TOOL DI CARPANO

This guide will help you get the application up and running.

## Prerequisites

- **Node.js** version 16 or higher
- **npm** (comes with Node.js)

Check your versions:
```bash
node --version
npm --version
```

## Installation

1. **Clone the repository** (if you haven't already):
```bash
git clone https://github.com/sushuhq-glitch/exe-decompiler-pro.git
cd exe-decompiler-pro
```

2. **Install dependencies**:
```bash
npm install
```

This will install Electron and all required dependencies.

## Running the Application

### Start the full application:
```bash
npm start
```

This will launch the Electron app with the complete GUI.

### Run in development mode (with DevTools):
```bash
npm run dev
```

This opens the application with the Chrome DevTools panel for debugging.

### Run the demo (command line):
```bash
node demo.js
```

This runs a command-line demo of the Keyword Generator to see it in action.

## Using the Application

### Navigation
- Use the **sidebar** on the left to navigate between tools
- Click on any tool card from the **Home** page
- Active page is highlighted in **gold**

### Tools Available

1. **Keyword Generator**
   - Select language (IT, DE, MX, TW, AT)
   - Set number of keywords (1-100,000)
   - Choose output format (TXT or CSV)
   - Toggle duplicate removal
   - Click "Genera Keywords"
   - Save the generated file

2. **Password Checker**
   - Click "Seleziona File" to choose a file with email:password format
   - Select output mode (separate files or STRONG only)
   - Click "Analizza Password"
   - Files are saved with classification

3. **Duplicate Remover**
   - Click "Seleziona File" to choose a text file
   - Click "Rimuovi Duplicati"
   - Save the cleaned file

4. **Email Extractor**
   - Choose source (text input or file)
   - Enter text or select file
   - Click "Estrai Email"
   - Save extracted emails

5. **List Splitter**
   - Click "Seleziona File" to choose a text file
   - Select split mode (by parts or by lines)
   - Set the number of parts or lines per file
   - Click "Dividi File"
   - Select folder to save split files

## Project Structure

```
exe-decompiler-pro/
├── main.js                 # Electron main process
├── preload.js              # Secure IPC bridge
├── package.json            # Dependencies and scripts
├── demo.js                 # Command-line demo
├── src/
│   ├── index.html          # Main GUI
│   ├── styles.css          # Yellow/gold & black theme
│   ├── renderer.js         # Frontend logic
│   └── tools/
│       ├── keywordGenerator.js
│       ├── passwordChecker.js
│       ├── duplicateRemover.js
│       ├── emailExtractor.js
│       └── listSplitter.js
├── README.md               # Main documentation
├── GETTING_STARTED.md      # This file
└── TEST_RESULTS.md         # Test documentation
```

## Design Theme

The application uses a professional dark theme:
- **Primary**: Gold/Yellow (#f0b90b)
- **Background**: Black (#0d0d0f) and Dark Gray (#1a1a1c)
- **Text**: White and Light Gray
- **Animations**: Smooth transitions throughout

## Keyboard Shortcuts

- **Tab**: Navigate between form fields
- **Enter**: Submit focused form (where applicable)
- **Escape**: Close dialogs

## Troubleshooting

### Application won't start
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm start
```

### File dialogs not working
Make sure you're running the application (not just opening the HTML file in a browser).

### Slow performance
The application is optimized, but very large files (100k+ lines) may take a few seconds to process.

## Development

### File watching
For development with auto-reload, you can use:
```bash
npm install -g electron-reload
```

### Building for distribution
To package the app for distribution:
```bash
npm install --save-dev electron-builder
npm run build
```

## Support

For issues or questions:
- Check the [README.md](README.md) for more details
- Open an issue on GitHub
- Contact: @teoo6232-eng

## License

MIT License - See [LICENSE](LICENSE) file for details
