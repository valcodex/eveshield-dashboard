import { Response } from "express";
import { EmergencyStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../middleware/auth";
import { generateEmergencyCode, generateVictimCode } from "../utils/codeGenerators";
import { writeAuditLog } from "../services/auditLog.service";
import { broadcast, SOCKET_EVENTS } from "../socket";

const emergencyInclude = {
  victim: { include: { emergencyContacts: true, locations: { orderBy: { recordedAt: "desc" as const }, take: 1 } } },
  updates: { orderBy: { createdAt: "asc" as const } },
  responders: { include: { responder: { include: { user: true } } } },
  assignedOperator: { select: { id: true, fullName: true, role: true } },
  locations: { orderBy: { recordedAt: "desc" as const }, take: 1 },
} satisfies Prisma.EmergencyInclude;

// GET /api/emergencies?status=&priority=&type=&region=&search=
export const listEmergencies = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, priority, type, region, search } = req.query as Record<string, string | undefined>;

  const where: Prisma.EmergencyWhereInput = {
    ...(status ? { status: status as EmergencyStatus } : {}),
    ...(priority ? { priority: priority as Prisma.EnumEmergencyPriorityFilter["equals"] } : {}),
    ...(type ? { type: type as Prisma.EnumEmergencyTypeFilter["equals"] } : {}),
    ...(region ? { region } : {}),
    ...(search
      ? {
          OR: [
            { emergencyCode: { contains: search, mode: "insensitive" } },
            { victim: { fullName: { contains: search, mode: "insensitive" } } },
            { victim: { victimCode: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const emergencies = await prisma.emergency.findMany({
    where,
    include: emergencyInclude,
    orderBy: [{ priority: "desc" }, { triggeredAt: "desc" }],
    take: 200,
  });

  res.json({ success: true, data: emergencies });
});

// GET /api/emergencies/:id
export const getEmergency = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const emergency = await prisma.emergency.findUnique({
    where: { id: req.params.id },
    include: emergencyInclude,
  });
  if (!emergency) throw new AppError("Emergency not found", 404);
  res.json({ success: true, data: emergency });
});

// POST /api/emergencies
// Called by the EveShield mobile app's panic-button backend integration
// (or by an operator creating a manual entry). Creates/links the victim,
// opens the emergency, records the initial timeline events, and broadcasts
// it to every connected dashboard client in real time.
export const createEmergency = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { victim, type, priority, latitude, longitude, region } = req.body as {
    victim: {
      id?: string;
      fullName?: string;
      phoneNumber?: string;
      gender?: string;
      age?: number;
      bloodGroup?: string;
      medicalNotes?: string;
      profilePhotoUrl?: string;
      emergencyContacts?: { name: string; phone: string; relation?: string }[];
    };
    type?: string;
    priority?: string;
    latitude: number;
    longitude: number;
    region?: string;
  };

  if (latitude === undefined || longitude === undefined) {
    throw new AppError("latitude and longitude are required", 422);
  }

  const result = await prisma.$transaction(async (tx) => {
    let victimRecord = victim.id
      ? await tx.victim.findUnique({ where: { id: victim.id } })
      : null;

    if (!victimRecord) {
      if (!victim.fullName || !victim.phoneNumber) {
        throw new AppError("victim.fullName and victim.phoneNumber are required for new victims", 422);
      }
      const victimCount = await tx.victim.count();
      victimRecord = await tx.victim.create({
        data: {
          victimCode: generateVictimCode(victimCount + 1),
          fullName: victim.fullName,
          phoneNumber: victim.phoneNumber,
          gender: victim.gender,
          age: victim.age,
          bloodGroup: victim.bloodGroup,
          medicalNotes: victim.medicalNotes,
          profilePhotoUrl: victim.profilePhotoUrl,
          emergencyContacts: victim.emergencyContacts
            ? { createMany: { data: victim.emergencyContacts } }
            : undefined,
        },
      });
    }

    const emergencyCount = await tx.emergency.count();
    const emergency = await tx.emergency.create({
      data: {
        emergencyCode: generateEmergencyCode(emergencyCount + 1),
        victimId: victimRecord.id,
        type: (type as Prisma.EmergencyCreateInput["type"]) ?? "GENERAL",
        priority: (priority as Prisma.EmergencyCreateInput["priority"]) ?? "HIGH",
        status: "PENDING",
        region,
        updates: {
          createMany: {
            data: [
              { eventType: "PANIC_TRIGGERED", message: "Panic button activated" },
              { eventType: "GPS_RECEIVED", message: `GPS location received (${latitude.toFixed(5)}, ${longitude.toFixed(5)})` },
            ],
          },
        },
        locations: {
          create: { victimId: victimRecord.id, latitude, longitude },
        },
      },
      include: emergencyInclude,
    });

    await tx.notification.create({
      data: {
        type: "NEW_ALERT",
        title: "New panic alert",
        message: `${victimRecord.fullName} triggered a panic alert`,
        emergencyId: emergency.id,
      },
    });

    return emergency;
  });

  await writeAuditLog({
    userId: req.user?.id,
    emergencyId: result.id,
    action: "CREATE_EMERGENCY",
    ipAddress: req.ip,
  });

  broadcast(SOCKET_EVENTS.NEW_EMERGENCY, result);
  broadcast(SOCKET_EVENTS.NOTIFICATION, {
    type: "NEW_ALERT",
    title: "New panic alert",
    message: `${result.victim.fullName} triggered a panic alert`,
    emergencyId: result.id,
  });

  res.status(201).json({ success: true, data: result });
});

