import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SavedBatch } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useMatching } from '../hooks/useMatching';
import { saveBatch } from '../services/storage';
import { BatchForm } from '../components/batch/BatchForm';
import { LoadingState } from '../components/matching/LoadingState';
import { ResultsSection } from '../components/matching/ResultsSection';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { Button } from '../components/ui/Button';

export function NewBatchPage() {
  const { seller } = useAuth();
  const { isLoading, error, runMatching } = useMatching();
  const [savedBatch, setSavedBatch] = useState<SavedBatch | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (batch: SavedBatch['batch']) => {
    if (!seller) return;
    setSavedBatch(null);
    const response = await runMatching(batch);
    if (!response) return;
    const saved = saveBatch(seller.id, batch, response.matches);
    setSavedBatch(saved);
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">⚗️ Nouveau lot de phosphogypse</h1>
        <p className="mt-2 text-muted">Renseignez les analyses de laboratoire pour trouver les meilleurs acheteurs.</p>
      </div>
      <BatchForm initialLocation={seller?.location ?? 'Gabès, Tunisia'} isLoading={isLoading} onSubmit={handleSubmit} />
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorBanner message={error} /> : null}
      <div ref={resultsRef} className="space-y-6">
        {savedBatch ? (
          <>
            <ResultsSection matches={savedBatch.matches} batch={savedBatch.batch} />
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" disabled>💾 Enregistrer ce lot</Button>
              <Link to={`/batch/${savedBatch.id}`}><Button>📊 Voir le détail complet</Button></Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
