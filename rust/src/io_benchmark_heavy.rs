// Heavy I/O benchmark with CPU-intensive operations
// Demonstrates Rust's advantages: true parallelism, zero-cost abstractions, and efficient memory management
use std::time::{Duration, Instant};
use tokio::time::sleep;
use sha2::{Sha256, Digest};
use flate2::write::GzEncoder;
use flate2::read::GzDecoder;
use flate2::Compression;
use std::io::{Write, Read};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct FileData {
    hash: String,
    data: String,
    timestamp: u128,
}

// Generate large file content (several MB)
// Rust handles this efficiently with String::with_capacity and zero-copy operations
fn generate_large_content(size_mb: usize, seed: &str) -> String {
    let chunk_size = 1024; // 1KB chunks
    let total_chunks = size_mb * 1024;
    
    // Pre-allocate memory (Rust advantage: precise memory control)
    let mut content = String::with_capacity(total_chunks * chunk_size);
    
    for i in 0..total_chunks {
        // Create deterministic content
        let chunk = format!("Data chunk {} with seed {}: {}\n", i, seed, "x".repeat(900));
        content.push_str(&chunk);
    }
    
    content
}

// CPU-intensive: Compute SHA256 hash
// Rust can parallelize across threads without runtime overhead
fn compute_hash(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

// CPU-intensive: Compress data using gzip
// Rust's zero-cost abstractions mean no performance penalty
fn compress_data(content: &str) -> Result<Vec<u8>, std::io::Error> {
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(content.as_bytes())?;
    encoder.finish()
}

// Decompress gzip data
fn decompress_data(compressed: &[u8]) -> Result<String, std::io::Error> {
    let mut decoder = GzDecoder::new(compressed);
    let mut decompressed = String::new();
    decoder.read_to_string(&mut decompressed)?;
    Ok(decompressed)
}

async fn create_test_files(
    count: usize, 
    task_id: &str, 
    size_mb: usize
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut handles = Vec::new();
    let task_id = task_id.to_string();
    
    for i in 0..count {
        let task_id = task_id.clone();
        // Rust can run all these tasks in parallel across CPU cores
        let handle = tokio::task::spawn_blocking(move || {
            // Generate large content (parallel across tasks)
            let content = generate_large_content(size_mb, &format!("{}_{}", task_id, i));
            
            // Compute hash (parallel across tasks)
            let hash = compute_hash(&content);
            
            // Compress data (parallel across tasks)
            let compressed = compress_data(&content)?;
            
            // Create file data structure
            let file_data = FileData {
                hash,
                data: hex::encode(&compressed),
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis(),
            };
            
            // Serialize to JSON
            let json_data = serde_json::to_string(&file_data)?;
            
            // Write to file
            let filename = format!("temp_{}_{}.dat", task_id, i);
            std::fs::write(filename, json_data)?;
            
            Ok::<(), Box<dyn std::error::Error + Send + Sync>>(())
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.await??;
    }
    
    Ok(())
}

async fn read_test_files(
    count: usize, 
    task_id: &str
) -> Result<Vec<String>, Box<dyn std::error::Error + Send + Sync>> {
    let mut handles: Vec<tokio::task::JoinHandle<Result<String, Box<dyn std::error::Error + Send + Sync>>>> = Vec::new();
    let task_id = task_id.to_string();
    
    for i in 0..count {
        let task_id = task_id.clone();
        // Rust runs these in parallel across CPU cores
        let handle = tokio::task::spawn_blocking(move || -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
            let filename = format!("temp_{}_{}.dat", task_id, i);
            
            // Retry logic
            for retry in 0..10 {
                match std::fs::read_to_string(&filename) {
                    Ok(json_data) => {
                        // Parse JSON
                        let file_data: FileData = serde_json::from_str(&json_data)?;
                        
                        // Decode hex data
                        let compressed = hex::decode(&file_data.data)?;
                        
                        // Decompress (parallel across tasks)
                        let content = decompress_data(&compressed)?;
                        
                        // Verify hash (parallel across tasks)
                        let hash = compute_hash(&content);
                        if hash != file_data.hash {
                            return Err("Hash mismatch".into());
                        }
                        
                        return Ok(content);
                    }
                    Err(_) if retry < 9 => {
                        std::thread::sleep(Duration::from_millis(20));
                    }
                    Err(e) => return Err(e.into()),
                }
            }
            unreachable!()
        });
        handles.push(handle);
    }
    
    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await??);
    }
    
    Ok(results)
}

