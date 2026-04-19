import { useEffect, useState } from 'react';

const messages = [
  'Analyse des contraintes chimiques...',
  'Filtrage des acheteurs méditerranéens...',
  'Calcul prix, distance et capacité...',
  'Préparation du classement IA...',
];

export function LoadingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 1200);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg border border-primary/20 bg-white p-8 text-center shadow-card" aria-live="polite">
      <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <h3 className="text-lg font-bold text-ink">Matching IA en cours</h3>
      <p className="mt-2 text-sm text-muted">{messages[index]}</p>
    </div>
  );
}
