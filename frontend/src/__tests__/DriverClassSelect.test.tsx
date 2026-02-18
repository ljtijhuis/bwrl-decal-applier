import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DriverClassSelect } from '../components/DriverClassSelect';

describe('DriverClassSelect', () => {
  it('renders nothing when visible is false', () => {
    const { container } = render(
      <DriverClassSelect visible={false} value="" onChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the selector when visible is true', () => {
    render(<DriverClassSelect visible={true} value="" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders all four driver class options', () => {
    render(<DriverClassSelect visible={true} value="" onChange={vi.fn()} />);

    expect(screen.getByRole('option', { name: 'AM' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'PRO-AM' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'PRO' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ROOKIE' })).toBeInTheDocument();
  });

  it('calls onChange with the selected driver class', async () => {
    const onChange = vi.fn();
    render(<DriverClassSelect visible={true} value="" onChange={onChange} />);

    await userEvent.selectOptions(
      screen.getByRole('combobox'),
      screen.getByRole('option', { name: 'PRO' })
    );

    expect(onChange).toHaveBeenCalledWith('PRO');
  });

  it('reflects the currently selected value', () => {
    render(<DriverClassSelect visible={true} value="AM" onChange={vi.fn()} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('AM');
  });
});
