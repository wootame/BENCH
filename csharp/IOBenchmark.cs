using System;
using System.IO;
using System.Threading.Tasks;
using System.Diagnostics;

namespace Benchmark
{
    public class IOBenchmark
    {
        private static Random random = new Random();

        static async Task CreateTestFiles(int count, string taskId)
        {
            var random = new Random();
            var tasks = new Task[count];
            for (int i = 0; i < count; i++)
            {
                int index = i;
                tasks[i] = Task.Run(async () =>
                {
                    var content = $"Test file {index} content with some data: {random.NextDouble()}";
                    var filename = $"temp_{taskId}_{index}.txt";
                    await File.WriteAllTextAsync(filename, content);
                });
            }
            await Task.WhenAll(tasks);
        }

        static async Task<string[]> ReadTestFiles(int count, string taskId)
        {
            var tasks = new Task<string>[count];
            for (int i = 0; i < count; i++)
            {
                int index = i;
                var filename = $"temp_{taskId}_{index}.txt";
                tasks[i] = Task.Run(async () =>
                {
                    // リトライロジック
                    for (int retry = 0; retry < 10; retry++)
                    {
                        try
                        {
                            if (File.Exists(filename))
                            {
                                return await File.ReadAllTextAsync(filename);
                            }
                            await Task.Delay(10);
                        }
                        catch (IOException)
                        {
                            if (retry == 9) throw;
                            await Task.Delay(10);
                        }
                    }
                    throw new FileNotFoundException($"File not found: {filename}");
                });
            }
            return await Task.WhenAll(tasks);
        }

        static async Task CleanupTestFiles(int count, string taskId)
        {
            for (int i = 0; i < count; i++)
            {
                try
                {
                    var filename = $"temp_{taskId}_{i}.txt";
                    if (File.Exists(filename))
                        File.Delete(filename);
                }
                catch { /* ignore */ }
            }
            await Task.CompletedTask;
        }

        static async Task SimulateNetworkDelay(int ms)
        {
            await Task.Delay(ms);
        }

        static async Task<int> IOIntensiveTask(string taskId)
        {
            int fileCount = 50;
            int networkCalls = 20;

            await CreateTestFiles(fileCount, taskId);

            var networkTasks = new Task[networkCalls];
            for (int i = 0; i < networkCalls; i++)
                networkTasks[i] = SimulateNetworkDelay(10 + (int)(new Random().NextDouble() * 20));

            var fileTask = ReadTestFiles(fileCount, taskId);

            await Task.WhenAll(fileTask, Task.WhenAll(networkTasks));

            await CleanupTestFiles(fileCount, taskId);
            return fileTask.Result.Length;
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
                        await IOIntensiveTask($"task{taskIndex}");
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