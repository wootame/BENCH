package main

import (
	"fmt"
	"math"
	"math/rand"
	"sync"
	"time"
)

func heavyComputation(n int) float64 {
	sum := 0.0
	for i := 0; i < n; i++ {
		sum += math.Sqrt(float64(i) * rand.Float64())
	}
	return sum
}

func RunCPUBenchmark(taskCount int) {
	fmt.Println("Go benchmark start")

	start := time.Now()

	var wg sync.WaitGroup
	iterationsPerTask := 10_000_000 // 1千万回
	results := make([]float64, taskCount)

	for i := 0; i < taskCount; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			results[i] = heavyComputation(iterationsPerTask)
			fmt.Printf("Task %d done\n", i+1)
		}(i)
	}

	wg.Wait()
	elapsed := time.Since(start)
	fmt.Printf("All %d tasks done in %v\n", taskCount, elapsed)
}