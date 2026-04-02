# Crashspot Modernization Plan

## 1) Current audit (what exists now)
- Single-page static app using `index.html`, `style.css`, and `app.js`.
- Leaflet map renders crash points, cluster circles, road-risk segments, and predicted risk hotspots.
- Filters include year, month, hour range, weekend/night, and fatal-only.
- Insights include KPI totals and top crash points (with reverse geocoding).
- Drive Mode uses browser geolocation + hotspot proximity warning.
- Data is provided as local GeoJSON files.

## 2) What should be preserved
- Project purpose: Monroe, LA traffic crash safety dashboard.
- Existing datasets and compatibility.
- Core layers: crash points, clusters, road-risk, predicted hotspots.
- Filter behavior and key dimensions.
- Drive Mode as a primary feature.

## 3) What should be redesigned
- Migrate to React + TypeScript + Vite architecture.
- Replace ad-hoc UI with a polished, dark, dashboard-style interface.
- Componentize map, filters, insights, and drive mode.
- Add stronger layer controls, legends, and clearer map interactions.
- Improve state flow and code readability via typed utilities/hooks.

## 4) Proposed architecture
- `src/App.tsx`: orchestration and layout.
- `src/types/*`: typed domain models and GeoJSON support.
- `src/data/*`: data loading/parsing logic.
- `src/utils/*`: filtering, summaries, formatting, geospatial helpers.
- `src/components/map/*`: React Leaflet map + layer rendering + legend.
- `src/components/filters/*`: filter and layer controls.
- `src/components/insights/*`: KPI + top locations + temporal histogram.
- `src/components/drive/*`: Drive Mode status and controls.

## 5) Migration steps
1. Scaffold Vite + React + TypeScript project structure and configs.
2. Move static datasets to `public/data` and standardize loaders.
3. Port crash normalization/filtering logic into typed utilities.
4. Build map with React Leaflet layers and polished popups/legend.
5. Build control panels (filters/layers), insights panel, and drive mode UX.
6. Refresh README with stack, features, setup, and honest limitations.
7. Run validation checks (format/build if possible), then commit and open PR.
