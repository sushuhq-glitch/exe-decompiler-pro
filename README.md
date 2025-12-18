# 🔥 ULTRA API HUNTER v3.0

**The Most Advanced API Discovery & Security Testing Tool**

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-3.0.0-orange.svg)](https://github.com/sushuhq-glitch/exe-decompiler-pro)

## ✨ Features

- 🎯 **100+ Discovery Methods** - Comprehensive API endpoint discovery
- 🔍 **Google/Bing/Shodan Dorking** - Advanced search engine exploitation
- 🕷️ **Deep Web Scraping** - Recursive crawling and analysis
- 📡 **Complete DNS Enumeration** - Full DNS record analysis
- 🔐 **Certificate Transparency Logs** - CT log parsing for subdomain discovery
- 💻 **GitHub Code Search** - Find leaked credentials and API keys
- 🌐 **OSINT Integration** - Multiple OSINT sources
- ⚡ **Multi-threaded** - Up to 50+ concurrent threads
- 📊 **Multiple Output Formats** - JSON, HTML, CSV reports
- 🛡️ **Security Testing** - Built-in vulnerability detection

## 🚀 Installation

```bash
git clone https://github.com/sushuhq-glitch/exe-decompiler-pro.git
cd exe-decompiler-pro
pip install -r requirements.txt
```

## 💡 Usage

### Basic Scan

```bash
python main.py -t example.com
```

### Full Scan with All Features

```bash
python main.py -t api.stripe.com --all
```

### With Shodan Integration

```bash
python main.py -t example.com --shodan-key YOUR_SHODAN_API_KEY
```

### Custom Output Format

```bash
python main.py -t site.com --output html
python main.py -t site.com --output csv
```

### Advanced Options

```bash
python main.py -t example.com --threads 100 --output json --all
python main.py -t example.com --no-dorking --osint
```

## 📖 Discovery Methods

### Basic Discovery (Methods 1-20)

1. **robots.txt parsing** - Extract disallowed paths
2. **sitemap.xml analysis** - Parse XML sitemaps
3. **JavaScript extraction** - Extract API URLs from JS files
4. **HTML comments** - Parse comments for API references
5. **API documentation** - Find /api/docs endpoints
6. **Common paths** - Test common API paths
7. **Version endpoints** - Discover /version endpoints
8. **GraphQL introspection** - GraphQL schema discovery
9. **Swagger/OpenAPI** - Find and parse API specs
10. **WSDL/SOAP discovery** - SOAP service detection
11. **WADL discovery** - REST API descriptions
12. **CORS testing** - Test CORS configurations
13. **Error messages** - Extract info from errors
14. **HTTP methods** - Test all HTTP methods
15. **Path traversal** - Directory traversal testing
16. **Parameter fuzzing** - Fuzz API parameters
17. **Subdomain enumeration** - Find API subdomains
18. **DNS records** - Analyze DNS records
19. **SSL certificates** - Extract SANs from certificates
20. **Wayback Machine** - Historical API discovery

### Advanced Discovery (Methods 21-40)

21. **WebSocket detection** - Find WebSocket endpoints
22. **gRPC discovery** - Discover gRPC services
23. **API key extraction** - Extract API keys from source
24. **JWT analysis** - Analyze JWT tokens
25. **Version abuse** - Test API version endpoints
26. **Rate limit detection** - Identify rate limiting
27. **Parameter pollution** - HTTP parameter pollution
28. **Auth bypass** - Authentication bypass testing
29. **Mass assignment** - Mass assignment vulnerabilities
30. **IDOR detection** - Insecure Direct Object References
31. **GraphQL batching** - GraphQL batch attacks
32. **XXE testing** - XML External Entity testing
33. **SSRF detection** - Server-Side Request Forgery
34. **NoSQL injection** - NoSQL injection testing
35. **Prototype pollution** - JavaScript prototype pollution
36. **Race conditions** - Race condition detection
37. **Cache poisoning** - HTTP cache poisoning
38. **Deserialization** - Insecure deserialization
39. **Request smuggling** - HTTP request smuggling
40. **Subdomain takeover** - Subdomain takeover detection

### Authentication Testing (Methods 41-60)

41. **OAuth endpoints** - OAuth 2.0 discovery
42. **SAML detection** - SAML endpoint detection
43. **Token types** - Token type enumeration
44. **Session management** - Session handling testing
45. **2FA bypass** - Two-factor authentication bypass
46. **Password reset** - Password reset endpoints
47. **JWT vulnerabilities** - JWT security testing
48. **Bearer tokens** - Bearer token discovery
49. **API key locations** - Test API key locations
50. **Basic auth** - Basic authentication testing
51. **Digest auth** - Digest authentication
52. **NTLM auth** - NTLM authentication
53. **Kerberos auth** - Kerberos testing
54. **Certificate auth** - Client certificate auth
55. **Mutual TLS** - mTLS detection
56. **Token refresh** - Token refresh endpoints
57. **Session fixation** - Session fixation testing
58. **Cookie security** - Cookie security analysis
59. **Authorization fuzzing** - Auth header fuzzing
60. **Token leakage** - Token leakage detection

### Security Testing (Methods 61-80)

61. **SQL injection** - SQLi vulnerability testing
62. **XSS testing** - Cross-Site Scripting
63. **Command injection** - OS command injection
64. **File upload vulns** - File upload vulnerabilities
65. **Path traversal** - Path traversal attacks
66. **XML injection** - XML injection testing
67. **LDAP injection** - LDAP injection testing
68. **Template injection** - SSTI testing
69. **Code injection** - Code injection testing
70. **Header injection** - HTTP header injection
71. **Host header poisoning** - Host header attacks
72. **Open redirects** - Open redirect detection
73. **CSRF testing** - Cross-Site Request Forgery
74. **Clickjacking** - Clickjacking detection
75. **Security headers** - Security header analysis
76. **Content-Type bypass** - Content-Type bypass
77. **Input validation** - Input validation testing
78. **Output encoding** - Output encoding testing
79. **Business logic** - Business logic flaws
80. **API abuse** - API abuse detection

### OSINT & Advanced (Methods 81-100)

81-85. **Google Dorking** - 20+ advanced Google dorks
86-88. **Bing Dorking** - Bing search exploitation
89. **Shodan Integration** - Shodan API integration
90. **Censys Integration** - Censys search
91. **Certificate Transparency** - CT log parsing
92. **GitHub Code Search** - GitHub API/credential search
93. **GitLab Search** - GitLab repository search
94. **Pastebin Scraping** - Pastebin leak detection
95. **Wayback Deep Scraping** - Deep Wayback analysis
96. **Archive.today** - Archive.today search
97. **Common Crawl** - Common Crawl index search
98. **VirusTotal DNS** - VirusTotal DNS data
99. **SecurityTrails** - SecurityTrails API
100. **AlienVault OTX** - Threat intelligence

## 🛡️ Security Features

### Automatic Filtering

The tool automatically excludes login and authentication pages:

- `/signin`, `/login`, `/auth/login`
- `/sign-in`, `/log-in`, `/authentication`
- `/authenticate`, `/register`, `/signup`
- `/logout`, `/sign-out`, `/forgot-password`

### Vulnerability Detection

Automatically detects:

- CORS misconfigurations
- Missing security headers
- Exposed API keys
- JWT vulnerabilities
- Insecure cookies
- Token leakage
- Open redirects
- CSRF vulnerabilities

## 📊 Output Formats

### JSON Report

```json
{
  "target": "example.com",
  "timestamp": "2025-12-18T02:00:00",
  "total_endpoints": 150,
  "endpoints": [
    {
      "url": "https://api.example.com/v1/users",
      "method": "GET",
      "discovered_via": "swagger_openapi",
      "vulnerabilities": ["Missing CSRF protection"]
    }
  ]
}
```

### HTML Report

Beautiful HTML reports with tables, styling, and vulnerability highlighting.

### CSV Report

Spreadsheet-compatible format for analysis and import.

## 🔧 Configuration

Create a `config.yaml` file:

```yaml
target: example.com
threads: 50
output_format: json
shodan_key: YOUR_KEY_HERE
enable_dorking: true
enable_osint: true
```

## 💻 CLI Options

```
Options:
  -t, --target TEXT          Target domain (required)
  --threads INTEGER          Number of threads (default: 50)
  --output [json|html|csv]   Output format (default: json)
  --shodan-key TEXT          Shodan API key
  --dorking / --no-dorking   Enable/disable dorking
  --osint / --no-osint       Enable/disable OSINT
  --all                      Run all 100+ methods
  -v, --verbose              Increase verbosity
  --help                     Show this message and exit
```

## 📚 Examples

### Pentest a specific target

```bash
python main.py -t api.company.com --all --output html
```

### Bug bounty reconnaissance

```bash
python main.py -t bugcrowd-target.com --shodan-key YOUR_KEY --all
```

### Quick API discovery

```bash
python main.py -t newsite.com --no-dorking --output json
```

### Security audit

```bash
python main.py -t internal-api.company.com --threads 100 --all -vv
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for educational and authorized security testing purposes only. Always obtain proper authorization before testing any systems you don't own. Unauthorized access to computer systems is illegal.

## 👤 Author

**@teoo6232-eng**

- GitHub: [@sushuhq-glitch](https://github.com/sushuhq-glitch)

## �� Acknowledgments

- The security research community
- Bug bounty hunters worldwide
- Open source contributors

---

**Made with ❤️ for the security community**

## 📞 Support

For issues, questions, or suggestions:

- Open an [issue](https://github.com/sushuhq-glitch/exe-decompiler-pro/issues)
- Submit a [pull request](https://github.com/sushuhq-glitch/exe-decompiler-pro/pulls)

## 🚀 Roadmap

- [ ] Add more OSINT sources
- [ ] Implement machine learning for endpoint prediction
- [ ] Add support for more authentication methods
- [ ] Integrate with more security tools
- [ ] Add GUI interface
- [ ] Docker containerization
- [ ] API documentation generator
- [ ] Automated exploitation modules

---

**Version:** 3.0.0  
**Last Updated:** 2025-12-18  
**Status:** Production Ready
