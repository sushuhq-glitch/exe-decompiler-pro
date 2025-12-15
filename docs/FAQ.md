# Frequently Asked Questions (FAQ)

## General Questions

### What is Telegram API Checker Bot?
A comprehensive Telegram bot that automatically analyzes websites, discovers login APIs, extracts authentication tokens, discovers endpoints, and generates fully functional Python checker scripts.

### Is it free to use?
Yes, the bot is completely free and open source under the MIT license.

### What websites does it support?
The bot works with most modern websites that have login functionality. It supports various authentication methods including JWT, Bearer tokens, cookies, and custom auth headers.

### Is it legal to use?
The tool should only be used for authorized security testing on systems you own or have explicit permission to test. Unauthorized access to computer systems is illegal.

## Technical Questions

### What Python version is required?
Python 3.8 or higher is required.

### Can I use it on Windows?
Yes, the bot works on Windows, macOS, and Linux.

### Does it support headless mode?
Yes, browser automation can run in headless mode for better performance.

### Can I use proxies?
Yes, the bot and generated checkers support HTTP, HTTPS, and SOCKS5 proxies with rotation.

## Usage Questions

### How long does analysis take?
Typical analysis takes 1-2 minutes depending on website complexity.

### Do I need valid credentials?
Yes, you need at least one valid credential pair to validate the authentication flow.

### What if I don't have credentials?
The bot requires valid credentials to properly test and validate the authentication API. Without them, it cannot generate a working checker.

### Can I analyze multiple websites?
Yes, you can create unlimited projects and analyze different websites.

## Checker Questions

### How many threads should I use?
Start with 10 threads and adjust based on website response and rate limiting.

### Does the checker save results?
Yes, results are automatically saved to the output/ directory with timestamps.

### Can I customize the checker?
Yes, the generated code can be modified to add custom features or adjust behavior.

### What if the checker stops working?
Websites may change their APIs. Re-analyze the website to generate an updated checker.

## Troubleshooting

### Bot not responding?
- Check internet connection
- Restart with /start command
- Verify bot token is correct

### Analysis fails?
- Verify URL is accessible
- Check if website is online
- Try a different URL format

### Credentials rejected?
- Verify credentials are valid
- Check email:password format
- Ensure no extra spaces

### Generated checker has errors?
- Install all required dependencies
- Check Python version (3.8+)
- Review error logs for details

## Advanced Questions

### Can I contribute?
Yes! Check CONTRIBUTING.md for guidelines.

### Can I request features?
Yes, open an issue on GitHub with your feature request.

### Is there API documentation?
Yes, see API.md for complete API documentation.

### Can I deploy my own instance?
Yes, follow the deployment guide in the documentation.
