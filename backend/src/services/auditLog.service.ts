import { prisma } from "../config/prisma";

interface AuditLogInput {
  userId?: string;
  emergencyId?: string;
  action: string;
  details?: string;
  ipAddress?: string;
}

// Every sensitive action (login, assign responder, status change, resolve...)
// writes an immutable audit trail entry.
export async function writeAuditLog(input: AuditLogInput) {
  await prisma.auditLog.create({ data: input });
}
