import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, ClipboardCheck, Users, Plus, X, Trash2,
  Eye, EyeOff, AlertTriangle, CheckCircle, RefreshCw, ShieldCheck, HardHat,
} from "lucide-react";
import { KronosIcon } from "../../components/KronosLogo";
import { useAuth } from "../../context/AuthContext";
import { usersApi, UserDetail, Role } from "../../lib/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ROLE_CONFIG = {
  MANAGER: { label: "Gerente",    icon: ShieldCheck, color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  WORKER:  { label: "Trabajador", icon: HardHat,     color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

interface Toast { msg: string; type: "ok" | "err" }

function ToastBar({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const styles = {
    ok:  "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    err: "border-red-500/30 bg-red-500/10 text-red-400",
  };
  const Icon = toast.type === "ok" ? CheckCircle : AlertTriangle;
  return (
    <div className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-sm ${styles[toast.type]}`}>
      <Icon size={16} />
      <span className="text-sm font-medium">{toast.msg}</span>
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100 transition"><X size={14} /></button>
    </div>
  );
}

function ConfirmModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="card w-full max-w-sm space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-rose-500/10 p-2.5">
            <Trash2 size={20} className="text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Eliminar usuario</h3>
            <p className="mt-1 text-sm text-slate-400">
              ¿Eliminar a <span className="font-semibold text-white">{name}</span>? Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={onConfirm} className="btn-danger flex-1">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: "", email: "", password: "", role: "WORKER" as Role };

export default function Empleados() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserDetail | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function load() {
    setLoading(true);
    try {
      const res = await usersApi.list();
      setUsers(res.data.users);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await usersApi.create(form);
      setUsers((prev) => [...prev, res.data.user].sort((a, b) =>
        a.role === b.role ? a.name.localeCompare(b.name) : a.role.localeCompare(b.role)
      ));
      setToast({ msg: `Usuario "${res.data.user.name}" creado correctamente`, type: "ok" });
      setForm(EMPTY_FORM);
      setShowForm(false);
      setShowPw(false);
    } catch (err: any) {
      setToast({ msg: err.response?.data?.error ?? "Error al crear el usuario", type: "err" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.remove(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setToast({ msg: `Usuario "${deleteTarget.name}" eliminado`, type: "ok" });
    } catch (err: any) {
      setToast({ msg: err.response?.data?.error ?? "Error al eliminar", type: "err" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const managerCount = users.filter((u) => u.role === "MANAGER").length;
  const workerCount  = users.filter((u) => u.role === "WORKER").length;

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
              <h1 className="text-base font-bold leading-tight text-white">Empleados</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowForm((v) => !v); setShowPw(false); }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 active:scale-95"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Nuevo empleado</span>
            </button>
            <button onClick={logout} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition">
              Salir
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="mx-auto flex max-w-7xl gap-1 px-6 pb-0">
          <Link to="/manager/dashboard" className="nav-tab pb-3 rounded-none hover:border-b-2 hover:border-slate-600">
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
          <Link to="/manager/aprobaciones" className="nav-tab pb-3 rounded-none hover:border-b-2 hover:border-slate-600">
            <ClipboardCheck size={15} />
            Aprobaciones
          </Link>
          <Link to="/manager/empleados" className="nav-tab-active border-b-2 border-blue-500 rounded-none pb-3">
            <Users size={15} />
            Empleados
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-6 py-6">

        {/* KPIs rápidos */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { val: users.length, lbl: "Total usuarios",  color: "text-white",         border: "border-l-slate-600" },
            { val: workerCount,  lbl: "Trabajadores",     color: "text-emerald-400",   border: "border-l-emerald-500" },
            { val: managerCount, lbl: "Gerentes",         color: "text-blue-400",      border: "border-l-blue-500" },
          ].map((k) => (
            <div key={k.lbl} className={`card flex items-center gap-4 border-l-4 ${k.border} p-4`}>
              <div>
                <p className={`text-2xl font-extrabold ${k.color}`}>{k.val}</p>
                <p className="text-xs text-slate-500">{k.lbl}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Formulario nuevo empleado */}
        {showForm && (
          <form onSubmit={handleCreate} className="card space-y-4 border-blue-500/20">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Nuevo empleado</h2>
              <button type="button" onClick={() => { setShowForm(false); setShowPw(false); }} className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Nombre completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  placeholder="Ej. María López"
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="input-field"
                  placeholder="maria@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Contraseña inicial</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="input-field pr-12"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition" tabIndex={-1}>
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className="input-field"
                >
                  <option value="WORKER">Trabajador</option>
                  <option value="MANAGER">Gerente</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={() => { setShowForm(false); setShowPw(false); }} className="btn-ghost flex-1 sm:flex-none sm:px-6">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 sm:flex-none sm:px-8">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creando...
                  </span>
                ) : "Crear empleado"}
              </button>
            </div>
          </form>
        )}

        {/* Lista de usuarios */}
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Users size={16} className="text-blue-400" />
              <h2 className="font-semibold text-white">Todos los usuarios</h2>
              <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {users.length}
              </span>
            </div>
            <button onClick={load} className="text-slate-500 hover:text-slate-300 transition">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-px p-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 w-full mb-2" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-500">
              <Users size={40} className="mb-3 text-slate-700" />
              <p className="font-medium text-slate-400">Sin usuarios</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {users.map((u) => {
                const cfg = ROLE_CONFIG[u.role];
                const Icon = cfg.icon;
                const isSelf = u.id === user?.id;
                return (
                  <div key={u.id} className="flex items-center justify-between px-5 py-3.5 transition hover:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-300">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{u.name}</p>
                          {isSelf && (
                            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                              Tú
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden items-center gap-1.5 sm:flex">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="hidden text-xs text-slate-600 lg:block">
                        {format(new Date(u.createdAt), "d MMM yyyy", { locale: es })}
                      </p>
                      {!isSelf && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="rounded-lg p-1.5 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-400"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {deleteTarget && (
        <ConfirmModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {toast && <ToastBar toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
