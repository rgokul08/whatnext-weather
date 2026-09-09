import React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const WEATHER_TILE_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const WEATHER_LAYERS = { rain: "precipitation_new", clouds: "clouds_new", temperature: "temp_new", wind: "wind_new" };
let leafletPromise;

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-whatnext-leaflet]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      link.dataset.whatnextLeaflet = "true";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => window.L ? resolve(window.L) : reject(new Error("Leaflet did not load"));
    script.onerror = () => reject(new Error("Failed to load map library"));
    document.head.appendChild(script);
  });
  return leafletPromise;
}

function MapView({ className, initialCenter = { lat: 37.7749, lng: -122.4194 }, initialZoom = 12, overlay = "none", onMapReady }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const weatherLayer = useRef(null);
  const [mapError, setMapError] = useState("");

  const applyOverlay = useCallback(() => {
    if (!map.current || !window.L) return;
    if (weatherLayer.current) {
      weatherLayer.current.removeFrom(map.current);
      weatherLayer.current = null;
    }
    if (overlay === "none" || !WEATHER_TILE_KEY || !WEATHER_LAYERS[overlay]) return;
    weatherLayer.current = window.L.tileLayer(`https://tile.openweathermap.org/map/${WEATHER_LAYERS[overlay]}/{z}/{x}/{y}.png?appid=${WEATHER_TILE_KEY}`, { opacity: 0.58, attribution: "Weather tiles © OpenWeather" }).addTo(map.current);
  }, [overlay]);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapContainer.current || map.current) return;
      map.current = L.map(mapContainer.current, { center: [initialCenter.lat, initialCenter.lng], zoom: initialZoom, zoomControl: true, attributionControl: true, scrollWheelZoom: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map.current);
      L.marker([initialCenter.lat, initialCenter.lng]).addTo(map.current).bindPopup("Active location");
      applyOverlay();
      window.setTimeout(() => map.current?.invalidateSize(), 80);
      onMapReady?.(map.current);
    }).catch((error) => {
      if (!cancelled) setMapError(error.message || "Map unavailable");
    });
    return () => {
      cancelled = true;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      weatherLayer.current = null;
    };
  }, [initialCenter.lat, initialCenter.lng, initialZoom, onMapReady, applyOverlay]);

  useEffect(() => {
    applyOverlay();
  }, [applyOverlay]);

  return (
    <div className={cn("map-shell w-full h-[500px]", className)}>
      <div className="map-fallback-grid" aria-hidden="true"><span>{mapError ? "Interactive weather map unavailable" : "Loading interactive weather map…"}</span><small>{initialCenter.lat.toFixed(3)}, {initialCenter.lng.toFixed(3)}</small></div>
      <div ref={mapContainer} className="map-canvas" aria-label="Interactive weather map" />
    </div>
  );
}

export { MapView };
