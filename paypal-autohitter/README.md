# 💳 PayPal Auto Hitter

Professional PayPal account checker that detects payment methods on checkout pages.

## Features

✅ **Modern GUI** - Real-time stats and progress tracking  
✅ **Multi-threaded** - 10 concurrent threads for fast checking  
✅ **Headless Chrome** - Automated browser with anti-detection  
✅ **Payment Detection** - Detects cards and payment methods on checkout  
✅ **Auto-export** - Results saved to organized files  
✅ **Thread-safe** - Safe concurrent file operations  

## Installation

### Prerequisites

- Python 3.7 or higher
- Chrome browser installed

### Setup

1. Navigate to the paypal-autohitter directory:
```bash
cd paypal-autohitter
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### 1. Prepare Your Combo File

Create a text file (e.g., `combo.txt`) with accounts in `email:password` format:

```
user1@example.com:password123
user2@example.com:mypass456
test@mail.com:secret789
```

### 2. Run the Application

```bash
python main.py
```

### 3. Configure and Start

1. Click **"Select"** to choose your combo file
2. Enter your PayPal checkout URL
3. Click **"🚀 START HITTING"**
4. Monitor progress in real-time

### 4. Check Results

Results are automatically saved in the `output/` directory:

- **`output/hits.txt`** - Accounts with payment methods ✅
- **`output/bad.txt`** - Accounts without payment methods ❌
- **`output/errors.txt`** - Accounts with errors ⚠️

## How It Works

### Payment Detection

The tool checks PayPal checkout pages for payment method indicators:

1. **Text Patterns**: "Paga con", "Pay with", "carta", "card"
2. **Card Details**: Visa, Mastercard, UniCredit, Postepay, etc.
3. **Masked Numbers**: ••••, ****, ····
4. **HTML Elements**: Payment method CSS selectors and iframes
5. **Checkout Buttons**: "Completa l'acquisto", "Complete purchase"

If **any** indicators are found → **HIT**  
If **no** indicators found → **BAD**

### Login Flow

1. Navigate to checkout URL
2. Wait for email field
3. Enter email → Click Next
4. Wait for password field
5. Enter password → Click Login
6. Wait for page load (3 seconds)
7. Detect payment methods

### Anti-Detection Measures

- Random user agents
- Disabled webdriver flag
- Disabled automation extensions
- Headless mode
- Image/CSS loading disabled for speed

## GUI Overview

```
┌────────────────────────────────────────────┐
│  💳 PAYPAL AUTO HITTER v1.0               │
├────────────────────────────────────────────┤
│  📁 Combo File                             │
│  [___________________________] [Select]    │
│  Loaded: 1,250 accounts                    │
│                                             │
│  🔗 Checkout URL                           │
│  [_____________________________________]   │
│                                             │
│  [    🚀 START HITTING    ]                │
│                                             │
│  📊 Progress                                │
│  ██████████░░░░░░░░ 50% (625/1250)         │
│                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │✅ HITS│  │❌ BAD │  │⚠️ ERR │            │
│  │  123  │  │  502  │  │   0  │            │
│  └──────┘  └──────┘  └──────┘            │
│                                             │
│  📝 Live Log                                │
│  ┌──────────────────────────────────────┐ │
│  │[12:34:56] ✅ HIT: test@mail.com      │ │
│  │[12:34:57] ❌ BAD: user@mail.com      │ │
│  │[12:34:58] ✅ HIT: acc@mail.com       │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

## Configuration

### Thread Count

Edit `MAX_THREADS` in `main.py` to adjust concurrent threads (default: 10):

```python
MAX_THREADS = 10  # Change this value
```

### Timeouts

Edit timeout values in `main.py`:

```python
DEFAULT_TIMEOUT = 15      # Overall timeout per account
LOGIN_TIMEOUT = 10        # Login operation timeout
PAGE_LOAD_TIMEOUT = 30    # Page load timeout
```

### Headless Mode

To see the browser (for debugging), modify in `main.py`:

```python
checker = PayPalChecker(headless=False)  # Shows browser
```

## Troubleshooting

### Chrome Driver Issues

If you get driver errors:

1. Make sure Chrome is installed
2. The tool will auto-download the correct driver
3. Or manually install: `pip install webdriver-manager --upgrade`

### Import Errors

If you get import errors:

```bash
pip install --upgrade selenium webdriver-manager
```

### Permission Errors

If output files can't be written:

```bash
chmod -R 755 output/
```

### Slow Performance

- Reduce thread count (e.g., 5 threads)
- Check your internet connection
- Ensure Chrome isn't running other processes

## Output Format

Each line in the output files contains:

```
email:password | Details
```

Example:
```
test@mail.com:pass123 | Payment method detected (3 indicators): paga con, carta, ••••
user@mail.com:secret | No payment method found
error@mail.com:wrong | Login failed or 2FA required
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Credentials**: Never share your combo files
2. **URLs**: Only use legitimate PayPal checkout URLs
3. **Rate Limiting**: PayPal may rate-limit or block excessive requests
4. **2FA**: Accounts with 2FA enabled will fail
5. **Legal**: Only check accounts you own or have permission to test

## Technical Details

### Architecture

- **Single File**: All code in `main.py` (2000+ lines)
- **Threading**: Queue-based task distribution
- **GUI**: Tkinter with custom styling
- **Automation**: Selenium WebDriver with Chrome
- **File I/O**: Thread-safe with locks

### Code Structure

```python
main.py
├── Section 1: Imports (~50 lines)
├── Section 2: Constants & Config (~150 lines)
├── Section 3: Data Classes (~100 lines)
├── Section 4: PayPalChecker Class (~800 lines)
├── Section 5: Worker Thread (~100 lines)
├── Section 6: GUI Class (~900 lines)
└── Section 7: Main Function (~50 lines)
```

## Performance

- **Speed**: ~5-10 seconds per account
- **Throughput**: ~6-12 accounts/minute (10 threads)
- **Efficiency**: Headless mode with disabled images/CSS

## Limitations

- Requires active internet connection
- PayPal may rate-limit requests
- 2FA-enabled accounts will fail
- Some detection may produce false negatives
- Browser automation may be detected by advanced anti-bot systems

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review the console output for errors
3. Check the log window in the GUI
4. Verify your combo file format
5. Ensure checkout URL is valid

## License

This tool is provided as-is for educational purposes only. Use responsibly and only on accounts you own or have explicit permission to test.

## Version History

- **v1.0** - Initial release with full features

## Credits

Developed with:
- Python 3
- Selenium WebDriver
- Tkinter GUI
- Chrome DevTools Protocol

---

**Made with ❤️ for security testing and account verification**
