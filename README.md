# IL TOOL DI CARPANO

Una suite professionale di strumenti per la gestione di keyword, password e liste.
Applicazione desktop moderna costruita con **Electron + Node.js**.

## Caratteristiche

- **Design Moderno**: Interfaccia grafica con tema giallo/oro (#f0b90b) e nero (#0d0d0f)
- **5 Strumenti Integrati**: Tutto quello che serve per la gestione dati
- **Interfaccia Intuitiva**: Sidebar con accesso rapido a tutti gli strumenti
- **Performance**: Operazioni veloci anche su file di grandi dimensioni
- **Cross-Platform**: Funziona su Windows, macOS e Linux

## Strumenti Disponibili

### 1. Keyword Generator
Genera keyword usando pattern e traduzioni specifiche per ogni lingua.
- Supporto multi-lingua (IT, DE, MX, TW, AT)
- Pattern di generazione ponderati
- Output in formato TXT/CSV
- Rimozione automatica duplicati
- Statistiche in tempo reale (keywords, tempo, velocità, dimensione file)

### 2. Password Strength Checker
Analizza la forza delle password in file email:password.
- Classifica password (WEAK, MEDIUM, STRONG)
- Output separato per categoria
- Statistiche dettagliate

### 3. Duplicate Remover
Rimuove righe duplicate da qualsiasi file di testo.
- Supporto per email:password e liste generiche
- Report duplicati rimossi
- Veloce anche su file enormi

### 4. Email Extractor
Estrae email valide da testo o file.
- Validazione con regex
- Output solo email uniche
- Facile da usare

### 5. List Splitter
Divide file grandi in parti più piccole.
- Split per numero di parti
- Split per numero di righe
- Nomenclatura automatica

## Installazione

```bash
# Clone il repository
git clone https://github.com/sushuhq-glitch/exe-decompiler-pro.git
cd exe-decompiler-pro

# Installa le dipendenze
npm install

# Avvia l'applicazione
npm start
```

## Requisiti

- Node.js 16+
- npm o yarn

## Utilizzo

1. Avvia l'applicazione: `npm start`
2. Seleziona uno strumento dalla sidebar
3. Segui le istruzioni per ogni strumento
4. I file di output verranno salvati dove scegli

## Struttura

```
/
├── package.json         # Configurazione npm e dipendenze
├── main.js              # Electron main process
├── preload.js           # Preload script per sicurezza
├── src/
│   ├── index.html       # GUI principale
│   ├── styles.css       # Tema giallo/oro e nero
│   ├── renderer.js      # Frontend logic
│   └── tools/           # Moduli degli strumenti
│       ├── keywordGenerator.js
│       ├── passwordChecker.js
│       ├── duplicateRemover.js
│       ├── emailExtractor.js
│       └── listSplitter.js
├── README.md           # Questa documentazione
└── LICENSE             # Licenza MIT
```

## Licenza

MIT License - Vedi [LICENSE](LICENSE) per dettagli

## Autore

@teoo6232-eng

## Contributi

I contributi sono benvenuti! Sentiti libero di aprire issue o pull request.
