import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, EyeOff, MapPin, Zap, Calendar, Shield,
  BarChart2, Download, ChevronDown, CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { KronosLogoFull, KronosIcon } from "../components/KronosLogo";

const FEATURES = [
  {
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    title: "Fichaje al instante",
    desc: "Entrada, descanso y salida en un toque desde cualquier dispositivo móvil.",
  },
  {
    icon: MapPin,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    title: "GPS integrado",
    desc: "Coordenadas registradas automáticamente en cada fichaje, sin fricciones.",
  },
  {
    icon: Calendar,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    title: "Ausencias sin papel",
    desc: "Solicita y aprueba vacaciones directamente en la plataforma.",
  },
  {
    icon: Shield,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    title: "Control de conflictos",
    desc: "Alertas automáticas cuando empleados incompatibles piden las mismas fechas.",
  },
  {
    icon: BarChart2,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    title: "Dashboard en vivo",
    desc: "Estado de todo tu equipo actualizado automáticamente cada 30 segundos.",
  },
  {
    icon: Download,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    title: "Exportación directa",
    desc: "Informes mensuales en Excel y CSV listos para nóminas o RRHH.",
  },
];

const DEMO_ACCOUNTS = [
  {
    role: "Gerente",
    email: "gerente@empresa.com",
    password: "manager123",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    role: "Trabajador",
    email: "ana@empresa.com",
    password: "worker123",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

const TAGS = ["Sin instalaciones", "Multiplataforma", "Exportación Excel", "Alertas automáticas"];

const STATS = [
  { val: "100%", lbl: "Web · Sin apps" },
  { val: "2", lbl: "Roles de acceso" },
  { val: "4", lbl: "Tipos de fichaje" },
  { val: "30s", lbl: "Refresco en vivo" },
];

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  if (user) {
    navigate(user.role === "MANAGER" ? "/manager/dashboard" : "/worker/fichar");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(acc: (typeof DEMO_ACCOUNTS)[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
    setShowDemo(false);
    setError("");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">

      {/* ── Fondo decorativo ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="pointer-events-none absolute -top-48 -left-48 h-[640px] w-[640px] rounded-full bg-blue-700/25 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]" style={{ backgroundColor: "rgba(123,26,44,0.18)" }} />
      <div className="pointer-events-none absolute -bottom-48 -right-24 h-[580px] w-[580px] rounded-full bg-violet-700/20 blur-[140px]" />
      <div className="pointer-events-none absolute top-0 right-1/4 h-[320px] w-[320px] rounded-full bg-cyan-700/10 blur-[90px]" />

      {/* ── Layout principal ── */}
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">

        {/* ══════════════════════════════════════
            IZQUIERDA — Contenido comercial
            Solo visible en desktop (lg+)
        ══════════════════════════════════════ */}
        <section className="hidden flex-col justify-between px-14 py-16 lg:flex lg:flex-1 xl:px-20 xl:py-20">

          {/* Logo */}
          <div>
            <div className="inline-block rounded-2xl bg-white/90 px-4 py-3 shadow-2xl shadow-black/50 ring-1 ring-white/10">
              <KronosLogoFull width={168} />
            </div>
          </div>

          {/* Hero */}
          <div className="my-auto py-10">

            {/* Badge "en vivo" */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/50 px-4 py-1.5 text-xs font-semibold text-slate-400 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Control horario en tiempo real
            </div>

            <h1 className="max-w-xl text-5xl font-black leading-[1.07] tracking-tight text-white xl:text-[3.6rem]">
              El tiempo de tu equipo,{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(130deg, #f43f5e 15%, #a855f7 55%, #3b82f6 100%)" }}
              >
                bajo control.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-[1.05rem] leading-relaxed text-slate-400">
              Fichajes GPS, gestión de ausencias y dashboards en tiempo real —
              todo en una plataforma{" "}
              <span className="font-semibold text-slate-200">100%&nbsp;web</span>, sin instalar nada.
            </p>

            {/* Tags */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {TAGS.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/40 px-3 py-1 text-xs font-medium text-slate-400"
                >
                  <CheckCircle2 size={10} className="shrink-0 text-emerald-400" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Grid de funcionalidades 3×2 */}
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={`flex flex-col gap-2.5 rounded-xl border ${f.border} ${f.bg} p-4 transition duration-200 hover:brightness-125`}
                >
                  <div className={`w-fit rounded-lg p-2 ${f.bg}`}>
                    <f.icon size={15} className={f.color} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-10 border-t border-slate-800/60 pt-8">
            {STATS.map((s) => (
              <div key={s.val}>
                <p
                  className="text-2xl font-extrabold text-white"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {s.val}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">{s.lbl}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
            DERECHA — Panel de login
            Full-page en mobile, columna en desktop
        ══════════════════════════════════════ */}
        <section className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:w-[460px] lg:flex-none lg:border-l lg:border-slate-800/50 lg:bg-slate-900/20 lg:backdrop-blur-2xl">

          <div className="w-full max-w-sm">

            {/* ── Mobile: logo + titular ── */}
            <div className="mb-8 lg:hidden">
              <div className="flex justify-center">
                <div className="rounded-2xl bg-white/90 px-5 py-4 shadow-2xl shadow-black/50">
                  <KronosLogoFull width={156} />
                </div>
              </div>
              <h2 className="mt-6 text-center text-2xl font-black leading-tight text-white">
                El tiempo de tu equipo,{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(130deg, #f43f5e, #a855f7, #3b82f6)" }}
                >
                  bajo control.
                </span>
              </h2>
              <p className="mt-2 text-center text-sm text-slate-500">
                Control horario y gestión de ausencias 100% web.
              </p>
            </div>

            {/* ── Desktop: cabecera compacta ── */}
            <div className="mb-7 hidden items-center gap-3 lg:flex">
              <div className="rounded-xl bg-white/90 p-1.5 shadow-lg">
                <KronosIcon size={32} />
              </div>
              <div>
                <p className="font-bold text-white">Iniciar sesión</p>
                <p className="text-xs text-slate-500">Accede a tu cuenta de KRONOS+</p>
              </div>
            </div>

            {/* ── Tarjeta de login ── */}
            <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-2xl shadow-black/60 backdrop-blur-sm">

              {/* Línea de acento superior */}
              <div
                className="h-[2px] w-full"
                style={{ backgroundImage: "linear-gradient(90deg, #7B1A2C 0%, #3b82f6 50%, #a855f7 100%)" }}
              />

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4 p-6 pb-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="tu@empresa.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pr-12"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full py-3.5 text-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Entrando...
                    </span>
                  ) : (
                    "Iniciar sesión"
                  )}
                </button>
              </form>

              {/* Acceso rápido demo */}
              <div className="border-t border-slate-800/80 px-6 pb-5">
                <button
                  type="button"
                  onClick={() => setShowDemo((v) => !v)}
                  className="mt-4 flex w-full items-center justify-between text-xs text-slate-600 transition hover:text-slate-400"
                >
                  <span>Acceso rápido · cuentas demo</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${showDemo ? "rotate-180" : ""}`}
                  />
                </button>

                {showDemo && (
                  <div className="mt-3 space-y-2">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => fillDemo(acc)}
                        className={`w-full rounded-xl border ${acc.border} ${acc.bg} px-4 py-2.5 text-left transition hover:brightness-125 active:scale-[0.99]`}
                      >
                        <p className={`text-xs font-bold ${acc.color}`}>{acc.role}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                          {acc.email}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Mobile: chips de funcionalidades ── */}
            <div className="mt-8 lg:hidden">
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-700">
                Incluye
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {FEATURES.map((f) => (
                  <span
                    key={f.title}
                    className={`flex items-center gap-1.5 rounded-full border ${f.border} ${f.bg} px-3 py-1 text-xs font-medium ${f.color}`}
                  >
                    <f.icon size={10} className="shrink-0" />
                    {f.title}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer tagline */}
            <p className="mt-6 text-center text-[11px] text-slate-700">
              KRONOS+ · Gestión de personal en tiempo real
            </p>

          </div>
        </section>
      </div>
    </div>
  );
}
