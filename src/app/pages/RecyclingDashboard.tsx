import {
  ArrowRight,
  CheckCircle2,
  Factory,
  FileCheck,
  Leaf,
  MapPin,
  Package,
  Recycle,
  Scale,
  Sparkles,
  Sprout,
  Truck
} from 'lucide-react';
import { motion } from 'motion/react';
import { IMG_RECYCLING_PLANT, IMG_HERO } from '../lib/images';
import { StickyPillNav, SectionHeader, MetricCard, GreenPillButton } from '../components/DashboardShell';
import { AdminFab } from '../components/AdminFab';
import { matchFactories, WASTE_TYPES, type WasteTypeId } from '../lib/biomatch';

const GREEN = '#2BA24C';
const GREEN_SOFT = '#E6F4EA';
const CHARCOAL = '#0F1A13';
const MUTED = '#98A29A';
const CREAM = '#F7F5F0';

export function RecyclingDashboard() {
  const metrics = [
    { label: 'Flux sécurisés', value: '48', unit: 't/mois', trend: '+14 t vs dernier trim.', tone: 'up' as const },
    { label: 'CO₂ évité', value: '86', unit: 'tCO₂eq', trend: 'Équiv. 1 900 voitures/jour', tone: 'up' as const },
    { label: 'Taux remplissage flotte', value: '78', unit: '%', trend: '+12 pts via planning IA', tone: 'up' as const },
    { label: 'Part Shapley', value: '20', unit: '%', trend: 'Dans la symbiose trimestrielle', tone: 'neutral' as const }
  ];

  const inflows = [
    {
      code: 'LoW 07 02 13',
      type: 'Plastique HDPE',
      volume: '12 t',
      source: 'GCT · Ligne emballage',
      distance: '18 km',
      price: '−35 DT/t',
      co2: '1,8 tCO₂eq',
      match: 'Fort'
    },
    {
      code: 'LoW 19 08 13',
      type: 'Boues de station',
      volume: '4 t',
      source: 'Cimenterie Gabès',
      distance: '12 km',
      price: '−42 DT/t',
      co2: '0,6 tCO₂eq',
      match: 'Fort'
    },
    {
      code: 'LoW 17 04 05',
      type: 'Métaux ferreux',
      volume: '2,4 t',
      source: 'Chimie Gabès',
      distance: '9 km',
      price: '+18 DT/t',
      co2: '2,1 tCO₂eq',
      match: 'Parfait'
    },
    {
      code: 'LoW 15 01 02',
      type: 'Emballages PET',
      volume: '0,9 t',
      source: 'Agroalimentaire Métouia',
      distance: '26 km',
      price: '−12 DT/t',
      co2: '0,3 tCO₂eq',
      match: 'Moyen'
    }
  ];

  const tours = [
    { window: '06:00 – 10:30', zone: 'Zone industrielle Ghannouch', stops: 4, load: '8,2 t', status: 'Prévu' },
    { window: '11:00 – 14:00', zone: 'Chenini · Métouia', stops: 3, load: '5,6 t', status: 'En cours' },
    { window: '15:00 – 18:30', zone: 'Mareth · El Hamma', stops: 5, load: '6,4 t', status: 'Planifié' }
  ];

  // ============== Matching agriculteurs ↔ industriels existants ==============
  // On réutilise le moteur BioMatch (matchFactories) avec les lots
  // d'agriculteurs réels de la région pour afficher au recycleur les
  // flux actifs dans la symbiose.
  type FarmerLot = {
    id: string;
    farmer: string;
    zone: string;
    type: WasteTypeId;
    quantity: number;
    status: 'Signé' | 'En négociation' | 'Proposé';
  };
  const farmerLots: FarmerLot[] = [
    { id: 'F-1024', farmer: 'Coop. Oléicole Chenini',     zone: 'Chenini',    type: 'olive_pomace',  quantity: 38, status: 'Signé' },
    { id: 'F-1025', farmer: 'Ferme El Hamma Nord',        zone: 'El Hamma',   type: 'palm_fronds',   quantity: 22, status: 'En négociation' },
    { id: 'F-1026', farmer: 'GDA Mareth Sud',             zone: 'Mareth',     type: 'tomato_stems',  quantity: 14, status: 'Signé' },
    { id: 'F-1027', farmer: 'Palmeraie Ouedhref',         zone: 'Ouedhref',   type: 'date_seeds',    quantity: 18, status: 'Proposé' },
    { id: 'F-1028', farmer: 'Coop. Céréalière Métouia',   zone: 'Métouia',    type: 'wheat_straw',   quantity: 45, status: 'Signé' }
  ];

  const activeMatches = farmerLots
    .map(lot => {
      const offers = matchFactories({ type: lot.type, quantity: lot.quantity, zone: lot.zone }, 'price');
      const best = offers[0];
      const wasteMeta = WASTE_TYPES.find(w => w.id === lot.type);
      return best && wasteMeta ? { lot, best, wasteMeta } : null;
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: CREAM, color: CHARCOAL, fontFamily: 'var(--font-display)' }}
    >
      <StickyPillNav variant="light" />
      <AdminFab />

      {/* ============== HERO ============== */}
      <section
        className="relative w-full overflow-hidden"
        style={{ minHeight: 560, paddingTop: 120 }}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={IMG_RECYCLING_PLANT}
            alt=""
            aria-hidden
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.05) brightness(0.7)' }}
            onError={e => {
              if (e.currentTarget.src !== IMG_HERO) e.currentTarget.src = IMG_HERO;
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(15,26,19,0.4) 0%, rgba(15,26,19,0.6) 55%, rgba(15,26,19,0.9) 100%)'
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
            fontSize: 340,
            color: 'white',
            opacity: 0.05,
            lineHeight: 1,
            fontWeight: 700
          }}
        >
          تدوير
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
              <Recycle size={13} style={{ color: GREEN }} />
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
                Espace recycleur · Ecocycle Sfax
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
              Un approvisionnement{' '}
              <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 800 }}>
                prévisible
              </span>
              <br />
              et pré-caractérisé.
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
              Les déchets industriels non-valorisables par l'agriculture arrivent chez vous déjà classés, quantifiés, tracés. L'IA optimise distance, coût et CO₂ évité — vous optimisez votre ligne.
            </p>

            <div className="mt-10 flex items-center gap-4 flex-wrap">
              <GreenPillButton>Valider un contrat</GreenPillButton>
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
                  Rayon 50 km · 18 partenaires industriels
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

      {/* ============== METRICS ============== */}
      <section className="relative -mt-12 z-10 pb-20">
        <div className="container mx-auto px-6 lg:px-12">
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

      {/* ============== RECYCLEMATCH — INFLOWS TABLE ============== */}
      <section className="py-24" style={{ backgroundColor: CHARCOAL }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-10 items-end mb-12">
            <div className="lg:col-span-7">
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
                Module RecycleMatch · flux proposés
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(30px, 3.5vw, 48px)',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  color: 'white',
                  letterSpacing: '-0.03em'
                }}
              >
                Plastiques, métaux, boues —{' '}
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                  déjà classés code LoW.
                </span>
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1.6
                }}
              >
                ViT + XGBoost classifient chaque flux industriel. Un GNN bipartite + NSGA-II proposent le front de Pareto : distance, coût net, CO₂ évité. Vous choisissez, un contrat-type LLM est généré.
              </p>
            </div>
          </div>

          <div
            className="rounded-3xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div
              className="grid grid-cols-12 gap-4 px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              {[
                { l: 'Flux', cls: 'col-span-3' },
                { l: 'Code LoW', cls: 'col-span-2' },
                { l: 'Volume', cls: 'col-span-1' },
                { l: 'Source', cls: 'col-span-3' },
                { l: 'Coût net', cls: 'col-span-1' },
                { l: 'CO₂ évité', cls: 'col-span-1' },
                { l: 'Match', cls: 'col-span-1' }
              ].map((h, i) => (
                <div
                  key={i}
                  className={h.cls}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 10.5,
                    color: 'rgba(255,255,255,0.55)',
                    letterSpacing: 2,
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  {h.l}
                </div>
              ))}
            </div>

            {inflows.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="grid grid-cols-12 gap-4 px-6 py-5 items-center transition-colors hover:bg-white/5"
                style={{
                  borderBottom:
                    i < inflows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                }}
              >
                <div className="col-span-3 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${GREEN}22`,
                      border: `1px solid ${GREEN}40`
                    }}
                  >
                    <Package size={14} style={{ color: GREEN }} />
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    {r.type}
                  </span>
                </div>
                <div
                  className="col-span-2"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.6)',
                    fontWeight: 500,
                    letterSpacing: 0.5
                  }}
                >
                  {r.code}
                </div>
                <div
                  className="col-span-1"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  {r.volume}
                </div>
                <div
                  className="col-span-3"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13.5,
                    color: 'rgba(255,255,255,0.75)'
                  }}
                >
                  {r.source}
                  <div
                    className="mt-0.5"
                    style={{
                      fontSize: 11.5,
                      color: 'rgba(255,255,255,0.45)'
                    }}
                  >
                    {r.distance}
                  </div>
                </div>
                <div
                  className="col-span-1"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    color: r.price.startsWith('+') ? GREEN : '#E0A23A',
                    fontWeight: 700
                  }}
                >
                  {r.price}
                </div>
                <div
                  className="col-span-1"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.85)'
                  }}
                >
                  {r.co2}
                </div>
                <div className="col-span-1 flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor:
                        r.match === 'Parfait'
                          ? `${GREEN}22`
                          : r.match === 'Fort'
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(224,162,58,0.18)',
                      color:
                        r.match === 'Parfait'
                          ? GREEN
                          : r.match === 'Fort'
                          ? 'white'
                          : '#E0A23A',
                      fontFamily: 'var(--font-display)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: 1.3,
                      textTransform: 'uppercase'
                    }}
                  >
                    {r.match}
                  </span>
                  <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== AGRICULTEURS ↔ INDUSTRIELS — MATCHS ACTIFS ============== */}
      <section className="py-24" style={{ backgroundColor: CREAM }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-10 items-end mb-12">
            <div className="lg:col-span-7">
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
                Module BioMatch · symbiose active
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
                Matching agriculteurs{' '}
                <span style={{ color: MUTED }}>↔ industriels</span>
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  color: '#5A5A5E',
                  lineHeight: 1.6
                }}
              >
                Lots de biomasse déjà appariés par le moteur BioMatch avec les usines preneuses du réseau. Vous suivez les flux en amont — logistique, contrats et Shapley suivent automatiquement.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {activeMatches.map((m, i) => {
              const statusTone =
                m.lot.status === 'Signé'
                  ? { bg: GREEN_SOFT, color: GREEN }
                  : m.lot.status === 'En négociation'
                  ? { bg: '#FEF3DC', color: '#9A6B10' }
                  : { bg: 'rgba(15,26,19,0.06)', color: CHARCOAL };
              return (
                <motion.div
                  key={m.lot.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="p-6 rounded-3xl"
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid rgba(15,26,19,0.06)',
                    boxShadow: '0 6px 24px rgba(15,26,19,0.04)'
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
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
                      Lot {m.lot.id}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: statusTone.bg,
                        color: statusTone.color,
                        fontFamily: 'var(--font-display)',
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: 1.3,
                        textTransform: 'uppercase'
                      }}
                    >
                      {m.lot.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Farmer side */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: GREEN_SOFT }}
                        >
                          <Sprout size={14} style={{ color: GREEN }} />
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 10.5,
                            color: MUTED,
                            letterSpacing: 1.5,
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}
                        >
                          Agriculteur
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 15,
                          fontWeight: 700,
                          color: CHARCOAL,
                          letterSpacing: '-0.01em',
                          lineHeight: 1.25
                        }}
                      >
                        {m.lot.farmer}
                      </div>
                      <div
                        className="mt-1 flex items-center gap-1"
                        style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: MUTED }}
                      >
                        <MapPin size={11} />
                        {m.lot.zone}
                      </div>
                    </div>

                    <ArrowRight size={18} style={{ color: MUTED, flexShrink: 0 }} />

                    {/* Industrial side */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(123,180,224,0.18)' }}
                        >
                          <Factory size={14} style={{ color: '#2E6E9C' }} />
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 10.5,
                            color: MUTED,
                            letterSpacing: 1.5,
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}
                        >
                          Industriel preneur
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 15,
                          fontWeight: 700,
                          color: CHARCOAL,
                          letterSpacing: '-0.01em',
                          lineHeight: 1.25
                        }}
                      >
                        {m.best.factory.name}
                      </div>
                      <div
                        className="mt-1 flex items-center gap-1"
                        style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: MUTED }}
                      >
                        <MapPin size={11} />
                        {m.best.factory.city}
                      </div>
                    </div>
                  </div>

                  {/* Flux details */}
                  <div
                    className="mt-5 pt-5 grid grid-cols-4 gap-3"
                    style={{ borderTop: '1px solid rgba(15,26,19,0.06)' }}
                  >
                    {[
                      { label: 'Flux', value: `${m.wasteMeta.emoji} ${m.wasteMeta.label}` },
                      { label: 'Volume', value: `${m.lot.quantity} t` },
                      { label: 'Revenu net', value: `${m.best.netRevenue.toLocaleString('fr-FR')} DT` },
                      { label: 'Compatibilité', value: `${m.best.compatibility} %` }
                    ].map((f, j) => (
                      <div key={j}>
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
                          {f.label}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 13.5,
                            color: CHARCOAL,
                            fontWeight: 700,
                            letterSpacing: '-0.01em'
                          }}
                        >
                          {f.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-10 flex items-center gap-3 flex-wrap">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full"
              style={{
                backgroundColor: 'white',
                border: '1px solid rgba(15,26,19,0.08)',
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                color: CHARCOAL,
                fontWeight: 600
              }}
            >
              <Sparkles size={13} style={{ color: GREEN }} />
              Moteur BioMatch · classement par revenu net agriculteur
            </div>
            <div
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full"
              style={{
                backgroundColor: 'white',
                border: '1px solid rgba(15,26,19,0.08)',
                fontFamily: 'var(--font-display)',
                fontSize: 12.5,
                color: CHARCOAL,
                fontWeight: 600
              }}
            >
              <Package size={13} style={{ color: GREEN }} />
              {activeMatches.length} flux actifs · {activeMatches.reduce((s, m) => s + m.lot.quantity, 0)} t/mois
            </div>
          </div>
        </div>
      </section>

      {/* ============== TOURS ============== */}
      <section className="py-24" style={{ backgroundColor: 'white' }}>
        <div className="container mx-auto px-6 lg:px-12">
          <SectionHeader
            overline="Tournées de collecte"
            title="Un planning optimisé"
            accent="par l'IA chaque matin."
          />

          <div className="grid lg:grid-cols-3 gap-5">
            {tours.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-7 rounded-3xl relative overflow-hidden group"
                style={{
                  backgroundColor: CREAM,
                  border: '1px solid rgba(15,26,19,0.06)'
                }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: GREEN }}
                  >
                    <Truck size={20} color="white" strokeWidth={2} />
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: t.status === 'En cours' ? GREEN : 'rgba(15,26,19,0.06)',
                      color: t.status === 'En cours' ? 'white' : CHARCOAL,
                      fontFamily: 'var(--font-display)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase'
                    }}
                  >
                    {t.status}
                  </span>
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    fontWeight: 800,
                    color: CHARCOAL,
                    letterSpacing: '-0.025em',
                    marginBottom: 4
                  }}
                >
                  {t.window}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    color: MUTED,
                    marginBottom: 20
                  }}
                >
                  {t.zone}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-5" style={{ borderTop: '1px solid rgba(15,26,19,0.08)' }}>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 10.5,
                        color: MUTED,
                        letterSpacing: 1.8,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginBottom: 4
                      }}
                    >
                      Arrêts
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 20,
                        color: CHARCOAL,
                        fontWeight: 800,
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {t.stops}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 10.5,
                        color: MUTED,
                        letterSpacing: 1.8,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginBottom: 4
                      }}
                    >
                      Charge
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 20,
                        color: CHARCOAL,
                        fontWeight: 800,
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {t.load}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== FAIRSHARE + IMPACT ============== */}
      <section className="py-24" style={{ backgroundColor: CREAM }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
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
                Module FairShare · Shapley values
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
                Votre part de la valeur,{' '}
                <span style={{ color: MUTED }}>
                  calculée à l'équitable.
                </span>
              </h2>

              <p
                className="mt-5"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 15.5,
                  color: '#5A5A5E',
                  lineHeight: 1.6,
                  maxWidth: '48ch'
                }}
              >
                La contribution Shapley de chaque acteur à la valeur totale de la symbiose est calculée sur chaque période. Transparence, pas de marché noir.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { label: 'Votre part (recycleur)', value: 20, color: GREEN },
                  { label: 'Agriculteurs (biomasse + terrain)', value: 30, color: '#C8973A' },
                  { label: 'Industriels (phosphogypse + flux)', value: 50, color: '#7BB4E0' }
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 13,
                          color: CHARCOAL,
                          fontWeight: 600
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 14,
                          color: s.color,
                          fontWeight: 800,
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {s.value} %
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'rgba(15,26,19,0.06)' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <GreenPillButton>Télécharger l'attestation</GreenPillButton>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-6 space-y-4"
            >
              {[
                { icon: Leaf, title: 'CO₂ évité ce trimestre', value: '258 tCO₂eq', meta: 'Source : GNN Explainer · ACV Eurostat' },
                { icon: Scale, title: 'Part Shapley mensuelle', value: '20 % · 180 KDT', meta: 'Vérifiable sur chaque période' },
                { icon: CheckCircle2, title: 'Certifications actives', value: 'ISO 14001 · ANGED', meta: 'Renouvellement auto 06/2026' },
                { icon: FileCheck, title: 'Contrats en attente', value: '3 à valider', meta: 'Contrat-type LLM · signature électronique' }
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <div
                    key={i}
                    className="p-6 rounded-3xl flex items-start gap-5"
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(15,26,19,0.06)',
                      boxShadow: '0 6px 24px rgba(15,26,19,0.04)'
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: GREEN_SOFT }}
                    >
                      <Icon size={20} style={{ color: GREEN }} />
                    </div>
                    <div className="flex-1">
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 12,
                          color: MUTED,
                          fontWeight: 600,
                          letterSpacing: 0.3,
                          marginBottom: 6
                        }}
                      >
                        {c.title}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 22,
                          color: CHARCOAL,
                          fontWeight: 800,
                          letterSpacing: '-0.025em',
                          lineHeight: 1.1,
                          marginBottom: 4
                        }}
                      >
                        {c.value}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 12.5,
                          color: MUTED
                        }}
                      >
                        {c.meta}
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
