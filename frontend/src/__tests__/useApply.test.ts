import { renderHook, act, waitFor } from '@testing-library/react';
import { useApply } from '../hooks/useApply';

const mockBlob = new Blob(['fake-png'], { type: 'image/png' });
const mockObjectURL = 'blob:mock-url';
const mockCreateObjectURL = vi.fn(() => mockObjectURL);
const mockRevokeObjectURL = vi.fn();

const baseParams = {
  file: new File([new Uint8Array(10)], 'livery.png', { type: 'image/png' }),
  carModelId: 'porsche-911-gt3-r',
  driverClass: '' as const,
};

beforeEach(() => {
  vi.stubGlobal('URL', {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  });
  mockCreateObjectURL.mockClear();
  mockRevokeObjectURL.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubFetchSuccess() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    } as Response)
  );
}

function stubFetchError(status: number, body: object) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve(body),
    } as Response)
  );
}

describe('useApply', () => {
  it('starts with isLoading false and no error', () => {
    stubFetchSuccess();
    const { result } = renderHook(() => useApply());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('starts with resultUrl null', () => {
    stubFetchSuccess();
    const { result } = renderHook(() => useApply());
    expect(result.current.resultUrl).toBeNull();
  });

  it('sets resultUrl after successful apply', async () => {
    stubFetchSuccess();
    const { result } = renderHook(() => useApply());

    await act(async () => {
      await result.current.apply(baseParams);
    });

    await waitFor(() => expect(result.current.resultUrl).toBe(mockObjectURL));
    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  it('resultUrl remains null on apply error', async () => {
    stubFetchError(400, { error: 'Unknown car model' });
    const { result } = renderHook(() => useApply());

    await act(async () => {
      await result.current.apply(baseParams);
    });

    await waitFor(() => expect(result.current.error).toBe('Unknown car model'));
    expect(result.current.resultUrl).toBeNull();
  });

  it('revokes previous resultUrl and resets it when a new apply starts', async () => {
    stubFetchSuccess();
    const { result } = renderHook(() => useApply());

    await act(async () => {
      await result.current.apply(baseParams);
    });

    await waitFor(() => expect(result.current.resultUrl).toBe(mockObjectURL));

    mockRevokeObjectURL.mockClear();

    let resolveSecond!: (value: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolveSecond = resolve;
          })
      )
    );

    act(() => {
      void result.current.apply(baseParams);
    });

    expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockObjectURL);
    expect(result.current.resultUrl).toBeNull();

    await act(async () => {
      resolveSecond({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);
    });
  });

  it('sets isLoading to true during apply', async () => {
    let resolveResponse!: (value: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolveResponse = resolve;
          })
      )
    );

    const { result } = renderHook(() => useApply());

    act(() => {
      void result.current.apply(baseParams);
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveResponse({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('triggers download on success', async () => {
    stubFetchSuccess();
    const { result } = renderHook(() => useApply());

    await act(async () => {
      await result.current.apply(baseParams);
    });

    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockObjectURL);
  });

  it('sets error on non-ok response', async () => {
    stubFetchError(400, { error: 'Unknown car model' });
    const { result } = renderHook(() => useApply());

    await act(async () => {
      await result.current.apply(baseParams);
    });

    await waitFor(() => expect(result.current.error).toBe('Unknown car model'));
    expect(result.current.isLoading).toBe(false);
  });

  it('uses fallback error message when API body has no error field', async () => {
    stubFetchError(500, {});
    const { result } = renderHook(() => useApply());

    await act(async () => {
      await result.current.apply(baseParams);
    });

    await waitFor(() => expect(result.current.error).toMatch(/server error \(500\)/i));
  });

  it('sets error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));
    const { result } = renderHook(() => useApply());

    await act(async () => {
      await result.current.apply(baseParams);
    });

    await waitFor(() => expect(result.current.error).toBe('Connection refused'));
  });

  it('includes driverClass in FormData when provided', async () => {
    stubFetchSuccess();
    const { result } = renderHook(() => useApply());

    await act(async () => {
      await result.current.apply({
        ...baseParams,
        carModelId: 'ferrari-296-gt3',
        driverClass: 'AM',
      });
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const formData = fetchCall[1]?.body as FormData;
    expect(formData.get('driverClass')).toBe('AM');
  });

  it('omits driverClass from FormData when empty', async () => {
    stubFetchSuccess();
    const { result } = renderHook(() => useApply());

    await act(async () => {
      await result.current.apply(baseParams);
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const formData = fetchCall[1]?.body as FormData;
    expect(formData.get('driverClass')).toBeNull();
  });

  it('clears previous error on new apply call', async () => {
    stubFetchError(400, { error: 'Some error' });
    const { result } = renderHook(() => useApply());

    await act(async () => {
      await result.current.apply(baseParams);
    });

    expect(result.current.error).toBe('Some error');

    stubFetchSuccess();

    await act(async () => {
      await result.current.apply(baseParams);
    });

    expect(result.current.error).toBeNull();
  });
});
