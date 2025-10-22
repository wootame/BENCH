import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// ANSI色コード
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

// 順序: C++, Rust, Go, C#, Node, Python, Ruby
const languages = {
    'cpp': {
        name: 'C++',
        command: '.\\\\benchmark.exe',
        buildCommand: 'g++ -std=c++17 -O2 -o benchmark.exe benchmark.cpp cpu_benchmark.cpp io_benchmark.cpp',
        color: 'white',
        isCompiled: true
    },
    'rust': {
        name: 'Rust',
        command: 'cargo run --release --',
        buildCommand: 'cargo build --release',
        color: 'red',
        isCompiled: true
    },
    'go': {
        name: 'Go',
        command: 'go run .',
        buildCommand: 'go build -o go-benchmark.exe .',
        color: 'cyan',
        isCompiled: true
    },
    'csharp': {
        name: 'C#',
        command: 'dotnet run --',
        buildCommand: 'dotnet build -c Release',
        color: 'blue',
        isCompiled: true
    },
    'node': {
        name: 'Node.js',
        command: 'node index.js',
        buildCommand: null,
        color: 'green',
        isCompiled: false
    },
    'python': {
        name: 'Python',
        command: 'python benchmark.py',
        buildCommand: null,
        color: 'yellow',
        isCompiled: false
    },
    'ruby': {
        name: 'Ruby',
        command: 'ruby benchmark.rb',
        buildCommand: null,
        color: 'magenta',
        isCompiled: false
    }
};

async function checkLanguageAvailability() {
    const available = {};
    
    for (const [key, lang] of Object.entries(languages)) {
        try {
            const langDir = path.join(process.cwd(), key);
            await fs.access(langDir);
            available[key] = lang;
        } catch (error) {
            console.log(colorize(`⚠️  ${lang.name} directory not found, skipping...`, 'dim'));
        }
    }
    
    return available;
}

async function buildLanguages(selectedLanguages) {
    console.log(colorize('\\n🔨 Building languages...', 'bright'));
    
    for (const [key, lang] of Object.entries(selectedLanguages)) {
        if (lang.buildCommand) {
            console.log(colorize(`Building ${lang.name}...`, lang.color));
            try {
                const langDir = path.join(process.cwd(), key);
                await execAsync(lang.buildCommand, { cwd: langDir });
                console.log(colorize(`✅ ${lang.name} built successfully`, 'green'));
            } catch (error) {
                console.log(colorize(`❌ ${lang.name} build failed: ${error.message}`, 'red'));
                delete selectedLanguages[key];
            }
        } else {
            console.log(colorize(`ℹ️  ${lang.name} doesn't require building`, 'dim'));
        }
    }
}

async function runBenchmark(lang, key, mode, taskCount) {
    const langDir = path.join(process.cwd(), key);
    const args = mode === 'io' ? ['io', taskCount.toString()] : [taskCount.toString()];
    const command = `${lang.command} ${args.join(' ')}`;
    
    console.log(colorize(`\\n🚀 Running ${lang.name} ${mode.toUpperCase()} benchmark (${taskCount} tasks)`, lang.color));
    console.log(colorize(`Command: ${command}`, 'dim'));
    console.log('─'.repeat(50));
    
    const startTime = Date.now();
    
    try {
        const { stdout, stderr } = await execAsync(command, { cwd: langDir });
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        console.log(stdout);
        if (stderr) {
            console.log(colorize(`Warning: ${stderr}`, 'yellow'));
        }
        
        console.log(colorize(`Total execution time: ${totalTime}ms`, 'dim'));
        
        return { success: true, time: totalTime, output: stdout };
    } catch (error) {
        console.log(colorize(`❌ Error running ${lang.name}: ${error.message}`, 'red'));
        return { success: false, error: error.message };
    }
}

