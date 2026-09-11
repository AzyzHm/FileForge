import { NextFunction, Request, Response } from "express";
import {
  CompressPdfOptions,
  compressPdf as compressPdfService,
  ConversionResult,
  convertPdfToWord,
  convertWordToPdf,
  dummyConvert,
} from "../../../services/convert.service";
import { enqueueConversion } from "../../../services/queue.service";
import { safeUnlink } from "../../../utils/safe-unlink";
import { BadRequestException } from "../../../exceptions/http-exceptions";

type ConversionFn<Options = void> = (
  inputPath: string,
  originalFilename: string,
  options: Options,
) => Promise<ConversionResult>;

export class ConvertController {
  private runConversion<Options = void>(
    convert: ConversionFn<Options>,
    extractOptions?: (req: Request) => Options,
  ) {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const file = req.file;
      if (!file) {
        next(
          new BadRequestException(
            'No file was provided under the "file" field',
          ),
        );
        return;
      }

      try {
        const options = extractOptions
          ? extractOptions(req)
          : (undefined as Options);

        const result = await enqueueConversion(() =>
          convert(file.path, file.originalname, options),
        );

        res.download(
          result.outputPath,
          result.outputFilename,
          (downloadErr) => {
            void safeUnlink(file.path);
            void safeUnlink(result.outputPath);

            if (downloadErr && !res.headersSent) {
              next(downloadErr);
            }
          },
        );
      } catch (err) {
        await safeUnlink(file.path);
        next(err);
      }
    };
  }

  dummy = this.runConversion(dummyConvert);

  wordToPdf = this.runConversion(convertWordToPdf);

  pdfToWord = this.runConversion(convertPdfToWord);

  compressPdf = this.runConversion<CompressPdfOptions>(
    compressPdfService,
    (req) => ({ quality: (req.body as { quality?: string })?.quality }),
  );
}
