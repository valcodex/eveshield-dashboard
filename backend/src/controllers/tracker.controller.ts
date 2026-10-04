import { Response } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth";

// GET /api/tracker/latest — most recent packet from the hardware tracker,
// regardless of which victim/device it came from. Prototype-stage: no
// victim linkage yet, this just surfaces whatever the device last reported.
export const getLatestPacket = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  // This is polled every few seconds by the dashboard — explicitly disable
  // caching so the browser never serves a stale 304 instead of fresh data.
  res.set("Cache-Control", "no-store");

  const packet = await prisma.trackerPacket.findFirst({
    where: { latitude: { not: null }, longitude: { not: null } },
    orderBy: { receivedAt: "desc" },
  });

  // Prisma's BigInt `id` (from the BIGSERIAL column) can't be serialized by
  // JSON.stringify directly — it throws rather than converting silently.
  // Convert it to a string for the response; the frontend already types
  // `id` as string, so no frontend change is needed.
  const serialized = packet ? { ...packet, id: packet.id.toString() } : null;

  res.json({ success: true, data: serialized });
});
