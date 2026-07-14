import { Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { writeAuditLog } from "../services/auditLog.service";
import { AuthenticatedRequest } from "../middleware/auth";

const REFRESH_COOKIE = "eveshield_refresh_token";

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  };
}

export const login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "LOGIN",
    ipAddress: req.ip,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

  res.json({
    success: true,
    data: {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    },
  });
});

export const refresh = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new AppError("Refresh token missing", 401);

  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new AppError("Refresh token no longer valid", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw new AppError("User no longer active", 401);

  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  res.json({ success: true, data: { accessToken } });
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
  }
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });

  if (req.user) {
    await writeAuditLog({ userId: req.user.id, action: "LOGOUT", ipAddress: req.ip });
  }

  res.json({ success: true, message: "Logged out" });
});

export const me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      organization: true,
      phone: true,
    },
  });
  res.json({ success: true, data: user });
});
