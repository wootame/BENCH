// Heavy I/O-bound benchmark module with CPU-intensive operations
// Designed to expose Node.js single-threaded limitations compared to Go, Rust, and C#
const fs = require('fs').promises;
const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');
const { performance } = require('perf_hooks');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Generate large file content (several MB)
// Node.js will be slower here due to string concatenation and memory overhead
function generateLargeContent(sizeInMB, seed) {
  const chunkSize = 1024; // 1KB chunks
  const chunks = [];
  const totalChunks = sizeInMB * 1024; // MB to KB
  
  for (let i = 0; i < totalChunks; i++) {
    // Create pseudo-random but deterministic content
    const chunk = `Data chunk ${i} with seed ${seed}: ${'x'.repeat(900)}\n`;
    chunks.push(chunk);
  }
  
  return chunks.join('');
}

// CPU-intensive: Compute SHA256 hash
// Node.js is single-threaded, so multiple concurrent hash computations will serialize
// while Go/Rust/C# can parallelize across CPU cores
function computeHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// CPU-intensive: Compress data
// Compression is CPU-bound and will block the event loop in Node.js
async function compressData(content) {
  return await gzip(Buffer.from(content));
}

async function decompressData(compressed) {
  return await gunzip(compressed);
}

async function createTestFiles(count, taskId, fileSizeMB) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(
      (async () => {
        // Generate large content (CPU-intensive in Node.js)
        const content = generateLargeContent(fileSizeMB, `${taskId}_${i}`);
        
        // Compute hash (CPU-intensive, blocks event loop)
        const hash = computeHash(content);
        
        // Compress data (CPU-intensive, blocks event loop)
        const compressed = await compressData(content);
        
        // Write compressed data with metadata
        const fileData = JSON.stringify({
          hash,
          data: compressed.toString('base64'),
          timestamp: Date.now()
        });
        
        await fs.writeFile(`temp_${taskId}_${i}.dat`, fileData);
      })()
    );
  }
  await Promise.all(promises);
}

async function readTestFiles(count, taskId) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    // Retry logic for file reads
    promises.push(
      (async () => {
        for (let retry = 0; retry < 10; retry++) {
          try {
            const fileData = await fs.readFile(`temp_${taskId}_${i}.dat`, 'utf8');
            const parsed = JSON.parse(fileData);
            
            // Decompress data (CPU-intensive)
            const compressed = Buffer.from(parsed.data, 'base64');
            const decompressed = await decompressData(compressed);
            const content = decompressed.toString();
            
            // Verify hash (CPU-intensive)
            const hash = computeHash(content);
            if (hash !== parsed.hash) {
              throw new Error('Hash mismatch');
            }
            
            return content;
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
    promises.push(fs.unlink(`temp_${taskId}_${i}.dat`).catch(() => {}));
  }
  await Promise.all(promises);
}

async function simulateNetworkDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ioIntensiveTaskHeavy(taskId) {
  // Reduced file count but increased file size for CPU-intensive operations
  // Node.js struggles with CPU-bound tasks due to single-threaded event loop
  const fileCount = 10; // Fewer files but larger and more CPU-intensive
  const fileSizeMB = 2; // 2MB per file (total 20MB per task)
  const networkCalls = 5;
  
  const taskStart = performance.now();
  
  // Create large files with compression and hashing (very CPU-intensive for Node.js)
  await createTestFiles(fileCount, taskId, fileSizeMB);
  
  const networkPromises = [];
  for (let i = 0; i < networkCalls; i++) {
    networkPromises.push(simulateNetworkDelay(10 + Math.random() * 20));
  }
  
  // Read, decompress, and verify files (CPU-intensive)
  const [fileContents] = await Promise.all([
    readTestFiles(fileCount, taskId),
    Promise.all(networkPromises)
  ]);
  
  await cleanupTestFiles(fileCount, taskId);
  
  const taskEnd = performance.now();
  return {
    filesProcessed: fileContents.length,
    taskTime: taskEnd - taskStart
  };
}

async function runIOBenchmarkHeavy(taskCount = 10) {
  console.log("Node.js Heavy I/O benchmark start");
  console.log("WHY NODE.JS WILL BE SLOWER:");
  console.log("1. Single-threaded event loop - CPU tasks block other operations");
  console.log("2. String/Buffer operations have higher overhead than compiled languages");
  console.log("3. Compression/hashing serialize despite async/await syntax");
  console.log("4. Large file generation creates memory pressure and GC pauses");
  console.log("---");
  
  const start = performance.now();
  
  const promises = [];
  for (let i = 0; i < taskCount; i++) {
    promises.push(ioIntensiveTaskHeavy(`task${i}`).then(result => {
      console.log(`Task ${i + 1} done in ${result.taskTime.toFixed(2)}ms`);
      return result;
    }).catch(err => {
      console.log(`Task ${i + 1} failed: ${err.message}`);
      throw err;
    }));
  }
  
  const results = await Promise.all(promises);
  
  const end = performance.now();
  const elapsed = Math.round(end - start);
  const avgTaskTime = results.reduce((sum, r) => sum + r.taskTime, 0) / results.length;
  
  console.log("---");
  console.log(`All ${taskCount} tasks done in ${elapsed} ms`);
  console.log(`Average task time: ${avgTaskTime.toFixed(2)}ms`);
  console.log(`Total files processed: ${results.reduce((sum, r) => sum + r.filesProcessed, 0)}`);
  
  return { taskCount, elapsed, avgTaskTime, results };
}

module.exports = { runIOBenchmarkHeavy };
