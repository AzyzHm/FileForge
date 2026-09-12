import axios, { type AxiosProgressEvent } from "axios";

const DEFAULT_BASE_URL = "http://localhost:3000";

function readBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return configured && configured.length > 0 ? configured : DEFAULT_BASE_URL;
}

export const API_BASE_URL = readBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface ConvertOnServerOptions {
  path: string;
  file: File;
  fieldName?: string;
  fields?: Record<string, string>;
  fallbackFilename?: string;
  onUploadProgress?: (percent: number) => void;
  onDownloadProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export interface ConvertOnServerResult {
  blob: Blob;
  filename: string;
}

export function withExtension(filename: string, extension: string): string {
  const dotIndex = filename.lastIndexOf(".");
  const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  return `${base}.${extension}`;
}

function extractFilename(
  contentDisposition: unknown,
  fallback: string,
): string {
  if (typeof contentDisposition !== "string") {
    return fallback;
  }

  const match = /filename="?([^"; ]+)"?/.exec(contentDisposition);
  return match ? match[1] : fallback;
}

function toProgressHandler(
  onProgress?: (percent: number) => void,
): ((event: AxiosProgressEvent) => void) | undefined {
  if (!onProgress) {
    return undefined;
  }

  return (event: AxiosProgressEvent) => {
    if (event.total) {
      onProgress(Math.round((event.loaded / event.total) * 100));
    }
  };
}

function friendlyMessage(status: number, serverMessage?: string): string {
  switch (status) {
    case 400:
      return serverMessage ?? "The server could not process this request.";
    case 413:
      return "The file is too large to upload.";
    case 415:
      return "This file type isn't supported for this conversion.";
    case 503:
      return "The conversion service is temporarily unavailable. Please try again shortly.";
    case 504:
      return "The conversion timed out. Try a smaller file.";
    default:
      return serverMessage ?? "The conversion failed. Please try again.";
  }
}

async function readErrorMessage(data: unknown): Promise<string | undefined> {
  if (!(data instanceof Blob)) {
    return undefined;
  }

  try {
    const text = await data.text();
    const parsed: unknown = JSON.parse(text);
    if (
      parsed &&
      typeof parsed === "object" &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
    ) {
      return (parsed as { message: string }).message;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function convertFileOnServer({
  path,
  file,
  fieldName = "file",
  fields,
  fallbackFilename,
  onUploadProgress,
  onDownloadProgress,
  signal,
}: ConvertOnServerOptions): Promise<ConvertOnServerResult> {
  const formData = new FormData();
  formData.append(fieldName, file);

  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
  }

  try {
    const response = await apiClient.post<Blob>(path, formData, {
      responseType: "blob",
      signal,
      onUploadProgress: toProgressHandler(onUploadProgress),
      onDownloadProgress: toProgressHandler(onDownloadProgress),
    });

    const filename = extractFilename(
      response.headers["content-disposition"],
      fallbackFilename ?? file.name,
    );

    return { blob: response.data, filename };
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error;
    }

    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      const serverMessage = await readErrorMessage(data);
      throw new ApiError(friendlyMessage(status, serverMessage), status);
    }

    throw new ApiError(
      "Could not reach the conversion server. Check your connection and try again.",
      0,
    );
  }
}
