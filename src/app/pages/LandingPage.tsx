import {
  ArrowRight,
  Sprout,
  Factory,
  Recycle,
  Star,
  Play,
  Wind,
  Droplet,
  Mountain,
  Check,
  Phone,
  MapPin,
  Mail,
  Facebook,
  Instagram,
  Linkedin,
  Heart,
  Activity,
  Brain
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useNavigate } from 'react-router';
import { useRef } from 'react';
import {
  IMG_HERO,
  IMG_OASIS,
  IMG_FARM,
  IMG_DOCTOR,
  IMG_VALLEY,
  IMG_FOREST,
  IMG_SUNSET_FIELD,
  IMG_MATMATA_VILLAGE,
  IMG_MATMATA_PANORAMA,
  IMG_MATMATA_PALM,
  IMG_MATMATA_MOSQUE
} from '../lib/images';

// =========================================================================
// Small shared elements
// =========================================================================

const GREEN = '#2BA24C';
const GREEN_DARK = '#1E7A38';
const GREEN_SOFT = '#E6F4EA';
const CHARCOAL = '#0F1A13';
const MUTED = '#98A29A';
const CREAM = '#F7F5F0';

function GreenPillButton({
  children,
  onClick,
  variant = 'primary'
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
}) {
  const primary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-2 pl-5 pr-2 py-2 rounded-full transition-transform hover:scale-[1.02]"
      style={{
        backgroundColor: primary ? GREEN : 'rgba(255,255,255,0.08)',
        color: primary ? 'white' : 'white',
        border: primary ? 'none' : '1px solid rgba(255,255,255,0.3)',
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        fontWeight: 600
      }}
    >
      <span className="pr-2">{children}</span>
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5"
        style={{ backgroundColor: 'white' }}
      >
        <ArrowRight size={15} style={{ color: CHARCOAL }} />
      </span>
    </button>
  );
}

// =========================================================================
// Landing
// =========================================================================

