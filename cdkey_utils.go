package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"sort"
	"strings"
	"time"
)

// ====================================
// FILE I/O UTILITIES
// ====================================

// SaveResultsJSON saves search results to JSON file
func SaveResultsJSON(results []StoreResult, filename string) error {
	data, err := json.MarshalIndent(results, "", "  ")
	if err != nil {
		return err
	}
	
	return ioutil.WriteFile(filename, data, 0644)
}

// LoadResultsJSON loads search results from JSON file
func LoadResultsJSON(filename string) ([]StoreResult, error) {
	data, err := ioutil.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	
	var results []StoreResult
	err = json.Unmarshal(data, &results)
	if err != nil {
		return nil, err
	}
	
	return results, nil
}

// SaveResultsCSV saves search results to CSV file
func SaveResultsCSV(results []StoreResult, filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()
	
	writer := csv.NewWriter(file)
	defer writer.Flush()
	
	// Write header
	header := []string{
		"URL", "Domain", "Name", "PayPal Support", "Instant Delivery",
		"Confidence", "Source", "Category", "Verified", "Found At",
	}
	writer.Write(header)
	
	// Write data
	for _, result := range results {
		row := []string{
			result.URL,
			result.Domain,
			result.Name,
			fmt.Sprintf("%t", result.PayPalSupport),
			fmt.Sprintf("%t", result.InstantDelivery),
			fmt.Sprintf("%.2f", result.Confidence),
			result.Source,
			result.Category,
			fmt.Sprintf("%t", result.Verified),
			result.FoundAt.Format(time.RFC3339),
		}
		writer.Write(row)
	}
	
	return nil
}

// SaveResultsText saves search results to plain text file
func SaveResultsText(results []StoreResult, filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()
	
	file.WriteString("=== CD KEY STORE FINDER RESULTS ===\n\n")
	file.WriteString(fmt.Sprintf("Total Stores Found: %d\n", len(results)))
	file.WriteString(fmt.Sprintf("Generated: %s\n\n", time.Now().Format(time.RFC3339)))
	file.WriteString(strings.Repeat("=", 80) + "\n\n")
	
	for i, result := range results {
		file.WriteString(fmt.Sprintf("Store #%d\n", i+1))
		file.WriteString(fmt.Sprintf("  Name: %s\n", result.Name))
		file.WriteString(fmt.Sprintf("  URL: %s\n", result.URL))
		file.WriteString(fmt.Sprintf("  Domain: %s\n", result.Domain))
		file.WriteString(fmt.Sprintf("  PayPal Support: %t\n", result.PayPalSupport))
		file.WriteString(fmt.Sprintf("  Instant Delivery: %t\n", result.InstantDelivery))
		file.WriteString(fmt.Sprintf("  Confidence: %.2f\n", result.Confidence))
		file.WriteString(fmt.Sprintf("  Source: %s\n", result.Source))
		file.WriteString(fmt.Sprintf("  Category: %s\n", result.Category))
		file.WriteString(fmt.Sprintf("  Verified: %t\n", result.Verified))
		file.WriteString(fmt.Sprintf("  Found At: %s\n", result.FoundAt.Format(time.RFC3339)))
		file.WriteString("\n")
	}
	
	return nil
}

// ====================================
// FILTERING UTILITIES
// ====================================

// FilterByPayPal filters stores that support PayPal
func FilterByPayPal(results []StoreResult) []StoreResult {
	var filtered []StoreResult
	for _, result := range results {
		if result.PayPalSupport {
			filtered = append(filtered, result)
		}
	}
	return filtered
}

// FilterByInstantDelivery filters stores with instant delivery
func FilterByInstantDelivery(results []StoreResult) []StoreResult {
	var filtered []StoreResult
	for _, result := range results {
		if result.InstantDelivery {
			filtered = append(filtered, result)
		}
	}
	return filtered
}

// FilterByVerified filters verified stores only
func FilterByVerified(results []StoreResult) []StoreResult {
	var filtered []StoreResult
	for _, result := range results {
		if result.Verified {
			filtered = append(filtered, result)
		}
	}
	return filtered
}

// FilterByCategory filters stores by category
func FilterByCategory(results []StoreResult, category string) []StoreResult {
	var filtered []StoreResult
	for _, result := range results {
		if result.Category == category {
			filtered = append(filtered, result)
		}
	}
	return filtered
}