// PATCH /api/emergencies/:id
// Generic update endpoint: status changes, priority changes, notes, escalation.
export const updateEmergency = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, priority, note, escalate, requestBackup } = req.body as {
    status?: EmergencyStatus;
    priority?: string;
    note?: string;
    escalate?: boolean;
    requestBackup?: boolean;
  };

  const existing = await prisma.emergency.findUnique({ where: { id } });
  if (!existing) throw new AppError("Emergency not found", 404);

  const updateData: Prisma.EmergencyUpdateInput = {};
  const timelineEvents: { eventType: string; message: string; actorId?: string }[] = [];

  if (status) {
    updateData.status = status;
    timelineEvents.push({
      eventType: "STATUS_CHANGED",
      message: `Status changed to ${status}`,
      actorId: req.user?.id,
    });
    if (status === "RESOLVED") updateData.resolvedAt = new Date();
  }

  if (priority) {
    updateData.priority = priority as Prisma.EmergencyUpdateInput["priority"];
    timelineEvents.push({
      eventType: "PRIORITY_CHANGED",
      message: `Priority changed to ${priority}`,
      actorId: req.user?.id,
    });
  }

  if (note) {
    timelineEvents.push({ eventType: "NOTE_ADDED", message: note, actorId: req.user?.id });
  }

  if (escalate) {
    updateData.priority = "CRITICAL";
    timelineEvents.push({ eventType: "ESCALATED", message: "Emergency escalated to CRITICAL", actorId: req.user?.id });
  }

  if (requestBackup) {
    timelineEvents.push({ eventType: "BACKUP_REQUESTED", message: "Backup requested", actorId: req.user?.id });
  }

  const emergency = await prisma.emergency.update({
    where: { id },
    data: {
      ...updateData,
      updates: { createMany: { data: timelineEvents } },
    },
    include: emergencyInclude,
  });

  await writeAuditLog({
    userId: req.user?.id,
    emergencyId: id,
    action: "UPDATE_EMERGENCY",
    details: JSON.stringify({ status, priority, escalate, requestBackup }),
    ipAddress: req.ip,
  });

  broadcast(SOCKET_EVENTS.EMERGENCY_UPDATED, emergency);
  if (status) broadcast(SOCKET_EVENTS.STATUS_UPDATED, emergency);
  if (status === "RESOLVED") {
    broadcast(SOCKET_EVENTS.EMERGENCY_RESOLVED, emergency);
    broadcast(SOCKET_EVENTS.NOTIFICATION, {
      type: "EMERGENCY_RESOLVED",
      title: "Emergency resolved",
      message: `${emergency.emergencyCode} marked resolved`,
      emergencyId: emergency.id,
    });
  }
  if (escalate) {
    broadcast(SOCKET_EVENTS.NOTIFICATION, {
      type: "EMERGENCY_ESCALATED",
      title: "Emergency escalated",
      message: `${emergency.emergencyCode} escalated to CRITICAL`,
      emergencyId: emergency.id,
    });
  }

  res.json({ success: true, data: emergency });
});

