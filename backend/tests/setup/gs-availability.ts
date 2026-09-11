import { existsSync } from "fs";
import { execFileSync } from "child_process";

function candidateNames(): string[] {
  const names: string[] = [];

  if (process.env.GHOSTSCRIPT_BIN_PATH) {
    names.push(process.env.GHOSTSCRIPT_BIN_PATH);
  }

  switch (process.platform) {
    case "win32":
      names.push("gswin64c", "gswin32c");
      break;
    default:
      names.push("gs");
      break;
  }

  return names;
}

let cachedResult: boolean | null = null;

export function isGhostscriptAvailable(): boolean {
  if (cachedResult !== null) return cachedResult;

  const foundOnDisk = candidateNames().some(
    (candidate) => candidate.includes("/") && existsSync(candidate),
  );

  if (foundOnDisk) {
    cachedResult = true;
    return cachedResult;
  }

  cachedResult = candidateNames().some((candidate) => {
    try {
      execFileSync(candidate, ["--version"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  });

  return cachedResult;
}
