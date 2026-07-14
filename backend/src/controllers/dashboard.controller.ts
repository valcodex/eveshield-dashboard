import { Response } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth";

// GET /api/dashboard/stats — powers the four statistics cards on the homepage
export const getStats = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const [active, resolved, highPriority, awaitingResponse] = await Promise.all([
    prisma.emergency.count({ where: { status: { in: ["PENDING", "ACKNOWLEDGED", "DISPATCHED", "IN_PROGRESS"] } } }),
    prisma.emergency.count({ where: { status: "RESOLVED" } }),
    prisma.emergency.count({ where: { priority: { in: ["HIGH", "CRITICAL"] }, status: { not: "RESOLVED" } } }),
    prisma.emergency.count({ where: { status: "PENDING" } }),
  ]);

  res.json({
    success: true,
    data: {
      activeEmergencies: active,
      resolvedEmergencies: resolved,
      highPriorityAlerts: highPriority,
      victimsAwaitingResponse: awaitingResponse,
    },
  });
});
