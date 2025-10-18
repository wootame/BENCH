mod cpu_benchmark;
mod io_benchmark;
mod io_benchmark_heavy;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let args: Vec<String> = std::env::args().collect();
    
    let mut task_count = 10; // default
    let mut is_io_mode = false;
    let mut is_heavy_mode = false;
    
    // Parse command line arguments
    for i in 1..args.len() {
        if args[i] == "io" {
            is_io_mode = true;
        } else if args[i] == "heavy" {
            is_heavy_mode = true;
            is_io_mode = true;
        } else if let Ok(count) = args[i].parse::<usize>() {
            task_count = count;
        }
    }
    
    if is_io_mode && is_heavy_mode {
        io_benchmark_heavy::run_io_benchmark_heavy(task_count).await;
    } else if is_io_mode {
        io_benchmark::run_io_benchmark(task_count).await?;
    } else {
        cpu_benchmark::run_cpu_benchmark(task_count);
    }
    
    Ok(())
}