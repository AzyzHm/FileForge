import { existsSync } from "fs";
import { execFileSync } from "child_process";
import path from "path";

function candidatePaths(): string[] {
  const paths: string[] = [];

  if (process.env.LIBREOFFICE_BIN_PATH) {
    paths.push(process.env.LIBREOFFICE_BIN_PATH);
  }

  switch (process.platform) {
    case "darwin":
      paths.push("/Applications/LibreOffice.app/Contents/MacOS/soffice");
      break;
    case "linux":
      paths.push(
        "/usr/bin/soffice",
        "/usr/bin/libreoffice",
        "/snap/bin/libreoffice",
        "/opt/libreoffice/program/soffice",
      );
      break;
    case "win32":
      paths.push(
        path.join(
          process.env["PROGRAMFILES(X86)"] ?? "",
          "LibreOffice/program/soffice.exe",
        ),
        path.join(
          process.env.PROGRAMFILES ?? "",
          "LibreOffice/program/soffice.exe",
        ),
        "C:/Program Files/LibreOffice/program/soffice.exe",
      );
      break;
    default:
      break;
  }

  return paths;
}

let cachedResult: boolean | null = null;

export function isSofficeAvailable(): boolean {
  if (cachedResult !== null) return cachedResult;

  const foundOnDisk = candidatePaths().some(
    (candidate) => candidate.length > 0 && existsSync(candidate),
  );

  if (foundOnDisk) {
    cachedResult = true;
    return cachedResult;
  }

  try {
    execFileSync("soffice", ["--version"], { stdio: "ignore" });
    cachedResult = true;
  } catch {
    cachedResult = false;
  }

  return cachedResult;
}
