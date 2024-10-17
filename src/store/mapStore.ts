import React from "react";
import { StoreApi, createStore, useStore } from "zustand";
import { removeLayer, syncLayers, updateLayer } from "@/utils/layerUtils";
import { removeSource, syncSources, updateSource } from "@/utils/sourceUtils";
import { Map, SourceSpecification } from "mapbox-gl";
import { LayerProps } from "@/components/Layer";

type MapState = {
  map: Map | null;
  sources: Record<string, SourceSpecification>;
  layers: Record<string, LayerProps>;
};

type MapActions = {
  // Map actions
  init: (map: Map) => void;
  unload: () => void;
  // Layer actions
  addLayer: (layer: LayerProps) => void;
  removeLayer: (layerId: string) => void;
  updateLayer: (layer: LayerProps, prevLayer: LayerProps) => void;
  // Source actions
  addSource: (sourceId: string, source: SourceSpecification) => void;
  removeSource: (sourceId: string) => void;
  updateSource: (
    sourceId: string,
    source: SourceSpecification,
    prevSourceId: string,
    prevSource: SourceSpecification
  ) => void;
};

export type MapStore = MapState & MapActions;

const defaultMapState: MapState = {
  map: null,
  sources: {},
  layers: {},
};

export function createMapStore() {
  return createStore<MapStore>()((set) => ({
    ...defaultMapState,
    init: (map) => {
      const style = map.getStyle();
      const currSources = style?.sources || {};
      const currLayers = (style?.layers || []).reduce(
        (acc, curr) => ({ ...acc, [curr.id]: curr }),
        {}
      );
      set((state) => {
        const sources = { ...state.sources, ...currSources };
        const layers = { ...state.layers, ...currLayers };
        syncSources(map, sources);
        syncLayers(map, layers);
        return {
          map,
          sources,
          layers,
        };
      });
    },
    unload: () => set(defaultMapState),
    addLayer: (layer) => {
      set(({ map, layers }) => {
        layers[layer.options.id] = layer;

        // Sync layers with map
        if (map) {
          syncLayers(map, layers);
        }

        return { layers };
      });
    },
    removeLayer: (layerId) => {
      set(({ map, layers }) => {
        delete layers[layerId];

        // Sync layers with map
        if (map) {
          syncLayers(map, layers);
        }

        return { layers };
      });
    },
    updateLayer: (layer, prevLayer) => {
      set(({ map, layers }) => {
        // Check if layer id changed
        if (layer.options.id !== prevLayer.options.id) {
          delete layers[prevLayer.options.id];
          if (map) {
            removeLayer(map, prevLayer.options);
          }
        }

        // Sync layers with map
        layers[layer.options.id] = layer;
        if (map) {
          syncLayers(map, layers);
          updateLayer(map, layer.options.id, layer, prevLayer);
        }

        return { layers };
      });
    },
    addSource: (sourceId, source) => {
      set(({ map, sources }) => {
        sources[sourceId] = source;

        // Sync sources with map
        if (map) {
          syncSources(map, sources);
        }

        return { sources };
      });
    },
    removeSource: (sourceId) => {
      set(({ map, sources }) => {
        delete sources[sourceId];

        // Sync sources with map
        if (map) {
          syncSources(map, sources);
        }

        return { sources };
      });
    },
    updateSource: (sourceId, source, prevSourceId, prevSource) => {
      set(({ map, sources }) => {
        // Check if source id changed
        if (sourceId !== prevSourceId) {
          delete sources[prevSourceId];
          if (map) {
            removeSource(map, prevSourceId);
          }
        }

        // Sync layers with map
        sources[sourceId] = source;
        if (map) {
          syncSources(map, sources);
          updateSource(map, sourceId, source, prevSource);
        }

        return { sources };
      });
    },
  }));
}

export const MapStoreContext = React.createContext<StoreApi<MapStore> | null>(
  null
);

export function useMapStore<T>(selector: (store: MapStore) => T): T {
  const mapStoreContext = React.useContext(MapStoreContext);

  if (!mapStoreContext) {
    throw new Error(`useMapStore must be use within MapStoreContext`);
  }

  return useStore(mapStoreContext, selector);
}
