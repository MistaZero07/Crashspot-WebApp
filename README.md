# Crashspot WebApp (Modernized)

Crashspot is a frontend geospatial safety dashboard for Monroe, Louisiana that helps users explore crash patterns, hotspot risk, and live location-based warnings using local crash datasets.

## Live site
[Open Crashspot on GitHub Pages](https://mistazero07.github.io/Crashspot-WebApp/)

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

Local dev server:
- Default URL: `http://localhost:5173/`

Build for production:
```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages
The repo now includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that builds and publishes the Vite app to GitHub Pages whenever `main` is updated.

Production URL:
- `https://mistazero07.github.io/Crashspot-WebApp/`

Enable Pages in the repository settings:
1. Open GitHub and go to `Settings` -> `Pages`.
2. Under `Build and deployment`, set `Source` to `GitHub Actions`.
3. Push the repo to GitHub and let the `Deploy To GitHub Pages` workflow run.

The Vite base path is configured automatically from the GitHub repository name in CI, so the app and its GeoJSON files load correctly from the Pages URL.

## Deployment notes
- GitHub Pages serves this app from the repository subpath `/Crashspot-WebApp/`, not from `/`.
- Static GeoJSON files are loaded from the Pages base path, so local data continues to work in production.
- Merges or pushes to `main` trigger the deployment workflow automatically.

## Troubleshooting
- If the site looks outdated, hard refresh the page with `Cmd+Shift+R` or `Ctrl+Shift+R`.
- If the deployment succeeds but the site is blank, confirm the Pages source is set to `GitHub Actions`, not `Deploy from a branch`.
- Check the latest `Deploy To GitHub Pages` run in the GitHub `Actions` tab if the live site does not update.

## Honest limitations / tradeoffs
- The app remains frontend-only by design; no server-side enrichment or real-time feeds are included.
- Drive Mode depends on browser geolocation availability/permission and can vary by device.
- Reverse geocoding is intentionally not used to avoid backend/API dependency in this version.
