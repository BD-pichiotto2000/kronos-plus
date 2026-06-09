import { Router } from "express";
import { requireAuth, requireManager } from "../middleware/auth";
import * as Auth from "../controllers/auth.controller";
import * as ClockIn from "../controllers/clockin.controller";
import * as Leave from "../controllers/leave.controller";
import * as Dashboard from "../controllers/dashboard.controller";
import * as Report from "../controllers/report.controller";

const router = Router();

// ── Auth ──────────────────────────────────────────────────────────────
router.post("/auth/register", Auth.register);
router.post("/auth/login", Auth.login);
router.get("/auth/me", requireAuth, Auth.me);

// ── Fichajes (trabajador) ──────────────────────────────────────────────
router.post("/clockin/punch", requireAuth, ClockIn.punch);
router.get("/clockin/my-history", requireAuth, ClockIn.myHistory);

// ── Fichajes (gerente) ─────────────────────────────────────────────────
router.get("/clockin/all", requireAuth, requireManager, ClockIn.allHistory);

// ── Solicitudes de ausencias (trabajador) ─────────────────────────────
router.post("/leave/request", requireAuth, Leave.createRequest);
router.get("/leave/my-requests", requireAuth, Leave.myRequests);

// ── Solicitudes de ausencias (gerente) ────────────────────────────────
router.get("/leave/all", requireAuth, requireManager, Leave.allRequests);
router.patch("/leave/:id/approve", requireAuth, requireManager, Leave.approveRequest);
router.patch("/leave/:id/reject", requireAuth, requireManager, Leave.rejectRequest);

// ── Incompatibilidades (gerente) ──────────────────────────────────────
router.get("/incompatibilities", requireAuth, requireManager, Leave.manageIncompatibilities);
router.post("/incompatibilities", requireAuth, requireManager, Leave.manageIncompatibilities);
router.delete("/incompatibilities/:id", requireAuth, requireManager, Leave.manageIncompatibilities);

// ── Dashboard en tiempo real (gerente) ────────────────────────────────
router.get("/dashboard/status", requireAuth, requireManager, Dashboard.realTimeStatus);
router.get("/dashboard/workers", requireAuth, requireManager, Dashboard.getWorkers);

// ── Gestión de usuarios (gerente) ─────────────────────────────────────
router.get("/users", requireAuth, requireManager, Dashboard.getUsers);
router.post("/users", requireAuth, requireManager, Dashboard.createUser);
router.delete("/users/:id", requireAuth, requireManager, Dashboard.deleteUser);

// ── Exportación de informes (gerente) ─────────────────────────────────
router.get("/reports/export", requireAuth, requireManager, Report.exportReport);

export default router;
