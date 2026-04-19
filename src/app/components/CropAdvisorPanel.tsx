import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  Cloud,
  Database,
  Droplets,
  Globe,
  Leaf,
  LineChart,
  Loader2,
  MapPin,
  Minus,
  Newspaper,
  RefreshCw,
  Sparkles,
  Sprout,
  Thermometer,
  TrendingUp,
  Wind
} from 'lucide-react';
import { SectionHeader } from './DashboardShell';
import { AIProcessingOverlay } from './AIProcessingOverlay';
import {
  FARMER_ZONES,
  fetchDailyForecast,
  fetchMarketPrices,
  fetchPollution,
  fetchWeather,
  generatePlantationAdvice,
  generatePriceForecast,
  type DailyForecast,
  type PlantationPayload,
  type Pollution,
  type PriceForecastPayload,
  type Weather,
  type ZoneName
} from '../lib/ai';

const GREEN = '#2BA24C';
const GREEN_DARK = '#1E7A38';
const GREEN_SOFT = '#E6F4EA';
const CHARCOAL = '#0F1A13';
const MUTED = '#98A29A';
const CREAM = '#F7F5F0';
const BORDER = 'rgba(15,26,19,0.08)';
const RED_SOFT = '#FCE8E6';
const RED = '#B3261E';
const GOLD_SOFT = '#FEF3DC';
const GOLD = '#C8973A';

function trendBadge(trend: 'up' | 'down' | 'stable', changePct: number) {
  if (trend === 'up') {
    return {
      bg: GREEN_SOFT,
      color: GREEN_DARK,
      icon: <ArrowUpRight size={12} strokeWidth={2.4} />,
      label: `+${Math.abs(changePct)} %`
    };
  }
  if (trend === 'down') {
    return {
      bg: RED_SOFT,
      color: RED,
      icon: <ArrowDownRight size={12} strokeWidth={2.4} />,
      label: `−${Math.abs(changePct)} %`
    };
  }
  return {
    bg: '#EDEEEA',
    color: '#5A5A5E',
    icon: <Minus size={12} strokeWidth={2.4} />,
    label: 'stable'
  };
}

function suitabilityTone(score: number): { color: string; bg: string; label: string } {
  if (score >= 80) return { color: GREEN_DARK, bg: GREEN_SOFT, label: 'Très favorable' };
  if (score >= 60) return { color: '#9A6B10', bg: GOLD_SOFT, label: 'Favorable' };
  return { color: RED, bg: RED_SOFT, label: 'Risqué' };
}

