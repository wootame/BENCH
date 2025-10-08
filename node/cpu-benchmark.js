// CPU-bound benchmark module
const { performance } = require('perf_hooks');

function heavyComputation(n) {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += Math.sqrt(i * Math.random());
  }
  return sum;
}

function runCPUBenchmark(taskCount = 10) {
  console.log("Node.js CPU benchmark start");

  const start = performance.now();
  const results = [];
  const iterationsPerTask = 10_000_000; // 1千万回

  for (let i = 0; i < taskCount; i++) {
    const result = heavyComputation(iterationsPerTask);
    results.push(result);
    console.log(`Task ${i + 1} done`);
  }

  const end = performance.now();
  const elapsed = Math.round(end - start);
  console.log(`All ${taskCount} tasks done in ${elapsed} ms`);
  return { taskCount, elapsed, results: results.length };
}

module.exports = { runCPUBenchmark };