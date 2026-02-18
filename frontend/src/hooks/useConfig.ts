import { useState, useEffect } from 'react';
import type { ApiConfig } from '../types/config';

interface UseConfigResult {
  config: ApiConfig | null;
  loading: boolean;
  error: string | null;
}

export function useConfig(): UseConfigResult {
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json() as Promise<ApiConfig>;
      })
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load configuration';
        setError(message);
        setLoading(false);
      });
  }, []);

  return { config, loading, error };
}
