import { AlertTriangle, X } from "lucide-react";

interface ConflictAlertProps {
  conflictingUsers: { id: string; name: string }[];
  onDismiss?: () => void;
  compact?: boolean;
}

export default function ConflictAlert({ conflictingUsers, onDismiss, compact }: ConflictAlertProps) {
  if (conflictingUsers.length === 0) return null;

  if (compact) {
    return (
      <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/30 gap-1">
        <AlertTriangle size={11} />
        Conflicto
      </span>
    );
  }

  return (
    <div className="relative rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 text-amber-400 hover:text-amber-200 transition"
        >
          <X size={16} />
        </button>
      )}
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-amber-400" size={18} />
        <div>
          <p className="font-semibold text-amber-300">Conflicto de incompatibilidades</p>
          <p className="mt-0.5 text-sm text-amber-400/80">
            Las siguientes personas ya tienen vacaciones aprobadas en esas fechas:
          </p>
          <ul className="mt-2 space-y-1">
            {conflictingUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-2 text-sm font-medium text-amber-300">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                {u.name}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-500">
            Revisa la política de incompatibilidades antes de aprobar.
          </p>
        </div>
      </div>
    </div>
  );
}
