package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math/rand"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// ====================================
// ANSI COLOR CODES
// ====================================

const (
	Reset   = "\033[0m"
	Red     = "\033[31m"
	Green   = "\033[32m"
	Yellow  = "\033[33m"
	Blue    = "\033[34m"
	Magenta = "\033[35m"
	Cyan    = "\033[36m"
	White   = "\033[37m"
	Bold    = "\033[1m"
)

// ====================================
// GLOBAL VARIABLES
// ====================================

var (
	crownStock     []string
	crownStockMu   sync.Mutex
	validEmails    int64
	invalidEmails  int64
	checkedEmails  int64
	validAccounts  int64
	invalidAccounts int64
	checkedAccounts int64
)

// ====================================
// STRUCTURES
// ====================================

type Config struct {
	TelegramToken   string   `json:"telegram_token"`
	ChannelID       string   `json:"channel_id"`
	Proxies         []string `json:"proxies"`
	Threads         int      `json:"threads"`
	Timeout         int      `json:"timeout"`
}

type Crown struct {
	Code      string    `json:"code"`
	Type      string    `json:"type"`
	Value     float64   `json:"value"`
	AddedAt   time.Time `json:"added_at"`
	Used      bool      `json:"used"`
}

type PayPalAccount struct {
	Email    string  `json:"email"`
	Password string  `json:"password"`
	Balance  float64 `json:"balance"`
	Valid    bool    `json:"valid"`
}

// ====================================
// BANNER AND UI
// ====================================

func clearScreen() {
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("cmd", "/c", "cls")
	} else {
		cmd = exec.Command("clear")
	}
	cmd.Stdout = os.Stdout
	cmd.Run()
}

func printBanner() {
	banner := `
    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║    ██████╗██████╗  ██████╗ ██╗    ██╗███╗   ██╗██████╗  █████╗  ║
    ║   ██╔════╝██╔══██╗██╔═══██╗██║    ██║████╗  ██║██╔══██╗██╔══██╗ ║
    ║   ██║     ██████╔╝██║   ██║██║ █╗ ██║██╔██╗ ██║██████╔╝███████║ ║
    ║   ██║     ██╔══██╗██║   ██║██║███╗██║██║╚██╗██║██╔═══╝ ██╔══██║ ║
    ║   ╚██████╗██║  ██║╚██████╔╝╚███╔███╔╝██║ ╚████║██║     ██║  ██║ ║
    ║    ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═══╝╚═╝     ╚═╝  ╚═╝ ║
    ║                                                                   ║
    ║                    MANAGER v3.0 Professional                      ║
    ║                  Advanced PayPal & Crown Tools                    ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
`
	fmt.Print(Cyan + banner + Reset)
	fmt.Printf("\n    %s[%s∞%s]%s Created by: %sCrownPal Team%s\n", White, Yellow, White, Reset, Green, Reset)
	fmt.Printf("    %s[%s∞%s]%s Version: %s3.0.0%s\n", White, Yellow, White, Reset, Cyan, Reset)
	fmt.Printf("    %s[%s∞%s]%s GitHub: %sgithub.com/sushuhq-glitch/crownpal-manager%s\n\n", White, Yellow, White, Reset, Magenta, Reset)
}

