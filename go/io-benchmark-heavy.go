package main

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"os"
	"strings"
	"sync"
	"time"
)

// FileData represents the structure of our test files
type FileDataHeavy struct {
	Hash      string `json:"hash"`
	Data      string `json:"data"`
	Timestamp int64  `json:"timestamp"`
}

// Generate large file content (several MB)
// Go handles this efficiently with string builder and native string operations
func generateLargeContentGo(sizeMB int, seed string) string {
	var builder strings.Builder
	chunkSize := 1024 // 1KB chunks
	totalChunks := sizeMB * 1024
	
	builder.Grow(totalChunks * chunkSize) // Pre-allocate memory (Go advantage)
	
	for i := 0; i < totalChunks; i++ {
		// Create deterministic content
		chunk := fmt.Sprintf("Data chunk %d with seed %s: %s\n", i, seed, strings.Repeat("x", 900))
		builder.WriteString(chunk)
	}
	
	return builder.String()
}

// CPU-intensive: Compute SHA256 hash
// Go can run multiple goroutines in parallel across CPU cores
func computeHashGo(content string) string {
	hash := sha256.Sum256([]byte(content))
	return hex.EncodeToString(hash[:])
}

// CPU-intensive: Compress data using gzip
// Go can parallelize multiple compression tasks across goroutines
func compressDataGo(content string) ([]byte, error) {
	var buf bytes.Buffer
	writer := gzip.NewWriter(&buf)
	
	_, err := writer.Write([]byte(content))
	if err != nil {
		return nil, err
	}
	
	err = writer.Close()
	if err != nil {
		return nil, err
	}
	
	return buf.Bytes(), nil
}

// Decompress gzip data
func decompressDataGo(compressed []byte) (string, error) {
	reader, err := gzip.NewReader(bytes.NewReader(compressed))
	if err != nil {
		return "", err
	}
	defer reader.Close()
	
	decompressed, err := io.ReadAll(reader)
	if err != nil {
		return "", err
	}
	
	return string(decompressed), nil
}

func createTestFilesHeavy(count int, taskID string, sizeMB int) error {
	var wg sync.WaitGroup
	errChan := make(chan error, count)
	
	for i := 0; i < count; i++ {
		wg.Add(1)
		// Go can run all these goroutines in parallel across CPU cores
		go func(i int) {
			defer wg.Done()
			
			// Generate large content (parallel across goroutines)
			content := generateLargeContentGo(sizeMB, fmt.Sprintf("%s_%d", taskID, i))
			
			// Compute hash (parallel across goroutines)
			hash := computeHashGo(content)
			
			// Compress data (parallel across goroutines)
			compressed, err := compressDataGo(content)
			if err != nil {
				errChan <- err
				return
			}
			
			// Create file data structure
			fileData := FileDataHeavy{
				Hash:      hash,
				Data:      hex.EncodeToString(compressed),
				Timestamp: time.Now().UnixMilli(),
			}
			
			// Write to file
			jsonData, err := json.Marshal(fileData)
			if err != nil {
				errChan <- err
				return
			}
			
			filename := fmt.Sprintf("temp_%s_%d.dat", taskID, i)
			if err := os.WriteFile(filename, jsonData, 0644); err != nil {
				errChan <- err
			}
		}(i)
	}
	
	wg.Wait()
	close(errChan)
	
	if len(errChan) > 0 {
		return <-errChan
	}
	return nil
}

func readTestFilesHeavy(count int, taskID string) ([]string, error) {
	var wg sync.WaitGroup
	results := make([]string, count)
	errChan := make(chan error, count)
	
	for i := 0; i < count; i++ {
		wg.Add(1)
		// Go runs these in parallel across CPU cores
		go func(i int) {
			defer wg.Done()
			filename := fmt.Sprintf("temp_%s_%d.dat", taskID, i)
			
			// Retry logic
			var jsonData []byte
			var err error
			for retry := 0; retry < 10; retry++ {
				jsonData, err = os.ReadFile(filename)
				if err == nil {
					break
				}
				if retry < 9 {
					time.Sleep(20 * time.Millisecond)
				}
			}
			
			if err != nil {
				errChan <- err
				return
			}
			
			// Parse JSON
			var fileData FileDataHeavy
			if err := json.Unmarshal(jsonData, &fileData); err != nil {
				errChan <- err
				return
			}
			
			// Decode hex data
			compressed, err := hex.DecodeString(fileData.Data)
			if err != nil {
				errChan <- err
				return
			}
			
			// Decompress (parallel across goroutines)
			content, err := decompressDataGo(compressed)
			if err != nil {
				errChan <- err
				return
			}
			
			// Verify hash (parallel across goroutines)
			hash := computeHashGo(content)
			if hash != fileData.Hash {
				errChan <- fmt.Errorf("hash mismatch")
				return
			}
			
			results[i] = content
		}(i)
	}
	
	wg.Wait()
	close(errChan)
	
	if len(errChan) > 0 {
		return nil, <-errChan
	}
	return results, nil
}

