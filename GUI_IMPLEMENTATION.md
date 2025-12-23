# IL TOOL DI CARPANO - GUI Implementation

## Overview
Complete GUI refactoring implementing an AleTweak-inspired design with RED (#e63946) and BLACK (#0d0d0f) color scheme.

## Key Features Implemented

### 1. Window Configuration (main.js)
- **Frame**: false - Custom titlebar with window controls
- **Size**: 1000x650 (matching requirements exactly)
- **Node Integration**: Enabled for direct require() usage
- **Context Isolation**: Disabled to allow renderer access to Node.js modules

### 2. Custom Titlebar
- Black background (#000000)
- Application title on the left: "IL TOOL DI CARPANO v1.0.0"
- Minimize and Close buttons on the right
- Draggable area (using -webkit-app-region)
- IPC communication for window controls

### 3. Sidebar Design (~200px width)
- Background: #141418 (slightly lighter than main)
- Logo at top with "TC" icon
- Menu items with letter-based icons (H, K, P, D, E, L, S)
- Active item highlighted in RED with animated indicator
- Hover effects with smooth transitions (0.3s ease)
- Version "1.0.0" displayed at bottom
- Rounded menu items (8px border-radius)

### 4. Card System
- Background: #1a1a2e (dark cards)
- Border radius: 12px
- Hover effect: translateY(-5px) + red shadow
- Large letter icons at top
- Title and description
- Smooth animations on all interactions

### 5. Statistics Section
- Dark card background
- Rows with icon + label + value
- Values displayed in RED
- Clean, modern layout

### 6. Color Palette
```css
--bg-primary: #0d0d0f       /* Main background */
--bg-secondary: #141418     /* Sidebar background */
--bg-card: #1a1a2e         /* Card background */
--accent-red: #e63946      /* Primary accent color */
--accent-red-hover: #ff4757 /* Hover state */
--text-primary: #ffffff     /* Primary text */
--text-secondary: #a0a0a0   /* Secondary text */
--border-color: #2a2a3a    /* Borders */
--shadow-red: rgba(230, 57, 70, 0.3) /* Shadow color */
```

### 7. Tools Functionality

All tools are fully functional with the EXACT patterns and translations specified:

#### Keyword Generator
- Languages: IT, DE, MX, TW, AT
- Uses EXACT TRANSLATIONS and PATTERNS from requirements
- Pattern weights: 30%, 30%, 20%, 15%, 5%
- Output formats: TXT, CSV
- Duplicate removal option
- Progress bar with statistics

#### Password Checker
- Input: email:password format
- Classification: WEAK, MEDIUM, STRONG
- Output modes: Separate files or STRONG only
- Real-time statistics display

#### Duplicate Remover
- Removes duplicate lines from text files
- Shows original, unique, and removed counts
- Preserves original order

#### Email Extractor
- Extracts valid email addresses
- Works from text input or file
- Shows found and unique counts

#### List Splitter
- Split by number of parts
- Split by lines per file
- Creates multiple output files

## Running the Application

```bash
npm install
npm start
```

## File Structure

```
/
├── main.js              # Electron main process with window controls
├── package.json         # Dependencies and scripts
├── src/
│   ├── index.html      # Main HTML with custom titlebar
│   ├── styles.css      # RED/BLACK theme styling
│   ├── renderer.js     # UI logic with nodeIntegration
│   └── tools/          # Tool modules
│       ├── keywordGenerator.js
│       ├── passwordChecker.js
│       ├── duplicateRemover.js
│       ├── emailExtractor.js
│       └── listSplitter.js
```

## Design Decisions

1. **Letter-based Icons**: Using simple letter icons (H, K, P, D, E, L, S) instead of emoji for a cleaner, more professional look that matches the "NO EMOJI" requirement.

2. **Node Integration**: Enabled to allow direct use of require() in renderer process, simplifying the architecture and making file operations straightforward.

3. **Custom Titlebar**: Implemented with IPC communication for minimize/close functionality, providing full control over window appearance.

4. **AleTweak-Inspired Layout**: Sidebar + content area layout with modern card-based interface, matching the reference design structure.

5. **Smooth Animations**: All interactions use 0.3s ease transitions for a polished feel.

## Testing

All tool modules have been tested and verified:
- ✅ Keyword Generator: Generates keywords with correct patterns
- ✅ Password Checker: Correctly classifies password strength
- ✅ Duplicate Remover: Removes duplicates while preserving order
- ✅ Email Extractor: Extracts valid email addresses
- ✅ List Splitter: Splits files by parts or lines

## Compatibility

- Electron 28.0.0
- Node.js 14.x or higher
- Works on Windows, macOS, and Linux
