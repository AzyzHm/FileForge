import {
  enqueueConversion,
  getQueueStats,
} from "../../../src/services/queue.service";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("queue.service", () => {
  it("runs a single task and resolves with its result", async () => {
    const result = await enqueueConversion(async () => "done");
    expect(result).toBe("done");
  });

  it("propagates a rejected task to the caller", async () => {
    await expect(
      enqueueConversion(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });

  it("never runs more than one queued task at the same time", async () => {
    let activeCount = 0;
    let maxActiveCount = 0;

    const makeTask = () => async () => {
      activeCount += 1;
      maxActiveCount = Math.max(maxActiveCount, activeCount);
      await wait(20);
      activeCount -= 1;
      return activeCount;
    };

    await Promise.all([
      enqueueConversion(makeTask()),
      enqueueConversion(makeTask()),
      enqueueConversion(makeTask()),
    ]);

    expect(maxActiveCount).toBe(1);
  });

  it("reports queue stats as an object with size and pending counts", async () => {
    const stats = await getQueueStats();
    expect(stats).toEqual(
      expect.objectContaining({
        size: expect.any(Number),
        pending: expect.any(Number),
      }),
    );
  });
});
