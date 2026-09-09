import React from "react";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Cloud, Droplets, MapPin, Moon, RefreshCw, Star, Sun, Wind } from "lucide-react";
import { getWeather, DEFAULT_LOCATION, weatherIcon, weatherLabel } from "../services/weather";
import { MapView } from "../components/Map";
import CinematicBackground from "../components/CinematicBackground";
function formatTemp(value) {
  return `${Math.round(value)}\xB0`;
}
function formatTime(value, timezone) {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value.slice(11, 16);
  }
}
function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
function loadLocation() {
  try {
    return JSON.parse(localStorage.getItem("whatnext-location") || "null") || DEFAULT_LOCATION;
  } catch {
    return DEFAULT_LOCATION;
  }
}
function Glyph({ code, isDay = true }) {
  const icon = weatherIcon(code, isDay);
  const props = { size: 28, strokeWidth: 1.6 };
  if (icon === "sun") return /* @__PURE__ */ React.createElement(Sun, { ...props });
  if (icon === "moon") return /* @__PURE__ */ React.createElement(Moon, { ...props });
  if (icon === "rain") return /* @__PURE__ */ React.createElement(Droplets, { ...props });
  if (icon === "cloud" || icon === "partly") return /* @__PURE__ */ React.createElement(Cloud, { ...props });
  return /* @__PURE__ */ React.createElement(Cloud, { ...props });
}
function Header({ title }) {
  return /* @__PURE__ */ React.createElement("header", { className: "site-header" }, /* @__PURE__ */ React.createElement("div", { className: "header-inner" }, /* @__PURE__ */ React.createElement("a", { className: "brand", href: "/" }, /* @__PURE__ */ React.createElement("div", { className: "brand-mark" }, /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null)), /* @__PURE__ */ React.createElement("span", null, "WhatNext", /* @__PURE__ */ React.createElement("span", { className: "brand-dot" }, "."), "com")), /* @__PURE__ */ React.createElement("nav", { className: "desktop-nav" }, /* @__PURE__ */ React.createElement("a", { href: "/" }, "Home"), /* @__PURE__ */ React.createElement("a", { className: title === "Forecast" ? "active" : "", href: "/forecast" }, "Forecast"), /* @__PURE__ */ React.createElement("a", { className: title === "Live Layer" ? "active" : "", href: "/map" }, "Live Layer"), /* @__PURE__ */ React.createElement("a", { className: title === "Favorites" ? "active" : "", href: "/favorites" }, "Favorites"), /* @__PURE__ */ React.createElement("a", { className: title === "Compare" ? "active" : "", href: "/compare" }, "Compare")), /* @__PURE__ */ React.createElement("a", { className: "route-back", href: "/" }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 16 }), " Dashboard")));
}
function Shell({ title, children }) {
  return /* @__PURE__ */ React.createElement("div", { className: "app-shell route-shell" }, /* @__PURE__ */ React.createElement(CinematicBackground, null), /* @__PURE__ */ React.createElement(Header, { title }), /* @__PURE__ */ React.createElement("main", { className: "container page-content route-page" }, /* @__PURE__ */ React.createElement("div", { className: "route-kicker" }, /* @__PURE__ */ React.createElement("span", { className: "live-dot" }), " ", title, " · ", loadLocation().name), children));
}
function useRouteWeather() {
  const [location] = useState(loadLocation);
  const [weather, setWeather] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`whatnext-cache-${location.id}`) || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!weather);
  const [error, setError] = useState("");
  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getWeather(location);
      setWeather(data);
      localStorage.setItem(`whatnext-cache-${location.id}`, JSON.stringify(data));
      localStorage.setItem("whatnext-last-updated", String(Date.now()));
    } catch {
      setError("Live data is unavailable. Showing cached data when available.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);
  return { location, weather, loading, error, refresh };
}
function ForecastPage() {
  const { location, weather, loading, error, refresh } = useRouteWeather();
  return /* @__PURE__ */ React.createElement(Shell, { title: "Forecast" }, /* @__PURE__ */ React.createElement("div", { className: "route-hero" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, "Selected location"), /* @__PURE__ */ React.createElement("h1", null, location.name, " forecast"), /* @__PURE__ */ React.createElement("p", null, "Hourly and daily weather generated from the same active location as the dashboard.")), /* @__PURE__ */ React.createElement("button", { className: "primary-action", onClick: refresh }, /* @__PURE__ */ React.createElement(RefreshCw, { size: 16 }), " Refresh forecast")), error && /* @__PURE__ */ React.createElement("div", { className: "error-banner" }, error), loading && !weather ? /* @__PURE__ */ React.createElement("div", { className: "skeleton skeleton-wide" }) : weather && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("section", { className: "route-grid" }, weather.hourly.slice(0, 12).map((hour, index) => /* @__PURE__ */ React.createElement("article", { className: index === 0 ? "surface-card route-hour current" : "surface-card route-hour", key: hour.time }, /* @__PURE__ */ React.createElement("small", null, index === 0 ? "Now" : formatTime(hour.time, weather.timezone)), /* @__PURE__ */ React.createElement(Glyph, { code: hour.weatherCode }), /* @__PURE__ */ React.createElement("strong", null, formatTemp(hour.temperature)), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Droplets, { size: 12 }), " ", hour.rainProbability, "%"), /* @__PURE__ */ React.createElement("em", null, /* @__PURE__ */ React.createElement(Wind, { size: 12 }), " ", Math.round(hour.windSpeed), " km/h")))), /* @__PURE__ */ React.createElement("section", { className: "surface-card route-panel" }, /* @__PURE__ */ React.createElement("div", { className: "card-heading" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, "This week"), /* @__PURE__ */ React.createElement("h2", null, "7-day outlook")), /* @__PURE__ */ React.createElement(MapPin, { size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "week-list" }, weather.daily.map((day) => /* @__PURE__ */ React.createElement("div", { className: "week-row", key: day.date }, /* @__PURE__ */ React.createElement("strong", null, new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(/* @__PURE__ */ new Date(`${day.date}T12:00:00`))), /* @__PURE__ */ React.createElement(Glyph, { code: day.weatherCode }), /* @__PURE__ */ React.createElement("span", null, weatherLabel(day.weatherCode)), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Droplets, { size: 13 }), " ", day.rainProbability, "%"), /* @__PURE__ */ React.createElement("b", null, formatTemp(day.high), " ", /* @__PURE__ */ React.createElement("small", null, "/ ", formatTemp(day.low)))))))));
}
function LiveLayerPage() {
  const { location, weather, loading } = useRouteWeather();
  const [overlay, setOverlay] = useState("rain");
  const layers = ["rain", "clouds", "temperature", "wind"];
  return /* @__PURE__ */ React.createElement(Shell, { title: "Live Layer" }, /* @__PURE__ */ React.createElement("div", { className: "route-hero" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, "Real map layer"), /* @__PURE__ */ React.createElement("h1", null, "Weather around ", location.name), /* @__PURE__ */ React.createElement("p", null, "Pan, zoom, and switch between supported weather tiles for the active coordinates."))), loading && !weather ? /* @__PURE__ */ React.createElement("div", { className: "skeleton skeleton-wide" }) : /* @__PURE__ */ React.createElement("section", { className: "surface-card route-map-panel" }, /* @__PURE__ */ React.createElement("div", { className: "map-layer-controls" }, layers.map((layer) => /* @__PURE__ */ React.createElement("button", { key: layer, className: overlay === layer ? "active" : "", onClick: () => setOverlay(layer) }, layer[0].toUpperCase() + layer.slice(1)))), /* @__PURE__ */ React.createElement(MapView, { key: `${location.latitude}-${location.longitude}`, overlay, className: "route-map", initialCenter: { lat: location.latitude, lng: location.longitude }, initialZoom: 10 }), /* @__PURE__ */ React.createElement("p", { className: "map-note" }, /* @__PURE__ */ React.createElement("span", { className: "live-dot" }), " ", import.meta.env.VITE_WEATHER_API_KEY ? `Live ${overlay} tiles enabled` : "Add VITE_WEATHER_API_KEY in Vercel to enable OpenWeatherMap weather tiles.", " \xB7 ", location.latitude.toFixed(3), ", ", location.longitude.toFixed(3))));
}
function FavoritesPage() {
  const [favorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("whatnext-favorites") || "[]");
    } catch {
      return [];
    }
  });
  return /* @__PURE__ */ React.createElement(Shell, { title: "Favorites" }, /* @__PURE__ */ React.createElement("div", { className: "route-hero" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, "Your places"), /* @__PURE__ */ React.createElement("h1", null, "Favorite locations"), /* @__PURE__ */ React.createElement("p", null, "Open a saved city and every dashboard section will refresh to that location."))), favorites.length ? /* @__PURE__ */ React.createElement("div", { className: "route-grid favorites-grid" }, favorites.map((item) => /* @__PURE__ */ React.createElement("a", { className: "surface-card favorite-route-card", href: `/weather/${slug(item.name)}`, key: item.id }, /* @__PURE__ */ React.createElement("span", { className: "saved-avatar" }, /* @__PURE__ */ React.createElement(Star, { size: 18 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, item.name), /* @__PURE__ */ React.createElement("small", null, [item.admin1, item.country].filter(Boolean).join(", "))), /* @__PURE__ */ React.createElement(ChevronRight, { size: 18 })))) : /* @__PURE__ */ React.createElement("section", { className: "surface-card empty-route" }, /* @__PURE__ */ React.createElement(Star, { size: 24 }), /* @__PURE__ */ React.createElement("h2", null, "No favorite locations yet"), /* @__PURE__ */ React.createElement("p", null, "Search for a city on the dashboard and save it here."), /* @__PURE__ */ React.createElement("a", { className: "primary-action", href: "/" }, "Search weather")));
}
function ComparePage() {
  const active = loadLocation();
  const favorites = (() => {
    try {
      return JSON.parse(localStorage.getItem("whatnext-favorites") || "[]");
    } catch {
      return [];
    }
  })();
  const candidates = [active, ...favorites.filter((item) => item.id !== active.id)].slice(0, 3);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all(candidates.map(async (location) => {
      try {
        return { location, weather: await getWeather(location) };
      } catch {
        return { location, weather: null };
      }
    })).then(setItems).finally(() => setLoading(false));
  }, []);
  return /* @__PURE__ */ React.createElement(Shell, { title: "Compare" }, /* @__PURE__ */ React.createElement("div", { className: "route-hero" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, "Side by side"), /* @__PURE__ */ React.createElement("h1", null, "Compare weather"), /* @__PURE__ */ React.createElement("p", null, "Compare the active location with saved cities using fresh API responses."))), loading ? /* @__PURE__ */ React.createElement("div", { className: "skeleton skeleton-wide" }) : /* @__PURE__ */ React.createElement("section", { className: "compare-route-grid" }, items.map(({ location, weather }) => /* @__PURE__ */ React.createElement("article", { className: "surface-card compare-route-card", key: location.id }, /* @__PURE__ */ React.createElement("div", { className: "card-heading" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, location.source === "favorite" ? "Favorite" : "Active location"), /* @__PURE__ */ React.createElement("h2", null, location.name)), /* @__PURE__ */ React.createElement(MapPin, { size: 16 })), weather ? /* @__PURE__ */ React.createElement("div", { className: "compare-metrics" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Temperature"), /* @__PURE__ */ React.createElement("strong", null, formatTemp(weather.current.temperature))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Feels like"), /* @__PURE__ */ React.createElement("strong", null, formatTemp(weather.current.feelsLike))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Rain chance"), /* @__PURE__ */ React.createElement("strong", null, weather.daily[0]?.rainProbability, "%")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Humidity"), /* @__PURE__ */ React.createElement("strong", null, weather.current.humidity, "%")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Wind"), /* @__PURE__ */ React.createElement("strong", null, Math.round(weather.current.windSpeed), " km/h")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "UV"), /* @__PURE__ */ React.createElement("strong", null, Math.round(weather.current.uvIndex)))) : /* @__PURE__ */ React.createElement("p", { className: "muted" }, "Weather data unavailable.")))));
}
export {
  ComparePage,
  FavoritesPage,
  ForecastPage,
  LiveLayerPage
};
