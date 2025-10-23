# Multi-Language Benchmark Project

複数のプログラミング言語（Node.js, Go, Rust, Python, Ruby, C#, C++）でベンチマークを実行し、各言語の性能特性を比較するプロジェクトです。

## 📋 ベンチマークの種類

### 1. CPU集約的ベンチマーク (`cpu`)
- 平方根計算を10,000,000回実行
- 純粋な計算処理性能を測定

### 2. 標準I/Oベンチマーク (`io`)
- 50個の小さいファイルの読み書き
- 20回のネットワーク遅延シミュレーション
- 非同期処理性能を測定

### 3. 🆕 Heavy I/Oベンチマーク (`heavy`)
**CPU集約的な処理を含む大規模I/Oベンチマーク** *(Node.js, Go, Rust対応)*

- **10ファイル × 2MB** = 1タスクあたり20MB
- SHA256ハッシュ計算 + Gzip圧縮/解凍
- ハッシュ検証 + ネットワーク遅延シミュレーション

**性能比較（5タスク）：**
| 言語 | 時間 | 倍率 |
|------|-----|------|
| Node.js | 730ms | 基準 |
| Go | 218ms | 3.35倍高速 ⚡ |
| Rust | 193ms | 3.78倍高速 🚀 |

詳細は [BENCHMARK_RESULTS.md](./BENCHMARK_RESULTS.md) を参照してください。

## 🚀 クイックスタート

### インタラクティブランナー（推奨）

```bash
npm start
```

対話的メニューで以下を選択：
- 実行する言語
- ベンチマークの種類（CPU / I/O / Heavy I/O / 全て）
- タスク数（1〜100）

### 個別実行

```bash
# Node.js
cd node && node index.js        # CPU
cd node && node index.js io 10  # I/O
cd node && node index.js heavy 5 # Heavy I/O

# Go
cd go && go build && ./go-benchmark.exe      # CPU
cd go && ./go-benchmark.exe io 10            # I/O
cd go && ./go-benchmark.exe heavy 5          # Heavy I/O

# Rust
cd rust && cargo build --release
cd rust && ./target/release/rust.exe         # CPU
cd rust && ./target/release/rust.exe io 10   # I/O
cd rust && ./target/release/rust.exe heavy 5 # Heavy I/O
```

## 📁 プロジェクト構造

各言語は3ファイル構成：
```
<language>/
├── main/entry file       # エントリーポイント
├── cpu-benchmark file    # CPU集約的ベンチマーク
├── io-benchmark file     # 標準I/Oベンチマーク
└── io-benchmark-heavy*   # Heavy I/Oベンチマーク (Node.js, Go, Rust)
```


