import { AlertTriangle, X } from "lucide-react";

export type ToastState = {
  title?: string;
  message: string;
  variant?: "default" | "error";
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

  const isError = toast.variant === "error";

  return (
    <div
      className="fixed inset-x-0 bottom-20 z-50 px-4 pb-[env(safe-area-inset-bottom)] sm:bottom-24"
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <div
        className={
          isError
            ? "mx-auto flex max-w-[520px] items-start gap-4 rounded-[30px] border-2 border-red-200 bg-red-600 px-5 py-5 text-white shadow-[0_24px_80px_rgba(185,28,28,0.45)] ring-4 ring-red-100/80"
            : "mx-auto flex max-w-[440px] items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-float"
        }
      >
        {isError ? (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600 shadow-lg">
            <AlertTriangle size={30} strokeWidth={2.6} />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          {toast.title ? (
            <p className={isError ? "text-xl font-black leading-tight tracking-tight" : "sr-only"}>{toast.title}</p>
          ) : null}
          <p className={isError ? "mt-1 text-base font-extrabold leading-6" : "text-sm font-semibold"}>
            {toast.message}
          </p>
        </div>
        {toast.actionLabel && toast.onAction ? (
          <button
            type="button"
            onClick={toast.onAction}
            className={
              isError
                ? "rounded-full bg-white px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-50"
                : "rounded-full bg-primary-500 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-primary-400"
            }
          >
            {toast.actionLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className={
            isError
              ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-700/70 text-white transition hover:bg-red-800"
              : "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
          }
          aria-label="Cerrar aviso"
        >
          <X size={isError ? 20 : 16} />
        </button>
      </div>
    </div>
  );
}
