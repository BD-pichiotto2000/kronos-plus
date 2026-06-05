import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, CheckCircle, Coffee, Clock, LogOut as LogOutIcon, Download, RefreshCw, LayoutDashboard, ClipboardCheck } from "lucide-react";
import { dashboardApi, reportApi, WorkerStatus } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { KronosIcon } from "../../components/KronosLogo";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_CONFIG = {
  WORKING:  { label: "Trabajando",  color: "text-emerald-400", dot: "bg-emerald-400", ring: "ring-emerald-400/20", rowBg: "" },
  ON_BREAK: { label: "En descanso", color: "text-amber-400",   dot: "bg-amber-400",   ring: "ring-amber-400/20",  rowBg: "" },
  FINISHED: { label: "Finalizado",  color: "text-rose-400",    dot: "bg-rose-400",    ring: "ring-rose-400/20",   rowBg: "" },
  IDLE:     { label: "Sin fichar",  color: "text-slate-500",   dot: "bg-slate-700",   ring: "ring-slate-700/20",  rowBg: "" },
};

const KPI_CONFIG = [
  { key: "working",  label: "Trabajando",  icon: CheckCircle, color: "text-emerald-400", border: "border-l-emerald-500", bg: "bg-emerald-500/5" },
  { key: "break",    label: "Descanso",    icon: Coffee,      color: "text-amber-400",   border: "border-l-amber-500",   bg: "bg-amber-500/5" },
  { key: "finished", label: "Finalizado",  icon: LogOutIcon,  color: "text-rose-400",    border: "border-l-rose-500",    bg: "bg-rose-500/5" },
  { key: "idle",     label: "Sin fichar",  icon: Clock,       color: "text-slate-500",   border: "border-l-slate-600",   bg: "" },
] as const;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="card w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold text-white">Exportar informe</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Año</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(+e.target.value)}
              className="input-field py-2"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Mes</label>
            <select
              value={month}
              onChange={(e) => setMonth(+e.target.value)}
              className="input-field py-2"
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
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                  fmt === f ? "border-blue-500 bg-blue-600/20 text-blue-400" : "border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-1">
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
  const [refreshing, setRefreshing] = useState(false);

  async function refresh(manual = false) {
    if (manual) setRefreshing(true);
    try {
      const res = await dashboardApi.status();
      setStatusList(res.data.status);
      setLastUpdated(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(() => refresh(), 30_000);
    return () => clearInterval(interval);
  }, []);

  const counts = {
    working:  statusList.filter((s) => s.currentStatus === "WORKING").length,
    break:    statusList.filter((s) => s.currentStatus === "ON_BREAK").length,
    finished: statusList.filter((s) => s.currentStatus === "FINISHED").length,
    idle:     statusList.filter((s) => s.currentStatus === "IDLE").length,
  };

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
              <h1 className="text-base font-bold leading-tight text-white">Panel de Control</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <button onClick={logout} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition">
              Salir
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="mx-auto flex max-w-7xl gap-1 px-6 pb-0">
          <Link to="/manager/dashboard" className="nav-tab-active border-b-2 border-blue-500 rounded-none pb-3">
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
          <Link to="/manager/aprobaciones" className="nav-tab pb-3 rounded-none hover:border-b-2 hover:border-slate-600">
            <ClipboardCheck size={15} />
            Aprobaciones
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {KPI_CONFIG.map((kpi) => (
            <div key={kpi.key} className={`card flex items-center gap-4 border-l-4 ${kpi.border} ${kpi.bg} p-4`}>
              <div className={`rounded-xl p-2.5 ${kpi.bg || "bg-slate-800"}`}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">{counts[kpi.key]}</p>
                <p className="text-xs text-slate-500">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla en tiempo real */}
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Users size={16} className="text-blue-400" />
              <h2 className="font-semibold text-white">Estado en tiempo real</h2>
              <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {statusList.length} empleados
              </span>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <p className="text-xs text-slate-600">
                  {format(lastUpdated, "HH:mm:ss")}
                </p>
              )}
              <button
                onClick={() => refresh(true)}
                className={`text-slate-500 hover:text-slate-300 transition ${refreshing ? "animate-spin" : ""}`}
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-px p-4">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full mb-2" />)}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {statusList.map(({ worker, currentStatus, lastPunch, punchCount }) => {
                const cfg = STATUS_CONFIG[currentStatus];
                return (
                  <div key={worker.id} className="flex items-center justify-between px-5 py-3.5 transition hover:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 ring-2 ${cfg.ring}`}>
                        <span className="text-sm font-bold text-slate-300">
                          {worker.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{worker.name}</p>
                        <p className="text-xs text-slate-600">
                          {punchCount} {punchCount === 1 ? "fichaje" : "fichajes"} hoy
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${cfg.dot} ${currentStatus === "WORKING" ? "animate-pulse" : ""}`} />
                        <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      {lastPunch && (
                        <p className="mt-0.5 text-xs text-slate-600">
                          {format(new Date(lastPunch.timestamp), "HH:mm")}
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
