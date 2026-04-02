import type { CrashRecord } from '../../types/models';
import { buildSummary, topCrashLocations } from '../../utils/insights';
import { StatCard } from '../common/StatCard';

interface InsightsPanelProps {
  filteredCrashes: CrashRecord[];
  onJumpToLocation: (lat: number, lng: number) => void;
}

export const InsightsPanel = ({ filteredCrashes, onJumpToLocation }: InsightsPanelProps) => {
  const summary = buildSummary(filteredCrashes);
  const topLocations = topCrashLocations(filteredCrashes, 5);
  const maxHourCount = Math.max(...summary.byHour, 1);

  return (
    <section className="panel-card">
      <h2 className="panel-title">Insights</h2>

      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total Crashes" value={summary.totalCrashes} />
        <StatCard label="Fatal" value={summary.fatalCrashes} />
        <StatCard label="Total Injuries" value={summary.totalInjuries} />
        <StatCard label="Peak Hour" value={summary.peakHour === null ? 'N/A' : `${summary.peakHour}:00`} />
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-slate-100">Crash volume by hour</h3>
        <div className="mt-2 grid grid-cols-12 gap-1">
          {summary.byHour.map((count, hour) => (
            <div key={hour} title={`${hour}:00 • ${count} crashes`} className="flex flex-col items-center gap-1">
              <div className="w-full rounded bg-cyan-400/80" style={{ height: `${Math.max(4, (count / maxHourCount) * 58)}px` }} />
              <span className="text-[10px] text-slate-400">{hour}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-slate-100">Top crash locations</h3>
        <ul className="mt-2 space-y-2">
          {topLocations.length === 0 ? (
            <li className="rounded border border-slate-700 bg-slate-900/60 p-2 text-xs text-slate-400">No crashes match active filters.</li>
          ) : (
            topLocations.map((spot) => (
              <li key={`${spot.lat}-${spot.lng}`}>
                <button
                  className="w-full rounded border border-slate-700 bg-slate-900/70 p-2 text-left text-xs hover:border-cyan-400/60"
                  onClick={() => onJumpToLocation(spot.lat, spot.lng)}
                >
                  <p className="truncate font-medium text-slate-100">{spot.label}</p>
                  <p className="mt-1 text-slate-400">{spot.count} crashes • {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}</p>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
};
