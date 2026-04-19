import { ArrowLeft, ArrowRight, LogOut, Sprout } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';

const GREEN = '#2BA24C';
const CHARCOAL = '#0F1A13';

type NavVariant = 'light' | 'dark';

export function StickyPillNav({
  variant = 'light',
  onLogout
}: {
  variant?: NavVariant;
  onLogout?: () => void;
}) {
  const navigate = useNavigate();
  const onLight = variant === 'light';

  const navStyle: React.CSSProperties = onLight
    ? {
        backgroundColor: 'white',
        boxShadow: '0 10px 40px rgba(15,26,19,0.08), 0 0 0 1px rgba(15,26,19,0.04)'
      }
    : {
        backgroundColor: 'rgba(15,26,19,0.55)',
        backdropFilter: 'blur(18px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
        border: '1px solid rgba(255,255,255,0.12)'
      };

  const textColor = onLight ? CHARCOAL : 'white';
  const ghostHover = onLight ? '#F7F5F0' : 'rgba(255,255,255,0.08)';

  return (
    <div className="fixed top-5 left-0 right-0 z-50 px-4">
      <nav
        className="max-w-6xl mx-auto flex items-center justify-between pl-4 pr-2 py-2 rounded-full"
        style={navStyle}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: onLight ? CHARCOAL : 'white' }}
          >
            <Sprout
              size={18}
              color={onLight ? 'white' : CHARCOAL}
              strokeWidth={2}
            />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 18,
              color: textColor,
              letterSpacing: '-0.02em'
            }}
          >
            Gabest
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 h-10 rounded-full transition-colors"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 600,
              color: textColor
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = ghostHover)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <ArrowLeft size={14} />
            Accueil
          </button>
          <button
            onClick={() => (onLogout ? onLogout() : navigate('/login'))}
            className="group inline-flex items-center gap-2 pl-4 pr-1 py-1 rounded-full transition-transform hover:scale-[1.02]"
            style={{
              backgroundColor: GREEN,
              color: 'white',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            <span className="pr-1">Déconnexion</span>
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'white' }}
            >
              <LogOut size={13} style={{ color: CHARCOAL }} />
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export function DashboardHero({
  overline,
  title,
  titleAccent,
  description,
  image,
  arabic,
  stats
}: {
  overline: string;
  title: string;
  titleAccent?: string;
  description: string;
  image: string;
  arabic?: string;
  stats?: { value: string; label: string }[];
}) {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: 560, paddingTop: 120 }}
    >
      <div className="absolute inset-0 z-0">
        <img
          src={image}
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(1.08) brightness(0.86)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(15,26,19,0.35) 0%, rgba(15,26,19,0.55) 55%, rgba(15,26,19,0.85) 100%)'
          }}
        />
      </div>

      {arabic && (
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
          {arabic}
        </div>
      )}

      <div className="relative z-10 container mx-auto px-6 lg:px-12 pt-10 pb-16">
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
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
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
              {overline}
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(38px, 5.5vw, 72px)',
              fontWeight: 800,
              lineHeight: 1.02,
              color: 'white',
              letterSpacing: '-0.035em'
            }}
          >
            {title}
            {titleAccent && (
              <>
                {' '}
                <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 800 }}>
                  {titleAccent}
                </span>
              </>
            )}
          </h1>

          <p
            className="mt-6 max-w-xl"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 16,
              lineHeight: 1.6,
              fontWeight: 400
            }}
          >
            {description}
          </p>

          {stats && stats.length > 0 && (
            <div className="mt-10 flex items-center gap-6 flex-wrap">
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col">
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 34,
                      fontWeight: 800,
                      color: 'white',
                      letterSpacing: '-0.03em',
                      lineHeight: 1
                    }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="mt-1.5"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 500,
                      letterSpacing: 0.3
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #F7F5F0 100%)'
        }}
      />
    </section>
  );
}

export function SectionHeader({
  overline,
  title,
  accent
}: {
  overline: string;
  title: string;
  accent?: string;
}) {
  return (
    <div className="mb-10">
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
        {overline}
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 3.2vw, 42px)',
          fontWeight: 700,
          lineHeight: 1.08,
          color: CHARCOAL,
          letterSpacing: '-0.03em',
          maxWidth: 720
        }}
      >
        {title}
        {accent && (
          <>
            {' '}
            <span style={{ color: '#98A29A' }}>{accent}</span>
          </>
        )}
      </h2>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  unit,
  trend,
  tone = 'neutral'
}: {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  tone?: 'neutral' | 'up' | 'down' | 'warn';
}) {
  const toneColor =
    tone === 'up'
      ? GREEN
      : tone === 'down'
      ? '#D24C4C'
      : tone === 'warn'
      ? '#E0A23A'
      : CHARCOAL;

  return (
    <div
      className="p-6 rounded-3xl"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(15,26,19,0.06)',
        boxShadow: '0 6px 24px rgba(15,26,19,0.04)'
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          color: '#98A29A',
          letterSpacing: 2,
          fontWeight: 600,
          textTransform: 'uppercase',
          marginBottom: 14
        }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 38,
            fontWeight: 800,
            color: CHARCOAL,
            letterSpacing: '-0.03em',
            lineHeight: 1
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 600,
              color: '#98A29A'
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {trend && (
        <div
          className="mt-2"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            fontWeight: 600,
            color: toneColor
          }}
        >
          {trend}
        </div>
      )}
    </div>
  );
}

export function GreenPillButton({
  children,
  onClick
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-2 pl-5 pr-2 py-2 rounded-full transition-transform hover:scale-[1.02]"
      style={{
        backgroundColor: GREEN,
        color: 'white',
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
