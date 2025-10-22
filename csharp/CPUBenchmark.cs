using System;
using System.Threading;
using System.Threading.Tasks;

namespace Benchmark
{
    public class CPUBenchmark
    {
        private static readonly ThreadLocal<Random> threadLocalRandom = new(() => new Random(Environment.TickCount * Thread.CurrentThread.ManagedThreadId));

        private static double HeavyComputation(int n)
        {
            var random = threadLocalRandom.Value!;
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
            HeavyComputation(1000); // warm-up

            var start = DateTime.Now;
            var iterationsPerTask = 10_000_000;

            Parallel.For(0, taskCount, new ParallelOptions
            {
                MaxDegreeOfParallelism = Environment.ProcessorCount
            }, i =>
            {
                HeavyComputation(iterationsPerTask);
            });

            var elapsed = DateTime.Now - start;
            Console.WriteLine($"All {taskCount} tasks done in {elapsed.TotalSeconds:F4}s");
        }
    }
}