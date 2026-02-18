import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Instructions } from '../components/Instructions';

describe('Instructions', () => {
  it('renders the section heading', () => {
    render(<Instructions />);
    expect(screen.getByText(/how to use this tool/i)).toBeInTheDocument();
  });

  it('renders all 8 steps', () => {
    render(<Instructions />);
    expect(screen.getByText(/find your base livery/i)).toBeInTheDocument();
    expect(screen.getByText(/upload your livery/i)).toBeInTheDocument();
    expect(screen.getByText(/select your car model/i)).toBeInTheDocument();
    expect(screen.getByText(/select your driver class/i)).toBeInTheDocument();
    expect(screen.getByText(/click "apply decals"/i)).toBeInTheDocument();
    expect(screen.getByText(/go to trading paints/i)).toBeInTheDocument();
    expect(screen.getByText(/upload the png/i)).toBeInTheDocument();
    expect(screen.getByText(/upload your spec map/i)).toBeInTheDocument();
  });

  it('auto-checks steps passed via autoCompleted prop', () => {
    render(<Instructions autoCompleted={new Set([1, 2])} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).toBeChecked();
    expect(checkboxes[0]).not.toBeChecked();
  });

  it('combines manual checks with autoCompleted', async () => {
    const user = userEvent.setup();
    render(<Instructions autoCompleted={new Set([1])} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[1]).toBeChecked();   // auto
    expect(checkboxes[0]).not.toBeChecked();
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();   // manually checked
    expect(checkboxes[1]).toBeChecked();   // still auto
  });

  it('renders 8 checkboxes, all unchecked initially', () => {
    render(<Instructions />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(8);
    checkboxes.forEach((cb) => expect(cb).not.toBeChecked());
  });

  it('checks a step when its checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(<Instructions />);
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
  });

  it('applies the --done modifier class when a step is checked', async () => {
    const user = userEvent.setup();
    render(<Instructions />);
    const checkboxes = screen.getAllByRole('checkbox');
    const item = checkboxes[0].closest('li');
    expect(item).not.toHaveClass('instructions__item--done');
    await user.click(checkboxes[0]);
    expect(item).toHaveClass('instructions__item--done');
  });

  it('unchecks a step when its checkbox is clicked again', async () => {
    const user = userEvent.setup();
    render(<Instructions />);
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    expect(checkboxes[1]).toBeChecked();
    await user.click(checkboxes[1]);
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('renders the first-time tip with a Trading Paints Downloader link', () => {
    render(<Instructions />);
    expect(screen.getByText(/first time/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /trading paints downloader/i });
    expect(link).toHaveAttribute('href', 'https://www.tradingpaints.com/page/Install');
  });

  it('matches snapshot', () => {
    const { container } = render(<Instructions />);
    expect(container).toMatchSnapshot();
  });
});
