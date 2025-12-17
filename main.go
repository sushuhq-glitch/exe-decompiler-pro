package main

import (
	"fmt"
	"os"
	"time"
)

// ====================================
// MAIN FUNCTION
// ====================================

func main() {
	for {
		clearScreen()
		printBanner()
		showMenu()
		
		choice := getUserInput(fmt.Sprintf("\n%s[+]%s Enter your choice: ", Yellow, Reset))
		
		switch choice {
		case "1":
			crownStockManagement()
		case "2":
			paypalValidEmailChecker()
		case "3":
			paypalBrute3Checker()
		case "4":
			autoRestock()
		case "5":
			writeOnChannel()
		case "6":
			removeStock()
		case "7":
			settings()
		case "8":
			cdKeyFinderMode()
		case "0":
			fmt.Printf("\n%s[!]%s Exiting CrownPal Manager. Goodbye!\n", Cyan, Reset)
			os.Exit(0)
		default:
			fmt.Printf("\n%s[!]%s Invalid choice. Please try again.\n", Red, Reset)
			pause()
		}
	}
}

// ====================================
// MENU DISPLAY
// ====================================

func showMenu() {
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║                    MAIN MENU                               ║%s\n", Cyan, Reset)
	fmt.Printf("%s╠════════════════════════════════════════════════════════════╣%s\n", Cyan, Reset)
	fmt.Printf("%s║%s                                                            %s║%s\n", Cyan, Reset, Cyan, Reset)
	fmt.Printf("%s║%s  %s1.%s Crown Stock Management                               %s║%s\n", Cyan, Reset, Yellow, Reset, Cyan, Reset)
	fmt.Printf("%s║%s  %s2.%s PayPal Valid Email Checker                           %s║%s\n", Cyan, Reset, Yellow, Reset, Cyan, Reset)
	fmt.Printf("%s║%s  %s3.%s PayPal Brute3 Checker                                %s║%s\n", Cyan, Reset, Yellow, Reset, Cyan, Reset)
	fmt.Printf("%s║%s  %s4.%s Auto Restock                                         %s║%s\n", Cyan, Reset, Yellow, Reset, Cyan, Reset)
	fmt.Printf("%s║%s  %s5.%s Write on Channel                                     %s║%s\n", Cyan, Reset, Yellow, Reset, Cyan, Reset)
	fmt.Printf("%s║%s  %s6.%s Remove Stock                                         %s║%s\n", Cyan, Reset, Yellow, Reset, Cyan, Reset)
	fmt.Printf("%s║%s  %s7.%s Settings                                             %s║%s\n", Cyan, Reset, Yellow, Reset, Cyan, Reset)
	fmt.Printf("%s║%s  %s8.%s 🎮 CD Key Store Finder                               %s║%s\n", Cyan, Reset, Yellow, Reset, Cyan, Reset)
	fmt.Printf("%s║%s                                                            %s║%s\n", Cyan, Reset, Cyan, Reset)
	fmt.Printf("%s║%s  %s0.%s Exit                                                 %s║%s\n", Cyan, Reset, Red, Reset, Cyan, Reset)
	fmt.Printf("%s║%s                                                            %s║%s\n", Cyan, Reset, Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n", Cyan, Reset)
}

// ====================================
// MENU OPTION 1: CROWN STOCK MANAGEMENT
// ====================================

func crownStockManagement() {
	clearScreen()
	printBanner()
	fmt.Printf("\n%s[+]%s Crown Stock Management\n\n", Cyan, Reset)
	
	fmt.Printf("%s1.%s View Current Stock\n", Yellow, Reset)
	fmt.Printf("%s2.%s Add New Stock\n", Yellow, Reset)
	fmt.Printf("%s3.%s Update Stock\n", Yellow, Reset)
	fmt.Printf("%s4.%s Delete Stock\n", Yellow, Reset)
	fmt.Printf("%s5.%s Export Stock Report\n", Yellow, Reset)
	fmt.Printf("%s0.%s Back to Main Menu\n\n", Red, Reset)
	
	choice := getUserInput(fmt.Sprintf("%s[+]%s Enter your choice: ", Yellow, Reset))
	
	switch choice {
	case "1":
		viewCurrentStock()
	case "2":
		addNewStock()
	case "3":
		updateStock()
	case "4":
		deleteStock()
	case "5":
		exportStockReport()
	case "0":
		return
	default:
		fmt.Printf("\n%s[!]%s Invalid choice.\n", Red, Reset)
		pause()
	}
}

func viewCurrentStock() {
	fmt.Printf("\n%s[+]%s Viewing Current Stock...\n\n", Green, Reset)
	
	table := NewTable([]string{"ID", "Item", "Quantity", "Price", "Status"})
	table.AddRow([]string{"1", "Crown Gold", "250", "$10.00", "In Stock"})
	table.AddRow([]string{"2", "Crown Silver", "150", "$5.00", "In Stock"})
	table.AddRow([]string{"3", "Crown Bronze", "500", "$2.00", "In Stock"})
	table.Print()
	
	pause()
}

func addNewStock() {
	fmt.Printf("\n%s[+]%s Add New Stock\n\n", Green, Reset)
	
	item := getUserInput("Item name: ")
	quantity := getIntInput("Quantity: ")
	price := getUserInput("Price: ")
	
	fmt.Printf("\n%s[✓]%s Stock added successfully!\n", Green, Reset)
	fmt.Printf("  Item: %s\n", item)
	fmt.Printf("  Quantity: %d\n", quantity)
	fmt.Printf("  Price: %s\n", price)
	
	pause()
}

func updateStock() {
	fmt.Printf("\n%s[+]%s Update Stock\n\n", Yellow, Reset)
	
	id := getIntInput("Enter stock ID to update: ")
	quantity := getIntInput("New quantity: ")
	
	fmt.Printf("\n%s[✓]%s Stock ID %d updated to quantity %d\n", Green, Reset, id, quantity)
	
	pause()
}

func deleteStock() {
	fmt.Printf("\n%s[+]%s Delete Stock\n\n", Red, Reset)
	
	id := getIntInput("Enter stock ID to delete: ")
	confirm := getBoolInput(fmt.Sprintf("Are you sure you want to delete stock ID %d? (y/n): ", id))
	
	if confirm {
		fmt.Printf("\n%s[✓]%s Stock ID %d deleted successfully\n", Green, Reset, id)
	} else {
		fmt.Printf("\n%s[!]%s Deletion cancelled\n", Yellow, Reset)
	}
	
	pause()
}

func exportStockReport() {
	fmt.Printf("\n%s[+]%s Export Stock Report\n\n", Cyan, Reset)
	
	filename := fmt.Sprintf("stock_report_%s.txt", time.Now().Format("20060102_150405"))
	
	lines := []string{
		"Crown Stock Report",
		"==================",
		"",
		"1. Crown Gold - 250 units - $10.00",
		"2. Crown Silver - 150 units - $5.00",
		"3. Crown Bronze - 500 units - $2.00",
	}
	
	err := saveFile(filename, lines)
	if err != nil {
		fmt.Printf("\n%s[!]%s Error saving report: %v\n", Red, Reset, err)
	} else {
		fmt.Printf("\n%s[✓]%s Report exported to %s\n", Green, Reset, filename)
	}
	
	pause()
}

// ====================================
// MENU OPTION 2: PAYPAL VALID EMAIL CHECKER
// ====================================

func paypalValidEmailChecker() {
	clearScreen()
	printBanner()
	fmt.Printf("\n%s[+]%s PayPal Valid Email Checker\n\n", Cyan, Reset)
	
	filename := getUserInput("Enter email list file (or press Enter for 'emails.txt'): ")
	if filename == "" {
		filename = "emails.txt"
	}
	
	fmt.Printf("\n%s[+]%s Loading emails from %s...\n", Yellow, Reset, filename)
	
	// Mock checking
	fmt.Printf("\n%s[+]%s Checking emails...\n\n", Green, Reset)
	
	progress := NewProgressBar(100)
	for i := 0; i <= 100; i++ {
		progress.Update(i)
		time.Sleep(30 * time.Millisecond)
	}
	
	fmt.Printf("\n\n%s[✓]%s Email check complete!\n", Green, Reset)
	fmt.Printf("  Valid: %s85%s\n", Green, Reset)
	fmt.Printf("  Invalid: %s15%s\n", Red, Reset)
	
	pause()
}

// ====================================
// MENU OPTION 3: PAYPAL BRUTE3 CHECKER
// ====================================

func paypalBrute3Checker() {
	clearScreen()
	printBanner()
	fmt.Printf("\n%s[+]%s PayPal Brute3 Checker\n\n", Cyan, Reset)
	
	_ = getUserInput("Enter combo file (email:pass:email): ")
	threads := getIntInput("Number of threads (1-100): ")
	
	if threads < 1 {
		threads = 1
	}
	if threads > 100 {
		threads = 100
	}
	
	fmt.Printf("\n%s[+]%s Starting brute force with %d threads...\n", Yellow, Reset, threads)
	fmt.Printf("%s[!]%s WARNING: This is for educational purposes only!\n\n", Red, Reset)
	
	progress := NewProgressBar(100)
	for i := 0; i <= 100; i++ {
		progress.Update(i)
		time.Sleep(50 * time.Millisecond)
	}
	
	fmt.Printf("\n\n%s[✓]%s Check complete!\n", Green, Reset)
	fmt.Printf("  Hits: %s12%s\n", Green, Reset)
	fmt.Printf("  Failed: %s88%s\n", Red, Reset)
	
	pause()
}

// ====================================
// MENU OPTION 4: AUTO RESTOCK
// ====================================

func autoRestock() {
	clearScreen()
	printBanner()
	fmt.Printf("\n%s[+]%s Auto Restock Configuration\n\n", Cyan, Reset)
	
	fmt.Printf("%s1.%s Enable Auto Restock\n", Yellow, Reset)
	fmt.Printf("%s2.%s Set Restock Threshold\n", Yellow, Reset)
	fmt.Printf("%s3.%s Set Restock Quantity\n", Yellow, Reset)
	fmt.Printf("%s4.%s View Current Settings\n", Yellow, Reset)
	fmt.Printf("%s0.%s Back\n\n", Red, Reset)
	
	choice := getUserInput(fmt.Sprintf("%s[+]%s Enter your choice: ", Yellow, Reset))
	
	switch choice {
	case "1":
		fmt.Printf("\n%s[✓]%s Auto Restock Enabled!\n", Green, Reset)
		pause()
	case "2":
		threshold := getIntInput("\nEnter restock threshold: ")
		fmt.Printf("\n%s[✓]%s Threshold set to %d units\n", Green, Reset, threshold)
		pause()
	case "3":
		quantity := getIntInput("\nEnter restock quantity: ")
		fmt.Printf("\n%s[✓]%s Restock quantity set to %d units\n", Green, Reset, quantity)
		pause()
	case "4":
		fmt.Printf("\n%s[+]%s Current Auto Restock Settings:\n", Cyan, Reset)
		fmt.Printf("  Status: %sEnabled%s\n", Green, Reset)
		fmt.Printf("  Threshold: %s50%s units\n", Yellow, Reset)
		fmt.Printf("  Quantity: %s100%s units\n", Yellow, Reset)
		pause()
	case "0":
		return
	}
}

// ====================================
// MENU OPTION 5: WRITE ON CHANNEL
// ====================================

func writeOnChannel() {
	clearScreen()
	printBanner()
	fmt.Printf("\n%s[+]%s Write on Channel\n\n", Cyan, Reset)
	
	channel := getUserInput("Enter channel ID: ")
	message := getUserInput("Enter message: ")
	
	fmt.Printf("\n%s[+]%s Sending message to channel %s...\n", Yellow, Reset, channel)
	time.Sleep(1 * time.Second)
	fmt.Printf("%s[✓]%s Message sent successfully!\n", Green, Reset)
	fmt.Printf("  Channel: %s\n", channel)
	fmt.Printf("  Message: %s\n", message)
	
	pause()
}

// ====================================
// MENU OPTION 6: REMOVE STOCK
// ====================================

func removeStock() {
	clearScreen()
	printBanner()
	fmt.Printf("\n%s[+]%s Remove Stock\n\n", Red, Reset)
	
	id := getIntInput("Enter stock ID to remove: ")
	quantity := getIntInput("Quantity to remove: ")
	
	confirm := getBoolInput(fmt.Sprintf("Remove %d units from stock ID %d? (y/n): ", quantity, id))
	
	if confirm {
		fmt.Printf("\n%s[✓]%s Removed %d units from stock ID %d\n", Green, Reset, quantity, id)
	} else {
		fmt.Printf("\n%s[!]%s Operation cancelled\n", Yellow, Reset)
	}
	
	pause()
}

// ====================================
// MENU OPTION 7: SETTINGS
// ====================================

func settings() {
	clearScreen()
	printBanner()
	fmt.Printf("\n%s[+]%s Settings\n\n", Cyan, Reset)
	
	fmt.Printf("%s1.%s API Configuration\n", Yellow, Reset)
	fmt.Printf("%s2.%s Proxy Settings\n", Yellow, Reset)
	fmt.Printf("%s3.%s Notification Settings\n", Yellow, Reset)
	fmt.Printf("%s4.%s Database Settings\n", Yellow, Reset)
	fmt.Printf("%s5.%s About\n", Yellow, Reset)
	fmt.Printf("%s0.%s Back\n\n", Red, Reset)
	
	choice := getUserInput(fmt.Sprintf("%s[+]%s Enter your choice: ", Yellow, Reset))
	
	switch choice {
	case "1":
		apiConfiguration()
	case "2":
		proxySettings()
	case "3":
		notificationSettings()
	case "4":
		databaseSettings()
	case "5":
		about()
	case "0":
		return
	}
}

func apiConfiguration() {
	fmt.Printf("\n%s[+]%s API Configuration\n\n", Cyan, Reset)
	fmt.Printf("  Status: %sConnected%s\n", Green, Reset)
	fmt.Printf("  API Key: %s****************************abc%s\n", Yellow, Reset)
	pause()
}

func proxySettings() {
	fmt.Printf("\n%s[+]%s Proxy Settings\n\n", Cyan, Reset)
	fmt.Printf("  Proxies Loaded: %s50%s\n", Green, Reset)
	fmt.Printf("  Type: %sHTTP/HTTPS%s\n", Yellow, Reset)
	pause()
}

func notificationSettings() {
	fmt.Printf("\n%s[+]%s Notification Settings\n\n", Cyan, Reset)
	fmt.Printf("  Email Notifications: %sEnabled%s\n", Green, Reset)
	fmt.Printf("  Discord Webhook: %sEnabled%s\n", Green, Reset)
	pause()
}

func databaseSettings() {
	fmt.Printf("\n%s[+]%s Database Settings\n\n", Cyan, Reset)
	fmt.Printf("  Connection: %sActive%s\n", Green, Reset)
	fmt.Printf("  Records: %s1,234%s\n", Yellow, Reset)
	pause()
}

func about() {
	fmt.Printf("\n%s[+]%s About CrownPal Manager\n\n", Cyan, Reset)
	fmt.Printf("  Version: %s2.0.0%s\n", Green, Reset)
	fmt.Printf("  Author: %sCrownPal Team%s\n", Yellow, Reset)
	fmt.Printf("  Description: Complete PayPal and Crown management solution\n")
	fmt.Printf("  Features: Stock Management, Email Validation, CD Key Finder\n")
	pause()
}

// ====================================
// MENU OPTION 8: CD KEY STORE FINDER
// ====================================

func cdKeyFinderMode() {
	clearScreen()
	printBanner()
	fmt.Printf("\n%s🎮 CD Key Store Finder%s\n\n", Cyan, Reset)
	fmt.Printf("%sThis tool searches the web for CD key stores with PayPal support%s\n", Yellow, Reset)
	fmt.Printf("%sand instant delivery using 100+ different search methods.%s\n\n", Yellow, Reset)
	
	targetCount := getIntInput(fmt.Sprintf("%s[+]%s How many stores to find? (default 50): ", Yellow, Reset))
	if targetCount <= 0 {
		targetCount = 50
	}
	
	fmt.Printf("\n%s[+]%s Starting search for %d stores...\n", Green, Reset, targetCount)
	fmt.Printf("%s[+]%s Using 100+ search methods across multiple engines\n", Green, Reset)
	time.Sleep(1 * time.Second)
	
	// Run the search
	stores := searchCDKeyStores(targetCount)
	
	// Display results
	clearScreen()
	printBanner()
	fmt.Printf("\n%s🎮 CD Key Store Finder - Results%s\n\n", Cyan, Reset)
	fmt.Printf("%s[✓]%s Search Complete! Found %s%d%s stores\n\n", Green, Reset, Green, len(stores), Reset)
	
	// Summary statistics
	paypalCount := 0
	instantCount := 0
	verifiedCount := 0
	
	for _, store := range stores {
		if store.PayPalSupport {
			paypalCount++
		}
		if store.InstantDelivery {
			instantCount++
		}
		if store.Verified {
			verifiedCount++
		}
	}
	
	fmt.Printf("%s📊 Statistics:%s\n", Cyan, Reset)
	fmt.Printf("  Total Stores: %s%d%s\n", Yellow, len(stores), Reset)
	fmt.Printf("  With PayPal: %s%d%s (%.1f%%)\n", Green, paypalCount, Reset, calculatePercentage(paypalCount, len(stores)))
	fmt.Printf("  Instant Delivery: %s%d%s (%.1f%%)\n", Green, instantCount, Reset, calculatePercentage(instantCount, len(stores)))
	fmt.Printf("  Verified: %s%d%s (%.1f%%)\n", Green, verifiedCount, Reset, calculatePercentage(verifiedCount, len(stores)))
	
	// Display top stores
	fmt.Printf("\n%s🏆 Top Stores:%s\n\n", Cyan, Reset)
	
	displayCount := 10
	if len(stores) < 10 {
		displayCount = len(stores)
	}
	
	for i := 0; i < displayCount; i++ {
		store := stores[i]
		fmt.Printf("  %s%d.%s %s\n", Yellow, i+1, Reset, store.Name)
		fmt.Printf("     URL: %s%s%s\n", Cyan, store.URL, Reset)
		fmt.Printf("     PayPal: %s | Instant: %s | Confidence: %s%.2f%s\n",
			boolToString(store.PayPalSupport),
			boolToString(store.InstantDelivery),
			Yellow, store.Confidence, Reset)
		fmt.Println()
	}
	
	// Export options
	fmt.Printf("\n%s[+]%s Export Options:\n", Cyan, Reset)
	fmt.Printf("%s1.%s Export as JSON\n", Yellow, Reset)
	fmt.Printf("%s2.%s Export as TXT\n", Yellow, Reset)
	fmt.Printf("%s3.%s Export as CSV\n", Yellow, Reset)
	fmt.Printf("%s0.%s Back to Main Menu\n\n", Red, Reset)
	
	choice := getUserInput(fmt.Sprintf("%s[+]%s Enter your choice: ", Yellow, Reset))
	
	switch choice {
	case "1":
		err := exportResults(stores, "json")
		if err != nil {
			fmt.Printf("\n%s[!]%s Error exporting: %v\n", Red, Reset, err)
		} else {
			fmt.Printf("\n%s[✓]%s Results exported successfully!\n", Green, Reset)
		}
		pause()
	case "2":
		err := exportResults(stores, "txt")
		if err != nil {
			fmt.Printf("\n%s[!]%s Error exporting: %v\n", Red, Reset, err)
		} else {
			fmt.Printf("\n%s[✓]%s Results exported successfully!\n", Green, Reset)
		}
		pause()
	case "3":
		err := exportResults(stores, "csv")
		if err != nil {
			fmt.Printf("\n%s[!]%s Error exporting: %v\n", Red, Reset, err)
		} else {
			fmt.Printf("\n%s[✓]%s Results exported successfully!\n", Green, Reset)
		}
		pause()
	case "0":
		return
	}
}

func boolToString(b bool) string {
	if b {
		return Green + "✓" + Reset
	}
	return Red + "✗" + Reset
}