// POST /api/assignResponder
export const assignResponder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { emergencyId, responderId, role } = req.body as {
    emergencyId: string;
    responderId: string;
    role?: string;
  };

  const [emergency, responder] = await Promise.all([
    prisma.emergency.findUnique({ where: { id: emergencyId } }),
    prisma.responder.findUnique({ where: { id: responderId }, include: { user: true } }),
  ]);
  if (!emergency) throw new AppError("Emergency not found", 404);
  if (!responder) throw new AppError("Responder not found", 404);

  await prisma.$transaction([
    prisma.responderAssignment.create({
      data: { emergencyId, responderId, role: role ?? "primary" },
    }),
    prisma.responder.update({ where: { id: responderId }, data: { status: "ASSIGNED" } }),
    prisma.emergency.update({
      where: { id: emergencyId },
      data: {
        status: emergency.status === "PENDING" ? "DISPATCHED" : emergency.status,
        assignedOperatorId: req.user?.id,
        updates: {
          create: {
            eventType: "RESPONDER_ASSIGNED",
            message: `${responder.type} responder ${responder.user.fullName} assigned`,
            actorId: req.user?.id,
          },
        },
      },
    }),
  ]);

  const updated = await prisma.emergency.findUnique({ where: { id: emergencyId }, include: emergencyInclude });

  await writeAuditLog({
    userId: req.user?.id,
    emergencyId,
    action: "ASSIGN_RESPONDER",
    details: `responderId=${responderId}`,
    ipAddress: req.ip,
  });

  broadcast(SOCKET_EVENTS.RESPONDER_ASSIGNED, updated);
  broadcast(SOCKET_EVENTS.NOTIFICATION, {
    type: "RESPONDER_ASSIGNED",
    title: "Responder assigned",
    message: `${responder.user.fullName} assigned to ${updated?.emergencyCode}`,
    emergencyId,
  });

  res.json({ success: true, data: updated });
});

// POST /api/updateLocation
// Called repeatedly by the mobile app while an emergency is active.
export const updateLocation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { victimId, emergencyId, latitude, longitude, accuracy } = req.body as {
    victimId: string;
    emergencyId?: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  if (latitude === undefined || longitude === undefined) {
    throw new AppError("latitude and longitude are required", 422);
  }

  const location = await prisma.location.create({
    data: { victimId, emergencyId, latitude, longitude, accuracy },
  });

  if (emergencyId) {
    await prisma.emergencyUpdate.create({
      data: {
        emergencyId,
        eventType: "GPS_RECEIVED",
        message: `Updated GPS location received (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
      },
    });
  }

// `location` already contains victimId and emergencyId (they're columns on
// the Location model), so broadcast it as-is rather than duplicating them.
broadcast(SOCKET_EVENTS.LOCATION_UPDATED, location);
  broadcast(SOCKET_EVENTS.NOTIFICATION, {
    type: "LOCATION_UPDATED",
    title: "Location updated",
    message: "Victim location updated",
    emergencyId,
  });

  res.status(201).json({ success: true, data: location });
});
