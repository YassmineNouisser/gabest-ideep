import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Cpu, Sparkles, Binary, Database, Layers, Activity } from 'lucide-react';

export type AIProcessingStep = {
  icon: any;
  title: string;
  sub: string;
};

type Variant = 'dark' | 'light';

type Props = {
  overline?: string;
  title?: string;
  subtitle?: React.ReactNode;
  steps: AIProcessingStep[];
  accent?: string;
  variant?: Variant;
  /** Total playback duration (ms) for the staged animation. Steps divide this equally. */
  durationMs?: number;
  /** Extra classes for the outer wrapper. */
  className?: string;
  /** When true, render a more compact layout (inline panels). */
  compact?: boolean;
};

const DEFAULT_GREEN = '#2BA24C';

/**
 * Creative "AI is being downloaded / booted up" overlay.
 * Plays an animated sequence of staged tasks, a token-stream backdrop,
 * a progress arc and a progress bar.
 */
export function AIProcessingOverlay({
  overline = 'Analyse IA en cours',
  title = 'Téléchargement du modèle…',
  subtitle,
  steps,
  accent = DEFAULT_GREEN,
  variant = 'dark',
  durationMs = 2200,
  className = '',
  compact = false
}: Props) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const dark = variant === 'dark';
  const bg = dark ? '#0F1A13' : '#FFFFFF';
  const fg = dark ? 'white' : '#0F1A13';
  const subFg = dark ? 'rgba(255,255,255,0.7)' : '#5A5A5E';
  const dimFg = dark ? 'rgba(255,255,255,0.45)' : '#98A29A';
  const cellBg = dark ? 'rgba(255,255,255,0.06)' : '#F7F5F0';
  const cellBorder = dark ? 'rgba(255,255,255,0.1)' : 'rgba(15,26,19,0.06)';

  const stepMs = Math.max(250, Math.floor(durationMs / Math.max(1, steps.length)));

  useEffect(() => {
    setActiveStep(0);
    setProgress(0);
    const stepTimers = steps.map((_, i) =>
      window.setTimeout(() => setActiveStep(i), i * stepMs)
    );
    const startedAt = performance.now();
    let raf = 0;
    const tick = () => {
      const pct = Math.min(99, ((performance.now() - startedAt) / durationMs) * 100);
      setProgress(pct);
      if (pct < 99) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stepTimers.forEach(window.clearTimeout);
      cancelAnimationFrame(raf);
    };
    // re-run whenever the set of steps changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length, durationMs]);

  const tokens = useMemo(() => {
    // Stable, non-random token stream so React doesn't reshuffle on re-render.
    return Array.from({ length: 14 }, (_, i) => ({
      x: 4 + ((i * 73) % 92),
      delay: (i % 7) * 0.18,
      dur: 2.4 + ((i * 17) % 18) / 10,
      text: ['0x2BA', 'IA', 'ΔT', '∫', 'α·β', 'XGB', 'CNN', 'λ', 'ResNet', 'PCI', 'y=', 'H₂O', 'SO₄', 'NO₃'][i % 14]
    }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-3xl overflow-hidden ${className}`}
      style={{
        backgroundColor: bg,
        color: fg,
        padding: compact ? '28px 26px' : '40px 36px',
        boxShadow: dark ? `0 20px 60px ${accent}33` : '0 12px 40px rgba(15,26,19,0.08)'
      }}
    >
      {/* ─── glows ─── */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}55, transparent 70%)`,
          filter: 'blur(80px)',
          transform: 'translate(35%,-35%)'
        }}
      />
      <div
        className="absolute bottom-0 left-0 pointer-events-none"
        style={{
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}22, transparent 70%)`,
          filter: 'blur(70px)',
          transform: 'translate(-30%,30%)'
        }}
      />

      {/* ─── floating tokens (binary / formula stream) ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {tokens.map((t, i) => (
          <motion.span
            key={i}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '-10%', opacity: [0, 0.55, 0] }}
            transition={{
              duration: t.dur,
              delay: t.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{
              position: 'absolute',
              left: `${t.x}%`,
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              fontSize: 11,
              color: accent,
              whiteSpace: 'nowrap',
              mixBlendMode: dark ? 'screen' : 'multiply',
              letterSpacing: 1.2
            }}
          >
            {t.text}
          </motion.span>
        ))}
      </div>

      {/* ─── main grid ─── */}
      <div className="relative grid lg:grid-cols-12 gap-8 items-center">
        {/* LEFT — neural orb + header */}
        <div className="lg:col-span-5 flex flex-col items-start">
          <div className="relative mb-5" style={{ width: 96, height: 96 }}>
            {/* rotating rings */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: `1.5px dashed ${accent}99`,
                borderTopColor: 'transparent'
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                inset: 10,
                border: `1px solid ${accent}66`,
                borderBottomColor: 'transparent'
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
            {/* progress arc */}
            <svg
              className="absolute inset-0"
              viewBox="0 0 100 100"
              style={{ transform: 'rotate(-90deg)' }}
            >
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,26,19,0.08)'}
                strokeWidth="3"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={accent}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - progress / 100)}
                style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
              />
            </svg>
            {/* core */}
            <motion.div
              className="absolute rounded-full flex items-center justify-center"
              style={{
                inset: 22,
                backgroundColor: accent,
                boxShadow: `0 10px 30px ${accent}66, inset 0 0 18px rgba(255,255,255,0.35)`
              }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Cpu size={22} color="white" strokeWidth={2.4} />
            </motion.div>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              color: accent,
              letterSpacing: 2.4,
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: 8
            }}
          >
            {overline}
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 2.5vw, 30px)',
              fontWeight: 800,
              color: fg,
              lineHeight: 1.1,
              letterSpacing: '-0.025em'
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              className="mt-3 max-w-sm"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                color: subFg,
                lineHeight: 1.55
              }}
            >
              {subtitle}
            </p>
          )}

          {/* progress bar + % */}
          <div className="mt-6 w-full max-w-sm">
            <div
              className="flex items-center justify-between mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10.5,
                letterSpacing: 1.6,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: dimFg
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Binary size={11} />
                Téléchargement modèle IA
              </span>
              <span style={{ color: accent, fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,26,19,0.07)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 0 12px ${accent}88`,
                  width: `${progress}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT — staged steps */}
        <div className="lg:col-span-7 space-y-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-xl relative overflow-hidden"
                style={{
                  backgroundColor:
                    done ? `${accent}22` :
                    active ? cellBg :
                    'transparent',
                  border: `1px solid ${
                    done ? `${accent}55` :
                    active ? cellBorder :
                    (dark ? 'rgba(255,255,255,0.04)' : 'rgba(15,26,19,0.04)')
                  }`
                }}
              >
                {active && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                    style={{
                      background: `linear-gradient(90deg, transparent, ${accent}22, transparent)`
                    }}
                  />
                )}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 relative z-10"
                  style={{
                    backgroundColor: done ? accent : active ? (dark ? 'rgba(255,255,255,0.1)' : `${accent}15`) : (dark ? 'rgba(255,255,255,0.04)' : 'rgba(15,26,19,0.04)'),
                    color: done ? 'white' : active ? accent : dimFg
                  }}
                >
                  {done ? (
                    <Check size={16} strokeWidth={3} />
                  ) : active ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Icon size={15} />
                    </motion.div>
                  ) : (
                    <Icon size={15} />
                  )}
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 13.5,
                      fontWeight: 800,
                      color: done || active ? fg : dimFg,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    className="mt-0.5 truncate"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 11.5,
                      color: done ? subFg : active ? subFg : dimFg
                    }}
                  >
                    {s.sub}
                  </div>
                </div>
                {active && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full relative z-10"
                    style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/** Handy set of default icons for ad-hoc step lists. */
export const AI_ICONS = {
  Cpu,
  Sparkles,
  Database,
  Layers,
  Activity,
  Binary
};
