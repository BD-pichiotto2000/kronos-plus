import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LogIn, Coffee, Play, LogOut, MapPin, Clock, Calendar, ChevronRight
} from "lucide-react";
import { clockInApi, ClockInRecord, PunchType } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { KronosIcon } from "../../components/KronosLogo";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PUNCH_CONFIG = {
  ENTRY:       { label: "Entrada",         icon: LogIn,   color: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30" },
  BREAK_START: { label: "Inicio Descanso", icon: Coffee,  color: "bg-amber-500  hover:bg-amber-600  shadow-amber-500/30" },
  BREAK_END:   { label: "Fin Descanso",    icon: Play,    color: "bg-blue-600   hover:bg-blue-700   shadow-blue-600/30" },
  EXIT:        { label: "Salida",          icon: LogOut,  color: "bg-rose-600   hover:bg-rose-700   shadow-rose-600/30" },
} as const;

const STATUS_LABELS: Record<string, string> = {
  IDLE: "Sin fichar",
  WORKING: "Trabajando",
  ON_BREAK: "En descanso",
  FINISHED: "Jornada finalizada",
};

function currentStatus(records: ClockInRecord[]): string {
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-white/5 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/90 p-1.5">
            <KronosIcon size={34} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Trabajador</p>
            <h1 className="text-base font-bold leading-tight text-white">{user?.name}</h1>
          </div>
        </div>
        <button onClick={logout} className="text-xs text-slate-500 hover:text-slate-300 transition">
          Salir
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-8 pt-6 space-y-6">
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
        <div className="card text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1">Estado actual</p>
          <span className={`text-lg font-bold ${
            status === "WORKING" ? "text-emerald-400" :
            status === "ON_BREAK" ? "text-amber-400" :
            status === "FINISHED" ? "text-rose-400" : "text-slate-400"
          }`}>
            {STATUS_LABELS[status]}
          </span>
        </div>

        {/* Botones de fichaje */}
        {loading ? (
          <div className="text-center text-slate-500 py-6">Cargando...</div>
        ) : (
          <div className="grid gap-3">
            {(Object.keys(PUNCH_CONFIG) as PunchType[]).map((type) => {
              const cfg = PUNCH_CONFIG[type];
              const Icon = cfg.icon;
              const isAllowed = allowed.includes(type);
              const isLoading = punching === type;
              return (
                <button
                  key={type}
                  onClick={() => isAllowed && handlePunch(type)}
                  disabled={!isAllowed || punching !== null}
                  className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-5 text-lg font-bold text-white shadow-lg transition active:scale-95
                    ${isAllowed ? `${cfg.color} shadow-lg` : "bg-slate-800 text-slate-600 cursor-not-allowed shadow-none"}
                    ${isLoading ? "opacity-75 animate-pulse" : ""}
                  `}
                >
                  <Icon size={22} />
                  {isLoading ? "Registrando..." : cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Geolocalización toggle */}
        <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 cursor-pointer">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPin size={16} className={geoEnabled ? "text-blue-400" : ""} />
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
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
            feedback.type === "ok" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                   : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}>
            {feedback.msg}
          </div>
        )}

        {/* Historial de hoy */}
        {todayRecords.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Fichajes de hoy
            </p>
            <div className="card space-y-2">
              {todayRecords.map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-slate-500" />
                    <span className="text-slate-300">{PUNCH_CONFIG[r.type as PunchType]?.label ?? r.type}</span>
                  </div>
                  <span className="tabular-nums text-sm text-slate-400">
                    {format(new Date(r.timestamp), "HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nav a solicitudes */}
        <Link
          to="/worker/solicitudes"
          className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 transition hover:border-blue-500/40 hover:bg-slate-800"
        >
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-blue-400" />
            <span className="font-medium text-slate-300">Mis solicitudes de ausencia</span>
          </div>
          <ChevronRight size={18} className="text-slate-600" />
        </Link>
      </div>
    </div>
  );
}
