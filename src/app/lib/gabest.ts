export type GabestLevel = 'Normal' | 'Vigilance' | 'Critique' | 'Urgence';

export interface GabestNeighbor { name: string; weight: number; }
export interface GabestShap    { feature: string; value: number; }
export interface GabestCaptum  { day: string; feature: string; value: number; }

export interface GabestQuartier {
  name: string;
  lat: number;
  lon: number;
  proximityGCT: 'proche' | 'intermédiaire' | 'périphérique';
  level: GabestLevel;
  classIdx: number;
  confidence: number;
  probs: [number, number, number, number];
  readings: {
    nb_signalements: number;
    so2: number;
    no2: number;
    pm25: number;
    pm10: number;
    dust: number;
    vent_vitesse: number;
    humidite: number;
    temperature: number;
  };
  signalements: number;
  neighbors: GabestNeighbor[];
  shap: GabestShap[];
  captum: GabestCaptum[];
  message: string;
}

export interface GabestPrediction {
  date: string;
  window: string[];
  counts: Record<GabestLevel, number>;
  quartiers: GabestQuartier[];
  model: {
    weights_file: string;
    params: number;
    classes: GabestLevel[];
    metrics: { test_accuracy: number; f1_macro: number; recall_urgence: number };
  };
}

const BASE = (import.meta as any).env?.VITE_GABEST_API ?? 'http://127.0.0.1:8000';

export async function fetchGabestPrediction(date?: string): Promise<GabestPrediction> {
  const url = new URL(`${BASE}/predict`);
  if (date) url.searchParams.set('date', date);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GaBest API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export async function fetchGabestHealth(): Promise<{ ok: boolean; rows: number; latest_date: string | null }> {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error(`GaBest API ${res.status}`);
  return res.json();
}
