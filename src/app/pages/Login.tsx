import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sprout,
  Factory,
  Recycle,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router';
import { IMG_HERO } from '../lib/images';

const GREEN = '#2BA24C';
const CHARCOAL = '#0F1A13';

type RoleId = 'farmer' | 'industry' | 'recycling';

type Credential = {
  role: RoleId;
  email: string;
  password: string;
  label: string;
  icon: typeof Sprout;
  dashboard: string;
};

const CREDENTIALS: Credential[] = [
  {
    role: 'farmer',
    email: 'agr',
    password: 'agr',
    label: 'Agriculteur',
    icon: Sprout,
    dashboard: '/dashboard/farmer'
  },
  {
    role: 'industry',
    email: 'usine',
    password: 'usine',
    label: 'Industriel',
    icon: Factory,
    dashboard: '/dashboard/industry'
  },
  {
    role: 'recycling',
    email: 'recy',
    password: 'recy',
    label: 'Recycleur',
    icon: Recycle,
    dashboard: '/dashboard/recycling'
  }
];

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') as RoleId | null;
  const preselected = CREDENTIALS.find(c => c.role === roleParam) ?? null;

  const [email, setEmail] = useState(preselected?.email ?? '');
  const [password, setPassword] = useState(preselected?.password ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  useEffect(() => {
    if (preselected) {
      setEmail(preselected.email);
      setPassword(preselected.password);
      setError(null);
    }
  }, [preselected?.role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const match = CREDENTIALS.find(
      c => c.email === email.trim().toLowerCase() && c.password === password.trim()
    );

    if (!match) {
      setError('Identifiants incorrects. Essayez un compte de démo ci-dessous.');
      return;
    }

    navigate(match.dashboard);
  };

  const fillCredentials = (c: Credential) => {
    setEmail(c.email);
    setPassword(c.password);
    setError(null);
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ color: CHARCOAL, fontFamily: 'var(--font-display)' }}
    >
      {/* Background — same mountain as landing hero, heavily blurred */}
      <div className="absolute inset-0 z-0">
        <img
          src={IMG_HERO}
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
          style={{
            filter: 'blur(22px) saturate(1.1) brightness(0.85)',
            transform: 'scale(1.12)'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(15,26,19,0.35) 0%, rgba(15,26,19,0.6) 55%, rgba(15,26,19,0.85) 100%)'
          }}
        />
      </div>

      {/* ============== STICKY PILL NAV (same as landing) ============== */}
      <div className="fixed top-5 left-0 right-0 z-50 px-4">
        <nav
          className="max-w-6xl mx-auto flex items-center justify-between pl-4 pr-2 py-2 rounded-full"
          style={{
            backgroundColor: 'white',
            boxShadow:
              '0 10px 40px rgba(15,26,19,0.08), 0 0 0 1px rgba(15,26,19,0.04)'
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 h-10 rounded-full transition-colors hover:bg-[#F7F5F0]"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: 600,
                color: CHARCOAL
              }}
            >
              <ArrowLeft size={14} />
              Accueil
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

      {/* Main */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-36 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px]"
        >
          {/* Overline */}
          <div className="text-center mb-7">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
            >
              {preselected ? (
                <>
                  <preselected.icon size={13} style={{ color: GREEN }} />
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
                    Connexion · {preselected.label}
                  </span>
                </>
              ) : (
                <>
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
                    Espace privé
                  </span>
                </>
              )}
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(38px, 5vw, 56px)',
                fontWeight: 800,
                color: 'white',
                lineHeight: 1.02,
                letterSpacing: '-0.035em'
              }}
            >
              {preselected ? (
                <>
                  Entrez dans
                  <br />
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 800 }}>
                    votre espace
                  </span>
                  .
                </>
              ) : (
                <>
                  Bon retour
                  <br />
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 800 }}>
                    sur Gabest
                  </span>
                  .
                </>
              )}
            </h1>

            <p
              className="mt-5 max-w-sm mx-auto"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.6,
                fontWeight: 400
              }}
            >
              {preselected
                ? `Vos identifiants ${preselected.label.toLowerCase()} sont pré-remplis. Cliquez sur "Se connecter" pour accéder à votre tableau de bord.`
                : "Accédez à votre espace privé — la symbiose Industrie · Agriculture · Recyclage orchestrée par l'IA."}
            </p>
          </div>

          {/* Glass card */}
          <form
            onSubmit={handleSubmit}
            className="p-7 rounded-[28px] relative"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)',
              backdropFilter: 'blur(24px) saturate(1.15)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.15)',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow:
                '0 30px 80px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            {/* Email */}
            <div className="mb-5">
              <label
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.55)',
                  fontWeight: 600,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  display: 'block'
                }}
              >
                Identifiant
              </label>
              <div
                className="transition-all"
                style={{
                  borderRadius: 14,
                  backgroundColor:
                    focused === 'email'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(255,255,255,0.04)',
                  border:
                    focused === 'email'
                      ? `1px solid ${GREEN}`
                      : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: focused === 'email' ? `0 0 0 4px ${GREEN}22` : 'none'
                }}
              >
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="agr, usine ou recy"
                  autoComplete="username"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14.5,
                    color: 'white',
                    padding: '14px 16px',
                    width: '100%',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    border: 'none',
                    letterSpacing: '0.01em'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.55)',
                  fontWeight: 600,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  display: 'block'
                }}
              >
                Mot de passe
              </label>
              <div
                className="relative transition-all"
                style={{
                  borderRadius: 14,
                  backgroundColor:
                    focused === 'password'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(255,255,255,0.04)',
                  border:
                    focused === 'password'
                      ? `1px solid ${GREEN}`
                      : '1px solid rgba(255,255,255,0.1)',
                  boxShadow:
                    focused === 'password' ? `0 0 0 4px ${GREEN}22` : 'none'
                }}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder="••••"
                  autoComplete="current-password"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14.5,
                    color: 'white',
                    padding: '14px 48px 14px 16px',
                    width: '100%',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    border: 'none',
                    letterSpacing: '0.04em'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="peer sr-only" />
                <span
                  className="w-4 h-4 rounded flex items-center justify-center transition-colors"
                  style={{
                    border: '1px solid rgba(255,255,255,0.25)',
                    backgroundColor: 'rgba(255,255,255,0.04)'
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 12.5,
                    color: 'rgba(255,255,255,0.65)'
                  }}
                >
                  Se souvenir de moi
                </span>
              </label>
              <button
                type="button"
                className="hover:text-white transition-colors"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12.5,
                  color: 'rgba(255,255,255,0.75)',
                  fontWeight: 500
                }}
              >
                Mot de passe oublié ?
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5"
                style={{
                  backgroundColor: 'rgba(220,60,55,0.14)',
                  border: '1px solid rgba(220,60,55,0.3)'
                }}
              >
                <AlertCircle
                  size={15}
                  style={{ color: '#F5A3A0', marginTop: 1, flexShrink: 0 }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 12.5,
                    color: '#F5CBC9',
                    lineHeight: 1.5
                  }}
                >
                  {error}
                </span>
              </motion.div>
            )}

            {/* Submit — green pill button like landing */}
            <button
              type="submit"
              className="group w-full inline-flex items-center justify-center gap-2 pl-5 pr-2 py-2 rounded-full transition-transform hover:scale-[1.01]"
              style={{
                backgroundColor: GREEN,
                color: 'white',
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 600,
                paddingTop: 8,
                paddingBottom: 8
              }}
            >
              <span className="pr-2">Se connecter</span>
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5"
                style={{ backgroundColor: 'white' }}
              >
                <ArrowRight size={15} style={{ color: CHARCOAL }} />
              </span>
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10.5,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: 2.5,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                Comptes de démo
              </span>
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {CREDENTIALS.map(c => {
                const Icon = c.icon;
                const active = preselected?.role === c.role;
                return (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => fillCredentials(c)}
                    className="group relative p-3.5 rounded-2xl transition-all hover:scale-[1.03] text-left overflow-hidden"
                    style={{
                      backgroundColor: active
                        ? 'rgba(43,162,76,0.14)'
                        : 'rgba(255,255,255,0.05)',
                      border: active
                        ? `1px solid ${GREEN}`
                        : '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                      boxShadow: active ? `0 0 0 3px ${GREEN}22` : 'none'
                    }}
                  >
                    <div
                      className={`absolute inset-0 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      style={{
                        background: `radial-gradient(80px 60px at 50% 0%, ${GREEN}35, transparent 70%)`
                      }}
                    />
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
                        style={{
                          backgroundColor: active ? GREEN : `${GREEN}22`,
                          border: `1px solid ${GREEN}${active ? '' : '40'}`
                        }}
                      >
                        <Icon size={14} style={{ color: 'white' }} strokeWidth={2} />
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'white',
                          marginBottom: 3
                        }}
                      >
                        {c.label}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 10.5,
                          color: 'rgba(255,255,255,0.55)',
                          fontWeight: 500,
                          letterSpacing: 0.3
                        }}
                      >
                        {c.email} · {c.password}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <p
            className="text-center mt-8"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              color: 'rgba(255,255,255,0.6)'
            }}
          >
            Pas encore de compte ?{' '}
            <button
              onClick={() => navigate('/onboarding')}
              className="hover:underline"
              style={{
                color: 'white',
                fontWeight: 600
              }}
            >
              Créer un accès
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
