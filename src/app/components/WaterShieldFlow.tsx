import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Atom,
  Check,
  ChevronDown,
  Cloud,
  CloudRain,
  Database,
  Droplet,
  FlaskConical,
  Gauge,
  Leaf,
  Loader2,
  Ruler,
  ShieldCheck,
  Sparkles,
  Sprout,
  Waves,
  Wind,
  X
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  predictWaterQuality,
  type WaterColor,
  type WaterOdor,
  type WaterShieldObservation,
  type WaterShieldPrediction,
  type WaterSource
} from '../lib/watershield';
import { AIProcessingOverlay } from './AIProcessingOverlay';

// ─── Palette (aligned with CropDiagFlow) ───────────────────────────
const GREEN = '#2BA24C';
const GREEN_DARK = '#1E7A38';
const GREEN_SOFT = '#E6F4EA';
const NAVY = '#1F3A5F';
const BLUE = '#3672B3';
const BLUE_SOFT = '#E5EEF8';
const CHARCOAL = '#0F1A13';
const MUTED = '#98A29A';
const CREAM = '#F7F5F0';
const CARD_BG = '#FFFFFF';
const AMBER = '#E0A23A';
const RED = '#D24C4C';

const SOURCES: { value: WaterSource; label: string; hint: string; icon: any }[] = [
  { value: 'well', label: 'Forage', hint: 'Nappe phréatique', icon: Droplet },
  { value: 'oasis', label: 'Oasis', hint: 'Source naturelle', icon: Sprout },
  { value: 'canal', label: 'Canal', hint: 'Irrigation collective', icon: Waves },
  { value: 'surface', label: 'Surface', hint: 'Mare / ruisseau', icon: CloudRain }
];

const COLORS: { value: WaterColor; label: string; swatch: string }[] = [
  { value: 'clear', label: 'Claire', swatch: '#DDEFFA' },
  { value: 'cloudy', label: 'Trouble', swatch: '#C4CBC9' },
  { value: 'brown', label: 'Brune', swatch: '#8A5A34' },
  { value: 'yellow', label: 'Jaunâtre', swatch: '#D9B74A' },
  { value: 'green', label: 'Verdâtre', swatch: '#5FA867' }
];

const ODORS: { value: WaterOdor; label: string; hint: string }[] = [
  { value: 'none', label: 'Aucune', hint: 'Inodore' },
  { value: 'sulfurous', label: 'Soufre', hint: 'Œuf pourri' },
  { value: 'metallic', label: 'Métallique', hint: 'Rouille / fer' },
  { value: 'chemical', label: 'Chimique', hint: 'Solvant / javel' },
  { value: 'earthy', label: 'Terreuse', hint: 'Boue · vase' }
];

function safetyColor(score: number): string {
  if (score >= 75) return GREEN;
  if (score >= 55) return AMBER;
  if (score >= 35) return '#D98842';
  return RED;
}