export function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], ['0%', '12%']);

  const profiles = [
    {
      id: 'farmer',
      icon: Sprout,
      label: 'Agriculteur',
      sub: 'Alertes pollution 48 h à l\'avance, diagnostic des plantes par photo et revenu tiré de vos déchets (palmes, grignons, tiges).',
      route: '/dashboard/farmer'
    },
    {
      id: 'industry',
      icon: Factory,
      label: 'Industriel',
      sub: 'Valorisez phosphogypse et rejets non-valorisables : l\'IA les oriente vers l\'agriculture et les filières de recyclage.',
      route: '/dashboard/industry'
    },
    {
      id: 'recycling',
      icon: Recycle,
      label: 'Recycleur',
      sub: 'Flux industriels pré-caractérisés par l\'IA : matching multi-objectif distance / coût / CO₂ et contrats-types.',
      route: '/dashboard/recycling'
    }
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'white',
        color: CHARCOAL,
        fontFamily: 'var(--font-display)'
      }}
    >
      {/* ============== STICKY PILL NAV ============== */}
      <div className="fixed top-5 left-0 right-0 z-50 px-4">
        <nav
          className="max-w-6xl mx-auto flex items-center justify-between pl-4 pr-2 py-2 rounded-full"
          style={{
            backgroundColor: 'white',
            boxShadow: '0 10px 40px rgba(15,26,19,0.08), 0 0 0 1px rgba(15,26,19,0.04)'
          }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: CHARCOAL }}
            >
              <Sprout size={18} color="white" strokeWidth={2} />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 18,
                color: CHARCOAL,
                letterSpacing: '-0.02em'
              }}
            >
              Gabest
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-8">
            {[
              { label: 'Accueil', href: '/', active: true },
              { label: 'Territoire', href: '#territoire' },
              { label: 'Méthode', href: '#methode' },
              { label: 'Journal', href: '#journal' },
              { label: 'Équipe', href: '#equipe' },
              { label: 'Contact', href: '#contact' }
            ].map(l => (
              <a
                key={l.label}
                href={l.href}
                className="transition-colors"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: l.active ? GREEN : CHARCOAL,
                  fontSize: 13,
                  fontWeight: l.active ? 700 : 500,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase'
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex items-center px-4 h-10 rounded-full transition-colors hover:bg-[#F7F5F0]"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: 600,
                color: CHARCOAL,
                border: '1px solid rgba(15,26,19,0.1)'
              }}
            >
              Connexion
            </button>
            <button
              onClick={() => navigate('/onboarding')}
              className="group inline-flex items-center gap-2 pl-4 pr-1 py-1 rounded-full transition-transform hover:scale-[1.02]"
              style={{
                backgroundColor: GREEN,
                color: 'white',
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              <span className="pr-1">Commencer</span>
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'white' }}
              >
                <ArrowRight size={13} style={{ color: CHARCOAL }} />
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* ============== HERO ============== */}
      <section
        ref={heroRef}
        className="relative w-full"
        style={{ minHeight: '100vh', paddingTop: 120 }}
      >
        <motion.div className="absolute inset-0 z-0" style={{ y: heroY }}>
          <img
            src={IMG_HERO}
            alt="Gabès — paysage territorial"
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.1) brightness(0.92)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(15,26,19,0.1) 0%, rgba(15,26,19,0.35) 50%, rgba(15,26,19,0.75) 100%)'
            }}
          />
        </motion.div>

        <div className="relative z-10 container mx-auto px-6 lg:px-12 pt-20 pb-32">
          <div className="grid lg:grid-cols-12 gap-10 items-end min-h-[620px]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="lg:col-span-7"
            >
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(42px, 6vw, 88px)',
                  fontWeight: 800,
                  lineHeight: 1.02,
                  color: 'white',
                  letterSpacing: '-0.035em'
                }}
              >
                Le déchet
                <br />
                de l'un, la{' '}
                <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800 }}>
                  ressource
                </span>
                <br />
                de l'autre.
              </h1>

              <p
                className="mt-8 max-w-lg"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: 16,
                  lineHeight: 1.65,
                  fontWeight: 400
                }}
              >
                GABEST orchestre la triple symbiose Industrie · Agriculture · Recyclage à Gabès. L'IA match les flux, explique chaque échange et fait gagner les trois acteurs économiquement.
              </p>

              <div className="mt-10 flex items-center gap-8 flex-wrap">
                <GreenPillButton onClick={() => navigate('/onboarding')}>
                  Accéder à la plateforme
                </GreenPillButton>

                <div className="flex items-center gap-3">
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: 28,
                      color: 'white'
                    }}
                  >
                    4.9
                  </div>
                  <Star size={18} fill={GREEN} style={{ color: GREEN }} />
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: 13
                    }}
                  >
                    3 profils
                    <br />
                    connectés par l'IA
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="lg:col-span-5 flex flex-col gap-4"
            >
              {/* Video / portrait card */}
              <div
                className="rounded-3xl overflow-hidden relative group cursor-pointer"
                style={{ aspectRatio: '16 / 10' }}
              >
                <img
                  src={IMG_DOCTOR}
                  alt="Médecin à Gabès"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(15,26,19,0.2)' }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.95)'
                    }}
                  >
                    <Play size={18} fill={CHARCOAL} style={{ color: CHARCOAL, marginLeft: 2 }} />
                  </div>
                </div>
                <div
                  className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'rgba(15,26,19,0.6)', backdropFilter: 'blur(10px)' }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 11,
                      color: 'white',
                      fontWeight: 600,
                      letterSpacing: 1.5
                    }}
                  >
                    ENQUÊTE TERRAIN · 3:24
                  </span>
                </div>
              </div>

              {/* Testimonial card */}
              <div
                className="p-5 rounded-3xl flex items-start gap-4"
                style={{
                  backgroundColor: 'rgba(15,26,19,0.55)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                >
                  <Heart size={16} color="white" />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'white',
                      marginBottom: 2
                    }}
                  >
                    Alerte Sol-Santé détectée
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.75)',
                      lineHeight: 1.5
                    }}
                  >
                    Contamination fluor à Chenini. Médecins de Ghannouch alertés 7 j à l'avance.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============== TRUST BAR (dark) ============== */}
      <section
        className="py-10"
        style={{ backgroundColor: '#0A1D10' }}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between flex-wrap gap-8">
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: 2.5,
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              EN COLLABORATION AVEC
            </div>
            <div className="flex items-center gap-10 lg:gap-14 flex-wrap">
              {[
                'Ministère de la Santé',
                'ANPE Tunisie',
                'Hôpital Gabès',
                'Université Sfax',
                'CITET'
              ].map((n, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.55)',
                    fontWeight: 600,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== SHOWCASE / GABÈS REGION ============== */}
      <section className="py-24" style={{ backgroundColor: 'white' }}>
        <div className="container mx-auto px-6 lg:px-12">
          <h2
            className="text-center max-w-4xl mx-auto"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(30px, 4vw, 56px)',
              fontWeight: 700,
              lineHeight: 1.1,
              color: CHARCOAL,
              letterSpacing: '-0.025em'
            }}
          >
            Soigner un territoire qui abrite{' '}
            <span style={{ color: MUTED }}>
              400 000 vies, 3 oasis et un complexe chimique parmi les plus grands du bassin méditerranéen
            </span>
          </h2>

          <div className="mt-14 grid lg:grid-cols-12 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-5 lg:row-span-2 rounded-3xl overflow-hidden relative group cursor-pointer"
              style={{ minHeight: 520 }}
            >
              <img
                src={IMG_MATMATA_VILLAGE}
                alt="Village de Matmata à Gabès"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl"
                style={{ backgroundColor: 'rgba(15,26,19,0.6)', backdropFilter: 'blur(12px)' }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    color: 'white',
                    fontWeight: 600,
                    lineHeight: 1.4
                  }}
                >
                  Matmata — 14 zones surveillées en temps réel pour identifier les corrélations pollution / santé.
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-7 rounded-3xl overflow-hidden relative group cursor-pointer"
              style={{ minHeight: 250 }}
            >
              <img
                src={IMG_OASIS}
                alt="Oasis de Chenini vue du ciel"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-3 rounded-3xl overflow-hidden relative group cursor-pointer"
              style={{ minHeight: 250 }}
            >
              <img
                src={IMG_MATMATA_PALM}
                alt="Palmier et oasis à Matmata"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-4 rounded-3xl p-7 relative overflow-hidden"
              style={{
                backgroundColor: GREEN,
                minHeight: 250
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.7)',
                  letterSpacing: 2.5,
                  fontWeight: 600,
                  marginBottom: 12
                }}
              >
                EN DIRECT · 17 AVRIL
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 26,
                  fontWeight: 700,
                  color: 'white',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  marginBottom: 16
                }}
              >
                68 consultations liées à la pollution aujourd'hui
              </div>
              <div className="flex items-center justify-between">
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.85)'
                  }}
                >
                  Cluster SO₂ → Bou Chemma
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'white' }}
                >
                  <ArrowRight size={15} style={{ color: CHARCOAL }} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============== JOURNEY / STORY ============== */}
      <section id="methode" className="py-28" style={{ backgroundColor: 'white' }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-6 rounded-3xl overflow-hidden"
              style={{ aspectRatio: '4 / 5' }}
            >
              <img src={IMG_MATMATA_MOSQUE} alt="Mosquée de Matmata et palmiers" className="w-full h-full object-cover" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-6"
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(32px, 4vw, 56px)',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  color: CHARCOAL,
                  letterSpacing: '-0.03em'
                }}
              >
                Découvrez la{' '}
                <span style={{ color: GREEN, fontWeight: 700 }}>méthode</span>{' '}
                <br />
                qui relie <span style={{ color: MUTED }}>sol et santé</span>
              </h2>

              <p
                className="mt-6"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  color: '#5A5A5E',
                  lineHeight: 1.65,
                  maxWidth: '44ch'
                }}
              >
                9 flux de données croisés en temps réel — capteurs d'air, stations météo, analyses de sol, échantillons d'eau, consultations médicales. L'IA détecte les corrélations invisibles à l'œil humain.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-6">
                {[
                  {
                    value: '+48h',
                    label: 'Alerte anticipée avant chaque pic de pollution.',
                    icon: Activity
                  },
                  {
                    value: '0.87',
                    label: 'Corrélation détectée SO₂ → consultations respiratoires.',
                    icon: Brain
                  }
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i}>
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                        style={{ backgroundColor: GREEN_SOFT }}
                      >
                        <Icon size={22} style={{ color: GREEN }} />
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 32,
                          fontWeight: 800,
                          color: CHARCOAL,
                          letterSpacing: '-0.03em',
                          marginBottom: 4
                        }}
                      >
                        {s.value}
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 13,
                          color: '#5A5A5E',
                          lineHeight: 1.5
                        }}
                      >
                        {s.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10">
                <button
                  onClick={() => navigate('/dashboard/farmer')}
                  className="group inline-flex items-center gap-2 pl-5 pr-2 py-2 rounded-full transition-transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: GREEN,
                    color: 'white',
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  <span className="pr-2">Voir l'espace agriculteur</span>
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'white' }}
                  >
                    <ArrowRight size={15} style={{ color: CHARCOAL }} />
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============== EMPOWERING (dark green section) ============== */}
      <section
        className="relative py-28"
        style={{ backgroundColor: '#0A1D10' }}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-6 rounded-3xl overflow-hidden"
              style={{ aspectRatio: '4 / 5' }}
            >
              <img src={IMG_VALLEY} alt="Vallée et montagnes" className="w-full h-full object-cover" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-6"
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(32px, 4vw, 56px)',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  color: 'white',
                  letterSpacing: '-0.03em'
                }}
              >
                Accompagner la vie à Gabès avec des{' '}
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                  solutions d'experts
                </span>
              </h2>

              <div className="mt-6 flex items-center gap-2">
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 15,
                    color: 'white',
                    fontWeight: 700
                  }}
                >
                  4.9/5
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={GREEN} style={{ color: GREEN }} />
                  ))}
                </div>
              </div>

              <ul className="mt-8 space-y-4">
                {[
                  'Indice de risque santé par quartier, actualisé toutes les heures',
                  'Diagnostic des cultures par photo + prescription IA agronomique',
                  'Corrélations pollution / santé détectées avant les crises sanitaires',
                  'Jumelage Sol-Santé : alertes aux médecins dès qu\'un sol est contaminé'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: GREEN }}
                    >
                      <Check size={13} strokeWidth={3} color="white" />
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 15,
                        color: 'rgba(255,255,255,0.85)',
                        lineHeight: 1.5
                      }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <GreenPillButton onClick={() => navigate('/onboarding')}>
                  Découvrir la plateforme
                </GreenPillButton>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============== COMPREHENSIVE SOLUTIONS = profile cards ============== */}
      <section id="territoire" className="py-28" style={{ backgroundColor: 'white' }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between flex-wrap gap-8 mb-14">
            <h2
              className="max-w-xl"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 4vw, 56px)',
                fontWeight: 700,
                lineHeight: 1.05,
                color: CHARCOAL,
                letterSpacing: '-0.03em'
              }}
            >
              Trois tableaux de bord{' '}
              <span style={{ color: MUTED }}>pour une région vivante</span>
            </h2>
            <p
              className="max-w-sm"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                color: '#5A5A5E',
                lineHeight: 1.6
              }}
            >
              Chaque profil débloque un tableau de bord spécifique — données, alertes et actions pensées pour ses décisions quotidiennes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {profiles.map((p, idx) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-7 rounded-3xl transition-shadow hover:shadow-xl"
                  style={{
                    backgroundColor: CREAM
                  }}
                >
                  <div className="flex items-start justify-between mb-8">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: GREEN }}
                    >
                      <Icon size={20} color="white" strokeWidth={2} />
                    </div>
                    <button
                      onClick={() => navigate(p.route)}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ backgroundColor: CHARCOAL }}
                    >
                      <ArrowRight size={15} color="white" />
                    </button>
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 24,
                      fontWeight: 700,
                      color: CHARCOAL,
                      letterSpacing: '-0.02em',
                      marginBottom: 10
                    }}
                  >
                    Je suis {p.label.toLowerCase()}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      color: '#5A5A5E',
                      lineHeight: 1.55,
                      marginBottom: 24
                    }}
                  >
                    {p.sub}
                  </p>
                  <div
                    className="h-56 rounded-2xl overflow-hidden relative cursor-pointer group"
                    onClick={() => navigate(p.route)}
                  >
                    <img
                      src={idx === 0 ? IMG_MATMATA_VILLAGE : idx === 1 ? IMG_SUNSET_FIELD : IMG_MATMATA_MOSQUE}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== INNOVATIVE AGRICULTURE — dark full-bleed ============== */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMG_SUNSET_FIELD} alt="" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(10,29,16,0.82)' }}
          />
        </div>
        <div className="relative container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-center mb-20">
            <h2
              className="lg:col-span-7"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(36px, 5vw, 72px)',
                fontWeight: 700,
                lineHeight: 1,
                color: 'white',
                letterSpacing: '-0.035em'
              }}
            >
              L'IA de santé territoriale pour un{' '}
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>Gabès qui respire</span>
            </h2>

            <div className="lg:col-span-5 flex flex-col gap-6 lg:pl-8">
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.82)',
                  lineHeight: 1.65
                }}
              >
                Faire dialoguer capteurs industriels, consultations médicales et pratiques agricoles pour anticiper les crises sanitaires. Une méthode scientifique, validée par un comité pluridisciplinaire.
              </p>
              <div>
                <GreenPillButton onClick={() => navigate('/onboarding')}>
                  Démarrer maintenant
                </GreenPillButton>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Portrait card */}
            <div
              className="rounded-3xl overflow-hidden relative group cursor-pointer"
              style={{ aspectRatio: '4 / 5' }}
            >
              <img src={IMG_DOCTOR} alt="" className="w-full h-full object-cover" />
              <div
                className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl"
                style={{
                  backgroundColor: 'rgba(15,26,19,0.75)',
                  backdropFilter: 'blur(12px)'
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    color: 'white',
                    fontWeight: 500,
                    lineHeight: 1.45
                  }}
                >
                  Médecins, chercheurs et agronomes validant chaque recommandation de la plateforme.
                </div>
              </div>
            </div>

            {/* Stat card — large */}
            <div
              className="rounded-3xl p-8 flex flex-col justify-between"
              style={{ backgroundColor: CREAM }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 64,
                    fontWeight: 800,
                    color: CHARCOAL,
                    lineHeight: 0.95,
                    letterSpacing: '-0.04em',
                    marginBottom: 16
                  }}
                >
                  400 K+ <span style={{ color: MUTED }}>habitants</span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    color: '#5A5A5E',
                    lineHeight: 1.6
                  }}
                >
                  Notre engagement envers la rigueur scientifique et l'action locale a gagné la confiance des acteurs de Gabès.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-8">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-white overflow-hidden"
                      style={{ backgroundColor: '#E8D5A8' }}
                    >
                      <img
                        src={i % 2 === 0 ? IMG_DOCTOR : IMG_FARM}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      fontWeight: 800,
                      color: CHARCOAL
                    }}
                  >
                    4.9
                  </div>
                  <Star size={14} fill={GREEN} style={{ color: GREEN }} />
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 12,
                      color: MUTED
                    }}
                  >
                    1 458 avis
                  </div>
                </div>
              </div>
            </div>

            {/* Video card */}
            <div
              className="rounded-3xl overflow-hidden relative group cursor-pointer"
              style={{ aspectRatio: '4 / 5' }}
            >
              <img src={IMG_MATMATA_PANORAMA} alt="" className="w-full h-full object-cover" />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(15,26,19,0.25)' }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
                >
                  <Play size={18} fill={CHARCOAL} style={{ color: CHARCOAL, marginLeft: 2 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== PRECISION / 3-AXIS ============== */}
      <section className="py-28" style={{ backgroundColor: 'white' }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-3xl overflow-hidden"
                  style={{ aspectRatio: '3 / 4' }}
                >
                  <img src={IMG_MATMATA_VILLAGE} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-4">
                  <div
                    className="rounded-3xl overflow-hidden"
                    style={{ aspectRatio: '1 / 1' }}
                  >
                    <img src={IMG_FOREST} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div
                    className="rounded-3xl overflow-hidden flex-1"
                  >
                    <img src={IMG_SUNSET_FIELD} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 lg:pl-8">
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(30px, 3.8vw, 52px)',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  color: CHARCOAL,
                  letterSpacing: '-0.03em'
                }}
              >
                L'air, l'eau, la terre —{' '}
                <span style={{ color: MUTED }}>tout est relié</span>
              </h2>

              <p
                className="mt-6"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  color: '#5A5A5E',
                  lineHeight: 1.65,
                  maxWidth: '48ch'
                }}
              >
                Chaque axe de surveillance parle aux autres. Un pic de SO₂ dans l'air devient un risque d'asthme demain ; une contamination du sol devient un rappel sanitaire dans 7 jours.
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  'Capteurs d\'air à Ghannouch, Chenini, Bou Chemma',
                  'Analyses de nappes et canaux d\'irrigation',
                  'Qualité des parcelles — fluor, phosphogypse',
                  'Croisement avec consultations médicales',
                  'Alertes citoyens 48 h avant chaque pic',
                  'Rapports ANPE générés automatiquement'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: CHARCOAL }}
                    >
                      <Check size={11} strokeWidth={3} color="white" />
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 14,
                        color: CHARCOAL,
                        lineHeight: 1.5
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <button
                  onClick={() => navigate('/onboarding')}
                  className="group inline-flex items-center gap-2 pl-5 pr-2 py-2 rounded-full transition-transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: GREEN,
                    color: 'white',
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  <span className="pr-2">Commencer maintenant</span>
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'white' }}
                  >
                    <ArrowRight size={15} style={{ color: CHARCOAL }} />
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-20 grid md:grid-cols-3 gap-5">
            {[
              {
                title: 'Surveillance de l\'air',
                desc: 'PM₂.₅, SO₂, phosphogypse — 14 zones, mise à jour horaire.',
                icon: Wind,
                img: IMG_HERO
              },
              {
                title: 'Qualité de l\'eau',
                desc: 'Nappes, canaux, irrigation — détection salinité & contaminants.',
                icon: Droplet,
                img: IMG_VALLEY
              },
              {
                title: 'Santé du sol',
                desc: 'Fluor, nitrates — jumelage avec la santé des habitants.',
                icon: Mountain,
                img: IMG_MATMATA_PALM
              }
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-7 rounded-3xl"
                  style={{ backgroundColor: CREAM }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: GREEN }}
                    >
                      <Icon size={20} color="white" />
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: CHARCOAL }}
                    >
                      <ArrowRight size={15} color="white" />
                    </div>
                  </div>
                  <h4
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      fontWeight: 700,
                      color: CHARCOAL,
                      letterSpacing: '-0.015em',
                      marginBottom: 8
                    }}
                  >
                    {s.title}
                  </h4>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      color: '#5A5A5E',
                      lineHeight: 1.55,
                      marginBottom: 20
                    }}
                  >
                    {s.desc}
                  </p>
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ aspectRatio: '16 / 10' }}
                  >
                    <img src={s.img} alt="" className="w-full h-full object-cover" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== NEWS HUB CTA ============== */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div
            className="relative rounded-3xl overflow-hidden p-10 lg:p-14"
            style={{ minHeight: 380 }}
          >
            <div className="absolute inset-0">
              <img src={IMG_FOREST} alt="" className="w-full h-full object-cover" />
              <div
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(15,26,19,0.45)' }}
              />
            </div>

            <div className="relative flex items-center justify-end h-full min-h-[300px]">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl max-w-md"
                style={{ backgroundColor: GREEN }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 28,
                    fontWeight: 700,
                    color: 'white',
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                    marginBottom: 12
                  }}
                >
                  Restez informés avec le Journal de Gabest
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.88)',
                    lineHeight: 1.55,
                    marginBottom: 24
                  }}
                >
                  Analyses IA, clusters détectés, entretiens avec les médecins et agronomes — chaque semaine, le diagnostic du dimanche dans votre boîte mail.
                </p>
                <button
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: 'white' }}
                >
                  <ArrowRight size={17} style={{ color: CHARCOAL }} />
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== AGRICULTURE INSIGHTS / JOURNAL ============== */}
      <section
        id="journal"
        className="relative py-28 overflow-hidden"
      >
        <div className="absolute inset-0">
          <img src={IMG_MATMATA_MOSQUE} alt="" className="w-full h-full object-cover" style={{ filter: 'brightness(0.5)' }} />
        </div>

        <div className="relative container mx-auto px-6 lg:px-12 text-center">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 72px)',
              fontWeight: 700,
              lineHeight: 1,
              color: 'white',
              letterSpacing: '-0.035em'
            }}
          >
            Analyses, tendances &amp; signaux faibles
          </h2>
          <p
            className="mt-6 max-w-2xl mx-auto"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.65
            }}
          >
            Le terrain raconté par celles et ceux qui soignent Gabès — médecins, agronomes, chercheurs et habitants.
          </p>
        </div>
      </section>

      <section className="py-24" style={{ backgroundColor: 'white' }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-6 mb-6">
            {[
              {
                cat: 'ANALYSE · CLUSTER',
                date: '17 AVRIL 2026',
                title: 'Cluster respiratoire à Bou Chemma : l\'IA avait prévenu douze jours avant.',
                img: IMG_MATMATA_PANORAMA,
                large: true
              },
              {
                cat: 'AGRICULTURE',
                date: '15 AVRIL 2026',
                title: 'Sol-Santé déclenché : du fluor dans les tomates de Chenini.',
                img: IMG_SUNSET_FIELD,
                large: false
              }
            ].map((a, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`${a.large ? 'lg:col-span-7' : 'lg:col-span-5'} group cursor-pointer`}
              >
                <div
                  className="rounded-3xl overflow-hidden mb-5"
                  style={{ aspectRatio: a.large ? '16 / 10' : '4 / 3' }}
                >
                  <img
                    src={a.img}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div
                  className="flex items-center gap-3 mb-3"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    color: MUTED,
                    letterSpacing: 2,
                    fontWeight: 600
                  }}
                >
                  <span style={{ color: GREEN }}>{a.cat}</span>
                  <span>—</span>
                  <span>{a.date}</span>
                </div>
                <h3
                  className="transition-colors group-hover:text-[#2BA24C]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: a.large ? 28 : 22,
                    fontWeight: 700,
                    color: CHARCOAL,
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em'
                  }}
                >
                  {a.title}
                </h3>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ============== COMITÉ SCIENTIFIQUE / TESTIMONIALS ============== */}
      <section
        id="equipe"
        className="py-28"
        style={{ backgroundColor: CREAM }}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 mb-14">
            <div className="lg:col-span-7">
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(32px, 4vw, 56px)',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  color: CHARCOAL,
                  letterSpacing: '-0.03em'
                }}
              >
                Validé par celles et ceux qui{' '}
                <span style={{ color: MUTED }}>soignent Gabès</span>
              </h2>
              <p
                className="mt-6 max-w-lg"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  color: '#5A5A5E',
                  lineHeight: 1.65
                }}
              >
                Chaque recommandation IA est revue par un comité composé de médecins généralistes, pneumologues, ingénieurs agronomes et chercheurs en santé publique.
              </p>
            </div>
            <div className="lg:col-span-5 grid grid-cols-3 gap-3 self-end">
              {[
                { v: '14', l: 'Publications peer-reviewed' },
                { v: '42', l: 'Capteurs sur le terrain' },
                { v: '03', l: 'Hôpitaux partenaires' }
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(36px, 4vw, 56px)',
                      fontWeight: 800,
                      color: CHARCOAL,
                      lineHeight: 1,
                      letterSpacing: '-0.03em'
                    }}
                  >
                    {s.v}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 11,
                      color: MUTED,
                      letterSpacing: 1.5,
                      fontWeight: 500,
                      marginTop: 6
                    }}
                  >
                    {s.l.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: 'Dr. Amina Trabelsi',
                role: 'Médecin généraliste',
                place: 'Hôpital Régional Gabès',
                quote: 'La corrélation SO₂ → asthme qu\'on observait en clinique est enfin mesurable.'
              },
              {
                name: 'Pr. Mohamed Khelifi',
                role: 'Épidémiologiste',
                place: 'Université de Sfax',
                quote: 'Gabest apporte la rigueur statistique qui manquait aux études environnementales.'
              },
              {
                name: 'Ing. Salah Ben Ali',
                role: 'Agronome',
                place: 'CITET — Tunis',
                quote: 'Le jumelage sol–santé est un saut méthodologique. Il casse des silos.'
              },
              {
                name: 'Dr. Leïla Mansouri',
                role: 'Pneumologue',
                place: 'CHU de Gabès',
                quote: 'En 6 mois, les admissions aux urgences pour asthme ont baissé de 12 %.'
              }
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-3xl"
                style={{ backgroundColor: 'white' }}
              >
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={13} fill={GREEN} style={{ color: GREEN }} />
                  ))}
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    color: CHARCOAL,
                    lineHeight: 1.55,
                    marginBottom: 20,
                    fontWeight: 500
                  }}
                >
                  «&nbsp;{p.quote}&nbsp;»
                </p>
                <div
                  className="h-px w-10 mb-3"
                  style={{ backgroundColor: 'rgba(15,26,19,0.2)' }}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    color: CHARCOAL,
                    fontWeight: 700
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 11,
                    color: MUTED,
                    letterSpacing: 1.3,
                    fontWeight: 500,
                    marginTop: 4
                  }}
                >
                  {p.role.toUpperCase()} · {p.place.toUpperCase()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== CONTACT HERO ============== */}
      <section
        id="contact"
        className="relative py-32 overflow-hidden"
      >
        <div className="absolute inset-0">
          <img src={IMG_OASIS} alt="" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(15,26,19,0.55)' }}
          />
        </div>
        <div className="relative container mx-auto px-6 lg:px-12 text-center">
          <h2
            className="max-w-4xl mx-auto"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 72px)',
              fontWeight: 700,
              lineHeight: 1,
              color: 'white',
              letterSpacing: '-0.035em'
            }}
          >
            Construisons ensemble un{' '}
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Gabès plus vivant</span>
          </h2>
          <p
            className="mt-6 max-w-2xl mx-auto"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.65
            }}
          >
            Rejoignez la plateforme pour protéger votre famille, optimiser votre parcelle ou suivre la santé de votre territoire.
          </p>

          <div className="mt-14 grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Phone, label: 'Support', value: '+216 75 270 000' },
              { icon: MapPin, label: 'Bureau', value: 'Avenue Farhat Hached, Gabès' },
              { icon: Mail, label: 'Email', value: 'contact@gabesheal.tn' }
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-3xl flex items-center gap-4"
                  style={{
                    backgroundColor: 'rgba(15,26,19,0.55)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'white' }}
                  >
                    <Icon size={18} style={{ color: CHARCOAL }} />
                  </div>
                  <div className="text-left">
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'white'
                      }}
                    >
                      {c.label}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.8)',
                        marginTop: 2
                      }}
                    >
                      {c.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== FINAL CTA ============== */}
      <section
        className="relative py-28 overflow-hidden"
        style={{ backgroundColor: CHARCOAL }}
      >
        <div className="absolute inset-0">
          <img src={IMG_VALLEY} alt="" className="w-full h-full object-cover" style={{ filter: 'brightness(0.3)' }} />
        </div>
        <div className="relative container mx-auto px-6 lg:px-12 text-center">
          <h2
            className="max-w-3xl mx-auto"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 4vw, 56px)',
              fontWeight: 700,
              lineHeight: 1.05,
              color: 'white',
              letterSpacing: '-0.03em'
            }}
          >
            Prêt à voir{' '}
            <span style={{ color: 'rgba(255,255,255,0.45)' }}>votre quartier</span>{' '}
            sur la carte ?
          </h2>
          <p
            className="mt-5 max-w-xl mx-auto"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.65
            }}
          >
            Aucune inscription requise pour la démo. Choisissez votre profil et explorez la plateforme en 10 secondes.
          </p>
          <div className="mt-10 flex items-center gap-4 justify-center flex-wrap">
            <GreenPillButton onClick={() => navigate('/onboarding')}>
              Commencer
            </GreenPillButton>
            <GreenPillButton onClick={() => navigate('/dashboard/farmer')} variant="ghost">
              Espace agriculteur
            </GreenPillButton>
          </div>
        </div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer className="py-16" style={{ backgroundColor: 'white' }}>
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-start justify-between mb-12 flex-wrap gap-10">
            <div className="flex items-center gap-2.5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: CHARCOAL }}
              >
                <Sprout size={20} color="white" />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 22,
                  color: CHARCOAL,
                  letterSpacing: '-0.02em'
                }}
              >
                Gabest
              </span>
            </div>
            <div className="flex items-center gap-8">
              {['Accueil', 'Territoire', 'Méthode', 'Journal', 'Équipe', 'Contact'].map(l => (
                <a
                  key={l}
                  href="#"
                  className="transition-colors hover:text-[#2BA24C]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: CHARCOAL,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase'
                  }}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>

          <div className="h-px w-full mb-8" style={{ backgroundColor: 'rgba(15,26,19,0.08)' }} />

          <div className="flex items-start justify-between flex-wrap gap-8">
            <div className="flex items-center gap-8 flex-wrap">
              {[
                { icon: MapPin, label: 'Adresse', value: 'Av. Farhat Hached, Gabès' },
                { icon: Phone, label: 'Téléphone', value: '+216 75 270 000' },
                { icon: Mail, label: 'Email', value: 'contact@gabesheal.tn' },
                { icon: Activity, label: 'Heures', value: '9h00 — 18h00' }
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: CREAM }}
                    >
                      <Icon size={15} style={{ color: CHARCOAL }} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 13,
                          fontWeight: 700,
                          color: CHARCOAL
                        }}
                      >
                        {c.label}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 12,
                          color: MUTED,
                          marginTop: 2
                        }}
                      >
                        {c.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: CHARCOAL }}
                >
                  <Icon size={14} color="white" />
                </a>
              ))}
            </div>
          </div>

          <div className="h-px w-full mt-10 mb-6" style={{ backgroundColor: 'rgba(15,26,19,0.08)' }} />

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12,
                color: MUTED
              }}
            >
              © 2026 Gabest — H12 Innovation 3.0 · Gabès, Tunisie
            </div>
            <div className="flex gap-6">
              {['Mentions légales', 'Confidentialité'].map(l => (
                <a
                  key={l}
                  href="#"
                  className="transition-colors hover:text-[#2BA24C]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: MUTED,
                    fontSize: 12
                  }}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
