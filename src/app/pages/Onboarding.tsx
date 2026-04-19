import { ArrowRight, ArrowLeft, Check, Sprout, Factory, Recycle } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { IMG_HERO, IMG_OASIS, IMG_INDUSTRY_PLANT, IMG_RECYCLING_PLANT } from '../lib/images';

const GREEN = '#2BA24C';
const GREEN_DARK = '#1E7A38';
const CHARCOAL = '#0F1A13';
const MUTED = '#98A29A';
const CREAM = '#F7F5F0';

export function Onboarding() {
  const navigate = useNavigate();

  const profiles = [
    {
      id: 'farmer',
      icon: Sprout,
      label: 'Agriculteur',
      arabic: 'فلاح',
      description:
        "Partagez vos cultures et vos déchets. L'IA valorise votre biomasse et vous alerte 48 h avant chaque pic de pollution.",
      bullets: [
        'Localisation · cultures · biomasse',
        'Alertes SO₂ / PM 48 h à l\'avance',
        'Revenu tiré des palmes, grignons, tiges'
      ],
      image: IMG_OASIS,
      route: '/login?role=farmer'
    },
    {
      id: 'industry',
      icon: Factory,
      label: 'Industriel',
      arabic: 'صناعة',
      description:
        "Déclarez votre activité, vos déchets et vos émissions. L'IA oriente chaque flux vers l'agriculture ou une filière de recyclage.",
      bullets: [
        'Activité · déchets · émissions horaires',
        'Matching agriculteurs + recycleurs',
        'Économies décharge · image ESG'
      ],
      image: IMG_INDUSTRY_PLANT,
      route: '/login?role=industry'
    },
    {
      id: 'recycling',
      icon: Recycle,
      label: 'Recycleur',
      arabic: 'تدوير',
      description:
        "Déclarez vos capacités. L'IA vous envoie des flux industriels pré-caractérisés, avec contrat-type et tarif transparent.",
      bullets: [
        'Types de déchets acceptés',
        'Flux industriels pré-caractérisés',
        'Matching distance / coût / CO₂ évité'
      ],
      image: IMG_RECYCLING_PLANT,
      route: '/login?role=recycling'
    }
  ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: CREAM, color: CHARCOAL, fontFamily: 'var(--font-display)' }}
    >
      {/* ============== HERO ============== */}
      <section
        className="relative w-full overflow-hidden"
        style={{ minHeight: 520, paddingTop: 100 }}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={IMG_HERO}
            alt=""
            aria-hidden
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.08) brightness(0.85)' }}
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
            fontSize: 380,
            color: 'white',
            opacity: 0.05,
            lineHeight: 1,
            fontWeight: 700
          }}
        >
          تكامل
        </div>

        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full transition-colors hover:bg-white/10 z-20"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'rgba(255,255,255,0.75)',
            fontSize: 13,
            fontWeight: 500,
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <ArrowLeft size={15} />
          Accueil
        </button>

        <div className="relative z-10 container mx-auto px-6 lg:px-12 pt-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: GREEN, boxShadow: `0 0 10px ${GREEN}` }}
              />
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
                Étape 1 · Choix du profil
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 5.5vw, 76px)',
                fontWeight: 800,
                lineHeight: 1.02,
                color: 'white',
                letterSpacing: '-0.035em'
              }}
            >
              Votre rôle dans la{' '}
              <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 800 }}>
                triple symbiose
              </span>
              .
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
              Le déchet de l'un devient la ressource de l'autre. Choisissez votre profil — l'IA orchestre le matching, explique chaque échange et garantit un gain économique aux trois acteurs.
            </p>
          </motion.div>
        </div>

        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${CREAM} 100%)`
          }}
        />
      </section>

      {/* ============== PROFILE CARDS ============== */}
      <section className="pb-24">
        <div className="container mx-auto px-6 lg:px-12 -mt-20 relative z-10">
          <div className="grid md:grid-cols-3 gap-5">
            {profiles.map((p, idx) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.12 + 0.2, duration: 0.6 }}
                  whileHover={{ y: -6 }}
                  onClick={() => navigate(p.route)}
                  className="p-7 rounded-3xl cursor-pointer relative overflow-hidden group"
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid rgba(15,26,19,0.06)',
                    boxShadow: '0 20px 50px rgba(15,26,19,0.08)'
                  }}
                >
                  <div
                    className="absolute select-none pointer-events-none"
                    style={{
                      top: 24,
                      right: 24,
                      fontFamily: 'var(--font-naskh, var(--font-display))',
                      fontSize: 72,
                      color: CHARCOAL,
                      opacity: 0.05,
                      lineHeight: 1,
                      fontWeight: 700
                    }}
                  >
                    {p.arabic}
                  </div>

                  <div className="relative">
                    <div className="flex items-start justify-between mb-6">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: GREEN }}
                      >
                        <Icon size={20} color="white" strokeWidth={2} />
                      </div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:bg-[var(--c)]"
                        style={{ backgroundColor: CHARCOAL, ['--c' as string]: GREEN_DARK } as React.CSSProperties}
                      >
                        <ArrowRight size={15} color="white" />
                      </div>
                    </div>

                    <div
                      className="mb-2"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 11,
                        color: GREEN,
                        letterSpacing: 2.2,
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      Profil {String(idx + 1).padStart(2, '0')}
                    </div>

                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 28,
                        fontWeight: 800,
                        color: CHARCOAL,
                        letterSpacing: '-0.025em',
                        marginBottom: 10,
                        lineHeight: 1.1
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
                        marginBottom: 20
                      }}
                    >
                      {p.description}
                    </p>

                    <div
                      className="h-40 rounded-2xl overflow-hidden relative mb-5"
                    >
                      <img
                        src={p.image}
                        alt=""
                        aria-hidden
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={e => {
                          if (e.currentTarget.src !== IMG_HERO) e.currentTarget.src = IMG_HERO;
                        }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(180deg, transparent 40%, rgba(15,26,19,0.45) 100%)'
                        }}
                      />
                      <div
                        className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 10.5,
                            color: CHARCOAL,
                            letterSpacing: 1.6,
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}
                        >
                          {p.label}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2.5">
                      {p.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: '#E6F4EA' }}
                          >
                            <Check size={11} strokeWidth={3} style={{ color: GREEN }} />
                          </div>
                          <span
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 13.5,
                              color: CHARCOAL,
                              lineHeight: 1.45
                            }}
                          >
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 flex items-center justify-between gap-6 flex-wrap"
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                color: MUTED
              }}
            >
              Les données sont simulées pour la démo. Plateforme bilingue français / arabe ·{' '}
              <span
                style={{
                  fontFamily: 'var(--font-naskh, var(--font-display))',
                  color: CHARCOAL,
                  fontWeight: 600
                }}
              >
                التكامل بين الصناعة والفلاحة والتدوير
              </span>
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                color: CHARCOAL,
                fontWeight: 600,
                textDecoration: 'underline'
              }}
              className="hover:text-[var(--g)]"
            >
              J'ai déjà un compte — se connecter
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
