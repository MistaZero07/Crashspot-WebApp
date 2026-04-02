import { useEffect, useMemo, useState } from 'react';
import { loadCrashspotData } from './data/loaders';
import { FilterPanel } from './components/filters/FilterPanel';
import { InsightsPanel } from './components/insights/InsightsPanel';
import { DriveModeCard } from './components/drive/DriveModeCard';
import { CrashMap } from './components/map/CrashMap';
import { Legend } from './components/map/Legend';
import { filterCrashes, normalizeCrashFeature } from './utils/crash';
import { haversineMeters, toHotspots } from './utils/geo';
import type { CrashRecord, FilterState, LayerState } from './types/models';
import type { GeoJSONFeature } from './types/geojson';

const initialFilters: FilterState = {
  year: '',
  month: '',
  hourMin: 0,
  hourMax: 23,
  weekendOnly: false,
  nightOnly: false,
  fatalOnly: false
};

const initialLayers: LayerState = {
  crashPoints: true,
  density: false,
  clusters: false,
  riskRoads: false,
  predictedHotspots: true
};

interface AppData {
  crashes: CrashRecord[];
  clusters: GeoJSONFeature[];
  roads: GeoJSONFeature[];
  riskSpots: GeoJSONFeature[];
}

function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [layers, setLayers] = useState<LayerState>(initialLayers);
  const [selectedFocus, setSelectedFocus] = useState<{ lat: number; lng: number } | null>(null);

  const [driveEnabled, setDriveEnabled] = useState(false);
  const [driveStatus, setDriveStatus] = useState('Drive Mode is off');
  const [driveWarning, setDriveWarning] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const raw = await loadCrashspotData();
        setData({
          crashes: raw.crashes.map(normalizeCrashFeature).filter((x): x is CrashRecord => Boolean(x)),
          clusters: raw.clusters,
          roads: raw.roads,
          riskSpots: raw.riskSpots
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown data loading error');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filteredCrashes = useMemo(() => (data ? filterCrashes(data.crashes, filters) : []), [data, filters]);
  const hotspots = useMemo(() => (data ? toHotspots(data.riskSpots) : []), [data]);

  useEffect(() => {
    if (!driveEnabled) return;
    if (!navigator.geolocation) {
      setDriveStatus('Geolocation is not available in this browser.');
      return;
    }

    setDriveStatus('Locating your position...');
    const warned = new Set<string>();

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const current = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(current);
        setDriveStatus('Live tracking active');

        const near = hotspots.find((spot) => haversineMeters(current.lat, current.lng, spot.lat, spot.lng) <= 120);
        if (near) {
          const key = `${near.lat.toFixed(5)}-${near.lng.toFixed(5)}`;
          if (!warned.has(key)) {
            warned.add(key);
            setDriveWarning(`Entered high-risk zone near ${near.lat.toFixed(4)}, ${near.lng.toFixed(4)}.`);
          }
        }
      },
      (geoError) => {
        setDriveStatus(`Location error: ${geoError.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2500,
        timeout: 10000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setUserLocation(null);
      setDriveWarning(null);
      setDriveStatus('Drive Mode is off');
    };
  }, [driveEnabled, hotspots]);

  if (loading) {
    return <div className="grid h-screen place-items-center bg-slate-950 text-slate-200">Loading Crashspot dashboard…</div>;
  }

  if (error || !data) {
    return <div className="grid h-screen place-items-center bg-slate-950 p-6 text-red-300">Failed to load data: {error}</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90 px-5 py-3 backdrop-blur">
        <h1 className="text-xl font-bold">Crashspot Safety Dashboard</h1>
        <p className="text-xs text-slate-400">Monroe, Louisiana | 2021–2023 crash intelligence, hotspots, and live Drive Mode alerts</p>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[360px_1fr]">
        <aside className="overflow-y-auto border-r border-slate-800 bg-slate-900/40 p-3">
          <div className="space-y-3">
            <FilterPanel filters={filters} layers={layers} onFiltersChange={setFilters} onLayersChange={setLayers} />
            <InsightsPanel filteredCrashes={filteredCrashes} onJumpToLocation={(lat, lng) => setSelectedFocus({ lat, lng })} />
            <DriveModeCard enabled={driveEnabled} status={driveStatus} warning={driveWarning} onToggle={setDriveEnabled} />
          </div>
        </aside>

        <section className="relative min-h-[420px]">
          <CrashMap
            crashes={filteredCrashes}
            clusters={data.clusters}
            roads={data.roads}
            hotspots={hotspots}
            layers={layers}
            selectedFocus={selectedFocus}
            userLocation={userLocation}
          />
          <Legend />
        </section>
      </main>
    </div>
  );
}

export default App;
