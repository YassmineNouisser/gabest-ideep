import { useOutletContext } from 'react-router';
import { motion } from 'motion/react';
import { Camera, Loader2, Sparkles, Sprout } from 'lucide-react';
import { MetricCard } from '../../components/DashboardShell';
import { IMG_OLIVE_GROVE, IMG_OASIS } from '../../lib/images';
import type { FarmerLiveData } from '../FarmerLayout';

const GREEN = '#2BA24C';
const CHARCOAL = '#0F1A13';
const MUTED = '#98A29A';
const CREAM = '#F7F5F0';

type LiveMetric = {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  tone: 'neutral' | 'up' | 'down' | 'warn';
};

function aqiLabel(aqi: number): { label: string; tone: 'up' | 'warn' | 'down' } {
  if (aqi <= 2) return { label: 'Air bon', tone: 'up' };
  if (aqi === 3) return { label: 'Air modéré', tone: 'warn' };
  return { label: 'Air dégradé', tone: 'down' };
}

export function FarmerOverview() {
  const { weather, pollution, loading } = useOutletContext<FarmerLiveData>();

  const metrics: LiveMetric[] = [
    {
      label: 'Température Chenini',
      value: weather ? String(weather.temp) : '—',
      unit: '°C',
      trend: weather ? `Ressenti ${weather.feelsLike}°C · ${weather.description}` : 'OpenWeatherMap',
      tone: 'neutral'
    },
    {
      label: 'Humidité',
      value: weather ? String(weather.humidity) : '—',
      unit: '%',
      trend: weather && weather.humidity < 35 ? 'Sec — risque hydrique' : 'Conditions normales',
      tone: weather && weather.humidity < 35 ? 'warn' : 'up'
    },
    {
      label: 'Vent moyen',
      value: weather ? String(weather.windSpeed) : '—',
      unit: 'km/h',
      trend: weather && weather.windSpeed >= 25 ? 'Fort — protégez cultures' : 'Vent calme',
      tone: weather && weather.windSpeed >= 25 ? 'warn' : 'up'
    },
    pollution
      ? {
          label: `Air · AQI ${pollution.aqi}/5`,
          value: pollution.so2.toFixed(0),
          unit: 'µg/m³ SO₂',
          trend: aqiLabel(pollution.aqi).label,
          tone: aqiLabel(pollution.aqi).tone
        }
      : {
          label: 'Qualité air',
          value: '—',
          unit: '',
          trend: 'OpenWeather indisponible',
          tone: 'neutral'
        }
  ];

  return (
    <div>
      {/* ============== HERO ============== */}
      <section
        className="relative w-full overflow-hidden"
        style={{ minHeight: 440 }}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={IMG_OLIVE_GROVE}
            alt=""
            aria-hidden
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.1) brightness(0.78)' }}
            onError={e => {
              if (e.currentTarget.src !== IMG_OASIS) e.currentTarget.src = IMG_OASIS;
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(15,26,19,0.35) 0%, rgba(15,26,19,0.5) 55%, rgba(15,26,19,0.85) 100%)'
            }}
          />
        </div>

        <div
          className="absolute select-none pointer-events-none z-0"
          style={{
            top: '50%',
            right: '-60px',
            transform: 'translateY(-50%)',
            fontFamily: 'var(--font-naskh, var(--font-display))',
            fontSize: 300,
            color: 'white',
            opacity: 0.05,
            lineHeight: 1,
            fontWeight: 700
          }}
        >
          فلاح
        </div>

        <div className="relative z-10 px-6 lg:px-12 pt-14 pb-16 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(12px)'
              }}
            >
              <Sprout size={13} style={{ color: GREEN }} />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: 'white',
                  letterSpacing: 2.5,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                Bonjour Hassen · Chenini Nahal
              </span>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(34px, 4.5vw, 56px)',
                fontWeight: 800,
                lineHeight: 1.02,
                color: 'white',
                letterSpacing: '-0.035em'
              }}
            >
              Votre oasis,{' '}
              <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 800 }}>
                protégée
              </span>{' '}
              et valorisée.
            </h1>
            <p
              className="mt-5 max-w-xl"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 15,
                lineHeight: 1.55
              }}
            >
              Météo et pollution OpenWeather en direct, diagnostic photo par ResNet-50, recommandations de plantation et prévisions de prix générées par GPT-4o.
            </p>
          </motion.div>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{ background: `linear-gradient(180deg, transparent 0%, ${CREAM} 100%)` }}
        />
      </section>

      {/* ============== METRICS ============== */}
      <section className="relative -mt-10 z-10 pb-10 px-6 lg:px-12">
        {loading && (
          <div
            className="mb-3 inline-flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: MUTED }}
          >
            <Loader2 size={12} className="animate-spin" />
            Chargement OpenWeather…
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <MetricCard {...m} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============== QUICK ACTIONS ============== */}
      <section className="pb-12 px-6 lg:px-12">
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            color: CHARCOAL,
            letterSpacing: '-0.02em',
            marginBottom: 16
          }}
        >
          Accès rapide
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickLink
            to="/dashboard/farmer/diagnostic"
            icon={Camera}
            title="Diagnostic photo"
            body="ResNet-50 · 38 maladies · traitement + prix en DT/ha."
            accent={GREEN}
          />
          <QuickLink
            to="/dashboard/farmer/conseil"
            icon={Sparkles}
            title="Conseil IA"
            body="Plantation et prix de marché calculés par GPT-4o."
            accent="#6A7BC7"
          />
        </div>
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
function QuickLink({
  to,
  icon: Icon,
  title,
  body,
  accent
}: {
  to: string;
  icon: any;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <a
      href={to}
      className="block p-5 rounded-2xl transition-transform hover:-translate-y-0.5"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(15,26,19,0.06)',
        boxShadow: '0 6px 20px rgba(15,26,19,0.04)'
      }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 700,
          color: CHARCOAL,
          letterSpacing: '-0.02em',
          marginBottom: 4
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          color: MUTED,
          lineHeight: 1.5
        }}
      >
        {body}
      </div>
    </a>
  );
}
