@echo off

REM Check for -only parameter
set QUIET_MODE=0
if "%1"=="-only" set QUIET_MODE=1

if %QUIET_MODE%==0 (
    echo =====================================
    echo Running Node.js I/O benchmark...
    echo =====================================
)
cd node
if %QUIET_MODE%==1 (
    for /f "tokens=*" %%i in ('node index.js io ^| findstr /c:"All 10 tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo Node.js: %%j done
    )
) else (
    node index.js io
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo Building Go I/O benchmark...
    echo =====================================
)
cd go
if %QUIET_MODE%==1 (
    go build -o go.exe >nul 2>&1
    for /f "tokens=*" %%i in ('go.exe io ^| findstr /c:"All 10 tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo Go: %%j done
    )
) else (
    go build -o go.exe
    echo Running Go I/O benchmark...
    go.exe io
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo Building Rust I/O benchmark...
    echo =====================================
)
cd rust
if %QUIET_MODE%==1 (
    cargo build --release >nul 2>&1
    for /f "tokens=*" %%i in ('target\release\rust.exe io ^| findstr /c:"All 10 tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo Rust: %%j done
    )
) else (
    cargo build --release
    echo Running Rust I/O benchmark...
    target\release\rust.exe io
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo Installing Ruby gems and running I/O benchmark...
    echo =====================================
)
cd ruby
if %QUIET_MODE%==1 (
    gem install concurrent-ruby >nul 2>&1
    for /f "tokens=*" %%i in ('ruby benchmark.rb io ^| findstr /c:"All 10 tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo Ruby: %%j done
    )
) else (
    gem install concurrent-ruby
    echo Running Ruby I/O benchmark...
    ruby benchmark.rb io
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo Running Python I/O benchmark...
    echo =====================================
)
cd python
if %QUIET_MODE%==1 (
    for /f "tokens=*" %%i in ('python benchmark.py io ^| findstr /c:"All 10 tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo Python: %%j done
    )
) else (
    python benchmark.py io
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo Building C# I/O benchmark...
    echo =====================================
)
cd csharp
if %QUIET_MODE%==1 (
    dotnet build -c Release >nul 2>&1
    for /f "tokens=*" %%i in ('dotnet run -c Release -- io ^| findstr /c:"All 10 tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo C#: %%j done
    )
) else (
    dotnet build -c Release
    echo Running C# I/O benchmark...
    dotnet run -c Release -- io
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo Building C++ I/O benchmark...
    echo =====================================
)
cd cpp
if %QUIET_MODE%==1 (
    g++ -std=c++17 -O3 -o benchmark.exe benchmark.cpp cpu_benchmark.cpp io_benchmark.cpp >nul 2>&1
    for /f "tokens=*" %%i in ('benchmark.exe io ^| findstr /c:"All 10 tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo C++: %%j done
    )
) else (
    g++ -std=c++17 -O3 -o benchmark.exe benchmark.cpp cpu_benchmark.cpp io_benchmark.cpp
    echo Running C++ I/O benchmark...
    benchmark.exe io %TASK_COUNT%
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo All I/O benchmarks completed!
    echo =====================================
    pause
) else (
    echo.
    echo All I/O benchmarks completed!
)