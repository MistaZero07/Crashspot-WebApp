import type { FilterState, LayerState } from '../../types/models';

interface FilterPanelProps {
  filters: FilterState;
  layers: LayerState;
  onFiltersChange: (next: FilterState) => void;
  onLayersChange: (next: LayerState) => void;
}

export const FilterPanel = ({ filters, layers, onFiltersChange, onLayersChange }: FilterPanelProps) => {
  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => onFiltersChange({ ...filters, [key]: value });
  const updateLayer = <K extends keyof LayerState>(key: K, value: LayerState[K]) => onLayersChange({ ...layers, [key]: value });

  return (
    <section className="panel-card">
      <h2 className="panel-title">Filters & Layers</h2>

      <div className="grid grid-cols-2 gap-2">
        <label className="field">
          <span>Year</span>
          <select value={filters.year} onChange={(e) => update('year', e.target.value)}>
            <option value="">All</option>
            <option value="2021">2021</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
          </select>
        </label>
        <label className="field">
          <span>Month</span>
          <select value={filters.month} onChange={(e) => update('month', e.target.value)}>
            <option value="">All</option>
            {Array.from({ length: 12 }, (_, idx) => (
              <option key={idx + 1} value={idx + 1}>{idx + 1}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3">
        <p className="text-xs text-slate-400">Hour range: {filters.hourMin}:00 - {filters.hourMax}:00</p>
        <input type="range" min={0} max={23} value={filters.hourMin} onChange={(e) => update('hourMin', Number(e.target.value))} />
        <input type="range" min={0} max={23} value={filters.hourMax} onChange={(e) => update('hourMax', Number(e.target.value))} />
      </div>

      <div className="mt-3 space-y-2 text-sm text-slate-200">
        <label className="check"><input type="checkbox" checked={filters.weekendOnly} onChange={(e) => update('weekendOnly', e.target.checked)} />Weekend only</label>
        <label className="check"><input type="checkbox" checked={filters.nightOnly} onChange={(e) => update('nightOnly', e.target.checked)} />Nighttime only</label>
        <label className="check"><input type="checkbox" checked={filters.fatalOnly} onChange={(e) => update('fatalOnly', e.target.checked)} />Fatal crashes only</label>
      </div>

      <div className="my-4 h-px bg-slate-700" />

      <div className="space-y-2 text-sm text-slate-200">
        <label className="check"><input type="checkbox" checked={layers.crashPoints} onChange={(e) => updateLayer('crashPoints', e.target.checked)} />Crash points</label>
        <label className="check"><input type="checkbox" checked={layers.density} onChange={(e) => updateLayer('density', e.target.checked)} />Density circles</label>
        <label className="check"><input type="checkbox" checked={layers.clusters} onChange={(e) => updateLayer('clusters', e.target.checked)} />Clusters</label>
        <label className="check"><input type="checkbox" checked={layers.riskRoads} onChange={(e) => updateLayer('riskRoads', e.target.checked)} />Road risk segments</label>
        <label className="check"><input type="checkbox" checked={layers.predictedHotspots} onChange={(e) => updateLayer('predictedHotspots', e.target.checked)} />Predicted hotspots</label>
      </div>

      <button
        className="mt-4 w-full rounded-lg bg-cyan-400/90 px-3 py-2 font-medium text-slate-900"
        onClick={() => onFiltersChange({ year: '', month: '', hourMin: 0, hourMax: 23, weekendOnly: false, nightOnly: false, fatalOnly: false })}
      >
        Reset filters
      </button>
    </section>
  );
};
