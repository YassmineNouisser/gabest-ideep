import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  ChevronRight,
  Cloud,
  FileBarChart,
  Home,
  Loader2,
  LogOut,
  Package,
  Recycle,
  Search,
  Settings,
  ShieldAlert,
  Sprout,
  Wind,
  type LucideIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  IMG_INDUSTRY_PLANT,
  IMG_HERO
} from '../lib/images';
import { IndustryMatchFlow } from '../components/IndustryMatchFlow';
import { AdminFab } from '../components/AdminFab';
import { WindAdvisorPanel } from '../components/WindAdvisorPanel';
import { DispersionMap, CompassRose } from '../components/DispersionMap';
import { HourlyPlanCard } from '../components/HourlyPlanCard';
import {
  batchPresets,
  buyerMeetsConstraints,
  fetchBuyers,
  type Batch,
  type Buyer
} from '../lib/phosphomatch';
import {
  fetchDailyForecast,
  fetchPollution,
  fetchWeather,
  type DailyForecast,
  type Pollution,
  type Weather
} from '../lib/ai';

const GREEN = '#2BA24C';
const GREEN_DARK = '#1E7A38';
const GREEN_SOFT = '#E6F4EA';
const CHARCOAL = '#0F1A13';
const MUTED = '#98A29A';
const CREAM = '#F7F5F0';
const BORDER = 'rgba(15,26,19,0.08)';
const GOLD = '#E0A23A';
const RED = '#D24C4C';

type NavItem = { id: string; label: string; icon: LucideIcon; badge?: string };

const NAV_ITEMS: { section: string; items: NavItem[] }[] = [
  {
    section: 'Pilotage',
    items: [
      { id: 'overview', label: "Vue d'ensemble", icon: Home },
      { id: 'wind', label: 'Vent & dispersion', icon: Wind }
    ]
  },
  {
    section: 'Matching',
    items: [
      { id: 'agri', label: 'Acheteurs', icon: Sprout },
      { id: 'recy', label: 'Recycleurs', icon: Recycle },
      { id: 'contracts', label: 'Contrats', icon: Package }
    ]
  }
];

const COMPASS_LABELS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];

function compass(deg: number): string {
  return COMPASS_LABELS[Math.round(deg / 22.5) % 16];
}

function aqiTone(aqi: number): { bg: string; color: string; label: string } {
  if (aqi <= 2) return { bg: GREEN_SOFT, color: GREEN_DARK, label: 'Air bon' };
  if (aqi === 3) return { bg: '#FDF3DC', color: '#9A6B10', label: 'Air modéré' };
  return { bg: '#FCE8E6', color: RED, label: 'Air dégradé' };
}

function so2Tone(so2: number): { bg: string; color: string; label: string } {
  if (so2 < 40) return { bg: GREEN_SOFT, color: GREEN_DARK, label: 'Sous seuil' };
  if (so2 < 100) return { bg: '#FDF3DC', color: '#9A6B10', label: 'Vigilance' };
  return { bg: '#FCE8E6', color: RED, label: 'Dépassement' };
}

// Same risk model used by the satellite plume colour (HTML dashboard parity).
function calcDispersionRisk(weather: Weather | null): number {
  if (!weather) return 0;
  const FACTORY = { lat: 33.8881, lon: 10.0975 };
  const CITY = { lat: 33.8869, lon: 10.0982 };
  const SEA = { lat: 33.95, lon: 10.28 };
  const cAz = (Math.atan2(CITY.lon - FACTORY.lon, CITY.lat - FACTORY.lat) * 180 / Math.PI + 360) % 360;
  const sAz = (Math.atan2(SEA.lon - FACTORY.lon, SEA.lat - FACTORY.lat) * 180 / Math.PI + 360) % 360;
  const wd = weather.windDeg;
  const ws = weather.windSpeed;
  const dc = Math.abs(((wd - cAz + 180) % 360) - 180);
  const ds = Math.abs(((wd - sAz + 180) % 360) - 180);
  const cs = Math.max(0, (90 - dc) / 90);
  const ss = Math.max(0, (90 - ds) / 90);
  let r = cs * (ws < 8 ? 1.15 : ws < 25 ? 0.85 : 0.65) * 100;
  if (ss > 0.5) r *= 1 - ss * 0.45;
  return Math.min(100, Math.max(0, r));
}

