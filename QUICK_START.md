# 🚀 QUICK START GUIDE

## Telegram API Checker Bot - Version 2.0.0

This bot analyzes websites, captures login APIs, and generates Python account checkers.

---

## 🎯 What Does This Bot Do?

1. **Detects Login Forms** - Finds HTML and JavaScript-based forms
2. **Captures Login API** - Uses Chrome DevTools Protocol to intercept network traffic
3. **Validates Credentials** - Tests real user credentials
4. **Discovers Endpoints** - Finds additional API endpoints
5. **Generates Checker** - Creates a complete Python checker with multi-threading

---

## 📋 Requirements

- Python 3.8+
- Chrome/Chromium browser
- All dependencies from `requirements.txt`

---

## 🔧 Installation

```bash
# Clone repository
git clone https://github.com/sushuhq-glitch/exe-decompiler-pro.git
cd exe-decompiler-pro

# Install dependencies
pip install -r requirements.txt

# OR use minimal requirements (if you have issues)
pip install -r requirements-minimal.txt
```

---

## 🚀 Usage

### Start the Bot

```bash
python main.py
```

### Bot Workflow

```
1. /start                    → Show menu
2. Type "1"                  → New Project
3. Send URL (e.g., glovo.it) → Bot analyzes
4. Bot captures API          → Shows details
5. Send credentials          → email:password
6. Bot generates checker     → Sends ZIP file
```

---

## 📦 Generated Checker

The bot generates a complete Python checker with:

- ✅ **1000+ lines** of production-ready code
- ✅ **Multi-threading** (10 threads)
- ✅ **Progress bar** (tqdm)
- ✅ **Colored output** (colorama)
- ✅ **UTF-8 encoding** (fixed)
- ✅ **Export files**: hits.txt, bad.txt, errors.txt

### Using the Generated Checker

```bash
# Unzip the generated file
unzip checker_website_20251215_123456.zip

# Install dependencies
pip install -r requirements.txt

# Run the checker
python checker.py combos.txt
```

---

## 🧪 Testing

Run the test suite to verify everything works:

```bash
python test_workflow.py
```

Expected output:
```
✅ PASSED: Configuration
✅ PASSED: Components
✅ PASSED: Checker Generation
```

---

## 🔍 Example: Checking a Website

### Step 1: Start Bot
```
User: /start
Bot: 🤖 TELEGRAM API CHECKER BOT
     📋 Main Menu:
     1️⃣  New Project
     2️⃣  Help
     3️⃣  My Projects
     4️⃣  Status
     5️⃣  Settings
     💬 Type 1-5
```

### Step 2: New Project
```
User: 1
Bot: 🆕 NEW PROJECT
     Send website URL
```

### Step 3: Analyze Website
```
User: example.com
Bot: 🔍 Analyzing example.com...
     ✅ Found login page
     ✅ Found 1 form with email + password
     🚀 Executing FAKE login...
     ✅ CAPTURED LOGIN API!
     
     🔗 URL: POST https://api.example.com/auth/login
     📋 Headers: 5 headers
     📦 Payload: Captured
```

### Step 4: Provide Credentials
```
User: myemail@gmail.com:mypassword
Bot: ✅ Testing credentials...
     ✅ Login successful!
     🎫 Access token: eyJhbGc...
     
     🔍 Discovering APIs...
     ✅ GET /api/user/profile (200 OK)
     ✅ GET /api/user/orders (200 OK)
     
     🎉 Generating checker...
     📦 Checker ready!
     
     [Sends checker.zip]
```

---

## 📂 Project Structure

```
telegram-bot/
├── main.py                          # Entry point
├── bot_config.py                    # Configuration
├── requirements.txt                 # Dependencies
├── bot/
│   ├── telegram_bot.py              # Bot core
│   ├── handlers.py                  # Message handlers
│   ├── keyboards.py                 # Number menu
│   └── states.py                    # Conversation states
├── analyzer/
│   └── form_detector.py             # Form detection (516 lines)
├── interceptor/
│   └── network_interceptor.py       # Network capture (368 lines)
├── validator/
│   └── credential_validator.py      # Credential testing (379 lines)
├── discovery/
│   └── api_discovery.py             # API discovery (363 lines)
└── generator/
    └── checker_generator.py         # Checker generation (687 lines)
```

---

## ⚙️ Configuration

Edit `bot_config.py` to customize:

```python
# Bot Configuration
TELEGRAM_BOT_TOKEN = "your-bot-token"

# Browser Settings
BROWSER_HEADLESS = True
BROWSER_TIMEOUT = 30

# Fake Login Credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "TestPassword123"

# Checker Settings
CHECKER_THREADS = 10
CHECKER_TIMEOUT = 30
```

---

## 🎯 Key Features

### 1. Form Detection
- Detects HTML forms (`<form>` tags)
- Detects JavaScript forms (React, Vue, Angular)
- Finds email and password fields
- Extracts CSRF tokens

### 2. Network Interception
- Uses Chrome DevTools Protocol
- Captures API requests during fake login
- Extracts: URL, method, headers, payload
- Parses performance logs

### 3. Credential Validation
- Tests real user credentials
- Extracts access tokens
- Manages session cookies
- Handles authentication

### 4. API Discovery
- Tests common endpoint patterns
- Uses valid authentication tokens
- Discovers: profile, orders, addresses, payments
- Logs successful responses

### 5. Checker Generation
- Generates complete Python script
- Multi-threading support (10 threads)
- Progress bar with tqdm
- Colored output with colorama
- UTF-8 encoding (fixed)
- Export: hits.txt, bad.txt, errors.txt

---

## 🐛 Troubleshooting

### Bot Won't Start
```bash
# Check Python version
python --version  # Should be 3.8+

# Install dependencies
pip install -r requirements.txt

# Check bot token
# Edit bot_config.py and set TELEGRAM_BOT_TOKEN
```

### Form Detection Fails
```bash
# Install Chrome/Chromium
sudo apt-get install chromium-browser  # Linux
# Or download from https://www.google.com/chrome/

# Check webdriver
python -c "from selenium import webdriver; driver = webdriver.Chrome()"
```

### UTF-8 Encoding Errors
```bash
# All fixed in version 2.0.0!
# All file operations now use encoding='utf-8'
```

---

## 📚 Documentation

- `IMPLEMENTATION_SUMMARY_V2.md` - Complete implementation details
- `README.md` - General information
- `test_workflow.py` - Test suite
- Generated `README.md` in checker - Checker usage guide

---

## 🆘 Support

For issues or questions:

1. Check `IMPLEMENTATION_SUMMARY_V2.md` for details
2. Run `python test_workflow.py` to verify installation
3. Check logs in `checker.log` (generated checker)
4. Review error messages in the bot

---

## ✅ Success Checklist

- [ ] Python 3.8+ installed
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Chrome/Chromium browser installed
- [ ] Bot token configured in `bot_config.py`
- [ ] Bot starts without errors (`python main.py`)
- [ ] Tests pass (`python test_workflow.py`)

---

## 🎉 Quick Example

```bash
# 1. Start bot
python main.py

# 2. In Telegram:
/start
1
example.com
myemail@gmail.com:mypassword

# 3. Receive checker.zip

# 4. Use checker:
unzip checker.zip
pip install -r requirements.txt
python checker.py combos.txt
```

---

**Version:** 2.0.0  
**Last Updated:** December 15, 2025  
**Status:** ✅ Production Ready
