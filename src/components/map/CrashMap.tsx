import { Circle, CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import type { CrashRecord, HotspotPoint, LayerState } from '../../types/models';
import type { GeoJSONFeature } from '../../types/geojson';
import { getSeverityColor } from '../../utils/insights';

type Position = { lat: number; lng: number };

interface CrashMapProps {
  crashes: CrashRecord[];
  clusters: GeoJSONFeature[];
  roads: GeoJSONFeature[];
  hotspots: HotspotPoint[];
  layers: LayerState;
  selectedFocus: Position | null;
  userLocation: Position | null;
}

const FlyToSelection = ({ selectedFocus }: { selectedFocus: Position | null }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedFocus) map.flyTo([selectedFocus.lat, selectedFocus.lng], 15, { duration: 0.8 });
  }, [map, selectedFocus]);
  return null;
};

export const CrashMap = ({ crashes, clusters, roads, hotspots, layers, selectedFocus, userLocation }: CrashMapProps) => {
  const densityPoints = new Map<string, { lat: number; lng: number; count: number }>();
  crashes.forEach((row) => {
    const key = `${row.lat.toFixed(2)}-${row.lng.toFixed(2)}`;
    const existing = densityPoints.get(key);
    if (!existing) densityPoints.set(key, { lat: row.lat, lng: row.lng, count: 1 });
    else existing.count += 1;
  });

  return (
    <MapContainer center={[32.5093, -92.1193]} zoom={12} minZoom={10} className="h-full w-full">
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FlyToSelection selectedFocus={selectedFocus} />

      {layers.crashPoints &&
        crashes.map((crash) => (
          <CircleMarker
            key={crash.id}
            center={[crash.lat, crash.lng]}
            radius={Math.max(4, crash.vehicleCount * 1.8)}
            pathOptions={{ color: '#fff', weight: 1, fillColor: getSeverityColor(crash.severity), fillOpacity: 0.9 }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">{crash.location}</p>
                <p>{crash.dateLabel} • {crash.weekday}</p>
                <p>Severity: {crash.severity}</p>
                <p>Vehicles: {crash.vehicleCount} • Injuries: {crash.injuryCount}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

      {layers.density &&
        [...densityPoints.values()].map((spot) => (
          <Circle
            key={`${spot.lat}-${spot.lng}`}
            center={[spot.lat, spot.lng]}
            radius={Math.max(60, spot.count * 40)}
            pathOptions={{ color: 'transparent', fillColor: '#22d3ee', fillOpacity: Math.min(0.55, 0.16 + spot.count * 0.08) }}
          >
            <Popup>Density score: {spot.count}</Popup>
          </Circle>
        ))}

      {layers.clusters && (
        <GeoJSON
          data={{ type: 'FeatureCollection', features: clusters }}
          pointToLayer={(_, latlng) => new L.Circle(latlng, { radius: 150, color: '#22d3ee', fillOpacity: 0.15, weight: 2 })}
        />
      )}

      {layers.riskRoads && (
        <GeoJSON
          data={{ type: 'FeatureCollection', features: roads }}
          style={(feature) => {
            const riskValue = Number(feature?.properties?.risk ?? feature?.properties?.risk_score ?? 0);
            return {
              color: riskValue > 0.7 ? '#f97316' : '#22d3ee',
              opacity: 0.85,
              weight: riskValue > 0.7 ? 4 : 2
            };
          }}
        />
      )}

      {layers.predictedHotspots &&
        hotspots.slice(0, 35).map((spot) => (
          <CircleMarker
            key={`${spot.lat}-${spot.lng}`}
            center={[spot.lat, spot.lng]}
            radius={7}
            pathOptions={{ color: '#fff', weight: 1.3, fillColor: '#a78bfa', fillOpacity: 0.92 }}
          >
            <Popup>Predicted risk score: {spot.score.toFixed(3)}</Popup>
          </CircleMarker>
        ))}

      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={8}
          pathOptions={{ color: '#06b6d4', fillColor: '#22d3ee', fillOpacity: 0.8, weight: 2 }}
        >
          <Popup>Your location</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
};
