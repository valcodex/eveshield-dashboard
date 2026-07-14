import { Response } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth";

// GET /api/responders?type=&status=
export const listResponders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { type, status } = req.query as { type?: string; status?: string };
  const responders = await prisma.responder.findMany({
    where: {
      ...(type ? { type: type as never } : {}),
      ...(status ? { status: status as never } : {}),
    },
    include: { user: { select: { id: true, fullName: true, email: true, phone: true } } },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ success: true, data: responders });
});
