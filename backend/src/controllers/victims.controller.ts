import { Response } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../middleware/auth";

// GET /api/victims?search=&page=&pageSize=
export const listVictims = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { search } = req.query as { search?: string };
  const page = Number(req.query.page ?? 1);
  const pageSize = Math.min(Number(req.query.pageSize ?? 25), 100);

  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { phoneNumber: { contains: search, mode: "insensitive" as const } },
          { victimCode: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [victims, total] = await Promise.all([
    prisma.victim.findMany({
      where,
      include: { emergencyContacts: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.victim.count({ where }),
  ]);

  res.json({ success: true, data: victims, meta: { page, pageSize, total } });
});

// GET /api/victims/:id
export const getVictim = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const victim = await prisma.victim.findUnique({
    where: { id: req.params.id },
    include: {
      emergencyContacts: true,
      locations: { orderBy: { recordedAt: "desc" }, take: 1 },
      emergencies: {
        orderBy: { triggeredAt: "desc" },
        take: 10,
      },
    },
  });

  if (!victim) throw new AppError("Victim not found", 404);
  res.json({ success: true, data: victim });
});
