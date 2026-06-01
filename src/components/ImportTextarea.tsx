import { Upload } from "lucide-react";

type ImportTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  previewCount: number;
  onImport: () => void;
  disabled?: boolean;
};

export function ImportTextarea({
  value,
  onChange,
  previewCount,
  onImport,
  disabled,
}: ImportTextareaProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-line bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-extrabold text-ink">Pegar lista</h2>
            <p className="mt-1 text-sm text-slate-500">
              Un código o nombre por línea. Los encabezados con `--` se usan como grupos.
            </p>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-bold text-primary-700">
            {previewCount} detectadas
          </span>
        </div>

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={`-- Especiales missing\nFWC 1\nFWC 3\n\n-- PAISES MISSING\nPAN 01\nPAN 04`}
          className="min-h-[260px] w-full resize-none rounded-[24px] border border-primary-100 bg-slate-50 px-4 py-3 text-[15px] font-medium leading-6 text-ink outline-none placeholder:text-slate-400 focus:border-primary-500"
          spellCheck={false}
        />
      </div>

      <button
        type="button"
        onClick={onImport}
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-700 px-4 py-4 text-[15px] font-bold text-white shadow-float transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Upload size={18} />
        Importar lista
      </button>
    </div>
  );
}