function dispersionAdvice(weather: Weather | null): {
  title: string;
  body: string;
  tone: string;
} {
  if (!weather) {
    return {
      title: 'Données vent en cours de chargement…',
      body: 'OpenWeatherMap interroge la station Gabès / Ghannouch.',
      tone: GOLD
    };
  }
  const dir = compass(weather.windDeg);
  if (['NE', 'NNE', 'ENE', 'E'].includes(dir)) {
    return {
      title: `Vent ${dir} ${weather.windSpeed} km/h — risque sur Chenini`,
      body:
        "Réduisez la combustion soufre des lignes les plus émettrices avant 14 h. Notifiez les agriculteurs de Chenini Nahal.",
      tone: weather.windSpeed >= 25 ? RED : GOLD
    };
  }
  if (['SO', 'OSO', 'O', 'ONO'].includes(dir)) {
    return {
      title: `Vent ${dir} ${weather.windSpeed} km/h — dispersion vers la mer`,
      body:
        "Conditions favorables : maintenir la cadence de production et planifier les opérations bruyantes/poussiéreuses.",
      tone: GREEN
    };
  }
  if (weather.windSpeed < 8) {
    return {
      title: `Vent faible ${weather.windSpeed} km/h — accumulation locale`,
      body:
        "Air stagnant : limitez les pics d'émission, reportez les torchères, surveillez la zone tampon GCT.",
      tone: GOLD
    };
  }
  return {
    title: `Vent ${dir} ${weather.windSpeed} km/h — dispersion modérée`,
    body:
      "Conditions standard : poursuivre l'exploitation nominale, surveiller AQI heure par heure.",
    tone: GREEN
  };
}

