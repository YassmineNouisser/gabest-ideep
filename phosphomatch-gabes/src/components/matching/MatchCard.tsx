import { ExternalLink, Mail, Phone } from 'lucide-react';
import type { Match } from '../../types';
import { formatCurrency } from '../../utils/format';
import { Card } from '../ui/Card';
import { IndustryBadge } from '../ui/Badge';
import { CompatibilityRing } from './CompatibilityRing';

const rankClasses = ['bg-accent text-ink', 'bg-gray-200 text-gray-800', 'bg-orange-100 text-orange-800'];

export function MatchCard({ match, rank }: { match: Match; rank: number }) {
  return (
    <Card className="p-5 transition hover:-translate-y-1 hover:shadow-card-hover">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className={`inline-flex rounded-md px-3 py-1 text-sm font-bold ${rankClasses[rank - 1] ?? 'bg-primary/10 text-primary'}`}>
            #{rank}
          </span>
          <h3 className="mt-3 text-xl font-bold text-ink">{match.company_name}</h3>
          <p className="mt-1 text-sm text-muted">{match.location}</p>
          <div className="mt-3"><IndustryBadge industry={match.industry_type} /></div>
        </div>
        <CompatibilityRing score={match.compatibility_score} />
      </div>
      <div className="mt-5 rounded-lg bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Valeur estimée</p>
        <p className="mt-1 font-mono text-2xl font-bold text-primary">{formatCurrency(match.estimated_deal_value_usd)}</p>
      </div>
      <p className="mt-4 border-l-4 border-primary pl-4 text-sm italic leading-6 text-muted">{match.reasoning}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-surface" href={`tel:${match.phone}`}>
          <Phone className="h-4 w-4" /> Appeler
        </a>
        <a className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-surface" href={`mailto:${match.email}`}>
          <Mail className="h-4 w-4" /> Email
        </a>
        <a className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-surface" href={match.website} target="_blank" rel="noreferrer">
          <ExternalLink className="h-4 w-4" /> Site
        </a>
      </div>
    </Card>
  );
}
