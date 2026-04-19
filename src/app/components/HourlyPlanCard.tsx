import { useEffect, useState } from 'react';
import { Activity, Factory, Loader2 } from 'lucide-react';
import {
  fetchHourlyDispersion,
  type HourSlot
} from '../lib/dispersion';
import type { ZoneName } from '../lib/ai';

const GREEN = '#2BA24C';
const GREEN_DARK = '#1E7A38';
const CHARCOAL = '#0F1A13';
const MUTED = '#98A29A';
const CREAM = '#F7F5F0';
const BORDER = 'rgba(15,26,19,0.08)';

export function HourlyPlanCard({
  zone = 'Ghannouch',
  windDeg,
  windSpeed
}: {
  zone?: ZoneName;
  windDeg: number | null;
  windSpeed: number | null;
}) {
  const [slots, setSlots] = useState<HourSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (windDeg == null || windSpeed == null) return;
    let cancelled = false;
    setLoading(true);
    fetchHourlyDispersion(zone, windDeg, windSpeed)
      .then(s => { if (!cancelled) setSlots(s); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [zone, windDeg, windSpeed]);

  const maxPoll = Math.max(1, ...slots.map(s => s.pollutionKg));
  const nowHour = new Date().getHours();

  return (
    <div
      className="p-6 rounded-2xl"
      style={{ backgroundColor: 'white', border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10.5,
              color: GREEN,
              letterSpacing: 2.2,
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: 6
            }}
          >
            Planning 24 h · production recommandée
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 700,
              color: CHARCOAL,
              letterSpacing: '-0.02em'
            }}
          >
            Production & émissions horaires selon le vent
          </h2>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Legend dot="#2BA24C" label="Optimal" />
          <Legend dot="#D29922" label="Modéré" />
          <Legend dot="#D24C4C" label="Danger" />
        </div>
      </div>

      {loading ? (
        <div
          className="inline-flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, color: MUTED }}
        >
          <Loader2 size={13} className="animate-spin" />
          Calcul des 24 prochaines heures depuis OpenWeather…
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          <ChartPanel
            icon={<Factory size={13} />}
            title="Production & risque"
            unit="%"
          >
            <BarChart24
              slots={slots}
              valueOf={s => s.rec.prodPct}
              colorOf={s => s.rec.color}
              max={100}
              nowHour={nowHour}
              riskOverlay
            />
            <AxisLabels slots={slots} />
          </ChartPanel>
          <ChartPanel
            icon={<Activity size={13} />}
            title="Pollution émise"
            unit="kg/h"
          >
            <BarChart24
              slots={slots}
              valueOf={s => s.pollutionKg}
              colorOf={s => s.rec.color}
              max={Math.max(maxPoll, 50)}
              nowHour={nowHour}
            />
            <AxisLabels slots={slots} />
          </ChartPanel>
        </div>
      )}
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{ fontFamily: 'var(--font-display)', fontSize: 11.5, color: '#3F4B43' }}
    >
      <span style={{ width: 9, height: 9, borderRadius: 2, background: dot, display: 'inline-block' }} />
      {label}
    </span>
  );
}

function ChartPanel({
  icon,
  title,
  unit,
  children
}: {
  icon: React.ReactNode;
  title: string;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}
    >
      <div
        className="flex items-center justify-between mb-3"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <div
          className="inline-flex items-center gap-1.5"
          style={{ fontSize: 11, color: GREEN_DARK, letterSpacing: 1.4, fontWeight: 700, textTransform: 'uppercase' }}
        >
          {icon}
          {title}
        </div>
        <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{unit}</span>
      </div>
      {children}
    </div>
  );
}

function BarChart24({
  slots,
  valueOf,
  colorOf,
  max,
  nowHour,
  riskOverlay = false
}: {
  slots: HourSlot[];
  valueOf: (s: HourSlot) => number;
  colorOf: (s: HourSlot) => string;
  max: number;
  nowHour: number;
  riskOverlay?: boolean;
}) {
  const H = 130;
  const W = 100; // viewBox width % units
  const bw = W / slots.length;
  const riskPath = slots
    .map((s, i) => {
      const x = i * bw + bw / 2;
      const y = H - (s.risk / 100) * (H - 8) - 4;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <div className="relative" style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: H, display: 'block' }}>
        {[0.25, 0.5, 0.75].map(g => (
          <line
            key={g}
            x1={0}
            x2={W}
            y1={H * (1 - g)}
            y2={H * (1 - g)}
            stroke="rgba(15,26,19,0.05)"
            strokeWidth={0.4}
          />
        ))}
        {slots.map((s, i) => {
          const v = valueOf(s);
          const h = Math.max(1.5, (v / max) * (H - 6));
          const x = i * bw + bw * 0.12;
          const w = bw * 0.76;
          const y = H - h;
          const isNow = s.hour === nowHour;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={0.6}
                fill={colorOf(s)}
                opacity={v === 0 ? 0.25 : 0.92}
              >
                <title>{`${s.hourLabel} · ${s.rec.label} · ${s.rec.prodPct}% · vent ${s.windSpeed.toFixed(0)} km/h`}</title>
              </rect>
              {isNow && (
                <rect
                  x={x - 0.4}
                  y={y - 0.4}
                  width={w + 0.8}
                  height={h + 0.4}
                  fill="none"
                  stroke={CHARCOAL}
                  strokeWidth={0.6}
                  rx={0.8}
                />
              )}
            </g>
          );
        })}
        {riskOverlay && (
          <path
            d={riskPath}
            fill="none"
            stroke="#7C3AED"
            strokeWidth={1.1}
            strokeLinecap="round"
            opacity={0.85}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {riskOverlay && (
        <div
          className="absolute top-0 right-0 inline-flex items-center gap-1.5"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10.5,
            color: '#7C3AED',
            background: 'rgba(255,255,255,0.85)',
            padding: '2px 6px',
            borderRadius: 4
          }}
        >
          <span style={{ width: 14, height: 2, background: '#7C3AED', display: 'inline-block', borderRadius: 1 }} />
          Risque /100
        </div>
      )}
    </div>
  );
}

function AxisLabels({ slots }: { slots: HourSlot[] }) {
  const nowHour = new Date().getHours();
  return (
    <div
      className="grid mt-1"
      style={{
        gridTemplateColumns: `repeat(${slots.length}, 1fr)`,
        gap: 0
      }}
    >
      {slots.map((s, i) => {
        const isNow = s.hour === nowHour;
        const show = i % 3 === 0 || isNow;
        return (
          <span
            key={i}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 9.5,
              color: isNow ? CHARCOAL : MUTED,
              fontWeight: isNow ? 800 : 500,
              textAlign: 'center'
            }}
          >
            {show ? s.hourLabel : ''}
          </span>
        );
      })}
    </div>
  );
}
