type StatsCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function StatsCard({ label, value, helper }: StatsCardProps) {
  return (
    <div className="rounded-[24px] border border-line bg-white p-4 shadow-soft">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{value}</p>
      {helper ? <p className="mt-1 text-xs font-medium text-slate-400">{helper}</p> : null}
    </div>
  );
}
