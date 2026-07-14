import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

export const SOCKET_EVENTS = {
  NEW_EMERGENCY: "emergency:new",
  EMERGENCY_UPDATED: "emergency:updated",
  STATUS_UPDATED: "emergency:status_updated",
  RESPONDER_ASSIGNED: "emergency:responder_assigned",
  LOCATION_UPDATED: "location:updated",
  EMERGENCY_RESOLVED: "emergency:resolved",
  NOTIFICATION: "notification:new",
} as const;

let socket: Socket | null = null;

export function connectSocket(accessToken: string): Socket {
  const socketUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  socket = io(socketUrl, {
    auth: { token: accessToken },
    withCredentials: true,
    transports: ["websocket"],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
