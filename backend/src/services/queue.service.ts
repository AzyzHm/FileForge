import type PQueue from "p-queue" with { "resolution-mode": "import" };

let queuePromise: Promise<PQueue> | null = null;

function getQueue(): Promise<PQueue> {
  if (!queuePromise) {
    queuePromise = import("p-queue").then(
      (mod) => new mod.default({ concurrency: 1 }),
    );
  }
  return queuePromise;
}

export async function enqueueConversion<T>(task: () => Promise<T>): Promise<T> {
  const queue = await getQueue();
  return (await queue.add(task)) as T;
}

export async function getQueueStats(): Promise<{
  size: number;
  pending: number;
}> {
  const queue = await getQueue();
  return { size: queue.size, pending: queue.pending };
}
