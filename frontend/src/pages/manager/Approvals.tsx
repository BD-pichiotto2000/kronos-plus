import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, X, Filter } from "lucide-react";
import { KronosIcon } from "../../components/KronosLogo";
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
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 86400000) + 1;
}

export default function Approvals() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RequestStatus | "ALL">("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedConflict, setExpandedConflict] = useState<string | null>(null);

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
      const warning = res.data.warning;
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "APPROVED" as RequestStatus } : r));
      if (warning) {
        alert(warning);
      }
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Error al aprobar");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("¿Rechazar esta solicitud?")) return;
    setActionLoading(id + "_reject");
    try {
      await leaveApi.reject(id);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "REJECTED" as RequestStatus } : r));
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Error al rechazar");
    } finally {
      setActionLoading(null);
    }
  }

  const FILTERS: { value: RequestStatus | "ALL"; label: string }[] = [
    { value: "PENDING", label: "Pendientes" },
    { value: "APPROVED", label: "Aprobadas" },
    { value: "REJECTED", label: "Rechazadas" },
    { value: "ALL", label: "Todas" },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-white/[0.02] px-6 py-3">
        <div className="flex items-center gap-4">
          <Link to="/manager/dashboard" className="text-slate-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/90 p-1.5">
              <KronosIcon size={38} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Gerente</p>
              <h1 className="text-lg font-bold leading-tight text-white">Aprobaciones</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 max-w-4xl mx-auto space-y-5">
        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-500" />
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
          <div className="text-center py-16 text-slate-500">Cargando...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            No hay solicitudes {filter === "PENDING" ? "pendientes" : ""}.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const days = daysBetween(r.startDate, r.endDate);
              const hasConflict = r.hasConflict && (r.conflictingUsers?.length ?? 0) > 0;
              const conflictExpanded = expandedConflict === r.id;

              return (
                <div key={r.id} className={`card space-y-4 ${hasConflict ? "border-amber-500/30" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-white">{r.employee?.name ?? "—"}</p>
                        <span className={`badge border ${STATUS_STYLES[r.status]}`}>
                          {STATUS_LABELS[r.status]}
                        </span>
                        {hasConflict && (
                          <button
                            onClick={() => setExpandedConflict(conflictExpanded ? null : r.id)}
                            className="badge bg-amber-500/15 text-amber-400 border border-amber-500/30 cursor-pointer hover:bg-amber-500/25"
                          >
                            ⚠ Conflicto
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {TYPE_LABELS[r.type]} · {format(new Date(r.startDate), "d MMM", { locale: es })} — {format(new Date(r.endDate), "d MMM yyyy", { locale: es })}
                        <span className="ml-2 text-slate-500">({days} {days === 1 ? "día" : "días"})</span>
                      </p>
                      {r.notes && <p className="text-xs text-slate-500 mt-1 italic">"{r.notes}"</p>}
                      <p className="text-xs text-slate-600 mt-1">
                        Solicitado el {format(new Date(r.createdAt), "d/MM/yyyy HH:mm")}
                      </p>
                    </div>

                    {r.status === "PENDING" && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(r.id)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition active:scale-95"
                        >
                          <Check size={15} />
                          {actionLoading === r.id + "_approve" ? "..." : "Aprobar"}
                        </button>
                        <button
                          onClick={() => handleReject(r.id)}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 transition active:scale-95"
                        >
                          <X size={15} />
                          {actionLoading === r.id + "_reject" ? "..." : "Rechazar"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Alerta de conflicto expandida */}
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
    </div>
  );
}
