// WindShield — client for the pollution-vs-wind recommendation API.
// Exposes live predictions + monthly economic report for factory dashboards.

export interface WindFactory {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'phosphate' | 'energie' | 'port' | 'custom';
}

export interface PlumePoint { lat: number; lon: number; z: number; }
export interface Arrow      { slat: number; slon: number; elat: number; elon: number; }

export type WindRisk        = 'low' | 'medium' | 'high';
export type WindDirection   = 'toward_city' | 'toward_sea' | 'away' | 'toward_factory';
export type WindAction      = 'boost' | 'reduce' | 'hold';

export interface WindZone {
  name: string;
  lat: number;
  lon: number;
  pollution: number;
  impact: 'Tres affecte' | 'Affecte' | 'Peu affecte' | 'Non affecte';
  color: string;
  population: number;
  type: 'urban' | 'coast' | 'agri';
}

export interface WindRecommendation {
  headline: string;
  detail: string;
  action: WindAction;
  delta_pct: number;
  products: string[];
}

export interface WindPrediction {
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  wind_direction: WindDirection;
  wind_text: string;
  risk_score: number;
  risk_label: WindRisk;
  risk_color: string;
  pollution_index: number;
  dust_level: number;
  production_before: number;
  production_after: number;
  prod_change_pct: number;
  recommended_products: string[];
  pollution_reduction_pct: number;
  plume_points: PlumePoint[];
  zones: WindZone[];
  arrows: Arrow[];
  recommendation: WindRecommendation;
  factory_name: string;
  timestamp: string;
  model_used: 'random_forest' | 'rule_based';
}

export interface MonthlyBreakdown {
  avoided_fines_dt: number;
  health_savings_dt: number;
  carbon_credits_dt: number;
  boost_revenue_dt: number;
  product_cost_dt: number;
  reduced_revenue_dt: number;
  platform_licence_dt?: number;
}

export interface MonthlyDay {
  date: string;
  wind_deg: number;
  wind_speed?: number;
  temperature?: number;
  humidity?: number;
  wind_qual: WindDirection;
  risk: WindRisk;
  risk_score: number;
  prod_pct: number;
  savings_dt: number;
}

export interface DataSource {
  weather: string;
  weather_url: string;
  risk_model: string;
  wind_azimuth_threshold_toward_city_deg?: [number, number];
}

export interface EconomicAssumptions {
  revenue_per_pct_day_dt: number;
  avoided_fine_high_dt: number;
  avoided_fine_medium_dt: number;
  avoided_health_dt_per_person: number;
  carbon_credit_dt_per_ton: number;
  tons_so2_per_pct_cut: number;
  product_cost_dt: Record<string, number>;
  sources: string[];
}

export interface MonthlyReport {
  factory: { name: string; lat: number; lon: number; production: number };
  period: { start: string; end: string; days: number };
  data_source?: DataSource;
  economic_assumptions?: EconomicAssumptions;
  risk_distribution: Record<WindRisk, number>;
  breakdown: MonthlyBreakdown;
  gross_savings_dt: number;
  gross_costs_dt: number;
  net_savings_dt: number;
  invested_dt?: number;
  baseline_loss_dt?: number;
  payback_months?: number | null;
  roi_pct: number;
  so2_avoided_ton: number;
  production_ton_sold: number;
  population_protected: number;
  days_urban_exposed_and_protected?: number;
  days_high_cut?: number;
  days_medium_filter?: number;
  days_boost?: number;
  by_day: MonthlyDay[];
  narrative: string[];
  generated_at: string;
  error?: string;
}

const BASE = (import.meta as any).env?.VITE_GABEST_API ?? 'http://127.0.0.1:8000';

export async function fetchWindFactories(): Promise<WindFactory[]> {
  const res = await fetch(`${BASE}/wind/factories`);
  if (!res.ok) throw new Error(`WindShield /factories ${res.status}`);
  return res.json();
}

export async function predictWind(
  factory: Pick<WindFactory, 'lat' | 'lon' | 'name'>,
  production = 85
): Promise<WindPrediction> {
  const res = await fetch(`${BASE}/wind/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...factory, production })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`WindShield /predict ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export async function fetchMonthlyReport(
  factory: Pick<WindFactory, 'lat' | 'lon' | 'name'>,
  production = 85,
  days = 30
): Promise<MonthlyReport> {
  const res = await fetch(`${BASE}/wind/monthly-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...factory, production, days })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`WindShield /monthly-report ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export function formatDT(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} DT`;
}
