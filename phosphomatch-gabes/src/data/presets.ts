import type { Batch } from '../types';

export interface BatchPreset {
  id: string;
  label: string;
  description: string;
  values: Batch;
}

export const batchPresets: BatchPreset[] = [
  {
    id: 'gct-standard',
    label: 'Lot standard GCT',
    description: 'Profil moyen issu des lignes de production de Gabès',
    values: {
      purity: 82,
      fluor: 0.85,
      p2o5: 1.25,
      humidity: 16,
      heavy_metals: 42,
      radioactivity: 620,
      quantity: 5000,
      location: 'Gabès, Tunisia',
    },
  },
  {
    id: 'high-purity',
    label: 'Haute pureté',
    description: 'Lot séché et trié pour usages cimentiers ou plâtre',
    values: {
      purity: 91,
      fluor: 0.42,
      p2o5: 0.75,
      humidity: 8,
      heavy_metals: 24,
      radioactivity: 410,
      quantity: 2500,
      location: 'Gabès, Tunisia',
    },
  },
  {
    id: 'low-grade',
    label: 'Faible qualité',
    description: 'Lot brut à orienter vers recyclage ou construction',
    values: {
      purity: 68,
      fluor: 1.45,
      p2o5: 2.2,
      humidity: 24,
      heavy_metals: 78,
      radioactivity: 840,
      quantity: 8000,
      location: 'Gabès, Tunisia',
    },
  },
];
