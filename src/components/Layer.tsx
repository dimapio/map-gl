import React from "react";
import { LayerSpecification, GeoJSONFeature } from "mapbox-gl";
import { useLayerEvent } from "@/hooks";
import { useMapStore } from "@/store/mapStore";

type FeaturesById = Map<string | number, GeoJSONFeature>;

export type LayerProps = {
  /** Layer options from mapbox-gl */
  options: LayerSpecification;
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
  const propsRef = React.useRef<LayerProps>(props);
  propsRef.current = props;
  const prevPropsRef = React.useRef<LayerProps>(props);
  const hoveredFeaturesRef = React.useRef<FeaturesById>(new Map());
  const clickedFeaturesRef = React.useRef<FeaturesById>(new Map());
  const mapStore = useMapStore(
    ({ addLayer, removeLayer, updateLayer, map }) => ({
      addLayer,
      removeLayer,
      updateLayer,
      map,
    })
  );

  // Handle mount
  React.useEffect(() => {
    mapStore.addLayer(props);

    // Handle unmount
    return () => {
      mapStore.removeLayer(options.id);
    };
  }, []);

  // Handle update layer
  React.useEffect(() => {
    mapStore.updateLayer(propsRef.current, prevPropsRef.current);
  }, [options, beforeId]);

  // Handle 'mouseover'
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

  // Handle 'mouseleave'
  useLayerEvent({
    map: mapStore.map,
    type: "mouseleave",
    layerId: options.id,
    disabled: !hover,
    callback: () => {
      if (!mapStore.map) return;

      // Clear all feature states from hovered
      for (const [_, feature] of hoveredFeaturesRef.current) {
        mapStore.map.setFeatureState(feature, { hover: false });
      }
      hoveredFeaturesRef.current.clear();

      // Clear hover cursor
      if (hoverCursor) mapStore.map.getCanvas().style.cursor = "";
    },
  });

  // Handle 'mousemove'
  useLayerEvent({
    map: mapStore.map,
    type: "mousemove",
    layerId: options.id,
    disabled: !hover,
    callback: (e) => {
      if (!mapStore.map) return;
      const { map } = mapStore;
      const features = e.features || [];
      const nextHoveredFeatures: FeaturesById = new Map();

      // Handle feature state hovered
      features.forEach((feature) => {
        // Features must have an id to be hovered
        if (feature.id === undefined) {
          console.warn(
            "🚨 Attempted to set the feature state of a feature on layer with no ID 🚨",
            "\n",
            `Source: ${feature.source}`,
            "\n",
            `Layer: ${feature?.layer?.id}`,
            "\n",
            `Properties: ${JSON.stringify(feature.properties, null, 2)}`,
            "\n",
            "Note: IDs must be set at the root of the feature."
          );
          return;
        }

        // Check if feature is already hovered
        if (hoveredFeaturesRef.current.has(feature.id)) {
          // Feature already hovered
          return;
        }

        // Set feature as hovered
        map.setFeatureState(feature, { hover: true });
        nextHoveredFeatures.set(feature.id, feature);
      });

      // Handle feature state no longer hovered
      for (const [featureId, feature] of hoveredFeaturesRef.current) {
        // Check if feature is no longer hovered
        if (!nextHoveredFeatures.has(featureId)) {
          // Feature is no longer hovered
          map.setFeatureState(feature, { hover: false });
        }
      }

      // Update ref to currently hovered features
      hoveredFeaturesRef.current = nextHoveredFeatures;
    },
  });

  // Handle 'click'
  useLayerEvent({
    map: mapStore.map,
    type: "click",
    layerId: options.id,
    disabled: !click,
    callback: (e) => {
      if (!mapStore.map) return;
      const { map } = mapStore;
      const features = e.features || [];
      const nextClickedFeatures: FeaturesById = new Map();

      // Handle feature state clicked
      features.forEach((feature) => {
        // Features must have an id to be clicked
        if (feature.id === undefined) {
          console.warn(
            "🚨 Attempted to set the feature state of a feature on layer with no ID 🚨",
            "\n",
            `Source: ${feature.source}`,
            "\n",
            `Layer: ${feature?.layer?.id}`,
            "\n",
            `Properties: ${JSON.stringify(feature.properties, null, 2)}`,
            "\n",
            "Note: IDs must be set at the root of the feature."
          );
          return;
        }
        // Check if feature is already clicked
        if (clickedFeaturesRef.current.has(feature.id)) {
          // Feature already clicked
          return;
        }

        // Set feature as clicked
        map.setFeatureState(feature, { click: true });
        nextClickedFeatures.set(feature.id, feature);
      });

      // Handle feature state no longer clicked
      for (const [featureId, feature] of clickedFeaturesRef.current) {
        // Check if feature is no longer clicked
        if (!nextClickedFeatures.has(featureId)) {
          // Feature is no longer clicked
          map.setFeatureState(feature, { click: false });
        }
      }

      // Update ref to currently clicked features
      clickedFeaturesRef.current = nextClickedFeatures;
    },
  });

  return null;
};

export default Layer;
