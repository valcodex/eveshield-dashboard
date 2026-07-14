import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { env } from "../config/env";
import { verifyAccessToken } from "../utils/jwt";

let io: Server | null = null;

// Event names broadcast to the dashboard. Keep these in one place so the
// frontend's socket hook and the backend emitters never drift apart.
export const SOCKET_EVENTS = {
  NEW_EMERGENCY: "emergency:new",
  EMERGENCY_UPDATED: "emergency:updated",
  STATUS_UPDATED: "emergency:status_updated",
  RESPONDER_ASSIGNED: "emergency:responder_assigned",
  LOCATION_UPDATED: "location:updated",
  EMERGENCY_RESOLVED: "emergency:resolved",
  NOTIFICATION: "notification:new",
} as const;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  // Only authenticated dashboard users may open a socket connection.
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("Authentication required"));
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    // Everyone joins a shared "ops-center" room so broadcasts reach all
    // connected dashboard clients in real time.
    socket.join("ops-center");

    socket.on("disconnect", () => {
      // no-op placeholder for future presence tracking
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO not initialized. Call initSocket() first.");
  return io;
}

// Convenience broadcaster used by controllers/services after DB writes.
export function broadcast(event: string, payload: unknown) {
  getIO().to("ops-center").emit(event, payload);
}
