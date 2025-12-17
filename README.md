# 👑 CrownPal Manager v3.0

**Advanced PayPal & Crown Management Tool with CD Key Store Finder**

A powerful, professional-grade tool for managing PayPal accounts, Crown stocks, and discovering CD key stores across the web.

## ✨ Features

### 🎮 Core Features
- **Crown Stock Management** - Full CRUD operations for Crown inventory
- **PayPal Valid Email Checker** - Multi-threaded email validation
- **PayPal Brute3 Checker** - Account verification with balance detection
- **Statistics Dashboard** - Real-time metrics and insights
- **Auto Restock** - Automated stock replenishment
- **Telegram Integration** - Write directly to channels
- **Stock Management** - Add, remove, import, and export operations

### 🆕 NEW: CD Key Store Finder
Revolutionary feature that searches the web using **100+ methods** to find game key stores:

#### Search Methods
- **Google Dorks** (20 methods) - Advanced Google search operators
- **Bing Search** (15 methods) - Microsoft Bing queries
- **DuckDuckGo** (10 methods) - Privacy-focused search
- **Reddit/Forums** (10 sources) - Community-driven discoveries
- **Price Comparison Sites** (10 sites) - Aggregator scraping
- **Known Store Validation** (30+ stores) - Verified marketplace checking
- **Domain Enumeration** - Pattern-based discovery
- **SSL Certificate Mining** - Certificate transparency logs
- **Web Archive Search** - Historical data mining
- **GitHub Repository Mining** - Open source discoveries
- **Social Media Mining** - Twitter, Facebook, Discord

#### Store Detection Features
- ✅ PayPal support detection
- ✅ Instant delivery verification
- ✅ Confidence scoring
- ✅ Category classification
- ✅ Trust score calculation
- ✅ Duplicate removal
- ✅ Real-time progress tracking

## 🚀 Installation

### Prerequisites
- Go 1.21 or higher

### Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/sushuhq-glitch/crownpal-manager.git
cd crownpal-manager
```

2. **Install dependencies:**
```bash
go mod download
```

3. **Build the application:**
```bash
go build -o crownpal-manager
```

4. **Run:**
```bash
./crownpal-manager
```

## 📋 Usage

### Main Menu
Upon launching, you'll see the main menu with 8 options:

```
╔════════════════════════════════════════════════════════════╗
║                      MAIN MENU                             ║
╚════════════════════════════════════════════════════════════╝

  [1] Crown Stock Management        [5] Auto Restock
  [2] PayPal Valid Email Checker    [6] Write on Channel
  [3] PayPal Brute3 Checker         [7] Remove Stock
  [4] View Statistics               [8] CD Key Store Finder [NEW]

  [0] Exit
```

### 1. Crown Stock Management
Manage your Crown inventory with full CRUD operations:
- Add individual crowns
- View entire stock
- Export stock to file
- Import stock from file

### 2. PayPal Valid Email Checker
Validate PayPal email addresses:
- Multi-threaded processing (1-100 threads)
- Real-time validation feedback
- Automatic output to valid/invalid files
- Live statistics

**Input format:** One email per line
```
user1@example.com
user2@example.com
user3@example.com
```

### 3. PayPal Brute3 Checker
Check PayPal account credentials with balance detection:
- Multi-threaded checking (1-50 threads)
- Balance detection for valid accounts
- Automatic categorization
- Progress tracking

**Input format:** email:password
```
user1@example.com:password123
user2@example.com:password456
user3@example.com:password789
```

### 4. View Statistics
View comprehensive statistics:
- Crown stock counts
- Email checker metrics
- Account checker results
- Success rates

### 5. Auto Restock
Automated stock replenishment:
- Set custom restock intervals
- Automatic file monitoring
- Real-time notifications
- Continuous operation

### 6. Write on Channel
Send messages to Telegram channels:
- Direct channel posting
- Message preview
- Instant delivery

### 7. Remove Stock
Manage Crown removals:
- Remove specific items
- Clear all stock
- Safe deletion with confirmation

### 8. CD Key Store Finder 🆕
**Most Powerful Feature** - Find CD key stores using 100+ methods:

#### How to Use:
1. Select option 8 from main menu
2. Enter target number of stores (default: 500)
3. Watch real-time progress with live stats
4. Results automatically saved to JSON

#### Live Stats Display:
```
🎮 CD Key Store Finder

🔍 Searching with 100+ methods...

 [∞] : Search Progress: 847/1000 queries
 [∞] : Stores Found: 234
 [∞] : With PayPal: 187
 [∞] : Instant Delivery: 156
 [∞] : Validated: 89
 [∞] : Speed: 42.3 queries/sec
 [∞] : Elapsed: 00:00:20
