// src/services/api.ts

import type { Factory, PredictionResponse } from "../types"

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export const api = {

  // Analyse une usine → retourne la prediction complete
  async predict(
    factory: Pick<Factory, "lat" | "lon" | "name">,
    production: number = 85
  ): Promise<PredictionResponse> {
    const res = await fetch(`${BASE_URL}/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        lat:        factory.lat,
        lon:        factory.lon,
        name:       factory.name,
        production,
      }),
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  // Liste des usines connues de Gabes
  async getFactories(): Promise<Factory[]> {
    const res = await fetch(`${BASE_URL}/factories`)
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  // Health check
  async health(): Promise<{ status: string; model_loaded: boolean }> {
    const res = await fetch(`${BASE_URL}/health`)
    return res.json()
  },
}
