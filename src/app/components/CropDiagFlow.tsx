import {
  AlertTriangle,
  Brain,
  Bug,
  Camera,
  Check,
  ChevronDown,
  CloudRain,
  Eye,
  Focus,
  Leaf,
  Loader2,
  MapPin,
  Microscope,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sprout,
  Upload,
  Wind,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import {
  predictPlantDisease,
  type CropDiagPrediction,
  type CropDiagReliability
} from '../lib/cropdiag';
import { AIProcessingOverlay } from './AIProcessingOverlay';

// ─── Palette ────────────────────────────────────────────────────────────────
const GREEN = '#2BA24C';
const GREEN_DARK = '#1E7A38';
const GREEN_SOFT = '#E6F4EA';
const NAVY = '#1F3A5F';
const NAVY_DARK = '#17304E';
const CHARCOAL = '#0F1A13';
const MUTED = '#98A29A';
const CREAM = '#F7F5F0';
const CARD_BG = '#FFFFFF';
const ROSE_SOFT = '#FCE7E5';
const ROSE = '#7A2E2E';
const ROSE_DARK = '#5C2323';
const AMBER = '#E0A23A';
const RED = '#D24C4C';

function severityColor(sev: CropDiagPrediction['treatment']['severity']): string {
  switch (sev) {
    case 'Critique':
    case 'Élevée':
      return RED;
    case 'Moyenne':
      return AMBER;
    case 'Aucune':
      return GREEN;
    default:
      return MUTED;
  }
}

function reliabilityColor(r: CropDiagReliability): string {
  if (r === 'high') return GREEN;
  if (r === 'medium') return AMBER;
  return RED;
}

// ────────────────────────────────────────────────────────────────────────────
export function CropDiagFlow({
  embedded = false
}: { embedded?: boolean } = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CropDiagPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [drawer, setDrawer] = useState<'why' | 'order' | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setElapsedMs(null);
    setDrawer(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => setPreview(String(e.target?.result ?? ''));
    reader.readAsDataURL(file);

    setLoading(true);
    const t0 = performance.now();
    try {
      const pred = await predictPlantDisease(file);
      setResult(pred);
      setElapsedMs(performance.now() - t0);
    } catch (err: any) {
      setError(
        err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')
          ? "L'API GabesHeal F2 n'est pas accessible. Lance le backend : cd backend && python main.py"
          : err?.message ?? 'Erreur inconnue'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const onPick = () => fileInputRef.current?.click();
  const onReset = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    setElapsedMs(null);
    setFileName(null);
    setDrawer(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              color: NAVY,
              letterSpacing: 2.4,
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: 10
            }}
          >
            Diagnostic vision IA
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
            Photographier une plante
          </h2>
        </div>
        <span
          className="px-3.5 py-1.5 rounded-full"
          style={{
            backgroundColor: 'rgba(15,26,19,0.05)',
            color: CHARCOAL,
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.4
          }}
        >
          Nouveau
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {/* ═════════ BODY ═════════ */}
      {loading ? (
        <AIProcessingOverlay
          overline="Vision IA · ResNet-50"
          title="Téléchargement du modèle vision…"
          subtitle={
            <>
              Le réseau neuronal extrait les features de votre photo, classe la maladie
              parmi <strong style={{ color: 'white' }}>38 classes</strong> et localise la zone
              atteinte par Grad-CAM.
            </>
          }
          steps={[
            { icon: Microscope, title: 'Chargement ResNet-50',    sub: 'Poids · 102 Mo · fine-tuné PlantVillage' },
            { icon: Eye,        title: 'Extraction de features',  sub: '2048 vecteurs convolutifs par image' },
            { icon: Brain,      title: 'Classification 38 classes', sub: 'Softmax · Top-3 hypothèses pondérées' },
            { icon: Focus,      title: 'Localisation Grad-CAM',   sub: 'Cartographie de l\'attention sur la feuille' }
          ]}
          durationMs={2200}
        />
      ) : !result ? (
        <UploadArea
          loading={loading}
          preview={preview}
          onPick={onPick}
          onDrop={handleFile}
          fileName={fileName}
          error={error}
        />
      ) : (
        <ResultView
          result={result}
          fileName={fileName}
          elapsedMs={elapsedMs}
          drawer={drawer}
          setDrawer={setDrawer}
          onReset={onReset}
          onPick={onPick}
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
// Upload / empty state
// ═══════════════════════════════════════════════════════════════════════════
function UploadArea({
  loading,
  preview,
  onPick,
  onDrop,
  fileName,
  error
}: {
  loading: boolean;
  preview: string | null;
  onPick: () => void;
  onDrop: (f: File) => void;
  fileName: string | null;
  error: string | null;
}) {
  return (
    <div>
      {fileName && (
        <FileChip name={fileName} />
      )}

      <div
        onClick={() => !loading && onPick()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) onDrop(f);
        }}
        className="relative rounded-[24px] overflow-hidden cursor-pointer flex items-center justify-center"
        style={{
          aspectRatio: '2 / 1',
          backgroundColor: CHARCOAL,
          background: preview
            ? undefined
            : 'radial-gradient(circle at 30% 20%, rgba(43,162,76,0.28) 0%, rgba(15,26,19,0.95) 65%)'
        }}
      >
        {preview && (
          <img
            src={preview}
            alt="photo en cours"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: loading ? 'brightness(0.55) blur(2px)' : 'brightness(0.92)' }}
          />
        )}

        {!preview && (
          <div className="text-center px-8">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px dashed rgba(255,255,255,0.35)'
              }}
            >
              <Upload size={22} color="white" />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.02em',
                marginBottom: 6
              }}
            >
              Déposez une photo de feuille
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.5
              }}
            >
              ResNet-50 · 38 classes · tomate, poivron, vigne, maïs…
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="animate-spin mx-auto" size={34} color="white" />
              <div
                className="mt-3"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  color: 'white',
                  fontWeight: 600
                }}
              >
                Analyse ResNet-50 en cours…
              </div>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-x-4 bottom-4">
            <div
              className="p-3 rounded-xl flex items-start gap-2.5"
              style={{
                backgroundColor: 'rgba(210,76,76,0.16)',
                border: '1px solid rgba(210,76,76,0.5)',
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                color: 'white',
                lineHeight: 1.4
              }}
            >
              <AlertTriangle size={15} style={{ color: RED, flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      <div
        className="mt-5 flex items-center justify-center"
        style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: MUTED }}
      >
        Glissez-déposez ou{' '}
        <button
          className="ml-1 underline underline-offset-4"
          style={{ color: NAVY, fontWeight: 600 }}
          onClick={onPick}
        >
          parcourir les fichiers
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Result view (matches the mockup)
// ═══════════════════════════════════════════════════════════════════════════
function ResultView({
  result,
  fileName,
  elapsedMs,
  drawer,
  setDrawer,
  onReset,
  onPick
}: {
  result: CropDiagPrediction;
  fileName: string | null;
  elapsedMs: number | null;
  drawer: 'why' | 'order' | null;
  setDrawer: (d: 'why' | 'order' | null) => void;
  onReset: () => void;
  onPick: () => void;
}) {
  const sevColor = severityColor(result.treatment.severity);
  const relColor = reliabilityColor(result.reliability);

  return (
    <div>
      {/* Filename chip */}
      <FileChip name={fileName ?? 'photo'} />

      {/* Two images side-by-side */}
      <div className="grid sm:grid-cols-2 gap-3">
        {/* --- Boxed original --- */}
        <ImageTile src={result.localization.boxedImage} rounded>
          <div
            className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: ROSE,
              color: 'white',
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.2,
              boxShadow: '0 6px 18px rgba(122,46,46,0.35)'
            }}
          >
            {result.plant} — {result.disease}
          </div>
        </ImageTile>

        {/* --- Grad-CAM overlay --- */}
        <ImageTile src={result.localization.gradcamImage} rounded>
          <div
            className="absolute bottom-3 left-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: 'rgba(15,26,19,0.82)',
              color: 'white',
              fontFamily: 'var(--font-display)',
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: 0.3,
              backdropFilter: 'blur(8px)'
            }}
          >
            <Sparkles size={11} /> Zone visualisée par Grad-CAM
          </div>
        </ImageTile>
      </div>

      {/* Result row (rose card) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-2xl p-5 flex items-center justify-between gap-4"
        style={{
          backgroundColor: ROSE_SOFT,
          border: '1px solid rgba(122,46,46,0.1)'
        }}
      >
        <div className="min-w-0">
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 800,
              color: CHARCOAL,
              letterSpacing: '-0.02em',
              marginBottom: 2,
              lineHeight: 1.2
            }}
          >
            {result.plant} — {result.disease}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 12.5,
              color: '#8A6565',
              lineHeight: 1.5
            }}
          >
            Modèle ResNet-50 fine-tuné sur {result.model.classes} classes · classe {result.classIdx}
            {elapsedMs != null && ` · ${(elapsedMs / 1000).toFixed(2)} s`}
          </div>
        </div>

        {/* reliability icon badge (remplace le pourcentage) */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: relColor,
            color: 'white',
            boxShadow: `0 6px 18px ${relColor}55`
          }}
          title={result.reliabilityLabel}
        >
          {result.reliability === 'high' ? (
            <ShieldCheck size={22} strokeWidth={2.2} />
          ) : (
            <AlertTriangle size={22} strokeWidth={2.2} />
          )}
        </div>
      </motion.div>

      {/* reliability strip — sans chiffres */}
      <div
        className="mt-3 flex items-center gap-2 flex-wrap px-1"
        style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: MUTED }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: relColor,
            boxShadow: `0 0 8px ${relColor}`
          }}
        />
        <span
          style={{
            fontWeight: 700,
            color: relColor,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            fontSize: 10.5
          }}
        >
          Fiabilité · {result.reliabilityLabel}
        </span>
      </div>

      {/* CTA stack */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={() => setDrawer(drawer === 'why' ? null : 'why')}
          className="w-full py-3.5 px-5 rounded-full inline-flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.01]"
          style={{
            backgroundColor: drawer === 'why' ? NAVY_DARK : NAVY,
            color: 'white',
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 0.2
          }}
        >
          <Leaf size={15} />
          Pourquoi cette anomalie est apparue ?
          <ChevronDown
            size={15}
            style={{ transform: drawer === 'why' ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
          />
        </button>

        <button
          onClick={() => setDrawer(drawer === 'order' ? null : 'order')}
          className="w-full py-3.5 pl-5 pr-2 rounded-full inline-flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.01] relative"
          style={{
            backgroundColor: GREEN,
            color: 'white',
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 0.2,
            boxShadow: `0 10px 24px ${GREEN}55`
          }}
        >
          <ShoppingCart size={16} />
          Commander le traitement
          <button
            onClick={e => {
              e.stopPropagation();
              onPick();
            }}
            aria-label="Nouvelle photo"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'white', marginLeft: 10 }}
          >
            <Camera size={14} style={{ color: GREEN_DARK }} />
          </button>
        </button>
      </div>

      {/* small reset link */}
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
          <RotateCcw size={12} /> Réinitialiser
        </button>
      </div>

      {/* expandable drawer */}
      <AnimatePresence>
        {drawer === 'why' && (
          <WhyPanel key="why" result={result} onClose={() => setDrawer(null)} />
        )}
        {drawer === 'order' && (
          <OrderPanel key="order" result={result} onClose={() => setDrawer(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════
function FileChip({ name }: { name: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4"
      style={{
        backgroundColor: GREEN_SOFT,
        color: GREEN_DARK,
        fontFamily: 'var(--font-display)',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.2
      }}
    >
      <Camera size={13} />
      <span>Image: {name}</span>
    </div>
  );
}

function ImageTile({
  src,
  rounded,
  children
}: {
  src: string;
  rounded?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden ${rounded ? 'rounded-[20px]' : ''}`}
      style={{
        aspectRatio: '1 / 1',
        backgroundColor: CHARCOAL,
        border: '1px solid rgba(15,26,19,0.06)'
      }}
    >
      <img
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {children}
    </div>
  );
}

function WhyPanel({
  result,
  onClose
}: {
  result: CropDiagPrediction;
  onClose: () => void;
}) {
  const relColor = reliabilityColor(result.reliability);
  const c = result.causes;
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
              Pourquoi cette anomalie · analyse agronomique
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
              {result.plant} — {result.disease}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer">
            <X size={15} style={{ color: MUTED }} />
          </button>
        </div>

        {/* ── Pathogen headline card ── */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl mb-4"
          style={{
            backgroundColor: 'white',
            border: `1px solid ${NAVY}22`,
            boxShadow: '0 4px 14px rgba(31,58,95,0.05)'
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${NAVY}15` }}
          >
            <Bug size={17} style={{ color: NAVY }} />
          </div>
          <div className="min-w-0">
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                color: NAVY,
                letterSpacing: 1.8,
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: 2
              }}
            >
              Agent responsable
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14.5,
                fontWeight: 700,
                color: CHARCOAL,
                letterSpacing: '-0.01em'
              }}
            >
              {c.pathogen}
            </div>
          </div>
        </div>

        {/* ── Four sections grid ── */}
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <CauseSection
            icon={CloudRain}
            color="#4B90C7"
            title="Conditions favorables"
            items={c.conditions}
          />
          <CauseSection
            icon={Wind}
            color="#C8973A"
            title="Voies de transmission"
            items={c.transmission}
          />
          <CauseSection
            icon={AlertTriangle}
            color={RED}
            title="Facteurs de risque"
            items={c.riskFactors}
          />
          <CauseSection
            icon={Sprout}
            color={GREEN}
            title="Plan de prévention"
            items={c.prevention}
          />
        </div>

        {/* ── Local note (Gabès) ── */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl mb-4"
          style={{
            backgroundColor: '#FEF3DC',
            border: '1px solid rgba(200,151,58,0.25)'
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(200,151,58,0.18)' }}
          >
            <MapPin size={15} style={{ color: '#C8973A' }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                color: '#8A6220',
                letterSpacing: 1.8,
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: 2
              }}
            >
              Note locale · Gabès
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                color: CHARCOAL,
                lineHeight: 1.55
              }}
            >
              {c.localNote}
            </div>
          </div>
        </div>

        {/* ── Vérification IA ── */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10.5,
            color: MUTED,
            letterSpacing: 1.8,
            fontWeight: 800,
            textTransform: 'uppercase',
            marginBottom: 8
          }}
        >
          Vérification du diagnostic
        </div>

        {/* Reliability hint */}
        <div
          className="flex items-start gap-3 p-3.5 rounded-xl mb-3"
          style={{ backgroundColor: 'white', border: `1px solid ${relColor}44` }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${relColor}22` }}
          >
            {result.reliability === 'high' ? (
              <ShieldCheck size={15} style={{ color: relColor }} />
            ) : (
              <AlertTriangle size={15} style={{ color: relColor }} />
            )}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 12.5,
              color: CHARCOAL,
              lineHeight: 1.55
            }}
          >
            <strong style={{ color: relColor }}>{result.reliabilityLabel}</strong>
            <div style={{ marginTop: 2, color: '#3F4B43' }}>{result.reliabilityHint}</div>
          </div>
        </div>

        {/* Top-3 — sans chiffres, barres relatives */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10.5,
            color: MUTED,
            letterSpacing: 1.6,
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: 6
          }}
        >
          Hypothèses du modèle
        </div>
        <div className="flex flex-col gap-2 mb-3">
          {result.top3.map((t, i) => (
            <div key={i}>
              <div
                className="flex items-center gap-2 mb-1"
                style={{ fontFamily: 'var(--font-display)', fontSize: 12.5 }}
              >
                {i === 0 ? (
                  <ShieldCheck size={12} style={{ color: NAVY }} />
                ) : (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: MUTED }}
                  />
                )}
                <span
                  style={{
                    color: i === 0 ? CHARCOAL : MUTED,
                    fontWeight: i === 0 ? 700 : 600
                  }}
                >
                  {t.plant} — {t.disease}
                  {i === 0 ? ' (retenue)' : ''}
                </span>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(31,58,95,0.08)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${t.confidence}%`,
                    backgroundColor: i === 0 ? NAVY : MUTED
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Grad-CAM explanation — sans chiffres */}
        <div
          className="p-3.5 rounded-xl"
          style={{
            backgroundColor: 'white',
            border: '1px solid rgba(15,26,19,0.06)',
            fontFamily: 'var(--font-display)',
            fontSize: 12.5,
            color: CHARCOAL,
            lineHeight: 1.55
          }}
        >
          <strong style={{ color: NAVY }}>Localisation Grad-CAM :</strong> le modèle a
          concentré son attention sur la zone encadrée. Si ce cadre pointe le fond ou le
          bord de la feuille plutôt que le tissu malade, le diagnostic est à écarter — reprenez
          une photo rapprochée de la feuille atteinte.
        </div>

        <div
          className="mt-3 text-right"
          style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: MUTED }}
        >
          {result.model.backbone}
        </div>
      </div>
    </motion.div>
  );
}

