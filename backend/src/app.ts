import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { apiLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import victimsRoutes from "./routes/victims.routes";
import emergenciesRoutes, { assignResponderHandler, updateLocationHandler } from "./routes/emergencies.routes";
import respondersRoutes from "./routes/responders.routes";
import notificationsRoutes from "./routes/notifications.routes";
import dashboardRoutes from "./routes/dashboard.routes";

export function createApp() {
  const app = express();

  // --- Security & platform middleware -------------------------------------
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
  app.use("/api", apiLimiter);

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "eveshield-backend" }));

  // --- Routes ---------------------------------------------------------------
  app.use("/api/auth", authRoutes);
  app.use("/api/victims", victimsRoutes);
  app.use("/api/emergencies", emergenciesRoutes);
  app.use("/api/responders", respondersRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  // Top-level endpoints called directly by name in the spec
  app.post("/api/assignResponder", ...assignResponderHandler);
  app.post("/api/updateLocation", ...updateLocationHandler);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
