export const Legend = () => (
  <div className="absolute bottom-4 left-4 z-[600] w-56 rounded-xl border border-slate-700 bg-slate-950/90 p-3 text-xs text-slate-200 shadow-panel backdrop-blur">
    <p className="mb-2 text-sm font-semibold">Map Legend</p>
    <ul className="space-y-1">
      <li><span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Fatal crash points</li>
      <li><span className="inline-block h-2 w-2 rounded-full bg-cyan-400" /> Non-fatal crash points</li>
      <li><span className="inline-block h-2 w-2 rounded-full bg-violet-400" /> Predicted hotspots</li>
      <li><span className="inline-block h-2 w-8 bg-orange-500 align-middle" /> High-risk road segments</li>
      <li><span className="inline-block h-2 w-8 bg-cyan-400 align-middle" /> Lower-risk road segments</li>
    </ul>
  </div>
);