function CauseSection({
  icon: Icon,
  color,
  title,
  items
}: {
  icon: any;
  color: string;
  title: string;
  items: string[];
}) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(15,26,19,0.06)'
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}1a` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10.5,
            color,
            letterSpacing: 1.8,
            fontWeight: 800,
            textTransform: 'uppercase'
          }}
        >
          {title}
        </div>
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((txt, i) => (
          <li
            key={i}
            className="flex items-start gap-2"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 12.5,
              color: CHARCOAL,
              lineHeight: 1.45
            }}
          >
            <span
              className="w-1 h-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: color, marginTop: 7 }}
            />
            <span>{txt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrderPanel({
  result,
  onClose
}: {
  result: CropDiagPrediction;
  onClose: () => void;
}) {
  const sevColor = severityColor(result.treatment.severity);
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden mt-5"
    >
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: result.isHealthy ? GREEN_SOFT : '#F4FAF5',
          border: `1.5px solid ${result.isHealthy ? GREEN : sevColor}33`
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              color: GREEN_DARK,
              letterSpacing: 2,
              fontWeight: 800,
              textTransform: 'uppercase'
            }}
          >
            Traitement recommandé · Sévérité {result.treatment.severity}
          </div>
          <button onClick={onClose}>
            <X size={14} style={{ color: MUTED }} />
          </button>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 800,
            color: CHARCOAL,
            letterSpacing: '-0.02em',
            marginBottom: 2
          }}
        >
          {result.treatment.product}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12.5,
            color: MUTED,
            marginBottom: 14
          }}
        >
          {result.treatment.activeIngredient}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <InfoTile label="Dosage" value={result.treatment.dose} />
          <InfoTile label="Calendrier" value={result.treatment.timing} />
        </div>

        <div
          className="flex items-end justify-between p-4 rounded-2xl"
          style={{
            backgroundColor: 'white',
            border: '1px solid rgba(15,26,19,0.05)'
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10.5,
                color: MUTED,
                letterSpacing: 1.8,
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 4
              }}
            >
              Coût estimé
            </div>
            <div className="flex items-baseline gap-1">
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 800,
                  color: CHARCOAL,
                  letterSpacing: '-0.03em',
                  lineHeight: 1
                }}
              >
                {result.treatment.priceDt}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: MUTED
                }}
              >
                {result.treatment.priceUnit}
              </span>
            </div>
          </div>
          <button
            className="px-5 py-2.5 rounded-full transition-transform hover:scale-[1.02] inline-flex items-center gap-2"
            style={{
              backgroundColor: GREEN,
              color: 'white',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 0.3
            }}
          >
            <Check size={14} />
            Confirmer la commande
          </button>
        </div>

        <div
          className="mt-3 flex items-start gap-2"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12.5,
            color: CHARCOAL,
            lineHeight: 1.5
          }}
        >
          <Sparkles size={14} style={{ color: GREEN, flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong style={{ color: GREEN_DARK }}>Alternative bio :</strong>{' '}
            {result.treatment.bioAlternative}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
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
          letterSpacing: 1.6,
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
          fontSize: 12.5,
          color: CHARCOAL,
          fontWeight: 600,
          lineHeight: 1.35
        }}
      >
        {value}
      </div>
    </div>
  );
}
