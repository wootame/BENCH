// Node.js Benchmark - Main entry point
const { runCPUBenchmark } = require('./cpu-benchmark');
const { runIOBenchmark } = require('./io-benchmark');
const { runIOBenchmarkHeavy } = require('./io-benchmark-heavy');

// Main function with argument parsing
async function main() {
  // Parse arguments for task count and mode
  let taskCount = 10; // default
  let isIOMode = false;
  let isHeavyMode = false;
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === 'io') {
      isIOMode = true;
    } else if (arg === 'heavy') {
      isHeavyMode = true;
    } else if (!isNaN(parseInt(arg))) {
      taskCount = parseInt(arg);
    }
  }
  
  if (isHeavyMode) {
    return await runIOBenchmarkHeavy(taskCount);
  } else if (isIOMode) {
    return await runIOBenchmark(taskCount);
  } else {
    return runCPUBenchmark(taskCount);
  }
}

// Export for use in other scripts
module.exports = { main, runCPUBenchmark, runIOBenchmark, runIOBenchmarkHeavy };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
