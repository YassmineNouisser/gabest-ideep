import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  Building2,
  CalendarCheck,
  Check,
  CircleDollarSign,
  Database,
  Download,
  FileSignature,
  Flame,
  Globe,
  Layers,
  Leaf,
  Mail,
  MapPin,
  Network,
  Package,
  Phone,
  Recycle,
  Send,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  Truck,
  Trophy,
  Users,
  X,
  Zap
} from 'lucide-react';
import {
  BUYER_TYPE_LABEL,
  BUYER_TYPE_TONE,
  BuyerOffer,
  INDUSTRY_WASTE_TYPES,
  IndustryRecycler,
  IndustrySortKey,
  IndustryWasteInput,
  TRANSPORT_LABEL,
  computeIndustryValue,
  enrichOffersWithGypsiFert,
  matchBuyers,
  nearMatchBuyers,
  recommendIndustryRecyclers
} from '../lib/industrymatch';
import { IMG_INDUSTRY_PLANT, IMG_HERO } from '../lib/images';
import { AIProcessingOverlay } from './AIProcessingOverlay';

const GREEN = '#2BA24C';
const GREEN_DARK = '#1E7A38';
const GREEN_SOFT = '#E6F4EA';
const CHARCOAL = '#0F1A13';
const MUTED = '#98A29A';
const CREAM = '#F7F5F0';
const BORDER = 'rgba(15,26,19,0.08)';
const GOLD_SOFT = '#FEF3DC';

const ZONES = ['Ghannouch', 'Zone industrielle Gabès', 'Sidi Bouali', 'Chott Salim', 'Mareth'];

type Step = 'form' | 'results' | 'accepted' | 'closed';

const STEPS: { id: Step; label: string }[] = [
  { id: 'form',     label: '1 · Déclarer le rejet' },
  { id: 'results',  label: '2 · Choisir le preneur' },
  { id: 'accepted', label: '3 · Choisir le recycleur' },
  { id: 'closed',   label: '4 · Boucle bouclée' }
];

