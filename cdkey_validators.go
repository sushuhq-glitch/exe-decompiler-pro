package main

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// ====================================
// VALIDATION STRUCTURES
// ====================================

type ValidationResult struct {
	IsValid         bool
	PayPalSupport   bool
	InstantDelivery bool
	Confidence      float64
	Errors          []string
}

type StoreValidator struct {
	client    *http.Client
	userAgent string
}

func NewStoreValidator() *StoreValidator {
	return &StoreValidator{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
	}
}

// ====================================
// MAIN VALIDATION
// ====================================

func (v *StoreValidator) ValidateStore(url string) (*ValidationResult, error) {
	result := &ValidationResult{
		IsValid:    false,
		Confidence: 0.0,
		Errors:     make([]string, 0),
	}
	
	// Check 1: URL format
	if !v.validateURLFormat(url) {
		result.Errors = append(result.Errors, "Invalid URL format")
		return result, nil
	}
	
	// Check 2: Domain reachable
	reachable, err := v.isDomainReachable(url)
	if err != nil || !reachable {
		result.Errors = append(result.Errors, "Domain not reachable")
		return result, nil
	}
	
	// Check 3: SSL Certificate
	hasSSL := v.hasValidSSL(url)
	if hasSSL {
		result.Confidence += 0.2
	}
	
	// Check 4: PayPal support
	hasPayPal, _ := v.checkPayPalSupport(url)
	result.PayPalSupport = hasPayPal
	if hasPayPal {
		result.Confidence += 0.3
	}
	
	// Check 5: Instant delivery
	hasInstant, _ := v.checkInstantDelivery(url)
	result.InstantDelivery = hasInstant
	if hasInstant {
		result.Confidence += 0.2
	}
	
	// Check 6: Gaming keywords
	hasGamingKeywords := v.checkGamingKeywords(url)
	if hasGamingKeywords {
		result.Confidence += 0.3
	}
	
	result.IsValid = result.Confidence >= 0.5
	
	return result, nil
}

// ====================================
// URL VALIDATION
// ====================================

func (v *StoreValidator) validateURLFormat(urlStr string) bool {
	urlPattern := regexp.MustCompile(`^https?://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}`)
	return urlPattern.MatchString(urlStr)
}

func (v *StoreValidator) isDomainReachable(urlStr string) (bool, error) {
	req, err := http.NewRequest("HEAD", urlStr, nil)
	if err != nil {
		return false, err
	}
	
	req.Header.Set("User-Agent", v.userAgent)
	
	resp, err := v.client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	
	return resp.StatusCode >= 200 && resp.StatusCode < 400, nil
}

func (v *StoreValidator) hasValidSSL(urlStr string) bool {
	return strings.HasPrefix(urlStr, "https://")
}

// ====================================
// PAYPAL VALIDATION
// ====================================

func (v *StoreValidator) checkPayPalSupport(urlStr string) (bool, error) {
	req, err := http.NewRequest("GET", urlStr, nil)
	if err != nil {
		return false, err
	}
	
	req.Header.Set("User-Agent", v.userAgent)
	
	resp, err := v.client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	
	// Check response headers
	for _, values := range resp.Header {
		for _, value := range values {
			if strings.Contains(strings.ToLower(value), "paypal") {
				return true, nil
			}
		}
	}
	
	return false, nil
}

// ====================================
// INSTANT DELIVERY VALIDATION
// ====================================

func (v *StoreValidator) checkInstantDelivery(urlStr string) (bool, error) {
	req, err := http.NewRequest("GET", urlStr, nil)
	if err != nil {
		return false, err
	}
	
	req.Header.Set("User-Agent", v.userAgent)
	
	resp, err := v.client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	
	// Simple check - in production, parse HTML properly
	return true, nil
}

// ====================================
// GAMING KEYWORDS VALIDATION
// ====================================

func (v *StoreValidator) checkGamingKeywords(urlStr string) bool {
	gamingKeywords := []string{
		"game", "gaming", "steam", "key", "cd", "digital",
		"store", "shop", "market", "keys", "codes",
	}
	
	urlLower := strings.ToLower(urlStr)
	
	for _, keyword := range gamingKeywords {
		if strings.Contains(urlLower, keyword) {
			return true
		}
	}
	
	return false
}

// ====================================
// DOMAIN REPUTATION CHECK
// ====================================

func (v *StoreValidator) checkDomainReputation(domain string) float64 {
	// Mock reputation check
	// In production, check against reputation databases
	
	trustedDomains := []string{
		"g2a.com", "cdkeys.com", "kinguin.net", "humblebundle.com",
		"greenmangaming.com", "fanatical.com", "gog.com",
	}
	
	for _, trusted := range trustedDomains {
		if strings.Contains(domain, trusted) {
			return 1.0
		}
	}
	
	return 0.5
}

// ====================================
// SECURITY VALIDATION
// ====================================

func (v *StoreValidator) checkSecurityFeatures(urlStr string) map[string]bool {
	features := make(map[string]bool)
	
	features["https"] = strings.HasPrefix(urlStr, "https://")
	features["valid_cert"] = v.hasValidSSL(urlStr)
	
	return features
}

// ====================================
// PAYMENT METHODS DETECTION
// ====================================

func (v *StoreValidator) detectPaymentMethods(urlStr string) []string {
	methods := make([]string, 0)
	
	// Mock detection - in production, scrape payment page
	methods = append(methods, "PayPal", "Credit Card", "Debit Card")
	
	return methods
}

// ====================================
// STORE CATEGORY DETECTION
// ====================================

func (v *StoreValidator) detectStoreCategory(urlStr string) string {
	urlLower := strings.ToLower(urlStr)
	
	if strings.Contains(urlLower, "official") || strings.Contains(urlLower, "steam") {
		return "official"
	} else if strings.Contains(urlLower, "marketplace") || strings.Contains(urlLower, "g2a") {
		return "marketplace"
	} else if strings.Contains(urlLower, "reseller") {
		return "reseller"
	}
	
	return "unknown"
}

// ====================================
// BATCH VALIDATION
// ====================================

func (v *StoreValidator) ValidateBatch(urls []string) map[string]*ValidationResult {
	results := make(map[string]*ValidationResult)
	
	for _, url := range urls {
		result, err := v.ValidateStore(url)
		if err != nil {
			results[url] = &ValidationResult{
				IsValid: false,
				Errors:  []string{err.Error()},
			}
		} else {
			results[url] = result
		}
		
		time.Sleep(100 * time.Millisecond)
	}
	
	return results
}

// ====================================
// CONFIDENCE CALCULATOR
// ====================================

func (v *StoreValidator) calculateConfidence(factors map[string]float64) float64 {
	total := 0.0
	count := 0
	
	for _, value := range factors {
		total += value
		count++
	}
	
	if count == 0 {
		return 0.0
	}
	
	return total / float64(count)
}

// ====================================
// STORE HEALTH CHECK
// ====================================

func (v *StoreValidator) healthCheck(urlStr string) (bool, string) {
	req, err := http.NewRequest("GET", urlStr, nil)
	if err != nil {
		return false, fmt.Sprintf("Request error: %v", err)
	}
	
	req.Header.Set("User-Agent", v.userAgent)
	
	resp, err := v.client.Do(req)
	if err != nil {
		return false, fmt.Sprintf("Connection error: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Sprintf("HTTP %d", resp.StatusCode)
	}
	
	return true, "OK"
}
