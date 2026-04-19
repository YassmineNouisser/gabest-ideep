import type { BatchStatus, Buyer } from '../types';

export function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)} DT`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function industryLabel(industry: Buyer['industry_type']): string {
  const labels: Record<Buyer['industry_type'], string> = {
    cement: 'Ciment',
    plaster: 'Plâtre',
    fertilizer: 'Engrais',
    construction: 'Construction',
    'recycling startup': 'Recyclage',
  };
  return labels[industry];
}

export function statusLabel(status: BatchStatus): string {
  const labels: Record<BatchStatus, string> = {
    pending: 'En attente',
    contacted: 'Contacté',
    negotiating: 'Négociation',
    closed: 'Clôturé',
  };
  return labels[status];
}

export function bestMatchScore(matches: { compatibility_score: number }[]): number {
  return matches[0]?.compatibility_score ?? 0;
}
