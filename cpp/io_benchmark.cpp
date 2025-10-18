#include "io_benchmark.h"
#include <iostream>
#include <fstream>
#include <vector>
#include <thread>
#include <chrono>
#include <random>
#include <filesystem>
#include <future>

void createTestFiles(int count, const std::string& taskId) {
    std::vector<std::future<void>> futures;
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<> dis(0.0, 1.0);
    
    for (int i = 0; i < count; ++i) {
        futures.push_back(std::async(std::launch::async, [i, &dis, &gen, &taskId]() {
            std::string content = "Test file " + std::to_string(i) + " content with some data: " + std::to_string(dis(gen));
            std::string filename = "temp_" + taskId + "_" + std::to_string(i) + ".txt";
            std::ofstream file(filename);
            file << content;
        }));
    }
    
    for (auto& future : futures) {
        future.wait();
    }
}

std::vector<std::string> readTestFiles(int count, const std::string& taskId) {
    std::vector<std::future<std::string>> futures;
    
    for (int i = 0; i < count; ++i) {
        futures.push_back(std::async(std::launch::async, [i, &taskId]() {
            std::string filename = "temp_" + taskId + "_" + std::to_string(i) + ".txt";
            std::string content;
            
            // リトライロジック
            for (int retry = 0; retry < 10; ++retry) {
                std::ifstream file(filename);
                if (file.is_open()) {
                    content = std::string((std::istreambuf_iterator<char>(file)),
                                        std::istreambuf_iterator<char>());
                    break;
                }
                if (retry < 9) {
                    std::this_thread::sleep_for(std::chrono::milliseconds(10));
                }
            }
            
            return content;
        }));
    }
    
    std::vector<std::string> results;
    for (auto& future : futures) {
        results.push_back(future.get());
    }
    
    return results;
}

void cleanupTestFiles(int count, const std::string& taskId) {
    std::vector<std::future<void>> futures;
    
    for (int i = 0; i < count; ++i) {
        futures.push_back(std::async(std::launch::async, [i, &taskId]() {
            std::string filename = "temp_" + taskId + "_" + std::to_string(i) + ".txt";
            try {
                std::filesystem::remove(filename);
            } catch (...) {
                // Ignore errors
            }
        }));
    }
    
    for (auto& future : futures) {
        future.wait();
    }
}

void simulateNetworkDelay(int ms) {
    std::this_thread::sleep_for(std::chrono::milliseconds(ms));
}

int ioIntensiveTask(const std::string& taskId) {
    const int fileCount = 50;
    const int networkCalls = 20;
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(10, 29);
    
    // Create files concurrently
    createTestFiles(fileCount, taskId);
    
    // Simulate network calls with delays
    std::vector<std::future<void>> networkFutures;
    for (int i = 0; i < networkCalls; ++i) {
        int delay = dis(gen);
        networkFutures.push_back(std::async(std::launch::async, [delay]() {
            simulateNetworkDelay(delay);
        }));
    }
    
    // Read files concurrently while network calls are happening
    auto fileContentsFuture = std::async(std::launch::async, [fileCount, &taskId]() {
        return readTestFiles(fileCount, taskId);
    });
    
    auto fileContents = fileContentsFuture.get();
    
    // Wait for network calls to complete
    for (auto& future : networkFutures) {
        future.wait();
    }
    
    // Cleanup
    cleanupTestFiles(fileCount, taskId);
    
    return fileContents.size();
}

void runIOBenchmark(int taskCount) {
    std::cout << "C++ I/O benchmark start" << std::endl;
    
    auto start = std::chrono::high_resolution_clock::now();
    
    std::vector<std::future<void>> taskFutures;
    for (int i = 0; i < taskCount; ++i) {
        taskFutures.push_back(std::async(std::launch::async, [i]() {
            try {
                std::string taskId = "task" + std::to_string(i);
                ioIntensiveTask(taskId);
                std::cout << "Task " << (i + 1) << " done" << std::endl;
            } catch (const std::exception& e) {
                std::cout << "Task " << (i + 1) << " failed: " << e.what() << std::endl;
            }
        }));
    }
    
    for (auto& future : taskFutures) {
        future.wait();
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::duration<double>>(end - start);
    std::cout << "All " << taskCount << " tasks done in " << duration.count() << "s" << std::endl;
}