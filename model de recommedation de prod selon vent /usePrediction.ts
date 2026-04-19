// src/hooks/usePrediction.ts

import { useState, useCallback } from "react"
import { api }                   from "../services/api"
import type { Factory, PredictionResponse } from "../types"

interface State {
  data:    PredictionResponse | null
  loading: boolean
  error:   string | null
}

export function usePrediction() {
  const [state, setState] = useState<State>({
    data: null, loading: false, error: null,
  })

  const predict = useCallback(async (
    factory:    Pick<Factory, "lat" | "lon" | "name">,
    production: number = 85,
  ) => {
    setState({ data: null, loading: true, error: null })
    try {
      const data = await api.predict(factory, production)
      setState({ data, loading: false, error: null })
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue"
      setState({ data: null, loading: false, error: msg })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return { ...state, predict, reset }
}
