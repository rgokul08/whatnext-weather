import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, ArrowDown, ArrowUp, Bell, Bike, Check, ChevronDown, ChevronRight,
  CircleHelp, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Compass,
  Droplets, Eye, Flag, Gauge, Globe2, Heart, History, LocateFixed, MapPin, Menu, Moon,
  MoreHorizontal, Navigation, Plus, RefreshCw, Search, Settings2, ShieldCheck, Sparkles,
  Star, Sun, Sunrise, Sunset, Thermometer, Umbrella, Waves, Wind, X, Zap, Clock3,
} from 'lucide-react';
import {
  aqiMeta, DEFAULT_LOCATION, getOfflineSnapshot, getWeather, reverseGeocode, searchLocations, weatherGroup,
  weatherIcon, weatherLabel, type LocationResult, type WeatherPayload,
} from '../services/weather';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const NAV_ITEMS = [
  { label: 'Overview', icon: Activity },
  { label: 'Forecast', icon: Clock3 },
  { label: 'Radar', icon: Globe2 },
  { label: 'Saved', icon: Star },
  { label: 'Compare', icon: ArrowUp },
];

const DEFAULT_RECENTS: LocationResult[] = [
  { id: 1277333, name: 'Kolkata', latitude: 22.5726, longitude: 88.3639, country: 'India', admin1: 'West Bengal', timezone: 'Asia/Kolkata' },
  { id: 1264527, name: 'Mumbai', latitude: 19.076, longitude: 72.8777, country: 'India', admin1: 'Maharashtra', timezone: 'Asia/Kolkata' },
  { id: 5128581, name: 'New York', latitude: 40.7128, longitude: -74.006, country: 'United States', admin1: 'New York', timezone: 'America/New_York' },
];

function cn(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(' '); }

