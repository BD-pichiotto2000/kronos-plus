import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, LayoutDashboard, ClipboardCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { KronosIcon } from "../../components/KronosLogo";
import { useAuth } from "../../context/AuthContext";
import { leaveApi, LeaveRequest, RequestStatus } from "../../lib/api";
import ConflictAlert from "../../components/ConflictAlert";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_STYLES: Record<string, string> = {
  PENDING:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-red-500/15 text-red-400 border-red-500/30",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente", APPROVED: "Aprobado", REJECTED: "Rechazado",
};
const TYPE_LABELS: Record<string, string> = {
  VACATION: "Vacaciones", PERSONAL_DAY: "Asuntos Propios",
};

function daysBetween(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
}

interface Toast { msg: string; type: "ok" | "warn" | "err" }

function ToastBar({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const styles = {
    ok:   "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    err:  "border-red-500/30 bg-red-500/10 text-red-400",
  };
  const Icon = toast.type === "ok" ? CheckCircle : AlertTriangle;
  return (
    <div className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-sm ${styles[toast.type]}`}>
      <Icon size={16} />
      <span className="text-sm font-medium">{toast.msg}</span>
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100 transition">
        <X size={14} />
      </button>
    </div>
  );
}

function ConfirmModal({ msg, onConfirm, onCancel }: { msg: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="card w-full max-w-sm space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-rose-500/10 p-2.5">
            <AlertTriangle size={20} className="text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Confirmar acción</h3>
            <p className="mt-1 text-sm text-slate-400">{msg}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={onConfirm} className="btn-danger flex-1">Rechazar</button>
        </div>
      </div>
    </div>
  );
}

export default function Approvals() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RequestStatus | "ALL">("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedConflict, setExpandedConflict] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await leaveApi.allRequests(filter === "ALL" ? undefined : filter);
      setRequests(res.data.requests);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRequests(); }, [filter]);

  async function handleApprove(id: string) {
    setActionLoading(id + "_approve");
    try {
      const res = await leaveApi.approve(id);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "APPROVED" as RequestStatus } : r));
      const warning = res.data.warning;
      setToast(warning ? { msg: warning, type: "warn" } : { msg: "Solicitud aprobada", type: "ok" });
    } catch (err: any) {
      setToast({ msg: err.response?.data?.error ?? "Error al aprobar", type: "err" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id + "_reject");
    try {
      await leaveApi.reject(id);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "REJECTED" as RequestStatus } : r));
      setToast({ msg: "Solicitud rechazada", type: "ok" });
    } catch (err: any) {
      setToast({ msg: err.response?.data?.error ?? "Error al rechazar", type: "err" });
    } finally {
      setActionLoading(null);
      setConfirmId(null);
    }
  }

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const FILTERS: { value: RequestStatus | "ALL"; label: string }[] = [
    { value: "PENDING",  label: "Pendientes" },
    { value: "APPROVED", label: "Aprobadas" },
    { value: "REJECTED", label: "Rechazadas" },
    { value: "ALL",      label: "Todas" },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/90 p-1.5">
              <KronosIcon size={36} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gerente · {user?.name}</p>
              <h1 className="text-base font-bold leading-tight text-white">Aprobaciones</h1>
            </div>
          </div>
          <button onClick={logout} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition">
            Salir
          </button>
        </div>

        {/* Nav tabs */}
        <div className="mx-auto flex max-w-7xl gap-1 px-6">
          <Link to="/manager/dashboard" className="nav-tab pb-3 rounded-none hover:border-b-2 hover:border-slate-600">
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
          <Link to="/manager/aprobaciones" className="nav-tab-active border-b-2 border-blue-500 rounded-none pb-3 relative">
            <ClipboardCheck size={15} />
            Aprobaciones
            {pendingCount > 0 && filter !== "PENDING" && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-6 py-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                filter === f.value
                  ? "border-blue-500 bg-blue-600/20 text-blue-400"
                  : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 w-full" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center text-slate-500">
            <ClipboardCheck size={48} className="mb-4 text-slate-700" />
            <p className="font-medium text-slate-400">
              No hay solicitudes {filter === "PENDING" ? "pendientes" : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const days = daysBetween(r.startDate, r.endDate);
              const hasConflict = r.hasConflict && (r.conflictingUsers?.length ?? 0) > 0;
              const conflictExpanded = expandedConflict === r.id;

              return (
                <div key={r.id} className={`card space-y-4 ${hasConflict ? "border-amber-500/25 bg-amber-500/[0.02]" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-300">
                        {(r.employee?.name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-white">{r.employee?.name ?? "—"}</p>
                          <span className={`badge border ${STATUS_STYLES[r.status]}`}>
                            {STATUS_LABELS[r.status]}
                          </span>
                          {hasConflict && (
                            <button
                              onClick={() => setExpandedConflict(conflictExpanded ? null : r.id)}
                              className="badge border border-amber-500/30 bg-amber-500/15 text-amber-400 cursor-pointer hover:bg-amber-500/25 transition"
                            >
                              ⚠ Conflicto
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          <span className="font-medium text-slate-300">{TYPE_LABELS[r.type]}</span>
                          {" · "}
                          {format(new Date(r.startDate), "d MMM", { locale: es })} — {format(new Date(r.endDate), "d MMM yyyy", { locale: es })}
                          <span className="ml-1.5 text-slate-500">({days} {days === 1 ? "día" : "días"})</span>
                        </p>
                        {r.notes && <p className="mt-1 text-xs italic text-slate-500">"{r.notes}"</p>}
                        <p className="mt-1 text-xs text-slate-600">
                          {format(new Date(r.createdAt), "d/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    </div>

                    {r.status === "PENDING" && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => handleApprove(r.id)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition active:scale-95"
                        >
                          <Check size={15} />
                          {actionLoading === r.id + "_approve" ? "..." : "Aprobar"}
                        </button>
                        <button
                          onClick={() => setConfirmId(r.id)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition active:scale-95"
                        >
                          <X size={15} />
                          {actionLoading === r.id + "_reject" ? "..." : "Rechazar"}
                        </button>
                      </div>
                    )}
                  </div>

                  {hasConflict && conflictExpanded && r.conflictingUsers && (
                    <ConflictAlert
                      conflictingUsers={r.conflictingUsers}
                      onDismiss={() => setExpandedConflict(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal confirmación rechazo */}
      {confirmId && (
        <ConfirmModal
          msg="¿Seguro que quieres rechazar esta solicitud? Esta acción no se puede deshacer."
          onConfirm={() => handleReject(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Toast */}
      {toast && <ToastBar toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
