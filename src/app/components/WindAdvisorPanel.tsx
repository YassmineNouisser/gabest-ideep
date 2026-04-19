import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Coins,
  Compass,
  Database,
  Droplets,
  ExternalLink,
  Factory,
  FileBarChart,
  Gauge,
  Info,
  Leaf,
  Loader2,
  MapPin,
  Minus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Thermometer,
  TrendingUp,
  Wind
} from 'lucide-react';
import { SectionHeader } from './DashboardShell';
import {
  fetchMonthlyReport,
  fetchWindFactories,
  formatDT,
  predictWind,
  type MonthlyReport,
  type WindFactory,
  type WindPrediction,
  type WindRisk
} from '../lib/windshield';
import { AIProcessingOverlay } from './AIProcessingOverlay';

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

const FALLBACK_FACTORIES: WindFactory[] = [
  { id: 'gct',  name: 'GCT - Groupe Chimique Tunisien', lat: 33.8820, lon: 10.0980, type: 'phosphate' },
  { id: 'cpg',  name: 'CPG - Compagnie des Phosphates', lat: 33.8800, lon: 10.1000, type: 'phosphate' },
  { id: 'steg', name: 'STEG - Centrale Thermique',      lat: 33.8750, lon: 10.1050, type: 'energie'   },
  { id: 'port', name: 'Port Industriel de Gabès',       lat: 33.8680, lon: 10.1120, type: 'port'      }
];

function riskTone(r: WindRisk) {
  if (r === 'high')   return { bg: RED_SOFT,   color: RED,       label: 'Risque élevé',   icon: ShieldAlert };
  if (r === 'medium') return { bg: GOLD_SOFT,  color: '#9A6B10', label: 'Risque modéré',  icon: AlertTriangle };
  return                     { bg: GREEN_SOFT, color: GREEN_DARK, label: 'Risque faible',  icon: ShieldCheck };
}

function actionTone(a: 'boost' | 'reduce' | 'hold') {
  if (a === 'boost')  return { bg: GREEN_SOFT, color: GREEN_DARK, icon: ArrowUpRight, label: 'Augmenter la production' };
  if (a === 'reduce') return { bg: RED_SOFT,   color: RED,        icon: ArrowDownRight, label: 'Réduire la production' };
  return                     { bg: '#EDEEEA',  color: '#5A5A5E',  icon: Minus,         label: 'Maintenir le régime' };
}

function windIcon(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}