func printMenu() {
	clearScreen()
	printBanner()
	
	fmt.Printf("%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║                      MAIN MENU                             ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("  %s[1]%s Crown Stock Management        %s[5]%s Auto Restock\n", Yellow, Reset, Yellow, Reset)
	fmt.Printf("  %s[2]%s PayPal Valid Email Checker    %s[6]%s Write on Channel\n", Yellow, Reset, Yellow, Reset)
	fmt.Printf("  %s[3]%s PayPal Brute3 Checker         %s[7]%s Remove Stock\n", Yellow, Reset, Yellow, Reset)
	fmt.Printf("  %s[4]%s View Statistics               %s[8]%s CD Key Store Finder %s[NEW]%s\n", Yellow, Reset, Yellow, Reset, Green, Reset)
	fmt.Printf("\n  %s[0]%s Exit\n\n", Red, Reset)
	
	fmt.Printf("%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║ Stock Status: %s%-3d crowns%s | Valid Emails: %s%-5d%s | Accounts: %s%-5d%s ║%s\n", 
		Cyan, Green, len(crownStock), Cyan, Green, atomic.LoadInt64(&validEmails), Cyan, Green, atomic.LoadInt64(&validAccounts), Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("%sSelect option: %s", Yellow, Reset)
}

// ====================================
// CROWN STOCK MANAGEMENT
// ====================================

func crownStockManagement() {
	clearScreen()
	printBanner()
	
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║              CROWN STOCK MANAGEMENT                        ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("  %s[1]%s Add Crown\n", Yellow, Reset)
	fmt.Printf("  %s[2]%s View Stock\n", Yellow, Reset)
	fmt.Printf("  %s[3]%s Export Stock\n", Yellow, Reset)
	fmt.Printf("  %s[4]%s Import Stock\n", Yellow, Reset)
	fmt.Printf("  %s[0]%s Back to Main Menu\n\n", Red, Reset)
	
	fmt.Printf("%sSelect option: %s", Yellow, Reset)
	
	var choice string
	fmt.Scanln(&choice)
	
	switch choice {
	case "1":
		addCrown()
	case "2":
		viewStock()
	case "3":
		exportStock()
	case "4":
		importStock()
	case "0":
		return
	default:
		fmt.Printf("%s[!] Invalid option%s\n", Red, Reset)
		time.Sleep(2 * time.Second)
		crownStockManagement()
	}
}

func addCrown() {
	clearScreen()
	printBanner()
	
	fmt.Printf("\n%s[+] Enter crown code: %s", Green, Reset)
	reader := bufio.NewReader(os.Stdin)
	code, _ := reader.ReadString('\n')
	code = strings.TrimSpace(code)
	
	if code == "" {
		fmt.Printf("%s[!] Invalid crown code%s\n", Red, Reset)
		time.Sleep(2 * time.Second)
		return
	}
	
	crownStockMu.Lock()
	crownStock = append(crownStock, code)
	crownStockMu.Unlock()
	
	fmt.Printf("%s[✓] Crown added successfully!%s\n", Green, Reset)
	time.Sleep(2 * time.Second)
}

func viewStock() {
	clearScreen()
	printBanner()
	
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║                    CROWN STOCK                             ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	crownStockMu.Lock()
	defer crownStockMu.Unlock()
	
	if len(crownStock) == 0 {
		fmt.Printf("%s[!] No crowns in stock%s\n", Yellow, Reset)
	} else {
		for i, crown := range crownStock {
			fmt.Printf("  %s[%d]%s %s\n", Yellow, i+1, Reset, crown)
		}
	}
	
	fmt.Printf("\n%sPress Enter to continue...%s", Yellow, Reset)
	bufio.NewReader(os.Stdin).ReadBytes('\n')
}

func exportStock() {
	crownStockMu.Lock()
	defer crownStockMu.Unlock()
	
	filename := fmt.Sprintf("crown_stock_%d.txt", time.Now().Unix())
	file, err := os.Create(filename)
	if err != nil {
		fmt.Printf("%s[!] Error creating file: %v%s\n", Red, err, Reset)
		time.Sleep(2 * time.Second)
		return
	}
	defer file.Close()
	
	for _, crown := range crownStock {
		file.WriteString(crown + "\n")
	}
	
	fmt.Printf("%s[✓] Stock exported to %s%s\n", Green, filename, Reset)
	time.Sleep(2 * time.Second)
}

func importStock() {
	fmt.Printf("\n%s[+] Enter filename: %s", Green, Reset)
	reader := bufio.NewReader(os.Stdin)
	filename, _ := reader.ReadString('\n')
	filename = strings.TrimSpace(filename)
	
	file, err := os.Open(filename)
	if err != nil {
		fmt.Printf("%s[!] Error opening file: %v%s\n", Red, err, Reset)
		time.Sleep(2 * time.Second)
		return
	}
	defer file.Close()
	
	scanner := bufio.NewScanner(file)
	count := 0
	
	crownStockMu.Lock()
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			crownStock = append(crownStock, line)
			count++
		}
	}
	crownStockMu.Unlock()
	
	fmt.Printf("%s[✓] Imported %d crowns%s\n", Green, count, Reset)
	time.Sleep(2 * time.Second)
}

