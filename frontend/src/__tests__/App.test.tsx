import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import type { ApiConfig } from '../types/config';

const configWithClass: ApiConfig = {
  carModels: {
    'ferrari-296-gt3-sprint': { label: 'Ferrari 296 GT3', group: 'GT3 Sprint', hasClassDecals: true },
    'porsche-992-gt3r-bwec': { label: 'Porsche 992 GT3 R', group: 'BWEC', hasClassDecals: false },
  },
};

function mockFetch(config: ApiConfig) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(config),
    } as Response)
  );
}

describe('App', () => {
  beforeEach(() => {
    mockFetch(configWithClass);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the page heading', async () => {
    render(<App />);
    expect(screen.getByText(/broken wing racing league/i)).toBeInTheDocument();
  });

  it('Apply button is disabled initially', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Ferrari 296 GT3' })).toBeInTheDocument()
    );

    expect(screen.getByRole('button', { name: /apply decals/i })).toBeDisabled();
  });

  it('Apply button stays disabled if file selected but no car model chosen', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Ferrari 296 GT3' })).toBeInTheDocument()
    );

    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, new File([new Uint8Array(100)], 'livery.png', { type: 'image/png' }));

    expect(screen.getByRole('button', { name: /apply decals/i })).toBeDisabled();
  });

  it('Apply button enabled for car without class decals once file is selected', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Porsche 992 GT3 R' })).toBeInTheDocument()
    );

    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, new File([new Uint8Array(100)], 'livery.png', { type: 'image/png' }));

    await userEvent.selectOptions(
      screen.getByLabelText(/car model/i),
      screen.getByRole('option', { name: 'Porsche 992 GT3 R' })
    );

    expect(screen.getByRole('button', { name: /apply decals/i })).toBeEnabled();
  });

  it('Apply button disabled for class-decal car until driver class is selected', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Ferrari 296 GT3' })).toBeInTheDocument()
    );

    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, new File([new Uint8Array(100)], 'livery.png', { type: 'image/png' }));

    await userEvent.selectOptions(
      screen.getByLabelText(/car model/i),
      screen.getByRole('option', { name: 'Ferrari 296 GT3' })
    );

    // Driver class selector should now be visible
    expect(screen.getByLabelText(/driver class/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply decals/i })).toBeDisabled();
  });

  it('Apply button enabled after file, class-decal car, and driver class all selected', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Ferrari 296 GT3' })).toBeInTheDocument()
    );

    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, new File([new Uint8Array(100)], 'livery.png', { type: 'image/png' }));

    await userEvent.selectOptions(
      screen.getByLabelText(/car model/i),
      screen.getByRole('option', { name: 'Ferrari 296 GT3' })
    );

    await userEvent.selectOptions(
      screen.getByLabelText(/driver class/i),
      screen.getByRole('option', { name: 'AM' })
    );

    expect(screen.getByRole('button', { name: /apply decals/i })).toBeEnabled();
  });

  it('driver class selector resets when car model changes', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Ferrari 296 GT3' })).toBeInTheDocument()
    );

    // Select Ferrari and pick a driver class
    await userEvent.selectOptions(
      screen.getByLabelText(/car model/i),
      screen.getByRole('option', { name: 'Ferrari 296 GT3' })
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/driver class/i),
      screen.getByRole('option', { name: 'PRO' })
    );

    // Switch to Porsche — driver class selector should disappear
    await userEvent.selectOptions(
      screen.getByLabelText(/car model/i),
      screen.getByRole('option', { name: 'Porsche 992 GT3 R' })
    );

    expect(screen.queryByLabelText(/driver class/i)).not.toBeInTheDocument();
  });

  it('triggers download when form is submitted successfully', async () => {
    const mockBlob = new Blob(['png-data'], { type: 'image/png' });
    const mockCreateObjectURL = vi.fn(() => 'blob:mock');
    const mockRevokeObjectURL = vi.fn();

    vi.unstubAllGlobals();
    vi.stubGlobal('URL', { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL });
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(configWithClass) } as Response)
        .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(mockBlob) } as Response)
    );

    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Porsche 992 GT3 R' })).toBeInTheDocument()
    );

    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, new File([new Uint8Array(100)], 'livery.png', { type: 'image/png' }));
    await userEvent.selectOptions(
      screen.getByLabelText(/car model/i),
      screen.getByRole('option', { name: 'Porsche 992 GT3 R' })
    );

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob));
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('shows apply error banner on API failure', async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(configWithClass) } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Unknown car model' }),
        } as Response)
    );

    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Porsche 992 GT3 R' })).toBeInTheDocument()
    );

    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, new File([new Uint8Array(100)], 'livery.png', { type: 'image/png' }));
    await userEvent.selectOptions(
      screen.getByLabelText(/car model/i),
      screen.getByRole('option', { name: 'Porsche 992 GT3 R' })
    );

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/unknown car model/i)
    );
  });

  it('shows config error banner when fetch fails', async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));

    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/could not load car configuration/i)
    );
  });
});
