# Usage Guide for Telegram API Checker Bot

## Table of Contents
1. [Getting Started](#getting-started)
2. [Bot Commands](#bot-commands)
3. [Creating a Project](#creating-a-project)
4. [Analysis Process](#analysis-process)
5. [Using Generated Checkers](#using-generated-checkers)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### First Time Setup

1. Start the bot on Telegram
2. Send `/start` command
3. Select your preferred language (English/Italian)
4. Review the welcome message and features

### Understanding the Interface

The bot uses:
- 🆕 Emojis for visual clarity
- ⌨️ Inline keyboards for easy navigation
- 📊 Progress bars for real-time updates
- ✅ Status indicators for operations

## Bot Commands

### Basic Commands

- `/start` - Initialize bot and show main menu
- `/help` - Display help information
- `/myprojects` - View all your projects
- `/status` - Check current operation status
- `/cancel` - Cancel ongoing operation

### Advanced Commands

- `/settings` - Configure bot preferences
- `/stats` - View bot statistics
- `/language` - Change interface language

## Creating a Project

### Step 1: Initiate Project

1. Send `/start` or click "New Project"
2. Bot displays URL input prompt
3. Enter target website URL

**Supported URL Formats:**
- `example.com`
- `https://example.com`
- `https://www.example.com/path`

### Step 2: Automatic Analysis

Bot automatically:
1. 🔍 Finds login page
2. 📝 Analyzes forms
3. 🔐 Identifies authentication fields
4. 📡 Sets up network interceptor

**Duration:** 30-60 seconds

### Step 3: Provide Credentials

Enter valid credentials in format:
```
email:password
```

Example:
```
test@example.com:MyPassword123
```

**Security Notes:**
- Credentials are encrypted
- Used only for validation
- Automatically deleted after test
- Never saved in logs

### Step 4: API Discovery

Bot discovers:
- 👤 Profile endpoints
- 💳 Payment endpoints  
- 📦 Order endpoints
- 📍 Address endpoints
- 💰 Wallet endpoints

**Duration:** 15-30 seconds

### Step 5: Checker Generation

Bot generates:
- `checker.py` - Main checker script
- `requirements.txt` - Dependencies
- `README.md` - Documentation
- `config.json` - Configuration

**Duration:** 10-15 seconds

## Analysis Process

### What Gets Analyzed

#### Website Structure
- HTML forms
- Input fields
- Submit buttons
- Hidden fields
- CSRF tokens

#### Network Traffic
- HTTP requests
- HTTP responses
- Headers
- Cookies
- Payloads

#### API Endpoints
- Login endpoints
- Profile endpoints
- Payment endpoints
- Order endpoints
- Custom endpoints

### Analysis Results

Results include:
- Login URL
- Form structure
- Field mappings
- Authentication method
- Token types
- API endpoints list

## Using Generated Checkers

### Installation

```bash
# Extract files
unzip checker_package.zip

# Install dependencies
pip install -r requirements.txt
```

### Basic Usage

```bash
# Run with combo file
python checker.py combos.txt
```

### Advanced Usage

```bash
# Custom threads
python checker.py combos.txt --threads 20

# Custom timeout
python checker.py combos.txt --timeout 45

# Enable proxy
python checker.py combos.txt --proxy

# Combine options
python checker.py combos.txt --threads 15 --timeout 30 --proxy
```

### Combo File Format

Create `combos.txt` with one credential per line:
```
email1@example.com:password1
email2@example.com:password2
email3@example.com:password3
```

### Configuration

Edit `config.json` to customize:

```json
{
  "threads": 10,
  "timeout": 30,
  "retry_attempts": 3,
  "rate_limit_delay": 0.1,
  "use_proxy": false,
  "proxy_file": "proxies.txt"
}
```

### Output Files

Results saved in `output/` directory:

- `hits_TIMESTAMP.txt` - Valid credentials
- `bad_TIMESTAMP.txt` - Invalid credentials
- `errors_TIMESTAMP.txt` - Error logs
- `stats_TIMESTAMP.json` - Statistics

## Advanced Features

### Proxy Support

Create `proxies.txt`:
```
http://proxy1.com:8080
http://user:pass@proxy2.com:3128
socks5://proxy3.com:1080
```

Enable in config:
```json
{
  "use_proxy": true,
  "proxy_file": "proxies.txt"
}
```

### Custom Headers

Modify checker script to add headers:
```python
self.session.headers.update({
    'X-Custom-Header': 'value',
    'User-Agent': 'Custom UA'
})
```

### Rate Limiting

Adjust rate limiting:
```json
{
  "rate_limit_delay": 0.5,
  "requests_per_minute": 30
}
```

### Multi-Threading

Configure threads:
```json
{
  "threads": 20,
  "max_workers": 20
}
```

## Troubleshooting

### Common Issues

#### Bot Not Responding
- Check internet connection
- Restart bot with `/start`
- Contact support

#### Analysis Fails
- Verify URL is accessible
- Check website is online
- Try different URL format

#### Invalid Credentials Format
- Use `email:password` format
- No spaces around colon
- One combo per line

#### Checker Errors
- Install all dependencies
- Check Python version (3.8+)
- Review error logs

### Getting Help

- Send `/help` in bot
- Check documentation
- Open GitHub issue
- Contact support team

## Best Practices

### For Analysis
- Use full URLs with protocol
- Provide valid test credentials
- Wait for each step to complete
- Review results before proceeding

### For Checkers
- Start with low thread count
- Monitor for rate limiting
- Use proxies for large lists
- Save results frequently

### For Security
- Never share credentials
- Use test accounts when possible
- Respect website terms of service
- Use responsibly and ethically

## Examples

### Complete Workflow Example

```
User: /start
Bot: [Shows main menu]

User: [Clicks "New Project"]
Bot: Enter website URL

User: example.com
Bot: [Analyzes website]
Bot: Analysis complete! Found login at example.com/login
    Forms: 1, Fields: 2

User: test@example.com:password123
Bot: [Validates credentials]
Bot: Login successful! Tokens extracted: 3

Bot: [Discovers endpoints]
Bot: Discovery complete! Found 8 endpoints

Bot: [Generates checker]
Bot: Checker generated! Downloading files...

Bot: [Sends 4 files]
Bot: ✅ Complete! Your checker is ready to use.
```

### Checker Usage Example

```bash
# Create combo file
echo "user1@site.com:pass1" > combos.txt
echo "user2@site.com:pass2" >> combos.txt

# Run checker
python checker.py combos.txt

# Output:
# Loading combos from combos.txt...
# Loaded 2 combos
# Starting check with 10 threads...
# 
# [HIT] user1@site.com:pass1 | {"balance": "$50.00"}
# 
# RESULTS SUMMARY
# ✓ Hits:   1 (50.00%)
# ✗ Bad:    1 (50.00%)
# ⚠ Errors: 0 (0.00%)
```

---

**For more information, see:**
- [API Documentation](API.md)
- [Architecture Guide](ARCHITECTURE.md)
- [FAQ](FAQ.md)
