// I/O-bound benchmark module
const fs = require('fs').promises;
const { performance } = require('perf_hooks');

async function createTestFiles(count) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    const content = `Test file ${i} content with some data: ${Math.random()}`;
    promises.push(fs.writeFile(`temp_${i}.txt`, content));
  }
  await Promise.all(promises);
}

async function readTestFiles(count) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(fs.readFile(`temp_${i}.txt`, 'utf8'));
  }
  return await Promise.all(promises);
}

async function cleanupTestFiles(count) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(fs.unlink(`temp_${i}.txt`).catch(() => {}));
  }
  await Promise.all(promises);
}

async function simulateNetworkDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ioIntensiveTask() {
  const fileCount = 50;
  const networkCalls = 20;
  
  await createTestFiles(fileCount);
  
  const networkPromises = [];
  for (let i = 0; i < networkCalls; i++) {
    networkPromises.push(simulateNetworkDelay(10 + Math.random() * 20));
  }
  
  const [fileContents] = await Promise.all([
    readTestFiles(fileCount),
    Promise.all(networkPromises)
  ]);
  
  await cleanupTestFiles(fileCount);
  return fileContents.length;
}

async function runIOBenchmark(taskCount = 10) {
  console.log("Node.js I/O benchmark start");
  
  const start = performance.now();
  
  const promises = [];
  for (let i = 0; i < taskCount; i++) {
    promises.push(ioIntensiveTask().then(result => {
      console.log(`Task ${i + 1} done`);
      return result;
    }));
  }
  
  const results = await Promise.all(promises);
  
  const end = performance.now();
  const elapsed = Math.round(end - start);
  console.log(`All ${taskCount} tasks done in ${elapsed} ms`);
  return { taskCount, elapsed, results: results.length };
}

module.exports = { runIOBenchmark };