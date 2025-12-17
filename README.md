# 🎮 CD Key Store Finder

**A comprehensive standalone Python tool that finds CD key stores with PayPal support and instant delivery using 100+ search methods.**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![License](https://img.shields.io/badge/license-MIT-yellow.svg)

---

## ✨ Features

- **100+ Search Methods** - Uses Google dorks, Bing, DuckDuckGo, Reddit, price comparison sites, domain enumeration, and more
- **PayPal Detection** - Advanced detection with 10+ validation methods including image detection, button detection, SDK detection
- **Instant Delivery Detection** - Scans for instant/immediate/automatic delivery keywords across the entire site
- **Multi-threaded** - 100 concurrent workers for ultra-fast searching
- **Smart Validation** - Validates each store for PayPal support, instant delivery, SSL certificate, and reputation
- **Beautiful CLI** - Colored terminal output with live progress tracking
- **Rate Limited** - Respects search engine limits to avoid bans
- **Export Results** - Saves results in TXT, JSON formats with detailed statistics

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. Clone or download this repository

2. Install dependencies:
```bash
pip install -r requirements.txt
```

### Usage

Run the tool:
```bash
python main.py
```

You'll be prompted to enter how many stores you want to find (10-500):
```
How many stores do you want to find? (10-500): 50
```

The tool will then:
1. Launch 100 concurrent workers
2. Execute 100+ different search methods
3. Find and validate CD key stores
4. Display live progress
5. Export results to files

---

## 📊 Output Files

The tool generates three files:

### 1. `cdkey_stores.txt`
Simple list of store URLs:
```
https://store1.com
https://store2.com
https://store3.com
...
```

### 2. `cdkey_stores.json`
Detailed JSON with full store information:
```json
[
  {
    "url": "https://store1.com",
    "name": "Store Name",
    "paypal_supported": true,
    "instant_delivery": true,
    "paypal_confidence": 0.85,
    "delivery_confidence": 0.90,
    "found_via": "google_dork_1",
    "validated_at": "2025-01-15T10:30:00",
    "ssl_valid": true,
    "reputation_score": 0.82
  }
]
```

### 3. `stats.json`
Search statistics:
```json
{
  "total_queries": 150,
  "stores_found": 75,
  "with_paypal": 52,
  "instant_delivery": 48,
  "validated": 50,
  "duration_seconds": 120,
  "methods_used": ["google_dork_1", "bing_query_1", "reddit_GameDeals", ...],
  "timestamp": "2025-01-15T10:32:00"
}
```

---

## 🔍 Search Methods (100+)

### Search Engines (35+ methods)
- **Google** - 20+ advanced dork queries
- **Bing** - 10+ query variations
- **DuckDuckGo** - 5+ search patterns
- **Additional** - 15+ generic searches

### Social Media & Forums (11+ methods)
- **Reddit** - 6 subreddits (r/GameDeals, r/CDKeys, r/SteamGameSwap, etc.)
- **Twitter** - 5 hashtags (#cdkeys, #gamedeals, etc.)

### Price Comparison Sites (15 methods)
- AllKeyShop.com
- CheapShark.com
- IsThereAnyDeal.com
- GG.deals
- CDKeys.com
- G2A.com
- Kinguin.net
- GreenManGaming.com
- HumbleBundle.com
- Fanatical.com
- Gamivo.com
- Eneba.com
- GamersGate.com
- Gamesplanet.com
- DLGamer.com

### Domain Enumeration (24+ methods)
Checks patterns like:
- `{word}keys.com`
- `{word}games.com`
- `{word}gaming.com`
- `buy{word}.com`
- And more...

### GitHub & APIs (4+ methods)
- Searches GitHub for store lists
- Looks for curated lists of game stores

---

## 🛡️ Validation System

Each store is validated for:

### PayPal Support (10+ detection methods)
1. ✅ Direct keyword search
2. ✅ Image detection (`<img src="*paypal*">`)
3. ✅ Button detection (PayPal buttons)
4. ✅ JavaScript SDK detection
5. ✅ Meta tag analysis
6. ✅ Payment section scanning
7. ✅ Link analysis (paypal.com links)
8. ✅ Data attributes
9. ✅ Footer detection
10. ✅ Form action inspection

### Instant Delivery Detection
- Scans for 20+ instant delivery keywords
- Checks titles, headings, and product descriptions
- Analyzes FAQ sections
- Validates delivery information

### Domain Reputation
- SSL certificate validation
- Reputation score calculation
- Security checks

---

## ⚙️ Configuration

You can modify the following in `main.py`:

### Thread Count
```python
finder = CDKeyFinder(target_count=50, threads=100)
```

### Rate Limiting
```python
self.rate_limiter = RateLimiter(max_requests_per_second=5.0)
```

### Timeout Settings
```python
self.http_client = HTTPClient(timeout=10, max_retries=2)
```

---

## 🎨 Beautiful CLI Output

The tool features a beautiful colored terminal interface:

```
 ██████╗██████╗     ██╗  ██╗███████╗██╗   ██╗
██╔════╝██╔══██╗    ██║ ██╔╝██╔════╝╚██╗ ██╔╝
██║     ██║  ██║    █████╔╝ █████╗   ╚████╔╝ 
██║     ██║  ██║    ██╔═██╗ ██╔══╝    ╚██╔╝  
╚██████╗██████╔╝    ██║  ██╗███████╗   ██║   
 ╚═════╝╚═════╝     ╚═╝  ╚═╝╚══════╝   ╚═╝   

      CD Key Store Finder v1.0
      100+ Search Methods | Ultra Fast

🔍 SEARCHING FOR CD KEY STORES...

[∞] Search Progress: 150 queries
[∞] Stores Found: 75
[∞] With PayPal: 52
[∞] Instant Delivery: 48
[∞] Validated: 50/50
[∞] Speed: 12.5 queries/sec
[∞] Elapsed: 00:02:00

██████████████████████████░░░░ 100%
```

---

## 🔧 Technical Details

### Architecture
- **Multi-threaded** - 100 worker threads process search methods concurrently
- **Thread-safe** - Uses locks and queues for safe concurrent operations
- **Rate limited** - Prevents search engine bans
- **Smart deduplication** - URL normalization prevents duplicates
- **Error handling** - Comprehensive try/except blocks on all network calls
- **Retry logic** - Exponential backoff for failed requests

### Libraries Used
- **requests** - HTTP client with session support
- **BeautifulSoup4** - HTML parsing
- **lxml** - Fast XML/HTML parser
- **threading** - Multi-threading support
- **queue** - Thread-safe queues

### Code Statistics
- **3000+ lines** of Python code
- **100+ search methods** implemented
- **10+ validation techniques** for PayPal
- **8+ validation techniques** for instant delivery

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## ⚠️ Disclaimer

This tool is for educational and research purposes only. Always respect website terms of service and robots.txt. Use responsibly and ethically.

---

## 💡 Tips

1. **Start small** - Try finding 10-20 stores first to test
2. **Be patient** - Finding 50+ stores can take 2-5 minutes
3. **Check results** - Validate the results in the JSON file
4. **Adjust threads** - Reduce threads if you experience rate limiting
5. **Review confidence scores** - Higher confidence = more reliable detection

---

## 🐛 Troubleshooting

### Rate Limiting Issues
If you get rate limited, reduce the rate in code:
```python
self.rate_limiter = RateLimiter(max_requests_per_second=2.0)
```

### SSL Certificate Errors
If you get SSL errors, the tool will continue with other stores.

### No Results Found
- Check your internet connection
- Some search engines may be blocking automated requests
- Try running again later

---

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Made with ❤️ for the gaming community**
