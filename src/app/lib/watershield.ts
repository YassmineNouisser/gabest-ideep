// Client for the WaterShield irrigation-water quality model.
// Calls POST /watershield/predict on the FastAPI backend.

export type WaterSource = 'well' | 'oasis' | 'canal' | 'surface';
export type WaterColor = 'clear' | 'cloudy' | 'brown' | 'yellow' | 'green';
export type WaterOdor = 'none' | 'sulfurous' | 'metallic' | 'chemical' | 'earthy';
export type WaterSeason = 'dry' | 'wet';

export interface WaterShieldObservation {
  water_source: WaterSource;
  distance_to_gct_km: number;
  color: WaterColor;
  odor: WaterOdor;
  days_since_rain: number;
  season?: WaterSeason;
}

export interface WaterShieldContaminant {
  key: 'high_salinity' | 'abnormal_ph' | 'heavy_metals_risk' | 'high_turbidity';
  label: string;
  hint: string;
  probability: number;
  detected: boolean;
}

export interface WaterShieldDriver {
  feature: string;
  rawFeature: string;
  impact: number;
  direction: string;
}

export interface WaterShieldRecommendation {
  key: string;
  label: string;
  action: string;
  probabilities: Record<string, number>;
}

export interface WaterShieldPrediction {
  safety_score: number;
  safety_band: 'sûre' | 'à surveiller' | 'dégradée' | 'critique';
  recommendation: WaterShieldRecommendation;
  contaminants: WaterShieldContaminant[];
  compatible_crops: string[];
  drivers: WaterShieldDriver[];
  imputed_chemistry: Record<string, number>;
  context: {
    water_source: WaterSource;
    water_source_label: string;
    distance_to_gct_km: number;
    color: WaterColor;
    color_label: string;
    odor: WaterOdor;
    odor_label: string;
    days_since_rain: number;
    season: WaterSeason;
  };
  message: string;
  model: {
    backbones: string;
    features: number;
    dataset: string;
  };
}

const BASE = (import.meta as any).env?.VITE_GABEST_API ?? 'http://127.0.0.1:8000';

export async function predictWaterQuality(
  obs: WaterShieldObservation
): Promise<WaterShieldPrediction> {
  const res = await fetch(`${BASE}/watershield/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obs)
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`WaterShield API ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as WaterShieldPrediction;
}
