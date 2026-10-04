import { Response } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth";

// GET /api/tracker/latest — most recent packet from the hardware tracker,
// regardless of which victim/device it came from. Prototype-stage: no
// victim linkage yet, this just surfaces whatever the device last reported.
export const getLatestPacket = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const packet = await prisma.trackerPacket.findFirst({
    where: { latitude: { not: null }, longitude: { not: null } },
    orderBy: { receivedAt: "desc" },
  });
  res.json({ success: true, data: packet });
});
