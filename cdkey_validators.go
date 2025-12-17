package main

import (
	"crypto/tls"
	"fmt"
	"io/ioutil"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// ====================================
// VALIDATION FUNCTIONS
// ====================================

type Validator struct {
	Client *http.Client
}

// NewValidator creates a new validator instance
func NewValidator() *Validator {
	return &Validator{
		Client: &http.Client{
			Timeout: 15 * time.Second,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					InsecureSkipVerify: false,
				},
			},
		},
	}
}

// ====================================
// PAYPAL VALIDATION
// ====================================

func (v *Validator) validatePayPalSupport(url string) (bool, float64) {
	// Fetch the page
	resp, err := v.Client.Get(url)
	if err != nil {
		return false, 0.0
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return false, 0.0
	}
	
	html := string(body)
	confidence := 0.0
	
	// PayPal indicators
	paypalIndicators := []string{
		"paypal",
		"PayPal",
		"PAYPAL",
		"paypal.com",
		"paypal-checkout",
		"paypal-button",
		"pp-checkout",
		"data-paypal",
		"paypal-logo",
		"paypal-badge",
	}
	
	for _, indicator := range paypalIndicators {
		if strings.Contains(html, indicator) {
			confidence += 0.15
		}
	}
	
	// Check for PayPal script tags
	if strings.Contains(html, "paypal.com/sdk/js") {
		confidence += 0.3
	}
	
	// Check for PayPal meta tags
	if strings.Contains(html, `name="paypal"`) {
		confidence += 0.2
	}
	
	// Cap confidence at 1.0
	if confidence > 1.0 {
		confidence = 1.0
	}
	
	return confidence > 0.3, confidence
}

// ====================================
// INSTANT DELIVERY VALIDATION
// ====================================

func (v *Validator) validateInstantDelivery(url string) (bool, float64) {
	resp, err := v.Client.Get(url)
	if err != nil {
		return false, 0.0
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return false, 0.0
	}
	
	html := strings.ToLower(string(body))
	confidence := 0.0
	
	// Instant delivery indicators
	instantIndicators := []string{
		"instant delivery",
		"instant download",
		"immediate delivery",
		"automatic delivery",
		"instantly delivered",
		"delivered instantly",
		"instant access",
		"immediate access",
		"auto delivery",
		"digital delivery",
		"instant key",
		"instant code",
	}
	
	for _, indicator := range instantIndicators {
		if strings.Contains(html, indicator) {
			confidence += 0.2
		}
	}
	
	// Cap confidence at 1.0
	if confidence > 1.0 {
		confidence = 1.0
	}
	
	return confidence > 0.3, confidence
}

// ====================================
// DOMAIN VALIDATION
// ====================================

func (v *Validator) validateDomain(domain string) (bool, error) {
	// Check if domain is accessible
	url := "https://" + domain
	
	resp, err := v.Client.Get(url)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	
	// Check status code
	if resp.StatusCode >= 200 && resp.StatusCode < 400 {
		return true, nil
	}
	
	return false, fmt.Errorf("domain returned status code %d", resp.StatusCode)
}

// ====================================
// SSL CERTIFICATE VALIDATION
// ====================================

func (v *Validator) validateSSL(domain string) (bool, error) {
	url := "https://" + domain
	
	resp, err := v.Client.Get(url)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	
	// If we got here without error, SSL is valid
	return true, nil
}

// ====================================
// CONTENT VALIDATION
// ====================================

func (v *Validator) validateContent(url string) (bool, []string, error) {
	resp, err := v.Client.Get(url)
	if err != nil {
		return false, nil, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return false, nil, err
	}
	
	html := strings.ToLower(string(body))
	
	// Gaming/key store keywords
	keywords := []string{
		"game key",
		"cd key",
		"steam key",
		"origin key",
		"uplay key",
		"epic games",
		"game code",
		"activation code",
		"digital game",
		"pc game",
		"video game",
	}
	
	var foundKeywords []string
	
	for _, keyword := range keywords {
		if strings.Contains(html, keyword) {
			foundKeywords = append(foundKeywords, keyword)
		}
	}
	
	// Consider valid if at least 2 keywords found
	isValid := len(foundKeywords) >= 2
	
	return isValid, foundKeywords, nil
}

// ====================================
// STORE NAME EXTRACTION
// ====================================

func (v *Validator) extractStoreName(url string) (string, error) {
	resp, err := v.Client.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	
	html := string(body)
	
	// Try to extract from <title> tag
	titleRegex := regexp.MustCompile(`<title>([^<]+)</title>`)
	matches := titleRegex.FindStringSubmatch(html)
	
	if len(matches) > 1 {
		title := strings.TrimSpace(matches[1])
		// Clean up title
		title = strings.Split(title, "|")[0]
		title = strings.Split(title, "-")[0]
		title = strings.TrimSpace(title)
		return title, nil
	}
	
	// Try to extract from og:site_name
	ogNameRegex := regexp.MustCompile(`property="og:site_name" content="([^"]+)"`)
	matches = ogNameRegex.FindStringSubmatch(html)
	
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1]), nil
	}
	
	return "Unknown Store", nil
}

// ====================================
// CATEGORY DETECTION
// ====================================

