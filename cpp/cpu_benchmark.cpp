#include "cpu_benchmark.h"
#include <iostream>
#include <cmath>
#include <random>
#include <chrono>
#include <future>
#include <vector>

// ============================================
// ① 乱数の初期化をスレッドローカルで行う（高速化）
// ============================================
double heavyComputation(int n) {
    static thread_local std::mt19937 gen(std::random_device{}()); // 各スレッド専用の RNG
    std::uniform_real_distribution<> dis(0.0, 1.0);

    double sum = 0.0;
    for (int i = 0; i < n; ++i) {
        sum += std::sqrt(i * dis(gen));
    }
    return sum;
}

// ============================================
// ② 並列化（std::async によるマルチスレッド実行）
// ============================================
void runCPUBenchmark(int taskCount) {
    std::cout << "C++ benchmark start" << std::endl;

    auto start = std::chrono::high_resolution_clock::now();
    int iterationsPerTask = 10'000'000; // 1千万回

    std::vector<std::future<double>> futures;
    futures.reserve(taskCount);

    // 並列タスクを起動
    for (int i = 0; i < taskCount; ++i) {
        futures.push_back(std::async(std::launch::async, [iterationsPerTask]() {
            return heavyComputation(iterationsPerTask);
        }));
    }

    // 全タスクの完了を待機
    for (int i = 0; i < taskCount; ++i) {
        double result = futures[i].get();
        std::cout << "Task " << (i + 1) << " done" << std::endl;
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::duration<double>>(end - start);
    std::cout << "All " << taskCount << " tasks done in " << duration.count() << "s" << std::endl;
}
