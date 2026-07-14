export type Role = "ORG_ADMIN" | "ORG_OPERATOR" | "POLICE" | "MEDICAL";

export type EmergencyStatus = "PENDING" | "ACKNOWLEDGED" | "DISPATCHED" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
export type EmergencyPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EmergencyType = "POLICE" | "MEDICAL" | "FIRE" | "GENERAL";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  organization?: string | null;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation?: string | null;
}

export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  recordedAt: string;
}

export interface Victim {
  id: string;
  victimCode: string;
  fullName: string;
  phoneNumber: string;
  gender?: string | null;
  age?: number | null;
  bloodGroup?: string | null;
  medicalNotes?: string | null;
  profilePhotoUrl?: string | null;
  emergencyContacts: EmergencyContact[];
  locations?: Location[];
}

export interface EmergencyUpdate {
  id: string;
  eventType: string;
  message: string;
  createdAt: string;
}

export interface ResponderAssignment {
  id: string;
  role?: string | null;
  responder: {
    id: string;
    type: "POLICE" | "MEDICAL" | "FIRE";
    status: string;
    user: { fullName: string };
  };
}

export interface Emergency {
  id: string;
  emergencyCode: string;
  victim: Victim;
  type: EmergencyType;
  status: EmergencyStatus;
  priority: EmergencyPriority;
  triggeredAt: string;
  resolvedAt?: string | null;
  region?: string | null;
  updates: EmergencyUpdate[];
  responders: ResponderAssignment[];
  locations: Location[];
  assignedOperator?: { id: string; fullName: string; role: Role } | null;
}

export interface DashboardStats {
  activeEmergencies: number;
  resolvedEmergencies: number;
  highPriorityAlerts: number;
  victimsAwaitingResponse: number;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  emergencyId?: string | null;
  createdAt: string;
}