export function IndustryDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');

  const [batch] = useState<Batch>({ ...batchPresets[0].values });
  const [buyersCache, setBuyersCache] = useState<Buyer[]>([]);
  const matchRef = useRef<HTMLDivElement | null>(null);
  const windRef = useRef<HTMLDivElement | null>(null);

  const [weather, setWeather] = useState<Weather | null>(null);
  const [pollution, setPollution] = useState<Pollution | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    fetchBuyers()
      .then(setBuyersCache)
      .catch(() => setBuyersCache([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [w, p, f] = await Promise.all([
        fetchWeather('Ghannouch'),
        fetchPollution('Ghannouch'),
        fetchDailyForecast('Ghannouch')
      ]);
      if (cancelled) return;
      setWeather(w);
      setPollution(p);
      setForecast(f);
      setLiveLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalBuyers = buyersCache.length;
  const compatibleCount = buyersCache.filter(b => buyerMeetsConstraints(batch, b)).length;
  const compatibilityPct = totalBuyers > 0 ? Math.round((compatibleCount / totalBuyers) * 100) : 0;

  const openMatchPanel = () => {
    setActive('agri');
    window.setTimeout(
      () => matchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      80
    );
  };

  const advisory = dispersionAdvice(weather);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  const heroSub = weather
    ? `${today} · ${weather.temp}°C · vent ${compass(weather.windDeg)} ${weather.windSpeed} km/h — ${advisory.title}.`
    : `${today} · données OpenWeather en cours…`;

  const so2Now = pollution ? so2Tone(pollution.so2) : null;
  const aqiNow = pollution ? aqiTone(pollution.aqi) : null;

  const metrics: {
    label: string;
    value: string;
    unit: string;
    badge?: string;
    badgeBg?: string;
    badgeColor?: string;
    sub: string;
    tone: 'good' | 'warn' | 'risk' | 'neutral';
  }[] = [
    pollution
      ? {
          label: 'SO₂ ambient · Ghannouch',
          value: pollution.so2.toFixed(1),
          unit: 'µg/m³',
          badge: so2Now!.label,
          badgeBg: so2Now!.bg,
          badgeColor: so2Now!.color,
          sub: 'OpenWeatherMap · air pollution',
          tone: pollution.so2 < 40 ? 'good' : pollution.so2 < 100 ? 'warn' : 'risk'
        }
      : {
          label: 'SO₂ ambient',
          value: '—',
          unit: 'µg/m³',
          sub: 'OpenWeather indisponible',
          tone: 'neutral'
        },
    pollution
      ? {
          label: 'AQI Ghannouch',
          value: String(pollution.aqi),
          unit: '/5',
          badge: aqiNow!.label,
          badgeBg: aqiNow!.bg,
          badgeColor: aqiNow!.color,
          sub: `PM2.5 ${pollution.pm25} · NO₂ ${pollution.no2}`,
          tone: pollution.aqi <= 2 ? 'good' : pollution.aqi === 3 ? 'warn' : 'risk'
        }
      : {
          label: 'AQI Ghannouch',
          value: '—',
          unit: '/5',
          sub: 'OpenWeather indisponible',
          tone: 'neutral'
        },
    weather
      ? {
          label: 'Vent ambient',
          value: String(weather.windSpeed),
          unit: 'km/h',
          badge: compass(weather.windDeg),
          badgeBg: weather.windSpeed >= 25 ? '#FCE8E6' : GREEN_SOFT,
          badgeColor: weather.windSpeed >= 25 ? RED : GREEN_DARK,
          sub: `${weather.temp}°C · humidité ${weather.humidity}%`,
          tone: weather.windSpeed >= 25 ? 'warn' : 'good'
        }
      : {
          label: 'Vent ambient',
          value: '—',
          unit: 'km/h',
          sub: 'OpenWeather indisponible',
          tone: 'neutral'
        },
    {
      label: 'Acheteurs compatibles',
      value: String(compatibleCount),
      unit: `/ ${totalBuyers || '—'}`,
      badge: `${compatibilityPct} %`,
      badgeBg: GREEN_SOFT,
      badgeColor: GREEN_DARK,
      sub: 'Lot standard GCT · contraintes dures',
      tone: 'good'
    }
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: CREAM, color: CHARCOAL, fontFamily: 'var(--font-display)' }}
    >
      {/* =============== SIDEBAR =============== */}
      <aside
        className="fixed left-0 top-0 bottom-0 w-[264px] flex flex-col z-40"
        style={{ backgroundColor: CHARCOAL, borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="px-6 py-6 flex items-center gap-3 relative overflow-hidden"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <img
            src={IMG_INDUSTRY_PLANT}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{
              filter: 'blur(14px) saturate(1.1) brightness(0.4)',
              opacity: 0.35,
              transform: 'scale(1.2)'
            }}
            onError={e => {
              if (e.currentTarget.src !== IMG_HERO) e.currentTarget.src = IMG_HERO;
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, rgba(15,26,19,0.55), ${CHARCOAL} 100%)`
            }}
          />
          <div className="relative flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: GREEN, boxShadow: `0 6px 16px ${GREEN}55` }}
            >
              <Sprout size={18} color="white" strokeWidth={2} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 18,
                  color: 'white',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}
              >
                Gabest
              </div>
              <div
                className="mt-0.5"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10.5,
                  color: 'rgba(255,255,255,0.62)',
                  letterSpacing: 1.8,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                Industriel
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-7">
          {NAV_ITEMS.map(group => (
            <div key={group.section}>
              <div
                className="px-3 mb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10.5,
                  color: 'rgba(255,255,255,0.38)',
                  letterSpacing: 2.2,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                {group.section}
              </div>
              <ul className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = active === item.id;
                  const handleClick = () => {
                    setActive(item.id);
                    if (item.id === 'wind') {
                      window.setTimeout(
                        () => windRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                        60
                      );
                    } else if (item.id === 'agri' || item.id === 'recy' || item.id === 'contracts') {
                      window.setTimeout(
                        () => matchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                        60
                      );
                    }
                  };
                  return (
                    <li key={item.id}>
                      <button
                        onClick={handleClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
                        style={{
                          backgroundColor: isActive ? GREEN : 'transparent',
                          color: isActive ? 'white' : 'rgba(255,255,255,0.72)',
                          fontFamily: 'var(--font-display)',
                          fontSize: 13.5,
                          fontWeight: isActive ? 600 : 500
                        }}
                        onMouseEnter={e => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                        }}
                        onMouseLeave={e => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Icon size={16} strokeWidth={2} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span
                            className="px-1.5 py-0.5 rounded-md"
                            style={{
                              backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
                              color: 'white',
                              fontSize: 10.5,
                              fontWeight: 700,
                              letterSpacing: 0.3
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div
          className="px-3 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="p-3 rounded-2xl flex items-center gap-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: GREEN_DARK }}
            >
              <Building2 size={16} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="truncate"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  color: 'white',
                  fontWeight: 600
                }}
              >
                GCT · Gabès
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.55)'
                }}
              >
                Zone de Ghannouch
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              title="Déconnexion"
            >
              <LogOut size={14} />
            </button>
          </div>
          <button
            onClick={() => setActive('settings')}
            className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-xl transition-colors"
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 500
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Settings size={15} />
            Paramètres
          </button>
        </div>
      </aside>

      {/* =============== MAIN =============== */}
      <main className="flex-1 ml-[264px]">
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-8 py-4"
          style={{
            backgroundColor: 'rgba(247,245,240,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${BORDER}`
          }}
        >
          <div className="flex items-center gap-3">
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                color: MUTED,
                fontWeight: 500
              }}
            >
              Industriel
            </span>
            <ChevronRight size={14} style={{ color: MUTED }} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13.5,
                color: CHARCOAL,
                fontWeight: 700,
                letterSpacing: '-0.01em'
              }}
            >
              Vue d'ensemble
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-full w-[260px]"
              style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
            >
              <Search size={14} style={{ color: MUTED }} />
              <input
                placeholder="Rechercher un flux, partenaire…"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  color: CHARCOAL
                }}
              />
            </div>
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center relative transition-colors hover:bg-white"
              style={{ border: `1px solid ${BORDER}`, backgroundColor: 'white' }}
            >
              <Bell size={15} style={{ color: CHARCOAL }} />
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ backgroundColor: GREEN, boxShadow: `0 0 8px ${GREEN}` }}
              />
            </button>
          </div>
        </header>

        <div className="px-8 py-8 space-y-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl"
            style={{ minHeight: 220 }}
          >
            <img
              src={IMG_INDUSTRY_PLANT}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'saturate(1.05) brightness(0.58)' }}
              onError={e => {
                if (e.currentTarget.src !== IMG_HERO) e.currentTarget.src = IMG_HERO;
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(95deg, rgba(15,26,19,0.82) 0%, rgba(15,26,19,0.62) 55%, rgba(15,26,19,0.18) 100%)'
              }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 70% 50%, ${GREEN}35, transparent 70%)`,
                filter: 'blur(40px)'
              }}
            />

            <div className="relative p-8 lg:p-10 flex items-end justify-between gap-6 flex-wrap min-h-[220px]">
              <div className="max-w-2xl">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(12px)'
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: GREEN, boxShadow: `0 0 10px ${GREEN}` }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 11,
                      color: 'white',
                      letterSpacing: 2,
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    En ligne · Zone Ghannouch · Données OpenWeather
                  </span>
                </div>
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(28px, 3.2vw, 42px)',
                    fontWeight: 800,
                    color: 'white',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05
                  }}
                >
                  Bonjour,{' '}
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>GCT Gabès</span>
                </h1>
                <p
                  className="mt-2"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14.5,
                    color: 'rgba(255,255,255,0.75)',
                    maxWidth: 580
                  }}
                >
                  {heroSub}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  className="inline-flex items-center gap-2 px-4 h-11 rounded-xl transition-colors"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(12px)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'white'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                >
                  <FileBarChart size={15} />
                  Rapport ESG
                </button>
                <button
                  onClick={openMatchPanel}
                  className="inline-flex items-center gap-2 px-4 h-11 rounded-xl transition-transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: GREEN,
                    color: 'white',
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    fontWeight: 700
                  }}
                >
                  <Package size={15} />
                  Publier un flux
                </button>
              </div>
            </div>
          </motion.div>

          {/* Metrics live */}
          <div>
            {liveLoading && (
              <div
                className="mb-3 inline-flex items-center gap-2"
                style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: MUTED }}
              >
                <Loader2 size={12} className="animate-spin" />
                Synchronisation OpenWeather Ghannouch…
              </div>
            )}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {metrics.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 + 0.1 }}
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 11.5,
                        color: MUTED,
                        fontWeight: 600,
                        letterSpacing: 0.3
                      }}
                    >
                      {m.label}
                    </span>
                    {m.badge && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: m.badgeBg,
                          color: m.badgeColor,
                          fontFamily: 'var(--font-display)',
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 0.2
                        }}
                      >
                        {m.tone === 'risk' ? (
                          <ArrowDownRight size={11} />
                        ) : (
                          <ArrowUpRight size={11} />
                        )}
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 32,
                        fontWeight: 800,
                        color: CHARCOAL,
                        letterSpacing: '-0.03em',
                        lineHeight: 1
                      }}
                    >
                      {m.value}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 13,
                        color: MUTED,
                        fontWeight: 600
                      }}
                    >
                      {m.unit}
                    </span>
                  </div>
                  <div
                    className="mt-2"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 11.5,
                      color: MUTED
                    }}
                  >
                    {m.sub}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Wind advisory + Forecast */}
          <div className="grid lg:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 p-6 rounded-2xl relative overflow-hidden"
              style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: advisory.tone }}
              />
              <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 10.5,
                      color: GREEN,
                      letterSpacing: 2.2,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: 6
                    }}
                  >
                    AlertBridge · vent en direct
                  </div>
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      fontWeight: 700,
                      color: CHARCOAL,
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Conduite recommandée des lignes
                  </h2>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${advisory.tone}18`,
                    color: advisory.tone,
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    fontWeight: 700
                  }}
                >
                  <ShieldAlert size={11} />
                  Aviso temps réel
                </span>
              </div>

              {/* Satellite map · plume + critical zones (parité dashboard_gabes) */}
              <div className="relative mb-4">
                <DispersionMap
                  windDeg={weather?.windDeg ?? 110}
                  windSpeed={weather?.windSpeed ?? 10}
                  risk={calcDispersionRisk(weather)}
                  height={300}
                />
                {/* Map header overlay */}
                <div
                  className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: 'rgba(15,26,19,0.78)',
                    color: 'white',
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    backdropFilter: 'blur(8px)',
                    zIndex: 500
                  }}
                >
                  🛰️ Dispersion fumée — Gabès
                </div>
                {/* Compass + live wind overlay */}
                <div
                  className="absolute top-3 right-3 flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.94)',
                    border: `1px solid ${BORDER}`,
                    backdropFilter: 'blur(8px)',
                    zIndex: 500
                  }}
                >
                  <CompassRose windDeg={weather?.windDeg ?? 0} size={56} arrowColor={advisory.tone} />
                  <div style={{ fontFamily: 'var(--font-display)' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: CHARCOAL, lineHeight: 1 }}>
                      {weather ? `${weather.windDeg}°` : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                      {weather ? `${compass(weather.windDeg)} · ${weather.windSpeed} km/h` : '—'}
                    </div>
                    <div style={{ fontSize: 10.5, color: advisory.tone, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 3 }}>
                      Risque {calcDispersionRisk(weather).toFixed(0)}/100
                    </div>
                  </div>
                </div>
                {/* Legend overlay */}
                <div
                  className="absolute bottom-3 left-3 px-3 py-2 rounded-xl"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.94)',
                    border: `1px solid ${BORDER}`,
                    fontFamily: 'var(--font-display)',
                    fontSize: 10.5,
                    color: CHARCOAL,
                    backdropFilter: 'blur(8px)',
                    zIndex: 500,
                    minWidth: 168
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, color: GREEN, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 }}>
                    Zones critiques
                  </div>
                  {[
                    { c: '#ef4444', t: '0–600 m · Danger' },
                    { c: '#f97316', t: '600 m – 2 km' },
                    { c: '#eab308', t: '2 – 5 km' },
                    { c: '#22c55e', t: '5 – 10 km' }
                  ].map(z => (
                    <div key={z.t} className="flex items-center gap-2" style={{ marginTop: 3 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: `${z.c}55`,
                          border: `2px solid ${z.c}`,
                          display: 'inline-block',
                          flexShrink: 0
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#3F4B43' }}>{z.t}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: BORDER, margin: '6px 0' }} />
                  <div className="flex items-center gap-2">
                    <span style={{ width: 18, height: 3, background: '#94a3b8', display: 'inline-block', borderRadius: 2 }} />
                    <span style={{ fontSize: 11, color: '#3F4B43' }}>Panache fumée</span>
                  </div>
                </div>
              </div>

              {/* Advisory text */}
              <div
                className="p-5 rounded-2xl flex items-start gap-4"
                style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${advisory.tone}22` }}
                >
                  <Wind size={20} style={{ color: advisory.tone }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16,
                      fontWeight: 800,
                      color: CHARCOAL,
                      letterSpacing: '-0.01em',
                      marginBottom: 6
                    }}
                  >
                    {advisory.title}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 13.5,
                      color: '#3F4B43',
                      lineHeight: 1.5
                    }}
                  >
                    {advisory.body}
                  </div>
                  {weather && (
                    <div
                      className="mt-3 flex flex-wrap gap-3"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 12,
                        color: MUTED
                      }}
                    >
                      <span>Direction : {compass(weather.windDeg)} ({weather.windDeg}°)</span>
                      <span>•</span>
                      <span>Humidité {weather.humidity}%</span>
                      <span>•</span>
                      <span>Lever {new Date(weather.sunrise * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Forecast 5 days */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl"
              style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-end justify-between mb-6">
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 10.5,
                      color: GREEN,
                      letterSpacing: 2.2,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: 6
                    }}
                  >
                    Prévision 5j · Ghannouch
                  </div>
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      fontWeight: 700,
                      color: CHARCOAL,
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Météo
                  </h2>
                </div>
              </div>

              {forecast.length === 0 ? (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: MUTED }}>
                  {liveLoading ? 'Chargement…' : 'Indisponible.'}
                </div>
              ) : (
                <ul className="space-y-2">
                  {forecast.slice(0, 5).map((d: DailyForecast) => (
                    <li
                      key={d.dt}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}
                    >
                      <div className="flex items-center gap-3">
                        <Cloud size={16} style={{ color: GREEN_DARK }} />
                        <div>
                          <div
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 13,
                              fontWeight: 700,
                              color: CHARCOAL
                            }}
                          >
                            {d.dayShort} {d.date}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 11.5,
                              color: MUTED
                            }}
                          >
                            {d.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 13,
                            fontWeight: 700,
                            color: CHARCOAL
                          }}
                        >
                          {d.tempMax}° / {d.tempMin}°
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 11,
                            color: d.windAvg >= 25 ? RED : MUTED
                          }}
                        >
                          vent {d.windAvg} km/h
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>

          {/* 24h hourly plan · production + pollution (parité dashboard_gabes) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <HourlyPlanCard
              zone="Ghannouch"
              windDeg={weather?.windDeg ?? null}
              windSpeed={weather?.windSpeed ?? null}
            />
          </motion.div>

          {/* AirShield · recommandation production selon vent */}
          <div ref={windRef}>
            <WindAdvisorPanel />
          </div>

          {/* IndustryMatch · flow circulaire complet */}
          <div ref={matchRef}>
            <IndustryMatchFlow />
          </div>
        </div>
      </main>

      <AdminFab />
    </div>
  );
}
