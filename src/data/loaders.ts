import type { GeoJSONFeatureCollection } from '../types/geojson';

const fetchGeoJson = async (path: string): Promise<GeoJSONFeatureCollection> => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path} (${response.status})`);
  return response.json();
};

export const loadCrashspotData = async () => {
  const [crashes, clusters, roads, risks] = await Promise.all([
    fetchGeoJson('/data/fars_monroe_2021_2022_2023_clean.geojson'),
    fetchGeoJson('/data/fars_monroe_clusters.geojson'),
    fetchGeoJson('/data/road_segments_risk.geojson'),
    fetchGeoJson('/data/predicted_crash_risk.geojson')
  ]);

  return {
    crashes: crashes.features,
    clusters: clusters.features,
    roads: roads.features,
    riskSpots: risks.features
  };
};
