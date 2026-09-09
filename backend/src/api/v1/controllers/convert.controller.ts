import { NextFunction, Request, Response } from "express";
import { dummyConvert } from "../../../services/convert.service";
import { enqueueConversion } from "../../../services/queue.service";
import { safeUnlink } from "../../../utils/safe-unlink";
import { BadRequestException } from "../../../exceptions/http-exceptions";

export class ConvertController {
  dummy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const file = req.file;
    if (!file) {
      next(
        new BadRequestException('No file was provided under the "file" field'),
      );
      return;
    }

    try {
      const result = await enqueueConversion(() =>
        dummyConvert(file.path, file.originalname),
      );

      res.download(result.outputPath, result.outputFilename, (downloadErr) => {
        void safeUnlink(file.path);
        void safeUnlink(result.outputPath);

        if (downloadErr && !res.headersSent) {
          next(downloadErr);
        }
      });
    } catch (err) {
      await safeUnlink(file.path);
      next(err);
    }
  };
}
