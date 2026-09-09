import os from "os";
import path from "path";
import crypto from "crypto";
import multer, { MulterError } from "multer";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { PayloadTooLargeException } from "../exceptions/http-exceptions";

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, os.tmpdir());
  },
  filename: (_req, file, callback) => {
    const uniqueName = `fileforge-${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.maxUploadBytes,
    files: 1,
  },
});

export function uploadSingleFile(fieldName: string) {
  const middleware = upload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction): void => {
    middleware(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }

      if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
        const maxMb = (env.maxUploadBytes / (1024 * 1024)).toFixed(0);
        next(
          new PayloadTooLargeException(
            `File exceeds the ${maxMb} MB upload limit`,
          ),
        );
        return;
      }

      next(err);
    });
  };
}
