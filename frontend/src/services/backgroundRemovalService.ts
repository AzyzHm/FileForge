import type { Config } from "@imgly/background-removal";

export function isRemovableImage(file: File): boolean {
  const type = file.type.toLowerCase();
  if (
    type === "image/png" ||
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/webp"
  ) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    extension === "png" ||
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "webp"
  );
}

export function buildTransparentFileName(originalName: string): string {
  const dotIndex = originalName.lastIndexOf(".");
  const base = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  return `${base}-no-bg.png`;
}

export async function removeImageBackground(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<File> {
  if (!isRemovableImage(file)) {
    throw new Error(
      `"${file.name}" is not a supported image type. Use PNG, JPG, or WEBP.`,
    );
  }

  try {
    const { removeBackground } = await import("@imgly/background-removal");

    const config: Config = {
      output: { format: "image/png" },
      progress: (_key, current, total) => {
        if (onProgress && total > 0) {
          onProgress(Math.round((current / total) * 100));
        }
      },
    };

    const blob = await removeBackground(file, config);
    return new File([blob], buildTransparentFileName(file.name), {
      type: "image/png",
    });
  } catch {
    throw new Error(
      `"${file.name}" could not be processed. It may be corrupted or unsupported.`,
    );
  }
}