func cleanupTestFilesHeavy(count int, taskID string) {
	var wg sync.WaitGroup
	for i := 0; i < count; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			filename := fmt.Sprintf("temp_%s_%d.dat", taskID, i)
			os.Remove(filename) // Ignore errors
		}(i)
	}
	wg.Wait()
}

// TaskResultHeavy holds timing information for a task
type TaskResultHeavy struct {
	FilesProcessed int
	TaskTime       time.Duration
}

func ioIntensiveTaskHeavy(taskID string) (TaskResultHeavy, error) {
	// Reduced file count but increased file size for CPU-intensive operations
	// Go excels here with parallel goroutines across multiple CPU cores
	fileCount := 10  // Fewer files but larger and more CPU-intensive
	fileSizeMB := 2  // 2MB per file (total 20MB per task)
	networkCalls := 5
	
	taskStart := time.Now()
	
	// Create large files with compression and hashing
	// Go runs these in parallel across available CPU cores
	if err := createTestFilesHeavy(fileCount, taskID, fileSizeMB); err != nil {
		return TaskResultHeavy{}, err
	}
	
	// Short wait to ensure filesystem writes complete
	time.Sleep(5 * time.Millisecond)
	
	// Simulate network calls with delays
	var wg sync.WaitGroup
	for i := 0; i < networkCalls; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			delay := 10 + rand.Intn(20)
			simulateNetworkDelay(delay)
		}()
	}
	
	// Read, decompress, and verify files (all in parallel)
	fileContents, err := readTestFilesHeavy(fileCount, taskID)
	wg.Wait() // Wait for network calls to complete
	
	// Cleanup
	cleanupTestFilesHeavy(fileCount, taskID)
	
	taskEnd := time.Now()
	
	if err != nil {
		return TaskResultHeavy{}, err
	}
	
	return TaskResultHeavy{
		FilesProcessed: len(fileContents),
		TaskTime:       taskEnd.Sub(taskStart),
	}, nil
}

func RunIOBenchmarkHeavy(taskCount int) {
	fmt.Println("Go Heavy I/O benchmark start")
	fmt.Println("WHY GO IS FASTER:")
	fmt.Println("1. True parallelism with goroutines across multiple CPU cores")
	fmt.Println("2. Efficient memory management with pre-allocation and minimal GC pressure")
	fmt.Println("3. Native compiled code for CPU-intensive operations (hash, compression)")
	fmt.Println("4. Concurrent I/O operations don't block each other")
	fmt.Println("---")

	start := time.Now()
	
	results := make([]TaskResultHeavy, taskCount)
	var mu sync.Mutex
	var wg sync.WaitGroup
	
	for i := 0; i < taskCount; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			taskID := fmt.Sprintf("task%d", i)
			result, err := ioIntensiveTaskHeavy(taskID)
			if err != nil {
				fmt.Printf("Task %d failed: %v\n", i+1, err)
			} else {
				mu.Lock()
				results[i] = result
				mu.Unlock()
				fmt.Printf("Task %d done in %v\n", i+1, result.TaskTime)
			}
		}(i)
	}

	wg.Wait()
	elapsed := time.Since(start)
	
	// Calculate statistics
	var totalTaskTime time.Duration
	var totalFiles int
	for _, r := range results {
		totalTaskTime += r.TaskTime
		totalFiles += r.FilesProcessed
	}
	avgTaskTime := totalTaskTime / time.Duration(len(results))
	
	fmt.Println("---")
	fmt.Printf("All %d tasks done in %v\n", taskCount, elapsed)
	fmt.Printf("Average task time: %v\n", avgTaskTime)
	fmt.Printf("Total files processed: %d\n", totalFiles)
}
