import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { KronosLogoFull } from "../components/KronosLogo";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setError(err.response?.data?.error ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo oficial */}
        <div className="mb-8 flex flex-col items-center">
          <div className="rounded-3xl bg-white/90 p-4 shadow-2xl shadow-black/40">
            <KronosLogoFull width={180} />
          </div>
          <p className="mt-4 text-sm text-slate-400">Control horario y gestión de ausencias</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none ring-blue-500 transition focus:ring-2"
              placeholder="tu@empresa.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none ring-blue-500 transition focus:ring-2"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
