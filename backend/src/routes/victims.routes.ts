import { Router } from "express";
import { getVictim, listVictims } from "../controllers/victims.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);
router.get("/", listVictims);
router.get("/:id", getVictim);

export default router;
