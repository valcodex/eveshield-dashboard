import { Router } from "express";
import { getLatestPacket } from "../controllers/tracker.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);
router.get("/latest", getLatestPacket);

export default router;
