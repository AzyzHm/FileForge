import { Router } from "express";
import { ConvertController } from "../controllers/convert.controller";
import { uploadSingleFile } from "../../../middlewares/upload.middleware";

const router = Router();
const convertController = new ConvertController();

router.post("/dummy", uploadSingleFile("file"), convertController.dummy);

export default router;
