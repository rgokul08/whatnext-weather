/// <reference types="@types/google.maps" />

import { useCallback, useEffect, useRef } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window { google?: typeof google; }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;
const WEATHER_TILE_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_LAYERS: Record<Exclude<MapOverlay, "none">, string> = {
  rain: "precipitation_new",
  clouds: "clouds_new",
  temperature: "temp_new",
  wind: "wind_new",
};

export type MapOverlay = "none" | "rain" | "clouds" | "temperature" | "wind";

function loadMapScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => { resolve(); script.remove(); };
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  overlay?: MapOverlay;
  onMapReady?: (map: google.maps.Map) => void;
}

export function MapView({ className, initialCenter = { lat: 37.7749, lng: -122.4194 }, initialZoom = 12, overlay = "none", onMapReady }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);

  const applyOverlay = useCallback(() => {
    if (!map.current || !window.google?.maps) return;
    map.current.overlayMapTypes.clear();
    if (overlay === "none" || !WEATHER_TILE_KEY) return;
    const layer = WEATHER_LAYERS[overlay];
    const tile = new window.google.maps.ImageMapType({
      name: `WhatNext ${overlay}`,
      tileSize: new window.google.maps.Size(256, 256),
      opacity: 0.58,
      getTileUrl: (coord, zoom) => `https://tile.openweathermap.org/map/${layer}/${zoom}/${coord.x}/${coord.y}.png?appid=${WEATHER_TILE_KEY}`,
    });
    map.current.overlayMapTypes.push(tile);
  }, [overlay]);

  const init = usePersistFn(async () => {
    try {
      await loadMapScript();
      if (!mapContainer.current || !window.google?.maps) return;
      map.current = new window.google.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapId: "DEMO_MAP_ID",
      });
      applyOverlay();
      onMapReady?.(map.current);
    } catch (error) {
      console.warn(error);
    }
  });

  useEffect(() => { init(); }, [init]);
  useEffect(() => { applyOverlay(); }, [applyOverlay]);

  return <div className={cn("map-shell w-full h-[500px]", className)}><div className="map-fallback-grid"><span>Interactive weather map</span><small>{initialCenter.lat.toFixed(3)}, {initialCenter.lng.toFixed(3)}</small></div><div ref={mapContainer} className="map-canvas" /></div>;
}