// FilterByConfidence filters stores with confidence above threshold
func FilterByConfidence(results []StoreResult, minConfidence float64) []StoreResult {
	var filtered []StoreResult
	for _, result := range results {
		if result.Confidence >= minConfidence {
			filtered = append(filtered, result)
		}
	}
	return filtered
}

// FilterBySource filters stores by discovery source
func FilterBySource(results []StoreResult, source string) []StoreResult {
	var filtered []StoreResult
	for _, result := range results {
		if result.Source == source {
			filtered = append(filtered, result)
		}
	}
	return filtered
}

// ====================================
// SORTING UTILITIES
// ====================================

// SortByConfidence sorts stores by confidence (descending)
func SortByConfidence(results []StoreResult) []StoreResult {
	sorted := make([]StoreResult, len(results))
	copy(sorted, results)
	
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Confidence > sorted[j].Confidence
	})
	
	return sorted
}

// SortByName sorts stores by name (alphabetically)
func SortByName(results []StoreResult) []StoreResult {
	sorted := make([]StoreResult, len(results))
	copy(sorted, results)
	
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Name < sorted[j].Name
	})
	
	return sorted
}

// SortByFoundTime sorts stores by discovery time (most recent first)
func SortByFoundTime(results []StoreResult) []StoreResult {
	sorted := make([]StoreResult, len(results))
	copy(sorted, results)
	
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].FoundAt.After(sorted[j].FoundAt)
	})
	
	return sorted
}

// ====================================
// STATISTICS UTILITIES
// ====================================

// CalculateStatistics calculates statistics for search results
func CalculateStatistics(results []StoreResult) map[string]interface{} {
	stats := make(map[string]interface{})
	
	total := len(results)
	withPayPal := 0
	withInstant := 0
	verified := 0
	
	categoryCounts := make(map[string]int)
	sourceCounts := make(map[string]int)
	
	var totalConfidence float64
	
	for _, result := range results {
		if result.PayPalSupport {
			withPayPal++
		}
		if result.InstantDelivery {
			withInstant++
		}
		if result.Verified {
			verified++
		}
		
		categoryCounts[result.Category]++
		sourceCounts[result.Source]++
		totalConfidence += result.Confidence
	}
	
	stats["total_stores"] = total
	stats["with_paypal"] = withPayPal
	stats["with_instant_delivery"] = withInstant
	stats["verified"] = verified
	stats["paypal_percentage"] = float64(withPayPal) / float64(total) * 100
	stats["instant_percentage"] = float64(withInstant) / float64(total) * 100
	stats["verified_percentage"] = float64(verified) / float64(total) * 100
	stats["average_confidence"] = totalConfidence / float64(total)
	stats["categories"] = categoryCounts
	stats["sources"] = sourceCounts
	
	return stats
}

// PrintStatistics prints statistics to console
func PrintStatistics(stats map[string]interface{}) {
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║                    SEARCH STATISTICS                       ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("  %sTotal Stores:%s %d\n", Yellow, Reset, stats["total_stores"])
	fmt.Printf("  %sPayPal Support:%s %d (%.1f%%)\n", Green, Reset, 
		stats["with_paypal"], stats["paypal_percentage"])
	fmt.Printf("  %sInstant Delivery:%s %d (%.1f%%)\n", Green, Reset, 
		stats["with_instant_delivery"], stats["instant_percentage"])
	fmt.Printf("  %sVerified:%s %d (%.1f%%)\n", Green, Reset, 
		stats["verified"], stats["verified_percentage"])
	fmt.Printf("  %sAverage Confidence:%s %.2f\n\n", Yellow, Reset, 
		stats["average_confidence"])
	
	fmt.Printf("  %sCategories:%s\n", Cyan, Reset)
	categories := stats["categories"].(map[string]int)
	for category, count := range categories {
		fmt.Printf("    - %s: %d\n", category, count)
	}
	
	fmt.Printf("\n  %sSources:%s\n", Cyan, Reset)
	sources := stats["sources"].(map[string]int)
	for source, count := range sources {
		fmt.Printf("    - %s: %d\n", source, count)
	}
	fmt.Println()
}

// ====================================
// DEDUPLICATION UTILITIES
// ====================================

// RemoveDuplicates removes duplicate stores by domain
func RemoveDuplicates(results []StoreResult) []StoreResult {
	seen := make(map[string]bool)
	var unique []StoreResult
	
	for _, result := range results {
		if !seen[result.Domain] {
			seen[result.Domain] = true
			unique = append(unique, result)
		}
	}
	
	return unique
}

