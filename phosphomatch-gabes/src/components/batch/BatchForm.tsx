import { FormEvent, useState } from 'react';
import { Beaker, Droplets, Factory, FlaskConical, Gauge, MapPin, Package, ShieldAlert } from 'lucide-react';
import type { Batch } from '../../types';
import { PresetChips } from './PresetChips';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { BatchPreset } from '../../data/presets';

interface BatchFormProps {
  initialLocation: string;
  isLoading: boolean;
  onSubmit: (batch: Batch) => void;
}

export function BatchForm({ initialLocation, isLoading, onSubmit }: BatchFormProps) {
  const [batch, setBatch] = useState<Batch>({
    purity: 82,
    fluor: 0.85,
    p2o5: 1.25,
    humidity: 16,
    heavy_metals: 42,
    radioactivity: 620,
    quantity: 5000,
    location: initialLocation,
  });

  const update = (field: keyof Batch, value: string) => {
    setBatch((current) => ({
      ...current,
      [field]: field === 'location' ? value : Number(value),
    }));
  };

  const applyPreset = (preset: BatchPreset) => {
    setBatch({ ...preset.values, location: initialLocation || preset.values.location });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(batch);
  };

  return (
    <form className="space-y-6 rounded-lg border border-border bg-white p-5 shadow-card" onSubmit={handleSubmit}>
      <PresetChips onSelect={applyPreset} />
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Pureté CaSO4 (%)" type="number" min="0" max="100" step="0.1" value={batch.purity} icon={<Beaker className="h-4 w-4" />} helper="Plus la pureté est élevée, plus le potentiel prix augmente." onChange={(event) => update('purity', event.target.value)} />
        <Input label="Fluor (%)" type="number" min="0" step="0.01" value={batch.fluor} icon={<ShieldAlert className="h-4 w-4" />} helper="Seuil critique pour ciment et plâtre." onChange={(event) => update('fluor', event.target.value)} />
        <Input label="P2O5 (%)" type="number" min="0" step="0.01" value={batch.p2o5} icon={<FlaskConical className="h-4 w-4" />} helper="Impacte la compatibilité industrielle." onChange={(event) => update('p2o5', event.target.value)} />
        <Input label="Humidité (%)" type="number" min="0" max="100" step="0.1" value={batch.humidity} icon={<Droplets className="h-4 w-4" />} helper="Un lot plus sec réduit les coûts logistiques." onChange={(event) => update('humidity', event.target.value)} />
        <Input label="Métaux lourds (ppm)" type="number" min="0" step="1" value={batch.heavy_metals} icon={<Gauge className="h-4 w-4" />} helper="Contrôle qualité pour usages sensibles." onChange={(event) => update('heavy_metals', event.target.value)} />
        <Input label="Radioactivité (Bq/kg)" type="number" min="0" step="1" value={batch.radioactivity} icon={<Factory className="h-4 w-4" />} helper="Conformité environnementale." onChange={(event) => update('radioactivity', event.target.value)} />
        <Input label="Quantité (tonnes)" type="number" min="1" step="1" value={batch.quantity} icon={<Package className="h-4 w-4" />} helper="Volume disponible pour négociation." onChange={(event) => update('quantity', event.target.value)} />
        <Input label="Localisation" value={batch.location} icon={<MapPin className="h-4 w-4" />} onChange={(event) => update('location', event.target.value)} />
      </div>
      <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
        🔍 Trouver les meilleurs acheteurs
      </Button>
    </form>
  );
}
