import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, CheckCircle, Coffee, Clock, LogOut as LogOutIcon, Download, RefreshCw
} from "lucide-react";
import { dashboardApi, reportApi, WorkerStatus } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { KronosIcon } from "../../components/KronosLogo";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CONFIG = {
  WORKING:  { label: "Trabajando",    color: "text-emerald-400", dot: "bg-emerald-400", ring: "ring-emerald-400/20" },
  ON_BREAK: { label: "En descanso",   color: "text-amber-400",   dot: "bg-amber-400",   ring: "ring-amber-400/20" },
  FINISHED: { label: "Finalizado",    color: "text-rose-400",    dot: "bg-rose-400",    ring: "ring-rose-400/20" },
  IDLE:     { label: "Sin fichar",    color: "text-slate-500",   dot: "bg-slate-700",   ring: "ring-slate-700/20" },
};

function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.IDLE;
  return (
    <span className={`inline-flex h-2.5 w-2.5 rounded-full ${cfg.dot} ${status === "WORKING" ? "animate-pulse" : ""}`} />
  );
}

function ExportModal({ onClose }: { onClose: () => void }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [fmt, setFmt] = useState<"csv" | "xlsx">("xlsx");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await reportApi.export(year, month, fmt);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `kronos_${month.toString().padStart(2, "0")}_${year}.${fmt}`;
      link.click();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch {
      alert("Error al exportar el informe");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="card w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold text-white">Exportar informe</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Año</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(+e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Mes</label>
            <select
              value={month}
              onChange={(e) => setMonth(+e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {format(new Date(year, i), "MMMM", { locale: es })}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-slate-400">Formato</label>
          <div className="flex gap-3">
            {(["xlsx", "csv"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFmt(f)}
                className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition ${
                  fmt === f ? "border-blue-500 bg-blue-600/20 text-blue-400" : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={handleExport} disabled={exporting} className="btn-primary flex-1">
            <Download size={16} />
            {exporting ? "Exportando..." : "Descargar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GerenteDashboard() {
  const { user, logout } = useAuth();
  const [statusList, setStatusList] = useState<WorkerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function refresh() {
    try {
      const res = await dashboardApi.status();
      setStatusList(res.data.status);
      setLastUpdated(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, []);

  const counts = {
    working: statusList.filter((s) => s.currentStatus === "WORKING").length,
    break: statusList.filter((s) => s.currentStatus === "ON_BREAK").length,
    finished: statusList.filter((s) => s.currentStatus === "FINISHED").length,
    idle: statusList.filter((s) => s.currentStatus === "IDLE").length,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-white/[0.02] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/90 p-1.5">
              <KronosIcon size={38} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Gerente</p>
              <h1 className="text-lg font-bold leading-tight text-white">Panel de Control</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              <Download size={15} />
              Exportar
            </button>
            <Link
              to="/manager/aprobaciones"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Aprobaciones
            </Link>
            <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-300 transition">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Trabajando", count: counts.working, icon: CheckCircle, color: "text-emerald-400" },
            { label: "En descanso", count: counts.break, icon: Coffee, color: "text-amber-400" },
            { label: "Finalizado", count: counts.finished, icon: LogOutIcon, color: "text-rose-400" },
            { label: "Sin fichar", count: counts.idle, icon: Clock, color: "text-slate-500" },
          ].map((kpi) => (
            <div key={kpi.label} className="card text-center">
              <kpi.icon size={20} className={`mx-auto mb-2 ${kpi.color}`} />
              <p className="text-3xl font-extrabold text-white">{kpi.count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Tabla en tiempo real */}
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              <h2 className="font-semibold text-white">Estado en tiempo real</h2>
              <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {statusList.length} empleados
              </span>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <p className="text-xs text-slate-600">
                  Actualizado {format(lastUpdated, "HH:mm:ss")}
                </p>
              )}
              <button onClick={refresh} className="text-slate-500 hover:text-slate-300 transition">
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">Cargando...</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {statusList.map(({ worker, currentStatus, lastPunch }) => {
                const cfg = STATUS_CONFIG[currentStatus];
                return (
                  <div key={worker.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-900/40 transition">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 ring-4 ${cfg.ring}`}>
                        <span className="text-sm font-bold text-slate-300">
                          {worker.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{worker.name}</p>
                        <p className="text-xs text-slate-500">{worker.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <StatusDot status={currentStatus} />
                        <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      {lastPunch && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          Último: {format(new Date(lastPunch.timestamp), "HH:mm")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  );
}
