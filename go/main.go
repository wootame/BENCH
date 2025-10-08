package main

import (
	"os"
	"strconv"
)

func main() {
	taskCount := 10 // default
	isIOMode := false
	
	// Parse command line arguments
	for i := 1; i < len(os.Args); i++ {
		arg := os.Args[i]
		if arg == "io" {
			isIOMode = true
		} else if count, err := strconv.Atoi(arg); err == nil {
			taskCount = count
		}
	}
	
	if isIOMode {
		RunIOBenchmark(taskCount)
	} else {
		RunCPUBenchmark(taskCount)
	}
}
