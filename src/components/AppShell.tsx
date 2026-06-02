import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  footer: ReactNode;
};

export function AppShell({ children, footer }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col">
        <main className="flex-1 px-4 pb-24 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-5 sm:pt-5">
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
}
