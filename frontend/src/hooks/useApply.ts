import { useState, useCallback } from 'react';
import type { DriverClass } from '../types/config';

interface ApplyParams {
  file: File;
  carModelId: string;
  driverClass: DriverClass | '';
}

interface UseApplyResult {
  apply: (params: ApplyParams) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useApply(): UseApplyResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(async ({ file, carModelId, driverClass }: ApplyParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('livery', file);
      formData.append('carModel', carModelId);
      if (driverClass) formData.append('driverClass', driverClass);

      const res = await fetch('/api/apply', { method: 'POST', body: formData });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? `Server error (${res.status})`);
        return;
      }

      const blob = await res.blob();
      triggerDownload(blob, 'livery-with-decals.png');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { apply, isLoading, error };
}
