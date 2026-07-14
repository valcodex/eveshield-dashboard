import { Router } from "express";
import { createNotification, listNotifications } from "../controllers/notifications.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);
router.get("/", listNotifications);
router.post("/", createNotification);

export default router;
