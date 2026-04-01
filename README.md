# Crashspot WebApp (Modernized)

Crashspot is a frontend geospatial safety dashboard for Monroe, Louisiana that helps users explore crash patterns, hotspot risk, and live location-based warnings using local crash datasets.

## Final stack
- React + TypeScript
- Vite
- React Leaflet (Leaflet map rendering)
- Tailwind CSS
- Local GeoJSON datasets (no backend required)

## Main features
- **Map-first dashboard UI** with a modern dark visual style
- **Multi-layer geospatial visualization**:
  - Crash points
  - Density circles
  - Cluster layer
  - Road segment risk layer
  - Predicted hotspot layer
- **Filters** by year, month, hour range, weekend/nighttime, and fatal-only
- **Insights panel** with KPI cards, hourly trend mini-chart, and top crash locations
- **Drive Mode** with live geolocation state + warning when entering predicted risk zones
- **Responsive layout** for desktop-first with mobile-aware behavior

## Data sources
All data remains local and project-compatible:
- `public/data/fars_monroe_2021_2022_2023_clean.geojson`
- `public/data/fars_monroe_clusters.geojson`
- `public/data/road_segments_risk.geojson`
- `public/data/predicted_crash_risk.geojson`

## Run locally
```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
npm run preview
```

## Honest limitations / tradeoffs
- The app remains frontend-only by design; no server-side enrichment or real-time feeds are included.
- Drive Mode depends on browser geolocation availability/permission and can vary by device.
- Reverse geocoding is intentionally not used to avoid backend/API dependency in this version.
