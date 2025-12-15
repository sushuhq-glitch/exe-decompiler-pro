# 🤖 Telegram API Checker Bot

**Professional Telegram Bot for Automatic Website Analysis, API Discovery, and Python Checker Generation**

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

---

## 📋 Overview

This is a comprehensive Telegram bot that automatically analyzes websites, captures login APIs, extracts authentication tokens and cookies, discovers API endpoints (profile, payment, orders, etc.), and generates fully functional Python checker scripts.

### 🎯 Key Features

- ✅ **Automated Website Analysis** - Finds login pages and authentication forms automatically
- ✅ **Network Traffic Interception** - Captures all API requests and responses
- ✅ **Token & Cookie Extraction** - Extracts JWT, Bearer tokens, CSRF tokens, and session cookies
- ✅ **API Endpoint Discovery** - Automatically discovers profile, payment, order, and wallet endpoints
- ✅ **Credential Validation** - Tests and validates provided credentials
- ✅ **Python Checker Generation** - Generates production-ready Python checker scripts with:
  - Multi-threading support
  - Proxy rotation
  - Rate limiting
  - Retry logic with exponential backoff
  - Colored console output
  - Progress tracking
  - Comprehensive error handling
- ✅ **Beautiful Telegram UI** - User-friendly interface with emojis and inline keyboards
- ✅ **Multi-language Support** - Supports Italian and English
- ✅ **Database Integration** - Tracks users, projects, and generated checkers
- ✅ **Comprehensive Logging** - Detailed logging for debugging

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-repo/telegram-api-checker-bot.git
cd telegram-api-checker-bot
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Install Playwright browsers:**
```bash
playwright install chromium
```

4. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and add your bot token (already configured by default)
```

5. **Run the bot:**
```bash
python main.py
```

---

## 📖 Usage

### Bot Commands

- `/start` - Start the bot and show main menu
- `/help` - Show help and documentation
- `/myprojects` - View your projects
- `/status` - Check current status
- `/settings` - Configure bot settings
- `/stats` - View bot statistics
- `/cancel` - Cancel current operation

### Workflow

1. **Start** the bot with `/start`
2. **Select** "New Project" from the menu
3. **Enter** the website URL (e.g., `glovo.it`)
4. **Wait** for automatic analysis
5. **Provide** valid credentials (email:password)
6. **Review** discovered API endpoints
7. **Generate** Python checker
8. **Download** generated files

---

## 🏗️ Project Structure

```
telegram-api-checker-bot/
├── main.py                    # Entry point
├── requirements.txt           # Dependencies
├── setup.py                   # Setup script
├── README.md                  # This file
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
│
├── bot/                       # Telegram bot module
│   ├── telegram_bot.py        # Main bot class
│   ├── handlers.py            # Command handlers
│   ├── keyboards.py           # Inline keyboards
│   ├── messages.py            # Message templates
│   ├── states.py              # Conversation states
│   └── middleware.py          # Bot middleware
│
├── analyzer/                  # Website analysis
│   ├── website_analyzer.py    # Main analyzer
│   ├── token_analyzer.py      # Token extraction
│   ├── response_analyzer.py   # Response analysis
│   ├── form_analyzer.py       # Form detection
│   ├── header_analyzer.py     # Header analysis
│   └── dom_analyzer.py        # DOM analysis
│
├── interceptor/               # Network interception
│   ├── network_interceptor.py # Main interceptor
│   ├── browser_controller.py  # Browser control
│   ├── devtools_protocol.py   # Chrome DevTools
│   ├── selenium_interceptor.py# Selenium support
│   ├── playwright_interceptor.py # Playwright support
│   └── request_logger.py      # Request logging
│
├── discovery/                 # API discovery
│   ├── api_discovery.py       # Main discovery
│   ├── profile_discovery.py   # Profile endpoints
│   ├── payment_discovery.py   # Payment endpoints
│   ├── endpoint_patterns.py   # Common patterns
│   ├── graphql_discovery.py   # GraphQL support
│   └── rest_discovery.py      # REST API support
│
├── scanner/                   # Endpoint scanning
│   ├── endpoint_scanner.py    # Scanner
│   ├── console_injector.py    # Console injection
│   ├── api_tester.py          # API testing
│   ├── fuzzer.py              # API fuzzing
│   └── pattern_matcher.py     # Pattern matching
│
├── validator/                 # Validation
│   ├── credential_validator.py# Credential validation
│   ├── api_validator.py       # API validation
│   ├── response_validator.py  # Response validation
│   └── auth_validator.py      # Auth validation
│
├── generator/                 # Checker generation
│   ├── checker_generator.py   # Main generator
│   ├── templates.py           # Code templates
│   ├── requirements_generator.py # Requirements gen
│   ├── documentation_generator.py # Docs generation
│   └── config_generator.py    # Config generation
│
├── utils/                     # Utilities
│   ├── logger.py              # Logging system
│   ├── config.py              # Configuration
│   ├── helpers.py             # Helper functions
│   └── constants.py           # Constants
│
├── models/                    # Data models
│   ├── website.py             # Website model
│   ├── api_endpoint.py        # Endpoint model
│   ├── session.py             # Session model
│   ├── checker_config.py      # Config model
│   ├── user.py                # User model
│   └── project.py             # Project model
│
├── database/                  # Database
│   ├── db_manager.py          # Database manager
│   ├── models.py              # DB models
│   ├── migrations.py          # Migrations
│   └── queries.py             # Common queries
│
├── config/                    # Configuration
│   ├── config.yaml            # Main config
│   └── patterns.json          # API patterns
│
└── docs/                      # Documentation
    ├── API.md                 # API docs
    ├── USAGE.md               # Usage guide
    └── ARCHITECTURE.md        # Architecture
```

---

## ⚙️ Configuration

### Bot Token

The bot token is pre-configured in the code:
```
8440573724:AAGFEW0MSo2G7kPrDtvQRBi2E-bWrRiOSXU
```

You can also set it in `.env`:
```
TELEGRAM_BOT_TOKEN=your_token_here
```

### Other Settings

Edit `.env` to customize:
- Database URL
- Browser settings
- Network interception
- API discovery
- Logging levels
- Storage paths

---

## 🔒 Security

- ✅ Credentials are encrypted in memory
- ✅ Passwords are never logged
- ✅ Automatic cleanup after validation
- ✅ Secure session storage
- ✅ Input validation
- ✅ Rate limiting
- ✅ SQL injection prevention

---

## 📊 Statistics

The bot tracks:
- Total users
- Total projects
- Checkers generated
- Success rates
- Uptime

View stats with `/stats` command.

---

## 🐛 Troubleshooting

### Bot doesn't start
- Check Python version (3.8+)
- Verify all dependencies installed
- Check bot token is valid

### Analysis fails
- Verify website URL is accessible
- Check network connectivity
- Try with different website

### Generation fails
- Ensure discovered endpoints exist
- Check disk space for output files
- Review logs for errors

---

## 📝 License

MIT License - See LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📧 Support

- Telegram: [@YourSupportBot](https://t.me/YourBot)
- Email: support@example.com
- GitHub Issues: [Open an issue](https://github.com/your-repo/issues)

---

## 🙏 Acknowledgments

- python-telegram-bot team
- Selenium & Playwright teams
- BeautifulSoup team
- All contributors

---

**Made with ❤️ by Telegram API Checker Bot Team**