func (v *Validator) detectCategory(url string) (string, error) {
	resp, err := v.Client.Get(url)
	if err != nil {
		return "unknown", err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "unknown", err
	}
	
	html := strings.ToLower(string(body))
	
	// Category indicators
	if strings.Contains(html, "marketplace") || strings.Contains(html, "reseller") {
		return "marketplace", nil
	}
	
	if strings.Contains(html, "official") || strings.Contains(html, "publisher") {
		return "official", nil
	}
	
	if strings.Contains(html, "bundle") || strings.Contains(html, "humble") {
		return "bundle", nil
	}
	
	if strings.Contains(html, "retailer") || strings.Contains(html, "authorized") {
		return "retailer", nil
	}
	
	return "marketplace", nil
}

// ====================================
// PRICE DETECTION
// ====================================

func (v *Validator) detectPrices(url string) ([]float64, error) {
	resp, err := v.Client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	html := string(body)
	
	// Price patterns
	pricePatterns := []string{
		`\$(\d+\.\d{2})`,
		`€(\d+\.\d{2})`,
		`£(\d+\.\d{2})`,
		`USD\s*(\d+\.\d{2})`,
		`EUR\s*(\d+\.\d{2})`,
		`GBP\s*(\d+\.\d{2})`,
	}
	
	var prices []float64
	seen := make(map[float64]bool)
	
	for _, pattern := range pricePatterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindAllStringSubmatch(html, -1)
		
		for _, match := range matches {
			if len(match) > 1 {
				var price float64
				fmt.Sscanf(match[1], "%f", &price)
				
				// Filter reasonable game prices (between $0.99 and $199.99)
				if price >= 0.99 && price <= 199.99 && !seen[price] {
					prices = append(prices, price)
					seen[price] = true
				}
			}
		}
	}
	
	return prices, nil
}

// ====================================
// TRUST SCORE CALCULATION
// ====================================

func (v *Validator) calculateTrustScore(store StoreResult) float64 {
	score := 0.0
	
	// Verified stores get higher score
	if store.Verified {
		score += 0.3
	}
	
	// PayPal support adds trust
	if store.PayPalSupport {
		score += 0.2
	}
	
	// Instant delivery adds convenience score
	if store.InstantDelivery {
		score += 0.15
	}
	
	// Known sources are more trustworthy
	if store.Source == "known_store" {
		score += 0.2
	}
	
	// Official stores are most trusted
	if store.Category == "official" {
		score += 0.15
	}
	
	// Add base confidence
	score += store.Confidence * 0.2
	
	// Cap at 1.0
	if score > 1.0 {
		score = 1.0
	}
	
	return score
}

// ====================================
// DUPLICATE DETECTION
// ====================================

func (v *Validator) isDuplicate(domain string, existing []StoreResult) bool {
	for _, store := range existing {
		if store.Domain == domain {
			return true
		}
	}
	return false
}

// ====================================
// DOMAIN SIMILARITY CHECK
// ====================================

func (v *Validator) isSimilarDomain(domain1, domain2 string) bool {
	// Remove TLD
	d1 := strings.Split(domain1, ".")[0]
	d2 := strings.Split(domain2, ".")[0]
	
	// Check if one contains the other
	if strings.Contains(d1, d2) || strings.Contains(d2, d1) {
		return true
	}
	
	// Calculate Levenshtein distance
	distance := levenshteinDistance(d1, d2)
	
	// Consider similar if distance is less than 3
	return distance < 3
}

// ====================================
// LEVENSHTEIN DISTANCE
// ====================================

func levenshteinDistance(s1, s2 string) int {
	if len(s1) == 0 {
		return len(s2)
	}
	if len(s2) == 0 {
		return len(s1)
	}
	
	matrix := make([][]int, len(s1)+1)
	for i := range matrix {
		matrix[i] = make([]int, len(s2)+1)
		matrix[i][0] = i
	}
	
	for j := range matrix[0] {
		matrix[0][j] = j
	}
	
	for i := 1; i <= len(s1); i++ {
		for j := 1; j <= len(s2); j++ {
			cost := 1
			if s1[i-1] == s2[j-1] {
				cost = 0
			}
			
			matrix[i][j] = min(
				matrix[i-1][j]+1,      // deletion
				matrix[i][j-1]+1,      // insertion
				matrix[i-1][j-1]+cost, // substitution
			)
		}
	}
	
	return matrix[len(s1)][len(s2)]
}

func min(a, b, c int) int {
	if a < b {
		if a < c {
			return a
		}
		return c
	}
	if b < c {
		return b
	}
	return c
}

// ====================================
// BLACKLIST CHECK
// ====================================

var blacklistedDomains = []string{
	"scam-site.com",
	"fake-keys.com",
	"fraud-store.com",
}

func (v *Validator) isBlacklisted(domain string) bool {
	for _, blacklisted := range blacklistedDomains {
		if domain == blacklisted {
			return true
		}
	}
	return false
}

// ====================================
// WHITELIST CHECK
// ====================================

var whitelistedDomains = []string{
	"steampowered.com",
	"humblebundle.com",
	"gog.com",
	"epicgames.com",
	"origin.com",
}

func (v *Validator) isWhitelisted(domain string) bool {
	for _, whitelisted := range whitelistedDomains {
		if domain == whitelisted {
			return true
		}
	}
	return false
}
