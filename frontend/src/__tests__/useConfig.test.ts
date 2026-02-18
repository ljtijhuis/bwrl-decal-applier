import { renderHook, waitFor } from '@testing-library/react';
import { useConfig } from '../hooks/useConfig';
import type { ApiConfig } from '../types/config';

const mockConfig: ApiConfig = {
  carModels: {
    'ferrari-296-gt3': { label: 'Ferrari 296 GT3', hasClassDecals: true },
    'porsche-911-gt3-r': { label: 'Porsche 911 GT3 R', hasClassDecals: false },
  },
};

describe('useConfig', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts in loading state', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useConfig());

    expect(result.current.loading).toBe(true);
    expect(result.current.config).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns parsed config on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockConfig),
    } as Response);

    const { result } = renderHook(() => useConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.error).toBeNull();
  });

  it('returns error state when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('returns error state when server returns non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    } as unknown as Response);

    const { result } = renderHook(() => useConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config).toBeNull();
    expect(result.current.error).toMatch(/500/);
  });
});