export function WaterShieldFlow({
  embedded = false
}: { embedded?: boolean } = {}) {
  const [source, setSource] = useState<WaterSource>('canal');
  const [distanceKm, setDistanceKm] = useState<number>(8);
  const [color, setColor] = useState<WaterColor>('clear');
  const [odor, setOdor] = useState<WaterOdor>('none');
  const [daysSinceRain, setDaysSinceRain] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WaterShieldPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [drawer, setDrawer] = useState<'why' | 'action' | null>(null);

  const submit = async () => {
    setError(null);
    setResult(null);
    setDrawer(null);
    setLoading(true);
    const t0 = performance.now();
    try {
      const payload: WaterShieldObservation = {
        water_source: source,
        distance_to_gct_km: distanceKm,
        color,
        odor,
        days_since_rain: daysSinceRain
      };
      const pred = await predictWaterQuality(payload);
      setResult(pred);
      setElapsedMs(performance.now() - t0);
    } catch (err: any) {
      setError(
        err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')
          ? "L'API WaterShield n'est pas accessible. Lance le backend : cd backend && python main.py"
          : err?.message ?? 'Erreur inconnue'
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setElapsedMs(null);
    setDrawer(null);
  };

  const card = (
    <div
      className="rounded-[32px] p-7 lg:p-9 max-w-[920px] mx-auto"
      style={{
        backgroundColor: CARD_BG,
        border: '1px solid rgba(15,26,19,0.06)',
        boxShadow: '0 24px 70px rgba(15,26,19,0.08), 0 2px 6px rgba(15,26,19,0.04)'
      }}
    >
      {/* ═════════ HEADER ═════════ */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              color: BLUE,
              letterSpacing: 2.4,
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: 10
            }}
          >
            WaterShield · IA qualité eau d'irrigation
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 2.4vw, 30px)',
              fontWeight: 800,
              color: CHARCOAL,
              letterSpacing: '-0.025em',
              lineHeight: 1.1
            }}
          >
            5 questions · diagnostic en 10 secondes
          </h2>
          <p
            className="mt-3 max-w-xl"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              color: MUTED,
              lineHeight: 1.55
            }}
          >
            Avant d'irriguer, vérifiez votre eau : salinité, pH, métaux lourds, turbidité. Score
            0–100, cultures compatibles et action recommandée.
          </p>
        </div>
        <span
          className="px-3.5 py-1.5 rounded-full"
          style={{
            backgroundColor: BLUE_SOFT,
            color: BLUE,
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.4
          }}
        >
          Nouveau
        </span>
      </div>

      {loading ? (
        <AIProcessingOverlay
          overline="WaterShield IA · XGBoost"
          title="Analyse de votre eau d'irrigation…"
          accent={BLUE}
          subtitle={
            <>
              Le modèle croise votre source, vos 5 observations terrain avec la base pollution{' '}
              <strong style={{ color: 'white' }}>GCT + CPG</strong> et calcule la salinité,
              le pH, les métaux lourds et un score qualité 0–100.
            </>
          }
          steps={[
            { icon: Database,    title: 'Chargement base pollution Gabès', sub: '6 zones · 12 ans d\'historique ANPE + CITET' },
            { icon: FlaskConical, title: 'Extraction signatures chimiques', sub: 'Source + couleur + odeur → signature probable' },
            { icon: Atom,        title: 'Prédiction XGBoost multi-sorties', sub: 'Salinité, pH, métaux lourds, turbidité' },
            { icon: Gauge,       title: 'Score qualité 0–100',             sub: 'Compatibilité cultures + action recommandée' }
          ]}
          durationMs={2200}
        />
      ) : !result ? (
        <QuestionForm
          source={source}
          setSource={setSource}
          distanceKm={distanceKm}
          setDistanceKm={setDistanceKm}
          color={color}
          setColor={setColor}
          odor={odor}
          setOdor={setOdor}
          daysSinceRain={daysSinceRain}
          setDaysSinceRain={setDaysSinceRain}
          loading={loading}
          error={error}
          onSubmit={submit}
        />
      ) : (
        <ResultView
          result={result}
          elapsedMs={elapsedMs}
          drawer={drawer}
          setDrawer={setDrawer}
          onReset={reset}
        />
      )}
    </div>
  );

  if (embedded) return card;

  return (
    <section className="pb-24" style={{ backgroundColor: CREAM }}>
      <div className="container mx-auto px-6 lg:px-12 pt-24">{card}</div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Question form
// ═══════════════════════════════════════════════════════════════════════════
function QuestionForm({
  source,
  setSource,
  distanceKm,
  setDistanceKm,
  color,
  setColor,
  odor,
  setOdor,
  daysSinceRain,
  setDaysSinceRain,
  loading,
  error,
  onSubmit
}: {
  source: WaterSource;
  setSource: (v: WaterSource) => void;
  distanceKm: number;
  setDistanceKm: (v: number) => void;
  color: WaterColor;
  setColor: (v: WaterColor) => void;
  odor: WaterOdor;
  setOdor: (v: WaterOdor) => void;
  daysSinceRain: number;
  setDaysSinceRain: (v: number) => void;
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  return (
    <div>
      {/* 1. Source */}
      <QuestionBlock index={1} icon={Droplet} title="Quelle est la source de l'eau ?">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {SOURCES.map(opt => {
            const Icon = opt.icon;
            const active = source === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSource(opt.value)}
                className="p-3 rounded-2xl text-left transition-colors"
                style={{
                  backgroundColor: active ? BLUE_SOFT : CREAM,
                  border: `1.5px solid ${active ? BLUE : 'rgba(15,26,19,0.06)'}`
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: active ? BLUE : 'rgba(15,26,19,0.05)' }}
                >
                  <Icon size={14} color={active ? 'white' : CHARCOAL} />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: CHARCOAL,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {opt.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    color: MUTED,
                    marginTop: 2
                  }}
                >
                  {opt.hint}
                </div>
              </button>
            );
          })}
        </div>
      </QuestionBlock>

      {/* 2. Distance GCT */}
      <QuestionBlock
        index={2}
        icon={Ruler}
        title="Distance au complexe GCT ?"
        hint="Les rejets industriels dégradent sulfates, chloramines et métaux lourds."
      >
        <div
          className="p-4 rounded-2xl"
          style={{ backgroundColor: CREAM, border: '1px solid rgba(15,26,19,0.06)' }}
        >
          <div className="flex items-baseline justify-between mb-3">
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                color: MUTED,
                letterSpacing: 1.6,
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              Distance estimée
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 800,
                color: CHARCOAL,
                letterSpacing: '-0.02em'
              }}
            >
              {distanceKm.toFixed(1)} km
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={40}
            step={0.5}
            value={distanceKm}
            onChange={e => setDistanceKm(parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: BLUE }}
          />
          <div
            className="mt-2 flex justify-between"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10.5,
              color: MUTED,
              letterSpacing: 0.4
            }}
          >
            <span>0,5 km (limitrophe)</span>
            <span>40 km</span>
          </div>
        </div>
      </QuestionBlock>

      {/* 3. Color */}
      <QuestionBlock index={3} icon={Sparkles} title="Couleur visible à l'œil ?">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {COLORS.map(opt => {
            const active = color === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setColor(opt.value)}
                className="p-3 rounded-2xl text-center transition-colors"
                style={{
                  backgroundColor: active ? BLUE_SOFT : CREAM,
                  border: `1.5px solid ${active ? BLUE : 'rgba(15,26,19,0.06)'}`
                }}
              >
                <div
                  className="w-10 h-10 mx-auto rounded-full mb-2"
                  style={{
                    backgroundColor: opt.swatch,
                    border: '1px solid rgba(15,26,19,0.08)'
                  }}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: CHARCOAL
                  }}
                >
                  {opt.label}
                </div>
              </button>
            );
          })}
        </div>
      </QuestionBlock>

      {/* 4. Odor */}
      <QuestionBlock index={4} icon={Wind} title="Odeur particulière ?">
        <div className="flex flex-wrap gap-2">
          {ODORS.map(opt => {
            const active = odor === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setOdor(opt.value)}
                className="px-3.5 py-2 rounded-full flex items-center gap-2 transition-colors"
                style={{
                  backgroundColor: active ? BLUE : CREAM,
                  border: `1.5px solid ${active ? BLUE : 'rgba(15,26,19,0.08)'}`,
                  color: active ? 'white' : CHARCOAL,
                  fontFamily: 'var(--font-display)',
                  fontSize: 12.5,
                  fontWeight: 600
                }}
              >
                <span>{opt.label}</span>
                <span
                  style={{
                    fontSize: 10.5,
                    color: active ? 'rgba(255,255,255,0.7)' : MUTED,
                    fontWeight: 500
                  }}
                >
                  · {opt.hint}
                </span>
              </button>
            );
          })}
        </div>
      </QuestionBlock>

      {/* 5. Rain */}
      <QuestionBlock
        index={5}
        icon={Cloud}
        title="Dernière pluie remonte à combien de jours ?"
        hint="Sécheresse → contaminants concentrés. Pluie récente → effet de dilution."
      >
        <div
          className="p-4 rounded-2xl"
          style={{ backgroundColor: CREAM, border: '1px solid rgba(15,26,19,0.06)' }}
        >
          <div className="flex items-baseline justify-between mb-3">
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                color: MUTED,
                letterSpacing: 1.6,
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              Jours depuis la dernière pluie
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 800,
                color: CHARCOAL,
                letterSpacing: '-0.02em'
              }}
            >
              {daysSinceRain} j
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={daysSinceRain}
            onChange={e => setDaysSinceRain(parseInt(e.target.value, 10))}
            className="w-full"
            style={{ accentColor: BLUE }}
          />
          <div
            className="mt-2 flex justify-between"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10.5,
              color: MUTED,
              letterSpacing: 0.4
            }}
          >
            <span>Aujourd'hui</span>
            <span>+ de 60 j</span>
          </div>
        </div>
      </QuestionBlock>

      {/* Submit */}
      {error && (
        <div
          className="p-3 rounded-xl flex items-start gap-2.5 mb-4"
          style={{
            backgroundColor: 'rgba(210,76,76,0.08)',
            border: '1px solid rgba(210,76,76,0.35)',
            fontFamily: 'var(--font-display)',
            fontSize: 12.5,
            color: '#7A1F1F',
            lineHeight: 1.45
          }}
        >
          <AlertTriangle size={15} style={{ color: RED, flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-4 rounded-full inline-flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.01] disabled:opacity-60"
        style={{
          backgroundColor: BLUE,
          color: 'white',
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 0.3,
          boxShadow: `0 12px 28px ${BLUE}44`
        }}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Analyse WaterShield…
          </>
        ) : (
          <>
            <ShieldCheck size={16} />
            Analyser la qualité de l'eau
          </>
        )}
      </button>
    </div>
  );
}

