use std::time::Instant;
use rand::Rng;

fn heavy_computation(n: usize) -> f64 {
    let mut sum = 0.0;
    let mut rng = rand::thread_rng();
    for i in 0..n {
        sum += (i as f64 * rng.gen::<f64>()).sqrt();
    }
    sum
}

pub fn run_cpu_benchmark(task_count: usize) {
    println!("Rust benchmark start");
    
    let start = Instant::now();
    let iterations_per_task = 10_000_000; // 1千万回
    
    // Sequential execution (like Node.js)
    for i in 0..task_count {
        let _result = heavy_computation(iterations_per_task);
        println!("Task {} done", i + 1);
    }

    let duration = start.elapsed();
    println!("All {} tasks done in {:?}", task_count, duration);
}