import { Loader2, Check, AlertCircle } from "lucide-react";

export function AutoSaveIndicator({
  isDirty, isSaving, lastSavedAt, error,
}: {
  isDirty: boolean; isSaving: boolean; lastSavedAt: Date | null; error?: boolean;
}) {
  if (error) {
    return <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Save failed — retrying</span>;
  }
  if (isSaving) {
    return <span className="text-xs text-slate-400 flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</span>;
  }
  if (isDirty) {
    return <span className="text-xs text-amber-500">Unsaved changes</span>;
  }
  if (lastSavedAt) {
    return (
      <span className="text-xs text-green-600 flex items-center gap-1">
        <Check className="w-3.5 h-3.5" /> Saved at {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    );
  }
  return null;
}