interface DriveModeCardProps {
  enabled: boolean;
  status: string;
  warning: string | null;
  onToggle: (enabled: boolean) => void;
}

export const DriveModeCard = ({ enabled, status, warning, onToggle }: DriveModeCardProps) => (
  <section className="panel-card">
    <h2 className="panel-title">Drive Mode</h2>
    <label className="check text-sm">
      <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
      Enable live location safety monitoring
    </label>

    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-300">
      <p className="font-semibold text-slate-100">Status</p>
      <p className="mt-1">{status}</p>
      {warning && <p className="mt-2 rounded bg-red-500/15 px-2 py-1 text-red-300">⚠ {warning}</p>}
    </div>

    <p className="mt-3 text-xs text-slate-400">Alerts trigger when you move within ~120 meters of a predicted risk hotspot.</p>
  </section>
);
