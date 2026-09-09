import { promises as fs } from "fs";
import { logger } from "../config/logger";

export async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return;
    logger.warn({ err, filePath }, "Failed to clean up temporary file");
  }
}
