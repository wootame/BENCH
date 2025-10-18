require 'thread'
require 'fileutils'

def create_test_files(count, task_id)
  errors = []
  threads = []
  mutex = Mutex.new
  
  count.times do |i|
    threads << Thread.new(i) do |index|
      begin
        content = "Test file #{index} content with some data: #{rand}"
        filename = "temp_#{task_id}_#{index}.txt"
        File.write(filename, content)
      rescue => e
        mutex.synchronize { errors << e }
      end
    end
  end
  
  threads.each(&:join)
  
  raise errors.first unless errors.empty?
end

def read_test_files(count, task_id)
  results = Array.new(count)
  errors = []
  threads = []
  mutex = Mutex.new
  
  count.times do |i|
    threads << Thread.new(i) do |index|
      begin
        filename = "temp_#{task_id}_#{index}.txt"
        # リトライロジック
        10.times do |retry_count|
          begin
            results[index] = File.read(filename)
            break
          rescue Errno::ENOENT => e
            raise e if retry_count == 9
            sleep 0.01
          end
        end
      rescue => e
        mutex.synchronize { errors << e }
      end
    end
  end
  
  threads.each(&:join)
  
  raise errors.first unless errors.empty?
  
  results
end

def cleanup_test_files(count, task_id)
  threads = []
  
  count.times do |i|
    threads << Thread.new(i) do |index|
      begin
        filename = "temp_#{task_id}_#{index}.txt"
        File.delete(filename)
      rescue
        # Ignore errors
      end
    end
  end
  
  threads.each(&:join)
end

def simulate_network_delay(ms)
  sleep(ms / 1000.0)
end

def io_intensive_task(task_id)
  file_count = 50
  network_calls = 20
  
  # Create files concurrently
  create_test_files(file_count, task_id)
  
  # Simulate network calls with delays
  network_threads = []
  network_calls.times do
    delay = 10 + rand(20)
    network_threads << Thread.new { simulate_network_delay(delay) }
  end
  
  # Read files concurrently while network calls are happening
  file_contents = read_test_files(file_count, task_id)
  
  # Wait for network calls to complete
  network_threads.each(&:join)
  
  # Cleanup
  cleanup_test_files(file_count, task_id)
  
  file_contents.length
end

def run_io_benchmark(task_count)
  puts "Ruby I/O benchmark start"
  
  start_time = Time.now
  
  task_threads = []
  task_count.times do |i|
    task_threads << Thread.new(i) do |index|
      begin
        task_id = "task#{index}"
        io_intensive_task(task_id)
        puts "Task #{index+1} done"
      rescue => e
        puts "Task #{index+1} failed: #{e}"
      end
    end
  end
  
  task_threads.each(&:join)
  
  elapsed = Time.now - start_time
  puts "All #{task_count} tasks done in #{elapsed.round(4)}s"
end