async function runAllBenchmarks(selectedLanguages, mode, taskCount) {
    const results = {};
    
    console.log(colorize(`\\n🏁 Running ${mode.toUpperCase()} benchmarks for all selected languages...`, 'bright'));
    
    for (const [key, lang] of Object.entries(selectedLanguages)) {
        results[key] = await runBenchmark(lang, key, mode, taskCount);
        
        // 各言語の実行後に少し間を空ける
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
}

function displayResults(results, mode) {
    console.log(colorize(`\\n📊 ${mode.toUpperCase()} Benchmark Results Summary`, 'bright'));
    console.log('═'.repeat(60));
    
    const successful = Object.entries(results).filter(([_, result]) => result.success);
    const failed = Object.entries(results).filter(([_, result]) => !result.success);
    
    if (successful.length > 0) {
        // 成功した結果を実行時間でソート
        successful.sort((a, b) => a[1].time - b[1].time);
        
        console.log(colorize('✅ Successful runs (sorted by execution time):', 'green'));
        successful.forEach(([key, result], index) => {
            const lang = languages[key];
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
            console.log(`${medal} ${colorize(lang.name, lang.color)}: ${result.time}ms`);
        });
    }
    
    if (failed.length > 0) {
        console.log(colorize('\\n❌ Failed runs:', 'red'));
        failed.forEach(([key, result]) => {
            const lang = languages[key];
            console.log(`   ${colorize(lang.name, lang.color)}: ${result.error}`);
        });
    }
}

async function selectLanguages(availableLanguages) {
    console.log(colorize('\\n📋 Available languages:', 'bright'));
    Object.entries(availableLanguages).forEach(([key, lang], index) => {
        console.log(`${index + 1}. ${colorize(lang.name, lang.color)}`);
    });
    const allIndex = Object.keys(availableLanguages).length + 1;
    const compiledIndex = allIndex + 1;
    console.log(`${allIndex}. All languages`);
    console.log(`${compiledIndex}. Compiled languages only (C++, Rust, Go, C#)`);
    
    const choice = await ask(colorize('\\nSelect languages (comma-separated numbers or "all"): ', 'cyan'));
    
    if (choice.toLowerCase() === 'all' || choice === `${allIndex}`) {
        return availableLanguages;
    }
    
    if (choice === `${compiledIndex}`) {
        // コンパイル言語のみを返す
        const compiled = {};
        Object.entries(availableLanguages).forEach(([key, lang]) => {
            if (lang.isCompiled) {
                compiled[key] = lang;
            }
        });
        return compiled;
    }
    
    const selected = {};
    const choices = choice.split(',').map(s => parseInt(s.trim()));
    
    choices.forEach(num => {
        const keys = Object.keys(availableLanguages);
        if (num >= 1 && num <= keys.length) {
            const key = keys[num - 1];
            selected[key] = availableLanguages[key];
        }
    });
    
    return selected;
}

async function selectBenchmarkMode() {
    console.log(colorize('\n🎯 Benchmark modes:', 'bright'));
    console.log('1. CPU-bound (mathematical computations)');
    console.log('2. I/O-bound (file operations + network simulation)');
    console.log('3. Heavy I/O-bound (large files + compression + hashing)');
    console.log('4. All modes');
    
    const choice = await ask(colorize('\nSelect benchmark mode (1-4): ', 'cyan'));
    
    switch (choice) {
        case '1': return ['cpu'];
        case '2': return ['io'];
        case '3': return ['heavy'];
        case '4': return ['cpu', 'io', 'heavy'];
        default: return ['cpu'];
    }
}

async function selectTaskCount() {
    const choice = await ask(colorize('\\nEnter number of tasks (default: 10): ', 'cyan'));
    const count = parseInt(choice) || 10;
    return Math.max(1, Math.min(100, count)); // 1-100の範囲に制限
}

async function main() {
    console.log(colorize('🌟 Multi-Language Benchmark Runner 🌟', 'bright'));
    console.log(colorize('=====================================', 'bright'));
    
    try {
        // 利用可能な言語をチェック
        const availableLanguages = await checkLanguageAvailability();
        
        if (Object.keys(availableLanguages).length === 0) {
            console.log(colorize('❌ No language directories found!', 'red'));
            rl.close();
            return;
        }
        
        // 言語選択
        const selectedLanguages = await selectLanguages(availableLanguages);
        
        if (Object.keys(selectedLanguages).length === 0) {
            console.log(colorize('❌ No languages selected!', 'red'));
            rl.close();
            return;
        }
        
        // ベンチマークモード選択
        const modes = await selectBenchmarkMode();
        
        // タスク数選択
        const taskCount = await selectTaskCount();
        
        console.log(colorize(`\\n📝 Configuration:`, 'bright'));
        console.log(`Languages: ${Object.values(selectedLanguages).map(l => l.name).join(', ')}`);
        console.log(`Modes: ${modes.map(m => m.toUpperCase()).join(', ')}`);
        console.log(`Tasks: ${taskCount}`);
        
        const proceed = await ask(colorize('\\nProceed with benchmark? (y/N): ', 'cyan'));
        if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
            console.log(colorize('Benchmark cancelled.', 'yellow'));
            rl.close();
            return;
        }
        
        // ビルド実行
        await buildLanguages(selectedLanguages);
        
        if (Object.keys(selectedLanguages).length === 0) {
            console.log(colorize('❌ All builds failed!', 'red'));
            rl.close();
            return;
        }
        
        // ベンチマーク実行
        for (const mode of modes) {
            const results = await runAllBenchmarks(selectedLanguages, mode, taskCount);
            displayResults(results, mode);
            
            if (modes.length > 1 && mode !== modes[modes.length - 1]) {
                console.log(colorize('\\nPress Enter to continue to next benchmark...', 'dim'));
                await ask('');
            }
        }
        
        console.log(colorize('\\n🎉 All benchmarks completed!', 'bright'));
        
    } catch (error) {
        console.log(colorize(`❌ Unexpected error: ${error.message}`, 'red'));
    } finally {
        rl.close();
    }
}

// Ctrl+Cハンドリング
process.on('SIGINT', () => {
    console.log(colorize('\\n\\n👋 Benchmark interrupted by user', 'yellow'));
    rl.close();
    process.exit(0);
});

main();