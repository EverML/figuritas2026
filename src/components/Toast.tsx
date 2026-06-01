import { X } from "lucide-react";

export type ToastState = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastProps = {
  toast: ToastState | null;
  onClose: () => void;
};

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 px-4 pb-[env(safe-area-inset-bottom)] sm:bottom-24">
      <div className="mx-auto flex max-w-[440px] items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-float">
        <p className="flex-1 text-sm font-semibold">{toast.message}</p>
        {toast.actionLabel && toast.onAction ? (
          <button
            type="button"
            onClick={toast.onAction}
            className="rounded-full bg-primary-500 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-primary-400"
          >
            {toast.actionLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Cerrar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