function contractRef(): string {
  const t = Date.now().toString(36).toUpperCase();
  return `IM-${t.slice(-6)}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

const BUYER_ICON = {
  agriculteur: Sprout,
  cimenterie: Building2,
  platrerie: Layers,
  btp: Truck,
  compost: Recycle,
  engrais: Leaf
} as const;

export function IndustryMatchFlow() {
  const [step, setStep] = useState<Step>('form');
  const [input, setInput] = useState<IndustryWasteInput>({
    type: 'phosphogypsum',
    quantity: 250,
    zone: 'Ghannouch',
    purity: 86
  });
  const [sort, setSort] = useState<IndustrySortKey>('distance');
  const [loading, setLoading] = useState(false);
  const [acceptedOffer, setAcceptedOffer] = useState<BuyerOffer | null>(null);
  const [detailsOffer, setDetailsOffer] = useState<BuyerOffer | null>(null);
  const [selectedRecycler, setSelectedRecycler] = useState<IndustryRecycler | null>(null);
  const [contract] = useState(contractRef);

  const value = useMemo(() => computeIndustryValue(input), [input]);
  const baseOffers = useMemo(
    () => (step === 'form' ? [] : matchBuyers(input, sort)),
    [input, sort, step]
  );
  const [offers, setOffers] = useState<BuyerOffer[]>([]);
  const [enriching, setEnriching] = useState(false);

  // When we leave the form, try to enrich the matches with GypsiFert
  // predictions (dosage/gain/risk) for each agri buyer on phosphogypse.
  useEffect(() => {
    if (step === 'form' || baseOffers.length === 0) {
      setOffers(baseOffers);
      return;
    }
    let cancelled = false;
    setOffers(baseOffers);
    if (input.type === 'phosphogypsum' && baseOffers.some(o => o.buyer.type === 'agriculteur')) {
      setEnriching(true);
      enrichOffersWithGypsiFert(input, baseOffers)
        .then(rich => {
          if (!cancelled) setOffers(rich);
        })
        .finally(() => {
          if (!cancelled) setEnriching(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [baseOffers, input, step]);

  const recyclers = useMemo(
    () => (acceptedOffer ? recommendIndustryRecyclers(input.type) : []),
    [acceptedOffer, input.type]
  );

  const submit = () => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setStep('results');
    }, 2200);
  };

  const accept = (offer: BuyerOffer) => {
    setAcceptedOffer(offer);
    setSelectedRecycler(null);
    setStep('accepted');
  };

  const selectRecycler = (r: IndustryRecycler) => {
    setSelectedRecycler(r);
    setStep('closed');
  };

  const reset = () => {
    setStep('form');
    setAcceptedOffer(null);
    setDetailsOffer(null);
    setSelectedRecycler(null);
  };

  return (
    <section className="relative">
      {/* ============== Cinematic header ============== */}
      <div
        className="relative w-full overflow-hidden rounded-3xl"
        style={{ minHeight: 320 }}
      >
        <div className="absolute inset-0">
          <img
            src={IMG_INDUSTRY_PLANT}
            alt=""
            aria-hidden
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.05) brightness(0.55)' }}
            onError={e => {
              if (e.currentTarget.src !== IMG_HERO) e.currentTarget.src = IMG_HERO;
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(110deg, rgba(15,26,19,0.85) 0%, rgba(15,26,19,0.6) 55%, rgba(15,26,19,0.25) 100%)'
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-96 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 70% 50%, ${GREEN}45, transparent 60%)`,
              filter: 'blur(50px)'
            }}
          />
        </div>

        <div
          className="absolute select-none pointer-events-none"
          style={{
            top: '52%',
            right: '-30px',
            transform: 'translateY(-50%)',
            fontFamily: 'var(--font-naskh, var(--font-display))',
            fontSize: 220,
            color: 'white',
            opacity: 0.07,
            lineHeight: 1,
            fontWeight: 700
          }}
        >
          صناعة
        </div>

        <div className="relative p-8 lg:p-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)'
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
                  letterSpacing: 2.4,
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                Module IndustryMatch · IA débouchés circulaires
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 3.8vw, 46px)',
                fontWeight: 800,
                lineHeight: 1.05,
                color: 'white',
                letterSpacing: '-0.03em'
              }}
            >
              Vos rejets industriels deviennent{' '}
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                amendement, ciment,
              </span>{' '}
              <span style={{ color: 'white' }}>route.</span>
            </h2>
            <p
              className="mt-4 max-w-xl"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14.5,
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1.6
              }}
            >
              Déclarez votre flux — l'IA croise agriculteurs, cimenteries,
              plâtreries et chantiers BTP en demande. Revenu secondaire,
              CO₂ évité, rapport ESG auto.
            </p>

            <div className="mt-6 flex items-center gap-2 flex-wrap">
              {[
                { v: '8', l: 'types de rejets' },
                { v: '10', l: 'preneurs B2B' },
                { v: '5', l: 'éco-recycleurs' }
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      fontWeight: 800,
                      color: 'white',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {s.v}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 11.5,
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 500
                    }}
                  >
                    {s.l}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ============== Stepper ============== */}
      <div
        className="mt-6 mb-8 p-3 rounded-2xl"
        style={{
          backgroundColor: 'white',
          border: `1px solid ${BORDER}`,
          boxShadow: '0 12px 40px rgba(15,26,19,0.06)'
        }}
      >
        <div className="relative flex items-center justify-between gap-2 flex-wrap">
          <div
            className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 hidden md:block"
            style={{ backgroundColor: 'rgba(15,26,19,0.06)' }}
          />
          <motion.div
            className="absolute left-3 top-1/2 -translate-y-1/2 h-0.5 hidden md:block"
            style={{
              backgroundColor: GREEN,
              width: `calc(${(STEPS.findIndex(x => x.id === step) /
                Math.max(1, STEPS.length - 1)) *
                100}% - 0.75rem)`
            }}
            initial={{ width: 0 }}
            animate={{
              width: `calc(${(STEPS.findIndex(x => x.id === step) /
                Math.max(1, STEPS.length - 1)) *
                100}% - 0.75rem)`
            }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
          {STEPS.map((s, i) => {
            const currentIdx = STEPS.findIndex(x => x.id === step);
            const active = s.id === step;
            const done = i < currentIdx;
            return (
              <div
                key={s.id}
                className="relative z-10 flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: active ? GREEN : done ? GREEN_SOFT : 'white',
                  border: `1px solid ${
                    active ? GREEN : done ? `${GREEN}40` : BORDER
                  }`,
                  fontFamily: 'var(--font-display)'
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: active
                      ? 'rgba(255,255,255,0.2)'
                      : done
                      ? GREEN
                      : CREAM,
                    color: active ? 'white' : done ? 'white' : MUTED,
                    fontSize: 11,
                    fontWeight: 800
                  }}
                >
                  {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? 'white' : done ? GREEN_DARK : CHARCOAL,
                    letterSpacing: 0.2
                  }}
                >
                  {s.label.replace(/^\d+\s·\s/, '')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================== */}
      {/* PROCESSING OVERLAY — staged AI analysis                                */}
      {/* ====================================================================== */}
      {step === 'form' && loading && (
        <AIProcessingOverlay
          overline="IndustryMatch · IA débouchés B2B"
          title="Analyse de votre flux industriel…"
          variant="dark"
          accent={GREEN}
          subtitle={
            <>
              L'IA qualifie votre rejet, croise la base{' '}
              <strong style={{ color: 'white' }}>preneurs B2B</strong> (cimenteries,
              plâtreries, agri, BTP) et calcule pour chacun la distance, la marge nette
              et le score de compatibilité.
            </>
          }
          steps={[
            { icon: Flame,     title: 'Qualification du rejet',          sub: 'Pureté · humidité · granulométrie · classe ADR' },
            { icon: Database,  title: 'Base preneurs B2B',               sub: '42 industriels · filtrage type + capacité' },
            { icon: Network,   title: 'GypsiFert + distance haversine',  sub: 'Dosage agri · coût logistique 0.14 DT/t·km' },
            { icon: Target,    title: 'Scoring & ranking',               sub: 'Marge nette · proximité · fiabilité contrat' }
          ]}
          durationMs={2200}
        />
      )}

      {/* ====================================================================== */}
      {/* STEP 1 — FORM                                                          */}
      {/* ====================================================================== */}
      {step === 'form' && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-12 gap-5"
        >
          {/* Form */}
          <div
            className="lg:col-span-7 p-7 rounded-3xl"
            style={{
              backgroundColor: 'white',
              border: `1px solid ${BORDER}`,
              boxShadow: '0 10px 40px rgba(15,26,19,0.05)'
            }}
          >
            <div
              className="flex items-center gap-2 mb-5"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                color: GREEN,
                letterSpacing: 2,
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              <Package size={12} />
              Déclaration de flux industriel
            </div>

            {/* Waste type chips */}
            <label className="block mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              <div
                className="mb-2.5"
                style={{
                  fontSize: 12,
                  color: CHARCOAL,
                  fontWeight: 700
                }}
              >
                Type de rejet à valoriser
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {INDUSTRY_WASTE_TYPES.map(w => {
                  const sel = input.type === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setInput(p => ({ ...p, type: w.id }))}
                      className="group relative flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all overflow-hidden"
                      style={{
                        backgroundColor: sel ? GREEN_SOFT : CREAM,
                        border: `1.5px solid ${sel ? GREEN : BORDER}`,
                        fontFamily: 'var(--font-display)',
                        fontSize: 12.5,
                        fontWeight: sel ? 700 : 600,
                        color: sel ? GREEN_DARK : CHARCOAL,
                        textAlign: 'left',
                        boxShadow: sel ? `0 6px 14px ${GREEN}22` : 'none',
                        transform: sel ? 'translateY(-1px)' : 'none'
                      }}
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: 'white',
                          border: `1px solid ${sel ? `${GREEN}50` : BORDER}`,
                          fontSize: 15
                        }}
                      >
                        {w.emoji}
                      </span>
                      <span className="flex-1 truncate">{w.label}</span>
                      {sel && (
                        <span
                          className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: GREEN }}
                        >
                          <Check size={9} color="white" strokeWidth={3.5} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </label>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Quantity */}
              <label className="block" style={{ fontFamily: 'var(--font-display)' }}>
                <div className="mb-2" style={{ fontSize: 12, color: CHARCOAL, fontWeight: 700 }}>
                  Quantité
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={input.quantity}
                    onChange={e =>
                      setInput(p => ({ ...p, quantity: Number(e.target.value) }))
                    }
                    className="w-full pl-3 pr-14 h-12 rounded-xl focus:outline-none"
                    style={{
                      backgroundColor: CREAM,
                      border: `1px solid ${BORDER}`,
                      fontFamily: 'var(--font-display)',
                      fontSize: 15,
                      fontWeight: 700,
                      color: CHARCOAL
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = GREEN)}
                    onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                      fontSize: 11.5,
                      color: MUTED,
                      fontWeight: 700,
                      letterSpacing: 1
                    }}
                  >
                    TONNES
                  </span>
                </div>
              </label>

              {/* Purity */}
              <label className="block" style={{ fontFamily: 'var(--font-display)' }}>
                <div
                  className="mb-2 flex items-center justify-between"
                  style={{ fontSize: 12, color: CHARCOAL, fontWeight: 700 }}
                >
                  <span>Pureté / qualité</span>
                  <span style={{ color: GREEN_DARK, fontWeight: 800 }}>
                    {input.purity}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={99}
                  step={1}
                  value={input.purity}
                  onChange={e =>
                    setInput(p => ({ ...p, purity: Number(e.target.value) }))
                  }
                  className="w-full h-12"
                  style={{
                    accentColor: GREEN,
                    backgroundColor: 'transparent'
                  }}
                />
              </label>

              {/* Zone */}
              <label className="block" style={{ fontFamily: 'var(--font-display)' }}>
                <div
                  className="mb-2 flex items-center gap-1.5"
                  style={{ fontSize: 12, color: CHARCOAL, fontWeight: 700 }}
                >
                  <MapPin size={12} style={{ color: MUTED }} />
                  Zone du site
                </div>
                <select
                  value={input.zone}
                  onChange={e => setInput(p => ({ ...p, zone: e.target.value }))}
                  className="w-full px-3 h-12 rounded-xl focus:outline-none"
                  style={{
                    backgroundColor: CREAM,
                    border: `1px solid ${BORDER}`,
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: CHARCOAL,
                    appearance: 'none'
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = GREEN)}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                >
                  {ZONES.map(z => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </label>
            </div>

            <button
              onClick={submit}
              disabled={loading || input.quantity <= 0}
              className="group mt-7 w-full inline-flex items-center justify-center gap-2 pl-5 pr-2 h-12 rounded-xl transition-transform hover:scale-[1.01] disabled:opacity-60"
              style={{
                backgroundColor: CHARCOAL,
                color: 'white',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700
              }}
            >
              <span className="pr-1">
                {loading ? 'IA en cours d\'analyse…' : 'Calculer & trouver mes preneurs B2B'}
              </span>
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:translate-x-0.5"
                style={{ backgroundColor: GREEN }}
              >
                <Sparkles size={15} color="white" />
              </span>
            </button>
          </div>

          {/* Live preview */}
          <div
            className="lg:col-span-5 p-7 rounded-3xl relative overflow-hidden"
            style={{
              backgroundColor: CHARCOAL,
              color: 'white'
            }}
          >
            <div
              className="absolute top-0 right-0 w-60 h-60 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${GREEN}55, transparent 70%)`,
                filter: 'blur(50px)',
                transform: 'translate(30%,-30%)'
              }}
            />
            <div className="relative">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10.5,
                  color: GREEN,
                  letterSpacing: 2.2,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 14
                }}
              >
                Estimation IA en direct
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <motion.span
                  key={value?.unitPrice}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 56,
                    fontWeight: 800,
                    color: 'white',
                    letterSpacing: '-0.04em',
                    lineHeight: 1
                  }}
                >
                  {value?.unitPrice}
                </motion.span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.6)',
                    fontWeight: 600
                  }}
                >
                  DT/t valeur secondaire
                </span>
              </div>
              <div
                className="mb-4"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12.5,
                  color: 'rgba(255,255,255,0.55)'
                }}
              >
                Modèle gradient boosting · pureté · marché secondaire local
              </div>

              {/* Purity gauge */}
              <div className="mb-6">
                <div
                  className="h-2 rounded-full overflow-hidden relative"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${GREEN_DARK}, ${GREEN}, #6FE38C)`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${input.purity}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                  {[60, 75, 88].map(t => (
                    <div
                      key={t}
                      className="absolute top-0 bottom-0 w-px"
                      style={{
                        left: `${t}%`,
                        backgroundColor: 'rgba(255,255,255,0.18)'
                      }}
                    />
                  ))}
                </div>
                <div
                  className="flex justify-between mt-1.5"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 9.5,
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 700,
                    letterSpacing: 1
                  }}
                >
                  <span>BAS</span>
                  <span>BTP</span>
                  <span>CIMENT</span>
                  <span>PLÂTRE</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { icon: CircleDollarSign, label: 'Valeur totale', value: `${value?.totalValue.toLocaleString('fr-FR') ?? 0} DT` },
                  { icon: Flame,            label: 'Conversion',    value: value?.waste.conversion ?? '—' },
                  { icon: Leaf,             label: 'CO₂ évité',     value: `${value?.co2Avoided ?? 0} t` },
                  { icon: Users,            label: 'Catégorie',     value: value?.waste.category ?? '—' }
                ].map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      <Icon size={14} style={{ color: GREEN, marginBottom: 6 }} />
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 10.5,
                          color: 'rgba(255,255,255,0.5)',
                          letterSpacing: 1.2,
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}
                      >
                        {m.label}
                      </div>
                      <div
                        className="mt-0.5 truncate"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 14.5,
                          color: 'white',
                          fontWeight: 700,
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {m.value}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className="p-4 rounded-2xl"
                style={{
                  backgroundColor: 'rgba(43,162,76,0.14)',
                  border: `1px solid ${GREEN}50`
                }}
              >
                <div
                  className="flex items-start gap-2.5"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 12.5,
                    color: 'white',
                    lineHeight: 1.45
                  }}
                >
                  <Sparkles size={14} style={{ color: GREEN, flexShrink: 0, marginTop: 2 }} />
                  <span>
                    <strong>Au lieu de payer la décharge</strong> ce flux peut générer{' '}
                    <span style={{ color: GREEN, fontWeight: 700 }}>
                      {value?.totalValue.toLocaleString('fr-FR') ?? 0} DT
                    </span>{' '}
                    + éviter{' '}
                    <span style={{ color: GREEN, fontWeight: 700 }}>
                      {value?.co2Avoided} t CO₂e
                    </span>
                    .
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ====================================================================== */}
      {/* STEP 2 — RESULTS                                                       */}
      {/* ====================================================================== */}
      {step === 'results' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div
            className="p-5 rounded-2xl flex items-center gap-4 flex-wrap"
            style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: GREEN_SOFT }}
            >
              <span style={{ fontSize: 22 }}>{value?.waste.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14.5,
                  fontWeight: 800,
                  color: CHARCOAL,
                  letterSpacing: '-0.01em'
                }}
              >
                {input.quantity} t · {value?.waste.label} · {input.zone}
              </div>
              <div
                className="mt-0.5"
                style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, color: MUTED }}
              >
                Pureté {input.purity}% · {value?.totalValue.toLocaleString('fr-FR')} DT valeur · {offers.length}{' '}
                preneur{offers.length > 1 ? 's' : ''} compatible{offers.length > 1 ? 's' : ''}
                {enriching && (
                  <span className="inline-flex items-center gap-1 ml-2" style={{ color: GREEN_DARK, fontWeight: 600 }}>
                    · GypsiFert IA en cours…
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: MUTED,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase'
                }}
              >
                Trier
              </span>
              <div
                className="flex items-center rounded-full p-1"
                style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}
              >
                {(['distance', 'price'] as IndustrySortKey[]).map(key => {
                  const on = sort === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSort(key)}
                      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full transition-colors"
                      style={{
                        backgroundColor: on ? CHARCOAL : 'transparent',
                        color: on ? 'white' : CHARCOAL,
                        fontFamily: 'var(--font-display)',
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      <ArrowUpDown size={11} />
                      {key === 'distance' ? 'Distance' : 'Prix net'}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full transition-colors"
              style={{
                backgroundColor: CREAM,
                border: `1px solid ${BORDER}`,
                fontFamily: 'var(--font-display)',
                fontSize: 12,
                fontWeight: 600,
                color: CHARCOAL
              }}
            >
              <X size={12} /> Modifier
            </button>
          </div>

          {offers.length === 0 ? (
            <EmptyMatches input={input} setInput={setInput} />
          ) : (
            <div className="space-y-3">
              {offers.map((o, i) => {
                const Icon = BUYER_ICON[o.buyer.type];
                const tone = BUYER_TYPE_TONE[o.buyer.type];
                return (
                  <motion.div
                    key={o.buyer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -2 }}
                    className="relative p-5 pl-7 rounded-2xl flex flex-col gap-4 transition-shadow overflow-hidden"
                    style={{
                      backgroundColor: 'white',
                      border: `1px solid ${i === 0 ? GREEN : BORDER}`,
                      boxShadow:
                        i === 0
                          ? `0 14px 40px ${GREEN}22, 0 0 0 1px ${GREEN}`
                          : '0 4px 16px rgba(15,26,19,0.04)'
                    }}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{
                        background:
                          i === 0
                            ? `linear-gradient(180deg, ${GREEN}, ${GREEN_DARK})`
                            : `${tone}80`
                      }}
                    />

                    <div className="grid lg:grid-cols-12 gap-4 items-center">
                    <div className="lg:col-span-4 flex items-start gap-3">
                      <div
                        className="relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: i === 0 ? GREEN : `${tone}1a`,
                          border: `1px solid ${i === 0 ? GREEN_DARK : `${tone}40`}`,
                          boxShadow: i === 0 ? `0 6px 14px ${GREEN}55` : 'none'
                        }}
                      >
                        <Icon size={18} style={{ color: i === 0 ? 'white' : tone }} />
                        <span
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: 'white',
                            border: `1.5px solid ${i === 0 ? GREEN : MUTED}`,
                            color: CHARCOAL,
                            fontSize: 10,
                            fontWeight: 800,
                            fontFamily: 'var(--font-display)'
                          }}
                        >
                          {i + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 15.5,
                              fontWeight: 800,
                              color: CHARCOAL,
                              letterSpacing: '-0.01em'
                            }}
                          >
                            {o.buyer.name}
                          </span>
                          {i === 0 && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: GREEN,
                                color: 'white',
                                fontFamily: 'var(--font-display)',
                                fontSize: 9.5,
                                fontWeight: 800,
                                letterSpacing: 1.2,
                                textTransform: 'uppercase'
                              }}
                            >
                              <Sparkles size={9} /> Top match IA
                            </span>
                          )}
                        </div>
                        <div
                          className="flex items-center gap-1.5"
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 12,
                            color: MUTED
                          }}
                        >
                          <span
                            className="px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${tone}1a`,
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: tone,
                              letterSpacing: 0.8,
                              textTransform: 'uppercase'
                            }}
                          >
                            {BUYER_TYPE_LABEL[o.buyer.type]}
                          </span>
                          <MapPin size={11} /> {o.buyer.city}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 grid grid-cols-3 gap-3">
                      <Stat label="Distance" value={`${o.distanceKm} km`} />
                      <Stat label="Prix" value={`${o.buyer.pricePerTon} DT/t`} />
                      <Stat
                        label="Revenu net"
                        value={`${o.netRevenue.toLocaleString('fr-FR')} DT`}
                        highlight
                      />
                    </div>

                    <div className="lg:col-span-3 flex flex-col gap-2 lg:items-end">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-24 h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'rgba(15,26,19,0.06)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${o.compatibility}%`,
                              backgroundColor: GREEN
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 12,
                            color: CHARCOAL,
                            fontWeight: 800
                          }}
                        >
                          {o.compatibility}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetailsOffer(o)}
                          className="px-3 h-9 rounded-lg transition-colors"
                          style={{
                            backgroundColor: CREAM,
                            border: `1px solid ${BORDER}`,
                            fontFamily: 'var(--font-display)',
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: CHARCOAL
                          }}
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => accept(o)}
                          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg transition-transform hover:scale-[1.03]"
                          style={{
                            backgroundColor: GREEN,
                            color: 'white',
                            fontFamily: 'var(--font-display)',
                            fontSize: 12.5,
                            fontWeight: 800,
                            boxShadow: `0 6px 14px ${GREEN}55`
                          }}
                        >
                          <Check size={13} />
                          Accepter
                        </button>
                      </div>
                    </div>
                    </div>{/* /.grid lg:grid-cols-12 — top row */}

                    {/* ─── Second row: demand + transport + agronomic chips ─── */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <OfferChip
                        icon={Package}
                        label={`Demande ${o.demandedTons.toLocaleString('fr-FR')} t · matché ${o.matchedTons.toLocaleString('fr-FR')} t`}
                        tone={o.matchedTons >= o.demandedTons ? GREEN : '#C8973A'}
                      />
                      <OfferChip
                        icon={Truck}
                        label={TRANSPORT_LABEL[o.transportBy]}
                        tone={
                          o.transportBy === 'buyer'
                            ? GREEN
                            : o.transportBy === 'shared'
                            ? '#C8973A'
                            : '#B44C4C'
                        }
                      />
                      {o.agronomic && (
                        <OfferChip
                          icon={Leaf}
                          label={`GypsiFert · ${o.agronomic.dosage_t_ha} t/ha · +${o.agronomic.yield_gain_percent}% · risque ${o.agronomic.risk_level}`}
                          tone={o.agronomic.risk_level === 'FAIBLE' ? GREEN_DARK : '#B44C4C'}
                        />
                      )}
                    </div>

                    {/* ─── Agronomic banner for the top match ─── */}
                    {o.agronomic && i === 0 && (
                      <AgronomicBanner agronomic={o.agronomic} buyerName={o.buyer.name} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ====================================================================== */}
      {/* STEP 3 — ACCEPTED + RECYCLERS                                          */}
      {/* ====================================================================== */}
      {step === 'accepted' && acceptedOffer && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div
            className="p-6 rounded-3xl flex items-center gap-5 flex-wrap relative overflow-hidden"
            style={{ backgroundColor: CHARCOAL, color: 'white' }}
          >
            <div
              className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${GREEN}55, transparent 70%)`,
                filter: 'blur(60px)',
                transform: 'translate(40%,-40%)'
              }}
            />
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 relative"
              style={{ backgroundColor: GREEN, boxShadow: `0 8px 20px ${GREEN}66` }}
            >
              <Check size={24} color="white" strokeWidth={3} />
            </div>
            <div className="relative flex-1 min-w-0">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: GREEN,
                  letterSpacing: 2.2,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 4
                }}
              >
                Offre acceptée · contrat pré-rempli
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'white',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2
                }}
              >
                {acceptedOffer.matchedTons} t → {acceptedOffer.buyer.name}
              </div>
              <div
                className="mt-1"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13.5,
                  color: 'rgba(255,255,255,0.75)'
                }}
              >
                Revenu net{' '}
                <span style={{ color: GREEN, fontWeight: 700 }}>
                  {acceptedOffer.netRevenue.toLocaleString('fr-FR')} DT
                </span>{' '}
                · CO₂ évité{' '}
                <span style={{ color: GREEN, fontWeight: 700 }}>
                  {acceptedOffer.co2Avoided} t
                </span>{' '}
                · Enlèvement sous 72 h
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl transition-transform hover:scale-[1.03] relative"
              style={{
                backgroundColor: GREEN,
                color: 'white',
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: 700
              }}
            >
              <Send size={13} /> Signer le contrat
            </button>
          </div>

          <div
            className="p-6 rounded-3xl"
            style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
          >
            <div className="mb-5">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: GREEN,
                  letterSpacing: 2.2,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: 8
                }}
              >
                Étape suivante · IA recommande
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 800,
                  color: CHARCOAL,
                  letterSpacing: '-0.02em'
                }}
              >
                Éco-recycleurs certifiés pour la fraction résiduelle
              </h3>
              <p
                className="mt-1"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  color: MUTED,
                  maxWidth: 640
                }}
              >
                Pour la part non-conforme aux preneurs (hors-spec, off-grade), ces
                opérateurs traitent, raffinent ou réorientent vers des filières
                secondaires homologuées.
              </p>
            </div>

            {recyclers.length === 0 ? (
              <div
                className="p-5 rounded-2xl"
                style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    color: MUTED
                  }}
                >
                  Aucun recycleur référencé pour ce flux — équipe sourcing notifiée.
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {recyclers.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i }}
                    whileHover={{ y: -3 }}
                    className="relative p-5 rounded-2xl flex flex-col gap-3 overflow-hidden"
                    style={{
                      backgroundColor: 'white',
                      border: `1px solid ${i === 0 ? `${GREEN}55` : BORDER}`,
                      boxShadow:
                        i === 0
                          ? `0 12px 32px ${GREEN}1f`
                          : '0 4px 14px rgba(15,26,19,0.04)'
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{
                        background:
                          i === 0
                            ? `linear-gradient(90deg, ${GREEN_DARK}, ${GREEN}, #6FE38C)`
                            : i === 1
                            ? `${GREEN}60`
                            : `${MUTED}60`
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: GREEN,
                          boxShadow: `0 6px 14px ${GREEN}55`
                        }}
                      >
                        <Recycle size={17} color="white" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {i === 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: GREEN,
                              color: 'white',
                              fontFamily: 'var(--font-display)',
                              fontSize: 9.5,
                              fontWeight: 800,
                              letterSpacing: 1,
                              textTransform: 'uppercase'
                            }}
                          >
                            <Sparkles size={9} /> Recommandé
                          </span>
                        )}
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: GOLD_SOFT,
                            color: '#9A6B10',
                            fontFamily: 'var(--font-display)',
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: 1,
                            textTransform: 'uppercase'
                          }}
                        >
                          <BadgeCheck size={10} /> Certifié
                        </span>
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 15,
                          fontWeight: 800,
                          color: CHARCOAL,
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {r.name}
                      </div>
                      <div
                        className="flex items-center gap-1.5 mt-0.5"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 12,
                          color: MUTED
                        }}
                      >
                        <MapPin size={11} /> {r.city}
                      </div>
                    </div>
                    <div
                      className="p-3 rounded-xl"
                      style={{
                        backgroundColor: CREAM,
                        border: `1px solid ${BORDER}`
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 10.5,
                          color: GREEN,
                          fontWeight: 700,
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                          marginBottom: 4
                        }}
                      >
                        Procédé
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 12.5,
                          color: CHARCOAL,
                          lineHeight: 1.4,
                          fontWeight: 500
                        }}
                      >
                        {r.process}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 11.5,
                        color: MUTED,
                        lineHeight: 1.4
                      }}
                    >
                      {r.certification}
                    </div>
                    <button
                      onClick={() => selectRecycler(r)}
                      className="mt-auto w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl transition-transform hover:scale-[1.02]"
                      style={{
                        backgroundColor: i === 0 ? GREEN : 'white',
                        border: `1.5px solid ${GREEN}`,
                        color: i === 0 ? 'white' : GREEN_DARK,
                        fontFamily: 'var(--font-display)',
                        fontSize: 12.5,
                        fontWeight: 800,
                        boxShadow: i === 0 ? `0 6px 14px ${GREEN}55` : 'none'
                      }}
                    >
                      <Check size={12} /> Choisir ce recycleur
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ====================================================================== */}
      {/* STEP 4 — CLOSED LOOP                                                   */}
      {/* ====================================================================== */}
      {step === 'closed' && acceptedOffer && selectedRecycler && value && (() => {
        const today = new Date();
        const pickupDate = new Date(today.getTime() + 2 * 24 * 3600 * 1000);
        const deliveryDate = new Date(today.getTime() + 5 * 24 * 3600 * 1000);
        const reportDate = new Date(today.getTime() + 30 * 24 * 3600 * 1000);
        const grossRevenue = acceptedOffer.netRevenue;
        const landfillSaved = Math.round(input.quantity * 35);
        const co2Avoided = acceptedOffer.co2Avoided;
        const symbioDelta = Math.min(18, Math.round(input.quantity / 30 + 4));

        const timeline = [
          {
            icon: FileSignature,
            date: formatDate(today),
            title: 'Contrat signé électroniquement',
            sub: `Réf ${contract} · DocuSign · parties notifiées`,
            done: true
          },
          {
            icon: CalendarCheck,
            date: formatDate(pickupDate),
            title: `Enlèvement zone ${input.zone}`,
            sub: `${acceptedOffer.matchedTons} t · transporteur Sotrapil agréé ANGed`,
            done: true
          },
          {
            icon: Truck,
            date: formatDate(new Date(pickupDate.getTime() + 24 * 3600 * 1000)),
            title: `En route vers ${acceptedOffer.buyer.name}`,
            sub: `${acceptedOffer.distanceKm} km · suivi GPS · BSD numérique`,
            done: false
          },
          {
            icon: Building2,
            date: formatDate(deliveryDate),
            title: 'Livraison & contrôle qualité',
            sub: 'Pesée contradictoire + analyse pureté · paiement J+30',
            done: false
          },
          {
            icon: TrendingUp,
            date: formatDate(reportDate),
            title: 'Rapport ESG trimestriel généré',
            sub: 'Indicateurs intégrés au reporting CSRD · partage ANGed',
            done: false
          }
        ];

        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div
              className="p-8 rounded-3xl relative overflow-hidden"
              style={{ backgroundColor: CHARCOAL, color: 'white' }}
            >
              <div
                className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${GREEN}66, transparent 70%)`,
                  filter: 'blur(70px)',
                  transform: 'translate(35%,-35%)'
                }}
              />
              <div className="relative flex items-center gap-5 flex-wrap mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: GREEN, boxShadow: `0 10px 26px ${GREEN}66` }}
                >
                  <Trophy size={26} color="white" strokeWidth={2.4} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 11,
                      color: GREEN,
                      letterSpacing: 2.2,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: 6
                    }}
                  >
                    Boucle circulaire fermée · Contrat {contract}
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(24px, 2.8vw, 34px)',
                      fontWeight: 800,
                      color: 'white',
                      letterSpacing: '-0.025em',
                      lineHeight: 1.1
                    }}
                  >
                    Bravo — vos rejets deviennent ressource.
                  </h3>
                  <p
                    className="mt-2 max-w-xl"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.75)',
                      lineHeight: 1.6
                    }}
                  >
                    {input.quantity} t de {value.waste.label.toLowerCase()} → valorisés chez{' '}
                    <span style={{ color: 'white', fontWeight: 700 }}>
                      {acceptedOffer.buyer.name}
                    </span>
                    , fraction résiduelle traitée par{' '}
                    <span style={{ color: 'white', fontWeight: 700 }}>{selectedRecycler.name}</span>. Zéro décharge.
                  </p>
                </div>
              </div>

              <div className="relative grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { icon: CircleDollarSign, label: 'Revenu net',       value: `${grossRevenue.toLocaleString('fr-FR')} DT` },
                  { icon: Package,          label: 'Coût décharge évité', value: `${landfillSaved.toLocaleString('fr-FR')} DT` },
                  { icon: Leaf,             label: 'CO₂ évité',         value: `${co2Avoided} t` },
                  { icon: Zap,              label: 'Énergie 2ⁿᵈᵉ vie',  value: `${Math.round(input.quantity * 0.4)} MWh` },
                  { icon: TrendingUp,       label: 'SymbioScore',       value: `+${symbioDelta}` }
                ].map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="p-4 rounded-2xl"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(12px)'
                      }}
                    >
                      <Icon size={16} style={{ color: GREEN, marginBottom: 8 }} />
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 10,
                          color: 'rgba(255,255,255,0.55)',
                          letterSpacing: 1.4,
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                      >
                        {m.label}
                      </div>
                      <div
                        className="mt-1"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 20,
                          color: 'white',
                          fontWeight: 800,
                          letterSpacing: '-0.02em'
                        }}
                      >
                        {m.value}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
              <div
                className="lg:col-span-3 p-6 rounded-3xl"
                style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    color: GREEN,
                    letterSpacing: 2.2,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: 8
                  }}
                >
                  Suivi BSD numérique en temps réel
                </div>
                <h4
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 800,
                    color: CHARCOAL,
                    letterSpacing: '-0.02em',
                    marginBottom: 20
                  }}
                >
                  Du site industriel à la valorisation
                </h4>

                <ol className="relative space-y-4">
                  <div
                    className="absolute left-[17px] top-3 bottom-3 w-px"
                    style={{ backgroundColor: 'rgba(15,26,19,0.1)' }}
                  />
                  {timeline.map((t, i) => {
                    const Icon = t.icon;
                    return (
                      <li key={i} className="relative flex gap-4">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                          style={{
                            backgroundColor: t.done ? GREEN : 'white',
                            border: `2px solid ${t.done ? GREEN : BORDER}`,
                            color: t.done ? 'white' : MUTED
                          }}
                        >
                          <Icon size={14} strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 13.5,
                                fontWeight: 800,
                                color: CHARCOAL,
                                letterSpacing: '-0.01em'
                              }}
                            >
                              {t.title}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: t.done ? GREEN_SOFT : CREAM,
                                color: t.done ? GREEN_DARK : MUTED,
                                fontFamily: 'var(--font-display)',
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: 1,
                                textTransform: 'uppercase'
                              }}
                            >
                              {t.done ? 'Fait' : t.date}
                            </span>
                          </div>
                          <div
                            className="mt-0.5"
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 12.5,
                              color: MUTED,
                              lineHeight: 1.45
                            }}
                          >
                            {t.sub}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div
                className="lg:col-span-2 p-6 rounded-3xl flex flex-col gap-4"
                style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 11,
                      color: GREEN,
                      letterSpacing: 2.2,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: 6
                    }}
                  >
                    Résumé du contrat
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      fontWeight: 800,
                      color: CHARCOAL,
                      letterSpacing: '-0.02em'
                    }}
                  >
                    Tout est en règle
                  </h4>
                </div>

                <div className="space-y-2">
                  {[
                    { k: 'Référence',  v: contract },
                    { k: 'Flux',       v: `${input.quantity} t · ${value.waste.label}` },
                    { k: 'Preneur',    v: acceptedOffer.buyer.name },
                    { k: 'Recycleur',  v: selectedRecycler.name },
                    { k: 'Paiement',   v: 'Virement · J+30' },
                    { k: 'Traçabilité', v: 'BSD + blockchain' }
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 py-2"
                      style={{
                        borderBottom:
                          i < 5 ? '1px dashed rgba(15,26,19,0.1)' : 'none',
                        fontFamily: 'var(--font-display)',
                        fontSize: 12.5
                      }}
                    >
                      <span style={{ color: MUTED, fontWeight: 600 }}>{row.k}</span>
                      <span
                        style={{
                          color: CHARCOAL,
                          fontWeight: 700,
                          textAlign: 'right',
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {row.v}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className="mt-2 inline-flex items-center justify-center gap-2 h-11 rounded-xl transition-transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: CHARCOAL,
                    color: 'white',
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    fontWeight: 800
                  }}
                >
                  <Download size={14} /> Bilan PDF + BSD
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 h-11 rounded-xl transition-colors"
                  style={{
                    backgroundColor: 'white',
                    border: `1px solid ${BORDER}`,
                    color: CHARCOAL,
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    fontWeight: 700
                  }}
                >
                  <Send size={13} /> Pousser vers reporting CSRD
                </button>
              </div>
            </div>

            <div
              className="p-6 rounded-3xl flex items-center justify-between gap-4 flex-wrap"
              style={{
                backgroundColor: GREEN_SOFT,
                border: `1px solid ${GREEN}40`
              }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'white', border: `1px solid ${GREEN}40` }}
                >
                  <Sparkles size={18} style={{ color: GREEN_DARK }} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14.5,
                      fontWeight: 800,
                      color: CHARCOAL,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Un autre flux à valoriser ?
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 12.5,
                      color: GREEN_DARK,
                      marginTop: 2
                    }}
                  >
                    Chaque contrat améliore votre score circulaire et vos taxes environnementales.
                  </div>
                </div>
              </div>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-5 h-11 rounded-xl transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: GREEN,
                  color: 'white',
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  fontWeight: 800,
                  boxShadow: `0 6px 16px ${GREEN}66`
                }}
              >
                Déclarer un nouveau flux <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        );
      })()}

      {/* Details modal */}
      <AnimatePresence>
        {detailsOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailsOffer(null)}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(15,26,19,0.6)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ y: 20, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.98 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xl rounded-3xl p-7 relative"
              style={{ backgroundColor: 'white' }}
            >
              <button
                onClick={() => setDetailsOffer(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: CREAM }}
              >
                <X size={15} />
              </button>
              {(() => {
                const Icon = BUYER_ICON[detailsOffer.buyer.type];
                const tone = BUYER_TYPE_TONE[detailsOffer.buyer.type];
                return (
                  <>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{
                        backgroundColor: `${tone}1a`,
                        border: `1px solid ${tone}40`
                      }}
                    >
                      <Icon size={20} style={{ color: tone }} />
                    </div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 22,
                        fontWeight: 800,
                        color: CHARCOAL,
                        letterSpacing: '-0.02em',
                        marginBottom: 4
                      }}
                    >
                      {detailsOffer.buyer.name}
                    </h3>
                    <div
                      className="flex items-center gap-1.5 mb-4"
                      style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, color: MUTED }}
                    >
                      <MapPin size={12} /> {detailsOffer.buyer.city} · {detailsOffer.distanceKm} km · {BUYER_TYPE_LABEL[detailsOffer.buyer.type]}
                    </div>
                  </>
                );
              })()}

              <p
                className="mb-5 p-4 rounded-2xl"
                style={{
                  backgroundColor: CREAM,
                  fontFamily: 'var(--font-display)',
                  fontSize: 13.5,
                  color: CHARCOAL,
                  lineHeight: 1.55
                }}
              >
                {detailsOffer.buyer.description}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <Stat label="Pureté min" value={`${detailsOffer.buyer.minPurity}%`} />
                <Stat
                  label="Volumes acceptés"
                  value={`${detailsOffer.buyer.minTons}–${detailsOffer.buyer.maxTons} t`}
                />
                <Stat label="Prix brut" value={`${detailsOffer.buyer.pricePerTon} DT/t`} />
                <Stat
                  label="Transport estimé"
                  value={`${detailsOffer.transportCost.toLocaleString('fr-FR')} DT`}
                />
              </div>

              <div
                className="p-3 rounded-xl mb-5 flex items-start gap-2"
                style={{ backgroundColor: GOLD_SOFT }}
              >
                <BadgeCheck size={14} style={{ color: '#9A6B10', flexShrink: 0, marginTop: 2 }} />
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 12.5,
                    color: CHARCOAL,
                    lineHeight: 1.45
                  }}
                >
                  {detailsOffer.buyer.certification}
                </span>
              </div>

              <div className="space-y-1.5 mb-5">
                <ContactRow icon={Phone} value={detailsOffer.buyer.contactPhone} href={`tel:${detailsOffer.buyer.contactPhone}`} />
                <ContactRow icon={Mail} value={detailsOffer.buyer.contactEmail} href={`mailto:${detailsOffer.buyer.contactEmail}`} />
                <ContactRow icon={Globe} value="Fiche entreprise officielle" href="#" />
              </div>

              <button
                onClick={() => {
                  const o = detailsOffer;
                  setDetailsOffer(null);
                  accept(o);
                }}
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl transition-transform hover:scale-[1.01]"
                style={{
                  backgroundColor: GREEN,
                  color: 'white',
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 800,
                  boxShadow: `0 8px 20px ${GREEN}55`
                }}
              >
                <Check size={15} /> Accepter cette offre
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ============================== helpers ==============================

function Stat({
  label,
  value,
  highlight
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="p-2.5 rounded-xl"
      style={{
        backgroundColor: highlight ? GREEN_SOFT : CREAM,
        border: `1px solid ${highlight ? `${GREEN}35` : BORDER}`
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          color: MUTED,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: 2
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          color: highlight ? GREEN_DARK : CHARCOAL,
          fontWeight: 800,
          letterSpacing: '-0.01em'
        }}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyMatches({
  input,
  setInput
}: {
  input: IndustryWasteInput;
  setInput: (v: IndustryWasteInput) => void;
}) {
  const near = useMemo(() => nearMatchBuyers(input, 3), [input]);
  return (
    <div
      className="p-6 rounded-2xl"
      style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#FEF3DC' }}
        >
          <Sparkles size={18} style={{ color: '#C8973A' }} />
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 800,
              color: CHARCOAL,
              marginBottom: 3
            }}
          >
            Aucun preneur ne matche vos paramètres actuels
          </div>
          <div
            style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}
          >
            Voici les preneurs les plus proches — un clic applique la pureté ou la quantité
            minimale requise pour les débloquer.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {near.length === 0 && (
          <div
            className="p-4 rounded-xl text-center"
            style={{ backgroundColor: CREAM, fontFamily: 'var(--font-display)', fontSize: 13, color: MUTED }}
          >
            Aucun preneur connu n'accepte ce type de rejet. Essayez un autre type.
          </div>
        )}
        {near.map(g => {
          const Icon = BUYER_ICON[g.buyer.type];
          const tone = BUYER_TYPE_TONE[g.buyer.type];
          const needPurity = g.purityGap > 0;
          const needTons = g.tonsGap > 0;
          return (
            <div
              key={g.buyer.id}
              className="p-4 rounded-xl flex items-center gap-3 flex-wrap"
              style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${tone}1a`, border: `1px solid ${tone}40` }}
              >
                <Icon size={15} style={{ color: tone }} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13.5,
                    color: CHARCOAL,
                    fontWeight: 700
                  }}
                >
                  {g.buyer.name}
                </div>
                <div
                  className="flex items-center gap-1.5"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 11.5, color: MUTED }}
                >
                  <MapPin size={10} /> {g.buyer.city} · {g.buyer.distanceKm} km · {g.buyer.pricePerTon} DT/t
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {needPurity && (
                  <button
                    onClick={() => setInput({ ...input, purity: g.suggestedPurity })}
                    className="px-3 h-8 rounded-lg inline-flex items-center gap-1.5"
                    style={{
                      backgroundColor: '#FEF3DC',
                      border: '1px solid rgba(200,151,58,0.4)',
                      color: '#8A6220',
                      fontFamily: 'var(--font-display)',
                      fontSize: 11.5,
                      fontWeight: 700
                    }}
                  >
                    + {g.purityGap} pts pureté · → {g.suggestedPurity}%
                  </button>
                )}
                {needTons && (
                  <button
                    onClick={() => setInput({ ...input, quantity: g.suggestedTons })}
                    className="px-3 h-8 rounded-lg inline-flex items-center gap-1.5"
                    style={{
                      backgroundColor: '#F2F5FA',
                      border: '1px solid rgba(31,58,95,0.3)',
                      color: '#1F3A5F',
                      fontFamily: 'var(--font-display)',
                      fontSize: 11.5,
                      fontWeight: 700
                    }}
                  >
                    + {g.tonsGap} t · → {g.suggestedTons} t
                  </button>
                )}
                {!needPurity && !needTons && (
                  <span
                    className="px-3 h-8 rounded-lg inline-flex items-center gap-1.5"
                    style={{
                      backgroundColor: GREEN_SOFT,
                      color: GREEN_DARK,
                      fontFamily: 'var(--font-display)',
                      fontSize: 11.5,
                      fontWeight: 700
                    }}
                  >
                    Éligible
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OfferChip({
  icon: Icon,
  label,
  tone
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  tone: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: `${tone}14`,
        border: `1px solid ${tone}33`,
        color: tone,
        fontFamily: 'var(--font-display)',
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: 0.2
      }}
    >
      <Icon size={12} color={tone} />
      {label}
    </span>
  );
}

