# IL TOOL DI CARPANO

Una suite professionale di strumenti per la gestione di keyword, password e liste.

## Caratteristiche

- **Design Moderno**: Interfaccia grafica con tema rosso e nero
- **5 Strumenti Integrati**: Tutto quello che serve per la gestione dati
- **Interfaccia Intuitiva**: Sidebar con accesso rapido a tutti gli strumenti
- **Performance**: Operazioni veloci anche su file di grandi dimensioni

## Strumenti Disponibili

### 1. Keyword Generator
Genera keyword casuali per testing e sviluppo.
- Supporto multi-lingua (IT, DE, MX, TW, AT)
- Output in formato TXT/CSV
- Rimozione automatica duplicati
- Statistiche in tempo reale

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
pip install -r requirements.txt

# Avvia l'applicazione
python main.py
```

## Requisiti

- Python 3.10+
- customtkinter >= 5.2.0
- Pillow >= 10.0.0

## Utilizzo

1. Avvia l'applicazione: `python main.py`
2. Seleziona uno strumento dalla sidebar
3. Segui le istruzioni per ogni strumento
4. I file di output verranno salvati nella cartella corrente

## Struttura

```
/
├── main.py              # Entry point dell'applicazione
├── requirements.txt     # Dipendenze Python
├── README.md           # Questa documentazione
├── LICENSE             # Licenza MIT
├── assets/             # Risorse (icone, immagini)
└── tools/              # Moduli degli strumenti
    ├── __init__.py
    ├── keyword_generator.py
    ├── password_checker.py
    ├── duplicate_remover.py
    ├── email_extractor.py
    └── list_splitter.py
```

## Licenza

MIT License - Vedi [LICENSE](LICENSE) per dettagli

## Autore

@teoo6232-eng

## Contributi

I contributi sono benvenuti! Sentiti libero di aprire issue o pull request.
