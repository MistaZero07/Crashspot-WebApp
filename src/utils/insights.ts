import type { CrashRecord } from '../types/models';

export const getSeverityColor = (severity: CrashRecord['severity']): string => {
  switch (severity) {
    case 'Fatal':
      return '#ef4444';
    case 'Serious Injury':
      return '#f97316';
    case 'Minor Injury':
      return '#facc15';
    default:
      return '#22d3ee';
  }
};

export const buildSummary = (rows: CrashRecord[]) => {
  const totalsByHour = Array.from({ length: 24 }, () => 0);

  for (const row of rows) {
    if (row.hour !== null) totalsByHour[row.hour] += 1;
  }

  const peakCount = Math.max(...totalsByHour);
  const peakHour = peakCount > 0 ? totalsByHour.indexOf(peakCount) : null;

  return {
    totalCrashes: rows.length,
    fatalCrashes: rows.filter((item) => item.severity === 'Fatal').length,
    totalInjuries: rows.reduce((sum, item) => sum + item.injuryCount, 0),
    peakHour,
    byHour: totalsByHour
  };
};

export const topCrashLocations = (rows: CrashRecord[], topN = 5): Array<{ lat: number; lng: number; count: number; label: string }> => {
  const buckets = new Map<string, { lat: number; lng: number; count: number; label: string }>();

  for (const row of rows) {
    const key = `${row.lat.toFixed(4)},${row.lng.toFixed(4)}`;
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, { lat: row.lat, lng: row.lng, count: 1, label: row.location });
    } else {
      existing.count += 1;
    }
  }

  return [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, topN);
};