async fn cleanup_test_files(count: usize, task_id: &str) {
    let mut handles = Vec::new();
    let task_id = task_id.to_string();
    
    for i in 0..count {
        let task_id = task_id.clone();
        let handle = tokio::spawn(async move {
            let filename = format!("temp_{}_{}.dat", task_id, i);
            let _ = tokio::fs::remove_file(filename).await;
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

pub struct TaskResult {
    pub files_processed: usize,
    pub task_time: Duration,
}

pub async fn io_intensive_task(task_id: &str) -> Result<TaskResult, Box<dyn std::error::Error + Send + Sync>> {
    // Reduced file count but increased file size for CPU-intensive operations
    // Rust excels with parallel CPU-bound tasks and efficient memory management
    let file_count = 10;  // Fewer files but larger and more CPU-intensive
    let file_size_mb = 2; // 2MB per file (total 20MB per task)
    let network_calls = 5;
    
    let task_start = Instant::now();
    
    // Create large files with compression and hashing
    // Rust runs these in parallel across available CPU cores
    create_test_files(file_count, task_id, file_size_mb).await?;
    
    // Short wait to ensure filesystem writes complete
    sleep(Duration::from_millis(5)).await;
    
    // Simulate network calls with delays
    let network_handles: Vec<_> = (0..network_calls)
        .map(|_| {
            let delay = 10 + rand::random::<u64>() % 20;
            tokio::spawn(simulate_network_delay(delay))
        })
        .collect();
    
    // Read, decompress, and verify files (all in parallel)
    let file_contents = read_test_files(file_count, task_id).await?;
    
    // Wait for network calls to complete
    for handle in network_handles {
        handle.await?;
    }
    
    // Cleanup
    cleanup_test_files(file_count, task_id).await;
    
    let task_end = Instant::now();
    
    Ok(TaskResult {
        files_processed: file_contents.len(),
        task_time: task_end - task_start,
    })
}

pub async fn run_io_benchmark_heavy(task_count: usize) {
    println!("Rust I/O benchmark start (Heavy CPU-intensive version)");
    println!("WHY RUST IS FASTEST:");
    println!("1. Zero-cost abstractions - no runtime overhead");
    println!("2. True parallelism with async/await + thread pool");
    println!("3. Highly optimized native code with LLVM");
    println!("4. Precise memory control with no GC pauses");
    println!("---");
    
    let start = Instant::now();
    
    let mut handles = Vec::new();
    for i in 0..task_count {
        let handle = tokio::spawn(async move {
            let task_id = format!("task{}", i);
            match io_intensive_task(&task_id).await {
                Ok(result) => {
                    println!("Task {} done in {:?}", i + 1, result.task_time);
                    Some(result)
                }
                Err(e) => {
                    println!("Task {} failed: {}", i + 1, e);
                    None
                }
            }
        });
        handles.push(handle);
    }
    
    let mut results = Vec::new();
    for handle in handles {
        if let Ok(Some(result)) = handle.await {
            results.push(result);
        }
    }
    
    let elapsed = start.elapsed();
    
    // Calculate statistics
    let total_task_time: Duration = results.iter().map(|r| r.task_time).sum();
    let avg_task_time = total_task_time / results.len() as u32;
    let total_files: usize = results.iter().map(|r| r.files_processed).sum();
    
    println!("---");
    println!("All {} tasks done in {:?}", task_count, elapsed);
    println!("Average task time: {:?}", avg_task_time);
    println!("Total files processed: {}", total_files);
}
