import { Router } from "express";
import { ConvertController } from "../controllers/convert.controller";
import { uploadSingleFile } from "../../../middlewares/upload.middleware";

const router = Router();
const convertController = new ConvertController();

router.post("/dummy", uploadSingleFile("file"), convertController.dummy);
router.post(
  "/word-to-pdf",
  uploadSingleFile("file"),
  convertController.wordToPdf,
);
router.post(
  "/pdf-to-word",
  uploadSingleFile("file"),
  convertController.pdfToWord,
);
router.post(
  "/compress-pdf",
  uploadSingleFile("file"),
  convertController.compressPdf,
);

export default router;