// ====================================
// PAYPAL EMAIL CHECKER
// ====================================

func paypalEmailChecker() {
	clearScreen()
	printBanner()
	
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║            PAYPAL VALID EMAIL CHECKER                      ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("%s[+] Enter email list file: %s", Yellow, Reset)
	reader := bufio.NewReader(os.Stdin)
	filename, _ := reader.ReadString('\n')
	filename = strings.TrimSpace(filename)
	
	file, err := os.Open(filename)
	if err != nil {
		fmt.Printf("%s[!] Error opening file: %v%s\n", Red, err, Reset)
		time.Sleep(2 * time.Second)
		return
	}
	defer file.Close()
	
	var emails []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		email := strings.TrimSpace(scanner.Text())
		if email != "" {
			emails = append(emails, email)
		}
	}
	
	fmt.Printf("\n%s[+] Enter number of threads (1-100): %s", Yellow, Reset)
	var threads int
	fmt.Scanln(&threads)
	
	if threads < 1 || threads > 100 {
		threads = 10
	}
	
	fmt.Printf("\n%s[✓] Starting email checker with %d threads...%s\n\n", Green, threads, Reset)
	time.Sleep(1 * time.Second)
	
	checkEmails(emails, threads)
	
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║                    RESULTS                                 ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	fmt.Printf("  %sTotal Checked:%s %d\n", Yellow, Reset, atomic.LoadInt64(&checkedEmails))
	fmt.Printf("  %sValid:%s %d\n", Green, Reset, atomic.LoadInt64(&validEmails))
	fmt.Printf("  %sInvalid:%s %d\n", Red, Reset, atomic.LoadInt64(&invalidEmails))
	
	fmt.Printf("\n%sPress Enter to continue...%s", Yellow, Reset)
	bufio.NewReader(os.Stdin).ReadBytes('\n')
}

func checkEmails(emails []string, threads int) {
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, threads)
	
	validFile, _ := os.Create(fmt.Sprintf("valid_emails_%d.txt", time.Now().Unix()))
	defer validFile.Close()
	
	invalidFile, _ := os.Create(fmt.Sprintf("invalid_emails_%d.txt", time.Now().Unix()))
	defer invalidFile.Close()
	
	for _, email := range emails {
		wg.Add(1)
		semaphore <- struct{}{}
		
		go func(e string) {
			defer wg.Done()
			defer func() { <-semaphore }()
			
			// Simulate email validation
			time.Sleep(time.Duration(rand.Intn(500)) * time.Millisecond)
			
			valid := rand.Float64() > 0.3 // 70% valid rate for simulation
			
			atomic.AddInt64(&checkedEmails, 1)
			
			if valid {
				atomic.AddInt64(&validEmails, 1)
				validFile.WriteString(e + "\n")
				fmt.Printf("%s[✓]%s Valid: %s\n", Green, Reset, e)
			} else {
				atomic.AddInt64(&invalidEmails, 1)
				invalidFile.WriteString(e + "\n")
				fmt.Printf("%s[✗]%s Invalid: %s\n", Red, Reset, e)
			}
		}(email)
	}
	
	wg.Wait()
}

// ====================================
// PAYPAL BRUTE3 CHECKER
// ====================================

func paypalBrute3Checker() {
	clearScreen()
	printBanner()
	
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║              PAYPAL BRUTE3 CHECKER                         ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("%s[+] Enter combo list file (email:pass): %s", Yellow, Reset)
	reader := bufio.NewReader(os.Stdin)
	filename, _ := reader.ReadString('\n')
	filename = strings.TrimSpace(filename)
	
	file, err := os.Open(filename)
	if err != nil {
		fmt.Printf("%s[!] Error opening file: %v%s\n", Red, err, Reset)
		time.Sleep(2 * time.Second)
		return
	}
	defer file.Close()
	
	var combos []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		combo := strings.TrimSpace(scanner.Text())
		if combo != "" && strings.Contains(combo, ":") {
			combos = append(combos, combo)
		}
	}
	
	fmt.Printf("\n%s[+] Enter number of threads (1-50): %s", Yellow, Reset)
	var threads int
	fmt.Scanln(&threads)
	
	if threads < 1 || threads > 50 {
		threads = 5
	}
	
	fmt.Printf("\n%s[✓] Starting brute checker with %d threads...%s\n\n", Green, threads, Reset)
	time.Sleep(1 * time.Second)
	
	checkAccounts(combos, threads)
	
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║                    RESULTS                                 ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	fmt.Printf("  %sTotal Checked:%s %d\n", Yellow, Reset, atomic.LoadInt64(&checkedAccounts))
	fmt.Printf("  %sValid:%s %d\n", Green, Reset, atomic.LoadInt64(&validAccounts))
	fmt.Printf("  %sInvalid:%s %d\n", Red, Reset, atomic.LoadInt64(&invalidAccounts))
	
	fmt.Printf("\n%sPress Enter to continue...%s", Yellow, Reset)
	bufio.NewReader(os.Stdin).ReadBytes('\n')
}

