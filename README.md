# Multi-Language Benchmark Project

このプロジェクトは、複数のプログラミング言語でCPU集約的なベンチマークとI/O集約的なベンチマークを実行し、各言語の特性を比較するためのものです。（基本 Copilot が頑張っています。）

## 対応言語

- **Node.js** - JavaScript runtime
- **Go** - Google開発のプログラミング言語
- **Rust** - Mozilla開発のシステムプログラミング言語
- **Python** - 汎用プログラミング言語
- **Ruby** - オブジェクト指向スクリプト言語
- **C#** - Microsoft開発の.NET言語
- **C++** - システムプログラミング言語

## ファイル構成

各言語は以下の3ファイル構成で統一されています：

```
<language>/
├── main/entry file (main.go, benchmark.py, etc.)
├── cpu-benchmark file (CPU集約的なベンチマーク)
└── io-benchmark file (I/O集約的なベンチマーク)
```

## ベンチマークの種類

### CPU集約的ベンチマーク
- 数学的計算（平方根計算）を大量に実行
- 各言語の計算処理性能を測定

### I/O集約的ベンチマーク
- ファイル作成・読み取り・削除操作
- ネットワーク遅延のシミュレーション
- 各言語の非同期処理性能を測定

## 使用方法

### 1. インタラクティブランナー（推奨）

```bash
npm start
# または
node runner.js
```

インタラクティブなメニューで以下を選択できます：
- 実行する言語
- ベンチマークの種類（CPU/I/O/両方）
- タスク数（1〜100）

### 2. 個別言語での実行

各言語のディレクトリで直接実行：

```bash
# CPU集約的ベンチマーク（デフォルト10タスク）
cd node && node index.js
cd go && go run .
cd rust && cargo run --release
cd python && python benchmark.py
cd ruby && ruby benchmark.rb
cd csharp && dotnet run
cd cpp && g++ -std=c++17 -O2 -o benchmark.exe *.cpp && ./benchmark.exe

# I/O集約的ベンチマーク（5タスク）
cd node && node index.js io 5
cd go && go run . io 5
cd rust && cargo run --release -- io 5
cd python && python benchmark.py io 5
cd ruby && ruby benchmark.rb io 5
cd csharp && dotnet run -- io 5
cd cpp && ./benchmark.exe io 5
```

### 3. バッチ実行（レガシー）

```bash
# CPU集約的ベンチマーク（すべての言語、5タスク）
run-all.bat 5

# I/O集約的ベンチマーク（すべての言語、3タスク）
run-all-io.bat 3
```

## パラメータ

- **タスク数**: 実行する並列タスクの数（デフォルト: 10）
- **ベンチマークモード**: `cpu`（デフォルト）または `io`

## 結果の見方

### CPU集約的ベンチマーク
- 各言語の計算処理速度を比較
- 一般的にコンパイル言語（Rust, Go, C++, C#）が高速

### I/O集約的ベンチマーク
- 各言語の非同期処理とI/O効率を比較
- Node.jsやGo、Rustなどの非同期処理に優れた言語が有利

## 技術詳細

### CPU集約的処理
```javascript
// 例: 1千万回の平方根計算
for (let i = 0; i < 10_000_000; i++) {
    sum += Math.sqrt(i * Math.random());
}
```

### I/O集約的処理
```javascript
// 例: 50ファイルの作成・読み取り + 20回のネットワーク遅延シミュレーション
await Promise.all([
    createFiles(50),
    simulateNetworkCalls(20)
]);
```

## 必要な環境

- **Node.js**: v14以上
- **Go**: v1.19以上
- **Rust**: v1.70以上
- **Python**: v3.8以上
- **Ruby**: v2.7以上
- **C#**: .NET 6以上
- **C++**: C++17対応コンパイラ（g++など）

## プロジェクトの目的

このプロジェクトは、各プログラミング言語の以下の特性を理解するために作成されました：

1. **計算処理性能**: CPU集約的なタスクでの実行速度
2. **I/O処理性能**: ファイル操作や非同期処理の効率
3. **メモリ使用量**: 各言語のメモリ効率（観測可能）
4. **開発効率**: コードの簡潔性と実装の複雑さ

## 拡張方法

新しい言語を追加する場合：

1. 言語ディレクトリを作成
2. 3ファイル構成で実装（main + cpu-benchmark + io-benchmark）
3. `runner.js`の`languages`オブジェクトに言語設定を追加
4. バッチファイルに対応コマンドを追加

---

**作成者**: GitHub Copilot  
**目的**: プログラミング言語の特性比較とベンチマーク学習