import { Router } from "express";
import { body } from "express-validator";
import { login, logout, me, refresh } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { loginLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post(
  "/login",
  loginLimiter,
  [body("email").isEmail().withMessage("Valid email required"), body("password").isString().notEmpty()],
  validate,
  login
);

router.post("/refresh", refresh);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;