// ====================================
// URL UTILITIES
// ====================================

// NormalizeURL normalizes a URL string
func NormalizeURL(urlStr string) string {
	// Remove trailing slash
	urlStr = strings.TrimSuffix(urlStr, "/")
	
	// Convert to lowercase
	urlStr = strings.ToLower(urlStr)
	
	// Ensure https://
	if !strings.HasPrefix(urlStr, "http://") && !strings.HasPrefix(urlStr, "https://") {
		urlStr = "https://" + urlStr
	}
	
	return urlStr
}

// ExtractDomain extracts domain from URL
func ExtractDomain(urlStr string) string {
	// Remove protocol
	urlStr = strings.TrimPrefix(urlStr, "https://")
	urlStr = strings.TrimPrefix(urlStr, "http://")
	
	// Remove path
	parts := strings.Split(urlStr, "/")
	domain := parts[0]
	
	// Remove www
	domain = strings.TrimPrefix(domain, "www.")
	
	return domain
}

// ====================================
// STRING UTILITIES
// ====================================

// Truncate truncates a string to a maximum length
func Truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

// CleanString removes extra whitespace and special characters
func CleanString(s string) string {
	// Remove multiple spaces
	s = strings.Join(strings.Fields(s), " ")
	
	// Trim
	s = strings.TrimSpace(s)
	
	return s
}

// ====================================
// TIME UTILITIES
// ====================================

// FormatDuration formats a duration in human-readable format
func FormatDuration(d time.Duration) string {
	h := int(d.Hours())
	m := int(d.Minutes()) % 60
	s := int(d.Seconds()) % 60
	
	if h > 0 {
		return fmt.Sprintf("%dh %dm %ds", h, m, s)
	} else if m > 0 {
		return fmt.Sprintf("%dm %ds", m, s)
	}
	return fmt.Sprintf("%ds", s)
}

// ====================================
// EXPORT UTILITIES
// ====================================

// ExportToHTML exports results to HTML file
func ExportToHTML(results []StoreResult, filename string) error {
	html := `<!DOCTYPE html>
<html>
<head>
    <title>CD Key Store Finder Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        .store { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .store-name { font-size: 18px; font-weight: bold; color: #2196F3; }
        .store-url { color: #666; margin: 5px 0; }
        .badge { display: inline-block; padding: 3px 8px; margin: 2px; border-radius: 3px; font-size: 12px; }
        .badge-paypal { background: #0070ba; color: white; }
        .badge-instant { background: #4CAF50; color: white; }
        .badge-verified { background: #FF9800; color: white; }
        .confidence { color: #666; }
    </style>
</head>
<body>
    <h1>CD Key Store Finder Results</h1>
    <p>Total Stores: ` + fmt.Sprintf("%d", len(results)) + `</p>
    <p>Generated: ` + time.Now().Format("2006-01-02 15:04:05") + `</p>
`
	
	for _, result := range results {
		html += `    <div class="store">
        <div class="store-name">` + result.Name + `</div>
        <div class="store-url"><a href="` + result.URL + `" target="_blank">` + result.URL + `</a></div>
        <div>`
		
		if result.PayPalSupport {
			html += `<span class="badge badge-paypal">PayPal</span>`
		}
		if result.InstantDelivery {
			html += `<span class="badge badge-instant">Instant Delivery</span>`
		}
		if result.Verified {
			html += `<span class="badge badge-verified">Verified</span>`
		}
		
		html += `</div>
        <div class="confidence">Confidence: ` + fmt.Sprintf("%.0f%%", result.Confidence*100) + ` | Category: ` + result.Category + ` | Source: ` + result.Source + `</div>
    </div>
`
	}
	
	html += `</body>
</html>`
	
	return ioutil.WriteFile(filename, []byte(html), 0644)
}

// ====================================
// BATCH PROCESSING UTILITIES
// ====================================

// BatchProcess processes results in batches
func BatchProcess(results []StoreResult, batchSize int, processor func([]StoreResult) error) error {
	for i := 0; i < len(results); i += batchSize {
		end := i + batchSize
		if end > len(results) {
			end = len(results)
		}
		
		batch := results[i:end]
		if err := processor(batch); err != nil {
			return err
		}
	}
	
	return nil
}