function QuestionBlock({
  index,
  icon: Icon,
  title,
  hint,
  children
}: {
  index: number;
  icon: any;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: BLUE_SOFT }}
        >
          <Icon size={14} style={{ color: BLUE }} />
        </div>
        <div className="min-w-0">
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10.5,
              color: BLUE,
              letterSpacing: 1.8,
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: 2
            }}
          >
            Question {index} / 5
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 700,
              color: CHARCOAL,
              letterSpacing: '-0.01em',
              lineHeight: 1.25
            }}
          >
            {title}
          </div>
          {hint && (
            <div
              className="mt-1"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12,
                color: MUTED,
                lineHeight: 1.45
              }}
            >
              {hint}
            </div>
          )}
        </div>
      </div>
      <div className="pl-0 md:pl-11">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Result
// ═══════════════════════════════════════════════════════════════════════════
function ResultView({
  result,
  elapsedMs,
  drawer,
  setDrawer,
  onReset
}: {
  result: WaterShieldPrediction;
  elapsedMs: number | null;
  drawer: 'why' | 'action' | null;
  setDrawer: (d: 'why' | 'action' | null) => void;
  onReset: () => void;
}) {
  const col = safetyColor(result.safety_score);
  const detectedContaminants = useMemo(
    () => result.contaminants.filter(c => c.detected),
    [result.contaminants]
  );

  return (
    <div>
      {/* ── Score hero ──────────────────────────────────────────── */}
      <div
        className="rounded-[24px] p-6 flex items-center gap-5"
        style={{
          background: `linear-gradient(135deg, ${col}26 0%, ${CARD_BG} 70%)`,
          border: `1.5px solid ${col}44`
        }}
      >
        <div
          className="relative flex-shrink-0"
          style={{ width: 120, height: 120 }}
        >
          <ScoreDial score={result.safety_score} color={col} />
        </div>
        <div className="min-w-0">
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              color: col,
              letterSpacing: 2.4,
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: 4
            }}
          >
            Safety Score · qualité {result.safety_band}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 800,
              color: CHARCOAL,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: 4
            }}
          >
            {result.recommendation.label}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 12.5,
              color: MUTED,
              lineHeight: 1.5
            }}
          >
            {result.context.water_source_label} · {result.context.distance_to_gct_km} km du GCT ·{' '}
            {result.context.color_label.toLowerCase()} · {result.context.odor_label.toLowerCase()}
            {elapsedMs != null && ` · ${(elapsedMs / 1000).toFixed(2)} s`}
          </div>
        </div>
      </div>

      {/* ── Contaminants grid ──────────────────────────────────── */}
      <div className="mt-5">
        <SectionTitle label="Risques détectés · modèles spécialisés" />
        <div className="grid md:grid-cols-2 gap-2.5">
          {result.contaminants.map(c => (
            <ContaminantCard key={c.key} c={c} />
          ))}
        </div>
      </div>

      {/* ── Cultures compatibles ──────────────────────────────── */}
      <div className="mt-5">
        <SectionTitle label="Cultures compatibles avec cette eau" />
        <div
          className="p-4 rounded-2xl flex flex-wrap gap-2"
          style={{ backgroundColor: GREEN_SOFT, border: `1px solid ${GREEN}33` }}
        >
          {result.compatible_crops.map((crop, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"
              style={{
                backgroundColor: 'white',
                color: GREEN_DARK,
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: 0.2,
                border: `1px solid ${GREEN}22`
              }}
            >
              <Leaf size={12} /> {crop}
            </span>
          ))}
        </div>
      </div>

      {/* ── Message ────────────────────────────────────────────── */}
      <div
        className="mt-5 p-4 rounded-2xl"
        style={{
          backgroundColor: '#F2F5FA',
          border: '1px solid rgba(31,58,95,0.12)',
          fontFamily: 'var(--font-display)',
          fontSize: 13.5,
          color: CHARCOAL,
          lineHeight: 1.55
        }}
      >
        {result.message}
      </div>

      {/* ── CTA stack ──────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={() => setDrawer(drawer === 'why' ? null : 'why')}
          className="w-full py-3.5 px-5 rounded-full inline-flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.01]"
          style={{
            backgroundColor: drawer === 'why' ? NAVY : BLUE,
            color: 'white',
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 0.2
          }}
        >
          <FlaskConical size={15} />
          Pourquoi ce score ? Voir la chimie
          <ChevronDown
            size={15}
            style={{ transform: drawer === 'why' ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
          />
        </button>
        <button
          onClick={() => setDrawer(drawer === 'action' ? null : 'action')}
          className="w-full py-3.5 px-5 rounded-full inline-flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.01]"
          style={{
            backgroundColor: drawer === 'action' ? GREEN_DARK : GREEN,
            color: 'white',
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 0.2,
            boxShadow: `0 10px 24px ${GREEN}44`
          }}
        >
          <ShieldCheck size={15} />
          Plan d'action terrain
          <ChevronDown
            size={15}
            style={{ transform: drawer === 'action' ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
          />
        </button>
      </div>

      {/* ── Reset link ───────────────────────────────────────── */}
      <div className="mt-3 flex items-center justify-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12.5,
            color: MUTED,
            fontWeight: 600
          }}
        >
          Nouveau diagnostic
        </button>
      </div>

      <AnimatePresence>
        {drawer === 'why' && <WhyPanel key="why" result={result} onClose={() => setDrawer(null)} />}
        {drawer === 'action' && (
          <ActionPanel
            key="action"
            result={result}
            detected={detectedContaminants}
            onClose={() => setDrawer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div
      className="mb-2.5"
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10.5,
        color: MUTED,
        letterSpacing: 1.8,
        fontWeight: 800,
        textTransform: 'uppercase'
      }}
    >
      {label}
    </div>
  );
}

