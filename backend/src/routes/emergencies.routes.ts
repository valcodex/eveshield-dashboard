import { Router } from "express";
import { body } from "express-validator";
import {
  assignResponder,
  createEmergency,
  getEmergency,
  listEmergencies,
  updateEmergency,
  updateLocation,
} from "../controllers/emergencies.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.use(requireAuth);

router.get("/", listEmergencies);
router.get("/:id", getEmergency);

router.post(
  "/",
  [body("latitude").isFloat(), body("longitude").isFloat()],
  validate,
  createEmergency
);

router.patch(
  "/:id",
  requireRole("ORG_ADMIN", "ORG_OPERATOR", "POLICE", "MEDICAL"),
  updateEmergency
);

export default router;

// Exported separately because these two live at the top level of /api
// per the spec (POST /assignResponder, POST /updateLocation) rather than
// nested under /emergencies — mounted directly in app.ts.
export const assignResponderHandler = [
  requireAuth,
  requireRole("ORG_ADMIN", "ORG_OPERATOR"),
  [body("emergencyId").isString(), body("responderId").isString()],
  validate,
  assignResponder,
];

export const updateLocationHandler = [
  requireAuth,
  [body("victimId").isString(), body("latitude").isFloat(), body("longitude").isFloat()],
  validate,
  updateLocation,
];
