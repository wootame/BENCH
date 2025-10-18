# Heavy I/O Benchmark - Quick Results Summary

## TL;DR: Performance Comparison

**Benchmark**: CPU-intensive I/O with 2MB files, SHA256 hashing, and gzip compression

### 5 Tasks (100MB):
- 🐢 **Node.js**: 730ms
- ⚡ **Go**: 218ms (3.35x faster)
- 🚀 **Rust**: 193ms (3.78x faster)

### 10 Tasks (200MB):
- 🐢 **Node.js**: 1,376ms
- ⚡ **Go**: 413ms (3.33x faster)
- 🚀 **Rust**: ~330ms (4.17x faster)

### 20 Tasks (400MB):
- 🐢 **Node.js**: 3,200ms
- ⚡ **Go**: 981ms (3.26x faster)
- 🚀 **Rust**: 638ms (5.01x faster)

---

## Visual Comparison (20 Tasks)

```
Node.js: ████████████████████████████████ 3,200ms
Go:      █████████ 981ms (3.26x faster)
Rust:    ██████ 638ms (5.01x faster)
```

---

## Why This Matters

### Node.js Bottlenecks:
❌ Single-threaded event loop  
❌ CPU tasks serialize despite async/await  
❌ High memory overhead (UTF-16, GC)  
❌ Cannot utilize multiple CPU cores  

### Go/Rust Advantages:
✅ True parallelism across all CPU cores  
✅ Native compiled code (no JIT overhead)  
✅ Efficient memory management  
✅ Zero or minimal GC pauses  

---

## CPU Utilization

| Language | CPU Usage | Cores Used |
|----------|-----------|------------|
| Node.js  | 12-25%    | 1 core     |
| Go       | 80-100%   | All cores  |
| Rust     | 80-100%   | All cores  |

---

## When to Use Each

### Use Node.js when:
- I/O-heavy APIs with minimal CPU processing
- Rapid prototyping and development speed is priority
- Rich ecosystem and npm packages are needed
- WebSocket/real-time applications with many connections

### Use Go when:
- CPU-intensive concurrent processing
- Microservices requiring fast compilation
- Network services with high throughput
- Simple deployment (single binary)

### Use Rust when:
- Maximum performance is critical
- System-level programming required
- Memory safety without GC overhead
- Embedded or resource-constrained environments

---

## Run the Benchmark Yourself

```bash
# Node.js
cd node && node index.js io 20

# Go
cd go && go build && .\go-benchmark.exe io 20

# Rust
cd rust && cargo build --release && .\target\release\rust.exe heavy 20
```

---

## Full Details

See [BENCHMARK_RESULTS.md](./BENCHMARK_RESULTS.md) for complete analysis and methodology.
