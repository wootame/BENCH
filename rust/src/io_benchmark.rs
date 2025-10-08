use std::time::{Duration, Instant};
use tokio::time::sleep;

async fn create_test_files(count: usize) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut handles = Vec::new();
    
    for i in 0..count {
        let handle = tokio::spawn(async move {
            let content = format!("Test file {} content with some data: {}", i, rand::random::<f64>());
            let filename = format!("temp_{}.txt", i);
            tokio::fs::write(filename, content).await
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.await??;
    }
    
    Ok(())
}

async fn read_test_files(count: usize) -> Result<Vec<String>, Box<dyn std::error::Error + Send + Sync>> {
    let mut handles = Vec::new();
    
    for i in 0..count {
        let handle = tokio::spawn(async move {
            let filename = format!("temp_{}.txt", i);
            tokio::fs::read_to_string(filename).await
        });
        handles.push(handle);
    }
    
    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await??);
    }
    
    Ok(results)
}

async fn cleanup_test_files(count: usize) {
    let mut handles = Vec::new();
    
    for i in 0..count {
        let handle = tokio::spawn(async move {
            let filename = format!("temp_{}.txt", i);
            let _ = tokio::fs::remove_file(filename).await; // Ignore errors
        });
        handles.push(handle);
    }
    
    for handle in handles {
        let _ = handle.await;
    }
}

async fn simulate_network_delay(ms: u64) {
    sleep(Duration::from_millis(ms)).await;
}

async fn io_intensive_task() -> Result<usize, Box<dyn std::error::Error + Send + Sync>> {
    let file_count = 50;
    let network_calls = 20;
    
    // Create files concurrently
    create_test_files(file_count).await?;
    
    // Simulate network calls with delays
    let mut network_handles = Vec::new();
    for _ in 0..network_calls {
        let handle = tokio::spawn(async {
            let delay = 10 + (rand::random::<f64>() * 20.0) as u64;
            simulate_network_delay(delay).await;
        });
        network_handles.push(handle);
    }
    
    // Read files concurrently while network calls are happening
    let file_contents_future = read_test_files(file_count);
    let network_future = async {
        for handle in network_handles {
            let _ = handle.await;
        }
    };
    
    let (file_contents, _) = tokio::join!(file_contents_future, network_future);
    let file_contents = file_contents?;
    
    // Cleanup
    cleanup_test_files(file_count).await;
    
    Ok(file_contents.len())
}

pub async fn run_io_benchmark(task_count: usize) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("Rust I/O benchmark start");
    
    let start = Instant::now();
    
    let mut handles = Vec::new();
    for i in 0..task_count {
        let handle = tokio::spawn(async move {
            match io_intensive_task().await {
                Ok(_) => println!("Task {} done", i + 1),
                Err(e) => println!("Task {} failed: {}", i + 1, e),
            }
        });
        handles.push(handle);
    }
    
    for handle in handles {
        let _ = handle.await;
    }
    
    let duration = start.elapsed();
    println!("All {} tasks done in {:?}", task_count, duration);
    
    Ok(())
}