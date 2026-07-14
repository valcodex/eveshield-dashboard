import { Router } from "express";
import { listResponders } from "../controllers/responders.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);
router.get("/", listResponders);

export default router;
