package main

import (
	"fmt"
	"io/ioutil"
	"math/rand"
	"os"
	"sync"
	"time"
)

func createTestFiles(count int) error {
	var wg sync.WaitGroup
	errChan := make(chan error, count)
	
	for i := 0; i < count; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			content := fmt.Sprintf("Test file %d content with some data: %f", i, rand.Float64())
			filename := fmt.Sprintf("temp_%d.txt", i)
			if err := ioutil.WriteFile(filename, []byte(content), 0644); err != nil {
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

func readTestFiles(count int) ([]string, error) {
	var wg sync.WaitGroup
	results := make([]string, count)
	errChan := make(chan error, count)
	
	for i := 0; i < count; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			filename := fmt.Sprintf("temp_%d.txt", i)
			content, err := ioutil.ReadFile(filename)
			if err != nil {
				errChan <- err
				return
			}
			results[i] = string(content)
		}(i)
	}
	
	wg.Wait()
	close(errChan)
	
	if len(errChan) > 0 {
		return nil, <-errChan
	}
	return results, nil
}

func cleanupTestFiles(count int) {
	var wg sync.WaitGroup
	for i := 0; i < count; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			filename := fmt.Sprintf("temp_%d.txt", i)
			os.Remove(filename) // Ignore errors
		}(i)
	}
	wg.Wait()
}

func simulateNetworkDelay(ms int) {
	time.Sleep(time.Duration(ms) * time.Millisecond)
}

func ioIntensiveTask() (int, error) {
	fileCount := 50
	networkCalls := 20
	
	// Create files concurrently
	if err := createTestFiles(fileCount); err != nil {
		return 0, err
	}
	
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
	
	// Read files concurrently while network calls are happening
	fileContents, err := readTestFiles(fileCount)
	wg.Wait() // Wait for network calls to complete
	
	// Cleanup
	cleanupTestFiles(fileCount)
	
	if err != nil {
		return 0, err
	}
	
	return len(fileContents), nil
}

func RunIOBenchmark(taskCount int) {
	fmt.Println("Go I/O benchmark start")

	start := time.Now()

	var wg sync.WaitGroup
	for i := 0; i < taskCount; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			_, err := ioIntensiveTask()
			if err != nil {
				fmt.Printf("Task %d failed: %v\n", i+1, err)
			} else {
				fmt.Printf("Task %d done\n", i+1)
			}
		}(i)
	}

	wg.Wait()
	elapsed := time.Since(start)
	fmt.Printf("All %d tasks done in %v\n", taskCount, elapsed)
}