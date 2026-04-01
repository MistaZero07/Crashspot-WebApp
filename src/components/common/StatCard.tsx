interface StatCardProps {
  label: string;
  value: string | number;
}

export const StatCard = ({ label, value }: StatCardProps) => (
  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
    <p className="text-2xl font-semibold text-white">{value}</p>
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
  </div>
);
