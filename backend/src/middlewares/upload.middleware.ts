import os from "os";
import path from "path";
import crypto from "crypto";
import multer, { MulterError } from "multer";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import {
  BadRequestException,
  PayloadTooLargeException,
} from "../exceptions/http-exceptions";
import { safeUnlink } from "../utils/safe-unlink";

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
        if (req.file && req.file.size === 0) {
          void safeUnlink(req.file.path);
          next(new BadRequestException("The uploaded file is empty"));
          return;
        }

        next();
        return;
      }

      if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          const maxMb = (env.maxUploadBytes / (1024 * 1024)).toFixed(0);
          next(
            new PayloadTooLargeException(
              `File exceeds the ${maxMb} MB upload limit`,
            ),
          );
          return;
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          next(
            new BadRequestException(
              `File must be uploaded under the "${fieldName}" field`,
            ),
          );
          return;
        }

        if (err.code === "LIMIT_FILE_COUNT") {
          next(
            new BadRequestException("Only one file may be uploaded at a time"),
          );
          return;
        }
        next(new BadRequestException(err.message));
        return;
      }
      next(err);
    });
  };
}
