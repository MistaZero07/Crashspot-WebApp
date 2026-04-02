export type Severity = 'Fatal' | 'Serious Injury' | 'Minor Injury' | 'Property Damage Only';

export interface CrashRecord {
  id: string;
  lat: number;
  lng: number;
  year: number | null;
  month: number | null;
  hour: number | null;
  dateLabel: string;
  weekday: string;
  isWeekend: boolean;
  isNight: boolean;
  severity: Severity;
  injuryCount: number;
  vehicleCount: number;
  weather: string;
  roadCondition: string;
  location: string;
}

export interface HotspotPoint {
  lat: number;
  lng: number;
  score: number;
}

export interface FilterState {
  year: string;
  month: string;
  hourMin: number;
  hourMax: number;
  weekendOnly: boolean;
  nightOnly: boolean;
  fatalOnly: boolean;
}

export interface LayerState {
  crashPoints: boolean;
  density: boolean;
  clusters: boolean;
  riskRoads: boolean;
  predictedHotspots: boolean;
}
