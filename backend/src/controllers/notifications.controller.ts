import { Response } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import { broadcast, SOCKET_EVENTS } from "../socket";

// GET /api/notifications — latest broadcast + user-specific notifications
export const listNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { OR: [{ userId: null }, { userId: req.user!.id }] },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ success: true, data: notifications });
});

// POST /api/notifications — create + broadcast a manual/system notification
export const createNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { type, title, message, emergencyId, userId } = req.body;
  const notification = await prisma.notification.create({
    data: { type, title, message, emergencyId, userId },
  });
  broadcast(SOCKET_EVENTS.NOTIFICATION, notification);
  res.status(201).json({ success: true, data: notification });
});
