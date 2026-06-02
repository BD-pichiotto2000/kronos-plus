import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});

// Adjuntar token JWT a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kronos_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirigir al login si el token expira
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("kronos_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Tipos ──────────────────────────────────────────────────────────────
export type Role = "WORKER" | "MANAGER";
export type PunchType = "ENTRY" | "BREAK_START" | "BREAK_END" | "EXIT";
export type RequestType = "VACATION" | "PERSONAL_DAY";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ClockInRecord {
  id: string;
  userId: string;
  type: PunchType;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  user?: User;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: RequestType;
  startDate: string;
  endDate: string;
  status: RequestStatus;
  notes?: string;
  hasConflict: boolean;
  conflictWith?: string;
  conflictingUsers?: { id: string; name: string }[];
  employee?: User;
  createdAt: string;
}

export interface WorkerStatus {
  worker: User;
  currentStatus: "IDLE" | "WORKING" | "ON_BREAK" | "FINISHED";
  lastPunch: ClockInRecord | null;
  punchCount: number;
}

// ── API calls ──────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>("/auth/login", { email, password }),
  me: () => api.get<{ user: User }>("/auth/me"),
};

export const clockInApi = {
  punch: (type: PunchType, coords?: { latitude: number; longitude: number }) =>
    api.post("/clockin/punch", { type, ...coords }),
  myHistory: (year?: number, month?: number) =>
    api.get<{ records: ClockInRecord[] }>("/clockin/my-history", { params: { year, month } }),
  allHistory: (year?: number, month?: number, userId?: string) =>
    api.get<{ records: ClockInRecord[] }>("/clockin/all", { params: { year, month, userId } }),
};

export const leaveApi = {
  createRequest: (data: { type: RequestType; startDate: string; endDate: string; notes?: string }) =>
    api.post("/leave/request", data),
  myRequests: () => api.get<{ requests: LeaveRequest[] }>("/leave/my-requests"),
  allRequests: (status?: RequestStatus) =>
    api.get<{ requests: LeaveRequest[] }>("/leave/all", { params: { status } }),
  approve: (id: string) => api.patch(`/leave/${id}/approve`),
  reject: (id: string) => api.patch(`/leave/${id}/reject`),
};

export const dashboardApi = {
  status: () => api.get<{ status: WorkerStatus[] }>("/dashboard/status"),
  workers: () => api.get<{ workers: User[] }>("/dashboard/workers"),
};

export const reportApi = {
  export: (year: number, month: number, format: "csv" | "xlsx", userId?: string) =>
    api.get("/reports/export", {
      params: { year, month, format, userId },
      responseType: "blob",
    }),
};