function formatTemp(value: number, unit: 'celsius' | 'fahrenheit') {
  const temp = unit === 'celsius' ? value : value * 9 / 5 + 32;
  return `${Math.round(temp)}°`;
}
function formatSpeed(value: number, unit: 'kmh' | 'mph' | 'ms') {
  if (unit === 'mph') return `${Math.round(value * 0.621371)} mph`;
  if (unit === 'ms') return `${(value / 3.6).toFixed(1)} m/s`;
  return `${Math.round(value)} km/h`;
}
function timeLabel(value: string, timezone: string, options?: Intl.DateTimeFormatOptions) {
  try { return new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit', ...options }).format(new Date(value)); } catch { return value.slice(11, 16); }
}
function dayLabel(value: string, timezone: string) {
  try { return new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(new Date(`${value}T12:00:00`)); } catch { return value.slice(5); }
}
function dateLabel(value: string) {
  try { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`)); } catch { return value; }
}
function compassDirection(degrees: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(degrees / 45) % 8];
}

function WeatherGlyph({ code, isDay = true, size = 32, className = '' }: { code: number; isDay?: boolean; size?: number; className?: string }) {
  const icon = weatherIcon(code, isDay);
  const common = { size, strokeWidth: 1.6, className: cn('weather-glyph', className) };
  if (icon === 'sun') return <Sun {...common} />;
  if (icon === 'moon') return <Moon {...common} />;
  if (icon === 'partly') return <CloudSun {...common} />;
  if (icon === 'cloud') return <Cloud {...common} />;
  if (icon === 'rain') return <CloudRain {...common} />;
  if (icon === 'snow') return <CloudSnow {...common} />;
  if (icon === 'fog') return <CloudFog {...common} />;
  return <CloudLightning {...common} />;
}

function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div>{action}</div>;
}
function Card({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={cn('surface-card', className)}>{children}</section>;
}
function Metric({ icon: Icon, label, value, detail, accent = 'cyan' }: { icon: typeof Wind; label: string; value: string; detail?: string; accent?: string }) {
  return <div className="metric"><div className={cn('metric-icon', `accent-${accent}`)}><Icon size={16} /></div><div><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div></div>;
}
function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'cyan' | 'amber' | 'green' | 'red' }) {
  return <span className={cn('pill', `pill-${tone}`)}>{children}</span>;
}

function SkeletonDashboard() {
  return <div className="skeleton-dashboard"><div className="skeleton skeleton-hero" /><div className="skeleton-row"><div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" /></div><div className="skeleton skeleton-wide" /></div>;
}

export default function Home() {
  const [location, setLocation] = useState<LocationResult>(() => {
    try { return JSON.parse(localStorage.getItem('whatnext-location') || 'null') || DEFAULT_LOCATION; } catch { return DEFAULT_LOCATION; }
  });
  const [weather, setWeather] = useState<WeatherPayload | null>(() => {
    try { return JSON.parse(localStorage.getItem(`whatnext-cache-${location.id}`) || 'null') || getOfflineSnapshot(location); } catch { return getOfflineSnapshot(location); }
  });
  const [unit, setUnit] = useState<'celsius' | 'fahrenheit'>(() => (localStorage.getItem('whatnext-unit') as 'celsius' | 'fahrenheit') || 'celsius');
  const [windUnit, setWindUnit] = useState<'kmh' | 'mph' | 'ms'>(() => (localStorage.getItem('whatnext-wind') as 'kmh' | 'mph' | 'ms') || 'kmh');
  const [dark, setDark] = useState(() => localStorage.getItem('whatnext-theme') !== 'light');
  const [activeNav, setActiveNav] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [favorites, setFavorites] = useState<LocationResult[]>(() => { try { return JSON.parse(localStorage.getItem('whatnext-favorites') || '[]'); } catch { return []; } });
  const [recents, setRecents] = useState<LocationResult[]>(() => { try { return JSON.parse(localStorage.getItem('whatnext-recents') || 'null') || DEFAULT_RECENTS; } catch { return DEFAULT_RECENTS; } });
  const [chart, setChart] = useState<'Temperature' | 'Rain chance' | 'Wind'>('Temperature');
  const [selectedDay, setSelectedDay] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const loadWeather = useCallback(async (nextLocation: LocationResult, manual = false) => {
    setError('');
    if (manual) setRefreshing(true); else setLoading(true);
    try {
      const data = await getWeather(nextLocation);
      setWeather(data);
      setLocation(nextLocation);
      localStorage.setItem(`whatnext-cache-${nextLocation.id}`, JSON.stringify(data));
      localStorage.setItem('whatnext-location', JSON.stringify(nextLocation));
      setRecents((current) => { const next = [nextLocation, ...current.filter((item) => item.id !== nextLocation.id)].slice(0, 6); localStorage.setItem('whatnext-recents', JSON.stringify(next)); return next; });
      window.history.replaceState({}, '', `/weather/${nextLocation.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    } catch {
      setError('Unable to load weather data. Check your connection and try again.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadWeather(location); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('whatnext-theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => { localStorage.setItem('whatnext-unit', unit); }, [unit]);
  useEffect(() => { localStorage.setItem('whatnext-wind', windUnit); }, [windUnit]);
  useEffect(() => { localStorage.setItem('whatnext-favorites', JSON.stringify(favorites)); }, [favorites]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (searchQuery.trim().length < 2) { setSuggestions([]); return; }
      setSearching(true);
      try { setSuggestions(await searchLocations(searchQuery)); } catch { setSuggestions([]); } finally { setSearching(false); }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (localStorage.getItem('whatnext-location') || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const local = await reverseGeocode(position.coords.latitude, position.coords.longitude);
      setLocationNote('Using your current location');
      loadWeather(local);
    }, () => setLocationNote('Location access is disabled. Search for a city to get local weather.'));
  }, [loadWeather]);

  const current = weather?.current;
  const currentDay = weather?.daily[selectedDay] || weather?.daily[0];
  const group = current ? weatherGroup(current.weatherCode) : 'clear';
  const isFavorite = favorites.some((item) => item.id === location.id);
  const currentHourIndex = weather?.hourly.findIndex((item) => item.time >= (current?.time || '')) ?? 0;
  const nextRain = weather?.hourly.find((item) => item.rainProbability >= 35);

  const chartData = useMemo(() => weather?.hourly.slice(0, 12).map((item) => ({
    time: timeLabel(item.time, weather.timezone, { hour: 'numeric' }).replace(' ', ''),
    Temperature: Math.round(item.temperature),
    'Rain chance': item.rainProbability,
    Wind: Math.round(item.windSpeed),
  })) ?? [], [weather]);

  const insights = useMemo(() => {
    if (!weather) return [];
    const hot = weather.current.temperature >= 29;
    const wet = weather.current.weatherCode >= 51 || (weather.daily[0]?.rainProbability ?? 0) >= 45;
    return [
      { icon: hot ? Droplets : Sun, title: hot ? 'Hydration' : 'Light layers', body: hot ? 'Warm conditions ahead. Keep water close and take breaks in the shade.' : 'A light layer will keep you comfortable as the day changes.', tone: hot ? 'amber' : 'cyan' },
      { icon: wet ? Umbrella : Bike, title: wet ? 'Umbrella check' : 'Good to get outside', body: wet ? `Rain chance climbs to ${Math.max(weather.current.uvIndex ? weather.daily[0].rainProbability : 0, nextRain?.rainProbability || 0)}%. Keep a compact umbrella nearby.` : 'Conditions look comfortable for a walk, ride, or an outdoor coffee.', tone: wet ? 'red' : 'green' },
      { icon: Eye, title: 'Best visibility', body: `${Math.round(weather.current.visibility / 1000)} km visibility right now. Great conditions for a clear commute.`, tone: 'cyan' },
    ];
  }, [weather, nextRain]);

  const selectLocation = (nextLocation: LocationResult) => {
    setSuggestions([]); setSearchQuery(''); setLocationNote(''); loadWeather(nextLocation);
  };
  const useMyLocation = () => {
    if (!navigator.geolocation) { setLocationNote('Geolocation is not supported. Search manually instead.'); return; }
    setLocationNote('Finding your location…');
    navigator.geolocation.getCurrentPosition(async (position) => selectLocation(await reverseGeocode(position.coords.latitude, position.coords.longitude)), () => setLocationNote('Location access is disabled. Search for a city to get local weather.'));
  };
  const toggleFavorite = () => setFavorites((items) => isFavorite ? items.filter((item) => item.id !== location.id) : [location, ...items]);
  const jumpTo = (label: string) => { setActiveNav(label); const id = label === 'Forecast' ? 'forecast' : label === 'Radar' ? 'radar' : label === 'Saved' ? 'saved' : label === 'Compare' ? 'compare' : 'top'; document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  if (loading && !weather) return <div className="app-shell"><Header dark={dark} setDark={setDark} onMenu={() => setShowMenu(true)} onSettings={() => setShowSettings((value) => !value)} /><main className="container page-content"><SkeletonDashboard /></main></div>;
  const displayWeather = weather;

  return <div className={cn('app-shell', `weather-${group}`, !dark && 'light-mode')} id="top">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <Header dark={dark} setDark={setDark} onMenu={() => setShowMenu(true)} onSettings={() => setShowSettings((value) => !value)} />
    <main className="container page-content">
      <div className="topline"><div><span className="eyebrow live-eyebrow"><span className="live-dot" /> Live weather intelligence</span><h1>Know the weather.<br /><em>Know what's next.</em></h1></div><div className="topline-meta"><span>Updated {current?.time ? timeLabel(current.time, displayWeather?.timezone || 'auto') : 'now'}</span><button className={cn('icon-button', refreshing && 'is-spinning')} onClick={() => loadWeather(location, true)} aria-label="Refresh weather"><RefreshCw size={17} /></button></div></div>

      <div className="search-wrap" id="search"><Search size={19} /><input ref={searchRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && suggestions[0]) selectLocation(suggestions[0]); }} placeholder="Search a city, country or location…" aria-label="Search a city, country or location" />{searching && <RefreshCw className="spin" size={16} />}{searchQuery && <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={16} /></button>}
        <AnimatePresence>{(suggestions.length > 0 || (searchQuery.length > 1 && !searching)) && <motion.div className="suggestions" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}><div className="suggestion-label">Locations</div>{suggestions.map((item) => <button key={`${item.id}-${item.latitude}`} onClick={() => selectLocation(item)} className="suggestion"><MapPin size={15} /><span><strong>{item.name}</strong><small>{[item.admin1, item.country].filter(Boolean).join(', ')}</small></span><ChevronRight size={15} /></button>)}{!suggestions.length && !searching && <div className="empty-search">No location found. Try a nearby city.</div>}</motion.div>}</AnimatePresence>
      </div>
      <div className="search-subline"><button onClick={useMyLocation}><LocateFixed size={14} /> Use my location</button><span>Try “Tokyo”, “London” or “Bengaluru”</span></div>
      {locationNote && <div className="location-note"><LocateFixed size={14} /> {locationNote}</div>}
      {error && <div className="error-banner"><AlertTriangle size={16} /> <span>{error}</span><button onClick={() => loadWeather(location, true)}>Retry</button></div>}

      {displayWeather && <>
        <div className="hero-grid">
          <Card className="current-card">
            <div className="card-topline"><div className="location-chip"><MapPin size={14} /><span>{displayWeather.location.name}, {displayWeather.location.country}</span></div><button className={cn('favorite-button', isFavorite && 'is-favorite')} onClick={toggleFavorite} aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}><Star size={18} fill={isFavorite ? 'currentColor' : 'none'} /></button></div>
            <div className="current-main"><div><p className="current-date">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: displayWeather.timezone }).format(new Date())}</p><h2 className="current-temp">{formatTemp(current?.temperature || 0, unit)}</h2><p className="condition">{weatherLabel(current?.weatherCode || 0)} <span>•</span> Feels like {formatTemp(current?.feelsLike || 0, unit)}</p></div><div className="hero-glyph"><WeatherGlyph code={current?.weatherCode || 0} isDay={current?.isDay} size={94} /></div></div>
            <div className="temp-range"><span><ArrowUp size={14} /> High <strong>{formatTemp(currentDay?.high || 0, unit)}</strong></span><span><ArrowDown size={14} /> Low <strong>{formatTemp(currentDay?.low || 0, unit)}</strong></span><span className="range-bar"><i style={{ width: `${Math.min(100, Math.max(25, ((current?.temperature || 0) - (currentDay?.low || 0)) / Math.max(1, (currentDay?.high || 0) - (currentDay?.low || 0)) * 100))}%` }} /></span></div>
            <div className="current-footer"><div><span>Local time</span><strong>{timeLabel(current?.time || '', displayWeather.timezone)}</strong></div><div><span>Timezone</span><strong>{displayWeather.timezone.replace('_', ' ')}</strong></div><div><span>Daylight</span><strong>{current?.isDay ? 'Daytime' : 'Night time'}</strong></div></div>
          </Card>
          <Card className="summary-card"><div className="card-heading"><div><div className="eyebrow">Today at a glance</div><h3>What’s next</h3></div><Sparkles size={19} className="heading-spark" /></div><div className="summary-copy">{(current?.temperature || 0) >= 30 ? 'Warm and bright today.' : 'A comfortable day ahead.'} {nextRain ? `Rain probability rises to ${nextRain.rainProbability}% around ${timeLabel(nextRain.time, displayWeather.timezone)}.` : 'No meaningful rain signal in the next few hours.'}</div><div className="summary-list"><div><span><Umbrella size={15} /> Rain chance</span><strong>{nextRain?.rainProbability ?? displayWeather.daily[0]?.rainProbability ?? 0}%</strong></div><div><span><Wind size={15} /> Wind</span><strong>{formatSpeed(current?.windSpeed || 0, windUnit)}</strong></div><div><span><Sun size={15} /> UV index</span><strong>{Math.round(current?.uvIndex || 0)} <small>{(current?.uvIndex || 0) >= 6 ? 'High' : 'Low'}</small></strong></div></div><div className="recommendation"><div className="recommendation-icon"><Bike size={16} /></div><div><span>Best time to head out</span><strong>{(current?.temperature || 0) >= 30 ? 'Before 10 AM' : 'Anytime before sunset'}</strong></div><ChevronRight size={17} /></div></Card>
        </div>

        <div className="section-block" id="forecast"><SectionHeading eyebrow="The next 24 hours" title="Hourly forecast" action={<button className="text-button">See full forecast <ChevronRight size={15} /></button>} /><div className="hourly-scroll">{displayWeather.hourly.slice(0, 12).map((hour, index) => <div className={cn('hour-card', index === 0 && 'now')} key={hour.time}><span className="hour-time">{index === 0 ? 'Now' : timeLabel(hour.time, displayWeather.timezone, { hour: 'numeric' }).replace(' ', '')}</span><WeatherGlyph code={hour.weatherCode} isDay={hour.time < `${hour.time.slice(0, 10)}T18:00`} size={24} /><strong>{formatTemp(hour.temperature, unit)}</strong><span className="rain-chance"><Droplets size={12} /> {hour.rainProbability}%</span><small>{formatSpeed(hour.windSpeed, windUnit).replace(' km/h', '')} wind</small></div>)}</div></div>

        <div className="section-block"><SectionHeading eyebrow="A week in view" title="5-day outlook" action={<div className="unit-toggle"><button className={unit === 'celsius' ? 'active' : ''} onClick={() => setUnit('celsius')}>°C</button><button className={unit === 'fahrenheit' ? 'active' : ''} onClick={() => setUnit('fahrenheit')}>°F</button></div>} /><div className="forecast-grid">{displayWeather.daily.slice(0, 5).map((day, index) => <button className={cn('forecast-card', selectedDay === index && 'selected')} key={day.date} onClick={() => setSelectedDay(index)}><div><span>{index === 0 ? 'Today' : dayLabel(day.date, displayWeather.timezone)}</span><small>{dateLabel(day.date)}</small></div><WeatherGlyph code={day.weatherCode} size={28} /><strong>{formatTemp(day.high, unit)} <span>/ {formatTemp(day.low, unit)}</span></strong><Pill tone={day.rainProbability >= 50 ? 'cyan' : 'neutral'}><Droplets size={11} /> {day.rainProbability}%</Pill><ChevronRight size={15} className="forecast-chevron" /></button>)}</div>{currentDay && <div className="day-detail"><div className="day-detail-title"><WeatherGlyph code={currentDay.weatherCode} size={32} /><div><strong>{selectedDay === 0 ? 'Today' : dayLabel(currentDay.date, displayWeather.timezone)} · {weatherLabel(currentDay.weatherCode)}</strong><span>Feels like {formatTemp(currentDay.apparentHigh, unit)} at the warmest point</span></div></div><div className="day-stats"><span><Wind size={14} /> {formatSpeed(currentDay.windSpeed, windUnit)}</span><span><Umbrella size={14} /> {currentDay.precipitation.toFixed(1)} mm expected</span><span><Sunrise size={14} /> {timeLabel(currentDay.sunrise, displayWeather.timezone)}</span><span><Sunset size={14} /> {timeLabel(currentDay.sunset, displayWeather.timezone)}</span></div></div>}</div>

        <div className="two-col section-block"><Card className="chart-card"><div className="card-heading"><div><div className="eyebrow">Read the pattern</div><h3>Weather trends</h3></div><div className="chart-switcher">{(['Temperature', 'Rain chance', 'Wind'] as const).map((name) => <button key={name} className={chart === name ? 'active' : ''} onClick={() => setChart(name)}>{name === 'Rain chance' ? 'Rain' : name}</button>)}</div></div><div className="chart-legend"><span><i className={chart === 'Rain chance' ? 'legend-blue' : chart === 'Wind' ? 'legend-amber' : 'legend-cyan'} /> {chart}</span><strong>{chart === 'Temperature' ? `${formatTemp(Math.round(current?.temperature || 0), unit)} now` : chart === 'Rain chance' ? `${nextRain?.rainProbability || displayWeather.daily[0].rainProbability}% peak` : `${Math.round(current?.windSpeed || 0)} km/h now`}</strong></div><div className="chart-wrap"><ResponsiveContainer width="100%" height={190}><AreaChart data={chartData} margin={{ top: 12, right: 6, left: -25, bottom: 0 }}><defs><linearGradient id="cyanFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#55d6e8" stopOpacity={0.25} /><stop offset="100%" stopColor="#55d6e8" stopOpacity={0} /></linearGradient><linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c9cff" stopOpacity={0.25} /><stop offset="100%" stopColor="#7c9cff" stopOpacity={0} /></linearGradient><linearGradient id="amberFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffc45e" stopOpacity={0.2} /><stop offset="100%" stopColor="#ffc45e" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 6" stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="time" tick={{ fill: 'var(--muted-text)', fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tick={{ fill: 'var(--muted-text)', fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--text)' }} labelStyle={{ color: 'var(--muted-text)' }} /><Area type="monotone" dataKey={chart} stroke={chart === 'Rain chance' ? '#7c9cff' : chart === 'Wind' ? '#ffc45e' : '#55d6e8'} fill={chart === 'Rain chance' ? 'url(#blueFill)' : chart === 'Wind' ? 'url(#amberFill)' : 'url(#cyanFill)'} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} /></AreaChart></ResponsiveContainer></div></Card><Card className="sun-card"><div className="card-heading"><div><div className="eyebrow">Light & time</div><h3>Sunrise & sunset</h3></div><Sunrise size={19} className="heading-spark" /></div><div className="sun-times"><div><Sunrise size={20} /><span>Sunrise</span><strong>{timeLabel(currentDay?.sunrise || '', displayWeather.timezone)}</strong></div><div><Sunset size={20} /><span>Sunset</span><strong>{timeLabel(currentDay?.sunset || '', displayWeather.timezone)}</strong></div></div><div className="sun-path"><div className="sun-path-line"><span className="sun-marker" style={{ left: `${current?.isDay ? 45 : 92}%` }} /></div><div><span>Morning</span><span>Golden hour</span><span>Night</span></div></div><div className="day-length"><span>Day length</span><strong>{currentDay ? `${Math.max(0, Math.round((new Date(currentDay.sunset).getTime() - new Date(currentDay.sunrise).getTime()) / 3600000))}h ${(currentDay ? Math.abs(Math.round((new Date(currentDay.sunset).getTime() - new Date(currentDay.sunrise).getTime()) / 60000) % 60) : 0)}m` : '—'}</strong></div></Card></div>

        <div className="three-col section-block"><Card><SectionHeading eyebrow="At a glance" title="Weather details" /><div className="metric-grid"><Metric icon={Droplets} label="Humidity" value={`${current?.humidity ?? 0}%`} detail={`Dew point ${formatTemp((current?.temperature || 0) - 4, unit)}`} accent="cyan" /><Metric icon={Wind} label="Wind" value={formatSpeed(current?.windSpeed || 0, windUnit)} detail={`${compassDirection(current?.windDirection || 0)} · gusts ${Math.round(current?.windGusts || 0)}`} accent="cyan" /><Metric icon={Gauge} label="Pressure" value={`${Math.round(current?.pressure || 0)} hPa`} detail="Steady" accent="violet" /><Metric icon={Eye} label="Visibility" value={`${Math.round((current?.visibility || 0) / 1000)} km`} detail="Clear outlook" accent="green" /><Metric icon={Sun} label="UV index" value={`${Math.round(current?.uvIndex || 0)}`} detail={(current?.uvIndex || 0) >= 6 ? 'High · SPF 30+' : 'Low · minimal risk'} accent="amber" /><Metric icon={Cloud} label="Cloud cover" value={`${current?.cloudCover ?? 0}%`} detail="Across the sky" accent="violet" /></div></Card><Card className="air-card"><div className="card-heading"><div><div className="eyebrow">Breathe easy</div><h3>Air quality</h3></div><ShieldCheck size={19} className="heading-spark" /></div>{(() => { const meta = aqiMeta(displayWeather.airQuality.aqi); return <><div className="aqi-score"><div className={cn('aqi-ring', `aqi-${meta.tone}`)}><strong>{displayWeather.airQuality.aqi ?? '—'}</strong><span>US AQI</span></div><div><Pill tone={meta.tone === 'good' ? 'green' : meta.tone === 'moderate' ? 'amber' : 'red'}>{meta.label}</Pill><p>{meta.description}</p></div></div><div className="pollutants"><span><b>PM2.5</b>{displayWeather.airQuality.pm25?.toFixed(1) ?? '—'} <small>μg/m³</small></span><span><b>PM10</b>{displayWeather.airQuality.pm10?.toFixed(1) ?? '—'} <small>μg/m³</small></span><span><b>O₃</b>{displayWeather.airQuality.ozone?.toFixed(0) ?? '—'} <small>μg/m³</small></span></div></>; })()}</Card><Card id="radar" className="radar-card"><div className="card-heading"><div><div className="eyebrow">Live layer</div><h3>Local radar</h3></div><button className="small-action"><MoreHorizontal size={18} /></button></div><div className="radar-map"><div className="map-grid" /><div className="radar-sweep" /><div className="radar-pulse" /><div className="radar-label"><MapPin size={13} /> {displayWeather.location.name}</div><div className="map-controls"><button><Plus size={14} /></button><button><ArrowDown size={14} /></button></div></div><div className="radar-footer"><span><span className="live-dot" /> Live precipitation layer</span><button onClick={() => setActiveNav('Radar')}>Open map <ChevronRight size={14} /></button></div></Card></div>

        <div className="section-block"><SectionHeading eyebrow="Make it useful" title="Weather health & recommendations" action={<span className="section-note"><Sparkles size={14} /> Practical, not predictive</span>} /><div className="insights-grid">{insights.map(({ icon: Icon, title, body, tone }) => <Card className="insight-card" key={title}><div className={cn('insight-icon', `insight-${tone}`)}><Icon size={18} /></div><div><span>{title}</span><p>{body}</p></div><ChevronRight size={16} className="insight-arrow" /></Card>)}</div></div>

        <div className="two-col section-block"><Card id="saved" className="saved-card"><div className="card-heading"><div><div className="eyebrow">Your shortlist</div><h3>My locations</h3></div><button className="small-action" onClick={() => searchRef.current?.focus()}><Plus size={18} /></button></div>{favorites.length ? <div className="saved-list">{favorites.slice(0, 4).map((item) => <button key={item.id} onClick={() => selectLocation(item)}><span className="saved-avatar"><MapPin size={15} /></span><span><strong>{item.name}</strong><small>{item.country}</small></span><ChevronRight size={15} /></button>)}</div> : <div className="empty-state"><Star size={20} /><span>Save places you check often.</span><button onClick={toggleFavorite}>Save {location.name}</button></div>}</Card><Card id="compare" className="compare-card"><div className="card-heading"><div><div className="eyebrow">Side by side</div><h3>Compare weather</h3></div><Pill tone="cyan">New</Pill></div><div className="compare-row compare-heading"><span>Metric</span><strong>{location.name}</strong><strong>{favorites[0]?.name || 'Kolkata'}</strong></div><div className="compare-row"><span>Temperature</span><strong>{formatTemp(current?.temperature || 0, unit)}</strong><strong>{favorites[0] ? '—' : '29°'}</strong></div><div className="compare-row"><span>Humidity</span><strong>{current?.humidity}%</strong><strong>{favorites[0] ? '—' : '71%'}</strong></div><div className="compare-row"><span>Rain chance</span><strong>{displayWeather.daily[0].rainProbability}%</strong><strong>{favorites[0] ? '—' : '38%'}</strong></div><button className="compare-cta" onClick={() => searchRef.current?.focus()}>Add a location to compare <ChevronRight size={15} /></button></Card></div>
      </>}
      <footer><div className="footer-brand"><div className="brand-mark small"><span /><span /><span /></div><div><strong>WhatNext.com</strong><p>Know the weather. Know what’s next.</p></div></div><div className="footer-links"><a href="#top">About</a><a href="#top">Privacy</a><a href="#top">API information</a><span>© 2026 WhatNext.com</span></div></footer>
    </main>
    <nav className="mobile-nav">{NAV_ITEMS.map(({ label, icon: Icon }) => <button key={label} className={activeNav === label ? 'active' : ''} onClick={() => jumpTo(label)}><Icon size={18} /><span>{label === 'Overview' ? 'Home' : label}</span></button>)}</nav>
    <AnimatePresence>{showMenu && <motion.div className="mobile-drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMenu(false)}><motion.aside className="mobile-drawer" initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} onClick={(event) => event.stopPropagation()}><div className="drawer-header"><Brand /><button onClick={() => setShowMenu(false)}><X size={19} /></button></div>{NAV_ITEMS.map(({ label, icon: Icon }) => <button key={label} onClick={() => { jumpTo(label); setShowMenu(false); }}><Icon size={18} /> {label}</button>)}<button onClick={() => { setShowSettings(true); setShowMenu(false); }}><Settings2 size={18} /> Settings</button></motion.aside></motion.div>}</AnimatePresence>
    <AnimatePresence>{showSettings && <motion.div className="settings-popover" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}><div className="settings-head"><strong>Preferences</strong><button onClick={() => setShowSettings(false)}><X size={16} /></button></div><label>Temperature unit<div className="segmented"><button className={unit === 'celsius' ? 'active' : ''} onClick={() => setUnit('celsius')}>Celsius</button><button className={unit === 'fahrenheit' ? 'active' : ''} onClick={() => setUnit('fahrenheit')}>Fahrenheit</button></div></label><label>Wind speed<div className="segmented"><button className={windUnit === 'kmh' ? 'active' : ''} onClick={() => setWindUnit('kmh')}>km/h</button><button className={windUnit === 'mph' ? 'active' : ''} onClick={() => setWindUnit('mph')}>mph</button><button className={windUnit === 'ms' ? 'active' : ''} onClick={() => setWindUnit('ms')}>m/s</button></div></label><button className="theme-row" onClick={() => setDark((value) => !value)}>{dark ? <Moon size={16} /> : <Sun size={16} />} <span>{dark ? 'Dark mode' : 'Light mode'}</span><span className={cn('switch', dark && 'on')}><i /></span></button></motion.div>}</AnimatePresence>
  </div>;
}

function Brand() { return <div className="brand"><div className="brand-mark"><span /><span /><span /></div><span>WhatNext<span className="brand-dot">.</span>com</span></div>; }
function Header({ dark, setDark, onMenu, onSettings }: { dark: boolean; setDark: (value: boolean) => void; onMenu: () => void; onSettings: () => void }) { return <header className="site-header"><div className="header-inner"><button className="mobile-menu" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button><Brand /><nav className="desktop-nav"><a className="active" href="#top">Overview</a><a href="#forecast">Forecast</a><a href="#radar">Radar</a><a href="#saved">Saved</a><a href="#compare">Compare</a></nav><div className="header-actions"><button className="header-icon" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Moon size={17} /> : <Sun size={17} />}</button><button className="header-icon" aria-label="Notifications"><Bell size={17} /><i /></button><button className="header-icon" onClick={onSettings} aria-label="Open preferences"><Settings2 size={17} /></button><div className="avatar">AM</div></div></div></header>; }
