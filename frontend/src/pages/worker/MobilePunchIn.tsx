import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, Coffee, Play, LogOut, MapPin, Clock, CalendarDays } from "lucide-react";
import { clockInApi, ClockInRecord, PunchType } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { KronosIcon } from "../../components/KronosLogo";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PUNCH_CONFIG = {
  ENTRY:       { label: "Entrada",         icon: LogIn,   color: "bg-emerald-600 hover:bg-emerald-700", shadow: "shadow-emerald-600/25" },
  BREAK_START: { label: "Inicio Descanso", icon: Coffee,  color: "bg-amber-500 hover:bg-amber-600",     shadow: "shadow-amber-500/25" },
  BREAK_END:   { label: "Fin Descanso",    icon: Play,    color: "bg-blue-600 hover:bg-blue-700",       shadow: "shadow-blue-600/25" },
  EXIT:        { label: "Salida",          icon: LogOut,  color: "bg-rose-600 hover:bg-rose-700",       shadow: "shadow-rose-600/25" },
} as const;

const STATUS_CONFIG = {
  IDLE:     { label: "Sin fichar",        color: "text-slate-400",   bg: "bg-slate-800",         ring: "ring-slate-700" },
  WORKING:  { label: "Trabajando",        color: "text-emerald-400", bg: "bg-emerald-500/10",    ring: "ring-emerald-500/30" },
  ON_BREAK: { label: "En descanso",       color: "text-amber-400",   bg: "bg-amber-500/10",      ring: "ring-amber-500/30" },
  FINISHED: { label: "Jornada finalizada", color: "text-rose-400",   bg: "bg-rose-500/10",       ring: "ring-rose-500/30" },
};

function currentStatus(records: ClockInRecord[]): keyof typeof STATUS_CONFIG {
  if (!records.length) return "IDLE";
  const last = records[records.length - 1];
  if (last.type === "ENTRY" || last.type === "BREAK_END") return "WORKING";
  if (last.type === "BREAK_START") return "ON_BREAK";
  if (last.type === "EXIT") return "FINISHED";
  return "IDLE";
}

function allowedPunches(status: string): PunchType[] {
  if (status === "IDLE") return ["ENTRY"];
  if (status === "WORKING") return ["BREAK_START", "EXIT"];
  if (status === "ON_BREAK") return ["BREAK_END"];
  return [];
}

function getElapsed(records: ClockInRecord[], now: Date): string | null {
  if (!records.length) return null;
  const last = records[records.length - 1];
  if (last.type !== "ENTRY" && last.type !== "BREAK_END") return null;
  const ms = now.getTime() - new Date(last.timestamp).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

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

export default function MobilePunchIn() {
  const { user, logout } = useAuth();
  const [todayRecords, setTodayRecords] = useState<ClockInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState<PunchType | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [now, setNow] = useState(new Date());
  const [geoEnabled, setGeoEnabled] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  useEffect(() => {
    const today = new Date();
    clockInApi
      .myHistory(today.getFullYear(), today.getMonth() + 1)
      .then((res) => {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        setTodayRecords(res.data.records.filter((r) => new Date(r.timestamp) >= start));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handlePunch(type: PunchType) {
    setPunching(type);
    setFeedback(null);
    try {
      let coords: { latitude: number; longitude: number } | undefined;
      if (geoEnabled) {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        ).catch(() => null);
        if (pos) coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      }
      const res = await clockInApi.punch(type, coords);
      setTodayRecords((prev) => [...prev, res.data.clockIn]);
      setFeedback({ type: "ok", msg: `${PUNCH_CONFIG[type].label} registrada correctamente` });
    } catch (err: any) {
      setFeedback({ type: "err", msg: err.response?.data?.error ?? "Error al fichar" });
    } finally {
      setPunching(null);
    }
  }

  const status = currentStatus(todayRecords);
  const allowed = allowedPunches(status);
  const cfg = STATUS_CONFIG[status];
  const elapsed = getElapsed(todayRecords, now);

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
        <button onClick={logout} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition">
          Salir
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-6 pt-5">
        {/* Reloj */}
        <div className="text-center">
          <p className="text-5xl font-extrabold tabular-nums tracking-tight text-white">
            {format(now, "HH:mm:ss")}
          </p>
          <p className="mt-1 text-sm capitalize text-slate-400">
            {format(now, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>

        {/* Estado actual */}
        <div className={`rounded-2xl border p-4 text-center ring-1 transition ${cfg.bg} ${cfg.ring} border-transparent`}>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Estado actual</p>
          <p className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</p>
          {elapsed && status === "WORKING" && (
            <p className="mt-1 font-mono text-sm text-slate-400">
              Tramo actual: <span className="font-semibold text-white">{elapsed}</span>
            </p>
          )}
        </div>

        {/* Botones de fichaje */}
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3">
            {(Object.keys(PUNCH_CONFIG) as PunchType[]).map((type) => {
              const pcfg = PUNCH_CONFIG[type];
              const Icon = pcfg.icon;
              const isAllowed = allowed.includes(type);
              const isActive = punching === type;
              return (
                <button
                  key={type}
                  onClick={() => isAllowed && handlePunch(type)}
                  disabled={!isAllowed || punching !== null}
                  className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-5 text-base font-bold text-white shadow-lg transition active:scale-[0.98]
                    ${isAllowed
                      ? `${pcfg.color} ${pcfg.shadow} shadow-lg`
                      : "cursor-not-allowed bg-slate-800/50 text-slate-600 shadow-none"}
                    ${isActive ? "animate-pulse opacity-75" : ""}
                  `}
                >
                  <Icon size={20} />
                  {isActive ? "Registrando..." : pcfg.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Geolocalización toggle */}
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPin size={15} className={geoEnabled ? "text-blue-400" : ""} />
            Guardar ubicación al fichar
          </div>
          <div
            onClick={() => setGeoEnabled((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition ${geoEnabled ? "bg-blue-600" : "bg-slate-700"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${geoEnabled ? "translate-x-5" : ""}`} />
          </div>
        </label>

        {/* Feedback */}
        {feedback && (
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
            feedback.type === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}>
            {feedback.msg}
          </div>
        )}

        {/* Historial de hoy */}
        {todayRecords.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
              Fichajes de hoy
            </p>
            <div className="card divide-y divide-slate-800/60 p-0 overflow-hidden">
              {todayRecords.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className={`h-2 w-2 rounded-full ${
                      r.type === "ENTRY" ? "bg-emerald-400" :
                      r.type === "EXIT" ? "bg-rose-400" :
                      r.type === "BREAK_START" ? "bg-amber-400" : "bg-blue-400"
                    }`} />
                    <span className="text-slate-300">
                      {PUNCH_CONFIG[r.type as PunchType]?.label ?? r.type}
                    </span>
                  </div>
                  <span className="font-mono text-sm text-slate-400">
                    {format(new Date(r.timestamp), "HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <WorkerBottomNav active="fichar" />
    </div>
  );
}
