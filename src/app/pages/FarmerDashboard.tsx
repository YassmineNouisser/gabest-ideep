import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  MapPin,
  Sprout,
  Wind
} from 'lucide-react';
import { motion } from 'motion/react';
import { IMG_OLIVE_GROVE, IMG_MATMATA_PALM, IMG_OASIS } from '../lib/images';
import { StickyPillNav, SectionHeader, MetricCard, GreenPillButton } from '../components/DashboardShell';
import { BioMatchFlow } from '../components/BioMatchFlow';
import { CropAdvisorPanel } from '../components/CropAdvisorPanel';
import { CropDiagFlow } from '../components/CropDiagFlow';
import {
  fetchDailyForecast,
  fetchPollution,
  fetchWeather,
  type DailyForecast,
  type Pollution,
  type Weather
} from '../lib/ai';

const GREEN = '#2BA24C';
const CHARCOAL = '#0F1A13';
const MUTED = '#98A29A';
const CREAM = '#F7F5F0';
const GOLD = '#E0A23A';
const RED = '#D24C4C';

type LiveMetric = {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  tone: 'neutral' | 'up' | 'down' | 'warn';
};

type LiveAlert = {
  title: string;
  severity: 'Haute' | 'Moyenne' | 'Faible';
  source: string;
  action: string;
  tone: string;
};

function aqiLabel(aqi: number): { label: string; tone: 'up' | 'warn' | 'down' } {
  if (aqi <= 2) return { label: 'Air bon', tone: 'up' };
  if (aqi === 3) return { label: 'Air modéré', tone: 'warn' };
  return { label: 'Air dégradé', tone: 'down' };
}

function buildAlerts(
  pollution: Pollution | null,
  forecast: DailyForecast[]
): LiveAlert[] {
  const alerts: LiveAlert[] = [];

  if (pollution) {
    if (pollution.so2 >= 50) {
      alerts.push({
        title: `SO₂ élevé à Chenini (${pollution.so2} µg/m³)`,
        severity: pollution.so2 >= 100 ? 'Haute' : 'Moyenne',
        source: 'OpenWeatherMap · air pollution',
        action:
          'Reportez les pulvérisations foliaires · récoltez avant 11 h les fruits sensibles (grenades, piments).',
        tone: pollution.so2 >= 100 ? RED : GOLD
      });
    } else if (pollution.aqi >= 3) {
      alerts.push({
        title: `Qualité air dégradée (AQI ${pollution.aqi}/5)`,
        severity: 'Moyenne',
        source: 'OpenWeatherMap · AQI',
        action:
          'Surveillez les feuilles brûlées sur grenadiers · décalez la cueillette en fin de journée.',
        tone: GOLD
      });
    }
  }

  const windyDay = forecast.find(d => d.windAvg >= 25);
  if (windyDay) {
    alerts.push({
      title: `Vent fort prévu ${windyDay.dayShort} ${windyDay.date} (${windyDay.windAvg} km/h)`,
      severity: windyDay.windAvg >= 35 ? 'Haute' : 'Moyenne',
      source: 'OpenWeatherMap · forecast 5j',
      action:
        'Évitez les traitements aériens ce jour-là · protégez les jeunes pousses et reportez la mise en terre.',
      tone: GOLD
    });
  }

  const dryStreak = forecast.slice(0, 5).every(d => d.rainTotal < 0.5);
  const hot = forecast.slice(0, 5).some(d => d.tempMax >= 32);
  if (dryStreak && hot) {
    alerts.push({
      title: 'Stress hydrique probable cette semaine',
      severity: 'Moyenne',
      source: 'OpenWeatherMap · 5 jours sans pluie + pic chaleur',
      action:
        'Renforcez l\'irrigation goutte-à-goutte tôt le matin · paillez les jeunes plants pour limiter l\'évaporation.',
      tone: GOLD
    });
  }

  if (alerts.length === 0 && pollution) {
    alerts.push({
      title: 'Conditions agronomiques stables',
      severity: 'Faible',
      source: 'OpenWeatherMap · pollution + météo Chenini',
      action:
        'Aucun pic détecté sur 5 jours. Profitez de la fenêtre pour planifier semis, traitements et récoltes prioritaires.',
      tone: GREEN
    });
  }

  return alerts.slice(0, 2);
}

