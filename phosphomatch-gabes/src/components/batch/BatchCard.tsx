import { Link } from 'react-router-dom';
import type { SavedBatch } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';

export function BatchCard({ savedBatch }: { savedBatch: SavedBatch }) {
  const topMatch = savedBatch.matches[0];
  return (
    <Link to={`/batch/${savedBatch.id}`} className="block transition hover:-translate-y-1">
      <Card className="h-full p-5 hover:shadow-card-hover">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{formatDate(savedBatch.created_at)}</p>
            <h3 className="mt-2 text-lg font-bold text-ink">{savedBatch.batch.quantity.toLocaleString('fr-FR')} tonnes</h3>
          </div>
          <StatusBadge status={savedBatch.status} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-surface p-3">
            <span className="text-muted">Pureté</span>
            <strong className="block text-ink">{savedBatch.batch.purity}%</strong>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <span className="text-muted">Score</span>
            <strong className="block text-primary">{topMatch?.compatibility_score ?? 0}%</strong>
          </div>
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Meilleur match</p>
          <p className="mt-1 font-bold text-ink">{topMatch?.company_name ?? 'Aucun match'}</p>
          <p className="mt-1 font-mono text-sm text-primary">{formatCurrency(topMatch?.estimated_deal_value_usd ?? 0)}</p>
        </div>
      </Card>
    </Link>
  );
}
