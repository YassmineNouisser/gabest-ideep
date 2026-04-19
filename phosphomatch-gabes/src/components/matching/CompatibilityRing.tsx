import { useEffect, useState } from 'react';

export function CompatibilityRing({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const color = score >= 80 ? '#0d7377' : score >= 50 ? '#ff9f43' : '#e74c3c';
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timeout = window.setTimeout(() => setAnimatedScore(score), 120);
    return () => window.clearTimeout(timeout);
  }, [score]);

  return (
    <div className="relative h-24 w-24">
      <svg className="-rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} stroke="#e5e7eb" strokeWidth="9" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeWidth="9"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold text-ink">
        {score}%
      </span>
    </div>
  );
}
