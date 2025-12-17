package main

import (
	"fmt"
	"io/ioutil"
	"math/rand"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// ====================================
// WEB SCRAPING FUNCTIONS
// ====================================

type Scraper struct {
	Client  *http.Client
	Headers map[string]string
	Proxies []string
}

// NewScraper creates a new scraper instance
func NewScraper() *Scraper {
	return &Scraper{
		Client: &http.Client{
			Timeout: 30 * time.Second,
		},
		Headers: map[string]string{
			"User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			"Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"Accept-Language": "en-US,en;q=0.5",
		},
	}
}

// ====================================
// GOOGLE SCRAPER
// ====================================

func (s *Scraper) scrapeGoogle(query string) ([]string, error) {
	// Encode the query for URL
	encodedQuery := strings.ReplaceAll(query, " ", "+")
	url := fmt.Sprintf("https://www.google.com/search?q=%s&num=100", encodedQuery)
	
	// Make request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	// Add headers
	for key, value := range s.Headers {
		req.Header.Set(key, value)
	}
	
	// Execute request
	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	// Read response
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	// Extract URLs from Google results
	urls := extractURLsFromHTML(string(body))
	
	return urls, nil
}

// ====================================
// BING SCRAPER
// ====================================

func (s *Scraper) scrapeBing(query string) ([]string, error) {
	encodedQuery := strings.ReplaceAll(query, " ", "+")
	url := fmt.Sprintf("https://www.bing.com/search?q=%s&count=50", encodedQuery)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	for key, value := range s.Headers {
		req.Header.Set(key, value)
	}
	
	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	urls := extractURLsFromHTML(string(body))
	
	return urls, nil
}

// ====================================
// DUCKDUCKGO SCRAPER
// ====================================

func (s *Scraper) scrapeDuckDuckGo(query string) ([]string, error) {
	encodedQuery := strings.ReplaceAll(query, " ", "+")
	url := fmt.Sprintf("https://html.duckduckgo.com/html/?q=%s", encodedQuery)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	for key, value := range s.Headers {
		req.Header.Set(key, value)
	}
	
	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	urls := extractURLsFromHTML(string(body))
	
	return urls, nil
}

// ====================================
// REDDIT SCRAPER
// ====================================

func (s *Scraper) scrapeReddit(subreddit string) ([]string, error) {
	url := fmt.Sprintf("https://www.reddit.com/%s/.json?limit=100", subreddit)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("User-Agent", "CrownPalManager/1.0")
	
	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	// Extract URLs from Reddit JSON
	urls := extractURLsFromHTML(string(body))
	
	return urls, nil
}

// ====================================
// PRICE COMPARISON SCRAPER
// ====================================

func (s *Scraper) scrapePriceComparison(site string) ([]string, error) {
	url := fmt.Sprintf("https://%s", site)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	for key, value := range s.Headers {
		req.Header.Set(key, value)
	}
	
	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	urls := extractURLsFromHTML(string(body))
	
	return urls, nil
}

// ====================================
// STEAM COMMUNITY SCRAPER
// ====================================

func (s *Scraper) scrapeSteamCommunity() ([]string, error) {
	url := "https://steamcommunity.com/discussions/forum/12/"
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	for key, value := range s.Headers {
		req.Header.Set(key, value)
	}
	
	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	urls := extractURLsFromHTML(string(body))
	
	return urls, nil
}

// ====================================
// GITHUB SCRAPER
// ====================================

func (s *Scraper) scrapeGitHub(query string) ([]string, error) {
	encodedQuery := strings.ReplaceAll(query, " ", "+")
	url := fmt.Sprintf("https://github.com/search?q=%s&type=repositories", encodedQuery)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	for key, value := range s.Headers {
		req.Header.Set(key, value)
	}
	
	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	urls := extractURLsFromHTML(string(body))
	
	return urls, nil
}

// ====================================
// WAYBACK MACHINE SCRAPER
// ====================================

func (s *Scraper) scrapeWaybackMachine(domain string) ([]string, error) {
	url := fmt.Sprintf("https://web.archive.org/cdx/search/cdx?url=%s&output=json", domain)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	urls := extractURLsFromHTML(string(body))
	
	return urls, nil
}

// ====================================
// CERTIFICATE TRANSPARENCY SCRAPER
// ====================================

func (s *Scraper) scrapeCertificateTransparency(pattern string) ([]string, error) {
	url := fmt.Sprintf("https://crt.sh/?q=%s&output=json", pattern)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	// Extract domain names from CT logs
	domains := extractDomainsFromJSON(string(body))
	
	return domains, nil
}

// ====================================
// TWITTER SCRAPER
// ====================================

func (s *Scraper) scrapeTwitter(query string) ([]string, error) {
	// Note: Twitter scraping requires API access in production
	// This is a mock implementation
	
	var urls []string
	
	// Simulate finding stores
	for i := 0; i < rand.Intn(5)+1; i++ {
		urls = append(urls, fmt.Sprintf("https://twitter-discovered-store-%d.com", rand.Intn(1000)))
	}
	
	return urls, nil
}

// ====================================
// FACEBOOK SCRAPER
// ====================================

func (s *Scraper) scrapeFacebook(query string) ([]string, error) {
	// Note: Facebook scraping requires API access in production
	// This is a mock implementation
	
	var urls []string
	
	// Simulate finding stores
	for i := 0; i < rand.Intn(5)+1; i++ {
		urls = append(urls, fmt.Sprintf("https://facebook-discovered-store-%d.com", rand.Intn(1000)))
	}
	
	return urls, nil
}

// ====================================
// DISCORD SCRAPER
// ====================================

func (s *Scraper) scrapeDiscord(query string) ([]string, error) {
	// Note: Discord scraping requires bot access in production
	// This is a mock implementation
	
	var urls []string
	
	// Simulate finding stores
	for i := 0; i < rand.Intn(5)+1; i++ {
		urls = append(urls, fmt.Sprintf("https://discord-discovered-store-%d.com", rand.Intn(1000)))
	}
	
	return urls, nil
}

// ====================================
// YOUTUBE SCRAPER
// ====================================

func (s *Scraper) scrapeYouTube(query string) ([]string, error) {
	encodedQuery := strings.ReplaceAll(query, " ", "+")
	url := fmt.Sprintf("https://www.youtube.com/results?search_query=%s", encodedQuery)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	for key, value := range s.Headers {
		req.Header.Set(key, value)
	}
	
	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	urls := extractURLsFromHTML(string(body))
	
	return urls, nil
}

// ====================================
// HELPER FUNCTIONS
// ====================================

func extractURLsFromHTML(html string) []string {
	var urls []string
	
	// Regex patterns for extracting URLs
	patterns := []string{
		`https?://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(?:/[^\s"<>]*)?`,
		`href="(https?://[^"]+)"`,
		`src="(https?://[^"]+)"`,
	}
	
	seen := make(map[string]bool)
	
	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindAllString(html, -1)
		
		for _, match := range matches {
			// Clean up the URL
			url := strings.Trim(match, `"'`)
			url = strings.ReplaceAll(url, `href=`, "")
			url = strings.ReplaceAll(url, `src=`, "")
			url = strings.Trim(url, `"'`)
			
			// Filter relevant gaming/key store URLs
			if isRelevantDomain(url) && !seen[url] {
				urls = append(urls, url)
				seen[url] = true
			}
		}
	}
	
	return urls
}

