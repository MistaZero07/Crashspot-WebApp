import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

export type GeoJSONFeature = Feature<Geometry, GeoJsonProperties>;

export type GeoJSONFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties>;
