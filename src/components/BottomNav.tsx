import { Download, PieChart, Search, Sticker } from "lucide-react";

export type TabKey = "missing" | "search" | "summary" | "import";

type BottomNavProps = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

const tabs: Array<{ key: TabKey; label: string; icon: typeof Sticker }> = [
  { key: "missing", label: "Faltantes", icon: Sticker },
  { key: "search", label: "Buscar", icon: Search },
  { key: "summary", label: "Resumen", icon: PieChart },
  { key: "import", label: "Importar", icon: Download },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="sticky bottom-0 z-40 border-t border-line bg-white/90 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.key === activeTab;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={[
                "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl px-2 text-xs font-semibold transition",
                active
                  ? "bg-primary-50 text-primary-700 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.12)]"
                  : "text-slate-500 hover:bg-slate-50",
              ].join(" ")}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
