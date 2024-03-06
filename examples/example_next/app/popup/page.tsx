"use client";
import PopupsMap from "@/components/PopupsMap";
import { MapProvider } from "@dimapio/map-gl";

export default function PopupPage() {
  return (
    <main className="h-full w-full">
      <MapProvider>
        <PopupsMap />
      </MapProvider>
    </main>
  );
}