export function CropAdvisorPanel() {
  const [zone, setZone] = useState<ZoneName>('Chenini');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [pollution, setPollution] = useState<Pollution | null>(null);
  const [plant, setPlant] = useState<PlantationPayload | null>(null);
  const [prices, setPrices] = useState<PriceForecastPayload | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const loadWeather = async (z: ZoneName) => {
    setWeatherLoading(true);
    try {
      const [w, f, p] = await Promise.all([
        fetchWeather(z),
        fetchDailyForecast(z),
        fetchPollution(z)
      ]);
      setWeather(w);
      setForecast(f);
      setPollution(p);
    } finally {
      setWeatherLoading(false);
    }
  };

  const runAI = async (z: ZoneName, w: Weather | null, f: DailyForecast[], p: Pollution | null) => {
    if (!w || f.length === 0) {
      setAiError('Données météo indisponibles pour cette zone.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const market = await fetchMarketPrices();
      const [plantation, priceFc] = await Promise.all([
        generatePlantationAdvice(z, w, f, p),
        generatePriceForecast(z, w, f, p, market)
      ]);
      setPlant(plantation);
      setPrices(priceFc);
      if (!plantation && !priceFc) {
        setAiError("Impossible d'obtenir une réponse de l'IA. Réessayez dans un instant.");
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Erreur IA inconnue.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setWeatherLoading(true);
      const [w, f, p] = await Promise.all([
        fetchWeather(zone),
        fetchDailyForecast(zone),
        fetchPollution(zone)
      ]);
      if (cancelled) return;
      setWeather(w);
      setForecast(f);
      setPollution(p);
      setWeatherLoading(false);
      setPlant(null);
      setPrices(null);
      setAiError(null);
      runAI(zone, w, f, p);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone]);

  const refresh = () => {
    setPlant(null);
    setPrices(null);
    runAI(zone, weather, forecast, pollution);
  };

  return (
    <section className="py-24" style={{ backgroundColor: 'white' }}>
      <div className="container mx-auto px-6 lg:px-12">
        <SectionHeader
          overline="Module CropAdvisor · OpenAI + OpenWeather"
          title="Plantation & prix"
          accent="recommandés en temps réel par l'IA."
        />

        {/* ============ ZONE BAR + WEATHER STRIP ============ */}
        <div
          className="p-5 rounded-3xl mb-6 flex flex-wrap items-center gap-4"
          style={{
            backgroundColor: CREAM,
            border: `1px solid ${BORDER}`
          }}
        >
          <div className="flex items-center gap-2">
            <MapPin size={16} style={{ color: GREEN }} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11.5,
                color: MUTED,
                letterSpacing: 1.6,
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              Zone agricole
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FARMER_ZONES.map(z => {
              const active = z === zone;
              return (
                <button
                  key={z}
                  onClick={() => setZone(z)}
                  className="px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    backgroundColor: active ? GREEN : 'white',
                    color: active ? 'white' : CHARCOAL,
                    border: active ? 'none' : `1px solid ${BORDER}`,
                    fontFamily: 'var(--font-display)',
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 500
                  }}
                >
                  {z}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={aiLoading || !weather}
              className="inline-flex items-center gap-2 px-3.5 h-9 rounded-full transition-colors"
              style={{
                backgroundColor: aiLoading ? '#E2E5E0' : GREEN,
                color: 'white',
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                fontWeight: 600,
                opacity: !weather ? 0.5 : 1
              }}
            >
              {aiLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <RefreshCw size={13} />
              )}
              {aiLoading ? 'Analyse IA…' : 'Relancer l\'IA'}
            </button>
          </div>
        </div>

        {/* ============ WEATHER NOW + 5J ============ */}
        <div className="grid lg:grid-cols-12 gap-4 mb-6">
          {/* NOW */}
          <div
            className="lg:col-span-5 p-5 rounded-3xl"
            style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: GREEN,
                  letterSpacing: 2,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                Temps réel · {zone}
              </span>
              {weatherLoading && <Loader2 size={14} className="animate-spin" style={{ color: MUTED }} />}
            </div>
            {weather ? (
              <div className="grid grid-cols-4 gap-3">
                <WeatherStat icon={Thermometer} label="Temp" value={`${weather.temp}°C`} />
                <WeatherStat icon={Droplets} label="Humidité" value={`${weather.humidity}%`} />
                <WeatherStat icon={Wind} label="Vent" value={`${weather.windSpeed} km/h`} />
                <WeatherStat
                  icon={Activity}
                  label="AQI"
                  value={pollution ? `${pollution.aqi}/5` : '—'}
                  tone={pollution && pollution.aqi >= 4 ? 'risk' : pollution && pollution.aqi === 3 ? 'warn' : 'good'}
                />
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: MUTED }}>
                Chargement OpenWeather…
              </div>
            )}
            {weather && (
              <div
                className="mt-3"
                style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, color: '#5A5A5E' }}
              >
                {weather.description.charAt(0).toUpperCase() + weather.description.slice(1)} · ressenti {weather.feelsLike}°C
              </div>
            )}
          </div>

          {/* 5J */}
          <div
            className="lg:col-span-7 p-5 rounded-3xl"
            style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
          >
            <div
              className="mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                color: GREEN,
                letterSpacing: 2,
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              Prévision 5 jours
            </div>
            {forecast.length > 0 ? (
              <div className="grid grid-cols-5 gap-2">
                {forecast.slice(0, 5).map(d => (
                  <div
                    key={d.dt}
                    className="p-3 rounded-2xl text-center"
                    style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 11,
                        color: MUTED,
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}
                    >
                      {d.dayShort} {d.date}
                    </div>
                    <Cloud size={20} style={{ color: GREEN_DARK, margin: '6px auto 4px' }} />
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 13,
                        color: CHARCOAL,
                        fontWeight: 700
                      }}
                    >
                      {d.tempMax}°/{d.tempMin}°
                    </div>
                    <div
                      className="mt-1"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 11,
                        color: MUTED
                      }}
                    >
                      {d.windAvg} km/h
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: MUTED }}>
                Chargement prévision…
              </div>
            )}
          </div>
        </div>

        {/* ============ ERROR / LOADING ============ */}
        <AnimatePresence>
          {aiError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-2xl flex items-start gap-3"
              style={{ backgroundColor: RED_SOFT, border: `1px solid ${RED}33` }}
            >
              <AlertTriangle size={16} style={{ color: RED, flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: RED }}>
                {aiError}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============ PLANTATION RECOS ============ */}
        <div
          className="p-6 lg:p-8 rounded-3xl mb-6"
          style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <div
                className="flex items-center gap-2 mb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: GREEN,
                  letterSpacing: 2,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                <Sprout size={13} />
                <span>Recommandations de plantation</span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 700,
                  color: CHARCOAL,
                  letterSpacing: '-0.02em',
                  maxWidth: 720
                }}
              >
                {plant?.headline ?? (aiLoading ? 'L\'IA analyse vos conditions…' : 'En attente d\'analyse')}
              </h3>
              {plant?.contextSummary && (
                <p
                  className="mt-2 max-w-2xl"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13.5,
                    color: '#5A5A5E',
                    lineHeight: 1.55
                  }}
                >
                  {plant.contextSummary}
                </p>
              )}
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: GREEN_SOFT,
                color: GREEN_DARK,
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                fontWeight: 700
              }}
            >
              <Brain size={11} />
              GPT-4o · OpenWeather
            </span>
          </div>

          {aiLoading && !plant ? (
            <AIProcessingOverlay
              overline="CropAdvisor · GPT-4o"
              title="L'IA analyse votre zone…"
              variant="light"
              accent={GREEN}
              subtitle={
                <>
                  Le modèle croise la météo temps réel <strong style={{ color: CHARCOAL }}>OpenWeather</strong>,
                  l'indice pollution de votre zone et le calendrier agricole de Gabès pour
                  vous proposer les cultures les plus rentables.
                </>
              }
              steps={[
                { icon: Globe,    title: 'Connexion OpenWeather + OpenAQ', sub: 'Météo · 5 jours · pollution NO₂/SO₂/PM2.5' },
                { icon: Database, title: 'Contexte agronomique Gabès',     sub: 'Calendrier saisonnier · 11 cultures locales' },
                { icon: Brain,    title: 'Raisonnement GPT-4o',            sub: 'Scoring d\'aptitude · fenêtre d\'action' },
                { icon: Sprout,   title: 'Synthèse recommandations',       sub: 'Top 3 cultures · risques · actions concrètes' }
              ]}
              durationMs={2400}
            />
          ) : plant && plant.recommendations.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {plant.recommendations.map((r, i) => {
                const tone = suitabilityTone(r.suitability);
                return (
                  <motion.div
                    key={r.crop + i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-5 rounded-2xl flex flex-col"
                    style={{
                      backgroundColor: CREAM,
                      border: `1px solid ${BORDER}`
                    }}
                  >
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: GREEN_SOFT }}
                      >
                        <Leaf size={18} style={{ color: GREEN }} />
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: tone.bg,
                          color: tone.color,
                          fontFamily: 'var(--font-display)',
                          fontSize: 10.5,
                          fontWeight: 700,
                          letterSpacing: 1.2,
                          textTransform: 'uppercase'
                        }}
                      >
                        {tone.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <h4
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 18,
                          fontWeight: 800,
                          color: CHARCOAL,
                          letterSpacing: '-0.02em'
                        }}
                      >
                        {r.crop}
                      </h4>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 13,
                          color: MUTED,
                          fontWeight: 700
                        }}
                      >
                        {r.suitability}/100
                      </span>
                    </div>
                    <p
                      className="mt-2"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 13,
                        color: '#3F4B43',
                        lineHeight: 1.55
                      }}
                    >
                      {r.rationale}
                    </p>
                    <div
                      className="mt-4 p-3 rounded-xl"
                      style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 10.5,
                          color: GREEN,
                          letterSpacing: 1.6,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          marginBottom: 4
                        }}
                      >
                        Action
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 13.5,
                          color: CHARCOAL,
                          fontWeight: 600
                        }}
                      >
                        {r.windowAction}
                      </div>
                    </div>
                    <div
                      className="mt-3 flex items-start gap-2"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 12,
                        color: '#5A5A5E',
                        lineHeight: 1.5
                      }}
                    >
                      <AlertTriangle size={12} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
                      <span>{r.risks}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              text="Sélectionnez une zone pour lancer l'analyse IA basée sur la météo et la pollution réelles."
            />
          )}
        </div>

        {/* ============ PRICE FORECAST ============ */}
        <div
          className="p-6 lg:p-8 rounded-3xl"
          style={{ backgroundColor: CHARCOAL, color: 'white', position: 'relative', overflow: 'hidden' }}
        >
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${GREEN}55, transparent 70%)`,
              filter: 'blur(60px)',
              transform: 'translate(30%, -30%)'
            }}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <div
                  className="flex items-center gap-2 mb-2"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    color: GREEN,
                    letterSpacing: 2,
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  <TrendingUp size={13} />
                  <span>Prévision prix · horizon par culture</span>
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'white',
                    letterSpacing: '-0.02em',
                    maxWidth: 720
                  }}
                >
                  {prices?.headline ?? (aiLoading ? 'L\'IA croise météo + marché…' : 'En attente d\'analyse marché')}
                </h3>
                {prices?.marketSource && (
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 12.5,
                      color: 'rgba(255,255,255,0.55)'
                    }}
                  >
                    Source de prix marché : {prices.marketSource}
                  </p>
                )}
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  fontWeight: 700,
                  border: '1px solid rgba(255,255,255,0.14)'
                }}
              >
                <Sparkles size={11} />
                Web search · OpenAI
              </span>
            </div>

            {aiLoading && !prices ? (
              <AIProcessingOverlay
                overline="PriceAdvisor · Web search + GPT-4o"
                title="Croisement météo + marché…"
                variant="dark"
                accent={GREEN}
                subtitle={
                  <>
                    L'IA interroge les sources de prix marchés{' '}
                    <strong style={{ color: 'white' }}>(SNE, ONAGRI, Maghreb Emergent)</strong>, croise
                    la tendance climatique et projette un prix à 4 semaines par culture.
                  </>
                }
                steps={[
                  { icon: Newspaper, title: 'Web search · sources marché',   sub: 'SNE · ONAGRI · prix DT/kg par culture' },
                  { icon: LineChart, title: 'Séries historiques 12 mois',    sub: 'Détection saisonnalité + élasticité météo' },
                  { icon: BarChart3, title: 'Projection 4 semaines',         sub: 'Scénarios haussier / stable / baissier' },
                  { icon: Sparkles,  title: 'Synthèse recommandations',      sub: 'Quoi vendre · quoi stocker · quoi planter' }
                ]}
                durationMs={2400}
              />
            ) : prices && prices.forecasts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {prices.forecasts.map((f, i) => {
                  const tb = trendBadge(f.trend, f.forecastChangePct);
                  return (
                    <motion.div
                      key={f.crop + i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="p-4 rounded-2xl"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(14px)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 13.5,
                            fontWeight: 700,
                            color: 'white'
                          }}
                        >
                          {f.crop}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: tb.bg,
                            color: tb.color,
                            fontFamily: 'var(--font-display)',
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          {tb.icon}
                          {tb.label}
                        </span>
                      </div>
                      <div
                        className="mb-3"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 10.5,
                          color: 'rgba(255,255,255,0.55)',
                          fontWeight: 600,
                          letterSpacing: 0.6,
                          textTransform: 'uppercase'
                        }}
                      >
                        sur {f.horizonLabel ?? `${f.horizonDays ?? 30} jours`}
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 28,
                            fontWeight: 800,
                            color: 'white',
                            letterSpacing: '-0.03em',
                            lineHeight: 1
                          }}
                        >
                          {f.currentPrice.toFixed(2)}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.55)'
                          }}
                        >
                          DT/kg
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.7)',
                          lineHeight: 1.5,
                          marginBottom: 8
                        }}
                      >
                        {f.drivers}
                      </p>
                      <div
                        className="p-2.5 rounded-lg"
                        style={{ backgroundColor: 'rgba(43,162,76,0.12)', border: `1px solid ${GREEN}40` }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 12.5,
                            color: 'white',
                            fontWeight: 600,
                            lineHeight: 1.4
                          }}
                        >
                          {f.windowAdvice}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <EmptyState dark text="Lancez l'analyse pour obtenir une prévision de prix par culture." />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function WeatherStat({
  icon: Icon,
  label,
  value,
  tone = 'good'
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'risk';
}) {
  const color = tone === 'risk' ? RED : tone === 'warn' ? GOLD : GREEN_DARK;
  return (
    <div className="flex flex-col items-start gap-1">
      <Icon size={16} style={{ color }} />
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10.5,
          color: MUTED,
          fontWeight: 600,
          letterSpacing: 1.2,
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          color: CHARCOAL,
          fontWeight: 800,
          letterSpacing: '-0.02em'
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SkeletonGrid({ count, dark = false }: { count: number; dark?: boolean }) {
  return (
    <div className={`grid ${count === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl animate-pulse"
          style={{
            backgroundColor: dark ? 'rgba(255,255,255,0.05)' : CREAM,
            border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : BORDER}`,
            minHeight: 200
          }}
        >
          <div
            className="h-3 rounded mb-3"
            style={{ width: '40%', backgroundColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,26,19,0.08)' }}
          />
          <div
            className="h-6 rounded mb-2"
            style={{ width: '70%', backgroundColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,26,19,0.08)' }}
          />
          <div
            className="h-3 rounded mb-1"
            style={{ width: '90%', backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,26,19,0.06)' }}
          />
          <div
            className="h-3 rounded"
            style={{ width: '60%', backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,26,19,0.06)' }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <div
      className="p-8 rounded-2xl text-center"
      style={{
        backgroundColor: dark ? 'rgba(255,255,255,0.04)' : CREAM,
        border: `1px dashed ${dark ? 'rgba(255,255,255,0.18)' : BORDER}`
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13.5,
          color: dark ? 'rgba(255,255,255,0.7)' : '#5A5A5E',
          maxWidth: 480,
          margin: '0 auto'
        }}
      >
        {text}
      </div>
    </div>
  );
}
