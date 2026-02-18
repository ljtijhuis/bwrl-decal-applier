import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CarModelSelect } from '../components/CarModelSelect';
import type { ApiConfig } from '../types/config';

const mockConfig: ApiConfig = {
  carModels: {
    'ferrari-296-gt3-sprint': { label: 'Ferrari 296 GT3', group: 'GT3 Sprint', hasClassDecals: true },
    'porsche-992-gt3r-bwec': { label: 'Porsche 992 GT3 R', group: 'BWEC', hasClassDecals: false },
    'bmw-m4-gt3-bwec': { label: 'BMW M4 GT3', group: 'BWEC', hasClassDecals: false },
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
    expect(screen.getByRole('option', { name: 'Porsche 992 GT3 R' })).toBeInTheDocument();
  });

  it('calls onChange with the selected car model id', async () => {
    const onChange = vi.fn();
    render(<CarModelSelect config={mockConfig} loading={false} value="" onChange={onChange} />);

    await userEvent.selectOptions(
      screen.getByRole('combobox'),
      screen.getByRole('option', { name: 'Ferrari 296 GT3' })
    );

    expect(onChange).toHaveBeenCalledWith('ferrari-296-gt3-sprint');
  });

  it('shows the currently selected value', () => {
    render(
      <CarModelSelect
        config={mockConfig}
        loading={false}
        value="porsche-992-gt3r-bwec"
        onChange={vi.fn()}
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('porsche-992-gt3r-bwec');
  });

  it('renders an optgroup for each distinct series group', () => {
    render(<CarModelSelect config={mockConfig} loading={false} value="" onChange={vi.fn()} />);

    const groups = document.querySelectorAll('optgroup');
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveAttribute('label', 'GT3 Sprint');
    expect(groups[1]).toHaveAttribute('label', 'BWEC');
  });

  it('places cars inside their correct optgroup', () => {
    render(<CarModelSelect config={mockConfig} loading={false} value="" onChange={vi.fn()} />);

    const bwecGroup = document.querySelector('optgroup[label="BWEC"]');
    expect(bwecGroup).not.toBeNull();
    const options = bwecGroup!.querySelectorAll('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveValue('porsche-992-gt3r-bwec');
    expect(options[1]).toHaveValue('bmw-m4-gt3-bwec');
  });
});
