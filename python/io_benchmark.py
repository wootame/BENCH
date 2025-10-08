import os
import random
import time
import threading
from queue import Queue

def create_test_files(count):
    errors = Queue()
    
    def create_file(i):
        try:
            content = f"Test file {i} content with some data: {random.random()}"
            filename = f"temp_{i}.txt"
            with open(filename, 'w') as f:
                f.write(content)
        except Exception as e:
            errors.put(e)
    
    threads = []
    for i in range(count):
        thread = threading.Thread(target=create_file, args=(i,))
        thread.start()
        threads.append(thread)
    
    for thread in threads:
        thread.join()
    
    if not errors.empty():
        raise errors.get()

def read_test_files(count):
    results = [None] * count
    errors = Queue()
    
    def read_file(i):
        try:
            filename = f"temp_{i}.txt"
            with open(filename, 'r') as f:
                results[i] = f.read()
        except Exception as e:
            errors.put(e)
    
    threads = []
    for i in range(count):
        thread = threading.Thread(target=read_file, args=(i,))
        thread.start()
        threads.append(thread)
    
    for thread in threads:
        thread.join()
    
    if not errors.empty():
        raise errors.get()
    
    return results

def cleanup_test_files(count):
    def cleanup_file(i):
        try:
            filename = f"temp_{i}.txt"
            os.remove(filename)
        except:
            pass  # Ignore errors
    
    threads = []
    for i in range(count):
        thread = threading.Thread(target=cleanup_file, args=(i,))
        thread.start()
        threads.append(thread)
    
    for thread in threads:
        thread.join()

def simulate_network_delay(ms):
    time.sleep(ms / 1000.0)

def io_intensive_task():
    file_count = 50
    network_calls = 20
    
    # Create files concurrently
    create_test_files(file_count)
    
    # Simulate network calls with delays
    network_threads = []
    for _ in range(network_calls):
        delay = 10 + random.randint(0, 19)
        thread = threading.Thread(target=simulate_network_delay, args=(delay,))
        thread.start()
        network_threads.append(thread)
    
    # Read files concurrently while network calls are happening
    file_contents = read_test_files(file_count)
    
    # Wait for network calls to complete
    for thread in network_threads:
        thread.join()
    
    # Cleanup
    cleanup_test_files(file_count)
    
    return len(file_contents)

def run_io_benchmark(task_count):
    print("Python I/O benchmark start")
    
    start = time.time()
    
    def io_task(i):
        try:
            io_intensive_task()
            print(f"Task {i+1} done")
        except Exception as e:
            print(f"Task {i+1} failed: {e}")
    
    threads = []
    for i in range(task_count):
        thread = threading.Thread(target=io_task, args=(i,))
        thread.start()
        threads.append(thread)
    
    for thread in threads:
        thread.join()
    
    elapsed = time.time() - start
    print(f"All {task_count} tasks done in {elapsed:.4f}s")