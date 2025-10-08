require 'benchmark'

def heavy_computation(n)
  sum = 0.0
  n.times do |i|
    sum += Math.sqrt(i * rand)
  end
  sum
end

def run_cpu_benchmark(task_count)
  puts "Ruby benchmark start"
  
  start_time = Time.now
  iterations_per_task = 10_000_000  # 1千万回
  
  task_count.times do |i|
    result = heavy_computation(iterations_per_task)
    puts "Task #{i+1} done"
  end
  
  elapsed = Time.now - start_time
  puts "All #{task_count} tasks done in #{elapsed.round(4)}s"
end