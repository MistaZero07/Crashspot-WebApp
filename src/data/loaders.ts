import type { GeoJSONFeatureCollection } from '../types/geojson';

const dataUrl = (path: string) => new URL(path, import.meta.env.BASE_URL).toString();

const fetchGeoJson = async (path: string): Promise<GeoJSONFeatureCollection> => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path} (${response.status})`);
  return response.json();
};

export const loadCrashspotData = async () => {
  const [crashes, clusters, roads, risks] = await Promise.all([
    fetchGeoJson(dataUrl('data/fars_monroe_2021_2022_2023_clean.geojson')),
    fetchGeoJson(dataUrl('data/fars_monroe_clusters.geojson')),
    fetchGeoJson(dataUrl('data/road_segments_risk.geojson')),
    fetchGeoJson(dataUrl('data/predicted_crash_risk.geojson'))
  ]);

  return {
    crashes: crashes.features,
    clusters: clusters.features,
    roads: roads.features,
    riskSpots: risks.features
  };
};
