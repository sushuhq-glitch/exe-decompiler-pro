# 👑 CrownPal Manager

**Complete PayPal and Crown Management Solution with Advanced CD Key Store Finder**

CrownPal Manager is a powerful all-in-one tool for managing crown stock, PayPal account operations, and discovering CD key stores across the web using 100+ advanced search methods.

## ✨ Features

### 🎯 Core Features

- **Crown Stock Management** - Complete inventory control system
- **PayPal Valid Email Checker** - Bulk email validation
- **PayPal Brute3 Checker** - Advanced account checking
- **Auto Restock** - Automated inventory replenishment
- **Write on Channel** - Direct channel communication
- **Remove Stock** - Flexible stock removal system

### 🎮 NEW: CD Key Store Finder

The crown jewel of CrownPal Manager - a sophisticated web scraping and search engine that finds CD key stores using **100+ different methods**:

#### Search Methods (100+)

1. **Google Dorks (20 methods)** - Advanced Google search operators
2. **Bing Queries (15 methods)** - Microsoft Bing search API
3. **DuckDuckGo (10 methods)** - Privacy-focused search
4. **Reddit/Forums (10 sources)** - Community-sourced stores
5. **Price Comparison (10 sites)** - Aggregator scraping
6. **Known Stores (30+ domains)** - Verified store database
7. **Domain Enumeration** - Pattern-based discovery
8. **SSL Certificate Mining** - Certificate transparency logs
9. **Web Archive Search** - Historical data mining
10. **GitHub Repository Mining** - Open source intelligence
11. **Social Media Mining** - Twitter/Facebook/Discord

#### Key Capabilities

- ✅ **100+ concurrent search methods**
- ✅ **Real-time progress tracking**
- ✅ **PayPal support detection**
- ✅ **Instant delivery verification**
- ✅ **Confidence scoring**
- ✅ **Duplicate filtering**
- ✅ **Multi-format export** (JSON, TXT, CSV)
- ✅ **Live statistics dashboard**

## 🚀 Installation

### Prerequisites

- Go 1.21 or higher
- Internet connection
- (Optional) Proxy list for rate limiting

### Quick Start

```bash
# Clone the repository
git clone https://github.com/sushuhq-glitch/crownpal-manager.git
cd crownpal-manager

# Install dependencies
go mod download

# Build the application
go build -o crownpal-manager

# Run the application
./crownpal-manager
```

### Windows

```bash
go build -o crownpal-manager.exe
crownpal-manager.exe
```

### Linux/MacOS

```bash
go build -o crownpal-manager
chmod +x crownpal-manager
./crownpal-manager
```

## 📖 Usage

### Main Menu

When you run CrownPal Manager, you'll see an interactive menu:

```
╔════════════════════════════════════════════════════════════╗
║                    MAIN MENU                               ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  1. Crown Stock Management                                 ║
║  2. PayPal Valid Email Checker                             ║
║  3. PayPal Brute3 Checker                                  ║
║  4. Auto Restock                                           ║
║  5. Write on Channel                                       ║
║  6. Remove Stock                                           ║
║  7. Settings                                               ║
║  8. 🎮 CD Key Store Finder                                 ║
║                                                            ║
║  0. Exit                                                   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### CD Key Store Finder

1. Select option `8` from the main menu
2. Enter the number of stores you want to find (default: 50)
3. Watch as the tool searches using 100+ methods
4. View results with statistics and top stores
5. Export results in your preferred format

#### Example Output

```
🎮 CD Key Store Finder - Results

[✓] Search Complete! Found 87 stores

📊 Statistics:
  Total Stores: 87
  With PayPal: 72 (82.8%)
  Instant Delivery: 65 (74.7%)
  Verified: 30 (34.5%)

🏆 Top Stores:

  1. G2A
     URL: https://g2a.com
     PayPal: ✓ | Instant: ✓ | Confidence: 0.95

  2. CDKeys
     URL: https://cdkeys.com
     PayPal: ✓ | Instant: ✓ | Confidence: 0.93
```

## 📁 File Structure

```
crownpal-manager/
├── main.go                  # Main program with menu system (3500+ lines)
├── cdkey_finder.go         # CD Key search engine (1200+ lines)
├── cdkey_scrapers.go       # Web scrapers (800+ lines)
├── cdkey_validators.go     # Validation logic (600+ lines)
├── cdkey_utils.go          # Utilities (400+ lines)
├── go.mod                  # Go module definition
├── go.sum                  # Dependencies
├── README.md               # This file
├── .gitignore              # Git ignore rules
└── examples/
    ├── combos.txt          # Sample combo file
    ├── proxies.txt         # Sample proxy list
    └── tokens.txt          # Sample tokens
```

## 🔧 Configuration

### Proxy Support

Create a `proxies.txt` file in the examples directory:

```
http://proxy1.example.com:8080
http://proxy2.example.com:8080
socks5://proxy3.example.com:1080
```

### Custom Search

Modify the search parameters in `cdkey_finder.go`:

```go
config := &SearchConfig{
    TargetCount:       50,      // Number of stores to find
    MaxWorkers:        100,     // Concurrent workers
    Timeout:           30 * time.Second,
    EnableScreenshots: false,   // Enable/disable screenshots
    RateLimitPerSec:   15,      // Requests per second
}
```

## 📊 Export Formats

### JSON Export

```json
[
  {
    "url": "https://g2a.com",
    "domain": "g2a.com",
    "name": "G2A",
    "paypal_support": true,
    "instant_delivery": true,
    "confidence": 0.95,
    "source": "known_store",
    "category": "official",
    "verified": true
  }
]
```

### CSV Export

```csv
Name,URL,Domain,PayPal,Instant,Confidence,Source,Category,Verified
G2A,https://g2a.com,g2a.com,true,true,0.95,known_store,official,true
```

### TXT Export

```
CD Key Stores List
==================

1. G2A
   URL: https://g2a.com
   PayPal: true | Instant: true | Confidence: 0.95
   Source: known_store | Category: official
```

## 🛡️ Security & Ethics

**IMPORTANT DISCLAIMERS:**

- This tool is for **educational and research purposes only**
- Always respect website terms of service
- Use rate limiting to avoid overloading servers
- Never use for malicious purposes
- PayPal checking features are for legitimate account management only
- Follow all applicable laws and regulations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/sushuhq-glitch/crownpal-manager.git
cd crownpal-manager

# Install dependencies
go mod download

# Run tests
go test ./...

# Build
go build -o crownpal-manager
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Go community for excellent libraries
- Search engine APIs
- Open source intelligence community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sushuhq-glitch/crownpal-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sushuhq-glitch/crownpal-manager/discussions)

## 🔄 Version History

### v2.0.0 (Current)
- 🎮 Added CD Key Store Finder with 100+ search methods
- ✨ Real-time progress tracking
- 📊 Advanced statistics and reporting
- 💾 Multi-format export (JSON, TXT, CSV)
- 🚀 Performance improvements

### v1.0.0
- Initial release
- Crown stock management
- PayPal email checker
- Basic functionality

## 🎯 Roadmap

- [ ] Add proxy rotation support
- [ ] Implement captcha solving
- [ ] Add more search engines
- [ ] Machine learning for better store detection
- [ ] REST API interface
- [ ] Web dashboard
- [ ] Database integration
- [ ] Automated store verification

---

**Made with ❤️ by the CrownPal Team**

⭐ **Star this repository if you find it useful!** ⭐
