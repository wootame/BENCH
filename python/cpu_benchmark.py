import math
import random
import time

def heavy_computation(n):
    sum_val = 0.0
    for i in range(n):
        sum_val += math.sqrt(i * random.random())
    return sum_val

def run_cpu_benchmark(task_count):
    print("Python benchmark start")
    
    start = time.time()
    iterations_per_task = 10_000_000  # 1千万回
    
    for i in range(task_count):
        result = heavy_computation(iterations_per_task)
        print(f"Task {i+1} done")
    
    elapsed = time.time() - start
    print(f"All {task_count} tasks done in {elapsed:.4f}s")