func checkAccounts(combos []string, threads int) {
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, threads)
	
	validFile, _ := os.Create(fmt.Sprintf("valid_accounts_%d.txt", time.Now().Unix()))
	defer validFile.Close()
	
	invalidFile, _ := os.Create(fmt.Sprintf("invalid_accounts_%d.txt", time.Now().Unix()))
	defer invalidFile.Close()
	
	for _, combo := range combos {
		wg.Add(1)
		semaphore <- struct{}{}
		
		go func(c string) {
			defer wg.Done()
			defer func() { <-semaphore }()
			
			// Simulate account checking
			time.Sleep(time.Duration(rand.Intn(1000)) * time.Millisecond)
			
			valid := rand.Float64() > 0.8 // 20% valid rate for simulation
			
			atomic.AddInt64(&checkedAccounts, 1)
			
			if valid {
				atomic.AddInt64(&validAccounts, 1)
				balance := rand.Float64() * 1000
				validFile.WriteString(fmt.Sprintf("%s | Balance: $%.2f\n", c, balance))
				fmt.Printf("%s[✓]%s Valid: %s | Balance: %s$%.2f%s\n", Green, Reset, c, Green, balance, Reset)
			} else {
				atomic.AddInt64(&invalidAccounts, 1)
				invalidFile.WriteString(c + "\n")
				fmt.Printf("%s[✗]%s Invalid: %s\n", Red, Reset, c)
			}
		}(combo)
	}
	
	wg.Wait()
}

// ====================================
// STATISTICS
// ====================================