function AgronomicBanner({
  agronomic,
  buyerName
}: {
  agronomic: NonNullable<BuyerOffer['agronomic']>;
  buyerName: string;
}) {
  const riskOk = agronomic.risk_level === 'FAIBLE';
  const riskColor = riskOk ? GREEN : '#B44C4C';
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: `linear-gradient(135deg, ${GREEN_SOFT}, rgba(255,255,255,0.6))`,
        border: `1px solid ${GREEN}33`
      }}
    >
      <div
        className="flex items-center gap-2 mb-3"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: GREEN, color: 'white' }}
        >
          <Sparkles size={14} />
        </div>
        <span
          style={{
            fontSize: 10.5,
            color: GREEN_DARK,
            letterSpacing: 1.8,
            fontWeight: 800,
            textTransform: 'uppercase'
          }}
        >
          GypsiFert IA · XGBoost × 3 + SHAP
        </span>
        <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>
          · prédiction sur la parcelle {buyerName}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <AgroTile
          label="Dosage optimal"
          value={`${agronomic.dosage_t_ha}`}
          unit="t/ha"
          accent={GREEN_DARK}
        />
        <AgroTile
          label="Gain rendement"
          value={`+${agronomic.yield_gain_percent}`}
          unit="%"
          accent={GREEN_DARK}
        />
        <AgroTile
          label="Risque Cd/Pb"
          value={agronomic.risk_level}
          unit=""
          accent={riskColor}
        />
      </div>

      {agronomic.top_shap.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5 mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span
            style={{
              fontSize: 10,
              color: MUTED,
              letterSpacing: 1.4,
              fontWeight: 700,
              textTransform: 'uppercase',
              marginRight: 4
            }}
          >
            SHAP · drivers
          </span>
          {agronomic.top_shap.slice(0, 4).map((s, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded"
              style={{
                backgroundColor: 'white',
                border: `1px solid ${BORDER}`,
                fontSize: 11,
                color: CHARCOAL,
                fontWeight: 600
              }}
            >
              {s.feature}{' '}
              <span style={{ color: s.value > 0 ? GREEN_DARK : '#B44C4C', fontWeight: 700 }}>
                {s.direction}
              </span>
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12.5,
          color: CHARCOAL,
          lineHeight: 1.5
        }}
      >
        {agronomic.message}
      </div>
    </div>
  );
}

function AgroTile({
  label,
  value,
  unit,
  accent
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <div
      className="p-2.5 rounded-lg"
      style={{
        backgroundColor: 'white',
        border: `1px solid ${BORDER}`
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 9.5,
          color: MUTED,
          letterSpacing: 1.4,
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: 2
        }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            color: accent,
            fontWeight: 800,
            letterSpacing: '-0.02em'
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              color: MUTED,
              fontWeight: 600
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  value,
  href
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2"
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 12.5,
        color: CHARCOAL,
        fontWeight: 500
      }}
    >
      <Icon size={13} style={{ color: MUTED }} />
      {value}
    </a>
  );
}
