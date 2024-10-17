import type {
  GeoJSONFeature,
  LayerSpecification,
  LngLat,
  MapMouseEvent,
  MapTouchEvent,
  Point,
} from "mapbox-gl";

export type MapLayerEvent = MapTouchEvent | MapMouseEvent;
export type MapEventCallback = (ev: MapLayerEvent) => void;
export type PopupEvent = {
  lngLat: LngLat;
  point: Point;
  features: GeoJSONFeature[];
};
export type BBoxStyle = Omit<
  React.CSSProperties,
  "position" | "top" | "left" | "width" | "height"
>;
