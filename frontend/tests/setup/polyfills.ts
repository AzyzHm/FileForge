import { Blob, File } from "node:buffer";
import { fetch, FormData, Headers, Request, Response } from "undici";

Object.defineProperties(globalThis, {
  Blob: { value: Blob, configurable: true },
  File: { value: File, configurable: true },
  Headers: { value: Headers, configurable: true },
  FormData: { value: FormData, configurable: true },
  Request: { value: Request, configurable: true },
  Response: { value: Response, configurable: true },
  fetch: { value: fetch, configurable: true, writable: true },
});
