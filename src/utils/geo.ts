import type { GeoJSONFeature } from '../types/geojson';
import type { HotspotPoint } from '../types/models';

const getRiskScore = (props: Record<string, unknown>) => {
  const candidates = ['risk_score', 'predicted_prob', 'risk', 'score', 'RISK'];
  for (const key of candidates) {
    const value = props[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim()) return Number(value);
  }
  return 0;
};

export const toHotspots = (features: GeoJSONFeature[]): HotspotPoint[] => {
  return features
    .map((feature) => {
      if (feature.geometry.type !== 'Point') return null;
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      return { lat, lng, score: getRiskScore(feature.properties ?? {}) };
    })
    .filter((spot): spot is HotspotPoint => Boolean(spot));
};

export const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
