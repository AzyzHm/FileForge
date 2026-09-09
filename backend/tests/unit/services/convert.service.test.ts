import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { dummyConvert } from "../../../src/services/convert.service";

describe("convert.service dummyConvert", () => {
  const tmpInputs: string[] = [];
  const tmpOutputs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      [...tmpInputs, ...tmpOutputs].map((filePath) =>
        fs.unlink(filePath).catch(() => undefined),
      ),
    );
    tmpInputs.length = 0;
    tmpOutputs.length = 0;
  });

  it("reads the input file and writes a converted output file to the tmp dir", async () => {
    const inputPath = path.join(
      os.tmpdir(),
      `convert-service-test-${Date.now()}.txt`,
    );
    const inputContent = "hello fileforge";
    await fs.writeFile(inputPath, inputContent, "utf-8");
    tmpInputs.push(inputPath);

    const result = await dummyConvert(inputPath, "original.txt");
    tmpOutputs.push(result.outputPath);

    expect(result.inputBytes).toBe(Buffer.byteLength(inputContent));
    expect(result.outputBytes).toBeGreaterThan(0);
    expect(path.dirname(result.outputPath)).toBe(os.tmpdir());

    const outputContent = await fs.readFile(result.outputPath, "utf-8");
    expect(outputContent).toContain("FileForge dummy conversion");
    expect(outputContent).toContain("original.txt");
    expect(outputContent).toContain(String(inputContent.length));
  });

  it("rejects when the input file does not exist", async () => {
    const missingPath = path.join(
      os.tmpdir(),
      `does-not-exist-${Date.now()}.txt`,
    );
    await expect(dummyConvert(missingPath, "missing.txt")).rejects.toThrow();
  });
});
