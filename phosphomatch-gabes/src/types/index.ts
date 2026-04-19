export interface Seller {
  id: string;
  email: string;
  company_name: string;
  location: string;
  industry: string;
  phone: string;
  contact_person: string;
  created_at: string;
}

export interface SignupData {
  email: string;
  password: string;
  company_name: string;
  location: string;
  industry: string;
  phone: string;
  contact_person: string;
}

export interface Buyer {
  id: number;
  company_name: string;
  industry_type: 'cement' | 'plaster' | 'fertilizer' | 'construction' | 'recycling startup';
  location: string;
  phone: string;
  email: string;
  website: string;
  min_purity_required: number;
  max_fluor_allowed: number;
  max_p2o5_allowed: number;
  max_humidity_allowed: number;
  max_heavy_metals_allowed: number;
  max_radioactivity_allowed: number;
  capacity_tons_per_day: number;
  base_price_per_ton: number;
  transport_cost_per_ton_per_km: number;
  latitude?: number;
  longitude?: number;
}

export interface Batch {
  purity: number;
  fluor: number;
  p2o5: number;
  humidity: number;
  heavy_metals: number;
  radioactivity: number;
  quantity: number;
  location: string;
}

export interface Match {
  id: number;
  company_name: string;
  industry_type: Buyer['industry_type'];
  location: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  compatibility_score: number;
  estimated_deal_value_usd: number;
  reasoning: string;
}

export type BatchStatus = 'pending' | 'contacted' | 'negotiating' | 'closed';

export interface SavedBatch {
  id: string;
  seller_id: string;
  batch: Batch;
  matches: Match[];
  created_at: string;
  status: BatchStatus;
  notes?: string;
}

export interface MatchResponse {
  matches: Match[];
  message?: string;
}