export function WindAdvisorPanel() {
  const [factories, setFactories] = useState<WindFactory[]>(FALLBACK_FACTORIES);
  const [selected, setSelected] = useState<WindFactory>(FALLBACK_FACTORIES[0]);
  const [production, setProduction] = useState<number>(85);

  const [prediction, setPrediction] = useState<WindPrediction | null>(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState<string | null>(null);

  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    fetchWindFactories()
      .then(list => { if (list.length) { setFactories(list); setSelected(list[0]); } })
      .catch(() => {});
  }, []);

  const runPrediction = async () => {
    setPredLoading(true);
    setPredError(null);
    try {
      const p = await predictWind({ lat: selected.lat, lon: selected.lon, name: selected.name }, production);
      setPrediction(p);
    } catch (e) {
      setPredError(e instanceof Error ? e.message : 'Prédiction indisponible');
    } finally {
      setPredLoading(false);
    }
  };

  const runReport = async () => {
    setReportLoading(true);
    setReportError(null);
    try {
      const r = await fetchMonthlyReport({ lat: selected.lat, lon: selected.lon, name: selected.name }, production, 30);
      setReport(r);
    } catch (e) {
      setReportError(e instanceof Error ? e.message : 'Bilan indisponible');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    runPrediction();
    runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.id]);

  const breakdownRows = useMemo(() => {
    if (!report) return [];
    const b = report.breakdown;
    return [
      { label: 'Amendes évitées (espérance ANPE)', value: b.avoided_fines_dt, positive: true,  icon: ShieldCheck },
      { label: 'Santé publique préservée',         value: b.health_savings_dt, positive: true,  icon: Leaf },
      { label: 'Crédits carbone générés',          value: b.carbon_credits_dt, positive: true,  icon: Sparkles },
      { label: 'Boost production (vent favorable)', value: b.boost_revenue_dt, positive: true, icon: ArrowUpRight },
      { label: 'Licence plateforme AirShield',     value: -(b.platform_licence_dt ?? 0), positive: false, icon: Coins },
      { label: 'Filtres anti-pollution (mensuel)', value: -b.product_cost_dt,  positive: false, icon: Coins },
      { label: 'Revenu réduit (jours high urbain)', value: -b.reduced_revenue_dt, positive: false, icon: ArrowDownRight }
    ];
  }, [report]);

  return (
    <section className="space-y-6">
      <SectionHeader
        overline="Module AirShield · ML vent / pollution"
        title="Recommandation de production"
        accent="selon la direction du vent"
      />

      {/* Bar: factory selector + production slider */}
      <div
        className="p-5 rounded-3xl flex flex-wrap items-center gap-4"
        style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {factories.map(f => {
            const active = f.id === selected.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelected(f)}
                className="inline-flex items-center gap-2 px-3.5 h-10 rounded-full transition-all"
                style={{
                  backgroundColor: active ? CHARCOAL : CREAM,
                  color: active ? 'white' : CHARCOAL,
                  border: `1px solid ${active ? CHARCOAL : BORDER}`,
                  fontFamily: 'var(--font-display)',
                  fontSize: 12.5,
                  fontWeight: 600
                }}
              >
                <Factory size={13} />
                {f.name.split(' - ')[0]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span style={{ fontSize: 12.5, color: MUTED, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            Production cible
          </span>
          <input
            type="range"
            min={40}
            max={100}
            step={5}
            value={production}
            onChange={e => setProduction(Number(e.target.value))}
            className="w-48 accent-emerald-600"
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 800,
              color: CHARCOAL,
              minWidth: 52,
              textAlign: 'right'
            }}
          >
            {production} %
          </span>
          <button
            onClick={() => { runPrediction(); runReport(); }}
            className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-full"
            style={{
              backgroundColor: GREEN,
              color: 'white',
              fontFamily: 'var(--font-display)',
              fontSize: 12.5,
              fontWeight: 700
            }}
          >
            <RefreshCw size={13} />
            Recalculer
          </button>
        </div>
      </div>

      {/* Live prediction card */}
      <div
        className="rounded-3xl overflow-hidden relative"
        style={{ backgroundColor: CHARCOAL, border: `1px solid rgba(255,255,255,0.06)`, color: 'white' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 85% 15%, ${GREEN}55, transparent 60%)`,
            filter: 'blur(40px)'
          }}
        />
        <div className="relative p-7">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Compass size={14} color={GREEN} />
              <span style={{ fontSize: 11, letterSpacing: 2.2, fontWeight: 700, color: GREEN, textTransform: 'uppercase' }}>
                Prédiction temps réel · {prediction?.model_used ?? '...'}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>
              {prediction?.timestamp
                ? new Date(prediction.timestamp).toLocaleString('fr-FR')
                : '—'}
            </div>
          </div>

          {predLoading && (
            <AIProcessingOverlay
              overline="AirShield IA · Random Forest"
              title="Lecture du vent + modèle ML…"
              variant="dark"
              accent={GREEN}
              subtitle={
                <>
                  Le module lit la météo temps réel, croise la direction du vent avec
                  la carte des zones peuplées, puis décide s'il faut{' '}
                  <strong style={{ color: 'white' }}>booster, réduire ou maintenir</strong>{' '}
                  votre production.
                </>
              }
              steps={[
                { icon: Wind,        title: 'Lecture vent temps réel',         sub: 'Open-Meteo · direction · vitesse · rafales' },
                { icon: MapPin,      title: 'Cartographie panache + receptors', sub: 'Zones urbaines exposées dans 20 km' },
                { icon: Sparkles,    title: 'Prédiction Random Forest',         sub: 'Risque pollution · 0–100 · 300 arbres' },
                { icon: Gauge,       title: 'Recommandation production',        sub: 'Booster · réduire · maintenir · gain €' }
              ]}
              durationMs={2200}
            />
          )}
          {predError && !predLoading && (
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: 'rgba(179,38,30,0.18)', color: '#FCA5A5', fontSize: 12.5 }}
            >
              {predError}
            </div>
          )}

          {prediction && !predLoading && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Wind summary */}
              <div className="lg:col-span-5 space-y-5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center relative"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <Wind size={30} color={GREEN} />
                    <div
                      className="absolute"
                      style={{
                        top: -10,
                        left: '50%',
                        transform: `translateX(-50%) rotate(${prediction.wind_deg}deg)`,
                        transformOrigin: 'center 46px',
                        fontSize: 18,
                        color: GREEN
                      }}
                    >
                      ↑
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {prediction.wind_speed.toFixed(1)} <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>m/s</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                      {windIcon(prediction.wind_deg)} · {prediction.wind_deg.toFixed(0)}°
                    </div>
                    <div style={{ fontSize: 13, color: GREEN, fontWeight: 700, marginTop: 4 }}>
                      {prediction.wind_text}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Température', value: `${prediction.temperature.toFixed(0)}°`, icon: Thermometer },
                    { label: 'Humidité',    value: `${prediction.humidity.toFixed(0)}%`,   icon: Droplets },
                    { label: 'Poussière',   value: prediction.dust_level.toFixed(0),        icon: Cloud }
                  ].map(c => {
                    const Icon = c.icon;
                    return (
                      <div
                        key={c.label}
                        className="p-3 rounded-2xl"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <Icon size={13} color={MUTED} />
                        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.2, fontWeight: 600, textTransform: 'uppercase', marginTop: 6 }}>
                          {c.label}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{c.value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Risk + recommendation */}
              <div className="lg:col-span-7 space-y-4">
                {(() => {
                  const rt = riskTone(prediction.risk_label);
                  const Icon = rt.icon;
                  return (
                    <div
                      className="p-5 rounded-2xl flex items-center gap-4"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: rt.bg }}
                      >
                        <Icon size={22} color={rt.color} />
                      </div>
                      <div className="flex-1">
                        <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: rt.color, textTransform: 'uppercase' }}>
                          Score pollution · {prediction.risk_score.toFixed(0)} / 100
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
                          {rt.label}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>
                          Indice panache {prediction.pollution_index.toFixed(0)} · {prediction.pollution_reduction_pct.toFixed(0)} % de pollution évitée si appliqué
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const at = actionTone(prediction.recommendation.action);
                  const Icon = at.icon;
                  return (
                    <div
                      className="p-5 rounded-2xl"
                      style={{ backgroundColor: 'white', color: CHARCOAL }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: at.bg }}
                        >
                          <Icon size={20} color={at.color} />
                        </div>
                        <div className="flex-1">
                          <div style={{ fontSize: 11, letterSpacing: 2, fontWeight: 700, color: at.color, textTransform: 'uppercase', marginBottom: 4 }}>
                            {at.label}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
                            {prediction.recommendation.headline}
                          </div>
                          <div style={{ fontSize: 13.5, color: '#3A4941', lineHeight: 1.55 }}>
                            {prediction.recommendation.detail}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-4">
                            <div
                              className="inline-flex items-center gap-2 px-3 h-8 rounded-full"
                              style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 700 }}
                            >
                              <Gauge size={12} />
                              {prediction.production_before.toFixed(0)} % → {prediction.production_after.toFixed(0)} %
                              <span style={{ color: at.color }}>
                                ({prediction.prod_change_pct >= 0 ? '+' : ''}{prediction.prod_change_pct.toFixed(0)} %)
                              </span>
                            </div>
                            {prediction.recommended_products.map(p => (
                              <span
                                key={p}
                                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full"
                                style={{ backgroundColor: GREEN_SOFT, color: GREEN_DARK, fontSize: 12, fontWeight: 700 }}
                              >
                                <Sparkles size={11} />
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Zones impact row */}
        {prediction && !predLoading && prediction.zones.length > 0 && (
          <div className="relative px-7 pb-7">
            <div className="mt-2 grid md:grid-cols-4 gap-3">
              {prediction.zones.slice(0, 4).map(z => (
                <div
                  key={z.name}
                  className="p-3 rounded-2xl"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                      <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {z.name}
                    </div>
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: z.color, boxShadow: `0 0 8px ${z.color}` }}
                    />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
                    {z.pollution.toFixed(0)}
                  </div>
                  <div style={{ fontSize: 11.5, color: z.color, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                    {z.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monthly economic report */}
      <div
        className="p-7 rounded-3xl relative overflow-hidden"
        style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
      >
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2.2, fontWeight: 700, color: GREEN, textTransform: 'uppercase', marginBottom: 6 }}>
              Bilan mensuel · plateforme AirShield
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em', color: CHARCOAL }}>
              Ce que {selected.name.split(' - ')[0]} gagne grâce à la plateforme
            </h3>
            {report && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div style={{ fontSize: 12.5, color: MUTED }}>
                  Période : {report.period.start} → {report.period.end} · {report.period.days} j
                </div>
                {report.data_source && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full"
                    style={{
                      backgroundColor: GREEN_SOFT,
                      color: GREEN_DARK,
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      textTransform: 'uppercase'
                    }}
                    title={report.data_source.weather}
                  >
                    <Database size={10} />
                    Données météo réelles · Open-Meteo ERA5
                  </span>
                )}
                {report.data_source?.risk_model && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full"
                    style={{
                      backgroundColor: report.data_source.risk_model === 'random_forest' ? GREEN_SOFT : GOLD_SOFT,
                      color: report.data_source.risk_model === 'random_forest' ? GREEN_DARK : '#9A6B10',
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      textTransform: 'uppercase'
                    }}
                  >
                    <Sparkles size={10} />
                    Modèle : {report.data_source.risk_model === 'random_forest' ? 'Random Forest' : 'Règle-de-base'}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={runReport}
            className="inline-flex items-center gap-2 px-3.5 h-10 rounded-full"
            style={{
              backgroundColor: CREAM,
              color: CHARCOAL,
              border: `1px solid ${BORDER}`,
              fontFamily: 'var(--font-display)',
              fontSize: 12.5,
              fontWeight: 700
            }}
          >
            <FileBarChart size={14} />
            Régénérer le bilan
          </button>
        </div>

        {reportLoading && (
          <AIProcessingOverlay
            overline="Bilan IA · ERA5 + Monte Carlo"
            title="Génération du bilan 30 jours…"
            variant="light"
            accent={GREEN}
            subtitle={
              <>
                L'IA rejoue 30 jours de météo réelle <strong style={{ color: CHARCOAL }}>ERA5</strong>,
                applique votre politique de production et estime les économies nettes, le ROI
                et les habitants protégés par la plateforme.
              </>
            }
            steps={[
              { icon: Database,    title: 'Archive ERA5 · 30 jours',   sub: 'Open-Meteo Historical · vent heure par heure' },
              { icon: Activity,    title: 'Rejoue politique AirShield', sub: 'Décision horaire · boost / réduction / maintien' },
              { icon: TrendingUp,  title: 'Monte Carlo économies',      sub: 'Amendes évitées · santé · crédits carbone' },
              { icon: FileBarChart,title: 'Synthèse ROI + payback',     sub: 'Multiplicateur + mois d\'amortissement' }
            ]}
            durationMs={2400}
          />
        )}
        {reportError && !reportLoading && (
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: RED_SOFT, color: RED, fontSize: 12.5 }}
          >
            {reportError}
          </div>
        )}
        {report?.error && !reportLoading && (
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: GOLD_SOFT, color: '#9A6B10', fontSize: 12.5 }}
          >
            {report.error}
          </div>
        )}

        {report && !reportLoading && (
          <div className="space-y-6">
            {/* Top KPIs */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {(() => {
                const dHigh   = report.days_high_cut      ?? 0;
                const dMed    = report.days_medium_filter ?? 0;
                const dBoost  = report.days_boost         ?? 0;
                const daysProtected = dHigh + dMed;
                const protectSub = daysProtected > 0
                  ? `${daysProtected} jour${daysProtected > 1 ? 's' : ''} de protection active`
                  : dBoost > 0
                    ? `Aucun pic critique · ${dBoost} j de production optimisée`
                    : 'Période sans alerte · pas de mesure requise';
                const netSavings = report.net_savings_dt ?? 0;
                const roi = report.roi_pct ?? 0;
                const roiMultiplier = 1 + roi / 100;
                return [
                  {
                    label: 'Économies nettes générées',
                    value: formatDT(netSavings),
                    sub: `sur ${report.period.days} j · météo ERA5 réelle`,
                    tone: netSavings > 0 ? 'good' : 'info'
                  },
                  {
                    label: 'Retour sur investissement',
                    value: `× ${roiMultiplier.toFixed(1)}`,
                    sub: `1 DT engagé rapporte ${roiMultiplier.toFixed(2)} DT`,
                    tone: 'good'
                  },
                  {
                    label: 'Amortissement plateforme',
                    value: report.payback_months ? `${report.payback_months.toFixed(1)} mois` : '—',
                    sub: report.payback_months ? 'avant retour à l\'équilibre' : 'bénéfice net non atteint',
                    tone: 'info'
                  },
                  {
                    label: 'Habitants protégés',
                    value: (daysProtected > 0 ? report.population_protected : 0).toLocaleString('fr-FR'),
                    sub: protectSub,
                    tone: 'info'
                  }
                ];
              })().map((k, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl"
                  style={{
                    backgroundColor: k.tone === 'good' ? GREEN_SOFT : CREAM,
                    border: `1px solid ${k.tone === 'good' ? 'rgba(46,162,76,0.2)' : BORDER}`
                  }}
                >
                  <div style={{ fontSize: 11, letterSpacing: 1.6, fontWeight: 700, color: k.tone === 'good' ? GREEN_DARK : MUTED, textTransform: 'uppercase' }}>
                    {k.label}
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.025em', color: CHARCOAL, marginTop: 8 }}>
                    {k.value}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{k.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Risk distribution */}
            <div
              className="p-5 rounded-2xl"
              style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontSize: 11, letterSpacing: 1.6, fontWeight: 700, color: MUTED, textTransform: 'uppercase' }}>
                    Répartition des risques · 30 j
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: CHARCOAL, marginTop: 3 }}>
                    Décisions automatisées par la plateforme
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as WindRisk[]).map(r => {
                  const tone = riskTone(r);
                  const count = report.risk_distribution[r] ?? 0;
                  const pct = Math.round((count / report.period.days) * 100);
                  return (
                    <div
                      key={r}
                      className="p-4 rounded-xl"
                      style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
                    >
                      <div
                        className="inline-flex items-center gap-2 px-2.5 h-6 rounded-full"
                        style={{ backgroundColor: tone.bg, color: tone.color, fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}
                      >
                        {tone.label}
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: CHARCOAL, marginTop: 8 }}>
                        {count} <span style={{ fontSize: 12, color: MUTED }}>j</span>
                      </div>
                      <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ backgroundColor: 'rgba(15,26,19,0.06)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: tone.color }}
                        />
                      </div>
                      <div style={{ fontSize: 11.5, color: MUTED, marginTop: 4 }}>
                        {pct} % du mois
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Breakdown table */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: CREAM }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: CHARCOAL }}>
                  Détail des économies et coûts
                </div>
                <div style={{ fontSize: 11.5, color: MUTED }}>
                  Net = {formatDT(report.net_savings_dt)}
                </div>
              </div>
              <table className="w-full">
                <tbody>
                  {breakdownRows.map((r, i) => {
                    const Icon = r.icon;
                    const color = r.positive ? GREEN_DARK : RED;
                    const prefix = r.positive ? '+' : '−';
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: 'white' }}>
                        <td className="px-5 py-3.5 flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: r.positive ? GREEN_SOFT : RED_SOFT }}
                          >
                            <Icon size={14} color={color} />
                          </div>
                          <span style={{ fontSize: 13.5, color: CHARCOAL, fontWeight: 600 }}>
                            {r.label}
                          </span>
                        </td>
                        <td
                          className="px-5 py-3.5 text-right"
                          style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 800, color }}
                        >
                          {prefix}{formatDT(Math.abs(r.value))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Data-source transparency — click to reveal assumptions */}
            {report.economic_assumptions && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <button
                  onClick={() => setShowSources(s => !s)}
                  className="w-full px-5 py-3.5 flex items-center justify-between"
                  style={{ backgroundColor: CREAM }}
                >
                  <div className="flex items-center gap-2">
                    <Info size={14} color={CHARCOAL} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: CHARCOAL }}>
                      Transparence · sources et hypothèses du bilan
                    </span>
                  </div>
                  {showSources
                    ? <ChevronUp size={16} color={MUTED} />
                    : <ChevronDown size={16} color={MUTED} />}
                </button>
                {showSources && (
                  <div className="px-5 py-4 space-y-4" style={{ backgroundColor: 'white' }}>
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: 1.6, fontWeight: 700, color: GREEN_DARK, textTransform: 'uppercase', marginBottom: 6 }}>
                        Données mesurées (réelles)
                      </div>
                      <ul className="space-y-1" style={{ fontSize: 12.5, color: CHARCOAL }}>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={12} color={GREEN_DARK} className="mt-1 flex-shrink-0" />
                          <span>
                            Météo quotidienne (vent, température, humidité, poussière) : <strong>{report.data_source?.weather}</strong>
                            {report.data_source?.weather_url && (
                              <a
                                href={report.data_source.weather_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 ml-1"
                                style={{ color: GREEN_DARK, fontWeight: 700 }}
                              >
                                voir <ExternalLink size={10} />
                              </a>
                            )}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={12} color={GREEN_DARK} className="mt-1 flex-shrink-0" />
                          <span>Classification du risque : modèle <strong>{report.data_source?.risk_model ?? '—'}</strong></span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, letterSpacing: 1.6, fontWeight: 700, color: '#9A6B10', textTransform: 'uppercase', marginBottom: 6 }}>
                        Constantes économiques (à calibrer par l'usine)
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2" style={{ fontSize: 12, color: CHARCOAL }}>
                        <div>Revenu CA : <strong>{report.economic_assumptions.revenue_per_pct_day_dt.toLocaleString('fr-FR')} DT / % / jour</strong></div>
                        <div>Amende grave évitée : <strong>{report.economic_assumptions.avoided_fine_high_dt.toLocaleString('fr-FR')} DT</strong></div>
                        <div>Amende modérée : <strong>{report.economic_assumptions.avoided_fine_medium_dt.toLocaleString('fr-FR')} DT</strong></div>
                        <div>Coût santé / habitant : <strong>{report.economic_assumptions.avoided_health_dt_per_person} DT</strong></div>
                        <div>Crédit carbone : <strong>{report.economic_assumptions.carbon_credit_dt_per_ton} DT / t CO₂e</strong></div>
                        <div>SO₂ évité / % coupé : <strong>{report.economic_assumptions.tons_so2_per_pct_cut} t</strong></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, letterSpacing: 1.6, fontWeight: 700, color: MUTED, textTransform: 'uppercase', marginBottom: 6 }}>
                        Sources des hypothèses
                      </div>
                      <ul className="space-y-1" style={{ fontSize: 12, color: '#3A4941', lineHeight: 1.55 }}>
                        {report.economic_assumptions.sources.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span style={{ color: MUTED }}>·</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Narrative for the jury */}
            <div
              className="p-5 rounded-2xl relative overflow-hidden"
              style={{ backgroundColor: CHARCOAL, color: 'white' }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 10% 100%, ${GREEN}44, transparent 55%)`,
                  filter: 'blur(40px)'
                }}
              />
              <div className="relative">
                <div style={{ fontSize: 11, letterSpacing: 2.2, fontWeight: 700, color: GREEN, textTransform: 'uppercase', marginBottom: 8 }}>
                  Argumentaire jury · rapport automatique
                </div>
                <ul className="space-y-2.5">
                  {report.narrative.map((line, i) => (
                    <li key={i} className="flex items-start gap-3" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                      <CheckCircle2 size={14} color={GREEN} className="mt-1 flex-shrink-0" />
                      <span
                        dangerouslySetInnerHTML={{
                          __html: line.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;font-weight:800">$1</strong>')
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
