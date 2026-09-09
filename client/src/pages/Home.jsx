import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bike,
  ChevronRight,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  Globe2,
  LocateFixed,
  MapPin,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Sunset,
  Umbrella,
  Wind,
  X,
  Clock3
} from "lucide-react";
import {
  aqiMeta,
  DEFAULT_LOCATION,
  getWeather,
  reverseGeocode,
  searchLocations,
  weatherGroup,
  weatherIcon,
  weatherLabel
} from "../services/weather";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { MapView } from "../components/Map";
const NAV_ITEMS = [
  { label: "Home", icon: Activity },
  { label: "Forecast", icon: Clock3 },
  { label: "Live Layer", icon: Globe2 },
  { label: "Favorites", icon: Star },
  { label: "Compare", icon: ArrowUp }
];
const DEFAULT_RECENTS = [
  { id: 1277333, name: "Kolkata", latitude: 22.5726, longitude: 88.3639, country: "India", admin1: "West Bengal", timezone: "Asia/Kolkata" },
  { id: 1264527, name: "Mumbai", latitude: 19.076, longitude: 72.8777, country: "India", admin1: "Maharashtra", timezone: "Asia/Kolkata" },
  { id: 5128581, name: "New York", latitude: 40.7128, longitude: -74.006, country: "United States", admin1: "New York", timezone: "America/New_York" }
];
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
function formatTemp(value, unit) {
  const temp = unit === "celsius" ? value : value * 9 / 5 + 32;
  return `${Math.round(temp)}\xB0`;
}
function formatSpeed(value, unit) {
  if (unit === "mph") return `${Math.round(value * 0.621371)} mph`;
  if (unit === "ms") return `${(value / 3.6).toFixed(1)} m/s`;
  return `${Math.round(value)} km/h`;
}
function timeLabel(value, timezone, options) {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", minute: "2-digit", ...options }).format(new Date(value));
  } catch {
    return value.slice(11, 16);
  }
}
function freshnessLabel(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - value) / 1e3));
  if (seconds < 60) return "Live \xB7 Updated now";
  if (seconds < 3600) return `Updated ${Math.floor(seconds / 60)} min ago`;
  return `Updated ${Math.floor(seconds / 3600)} hr ago`;
}
function dayLabel(value, timezone) {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(/* @__PURE__ */ new Date(`${value}T12:00:00`));
  } catch {
    return value.slice(5);
  }
}
function dateLabel(value) {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(/* @__PURE__ */ new Date(`${value}T12:00:00`));
  } catch {
    return value;
  }
}
function compassDirection(degrees) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(degrees / 45) % 8];
}
function WeatherGlyph({ code, isDay = true, size = 32, className = "" }) {
  const icon = weatherIcon(code, isDay);
  const common = { size, strokeWidth: 1.6, className: cn("weather-glyph", className) };
  if (icon === "sun") return /* @__PURE__ */ React.createElement(Sun, { ...common });
  if (icon === "moon") return /* @__PURE__ */ React.createElement(Moon, { ...common });
  if (icon === "partly") return /* @__PURE__ */ React.createElement(CloudSun, { ...common });
  if (icon === "cloud") return /* @__PURE__ */ React.createElement(Cloud, { ...common });
  if (icon === "rain") return /* @__PURE__ */ React.createElement(CloudRain, { ...common });
  if (icon === "snow") return /* @__PURE__ */ React.createElement(CloudSnow, { ...common });
  if (icon === "fog") return /* @__PURE__ */ React.createElement(CloudFog, { ...common });
  return /* @__PURE__ */ React.createElement(CloudLightning, { ...common });
}
function SectionHeading({ eyebrow, title, action }) {
  return /* @__PURE__ */ React.createElement("div", { className: "section-heading" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, eyebrow), /* @__PURE__ */ React.createElement("h2", null, title)), action);
}
function Card({ children, className = "", id }) {
  return /* @__PURE__ */ React.createElement("section", { id, className: cn("surface-card", className) }, children);
}
function Metric({ icon: Icon, label, value, detail, accent = "cyan" }) {
  return /* @__PURE__ */ React.createElement("div", { className: "metric" }, /* @__PURE__ */ React.createElement("div", { className: cn("metric-icon", `accent-${accent}`) }, /* @__PURE__ */ React.createElement(Icon, { size: 16 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, label), /* @__PURE__ */ React.createElement("strong", null, value), detail && /* @__PURE__ */ React.createElement("small", null, detail)));
}
function Pill({ children, tone = "neutral" }) {
  return /* @__PURE__ */ React.createElement("span", { className: cn("pill", `pill-${tone}`) }, children);
}
function SkeletonDashboard() {
  return /* @__PURE__ */ React.createElement("div", { className: "skeleton-dashboard" }, /* @__PURE__ */ React.createElement("div", { className: "skeleton skeleton-hero" }), /* @__PURE__ */ React.createElement("div", { className: "skeleton-row" }, /* @__PURE__ */ React.createElement("div", { className: "skeleton skeleton-card" }), /* @__PURE__ */ React.createElement("div", { className: "skeleton skeleton-card" }), /* @__PURE__ */ React.createElement("div", { className: "skeleton skeleton-card" })), /* @__PURE__ */ React.createElement("div", { className: "skeleton skeleton-wide" }));
}
function CinematicBackground() {
  const videoRef = useRef(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    const startPlayback = () => {
      const promise = video.play();
      if (promise && typeof promise.catch === "function") promise.catch(() => {});
    };
    video.addEventListener("canplay", startPlayback);
    video.addEventListener("loadeddata", startPlayback);
    startPlayback();
    return () => {
      video.removeEventListener("canplay", startPlayback);
      video.removeEventListener("loadeddata", startPlayback);
    };
  }, []);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("video", { ref: videoRef, className: "cinematic-video", autoPlay: true, muted: true, defaultMuted: true, loop: true, playsInline: true, preload: "auto", disablePictureInPicture: true, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("source", { src: "/manus-storage/mountain-time-lapse-hq_d936c573.mp4", type: "video/mp4" })), /* @__PURE__ */ React.createElement("div", { className: "cinematic-overlay", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "cinematic-vignette", "aria-hidden": "true" }));
}
function Home() {
  const [location, setLocation] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("whatnext-location") || "null") || DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });
  const [weather, setWeather] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`whatnext-cache-${location.id}`) || "null");
    } catch {
      return null;
    }
  });
  const [unit, setUnit] = useState(() => localStorage.getItem("whatnext-unit") || "celsius");
  const [windUnit, setWindUnit] = useState(() => localStorage.getItem("whatnext-wind") || "kmh");
  const [dark, setDark] = useState(() => localStorage.getItem("whatnext-theme") !== "light");
  const [activeNav, setActiveNav] = useState("Home");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("whatnext-favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [recents, setRecents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("whatnext-recents") || "null") || DEFAULT_RECENTS;
    } catch {
      return DEFAULT_RECENTS;
    }
  });
  const [chart, setChart] = useState("Temperature");
  const [mapOverlay, setMapOverlay] = useState("rain");
  const [selectedDay, setSelectedDay] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(() => !localStorage.getItem("whatnext-location-prompted") && !localStorage.getItem("whatnext-location"));
  const requestInFlight = useRef(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => Number(localStorage.getItem("whatnext-last-updated") || 0));
  const [stale, setStale] = useState(false);
  const searchRef = useRef(null);
  const loadWeather = useCallback(async (nextLocation, manual = false) => {
    if (requestInFlight.current) return;
    const activeLocation = { ...nextLocation, source: nextLocation.source || "search" };
    requestInFlight.current = true;
    setError("");
    setLocation(activeLocation);
    setSelectedDay(0);
    if (activeLocation.id !== location.id) {
      const cached = localStorage.getItem(`whatnext-cache-${activeLocation.id}`);
      try {
        setWeather(cached ? JSON.parse(cached) : null);
      } catch {
        setWeather(null);
      }
    }
    if (manual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getWeather(activeLocation);
      setWeather(data);
      setStale(false);
      const fetchedAt = Date.now();
      setLastUpdatedAt(fetchedAt);
      localStorage.setItem(`whatnext-cache-${activeLocation.id}`, JSON.stringify(data));
      localStorage.setItem("whatnext-last-updated", String(fetchedAt));
      localStorage.setItem("whatnext-location", JSON.stringify(activeLocation));
      setRecents((current2) => {
        const next = [activeLocation, ...current2.filter((item) => item.id !== activeLocation.id)].slice(0, 6);
        localStorage.setItem("whatnext-recents", JSON.stringify(next));
        return next;
      });
      window.history.replaceState({}, "", `/weather/${activeLocation.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
    } catch {
      setStale(true);
      setError("Weather unavailable. Showing the most recently cached information, if available.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [location.id]);
  useEffect(() => {
    const weatherSlug = window.location.pathname.match(/^\/weather\/([^/]+)/)?.[1];
    if (!weatherSlug) {
      loadWeather(location);
      return;
    }
    let cancelled = false;
    searchLocations(weatherSlug.replace(/-/g, " ")).then((results) => {
      if (!cancelled && results[0]) loadWeather(results[0]);
      else if (!cancelled) loadWeather(location);
    }).catch(() => {
      if (!cancelled) loadWeather(location);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const city = location.name || "Weather";
    document.title = `${city} Weather Today | WhatNext.com`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", `Live weather, forecasts, rain probability, air quality, and practical insights for ${city}.`);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", `${window.location.origin}/weather/${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
  }, [location]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("whatnext-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    localStorage.setItem("whatnext-unit", unit);
  }, [unit]);
  useEffect(() => {
    localStorage.setItem("whatnext-wind", windUnit);
  }, [windUnit]);
  useEffect(() => {
    localStorage.setItem("whatnext-favorites", JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setSearching(true);
      try {
        setSuggestions(await searchLocations(searchQuery));
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);
  useEffect(() => {
    if (localStorage.getItem("whatnext-location") || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const local = await reverseGeocode(position.coords.latitude, position.coords.longitude);
      setLocationNote("Using your current location");
      loadWeather({ ...local, source: "device" });
    }, () => setLocationNote("Location access is disabled. Search for a city to get local weather."));
  }, [loadWeather]);
  useEffect(() => {
    const timer = window.setInterval(() => loadWeather(location, true), 12e4);
    return () => window.clearInterval(timer);
  }, [loadWeather, location]);
  const current = weather?.current;
  const currentDay = weather?.daily[selectedDay] || weather?.daily[0];
  const group = current ? weatherGroup(current.weatherCode) : "clear";
  const isFavorite = favorites.some((item) => item.id === location.id);
  const currentHourIndex = weather?.hourly.findIndex((item) => item.time >= (current?.time || "")) ?? 0;
  const nextRain = weather?.hourly.find((item) => item.rainProbability >= 35);
  const chartData = useMemo(() => weather?.hourly.slice(0, 12).map((item) => ({
    time: timeLabel(item.time, weather.timezone, { hour: "numeric" }).replace(" ", ""),
    Temperature: Math.round(item.temperature),
    "Rain chance": item.rainProbability,
    Wind: Math.round(item.windSpeed)
  })) ?? [], [weather]);
  const insights = useMemo(() => {
    if (!weather) return [];
    const hot = weather.current.temperature >= 29;
    const wet = weather.current.weatherCode >= 51 || (weather.daily[0]?.rainProbability ?? 0) >= 45;
    return [
      { icon: hot ? Droplets : Sun, title: hot ? "Hydration" : "Light layers", body: hot ? "Warm conditions ahead. Keep water close and take breaks in the shade." : "A light layer will keep you comfortable as the day changes.", tone: hot ? "amber" : "cyan" },
      { icon: wet ? Umbrella : Bike, title: wet ? "Umbrella check" : "Good to get outside", body: wet ? `Rain chance climbs to ${Math.max(weather.current.uvIndex ? weather.daily[0].rainProbability : 0, nextRain?.rainProbability || 0)}%. Keep a compact umbrella nearby.` : "Conditions look comfortable for a walk, ride, or an outdoor coffee.", tone: wet ? "red" : "green" },
      { icon: Eye, title: "Best visibility", body: `${Math.round(weather.current.visibility / 1e3)} km visibility right now. Great conditions for a clear commute.`, tone: "cyan" }
    ];
  }, [weather, nextRain]);
  const selectLocation = (nextLocation, source = "search") => {
    setSuggestions([]);
    setSearchQuery("");
    setLocationNote("");
    loadWeather({ ...nextLocation, source });
  };
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationNote("Geolocation is not supported. Search manually instead.");
      return;
    }
    setLocationNote("Finding your location\u2026");
    navigator.geolocation.getCurrentPosition(async (position) => selectLocation(await reverseGeocode(position.coords.latitude, position.coords.longitude), "device"), () => setLocationNote("Location access is disabled. Search for a city to get local weather."));
  };
  const dismissLocationModal = () => {
    localStorage.setItem("whatnext-location-prompted", "1");
    setShowLocationModal(false);
  };
  const toggleFavorite = () => setFavorites((items) => isFavorite ? items.filter((item) => item.id !== location.id) : [location, ...items]);
  const jumpTo = (label) => {
    const routes = { Home: "/", Forecast: "/forecast", "Live Layer": "/map", Favorites: "/favorites", Compare: "/compare" };
    window.location.href = routes[label] || "/";
  };
  if (loading && !weather) return /* @__PURE__ */ React.createElement("div", { className: "app-shell loading-shell" }, /* @__PURE__ */ React.createElement(CinematicBackground, null), /* @__PURE__ */ React.createElement(Header, { dark, setDark, unit, setUnit, onMenu: () => setShowMenu(true), onLocation: useMyLocation }), /* @__PURE__ */ React.createElement("main", { className: "container page-content" }, /* @__PURE__ */ React.createElement(SkeletonDashboard, null)));
  const displayWeather = weather;
  return /* @__PURE__ */ React.createElement("div", { className: cn("app-shell", `weather-${group}`, !dark && "light-mode"), id: "top" }, /* @__PURE__ */ React.createElement(CinematicBackground, null), /* @__PURE__ */ React.createElement("div", { className: "ambient ambient-one" }), /* @__PURE__ */ React.createElement("div", { className: "ambient ambient-two" }), /* @__PURE__ */ React.createElement(AnimatePresence, null, showLocationModal && /* @__PURE__ */ React.createElement(motion.div, { className: "location-modal-backdrop", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }, /* @__PURE__ */ React.createElement(motion.section, { className: "location-modal", initial: { opacity: 0, y: 14, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 } }, /* @__PURE__ */ React.createElement("div", { className: "location-modal-icon" }, /* @__PURE__ */ React.createElement(LocateFixed, { size: 22 })), /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, "Welcome to WhatNext.com"), /* @__PURE__ */ React.createElement("h2", null, "Use your current location"), /* @__PURE__ */ React.createElement("p", null, "Allow WhatNext.com to show accurate local weather, sunrise, air quality, and recommendations for where you are."), /* @__PURE__ */ React.createElement("div", { className: "location-modal-actions" }, /* @__PURE__ */ React.createElement("button", { className: "primary-action", onClick: () => {
    dismissLocationModal();
    useMyLocation();
  } }, /* @__PURE__ */ React.createElement(LocateFixed, { size: 16 }), " Use My Location"), /* @__PURE__ */ React.createElement("button", { className: "secondary-action", onClick: () => {
    dismissLocationModal();
    searchRef.current?.focus();
  } }, "Search Manually")), /* @__PURE__ */ React.createElement("small", null, "Your location stays in this browser and is not shared.")))), /* @__PURE__ */ React.createElement(Header, { dark, setDark, unit, setUnit, onMenu: () => setShowMenu(true), onLocation: useMyLocation }), /* @__PURE__ */ React.createElement("main", { className: "container page-content" }, /* @__PURE__ */ React.createElement("div", { className: "topline" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "eyebrow live-eyebrow" }, /* @__PURE__ */ React.createElement("span", { className: "live-dot" }), " ", stale ? "Cached weather" : "Live weather intelligence"), /* @__PURE__ */ React.createElement("h1", null, "Know the weather.", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("em", null, "Know what's next."))), /* @__PURE__ */ React.createElement("div", { className: "topline-meta" }, /* @__PURE__ */ React.createElement("span", null, lastUpdatedAt ? freshnessLabel(lastUpdatedAt) : "Waiting for live weather"), /* @__PURE__ */ React.createElement("button", { className: cn("icon-button", refreshing && "is-spinning"), onClick: () => loadWeather(location, true), "aria-label": "Refresh weather" }, /* @__PURE__ */ React.createElement(RefreshCw, { size: 17 })))), /* @__PURE__ */ React.createElement("div", { className: "search-wrap", id: "search" }, /* @__PURE__ */ React.createElement(Search, { size: 19 }), /* @__PURE__ */ React.createElement("input", { ref: searchRef, value: searchQuery, onChange: (event) => setSearchQuery(event.target.value), onKeyDown: (event) => {
    if (event.key === "Enter" && suggestions[0]) selectLocation(suggestions[0]);
  }, placeholder: "Search a city, country or location\u2026", "aria-label": "Search a city, country or location" }), searching && /* @__PURE__ */ React.createElement(RefreshCw, { className: "spin", size: 16 }), searchQuery && /* @__PURE__ */ React.createElement("button", { className: "search-clear", onClick: () => setSearchQuery(""), "aria-label": "Clear search" }, /* @__PURE__ */ React.createElement(X, { size: 16 })), /* @__PURE__ */ React.createElement(AnimatePresence, null, (suggestions.length > 0 || searchQuery.length > 1 && !searching) && /* @__PURE__ */ React.createElement(motion.div, { className: "suggestions", initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 } }, /* @__PURE__ */ React.createElement("div", { className: "suggestion-label" }, "Locations"), suggestions.map((item) => /* @__PURE__ */ React.createElement("button", { key: `${item.id}-${item.latitude}`, onClick: () => selectLocation(item), className: "suggestion" }, /* @__PURE__ */ React.createElement(MapPin, { size: 15 }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, item.name), /* @__PURE__ */ React.createElement("small", null, [item.admin1, item.country].filter(Boolean).join(", "))), /* @__PURE__ */ React.createElement(ChevronRight, { size: 15 }))), !suggestions.length && !searching && /* @__PURE__ */ React.createElement("div", { className: "empty-search" }, "No location found. Try a nearby city.")))), /* @__PURE__ */ React.createElement("div", { className: "search-subline" }, /* @__PURE__ */ React.createElement("button", { onClick: useMyLocation }, /* @__PURE__ */ React.createElement(LocateFixed, { size: 14 }), " Use my location"), /* @__PURE__ */ React.createElement("span", null, "Try \u201CTokyo\u201D, \u201CLondon\u201D or \u201CBengaluru\u201D")), locationNote && /* @__PURE__ */ React.createElement("div", { className: "location-note" }, /* @__PURE__ */ React.createElement(LocateFixed, { size: 14 }), " ", locationNote), error && /* @__PURE__ */ React.createElement("div", { className: "error-banner" }, /* @__PURE__ */ React.createElement(AlertTriangle, { size: 16 }), " ", /* @__PURE__ */ React.createElement("span", null, error), /* @__PURE__ */ React.createElement("button", { onClick: () => loadWeather(location, true) }, "Retry")), displayWeather && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "hero-grid" }, /* @__PURE__ */ React.createElement(Card, { className: "current-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-topline" }, /* @__PURE__ */ React.createElement("div", { className: "location-chip" }, /* @__PURE__ */ React.createElement(MapPin, { size: 14 }), /* @__PURE__ */ React.createElement("span", null, displayWeather.location.name, ", ", displayWeather.location.country)), /* @__PURE__ */ React.createElement("button", { className: cn("favorite-button", isFavorite && "is-favorite"), onClick: toggleFavorite, "aria-label": isFavorite ? "Remove from favorites" : "Add to favorites" }, /* @__PURE__ */ React.createElement(Star, { size: 18, fill: isFavorite ? "currentColor" : "none" }))), /* @__PURE__ */ React.createElement("div", { className: "current-main" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "current-date" }, new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: displayWeather.timezone }).format(/* @__PURE__ */ new Date())), /* @__PURE__ */ React.createElement("h2", { className: "current-temp" }, formatTemp(current?.temperature || 0, unit)), /* @__PURE__ */ React.createElement("p", { className: "condition" }, weatherLabel(current?.weatherCode || 0), " ", /* @__PURE__ */ React.createElement("span", null, "\u2022"), " Feels like ", formatTemp(current?.feelsLike || 0, unit))), /* @__PURE__ */ React.createElement("div", { className: "hero-glyph" }, /* @__PURE__ */ React.createElement(WeatherGlyph, { code: current?.weatherCode || 0, isDay: current?.isDay, size: 94 }))), /* @__PURE__ */ React.createElement("div", { className: "temp-range" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(ArrowUp, { size: 14 }), " High ", /* @__PURE__ */ React.createElement("strong", null, formatTemp(currentDay?.high || 0, unit))), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(ArrowDown, { size: 14 }), " Low ", /* @__PURE__ */ React.createElement("strong", null, formatTemp(currentDay?.low || 0, unit))), /* @__PURE__ */ React.createElement("span", { className: "range-bar" }, /* @__PURE__ */ React.createElement("i", { style: { width: `${Math.min(100, Math.max(25, ((current?.temperature || 0) - (currentDay?.low || 0)) / Math.max(1, (currentDay?.high || 0) - (currentDay?.low || 0)) * 100))}%` } }))), /* @__PURE__ */ React.createElement("div", { className: "current-footer" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Local time"), /* @__PURE__ */ React.createElement("strong", null, timeLabel(current?.time || "", displayWeather.timezone))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Timezone"), /* @__PURE__ */ React.createElement("strong", null, displayWeather.timezone.replace("_", " "))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Daylight"), /* @__PURE__ */ React.createElement("strong", null, current?.isDay ? "Daytime" : "Night time")))), /* @__PURE__ */ React.createElement(Card, { className: "summary-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-heading" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, "Today at a glance"), /* @__PURE__ */ React.createElement("h3", null, "What\u2019s next")), /* @__PURE__ */ React.createElement(Sparkles, { size: 19, className: "heading-spark" })), /* @__PURE__ */ React.createElement("div", { className: "summary-copy" }, (current?.temperature || 0) >= 30 ? "Warm and bright today." : "A comfortable day ahead.", " ", nextRain ? `Rain probability rises to ${nextRain.rainProbability}% around ${timeLabel(nextRain.time, displayWeather.timezone)}.` : "No meaningful rain signal in the next few hours."), /* @__PURE__ */ React.createElement("div", { className: "summary-list" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Umbrella, { size: 15 }), " Rain chance"), /* @__PURE__ */ React.createElement("strong", null, nextRain?.rainProbability ?? displayWeather.daily[0]?.rainProbability ?? 0, "%")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Wind, { size: 15 }), " Wind"), /* @__PURE__ */ React.createElement("strong", null, formatSpeed(current?.windSpeed || 0, windUnit))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Sun, { size: 15 }), " UV index"), /* @__PURE__ */ React.createElement("strong", null, Math.round(current?.uvIndex || 0), " ", /* @__PURE__ */ React.createElement("small", null, (current?.uvIndex || 0) >= 6 ? "High" : "Low")))), /* @__PURE__ */ React.createElement("div", { className: "recommendation" }, /* @__PURE__ */ React.createElement("div", { className: "recommendation-icon" }, /* @__PURE__ */ React.createElement(Bike, { size: 16 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Best time to head out"), /* @__PURE__ */ React.createElement("strong", null, (current?.temperature || 0) >= 30 ? "Before 10 AM" : "Anytime before sunset")), /* @__PURE__ */ React.createElement(ChevronRight, { size: 17 })))), /* @__PURE__ */ React.createElement("div", { className: "section-block", id: "forecast" }, /* @__PURE__ */ React.createElement(SectionHeading, { eyebrow: "The next 24 hours", title: "Hourly forecast", action: /* @__PURE__ */ React.createElement("button", { className: "text-button" }, "See full forecast ", /* @__PURE__ */ React.createElement(ChevronRight, { size: 15 })) }), /* @__PURE__ */ React.createElement("div", { className: "hourly-scroll" }, displayWeather.hourly.slice(0, 12).map((hour, index) => /* @__PURE__ */ React.createElement("div", { className: cn("hour-card", index === 0 && "now"), key: hour.time }, /* @__PURE__ */ React.createElement("span", { className: "hour-time" }, index === 0 ? "Now" : timeLabel(hour.time, displayWeather.timezone, { hour: "numeric" }).replace(" ", "")), /* @__PURE__ */ React.createElement(WeatherGlyph, { code: hour.weatherCode, isDay: hour.time < `${hour.time.slice(0, 10)}T18:00`, size: 24 }), /* @__PURE__ */ React.createElement("strong", null, formatTemp(hour.temperature, unit)), /* @__PURE__ */ React.createElement("span", { className: "rain-chance" }, /* @__PURE__ */ React.createElement(Droplets, { size: 12 }), " ", hour.rainProbability, "%"), /* @__PURE__ */ React.createElement("small", null, formatSpeed(hour.windSpeed, windUnit).replace(" km/h", ""), " wind"))))), /* @__PURE__ */ React.createElement("div", { className: "section-block" }, /* @__PURE__ */ React.createElement(SectionHeading, { eyebrow: "A week in view", title: "5-day outlook", action: /* @__PURE__ */ React.createElement("div", { className: "unit-toggle" }, /* @__PURE__ */ React.createElement("button", { className: unit === "celsius" ? "active" : "", onClick: () => setUnit("celsius") }, "\xB0C"), /* @__PURE__ */ React.createElement("button", { className: unit === "fahrenheit" ? "active" : "", onClick: () => setUnit("fahrenheit") }, "\xB0F")) }), /* @__PURE__ */ React.createElement("div", { className: "forecast-grid" }, displayWeather.daily.slice(0, 5).map((day, index) => /* @__PURE__ */ React.createElement("button", { className: cn("forecast-card", selectedDay === index && "selected"), key: day.date, onClick: () => setSelectedDay(index) }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, index === 0 ? "Today" : dayLabel(day.date, displayWeather.timezone)), /* @__PURE__ */ React.createElement("small", null, dateLabel(day.date))), /* @__PURE__ */ React.createElement(WeatherGlyph, { code: day.weatherCode, size: 28 }), /* @__PURE__ */ React.createElement("strong", null, formatTemp(day.high, unit), " ", /* @__PURE__ */ React.createElement("span", null, "/ ", formatTemp(day.low, unit))), /* @__PURE__ */ React.createElement(Pill, { tone: day.rainProbability >= 50 ? "cyan" : "neutral" }, /* @__PURE__ */ React.createElement(Droplets, { size: 11 }), " ", day.rainProbability, "%"), /* @__PURE__ */ React.createElement(ChevronRight, { size: 15, className: "forecast-chevron" })))), currentDay && /* @__PURE__ */ React.createElement("div", { className: "day-detail" }, /* @__PURE__ */ React.createElement("div", { className: "day-detail-title" }, /* @__PURE__ */ React.createElement(WeatherGlyph, { code: currentDay.weatherCode, size: 32 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, selectedDay === 0 ? "Today" : dayLabel(currentDay.date, displayWeather.timezone), " \xB7 ", weatherLabel(currentDay.weatherCode)), /* @__PURE__ */ React.createElement("span", null, "Feels like ", formatTemp(currentDay.apparentHigh, unit), " at the warmest point"))), /* @__PURE__ */ React.createElement("div", { className: "day-stats" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Wind, { size: 14 }), " ", formatSpeed(currentDay.windSpeed, windUnit)), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Umbrella, { size: 14 }), " ", currentDay.precipitation.toFixed(1), " mm expected"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Sunrise, { size: 14 }), " ", timeLabel(currentDay.sunrise, displayWeather.timezone)), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Sunset, { size: 14 }), " ", timeLabel(currentDay.sunset, displayWeather.timezone))))), /* @__PURE__ */ React.createElement("div", { className: "two-col section-block" }, /* @__PURE__ */ React.createElement(Card, { className: "chart-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-heading" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, "Read the pattern"), /* @__PURE__ */ React.createElement("h3", null, "Weather trends")), /* @__PURE__ */ React.createElement("div", { className: "chart-switcher" }, ["Temperature", "Rain chance", "Wind"].map((name) => /* @__PURE__ */ React.createElement("button", { key: name, className: chart === name ? "active" : "", onClick: () => setChart(name) }, name === "Rain chance" ? "Rain" : name)))), /* @__PURE__ */ React.createElement("div", { className: "chart-legend" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: chart === "Rain chance" ? "legend-blue" : chart === "Wind" ? "legend-amber" : "legend-cyan" }), " ", chart), /* @__PURE__ */ React.createElement("strong", null, chart === "Temperature" ? `${formatTemp(Math.round(current?.temperature || 0), unit)} now` : chart === "Rain chance" ? `${nextRain?.rainProbability || displayWeather.daily[0].rainProbability}% peak` : `${Math.round(current?.windSpeed || 0)} km/h now`)), /* @__PURE__ */ React.createElement("div", { className: "chart-wrap" }, /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 190 }, /* @__PURE__ */ React.createElement(AreaChart, { data: chartData, margin: { top: 12, right: 6, left: -25, bottom: 0 } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "cyanFill", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#55d6e8", stopOpacity: 0.25 }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#55d6e8", stopOpacity: 0 })), /* @__PURE__ */ React.createElement("linearGradient", { id: "blueFill", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#7c9cff", stopOpacity: 0.25 }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#7c9cff", stopOpacity: 0 })), /* @__PURE__ */ React.createElement("linearGradient", { id: "amberFill", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#ffc45e", stopOpacity: 0.2 }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#ffc45e", stopOpacity: 0 }))), /* @__PURE__ */ React.createElement(CartesianGrid, { strokeDasharray: "3 6", stroke: "var(--chart-grid)", vertical: false }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "time", tick: { fill: "var(--muted-text)", fontSize: 11 }, tickLine: false, axisLine: false }), /* @__PURE__ */ React.createElement(YAxis, { tick: { fill: "var(--muted-text)", fontSize: 11 }, tickLine: false, axisLine: false }), /* @__PURE__ */ React.createElement(Tooltip, { contentStyle: { background: "var(--tooltip-bg)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--text)" }, labelStyle: { color: "var(--muted-text)" } }), /* @__PURE__ */ React.createElement(Area, { type: "monotone", dataKey: chart, stroke: chart === "Rain chance" ? "#7c9cff" : chart === "Wind" ? "#ffc45e" : "#55d6e8", fill: chart === "Rain chance" ? "url(#blueFill)" : chart === "Wind" ? "url(#amberFill)" : "url(#cyanFill)", strokeWidth: 2.5, dot: false, activeDot: { r: 4, strokeWidth: 0 } }))))), /* @__PURE__ */ React.createElement(Card, { className: "sun-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-heading" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, "Light & time"), /* @__PURE__ */ React.createElement("h3", null, "Sunrise & sunset")), /* @__PURE__ */ React.createElement(Sunrise, { size: 19, className: "heading-spark" })), /* @__PURE__ */ React.createElement("div", { className: "sun-times" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Sunrise, { size: 20 }), /* @__PURE__ */ React.createElement("span", null, "Sunrise"), /* @__PURE__ */ React.createElement("strong", null, timeLabel(currentDay?.sunrise || "", displayWeather.timezone))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Sunset, { size: 20 }), /* @__PURE__ */ React.createElement("span", null, "Sunset"), /* @__PURE__ */ React.createElement("strong", null, timeLabel(currentDay?.sunset || "", displayWeather.timezone)))), /* @__PURE__ */ React.createElement("div", { className: "sun-path" }, /* @__PURE__ */ React.createElement("div", { className: "sun-path-line" }, /* @__PURE__ */ React.createElement("span", { className: "sun-marker", style: { left: `${current?.isDay ? 45 : 92}%` } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Morning"), /* @__PURE__ */ React.createElement("span", null, "Golden hour"), /* @__PURE__ */ React.createElement("span", null, "Night"))), /* @__PURE__ */ React.createElement("div", { className: "day-length" }, /* @__PURE__ */ React.createElement("span", null, "Day length"), /* @__PURE__ */ React.createElement("strong", null, currentDay ? `${Math.max(0, Math.round((new Date(currentDay.sunset).getTime() - new Date(currentDay.sunrise).getTime()) / 36e5))}h ${currentDay ? Math.abs(Math.round((new Date(currentDay.sunset).getTime() - new Date(currentDay.sunrise).getTime()) / 6e4) % 60) : 0}m` : "\u2014")))), /* @__PURE__ */ React.createElement("div", { className: "three-col section-block" }, /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(SectionHeading, { eyebrow: "At a glance", title: "Weather details" }), /* @__PURE__ */ React.createElement("div", { className: "metric-grid" }, /* @__PURE__ */ React.createElement(Metric, { icon: Droplets, label: "Humidity", value: `${current?.humidity ?? 0}%`, detail: `Dew point ${formatTemp((current?.temperature || 0) - 4, unit)}`, accent: "cyan" }), /* @__PURE__ */ React.createElement(Metric, { icon: Wind, label: "Wind", value: formatSpeed(current?.windSpeed || 0, windUnit), detail: `${compassDirection(current?.windDirection || 0)} \xB7 gusts ${Math.round(current?.windGusts || 0)}`, accent: "cyan" }), /* @__PURE__ */ React.createElement(Metric, { icon: Gauge, label: "Pressure", value: `${Math.round(current?.pressure || 0)} hPa`, detail: "Steady", accent: "violet" }), /* @__PURE__ */ React.createElement(Metric, { icon: Eye, label: "Visibility", value: `${Math.round((current?.visibility || 0) / 1e3)} km`, detail: "Clear outlook", accent: "green" }), /* @__PURE__ */ React.createElement(Metric, { icon: Sun, label: "UV index", value: `${Math.round(current?.uvIndex || 0)}`, detail: (current?.uvIndex || 0) >= 6 ? "High \xB7 SPF 30+" : "Low \xB7 minimal risk", accent: "amber" }), /* @__PURE__ */ React.createElement(Metric, { icon: Cloud, label: "Cloud cover", value: `${current?.cloudCover ?? 0}%`, detail: "Across the sky", accent: "violet" }))), /* @__PURE__ */ React.createElement(Card, { className: "air-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-heading" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, "Breathe easy"), /* @__PURE__ */ React.createElement("h3", null, "Air quality")), /* @__PURE__ */ React.createElement(ShieldCheck, { size: 19, className: "heading-spark" })), (() => {
    const meta = aqiMeta(displayWeather.airQuality.aqi);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "aqi-score" }, /* @__PURE__ */ React.createElement("div", { className: cn("aqi-ring", `aqi-${meta.tone}`) }, /* @__PURE__ */ React.createElement("strong", null, displayWeather.airQuality.aqi ?? "\u2014"), /* @__PURE__ */ React.createElement("span", null, "US AQI")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Pill, { tone: meta.tone === "good" ? "green" : meta.tone === "moderate" ? "amber" : "red" }, meta.label), /* @__PURE__ */ React.createElement("p", null, meta.description))), /* @__PURE__ */ React.createElement("div", { className: "pollutants" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "PM2.5"), displayWeather.airQuality.pm25?.toFixed(1) ?? "\u2014", " ", /* @__PURE__ */ React.createElement("small", null, "\u03BCg/m\xB3")), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "PM10"), displayWeather.airQuality.pm10?.toFixed(1) ?? "\u2014", " ", /* @__PURE__ */ React.createElement("small", null, "\u03BCg/m\xB3")), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("b", null, "O\u2083"), displayWeather.airQuality.ozone?.toFixed(0) ?? "\u2014", " ", /* @__PURE__ */ React.createElement("small", null, "\u03BCg/m\xB3"))));
  })()), /* @__PURE__ */ React.createElement(Card, { id: "radar", className: "radar-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-heading" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, "Live layer"), /* @__PURE__ */ React.createElement("h3", null, "Local map")), /* @__PURE__ */ React.createElement("button", { className: "small-action", onClick: () => setActiveNav("Live Layer"), "aria-label": "Center live layer" }, /* @__PURE__ */ React.createElement(MapPin, { size: 17 }))), /* @__PURE__ */ React.createElement("div", { className: "map-layer-controls" }, ["rain", "clouds", "temperature", "wind"].map((layer) => /* @__PURE__ */ React.createElement("button", { key: layer, className: mapOverlay === layer ? "active" : "", onClick: () => setMapOverlay(layer) }, layer === "rain" ? "Rain" : layer === "clouds" ? "Clouds" : layer === "temperature" ? "Temperature" : "Wind"))), /* @__PURE__ */ React.createElement(MapView, { key: `${displayWeather.location.latitude}-${displayWeather.location.longitude}`, overlay: mapOverlay, className: "live-map", initialCenter: { lat: displayWeather.location.latitude, lng: displayWeather.location.longitude }, initialZoom: 10 }), /* @__PURE__ */ React.createElement("div", { className: "radar-footer" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "live-dot" }), " Real ", mapOverlay, " layer \xB7 ", displayWeather.location.latitude.toFixed(3), ", ", displayWeather.location.longitude.toFixed(3)), /* @__PURE__ */ React.createElement("button", { onClick: () => setActiveNav("Radar") }, "Open map ", /* @__PURE__ */ React.createElement(ChevronRight, { size: 14 }))))), /* @__PURE__ */ React.createElement("div", { className: "section-block" }, /* @__PURE__ */ React.createElement(SectionHeading, { eyebrow: "Make it useful", title: "Weather health & recommendations", action: /* @__PURE__ */ React.createElement("span", { className: "section-note" }, /* @__PURE__ */ React.createElement(Sparkles, { size: 14 }), " Practical, not predictive") }), /* @__PURE__ */ React.createElement("div", { className: "insights-grid" }, insights.map(({ icon: Icon, title, body, tone }) => /* @__PURE__ */ React.createElement(Card, { className: "insight-card", key: title }, /* @__PURE__ */ React.createElement("div", { className: cn("insight-icon", `insight-${tone}`) }, /* @__PURE__ */ React.createElement(Icon, { size: 18 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, title), /* @__PURE__ */ React.createElement("p", null, body)), /* @__PURE__ */ React.createElement(ChevronRight, { size: 16, className: "insight-arrow" }))))), /* @__PURE__ */ React.createElement("div", { className: "two-col section-block" }, /* @__PURE__ */ React.createElement(Card, { id: "saved", className: "saved-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-heading" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, "Your shortlist"), /* @__PURE__ */ React.createElement("h3", null, "My locations")), /* @__PURE__ */ React.createElement("button", { className: "small-action", onClick: () => searchRef.current?.focus() }, /* @__PURE__ */ React.createElement(Plus, { size: 18 }))), favorites.length ? /* @__PURE__ */ React.createElement("div", { className: "saved-list" }, favorites.slice(0, 4).map((item) => /* @__PURE__ */ React.createElement("button", { key: item.id, onClick: () => selectLocation(item, "favorite") }, /* @__PURE__ */ React.createElement("span", { className: "saved-avatar" }, /* @__PURE__ */ React.createElement(MapPin, { size: 15 })), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, item.name), /* @__PURE__ */ React.createElement("small", null, item.country)), /* @__PURE__ */ React.createElement(ChevronRight, { size: 15 })))) : /* @__PURE__ */ React.createElement("div", { className: "empty-state" }, /* @__PURE__ */ React.createElement(Star, { size: 20 }), /* @__PURE__ */ React.createElement("span", null, "Save places you check often."), /* @__PURE__ */ React.createElement("button", { onClick: toggleFavorite }, "Save ", location.name))), /* @__PURE__ */ React.createElement(Card, { id: "compare", className: "compare-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-heading" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "eyebrow" }, "Side by side"), /* @__PURE__ */ React.createElement("h3", null, "Compare weather")), /* @__PURE__ */ React.createElement(Pill, { tone: "cyan" }, "New")), /* @__PURE__ */ React.createElement("div", { className: "compare-row compare-heading" }, /* @__PURE__ */ React.createElement("span", null, "Metric"), /* @__PURE__ */ React.createElement("strong", null, location.name), /* @__PURE__ */ React.createElement("strong", null, favorites[0]?.name || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "compare-row" }, /* @__PURE__ */ React.createElement("span", null, "Temperature"), /* @__PURE__ */ React.createElement("strong", null, formatTemp(current?.temperature || 0, unit)), /* @__PURE__ */ React.createElement("strong", null, favorites[0] ? "\u2014" : "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "compare-row" }, /* @__PURE__ */ React.createElement("span", null, "Humidity"), /* @__PURE__ */ React.createElement("strong", null, current?.humidity, "%"), /* @__PURE__ */ React.createElement("strong", null, "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "compare-row" }, /* @__PURE__ */ React.createElement("span", null, "Rain chance"), /* @__PURE__ */ React.createElement("strong", null, displayWeather.daily[0].rainProbability, "%"), /* @__PURE__ */ React.createElement("strong", null, "\u2014")), /* @__PURE__ */ React.createElement("button", { className: "compare-cta", onClick: () => searchRef.current?.focus() }, "Add a location to compare ", /* @__PURE__ */ React.createElement(ChevronRight, { size: 15 }))))), /* @__PURE__ */ React.createElement("footer", null, /* @__PURE__ */ React.createElement("div", { className: "footer-brand" }, /* @__PURE__ */ React.createElement("div", { className: "brand-mark small" }, /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "WhatNext.com"), /* @__PURE__ */ React.createElement("p", null, "Know the weather. Know what\u2019s next."))), /* @__PURE__ */ React.createElement("div", { className: "footer-links" }, /* @__PURE__ */ React.createElement("a", { href: "#top" }, "About"), /* @__PURE__ */ React.createElement("a", { href: "#top" }, "Privacy"), /* @__PURE__ */ React.createElement("a", { href: "#top" }, "API information"), /* @__PURE__ */ React.createElement("span", null, "\xA9 2026 WhatNext.com")))), /* @__PURE__ */ React.createElement("nav", { className: "mobile-nav" }, NAV_ITEMS.map(({ label, icon: Icon }) => /* @__PURE__ */ React.createElement("button", { key: label, className: activeNav === label ? "active" : "", onClick: () => jumpTo(label) }, /* @__PURE__ */ React.createElement(Icon, { size: 18 }), /* @__PURE__ */ React.createElement("span", null, label === "Overview" ? "Home" : label)))), /* @__PURE__ */ React.createElement(AnimatePresence, null, showMenu && /* @__PURE__ */ React.createElement(motion.div, { className: "mobile-drawer-backdrop", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setShowMenu(false) }, /* @__PURE__ */ React.createElement(motion.aside, { className: "mobile-drawer", initial: { x: -280 }, animate: { x: 0 }, exit: { x: -280 }, onClick: (event) => event.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "drawer-header" }, /* @__PURE__ */ React.createElement(Brand, null), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowMenu(false) }, /* @__PURE__ */ React.createElement(X, { size: 19 }))), NAV_ITEMS.map(({ label, icon: Icon }) => /* @__PURE__ */ React.createElement("button", { key: label, onClick: () => {
    jumpTo(label);
    setShowMenu(false);
  } }, /* @__PURE__ */ React.createElement(Icon, { size: 18 }), " ", label))))));
}
function Brand() {
  return /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("div", { className: "brand-mark" }, /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null)), /* @__PURE__ */ React.createElement("span", null, "WhatNext", /* @__PURE__ */ React.createElement("span", { className: "brand-dot" }, "."), "com"));
}
function Header({ dark, setDark, unit, setUnit, onMenu, onLocation }) {
  return /* @__PURE__ */ React.createElement("header", { className: "site-header" }, /* @__PURE__ */ React.createElement("div", { className: "header-inner" }, /* @__PURE__ */ React.createElement("button", { className: "mobile-menu", onClick: onMenu, "aria-label": "Open menu" }, /* @__PURE__ */ React.createElement(Menu, { size: 20 })), /* @__PURE__ */ React.createElement(Brand, null), /* @__PURE__ */ React.createElement("nav", { className: "desktop-nav" }, /* @__PURE__ */ React.createElement("a", { className: "active", href: "/" }, "Home"), /* @__PURE__ */ React.createElement("a", { href: "/forecast" }, "Forecast"), /* @__PURE__ */ React.createElement("a", { href: "/map" }, "Live Layer"), /* @__PURE__ */ React.createElement("a", { href: "/favorites" }, "Favorites"), /* @__PURE__ */ React.createElement("a", { href: "/compare" }, "Compare")), /* @__PURE__ */ React.createElement("div", { className: "header-actions" }, /* @__PURE__ */ React.createElement("button", { className: "header-icon", onClick: onLocation, "aria-label": "Use current location" }, /* @__PURE__ */ React.createElement(LocateFixed, { size: 17 })), /* @__PURE__ */ React.createElement("button", { className: "unit-toggle header-unit", onClick: () => setUnit(unit === "celsius" ? "fahrenheit" : "celsius"), "aria-label": "Toggle temperature unit" }, "\xB0", unit === "celsius" ? "C" : "F"), /* @__PURE__ */ React.createElement("button", { className: "header-icon", onClick: () => setDark(!dark), "aria-label": "Toggle theme" }, dark ? /* @__PURE__ */ React.createElement(Moon, { size: 17 }) : /* @__PURE__ */ React.createElement(Sun, { size: 17 })))));
}
export {
  Home as default
};
