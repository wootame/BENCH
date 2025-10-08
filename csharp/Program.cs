using System;
using System.Threading.Tasks;

namespace Benchmark
{
    class Program
    {
        static async Task Main(string[] args)
        {
            int taskCount = 10; // default
            bool isIOMode = false;
            
            // Parse command line arguments
            foreach (string arg in args)
            {
                if (arg == "io")
                {
                    isIOMode = true;
                }
                else if (int.TryParse(arg, out int count))
                {
                    taskCount = count;
                }
            }
            
            if (isIOMode)
            {
                await IOBenchmark.RunIOBenchmark(taskCount);
            }
            else
            {
                CPUBenchmark.RunCPUBenchmark(taskCount);
            }
        }
    }
}