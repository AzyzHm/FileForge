import {
  EXTENSION_BY_FORMAT,
  MIME_BY_FORMAT,
  type ImageFormat,
} from "../types/conversion";

const DEFAULT_JPEG_QUALITY = 0.92;
const FALLBACK_SIZE = 512;

export function detectImageFormat(file: File): ImageFormat | null {
  const type = file.type.toLowerCase();
  if (type === "image/png") return "png";
  if (type === "image/jpeg" || type === "image/jpg") return "jpeg";
  if (type === "image/svg+xml") return "svg";

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "png") return "png";
  if (extension === "jpg" || extension === "jpeg") return "jpeg";
  if (extension === "svg") return "svg";

  return null;
}

export function buildOutputFileName(
  originalName: string,
  targetFormat: ImageFormat,
): string {
  const baseName = originalName.includes(".")
    ? originalName.slice(0, originalName.lastIndexOf("."))
    : originalName;
  return `${baseName}.${EXTENSION_BY_FORMAT[targetFormat]}`;
}

export async function convertImage(
  file: File,
  targetFormat: ImageFormat,
  quality: number = DEFAULT_JPEG_QUALITY,
): Promise<Blob> {
  const sourceFormat = detectImageFormat(file);
  if (!sourceFormat) {
    throw new Error(
      `"${file.name}" is not a supported image type. Use PNG, JPG, or SVG.`,
    );
  }

  if (targetFormat === "svg") {
    return convertToSvg(file, sourceFormat);
  }

  const loaded = await loadImage(file, sourceFormat);
  try {
    const canvas = drawToCanvas(
      loaded.image,
      loaded.width,
      loaded.height,
      targetFormat,
    );
    return await canvasToBlob(canvas, MIME_BY_FORMAT[targetFormat], quality);
  } finally {
    loaded.revoke();
  }
}

async function convertToSvg(
  file: File,
  sourceFormat: ImageFormat,
): Promise<Blob> {
  if (sourceFormat === "svg") {
    return file.slice(0, file.size, MIME_BY_FORMAT.svg);
  }

  const loaded = await loadImage(file, sourceFormat);
  loaded.revoke();

  const dataUrl = await fileToDataUrl(file);
  const svg = buildSvgWrapper(dataUrl, loaded.width, loaded.height);
  return new Blob([svg], { type: MIME_BY_FORMAT.svg });
}

interface LoadedImage {
  image: HTMLImageElement;
  width: number;
  height: number;
  revoke: () => void;
}

async function loadImage(
  file: File,
  sourceFormat: ImageFormat,
): Promise<LoadedImage> {
  const objectUrl = URL.createObjectURL(file);
  const revoke = () => URL.revokeObjectURL(objectUrl);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(
          new Error(
            `"${file.name}" could not be read. It may be corrupted or unsupported.`,
          ),
        );
      img.src = objectUrl;
    });

    let width = image.naturalWidth;
    let height = image.naturalHeight;

    if ((!width || !height) && sourceFormat === "svg") {
      const intrinsic = await getSvgIntrinsicSize(file);
      width = intrinsic?.width ?? FALLBACK_SIZE;
      height = intrinsic?.height ?? FALLBACK_SIZE;
    }

    width = width || FALLBACK_SIZE;
    height = height || FALLBACK_SIZE;

    return { image, width, height, revoke };
  } catch (error) {
    revoke();
    throw error;
  }
}

function drawToCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
  targetFormat: Exclude<ImageFormat, "svg">,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D rendering is not available in this browser.");
  }

  if (targetFormat === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("The canvas could not produce image data."));
        }
      },
      mimeType,
      quality,
    );
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(new Error(`"${file.name}" could not be read.`));
    reader.readAsDataURL(file);
  });
}

function buildSvgWrapper(
  dataUrl: string,
  width: number,
  height: number,
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image href="${dataUrl}" width="${width}" height="${height}" />
</svg>
`;
}

async function getSvgIntrinsicSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  const text = await file.text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svgEl = doc.documentElement;

  if (svgEl.querySelector("parsererror")) {
    return null;
  }

  const width = parseFloat(svgEl.getAttribute("width") ?? "");
  const height = parseFloat(svgEl.getAttribute("height") ?? "");
  if (width > 0 && height > 0) {
    return { width, height };
  }

  const viewBox = svgEl.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }

  return null;
}
