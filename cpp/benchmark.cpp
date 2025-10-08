#include <iostream>
#include <string>
#include "cpu_benchmark.h"
#include "io_benchmark.h"

int main(int argc, char* argv[]) {
    int taskCount = 10; // default
    bool isIOMode = false;
    
    // Parse command line arguments
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "io") {
            isIOMode = true;
        } else {
            try {
                taskCount = std::stoi(arg);
            } catch (...) {
                // Ignore invalid numbers
            }
        }
    }
    
    if (isIOMode) {
        runIOBenchmark(taskCount);
    } else {
        runCPUBenchmark(taskCount);
    }
    
    return 0;
}