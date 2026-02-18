import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CarModelSelect } from '../components/CarModelSelect';
import type { ApiConfig } from '../types/config';

const mockConfig: ApiConfig = {
  carModels: {
    'ferrari-296-gt3': { label: 'Ferrari 296 GT3', hasClassDecals: true },
    'porsche-911-gt3-r': { label: 'Porsche 911 GT3 R', hasClassDecals: false },
  },
};

describe('CarModelSelect', () => {
  it('shows loading placeholder when loading is true', () => {
    render(<CarModelSelect config={null} loading={true} value="" onChange={vi.fn()} />);

    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows default placeholder when config is not yet loaded', () => {
    render(<CarModelSelect config={null} loading={false} value="" onChange={vi.fn()} />);

    expect(screen.getByText(/select a car model/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('renders an option for each car model', () => {
    render(
      <CarModelSelect config={mockConfig} loading={false} value="" onChange={vi.fn()} />
    );

    expect(screen.getByRole('option', { name: 'Ferrari 296 GT3' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Porsche 911 GT3 R' })).toBeInTheDocument();
  });

  it('calls onChange with the selected car model id', async () => {
    const onChange = vi.fn();
    render(<CarModelSelect config={mockConfig} loading={false} value="" onChange={onChange} />);

    await userEvent.selectOptions(
      screen.getByRole('combobox'),
      screen.getByRole('option', { name: 'Ferrari 296 GT3' })
    );

    expect(onChange).toHaveBeenCalledWith('ferrari-296-gt3');
  });

  it('shows the currently selected value', () => {
    render(
      <CarModelSelect
        config={mockConfig}
        loading={false}
        value="porsche-911-gt3-r"
        onChange={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('porsche-911-gt3-r');
  });
});
