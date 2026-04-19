import type { Batch, Match } from '../../types';
import { MatchCard } from './MatchCard';
import { MapView } from './MapView';
import { EmptyState } from '../ui/EmptyState';

export function ResultsSection({ matches, batch }: { matches: Match[]; batch: Batch }) {
  if (matches.length === 0) {
    return (
      <EmptyState
        title="Aucun acheteur compatible"
        description="Les contraintes techniques éliminent tous les acheteurs de la base. Essayez un lot avec moins d'humidité, moins de fluor ou une pureté plus élevée."
      />
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Top 3 acheteurs recommandés</h2>
        <p className="mt-2 text-muted">Classement basé sur contraintes qualité, capacité, prix et proximité méditerranéenne.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {matches.map((match, index) => (
          <div key={match.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 120}ms` }}>
            <MatchCard match={match} rank={index + 1} />
          </div>
        ))}
      </div>
      <MapView matches={matches} sellerLocation={batch.location} />
    </section>
  );
}
