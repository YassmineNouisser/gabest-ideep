// src/types/index.ts

export interface Factory {
  id:         string
  name:       string
  lat:        number
  lon:        number
  type:       "phosphate" | "energie" | "port" | "custom"
  production?: number
}

export interface PlumePoint {
  lat: number
  lon: number
  z:   number
}

export interface Zone {
  name:      string
  lat:       number
  lon:       number
  pollution: number
  impact:    "Tres affecte" | "Affecte" | "Peu affecte" | "Non affecte"
  color:     string
}

export interface Arrow {
  slat: number
  slon: number
  elat: number
  elon: number
}

export interface PredictionResponse {
  // Meteo
  temperature:    number
  humidity:       number
  wind_speed:     number
  wind_deg:       number
  wind_direction: string
  wind_text:      string
  // Risk
  risk_score:     number
  risk_label:     "low" | "medium" | "high"
  risk_color:     string
  pollution_index: number
  dust_level:     number
  // Decisions
  production_before:       number
  production_after:        number
  prod_change_pct:         number
  recommended_products:    string[]
  pollution_reduction_pct: number
  // Carte
  plume_points: PlumePoint[]
  zones:        Zone[]
  arrows:       Arrow[]
  // Meta
  factory_name: string
  timestamp:    string
}

export type RiskLevel = "low" | "medium" | "high"