```

#### Output Format:
Results are saved in JSON format with full details:
```json
[
  {
    "url": "https://example-store.com",
    "domain": "example-store.com",
    "name": "Example Game Store",
    "paypal_support": true,
    "instant_delivery": true,
    "confidence": 0.95,
    "source": "google",
    "category": "marketplace",
    "found_at": "2024-01-15T10:30:00Z",
    "verified": true
  }
]
```

## 📁 File Structure

```
crownpal-manager/
├── main.go                  # Main program with menu (3500+ lines)
├── cdkey_finder.go         # Core search engine (1200+ lines)
├── cdkey_scrapers.go       # Web scrapers (800+ lines)
├── cdkey_validators.go     # Validation logic (600+ lines)
├── cdkey_utils.go          # Utilities (400+ lines)
├── go.mod                  # Go module definition
├── go.sum                  # Dependencies
├── README.md               # This file
├── .gitignore              # Git ignore rules
└── examples/
    ├── combos.txt          # Sample combo list
    ├── proxies.txt         # Sample proxy list
    └── tokens.txt          # Sample token list
```

## 📝 Examples

### Example: Email Checker

**Input file (emails.txt):**
```
test1@gmail.com
test2@yahoo.com
test3@outlook.com
```

**Usage:**
1. Select option 2
2. Enter filename: `emails.txt`
3. Enter threads: `10`
4. Watch real-time validation

**Output:**
- `valid_emails_1234567890.txt` - Valid emails
- `invalid_emails_1234567890.txt` - Invalid emails

### Example: Account Checker

**Input file (combos.txt):**
```
user1@example.com:password123
user2@example.com:password456
user3@example.com:password789
```

**Usage:**
1. Select option 3
2. Enter filename: `combos.txt`
3. Enter threads: `5`
4. View results with balances

**Output:**
- `valid_accounts_1234567890.txt` - Valid accounts with balances
- `invalid_accounts_1234567890.txt` - Invalid accounts

### Example: CD Key Store Finder

**Usage:**
1. Select option 8
2. Enter target: `500`
3. Wait for completion (20-60 seconds)
4. Check output file: `cdkey_stores_1234567890.json`

**Results:**
- 500+ stores found
- 400+ with PayPal support
- 350+ with instant delivery
- Categorized by type
- Confidence scores included

## 🔧 Configuration

### Proxy Support
Add proxies to `examples/proxies.txt`:
```
http://proxy1.com:8080
http://proxy2.com:8080
socks5://proxy3.com:1080
```

### Custom User Agents
Edit user agents in source files for better scraping success rates.

### Rate Limiting
Adjust rate limits in search configuration:
- Default: 15 queries/second
- Increase for faster searching (may trigger blocks)
- Decrease for stealthier operations

## ⚙️ Advanced Features

### Multi-threaded Processing
All checkers support concurrent processing:
- Email Checker: 1-100 threads
- Account Checker: 1-50 threads
- Store Finder: Up to 100 parallel workers

### Real-time Statistics
Live progress tracking for all operations:
- Query counts
- Success rates
- Speed metrics
- Time elapsed

### Intelligent Validation
Advanced validation for CD key stores:
- PayPal support detection via multiple indicators
- Instant delivery verification
- Trust score calculation
- Duplicate prevention
- Similar domain detection

### Export Options
Multiple export formats:
- JSON (structured data)
- CSV (spreadsheet compatible)
- TXT (human-readable)
- HTML (web preview)

## 🛡️ Security Features

- SSL certificate validation
- Domain blacklist checking
- Whitelist for trusted stores
- Confidence scoring system
- Verification status tracking

## 📊 Performance

### CD Key Store Finder Performance
- **Speed:** 40-60 queries/second
- **Efficiency:** 100+ concurrent workers
- **Coverage:** 100+ search methods
- **Accuracy:** 90%+ confidence scoring
- **Deduplication:** Automatic domain matching

### System Requirements
- **CPU:** Multi-core recommended
- **RAM:** 512MB minimum, 2GB+ recommended
- **Network:** Stable internet connection
- **Disk:** 100MB free space for results

## 🐛 Troubleshooting

### Common Issues

**"Too many open files" error:**
```bash
ulimit -n 4096
```

**Rate limiting errors:**
- Reduce thread count
- Add delays between requests
- Use proxy rotation

**No stores found:**
- Check internet connection
- Verify proxy configuration
- Try different search terms

**Build errors:**
```bash
go clean -cache
go mod tidy
go build
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 👥 Credits

**Created by:** CrownPal Team
**Version:** 3.0.0
**Repository:** github.com/sushuhq-glitch/crownpal-manager

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact: crownpal@example.com
- Discord: CrownPal Community

## 🔄 Updates

### Version 3.0.0 (Latest)
- ✨ NEW: CD Key Store Finder with 100+ methods
- ✨ Enhanced UI with ASCII art
- ✨ Real-time statistics
- ✨ Improved validation algorithms
- ✨ Better error handling
- ✨ Export to multiple formats

### Version 2.0.0
- PayPal Brute3 Checker
- Auto Restock feature
- Statistics dashboard

### Version 1.0.0
- Initial release
- Crown Stock Management
- PayPal Email Checker

## ⚠️ Disclaimer

This tool is for educational and legitimate business purposes only. Users are responsible for complying with all applicable laws and terms of service. The developers are not responsible for misuse of this software.

## 🌟 Star History

If you find this tool useful, please consider giving it a star on GitHub!

---

**Made with ❤️ by CrownPal Team**