func extractDomainsFromJSON(jsonStr string) []string {
	var domains []string
	
	// Extract domain names from JSON
	re := regexp.MustCompile(`"name_value":"([^"]+)"`)
	matches := re.FindAllStringSubmatch(jsonStr, -1)
	
	seen := make(map[string]bool)
	
	for _, match := range matches {
		if len(match) > 1 {
			domain := match[1]
			if strings.Contains(domain, "game") || strings.Contains(domain, "key") || 
			   strings.Contains(domain, "cdkey") || strings.Contains(domain, "steam") {
				if !seen[domain] {
					domains = append(domains, domain)
					seen[domain] = true
				}
			}
		}
	}
	
	return domains
}

func isRelevantDomain(url string) bool {
	// Keywords that indicate a gaming/key store
	keywords := []string{
		"game", "key", "cdkey", "cd-key", "steam", "origin",
		"gaming", "gamer", "digital", "download", "store",
		"shop", "buy", "sell", "trade", "marketplace",
		"g2a", "kinguin", "eneba", "humble", "fanatical",
	}
	
	lowerURL := strings.ToLower(url)
	
	for _, keyword := range keywords {
		if strings.Contains(lowerURL, keyword) {
			return true
		}
	}
	
	return false
}

// ====================================
// RATE LIMITING
// ====================================

type RateLimiter struct {
	requests chan time.Time
	limit    int
	interval time.Duration
}

func NewRateLimiter(limit int, interval time.Duration) *RateLimiter {
	rl := &RateLimiter{
		requests: make(chan time.Time, limit),
		limit:    limit,
		interval: interval,
	}
	
	go rl.clean()
	
	return rl
}

func (rl *RateLimiter) Wait() {
	now := time.Now()
	
	// Add current request
	rl.requests <- now
	
	// Wait if necessary
	if len(rl.requests) >= rl.limit {
		time.Sleep(rl.interval)
	}
}

func (rl *RateLimiter) clean() {
	ticker := time.NewTicker(rl.interval)
	defer ticker.Stop()
	
	for range ticker.C {
		// Remove old requests
		for len(rl.requests) > 0 {
			select {
			case <-rl.requests:
			default:
				return
			}
		}
	}
}

// ====================================
// PROXY ROTATION
// ====================================

type ProxyRotator struct {
	proxies []string
	current int
}

func NewProxyRotator(proxies []string) *ProxyRotator {
	return &ProxyRotator{
		proxies: proxies,
		current: 0,
	}
}

func (pr *ProxyRotator) Next() string {
	if len(pr.proxies) == 0 {
		return ""
	}
	
	proxy := pr.proxies[pr.current]
	pr.current = (pr.current + 1) % len(pr.proxies)
	
	return proxy
}

func (pr *ProxyRotator) Random() string {
	if len(pr.proxies) == 0 {
		return ""
	}
	
	return pr.proxies[rand.Intn(len(pr.proxies))]
}
