// I/O-bound benchmark module (standard lightweight version)
const fs = require('fs').promises;
const { performance } = require('perf_hooks');

async function createTestFiles(count, taskId) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    const content = `Test file ${i} content with some data: ${Math.random()}`;
    promises.push(fs.writeFile(`temp_${taskId}_${i}.txt`, content));
  }
  await Promise.all(promises);
}

async function readTestFiles(count, taskId) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    // リトライロジック付き読み取り
    promises.push(
      (async () => {
        for (let retry = 0; retry < 10; retry++) {
          try {
            return await fs.readFile(`temp_${taskId}_${i}.txt`, 'utf8');
          } catch (err) {
            if (retry === 9) throw err;
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
      })()
    );
  }
  return await Promise.all(promises);
}

async function cleanupTestFiles(count, taskId) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(fs.unlink(`temp_${taskId}_${i}.txt`).catch(() => {}));
  }
  await Promise.all(promises);
}

async function simulateNetworkDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ioIntensiveTask(taskId) {
  const fileCount = 50;
  const networkCalls = 20;
  
  await createTestFiles(fileCount, taskId);
  
  const networkPromises = [];
  for (let i = 0; i < networkCalls; i++) {
    networkPromises.push(simulateNetworkDelay(10 + Math.random() * 20));
  }
  
  const [fileContents] = await Promise.all([
    readTestFiles(fileCount, taskId),
    Promise.all(networkPromises)
  ]);
  
  await cleanupTestFiles(fileCount, taskId);
  return fileContents.length;
}

async function runIOBenchmark(taskCount = 10) {
  console.log("Node.js I/O benchmark start");
  
  const start = performance.now();
  
  const promises = [];
  for (let i = 0; i < taskCount; i++) {
    promises.push(ioIntensiveTask(`task${i}`).then(result => {
      console.log(`Task ${i + 1} done`);
      return result;
    }).catch(err => {
      console.log(`Task ${i + 1} failed: ${err.message}`);
      throw err;
    }));
  }
  
  const results = await Promise.all(promises);
  
  const end = performance.now();
  const elapsed = Math.round(end - start);
  console.log(`All ${taskCount} tasks done in ${elapsed} ms`);
  return { taskCount, elapsed, results: results.length };
}

module.exports = { runIOBenchmark };