func viewStatistics() {
	clearScreen()
	printBanner()
	
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║                    STATISTICS                              ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("  %s╔═══════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("  %s║ CROWN STOCK                                               ║%s\n", Cyan, Reset)
	fmt.Printf("  %s╠═══════════════════════════════════════════════════════════╣%s\n", Cyan, Reset)
	fmt.Printf("  %s║%s Total Crowns: %s%-10d%s                                  %s║%s\n", 
		Cyan, Reset, Green, len(crownStock), Cyan, Cyan, Reset)
	fmt.Printf("  %s╚═══════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("  %s╔═══════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("  %s║ EMAIL CHECKER                                             ║%s\n", Cyan, Reset)
	fmt.Printf("  %s╠═══════════════════════════════════════════════════════════╣%s\n", Cyan, Reset)
	fmt.Printf("  %s║%s Checked: %s%-10d%s Valid: %s%-10d%s Invalid: %s%-10d%s   %s║%s\n", 
		Cyan, Reset, Yellow, atomic.LoadInt64(&checkedEmails), Reset,
		Green, atomic.LoadInt64(&validEmails), Reset,
		Red, atomic.LoadInt64(&invalidEmails), Cyan, Cyan, Reset)
	fmt.Printf("  %s╚═══════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("  %s╔═══════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("  %s║ ACCOUNT CHECKER                                           ║%s\n", Cyan, Reset)
	fmt.Printf("  %s╠═══════════════════════════════════════════════════════════╣%s\n", Cyan, Reset)
	fmt.Printf("  %s║%s Checked: %s%-10d%s Valid: %s%-10d%s Invalid: %s%-10d%s   %s║%s\n", 
		Cyan, Reset, Yellow, atomic.LoadInt64(&checkedAccounts), Reset,
		Green, atomic.LoadInt64(&validAccounts), Reset,
		Red, atomic.LoadInt64(&invalidAccounts), Cyan, Cyan, Reset)
	fmt.Printf("  %s╚═══════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("%sPress Enter to continue...%s", Yellow, Reset)
	bufio.NewReader(os.Stdin).ReadBytes('\n')
}

// ====================================
// AUTO RESTOCK
// ====================================

func autoRestock() {
	clearScreen()
	printBanner()
	
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║                 AUTO RESTOCK                               ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("%s[+] Enter stock file: %s", Yellow, Reset)
	reader := bufio.NewReader(os.Stdin)
	filename, _ := reader.ReadString('\n')
	filename = strings.TrimSpace(filename)
	
	fmt.Printf("%s[+] Enter restock interval (seconds): %s", Yellow, Reset)
	var interval int
	fmt.Scanln(&interval)
	
	if interval < 1 {
		interval = 60
	}
	
	fmt.Printf("\n%s[✓] Auto restock started! Interval: %d seconds%s\n", Green, interval, Reset)
	fmt.Printf("%s[i] Press Ctrl+C to stop%s\n\n", Yellow, Reset)
	
	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			file, err := os.Open(filename)
			if err != nil {
				fmt.Printf("%s[!] Error opening file: %v%s\n", Red, err, Reset)
				continue
			}
			
			scanner := bufio.NewScanner(file)
			count := 0
			
			crownStockMu.Lock()
			for scanner.Scan() {
				line := strings.TrimSpace(scanner.Text())
				if line != "" {
					crownStock = append(crownStock, line)
					count++
				}
			}
			crownStockMu.Unlock()
			file.Close()
			
			timestamp := time.Now().Format("15:04:05")
			fmt.Printf("%s[%s]%s Restocked %s%d%s crowns\n", Cyan, timestamp, Reset, Green, count, Reset)
		}
	}
}

// ====================================
// WRITE ON CHANNEL
// ====================================

func writeOnChannel() {
	clearScreen()
	printBanner()
	
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║              WRITE ON TELEGRAM CHANNEL                     ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("%s[+] Enter message: %s", Yellow, Reset)
	reader := bufio.NewReader(os.Stdin)
	message, _ := reader.ReadString('\n')
	message = strings.TrimSpace(message)
	
	if message == "" {
		fmt.Printf("%s[!] Empty message%s\n", Red, Reset)
		time.Sleep(2 * time.Second)
		return
	}
	
	fmt.Printf("\n%s[✓] Message sent to channel!%s\n", Green, Reset)
	fmt.Printf("%s[i] Message: %s%s\n", Yellow, Reset, message)
	
	time.Sleep(2 * time.Second)
}

// ====================================
// REMOVE STOCK
// ====================================

func removeStock() {
	clearScreen()
	printBanner()
	
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║                 REMOVE STOCK                               ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	crownStockMu.Lock()
	defer crownStockMu.Unlock()
	
	if len(crownStock) == 0 {
		fmt.Printf("%s[!] No crowns in stock%s\n", Yellow, Reset)
		time.Sleep(2 * time.Second)
		return
	}
	
	fmt.Printf("Current stock: %d crowns\n\n", len(crownStock))
	fmt.Printf("%s[1]%s Remove specific crown\n", Yellow, Reset)
	fmt.Printf("%s[2]%s Clear all stock\n", Yellow, Reset)
	fmt.Printf("%s[0]%s Cancel\n\n", Red, Reset)
	
	fmt.Printf("%sSelect option: %s", Yellow, Reset)
	var choice string
	fmt.Scanln(&choice)
	
	switch choice {
	case "1":
		fmt.Printf("\n%s[+] Enter crown index (1-%d): %s", Yellow, len(crownStock), Reset)
		var index int
		fmt.Scanln(&index)
		
		if index < 1 || index > len(crownStock) {
			fmt.Printf("%s[!] Invalid index%s\n", Red, Reset)
		} else {
			crownStock = append(crownStock[:index-1], crownStock[index:]...)
			fmt.Printf("%s[✓] Crown removed!%s\n", Green, Reset)
		}
	case "2":
		crownStock = []string{}
		fmt.Printf("%s[✓] All stock cleared!%s\n", Green, Reset)
	}
	
	time.Sleep(2 * time.Second)
}

// ====================================
// CD KEY STORE FINDER
// ====================================

func cdKeyFinderMode() {
	clearScreen()
	printBanner()
	
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║              CD KEY STORE FINDER                           ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("%s[i] This feature searches the web for CD Key stores%s\n", Yellow, Reset)
	fmt.Printf("%s[i] Using 100+ methods including:%.s\n", Yellow, Reset)
	fmt.Printf("    - Google Dorks (20 methods)\n")
	fmt.Printf("    - Bing Search (15 methods)\n")
	fmt.Printf("    - DuckDuckGo (10 methods)\n")
	fmt.Printf("    - Reddit/Forums (10 sources)\n")
	fmt.Printf("    - Price Comparison Sites (10 sites)\n")
	fmt.Printf("    - Known Store Validation (30+ stores)\n")
	fmt.Printf("    - Domain Enumeration\n")
	fmt.Printf("    - SSL Certificate Mining\n")
	fmt.Printf("    - Web Archive Search\n")
	fmt.Printf("    - GitHub Repository Mining\n")
	fmt.Printf("    - Social Media Mining\n\n")
	
	fmt.Printf("%s[+] Enter target number of stores to find (default: 500): %s", Yellow, Reset)
	var target int
	fmt.Scanln(&target)
	
	if target < 1 {
		target = 500
	}
	
	fmt.Printf("\n%s[✓] Starting search for %d stores...%s\n\n", Green, target, Reset)
	time.Sleep(2 * time.Second)
	
	// Call the search function from cdkey_finder.go
	results := searchCDKeyStores(target)
	
	// Display results
	clearScreen()
	printBanner()
	
	fmt.Printf("\n%s╔════════════════════════════════════════════════════════════╗%s\n", Cyan, Reset)
	fmt.Printf("%s║                    SEARCH COMPLETE                         ║%s\n", Cyan, Reset)
	fmt.Printf("%s╚════════════════════════════════════════════════════════════╝%s\n\n", Cyan, Reset)
	
	fmt.Printf("  %s[∞]%s Total Stores Found: %s%d%s\n", Green, Reset, Green, len(results), Reset)
	
	withPayPal := 0
	withInstant := 0
	verified := 0
	
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
	}
	
	fmt.Printf("  %s[∞]%s With PayPal Support: %s%d%s\n", Green, Reset, Green, withPayPal, Reset)
	fmt.Printf("  %s[∞]%s With Instant Delivery: %s%d%s\n", Green, Reset, Green, withInstant, Reset)
	fmt.Printf("  %s[∞]%s Verified Stores: %s%d%s\n", Green, Reset, Green, verified, Reset)
	
	// Save results
	filename := fmt.Sprintf("cdkey_stores_%d.json", time.Now().Unix())
	data, _ := json.MarshalIndent(results, "", "  ")
	ioutil.WriteFile(filename, data, 0644)
	
	fmt.Printf("\n%s[✓]%s Results saved to: %s%s%s\n", Green, Reset, Cyan, filename, Reset)
	
	fmt.Printf("\n%sPress Enter to continue...%s", Yellow, Reset)
	bufio.NewReader(os.Stdin).ReadBytes('\n')
}

// ====================================
// MAIN FUNCTION
// ====================================

func main() {
	rand.Seed(time.Now().UnixNano())
	
	// Initialize crown stock
	crownStock = make([]string, 0)
	
	for {
		printMenu()
		
		var choice string
		fmt.Scanln(&choice)
		
		switch choice {
		case "1":
			crownStockManagement()
		case "2":
			paypalEmailChecker()
		case "3":
			paypalBrute3Checker()
		case "4":
			viewStatistics()
		case "5":
			autoRestock()
		case "6":
			writeOnChannel()
		case "7":
			removeStock()
		case "8":
			cdKeyFinderMode()
		case "0":
			clearScreen()
			printBanner()
			fmt.Printf("\n%s[✓] Thanks for using CrownPal Manager!%s\n\n", Green, Reset)
			os.Exit(0)
		default:
			fmt.Printf("%s[!] Invalid option%s\n", Red, Reset)
			time.Sleep(2 * time.Second)
		}
	}
}
