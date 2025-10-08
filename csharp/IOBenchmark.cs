using System;
using System.IO;
using System.Threading.Tasks;
using System.Threading;

namespace Benchmark
{
    public class IOBenchmark
    {
        private static Random random = new Random();

        private static async Task CreateTestFiles(int count)
        {
            var tasks = new Task[count];
            for (int i = 0; i < count; i++)
            {
                int index = i; // Capture for closure
                tasks[i] = Task.Run(() =>
                {
                    var content = $"Test file {index} content with some data: {random.NextDouble()}";
                    var filename = $"temp_{index}.txt";
                    File.WriteAllText(filename, content);
                });
            }

            await Task.WhenAll(tasks);
        }

        private static async Task<string[]> ReadTestFiles(int count)
        {
            var results = new string[count];
            var tasks = new Task[count];

            for (int i = 0; i < count; i++)
            {
                int index = i; // Capture for closure
                tasks[i] = Task.Run(() =>
                {
                    var filename = $"temp_{index}.txt";
                    results[index] = File.ReadAllText(filename);
                });
            }

            await Task.WhenAll(tasks);
            return results;
        }

        private static async Task CleanupTestFiles(int count)
        {
            var tasks = new Task[count];
            for (int i = 0; i < count; i++)
            {
                int index = i; // Capture for closure
                tasks[i] = Task.Run(() =>
                {
                    try
                    {
                        var filename = $"temp_{index}.txt";
                        File.Delete(filename);
                    }
                    catch
                    {
                        // Ignore errors
                    }
                });
            }

            await Task.WhenAll(tasks);
        }

        private static async Task SimulateNetworkDelay(int ms)
        {
            await Task.Delay(ms);
        }

        private static async Task<int> IOIntensiveTask()
        {
            var fileCount = 50;
            var networkCalls = 20;

            // Create files concurrently
            await CreateTestFiles(fileCount);

            // Simulate network calls with delays
            var networkTasks = new Task[networkCalls];
            for (int i = 0; i < networkCalls; i++)
            {
                var delay = 10 + random.Next(20);
                networkTasks[i] = SimulateNetworkDelay(delay);
            }

            // Read files concurrently while network calls are happening
            var fileContentsTask = ReadTestFiles(fileCount);
            var networkTask = Task.WhenAll(networkTasks);

            var fileContents = await fileContentsTask;
            await networkTask;

            // Cleanup
            await CleanupTestFiles(fileCount);

            return fileContents.Length;
        }

        public static async Task RunIOBenchmark(int taskCount)
        {
            Console.WriteLine("C# I/O benchmark start");

            var start = DateTime.Now;

            var tasks = new Task[taskCount];
            for (int i = 0; i < taskCount; i++)
            {
                int taskIndex = i; // Capture for closure
                tasks[i] = Task.Run(async () =>
                {
                    try
                    {
                        await IOIntensiveTask();
                        Console.WriteLine($"Task {taskIndex + 1} done");
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine($"Task {taskIndex + 1} failed: {e.Message}");
                    }
                });
            }

            await Task.WhenAll(tasks);

            var elapsed = DateTime.Now - start;
            Console.WriteLine($"All {taskCount} tasks done in {elapsed.TotalSeconds:F4}s");
        }
    }
}