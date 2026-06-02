import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, X, AlertTriangle } from "lucide-react";
import { leaveApi, LeaveRequest, RequestType } from "../../lib/api";
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

export default function MyRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "VACATION" as RequestType, startDate: "", endDate: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    leaveApi.myRequests().then((res) => setRequests(res.data.requests)).finally(() => setLoading(false));
  }, []);

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
        msg: conflict
          ? `Solicitud enviada. Aviso: ${conflict.message}`
          : "Solicitud enviada correctamente",
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
    <div className="min-h-screen bg-slate-950">
      <header className="flex items-center gap-4 border-b border-slate-800 px-5 py-4">
        <Link to="/worker/fichar" className="text-slate-400 hover:text-white transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-blue-500">KRONOS+</p>
          <h1 className="text-lg font-bold text-white">Mis Solicitudes</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition active:scale-95"
        >
          <Plus size={16} />
          Nueva
        </button>
      </header>

      <div className="px-5 pb-10 pt-6 space-y-5">
        {/* Formulario nueva solicitud */}
        {showForm && (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Nueva solicitud</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RequestType }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none ring-blue-500 focus:ring-2"
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
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white outline-none ring-blue-500 focus:ring-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Hasta</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white outline-none ring-blue-500 focus:ring-2"
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
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white outline-none ring-blue-500 focus:ring-2 resize-none"
                placeholder="Motivo o comentario..."
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Enviando..." : "Enviar solicitud"}
            </button>
          </form>
        )}

        {/* Feedback de envío */}
        {submitMsg && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            submitMsg.ok ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            {submitMsg.ok && submitMsg.msg.includes("Aviso") && (
              <AlertTriangle size={14} className="inline mr-1.5 text-amber-400" />
            )}
            {submitMsg.msg}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="text-center text-slate-500 py-10">Cargando...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p>No tienes solicitudes todavía.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2"
            >
              Crea tu primera solicitud
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {r.type === "VACATION" ? "Vacaciones" : "Asuntos Propios"}
                    </p>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {format(new Date(r.startDate), "d MMM yyyy", { locale: es })}
                      {" — "}
                      {format(new Date(r.endDate), "d MMM yyyy", { locale: es })}
                    </p>
                    {r.notes && <p className="text-xs text-slate-500 mt-1">{r.notes}</p>}
                  </div>
                  <span className={`badge border shrink-0 ${STATUS_STYLES[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Solicitado el {format(new Date(r.createdAt), "d/MM/yyyy")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
