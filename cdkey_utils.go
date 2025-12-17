package main

import (
	"bufio"
	"fmt"
	"os"
	"runtime"
	"strings"
	"time"
)

// ====================================
// COLOR CODES
// ====================================

const (
	Reset  = "\033[0m"
	Red    = "\033[31m"
	Green  = "\033[32m"
	Yellow = "\033[33m"
	Blue   = "\033[34m"
	Purple = "\033[35m"
	Cyan   = "\033[36m"
	White  = "\033[37m"
	Bold   = "\033[1m"
)

// ====================================
// SCREEN UTILITIES
// ====================================

func clearScreen() {
	if runtime.GOOS == "windows" {
		fmt.Print("\033[H\033[2J")
	} else {
		fmt.Print("\033[H\033[2J")
	}
}

func printBanner() {
	banner := `
   ██████╗██████╗  ██████╗ ██╗    ██╗███╗   ██╗██████╗  █████╗ ██╗     
  ██╔════╝██╔══██╗██╔═══██╗██║    ██║████╗  ██║██╔══██╗██╔══██╗██║     
  ██║     ██████╔╝██║   ██║██║ █╗ ██║██╔██╗ ██║██████╔╝███████║██║     
  ██║     ██╔══██╗██║   ██║██║███╗██║██║╚██╗██║██╔═══╝ ██╔══██║██║     
  ╚██████╗██║  ██║╚██████╔╝╚███╔███╔╝██║ ╚████║██║     ██║  ██║███████╗
   ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═══╝╚═╝     ╚═╝  ╚═╝╚══════╝
                                                                         
                    ███╗   ███╗ █████╗ ███╗   ██╗ █████╗  ██████╗ ███████╗██████╗ 
                    ████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝ ██╔════╝██╔══██╗
                    ██╔████╔██║███████║██╔██╗ ██║███████║██║  ███╗█████╗  ██████╔╝
                    ██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║   ██║██╔══╝  ██╔══██╗
                    ██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚██████╔╝███████╗██║  ██║
                    ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
`
	fmt.Println(Cyan + banner + Reset)
}

// ====================================
// INPUT UTILITIES
// ====================================

func getUserInput(prompt string) string {
	reader := bufio.NewReader(os.Stdin)
	fmt.Print(prompt)
	input, _ := reader.ReadString('\n')
	return strings.TrimSpace(input)
}

func getIntInput(prompt string) int {
	input := getUserInput(prompt)
	var value int
	fmt.Sscanf(input, "%d", &value)
	return value
}

func getBoolInput(prompt string) bool {
	input := strings.ToLower(getUserInput(prompt))
	return input == "y" || input == "yes"
}

// ====================================
// FILE UTILITIES
// ====================================

func loadFile(filename string) ([]string, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	
	lines := make([]string, 0)
	scanner := bufio.NewScanner(file)
	
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" && !strings.HasPrefix(line, "#") {
			lines = append(lines, line)
		}
	}
	
	return lines, scanner.Err()
}

func saveFile(filename string, lines []string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()
	
	writer := bufio.NewWriter(file)
	for _, line := range lines {
		fmt.Fprintln(writer, line)
	}
	
	return writer.Flush()
}

// ====================================
// STRING UTILITIES
// ====================================

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

func padRight(s string, length int) string {
	if len(s) >= length {
		return s
	}
	return s + strings.Repeat(" ", length-len(s))
}

func padLeft(s string, length int) string {
	if len(s) >= length {
		return s
	}
	return strings.Repeat(" ", length-len(s)) + s
}

// ====================================
// PROGRESS BAR
// ====================================

type ProgressBar struct {
	total   int
	current int
	width   int
	start   time.Time
}

func NewProgressBar(total int) *ProgressBar {
	return &ProgressBar{
		total: total,
		width: 50,
		start: time.Now(),
	}
}

func (p *ProgressBar) Update(current int) {
	p.current = current
	p.Draw()
}

