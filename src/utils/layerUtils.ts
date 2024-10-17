import deepEqual from "./deepEqual";
import { LayerSpecification, Map, CustomLayerInterface } from "mapbox-gl";
import { LayerProps } from "@/components/Layer";

// TODO: Update these to combine `options` and `beforeId` with custom `LayerOptions` type
/** Get a `Layer` from the map or create one  */
export function createLayer(
  map: Map,
  options: LayerSpecification,
  beforeId?: string
): LayerSpecification | CustomLayerInterface | undefined {
  const layer = map.getLayer(options.id);
  if (layer) return layer;
  // The `source` must exist on the map
  if ("source" in options && typeof options.source === "string") {
    const source = map.getSource(options.source);
    if (!source) return;
  }
  map.addLayer(options, beforeId);
  return map.getLayer(options.id);
}

/** Remove a `Layer` from the map if it exists */
export function removeLayer(map: Map, options: LayerSpecification) {
  if (map.getLayer(options.id)) {
    map.removeLayer(options.id);
  }
}

/** Update a `Layer` */
export function updateLayer(
  map: Map,
  id: string,
  props: LayerProps,
  prevProps: LayerProps
) {
  if (props.beforeId !== prevProps.beforeId) {
    map.moveLayer(id, props.beforeId);
  }
  if (props.options.layout !== prevProps.options.layout) {
    const layout = props.options.layout || {};
    const prevLayout = prevProps.options.layout || {};
    for (const key in layout) {
      if (!deepEqual(layout[key], prevLayout[key])) {
        map.setLayoutProperty(id, key as any, layout[key]);
      }
    }
    for (const key in prevLayout) {
      if (!layout.hasOwnProperty(key)) {
        map.setLayoutProperty(id, key as any, undefined);
      }
    }
  }
  if (props.options.paint !== prevProps.options.paint) {
    const paint = props.options.paint || {};
    const prevPaint = prevProps.options.paint || {};
    for (const key in paint) {
      if (!deepEqual(paint[key], prevPaint[key])) {
        map.setPaintProperty(id, key as any, paint[key]);
      }
    }
    for (const key in prevPaint) {
      if (!paint.hasOwnProperty(key)) {
        map.setPaintProperty(id, key as any, undefined);
      }
    }
  }

  if (!deepEqual(props.options.filter, prevProps.options.filter)) {
    map.setFilter(id, props.options.filter);
  }
  if (
    props.options.minzoom &&
    props.options.maxzoom &&
    (props.options.minzoom !== prevProps.options.minzoom ||
      props.options.maxzoom !== prevProps.options.maxzoom)
  ) {
    map.setLayerZoomRange(id, props.options.minzoom, props.options.maxzoom);
  }
}

/** Sync layers within the map */
export function syncLayers(map: Map, layers: Record<string, LayerProps>) {
  // Add map layers with expected layers
  Object.values(layers).forEach(({ beforeId, options }) => {
    createLayer(map, options, beforeId);
  });

  // Remove map layers that are not expected
  const currentLayers = map.getStyle()?.layers || [];
  const layerIds = Object.keys(layers);
  currentLayers.forEach((layer) => {
    if (!layerIds.includes(layer.id)) {
      removeLayer(map, layer);
    }
  });
}
