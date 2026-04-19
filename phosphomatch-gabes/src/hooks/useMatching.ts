import { useCallback, useState } from 'react';
import type { Batch, MatchResponse } from '../types';
import { findMatches } from '../services/openai';

export function useMatching() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runMatching = useCallback(async (batch: Batch): Promise<MatchResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await findMatches(batch);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Erreur inconnue pendant le matching.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, runMatching, setError };
}
