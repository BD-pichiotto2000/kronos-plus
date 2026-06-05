import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, X, AlertTriangle, CalendarDays, Clock } from "lucide-react";
import { leaveApi, LeaveRequest, RequestType } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { KronosIcon } from "../../components/KronosLogo";
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

function WorkerBottomNav({ active }: { active: "fichar" | "solicitudes" }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <Link
        to="/worker/fichar"
        className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold transition ${
          active === "fichar" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
        }`}
      >
        <Clock size={20} />
        Fichar
      </Link>
      <Link
        to="/worker/solicitudes"
        className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold transition ${
          active === "solicitudes" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
        }`}
      >
        <CalendarDays size={20} />
        Solicitudes
      </Link>
    </nav>
  );
}

export default function MyRequests() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "VACATION" as RequestType, startDate: "", endDate: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    leaveApi.myRequests().then((res) => setRequests(res.data.requests)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!submitMsg) return;
    const t = setTimeout(() => setSubmitMsg(null), 5000);
    return () => clearTimeout(t);
  }, [submitMsg]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await leaveApi.createRequest(form);
      const newReq: LeaveRequest = res.data.request;
      setRequests((prev) => [newReq, ...prev]);
      const conflict = res.data.conflict;
      setSubmitMsg({
        ok: true,
        msg: conflict ? `Solicitud enviada. Aviso: ${conflict.message}` : "Solicitud enviada correctamente",
      });
      setForm({ type: "VACATION", startDate: "", endDate: "", notes: "" });
      setShowForm(false);
    } catch (err: any) {
      setSubmitMsg({ ok: false, msg: err.response?.data?.error ?? "Error al enviar" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 pb-16">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/90 p-1.5">
            <KronosIcon size={32} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Trabajador</p>
            <h1 className="text-sm font-bold leading-tight text-white">{user?.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-700 active:scale-95"
          >
            <Plus size={14} />
            Nueva
          </button>
          <button onClick={logout} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition">
            Salir
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-6 pt-5">
        {/* Formulario nueva solicitud */}
        {showForm && (
          <form onSubmit={handleSubmit} className="card space-y-4 border-blue-500/20">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Nueva solicitud</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RequestType }))}
                className="input-field"
              >
                <option value="VACATION">Vacaciones</option>
                <option value="PERSONAL_DAY">Asuntos Propios</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Desde</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="input-field py-2.5"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Hasta</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="input-field py-2.5"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Notas (opcional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="input-field resize-none"
                placeholder="Motivo o comentario..."
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Enviando...
                </span>
              ) : "Enviar solicitud"}
            </button>
          </form>
        )}

        {/* Feedback */}
        {submitMsg && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            submitMsg.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}>
            {submitMsg.ok && submitMsg.msg.includes("Aviso") && (
              <AlertTriangle size={14} className="mr-1.5 inline text-amber-400" />
            )}
            {submitMsg.msg}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 w-full" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center text-slate-500">
            <CalendarDays size={48} className="mb-4 text-slate-700" />
            <p className="font-medium text-slate-400">Sin solicitudes todavía</p>
            <p className="mt-1 text-sm">Usa el botón "Nueva" para crear tu primera solicitud</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        r.status === "APPROVED" ? "bg-emerald-400" :
                        r.status === "REJECTED" ? "bg-red-400" : "bg-amber-400"
                      }`} />
                      <p className="font-semibold text-white">{TYPE_LABELS[r.type]}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {format(new Date(r.startDate), "d MMM", { locale: es })}
                      {" — "}
                      {format(new Date(r.endDate), "d MMM yyyy", { locale: es })}
                    </p>
                    {r.notes && <p className="mt-1 text-xs italic text-slate-500">"{r.notes}"</p>}
                  </div>
                  <span className={`badge shrink-0 border ${STATUS_STYLES[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-slate-600">
                  Solicitado el {format(new Date(r.createdAt), "d/MM/yyyy")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <WorkerBottomNav active="solicitudes" />
    </div>
  );
}
