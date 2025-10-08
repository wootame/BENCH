#!/usr/bin/env python3
import sys
from cpu_benchmark import run_cpu_benchmark
from io_benchmark import run_io_benchmark

def main():
    # Parse command line arguments
    task_count = 10  # default
    is_io_mode = False
    
    for arg in sys.argv[1:]:
        if arg == 'io':
            is_io_mode = True
        elif arg.isdigit():
            task_count = int(arg)
    
    if is_io_mode:
        run_io_benchmark(task_count)
    else:
        run_cpu_benchmark(task_count)

if __name__ == "__main__":
    main()