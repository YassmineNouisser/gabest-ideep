import { ChangeEvent, FocusEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { BatchStatus, SavedBatch } from '../types';
import { deleteBatch, getBatchById, updateBatchNotes, updateBatchStatus } from '../services/storage';
import { formatDate } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/Badge';
import { ResultsSection } from '../components/matching/ResultsSection';
import { MapView } from '../components/matching/MapView';

const statuses: BatchStatus[] = ['pending', 'contacted', 'negotiating', 'closed'];

export function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [savedBatch, setSavedBatch] = useState<SavedBatch | null>(() => (id ? getBatchById(id) : null));

  if (!savedBatch) {
    return <EmptyState title="Lot introuvable" description="Ce lot n'existe plus ou a été supprimé." action={<Link to="/history"><Button>Retour historique</Button></Link>} />;
  }

  const specs = [
    ['Pureté', `${savedBatch.batch.purity}%`],
    ['Fluor', `${savedBatch.batch.fluor}%`],
    ['P2O5', `${savedBatch.batch.p2o5}%`],
    ['Humidité', `${savedBatch.batch.humidity}%`],
    ['Métaux lourds', `${savedBatch.batch.heavy_metals} ppm`],
    ['Radioactivité', `${savedBatch.batch.radioactivity} Bq/kg`],
    ['Quantité', `${savedBatch.batch.quantity.toLocaleString('fr-FR')} tonnes`],
    ['Localisation', savedBatch.batch.location],
  ];

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const updated = updateBatchStatus(savedBatch.id, event.target.value as BatchStatus);
    setSavedBatch(updated);
  };

  const handleNotesBlur = (event: FocusEvent<HTMLTextAreaElement>) => {
    const updated = updateBatchNotes(savedBatch.id, event.target.value);
    setSavedBatch(updated);
  };

  const handleDelete = () => {
    if (!window.confirm('Supprimer définitivement ce lot ?')) return;
    deleteBatch(savedBatch.id);
    navigate('/history');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link className="text-sm font-semibold text-primary hover:underline" to="/history">← Retour à l'historique</Link>
          <h1 className="mt-2 text-3xl font-bold text-ink">Détail du lot</h1>
          <p className="mt-1 text-muted">{formatDate(savedBatch.created_at)}</p>
        </div>
        <StatusBadge status={savedBatch.status} />
      </div>
      <Card className="p-5">
        <h2 className="text-xl font-bold text-ink">Spécifications du lot</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {specs.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
              <p className="mt-1 font-bold text-ink">{value}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="text-xl font-bold text-ink">Suivi commercial</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Statut</span>
            <select className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" value={savedBatch.status} onChange={handleStatusChange}>
              {statuses.map((status) => (
                <option key={status} value={status}>{statusLabelFr(status)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Notes</span>
            <textarea className="min-h-28 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" defaultValue={savedBatch.notes} placeholder="Compte rendu d'appel, prix cible, prochaine action..." onBlur={handleNotesBlur} />
          </label>
        </div>
      </Card>
      <ResultsSection matches={savedBatch.matches} batch={savedBatch.batch} />
      <section>
        <h2 className="mb-4 text-xl font-bold text-ink">Carte</h2>
        <MapView matches={savedBatch.matches} sellerLocation={savedBatch.batch.location} />
      </section>
      <Card className="border-danger/30 p-5">
        <h2 className="text-xl font-bold text-danger">Zone danger</h2>
        <p className="mt-2 text-sm text-muted">La suppression retire ce lot et ses matchs de l'historique local.</p>
        <Button className="mt-4" variant="danger" onClick={handleDelete}>Supprimer ce lot</Button>
      </Card>
    </div>
  );
}

function statusLabelFr(status: BatchStatus): string {
  const labels: Record<BatchStatus, string> = {
    pending: 'En attente',
    contacted: 'Contacté',
    negotiating: 'Négociation',
    closed: 'Clôturé',
  };
  return labels[status];
}
