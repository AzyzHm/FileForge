import { Router } from "express";
import convertRoutes from "./convert.routes";

const router = Router();

router.use("/convert", convertRoutes);

export default router;