function ScoreDial({ score, color }: { score: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 46;
  const offset = circumference * (1 - clamped / 100);
  return (
    <svg viewBox="0 0 120 120" width="120" height="120">
      <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(15,26,19,0.07)" strokeWidth="10" />
      <motion.circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="58"
        textAnchor="middle"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 26,
          fontWeight: 800,
          fill: CHARCOAL,
          letterSpacing: '-0.03em'
        }}
      >
        {Math.round(clamped)}
      </text>
      <text
        x="60"
        y="78"
        textAnchor="middle"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          fill: MUTED,
          letterSpacing: 1.8,
          fontWeight: 700,
        }}
      >
        / 100
      </text>
    </svg>
  );
}

function ContaminantCard({ c }: { c: WaterShieldPrediction['contaminants'][number] }) {
  const tone = c.detected ? RED : GREEN;
  const bg = c.detected ? 'rgba(210,76,76,0.08)' : 'rgba(43,162,76,0.06)';
  const pct = Math.round(c.probability * 100);
  return (
    <div
      className="p-4 rounded-2xl"
      style={{ backgroundColor: bg, border: `1px solid ${tone}33` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${tone}22` }}
        >
          {c.detected ? (
            <AlertTriangle size={15} style={{ color: tone }} />
          ) : (
            <Check size={15} style={{ color: tone }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13.5,
                fontWeight: 700,
                color: CHARCOAL,
                letterSpacing: '-0.01em'
              }}
            >
              {c.label}
            </span>
            <span
              className="px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: tone,
                color: 'white',
                fontFamily: 'var(--font-display)',
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: 0.4
              }}
            >
              {c.detected ? 'Détecté' : 'Clair'} · {pct}%
            </span>
          </div>
          <div
            className="mt-1"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              color: MUTED,
              lineHeight: 1.45
            }}
          >
            {c.hint}
          </div>
          <div
            className="mt-2 h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(15,26,19,0.06)' }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: tone }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function WhyPanel({
  result,
  onClose
}: {
  result: WaterShieldPrediction;
  onClose: () => void;
}) {
  const chem = result.imputed_chemistry;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden mt-5"
    >
      <div
        className="rounded-2xl p-5 lg:p-6"
        style={{
          backgroundColor: '#F2F5FA',
          border: '1px solid rgba(31,58,95,0.12)'
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10.5,
                color: NAVY,
                letterSpacing: 2.2,
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: 4
              }}
            >
              Explication · chimie reconstituée + drivers
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 800,
                color: CHARCOAL,
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              Pourquoi ce score ?
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer">
            <X size={15} style={{ color: MUTED }} />
          </button>
        </div>

        {/* Drivers */}
        {result.drivers.length > 0 && (
          <>
            <SectionTitle label="Drivers principaux du score" />
            <div className="flex flex-col gap-2 mb-4">
              {result.drivers.map((d, i) => {
                const tone = d.direction === 'dégrade' ? RED : GREEN;
                const width = Math.min(100, Math.abs(d.impact) * 100);
                return (
                  <div key={i}>
                    <div
                      className="flex items-center justify-between mb-1"
                      style={{ fontFamily: 'var(--font-display)', fontSize: 12.5 }}
                    >
                      <span style={{ color: CHARCOAL, fontWeight: 700 }}>{d.feature}</span>
                      <span style={{ color: tone, fontWeight: 700 }}>
                        {d.direction === 'dégrade' ? '↑ risque' : '↓ risque'}
                      </span>
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgba(31,58,95,0.08)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(6, width)}%`, backgroundColor: tone }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Chemistry grid */}
        <SectionTitle label="Chimie reconstituée · ordre de grandeur" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <ChemTile label="pH" value={chem.ph?.toFixed(2) ?? '—'} hint="6,5–8,4 optimal" />
          <ChemTile
            label="Salinité"
            value={chem.salinity_g_L != null ? `${chem.salinity_g_L.toFixed(2)} g/L` : '—'}
            hint="< 3 g/L tolérable"
          />
          <ChemTile
            label="Conductivité"
            value={chem.Conductivity != null ? `${chem.Conductivity.toFixed(0)} µS/cm` : '—'}
            hint="< 550 normal"
          />
          <ChemTile
            label="Sulfates"
            value={chem.Sulfate != null ? `${chem.Sulfate.toFixed(0)} mg/L` : '—'}
            hint="< 400 sûr"
          />
          <ChemTile
            label="Chloramines"
            value={chem.Chloramines != null ? `${chem.Chloramines.toFixed(1)} mg/L` : '—'}
            hint="< 4 sûr"
          />
          <ChemTile
            label="Turbidité"
            value={chem.Turbidity != null ? `${chem.Turbidity.toFixed(1)} NTU` : '—'}
            hint="< 4 sûr"
          />
          <ChemTile
            label="TDS"
            value={chem.Solids != null ? `${Math.round(chem.Solids)} ppm` : '—'}
            hint="< 20k sûr"
          />
          <ChemTile
            label="Dureté"
            value={chem.Hardness != null ? `${chem.Hardness.toFixed(0)} mg/L` : '—'}
            hint="< 250 optimal"
          />
          <ChemTile
            label="Carbone org."
            value={chem.Organic_carbon != null ? `${chem.Organic_carbon.toFixed(1)} mg/L` : '—'}
            hint="< 10 sûr"
          />
        </div>

        <div
          className="mt-4 p-3.5 rounded-xl"
          style={{
            backgroundColor: 'white',
            border: '1px solid rgba(15,26,19,0.06)',
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            color: CHARCOAL,
            lineHeight: 1.55
          }}
        >
          <strong style={{ color: NAVY }}>Méthode :</strong> les 9 paramètres physico-chimiques
          sont imputés à partir de vos 5 réponses (source, distance GCT, couleur, odeur, pluie) et
          du profil hydrogéologique de Gabès. L'incertitude est plus forte à plus de 20 km du GCT
          — confirmez par une analyse labo avant grosses décisions.
        </div>

        <div
          className="mt-3 text-right"
          style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: MUTED }}
        >
          {result.model.backbones} · {result.model.features} features
        </div>
      </div>
    </motion.div>
  );
}

function ChemTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(15,26,19,0.06)'
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          color: MUTED,
          letterSpacing: 1.4,
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: 4
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 800,
          color: CHARCOAL,
          letterSpacing: '-0.02em'
        }}
      >
        {value}
      </div>
      {hint && (
        <div
          className="mt-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10.5,
            color: MUTED
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function ActionPanel({
  result,
  detected,
  onClose
}: {
  result: WaterShieldPrediction;
  detected: WaterShieldPrediction['contaminants'];
  onClose: () => void;
}) {
  const actions = buildActions(result, detected);
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden mt-5"
    >
      <div
        className="rounded-2xl p-5 lg:p-6"
        style={{
          backgroundColor: GREEN_SOFT,
          border: `1.5px solid ${GREEN}55`
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10.5,
                color: GREEN_DARK,
                letterSpacing: 2.2,
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: 4
              }}
            >
              Plan d'action · {result.recommendation.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 800,
                color: CHARCOAL,
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              {result.recommendation.action}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer">
            <X size={15} style={{ color: MUTED }} />
          </button>
        </div>

        <SectionTitle label="Étapes concrètes sur le terrain" />
        <ol className="flex flex-col gap-2.5">
          {actions.map((step, i) => (
            <li
              key={i}
              className="p-3.5 rounded-xl flex items-start gap-3"
              style={{
                backgroundColor: 'white',
                border: '1px solid rgba(15,26,19,0.06)'
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: GREEN,
                  color: 'white',
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  fontWeight: 800
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  color: CHARCOAL,
                  lineHeight: 1.55
                }}
              >
                {step}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
}

function buildActions(
  result: WaterShieldPrediction,
  detected: WaterShieldPrediction['contaminants']
): string[] {
  const steps: string[] = [];

  if (result.recommendation.key === 'Do not use') {
    steps.push(
      "Coupez l'irrigation depuis cette source — réalisez un prélèvement conservé au frais pour analyse laboratoire (CRDA / ISET)."
    );
    steps.push(
      'Basculez sur une source alternative (eau pluviale stockée, forage éloigné du GCT, citerne).'
    );
  } else if (result.recommendation.key === 'Dilute') {
    steps.push(
      'Mélangez cette eau avec une source plus saine (pluie, forage éloigné) à 50/50 avant irrigation.'
    );
    steps.push(
      'Irriguez tôt le matin ou en soirée pour limiter la remontée saline par évaporation.'
    );
  } else if (result.recommendation.key === 'Tolerant crops only') {
    steps.push(
      "Réservez cette eau aux cultures tolérantes (palmier, olivier, grenadier, orge)."
    );
    steps.push(
      "Évitez le maraîchage sensible (tomate, laitue, poivron) jusqu'à amélioration de la source."
    );
  } else {
    steps.push(
      "Arrosez normalement — refaites un diagnostic après un épisode pollué ou changement visible de l'eau."
    );
  }

  // Specific contaminant mitigation
  for (const c of detected) {
    if (c.key === 'high_salinity') {
      steps.push(
        'Salinité élevée : lessivez le sol tous les 30 j avec un apport d\'eau douce équivalent à 20 % de la dose d\'irrigation.'
      );
    } else if (c.key === 'abnormal_ph') {
      steps.push(
        'pH anormal : ajoutez du gypse agricole (2–4 t/ha) pour tamponner le pH et améliorer la structure du sol.'
      );
    } else if (c.key === 'heavy_metals_risk') {
      steps.push(
        "Risque métaux lourds : évitez les cultures consommées crues (laitue, carotte) et rotation avec phyto-remédiation (tournesol, luzerne)."
      );
    } else if (c.key === 'high_turbidity') {
      steps.push(
        'Turbidité élevée : installez un filtre à tamis 125 µm + décanteur avant le goutteur — prévient le colmatage.'
      );
    }
  }

  steps.push('Journalisez la mesure dans votre carnet parcellaire pour suivre la tendance saisonnière.');
  return steps;
}
