using System;

namespace Benchmark
{
    public class CPUBenchmark
    {
        private static Random random = new Random();

        private static double HeavyComputation(int n)
        {
            double sum = 0.0;
            for (int i = 0; i < n; i++)
            {
                sum += Math.Sqrt(i * random.NextDouble());
            }
            return sum;
        }

        public static void RunCPUBenchmark(int taskCount)
        {
            Console.WriteLine("C# benchmark start");

            var start = DateTime.Now;
            var iterationsPerTask = 10_000_000; // 1千万回

            for (int i = 0; i < taskCount; i++)
            {
                var result = HeavyComputation(iterationsPerTask);
                Console.WriteLine($"Task {i + 1} done");
            }

            var elapsed = DateTime.Now - start;
            Console.WriteLine($"All {taskCount} tasks done in {elapsed.TotalSeconds:F4}s");
        }
    }
}