func (p *ProgressBar) Draw() {
	percent := float64(p.current) / float64(p.total)
	filled := int(percent * float64(p.width))
	empty := p.width - filled
	
	elapsed := time.Since(p.start)
	remaining := time.Duration(0)
	if p.current > 0 {
		remaining = time.Duration(float64(elapsed) / float64(p.current) * float64(p.total-p.current))
	}
	
	bar := strings.Repeat("█", filled) + strings.Repeat("░", empty)
	
	fmt.Printf("\r[%s] %.1f%% | %d/%d | Elapsed: %s | ETA: %s",
		bar, percent*100, p.current, p.total,
		formatDuration(elapsed), formatDuration(remaining))
}

func formatDuration(d time.Duration) string {
	d = d.Round(time.Second)
	h := d / time.Hour
	d -= h * time.Hour
	m := d / time.Minute
	d -= m * time.Minute
	s := d / time.Second
	
	if h > 0 {
		return fmt.Sprintf("%02d:%02d:%02d", h, m, s)
	}
	return fmt.Sprintf("%02d:%02d", m, s)
}

// ====================================
// TABLE UTILITIES
// ====================================

type Table struct {
	headers []string
	rows    [][]string
	widths  []int
}

func NewTable(headers []string) *Table {
	widths := make([]int, len(headers))
	for i, h := range headers {
		widths[i] = len(h)
	}
	
	return &Table{
		headers: headers,
		rows:    make([][]string, 0),
		widths:  widths,
	}
}

func (t *Table) AddRow(row []string) {
	for i, cell := range row {
		if i < len(t.widths) && len(cell) > t.widths[i] {
			t.widths[i] = len(cell)
		}
	}
	t.rows = append(t.rows, row)
}

func (t *Table) Print() {
	// Print header
	for i, header := range t.headers {
		fmt.Print(padRight(header, t.widths[i]))
		if i < len(t.headers)-1 {
			fmt.Print(" | ")
		}
	}
	fmt.Println()
	
	// Print separator
	for i := range t.headers {
		fmt.Print(strings.Repeat("-", t.widths[i]))
		if i < len(t.headers)-1 {
			fmt.Print("-+-")
		}
	}
	fmt.Println()
	
	// Print rows
	for _, row := range t.rows {
		for i, cell := range row {
			if i < len(t.widths) {
				fmt.Print(padRight(cell, t.widths[i]))
				if i < len(t.headers)-1 {
					fmt.Print(" | ")
				}
			}
		}
		fmt.Println()
	}
}

// ====================================
// LOGGER
// ====================================

type Logger struct {
	file *os.File
}

func NewLogger(filename string) (*Logger, error) {
	file, err := os.OpenFile(filename, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return nil, err
	}
	
	return &Logger{file: file}, nil
}

func (l *Logger) Log(level, message string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	line := fmt.Sprintf("[%s] [%s] %s\n", timestamp, level, message)
	l.file.WriteString(line)
}

func (l *Logger) Info(message string) {
	l.Log("INFO", message)
}

func (l *Logger) Error(message string) {
	l.Log("ERROR", message)
}

func (l *Logger) Warning(message string) {
	l.Log("WARNING", message)
}

func (l *Logger) Close() {
	l.file.Close()
}

// ====================================
// VALIDATOR UTILITIES
// ====================================

func isValidEmail(email string) bool {
	return strings.Contains(email, "@") && strings.Contains(email, ".")
}

func isValidURL(url string) bool {
	return strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://")
}

func isValidDomain(domain string) bool {
	return strings.Contains(domain, ".") && !strings.Contains(domain, " ")
}

// ====================================
// STAT UTILITIES
// ====================================

func calculatePercentage(part, total int) float64 {
	if total == 0 {
		return 0.0
	}
	return float64(part) / float64(total) * 100.0
}

func calculateRate(count int, duration time.Duration) float64 {
	if duration.Seconds() == 0 {
		return 0.0
	}
	return float64(count) / duration.Seconds()
}

// ====================================
// PAUSE UTILITY
// ====================================

func pause() {
	fmt.Print("\n\nPress Enter to continue...")
	bufio.NewReader(os.Stdin).ReadBytes('\n')
}
