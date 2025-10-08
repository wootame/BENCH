require_relative 'cpu_benchmark'
require_relative 'io_benchmark'

def main
  task_count = 10 # default
  is_io_mode = false
  
  # Parse command line arguments
  ARGV.each do |arg|
    if arg == 'io'
      is_io_mode = true
    elsif arg.match?(/^\d+$/)
      task_count = arg.to_i
    end
  end
  
  if is_io_mode
    run_io_benchmark(task_count)
  else
    run_cpu_benchmark(task_count)
  end
end

main