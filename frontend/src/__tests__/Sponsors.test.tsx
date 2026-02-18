import { render, screen, fireEvent } from '@testing-library/react';
import { Sponsors } from '../components/Sponsors';
import type { Sponsor } from '../components/Sponsors';

const TEST_SPONSORS: Sponsor[] = [
  {
    id: 'acme',
    name: 'Acme Corp',
    logoUrl: '/sponsors/acme.png',
    website: 'https://acme.com',
  },
  {
    id: 'globex',
    name: 'Globex',
    logoUrl: '/sponsors/globex.png',
    website: 'https://globex.com',
  },
];

describe('Sponsors', () => {
  it('renders nothing when sponsors list is empty', () => {
    const { container } = render(<Sponsors sponsors={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the "Our Sponsors" heading', () => {
    render(<Sponsors sponsors={TEST_SPONSORS} />);
    expect(screen.getByText(/our sponsors/i)).toBeInTheDocument();
  });

  it('renders one list item per sponsor', () => {
    render(<Sponsors sponsors={TEST_SPONSORS} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(TEST_SPONSORS.length);
  });

  it('renders each sponsor logo with correct alt text', () => {
    render(<Sponsors sponsors={TEST_SPONSORS} />);
    expect(screen.getByAltText('Acme Corp logo')).toBeInTheDocument();
    expect(screen.getByAltText('Globex logo')).toBeInTheDocument();
  });

  it('each link opens in a new tab with rel="noopener noreferrer"', () => {
    render(<Sponsors sponsors={TEST_SPONSORS} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(TEST_SPONSORS.length);
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('each link has a descriptive aria-label', () => {
    render(<Sponsors sponsors={TEST_SPONSORS} />);
    expect(screen.getByRole('link', { name: /visit acme corp/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /visit globex/i })).toBeInTheDocument();
  });

  it('each link points to the sponsor website', () => {
    render(<Sponsors sponsors={TEST_SPONSORS} />);
    expect(screen.getByRole('link', { name: /visit acme corp/i })).toHaveAttribute(
      'href',
      'https://acme.com',
    );
  });

  it('section has aria-label "League sponsors"', () => {
    render(<Sponsors sponsors={TEST_SPONSORS} />);
    expect(screen.getByRole('region', { name: /league sponsors/i })).toBeInTheDocument();
  });

  it('hides the logo image on load error', () => {
    render(<Sponsors sponsors={TEST_SPONSORS} />);
    const logo = screen.getByAltText('Acme Corp logo');
    expect(logo).toBeVisible();
    fireEvent.error(logo);
    expect(logo).not.toBeVisible();
  });
});
