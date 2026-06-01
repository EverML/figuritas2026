import { Search, X } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChange, placeholder = "Buscar código..." }: SearchBarProps) {
  return (
    <label className="flex items-center gap-3 rounded-3xl border border-line bg-white px-4 py-3 shadow-soft">
      <Search size={20} className="shrink-0 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-slate-400"
        inputMode="search"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
          aria-label="Limpiar búsqueda"
        >
          <X size={16} />
        </button>
      ) : null}
    </label>
  );
}
