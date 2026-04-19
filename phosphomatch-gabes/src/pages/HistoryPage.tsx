import { useMemo, useState } from 'react';
import type { BatchStatus, SavedBatch } from '../types';
import { useAuth } from '../hooks/useAuth';
import { getBatchesBySeller } from '../services/storage';
import { BatchCard } from '../components/batch/BatchCard';
import { EmptyState } from '../components/ui/EmptyState';

type SortMode = 'newest' | 'oldest' | 'highest-score' | 'highest-value';
type StatusFilter = 'all' | BatchStatus;

export function HistoryPage() {
  const { seller } = useAuth();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortMode>('newest');
  const [dateQuery, setDateQuery] = useState('');
  const batches = seller ? getBatchesBySeller(seller.id) : [];

  const filtered = useMemo(() => {
    const next = batches
      .filter((batch) => (status === 'all' ? true : batch.status === status))
      .filter((batch) => formatDateOnly(batch.created_at).includes(dateQuery));
    return sortBatches(next, sort);
  }, [batches, dateQuery, sort, status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">📚 Historique des lots</h1>
        <p className="mt-2 text-muted">Retrouvez les recherches, matchs et négociations sauvegardés.</p>
      </div>
      <div className="grid gap-3 rounded-lg border border-border bg-white p-4 shadow-card md:grid-cols-3">
        <input className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Recherche par date, ex. 2026-04" value={dateQuery} onChange={(event) => setDateQuery(event.target.value)} />
        <select className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="contacted">Contacté</option>
          <option value="negotiating">Négociation</option>
          <option value="closed">Clôturé</option>
        </select>
        <select className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
          <option value="newest">Plus récents</option>
          <option value="oldest">Plus anciens</option>
          <option value="highest-score">Meilleur score</option>
          <option value="highest-value">Valeur élevée</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Aucun lot trouvé" description="Ajustez les filtres ou postez un nouveau lot pour alimenter l'historique." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((batch) => <BatchCard key={batch.id} savedBatch={batch} />)}
        </div>
      )}
    </div>
  );
}

function formatDateOnly(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function sortBatches(batches: SavedBatch[], sort: SortMode): SavedBatch[] {
  return [...batches].sort((a, b) => {
    if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sort === 'highest-score') return (b.matches[0]?.compatibility_score ?? 0) - (a.matches[0]?.compatibility_score ?? 0);
    if (sort === 'highest-value') return (b.matches[0]?.estimated_deal_value_usd ?? 0) - (a.matches[0]?.estimated_deal_value_usd ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