export function FarmerDashboard() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [pollution, setPollution] = useState<Pollution | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [w, p, f] = await Promise.all([
        fetchWeather('Chenini'),
        fetchPollution('Chenini'),
        fetchDailyForecast('Chenini')
      ]);
      if (cancelled) return;
      setWeather(w);
      setPollution(p);
      setForecast(f);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const alerts = buildAlerts(pollution, forecast);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: CREAM, color: CHARCOAL, fontFamily: 'var(--font-display)' }}
    >
      <StickyPillNav variant="light" />

      {/* ============== HERO ============== */}
      <section
        className="relative w-full overflow-hidden"
        style={{ minHeight: 560, paddingTop: 120 }}
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
                'linear-gradient(180deg, rgba(15,26,19,0.35) 0%, rgba(15,26,19,0.55) 55%, rgba(15,26,19,0.88) 100%)'
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
            fontSize: 360,
            color: 'white',
            opacity: 0.05,
            lineHeight: 1,
            fontWeight: 700
          }}
        >
          فلاح
        </div>

        <div className="relative z-10 container mx-auto px-6 lg:px-12 pt-10 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
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
                Espace agriculteur · Chenini Nahal
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 5.5vw, 72px)',
                fontWeight: 800,
                lineHeight: 1.02,
                color: 'white',
                letterSpacing: '-0.035em'
              }}
            >
              Votre oasis,{' '}
              <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 800 }}>
                protégée
              </span>
              <br />
              et valorisée.
            </h1>

            <p
              className="mt-6 max-w-xl"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 16,
                lineHeight: 1.6
              }}
            >
              Météo et pollution OpenWeather en direct, recommandations de plantation et prévisions de prix générées par GPT-4o pour vos parcelles.
            </p>

            <div className="mt-10 flex items-center gap-4 flex-wrap">
              <GreenPillButton>Photographier une plante</GreenPillButton>
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(12px)'
                }}
              >
                <MapPin size={14} style={{ color: 'white' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    color: 'white',
                    fontWeight: 500
                  }}
                >
                  Données live · Gabès · OpenWeather
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${CREAM} 100%)`
          }}
        />
      </section>

      {/* ============== METRICS LIVE (OpenWeather) ============== */}
      <section className="relative -mt-12 z-10 pb-20">
        <div className="container mx-auto px-6 lg:px-12">
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
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <MetricCard {...m} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== ALERTS dérivées de la météo réelle ============== */}
      <section className="pb-24" style={{ backgroundColor: CREAM }}>
        <div className="container mx-auto px-6 lg:px-12">
          <SectionHeader
            overline="Module AirLink · alertes dérivées d'OpenWeather"
            title="Protégez votre récolte"
            accent="avant que le polluant ou le vent n'arrive."
          />

          {alerts.length === 0 ? (
            <div
              className="p-8 rounded-3xl text-center"
              style={{
                backgroundColor: 'white',
                border: '1px dashed rgba(15,26,19,0.12)',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                color: MUTED
              }}
            >
              {loading ? 'Calcul des alertes en cours…' : 'Aucune alerte exploitable pour le moment.'}
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              {alerts.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-7 rounded-3xl relative overflow-hidden"
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid rgba(15,26,19,0.06)',
                    boxShadow: '0 10px 40px rgba(15,26,19,0.05)'
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: a.tone }}
                  />
                  <div className="flex items-start justify-between mb-5 gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${a.tone}18` }}
                    >
                      <AlertCircle size={20} style={{ color: a.tone }} />
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: `${a.tone}18`,
                        color: a.tone,
                        fontFamily: 'var(--font-display)',
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase'
                      }}
                    >
                      Sévérité {a.severity}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      fontWeight: 700,
                      color: CHARCOAL,
                      letterSpacing: '-0.025em',
                      lineHeight: 1.2,
                      marginBottom: 8
                    }}
                  >
                    {a.title}
                  </h3>
                  <div
                    className="mb-4"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 12,
                      color: MUTED,
                      letterSpacing: 0.3
                    }}
                  >
                    {a.source}
                  </div>
                  <div
                    className="p-4 rounded-2xl"
                    style={{ backgroundColor: CREAM, border: '1px solid rgba(15,26,19,0.05)' }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 11,
                        color: GREEN,
                        letterSpacing: 2,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        marginBottom: 6
                      }}
                    >
                      Action conseillée
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 14,
                        color: CHARCOAL,
                        lineHeight: 1.5,
                        fontWeight: 500
                      }}
                    >
                      {a.action}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============== CROPADVISOR · plantation + prix par IA ============== */}
      <CropAdvisorPanel />

      {/* ============== CROPDIAG · GabesHeal F2 / ResNet-50 ============== */}
      <CropDiagFlow />

      {/* ============== BIOMATCH INTERACTIF ============== */}
      <BioMatchFlow />

      {/* ============== GYPSIFERT ============== */}
      <section className="py-24" style={{ backgroundColor: CREAM }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-6 rounded-3xl overflow-hidden"
              style={{ aspectRatio: '4/5' }}
            >
              <img src={IMG_MATMATA_PALM} alt="" className="w-full h-full object-cover" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-6"
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: GREEN,
                  letterSpacing: 2.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 14
                }}
              >
                Module GypsiFert · amendement sol
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(30px, 3.5vw, 48px)',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  color: CHARCOAL,
                  letterSpacing: '-0.03em'
                }}
              >
                Phosphogypse traité :{' '}
                <span style={{ color: MUTED }}>
                  calcium et soufre pour vos parcelles.
                </span>
              </h2>

              <p
                className="mt-6 max-w-xl"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  color: '#3F4B43',
                  lineHeight: 1.6
                }}
              >
                Demandez une livraison de phosphogypse purifié issu des lignes GCT pour amender vos sols salins. Le dosage exact sera calculé par un agronome partenaire à partir d'une analyse de sol que vous fournissez (pH, CaSO₄, conductivité).
              </p>

              <div
                className="mt-6 p-5 rounded-2xl flex items-start gap-3"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid rgba(15,26,19,0.06)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 13.5,
                  color: CHARCOAL,
                  lineHeight: 1.5
                }}
              >
                <Wind size={16} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>Conditions actuelles à Chenini :</strong>{' '}
                  {weather
                    ? `${weather.temp}°C · humidité ${weather.humidity}% · vent ${weather.windSpeed} km/h. ${weather.windSpeed >= 25 ? 'Reportez l\'épandage : risque de dérive.' : 'Fenêtre d\'épandage favorable cette semaine.'}`
                    : 'données OpenWeather en cours de chargement.'}
                </span>
              </div>

              <div className="mt-8">
                <GreenPillButton>Demander une livraison</GreenPillButton>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
