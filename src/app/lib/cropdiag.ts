// Client for the GabesHeal F2 plant-disease model (ResNet-50, 38 classes).
// Calls POST /predict-disease on the FastAPI backend.

export interface CropDiagTopCandidate {
  plant: string;
  disease: string;
  confidence: number;
  classIdx: number;
}

export interface CropDiagTreatment {
  severity: 'Aucune' | 'Moyenne' | 'Élevée' | 'Critique' | 'Inconnue';
  product: string;
  activeIngredient: string;
  dose: string;
  priceDt: number;
  priceUnit: string;
  bioAlternative: string;
  timing: string;
}

export interface CropDiagCauses {
  pathogen: string;
  conditions: string[];
  transmission: string[];
  riskFactors: string[];
  prevention: string[];
  localNote: string;
}

export type CropDiagReliability = 'high' | 'medium' | 'low';

export interface CropDiagLocalization {
  imageSize: number;
  processedImage: string; // data:image/jpeg;base64,... (with circle drawn)
  boxedImage: string;     // data:image/jpeg;base64,... (rounded rectangle outline)
  gradcamImage: string;   // data:image/jpeg;base64,... (Grad-CAM blended on photo)
  heatmap: string;        // data:image/png;base64,...  (colorized CAM only)
  bbox: { x0: number; y0: number; x1: number; y1: number };
  circle: { cx: number; cy: number; r: number };
  threshold: number;
  coverage: number;
  method: string;
}

export interface CropDiagPrediction {
  plant: string;
  disease: string;
  rawClass: string;
  classIdx: number;
  confidence: number;
  margin: number;
  isHealthy: boolean;
  reliability: CropDiagReliability;
  reliabilityLabel: string;
  reliabilityHint: string;
  top3: CropDiagTopCandidate[];
  treatment: CropDiagTreatment;
  causes: CropDiagCauses;
  localization: CropDiagLocalization;
  model: {
    backbone: string;
    classes: number;
    weights_file: string;
  };
}

const BASE = (import.meta as any).env?.VITE_GABEST_API ?? 'http://127.0.0.1:8000';

export async function predictPlantDisease(file: File): Promise<CropDiagPrediction> {
  const form = new FormData();
  form.append('file', file, file.name);
  const res = await fetch(`${BASE}/predict-disease`, {
    method: 'POST',
    body: form
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`CropDiag API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}
