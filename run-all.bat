@echo off

REM Parse command line arguments
set QUIET_MODE=0
set TASK_COUNT=10

REM Check all parameters
:parse_args
if "%1"=="" goto start_benchmark
if "%1"=="-only" (
    set QUIET_MODE=1
    shift
    goto parse_args
)
REM Check if it's a number (task count)
echo %1| findstr /r "^[0-9][0-9]*$" >nul
if %errorlevel%==0 (
    set TASK_COUNT=%1
    shift
    goto parse_args
)
shift
goto parse_args

:start_benchmark

if %QUIET_MODE%==0 (
    echo =====================================
    echo Running Node.js benchmark...
    echo =====================================
)
cd node
if %QUIET_MODE%==1 (
    for /f "tokens=*" %%i in ('node index.js %TASK_COUNT% ^| findstr /c:"All %TASK_COUNT% tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo Node.js: %%j done
    )
) else (
    node index.js %TASK_COUNT%
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo Building Go benchmark...
    echo =====================================
)
cd go
if %QUIET_MODE%==1 (
    go build -o go.exe >nul 2>&1
    for /f "tokens=*" %%i in ('go.exe %TASK_COUNT% ^| findstr /c:"All %TASK_COUNT% tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo Go: %%j done
    )
) else (
    go build -o go.exe
    echo Running Go benchmark...
    go.exe %TASK_COUNT%
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo Building Rust benchmark...
    echo =====================================
)
cd rust
if %QUIET_MODE%==1 (
    cargo build --release >nul 2>&1
    for /f "tokens=*" %%i in ('target\release\rust.exe %TASK_COUNT% ^| findstr /c:"All %TASK_COUNT% tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo Rust: %%j done
    )
) else (
    cargo build --release
    echo Running Rust benchmark...
    target\release\rust.exe %TASK_COUNT%
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo Running Ruby benchmark...
    echo =====================================
)
cd ruby
if %QUIET_MODE%==1 (
    for /f "tokens=*" %%i in ('ruby benchmark.rb %TASK_COUNT% ^| findstr /c:"All %TASK_COUNT% tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo Ruby: %%j done
    )
) else (
    ruby benchmark.rb %TASK_COUNT%
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo Running Python benchmark...
    echo =====================================
)
cd python
if %QUIET_MODE%==1 (
    for /f "tokens=*" %%i in ('python benchmark.py %TASK_COUNT% ^| findstr /c:"All %TASK_COUNT% tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo Python: %%j done
    )
) else (
    python benchmark.py %TASK_COUNT%
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo Building C# benchmark...
    echo =====================================
)
cd csharp
if %QUIET_MODE%==1 (
    dotnet build -c Release >nul 2>&1
    for /f "tokens=*" %%i in ('dotnet run -c Release -- %TASK_COUNT% ^| findstr /c:"All %TASK_COUNT% tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo C#: %%j done
    )
) else (
    dotnet build -c Release
    echo Running C# benchmark...
    dotnet run -c Release -- %TASK_COUNT%
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo Building C++ benchmark...
    echo =====================================
)
cd cpp
if %QUIET_MODE%==1 (
    g++ -std=c++17 -O3 -o benchmark.exe benchmark.cpp cpu_benchmark.cpp io_benchmark.cpp >nul 2>&1
    for /f "tokens=*" %%i in ('benchmark.exe %TASK_COUNT% ^| findstr /c:"All %TASK_COUNT% tasks done in"') do (
        for /f "tokens=6" %%j in ("%%i") do echo C++: %%j done
    )
) else (
    g++ -std=c++17 -O3 -o benchmark.exe benchmark.cpp cpu_benchmark.cpp io_benchmark.cpp
    echo Running C++ benchmark...
    benchmark.exe %TASK_COUNT%
)
cd ..

if %QUIET_MODE%==0 (
    echo =====================================
    echo All benchmarks completed!
    echo =====================================
    pause
) else (
    echo.
    echo All benchmarks completed!
)
