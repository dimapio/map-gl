import React from "react";
import { LayerOptions } from "@/types";
import { useLayerEvent } from "@/hooks";
import { useMapStore } from "@/store/mapStore";

type LayerProps = {
  /** Layer options from mapbox-gl */
  options: mapboxgl.AnyLayer;
  /** Id to put this layer before */
  beforeId?: string;
  /** Enables the 'hover' feature state */
  hover?: boolean;
  /** Sets the cursor when a feature is hovered */
  hoverCursor?: React.CSSProperties["cursor"];
  /** Enabled the 'click' feature state */
  click?: boolean;
};
const Layer: React.FC<LayerProps> = (props) => {
  const { options, beforeId, hover = false, hoverCursor, click } = props;
  const mapStore = useMapStore(
    ({ addLayer, removeLayer, updateLayer, map }) => ({
      addLayer,
      removeLayer,
      updateLayer,
      map,
    })
  );

  const propsRef = React.useRef<LayerProps>(props);
  propsRef.current = props;
  const prevPropsRef = React.useRef<LayerOptions>({ ...options, beforeId });

  const hoveredFeatureIdsRef = React.useRef<Map<string | number, string>>(
    new Map()
  );
  const clickedFeatureIdsRef = React.useRef<Map<string | number, string>>(
    new Map()
  );

  // Handle mount
  React.useEffect(() => {
    mapStore.addLayer({ ...options, beforeId });

    // Handle unmount
    return () => {
      mapStore.removeLayer(options.id);
    };
  }, []);

  // Handle update
  React.useEffect(() => {
    mapStore.updateLayer({ ...options, beforeId }, prevPropsRef.current);
  }, [options, beforeId]);

  // Handle 'hover' feature state
  useLayerEvent({
    map: mapStore.map,
    type: "mouseenter",
    layerId: options.id,
    disabled: !hover,
    callback: (e) => {
      const features = e.features || [];
      features.forEach((feature) => {
        if (!feature.id) {
          console.warn(
            "Attempted to set the feature state of a feature with no ID"
          );
          return;
        }
        hoveredFeatureIdsRef.current.set(feature.id, feature.source);
        if (mapStore.map) {
          mapStore.map.setFeatureState(
            { id: feature.id, source: feature.source },
            { hover: true }
          );
        }
      });
    },
  });
  useLayerEvent({
    map: mapStore.map,
    type: "mouseleave",
    layerId: options.id,
    disabled: !hover,
    callback: () => {
      if (mapStore.map) {
        for (const [
          featureId,
          source,
        ] of hoveredFeatureIdsRef.current.entries()) {
          mapStore.map.setFeatureState(
            { id: featureId, source },
            { hover: false }
          );
        }
        hoveredFeatureIdsRef.current.clear();
        if (hoverCursor) {
          mapStore.map.getCanvas().style.cursor = "";
        }
      }
    },
  });
  // Handle cursor
  useLayerEvent({
    map: mapStore.map,
    type: "mouseover",
    layerId: options.id,
    disabled: !hoverCursor,
    callback: () => {
      if (!mapStore.map || !propsRef.current.hoverCursor) return;
      mapStore.map.getCanvas().style.cursor = propsRef.current.hoverCursor;
    },
  });
  // Handle click
  useLayerEvent({
    map: mapStore.map,
    type: "click",
    layerId: options.id,
    disabled: !click,
    callback: (e) => {
      if (!mapStore.map) return;

      // Clear existing 'click' feature states
      for (const [
        featureId,
        source,
      ] of clickedFeatureIdsRef.current.entries()) {
        mapStore.map.setFeatureState(
          { id: featureId, source },
          { click: false }
        );
      }
      clickedFeatureIdsRef.current.clear();

      // Set 'click' feature states
      const features = e.features || [];
      features.forEach((feature) => {
        if (!feature.id) {
          console.warn(
            "Attempted to set the feature state of a feature with no ID"
          );
          return;
        }
        clickedFeatureIdsRef.current.set(feature.id, feature.source);
        if (mapStore.map) {
          mapStore.map.setFeatureState(
            { id: feature.id, source: feature.source },
            { click: true }
          );
        }
      });
    },
  });

  return null;
};

export default Layer;
