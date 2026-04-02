import type { CrashRecord, FilterState, Severity } from '../types/models';
import type { GeoJSONFeature } from '../types/geojson';

const isWeekendDay = (day: number) => day === 0 || day === 6;
const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));

const getProp = (obj: Record<string, unknown>, keys: string[], fallback: unknown = null): unknown => {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
};

const parseHour = (properties: Record<string, unknown>): number | null => {
  const direct = getProp(properties, ['HOUR', 'CRASH_HOUR', 'hour']);
  if (direct !== null) {
    const match = String(direct).match(/\d+/);
    if (match) return clamp(Number(match[0]), 0, 23);
  }
  const time = getProp(properties, ['TIME', 'CRASH_TIME', 'time']);
  const parsed = String(time ?? '').match(/(\d{1,2})/);
  return parsed ? clamp(Number(parsed[1]), 0, 23) : null;
};

const severityFrom = (properties: Record<string, unknown>): Severity => {
  const fatals = Number(getProp(properties, ['FATALS', 'fatalities', 'DEATHS', 'FATAL_COUNT'], 0));
  if (fatals > 0) return 'Fatal';

  const mapped = String(getProp(properties, ['MAX_SEV', 'MAX_SEVERITY', 'INJ_SEV', 'SEV', 'SEVERITY'], '')).toLowerCase();
  if (/(fatal|\b1\b)/.test(mapped)) return 'Fatal';
  if (/(serious|severe|\b2\b)/.test(mapped)) return 'Serious Injury';
  if (/(minor|possible|\b3\b|\b4\b)/.test(mapped)) return 'Minor Injury';

  const injuries = Number(getProp(properties, ['INJURIES', 'PERSONS_INJURED', 'INJ_TOTAL', 'INJURIES_TOTAL'], 0));
  return injuries > 0 ? 'Minor Injury' : 'Property Damage Only';
};

export const normalizeCrashFeature = (feature: GeoJSONFeature, idx: number): CrashRecord | null => {
  if (feature.geometry?.type !== 'Point') return null;
  const [lng, lat] = feature.geometry.coordinates as [number, number];
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const props = feature.properties ?? {};
  const dateRaw = String(getProp(props, ['DATE', 'CRASH_DATE', 'date'], ''));
  const dateValue = dateRaw ? new Date(dateRaw) : null;
  const hour = parseHour(props);

  const street = String(getProp(props, ['ST_NAME', 'STREET', 'INTDESC', 'LOCATION', 'INTERSECT'], ''));
  const city = String(getProp(props, ['CITY', 'CITY_NAME', 'TOWN', 'MUNICIPALITY'], 'Monroe'));

  return {
    id: String(getProp(props, ['ID', 'ST_CASE', 'id'], `crash-${idx}`)),
    lat,
    lng,
    year: Number(getProp(props, ['YEAR', 'CRASH_YEAR', 'year'], NaN)) || null,
    month: Number(getProp(props, ['MONTH', 'CRASH_MONTH', 'month'], NaN)) || null,
    hour,
    dateLabel: dateRaw || 'Date unavailable',
    weekday: dateValue ? dateValue.toLocaleDateString(undefined, { weekday: 'long' }) : 'Unknown',
    isWeekend: dateValue ? isWeekendDay(dateValue.getDay()) : false,
    isNight: hour !== null ? hour >= 18 || hour <= 6 : false,
    severity: severityFrom(props),
    injuryCount: Number(getProp(props, ['INJURIES', 'PERSONS_INJURED', 'INJ_TOTAL', 'INJURIES_TOTAL'], 0)) || 0,
    vehicleCount: Number(getProp(props, ['VE_TOTAL', 'VEH_COUNT', 'VEHICLES'], 1)) || 1,
    weather: String(getProp(props, ['WEATHER', 'WEATHER1', 'WEATHER_DESC'], 'Unknown')),
    roadCondition: String(getProp(props, ['SUR_COND', 'ROADCOND', 'ROAD_CONDITION'], 'Unknown')),
    location: street ? `${street}, ${city}, Monroe, LA` : `${city}, Monroe, LA`
  };
};

export const filterCrashes = (rows: CrashRecord[], filters: FilterState): CrashRecord[] => {
  return rows.filter((row) => {
    if (filters.year && String(row.year) !== filters.year) return false;
    if (filters.month && String(row.month) !== filters.month) return false;
    if (row.hour !== null && (row.hour < filters.hourMin || row.hour > filters.hourMax)) return false;
    if (filters.weekendOnly && !row.isWeekend) return false;
    if (filters.nightOnly && !row.isNight) return false;
    if (filters.fatalOnly && row.severity !== 'Fatal') return false;
    return true;
  });
};
