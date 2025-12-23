# UI Design Overview - IL TOOL DI CARPANO

## Color Scheme

```
┌─────────────────────────────────────────────────────────────┐
│ Primary Gold:    #f0b90b  ████████████                      │
│ Gold Hover:      #ffc700  ████████████                      │
│ Background:      #0d0d0f  ████████████                      │
│ Secondary BG:    #1a1a1c  ████████████                      │
│ Sidebar:         #000000  ████████████                      │
│ Text Primary:    #ffffff  ████████████                      │
│ Text Secondary:  #b0b0b0  ████████████                      │
└─────────────────────────────────────────────────────────────┘
```

## Layout Structure

```
┌────────────────────────────────────────────────────────────────────┐
│  ┌────────────┐  ┌──────────────────────────────────────────────┐ │
│  │            │  │  Header                                      │ │
│  │  Sidebar   │  │  IL TOOL DI CARPANO          v1.0.0        │ │
│  │  (260px)   │  └──────────────────────────────────────────────┘ │
│  │            │                                                   │ │
│  │ ┌───┐      │  ┌──────────────────────────────────────────────┐ │
│  │ │TC │      │  │                                              │ │
│  │ └───┘      │  │  Content Area                                │ │
│  │ IL TOOL DI │  │                                              │ │
│  │ CARPANO    │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │            │  │  │  Card 1  │  │  Card 2  │  │  Card 3  │  │ │
│  │ ▶ H Home   │  │  │          │  │          │  │          │  │ │
│  │ K Keyword  │  │  └──────────┘  └──────────┘  └──────────┘  │ │
│  │ P Password │  │                                              │ │
│  │ D Duplicate│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │ E Email    │  │  │  Card 4  │  │  Card 5  │  │  Card 6  │  │ │
│  │ L List     │  │  │          │  │          │  │          │  │ │
│  │ S Settings │  │  └──────────┘  └──────────┘  └──────────┘  │ │
│  │            │  │                                              │ │
│  └────────────┘  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## Sidebar Design

```
┌─────────────────────┐
│ ┌───┐               │
│ │TC │ IL TOOL DI    │  ← Logo with gold gradient
│ └───┘ CARPANO       │     background
│       v1.0.0        │
├─────────────────────┤
│                     │
│ ▌H  Home           │  ← Active item (gold border)
│  K  Keyword Gen    │     Gold text, gold left border
│  P  Password       │
│  D  Duplicate      │  ← Hover: subtle gold background
│  E  Email          │
│  L  List Split     │
│  S  Settings       │
│                     │
└─────────────────────┘
```

## Card Design

```
┌───────────────────────────────────────┐
│▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁│ ← Gold top border on hover
│                                       │
│  Keyword Generator                    │ ← Title (white)
│                                       │
│  Genera keyword usando pattern e      │ ← Description (gray)
│  traduzioni per IT, DE, MX, TW, AT    │
│                                       │
└───────────────────────────────────────┘
  ↑ Lifts 4px on hover with shadow
```

## Form Elements

### Input Field
```
┌─────────────────────────────────────────┐
│ Placeholder text...                     │ ← Dark background
└─────────────────────────────────────────┘   Gray border
  
On Focus:
┌═════════════════════════════════════════┐
│█Focused text...                         │ ← Gold border
└═════════════════════════════════════════┘   Gold glow
```

### Button
```
┌─────────────────────┐
│  GENERA KEYWORDS    │ ← Gold gradient background
└─────────────────────┘   Black text, uppercase
  
On Hover:
┌─────────────────────┐
│  GENERA KEYWORDS    │ ← Lifts 2px
└─────────────────────┘   Shadow appears
```

### Progress Bar
```
┌────────────────────────────────────────┐
│████████████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│ ← Gold fill
└────────────────────────────────────────┘   Dark background
               67%
```

## Statistics Display

```
┌─────────────────────────────────────────────────────────┐
│ Statistiche                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Keywords │  │   Tempo  │  │ Velocità │  │  Size  │ │
│  │   GENERATE│  │          │  │          │  │        │ │
│  │          │  │          │  │          │  │        │ │
│  │  1,000   │  │  1.23s   │  │  812/s   │  │ 15 KB  │ │ ← Gold numbers
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Animations

### Page Transition
```
Frame 1: opacity: 0, translateY: 10px
         ↓
Frame 2: opacity: 0.5, translateY: 5px
         ↓
Frame 3: opacity: 1, translateY: 0px
```

### Card Hover
```
Normal:  border: 1px solid #2a2a2c
         transform: translateY(0)
         ↓
Hover:   border: 1px solid #f0b90b
         transform: translateY(-4px)
         box-shadow: 0 8px 24px rgba(240, 185, 11, 0.1)
         Top border appears (gold gradient)
```

### Button Hover
```
Normal:  transform: translateY(0)
         box-shadow: none
         ↓
Hover:   transform: translateY(-2px)
         box-shadow: 0 6px 20px rgba(240, 185, 11, 0.1)
```

## Tool Pages Layout Example

### Keyword Generator Page
```
┌─────────────────────────────────────────────────────────┐
│ Keyword Generator                                       │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ │  Lingua:       [Italiano ▼]                        │ │
│ │                                                     │ │
│ │  Numero:       [1000                ]              │ │
│ │                                                     │ │
│ │  Formato:      [TXT ▼]                             │ │
│ │                                                     │ │
│ │  ☑ Rimuovi duplicati                               │ │
│ │                                                     │ │
│ │  ┌─────────────────────────┐                       │ │
│ │  │  GENERA KEYWORDS        │                       │ │
│ │  └─────────────────────────┘                       │ │
│ │                                                     │ │
│ │  Progress: ████████████▒▒▒▒▒▒▒▒▒▒  67%            │ │
│ │                                                     │ │
│ │  ┌─────────────────────────────────────────────┐  │ │
│ │  │ Statistiche                                 │  │ │
│ │  │  Keywords: 1000  Time: 1.2s  Speed: 833/s  │  │ │
│ │  └─────────────────────────────────────────────┘  │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Responsive Behavior

- Minimum width: 1200px
- Minimum height: 700px
- Cards grid: responsive (auto-fill, minmax(300px, 1fr))
- Stats grid: responsive (auto-fit, minmax(150px, 1fr))
- Scrollable content area

## Key Design Features

1. **Professional Dark Theme** - Gold on black for elegance
2. **Clear Hierarchy** - Visual weight guides the eye
3. **Smooth Animations** - 0.3s ease transitions
4. **Hover Feedback** - Every interactive element responds
5. **Visual Progress** - Loading states and progress bars
6. **Consistent Spacing** - 8px grid system
7. **Typography** - System font stack for best rendering
8. **Accessibility** - High contrast, clear focus states
9. **No Emojis** - Professional letter-based icons
10. **Modern UI Patterns** - Cards, smooth scrolling, gradients

## Font Sizes

- Header: 24px (bold)
- Page Title: 28px (bold)
- Card Title: 18px (semibold)
- Body: 14px (regular)
- Small: 13px (regular)
- Tiny: 11-12px (regular)

## Spacing

- Container padding: 30px
- Card padding: 24px
- Form group margin: 24px
- Grid gap: 20px
- Section spacing: 30px
