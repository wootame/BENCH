#include "cpu_benchmark.h"
#include <iostream>
#include <cmath>
#include <random>
#include <chrono>

double heavyComputation(int n) {
    double sum = 0.0;
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<> dis(0.0, 1.0);
    
    for (int i = 0; i < n; ++i) {
        sum += std::sqrt(i * dis(gen));
    }
    return sum;
}

void runCPUBenchmark(int taskCount) {
    std::cout << "C++ benchmark start" << std::endl;
    
    auto start = std::chrono::high_resolution_clock::now();
    int iterationsPerTask = 10000000; // 1千万回
    
    for (int i = 0; i < taskCount; ++i) {
        double result = heavyComputation(iterationsPerTask);
        std::cout << "Task " << (i + 1) << " done" << std::endl;
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::duration<double>>(end - start);
    std::cout << "All " << taskCount << " tasks done in " << duration.count() << "s" << std::endl;
}