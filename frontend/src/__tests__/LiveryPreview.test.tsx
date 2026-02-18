import { render, screen } from '@testing-library/react';
import { LiveryPreview } from '../components/LiveryPreview';

const mockCreateObjectURL = vi.fn(() => 'blob:preview-url');
const mockRevokeObjectURL = vi.fn();

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
});

describe('LiveryPreview', () => {
  it('renders nothing when beforeFile is null', () => {
    const { container } = render(<LiveryPreview beforeFile={null} resultUrl={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a thumbnail image for a PNG file', () => {
    const pngFile = new File([new Uint8Array(10)], 'livery.png', { type: 'image/png' });
    render(<LiveryPreview beforeFile={pngFile} resultUrl={null} />);

    const img = screen.getByAltText(/uploaded livery/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'blob:preview-url');
    expect(mockCreateObjectURL).toHaveBeenCalledWith(pngFile);
  });

  it('renders a placeholder for a TGA file instead of an image', () => {
    const tgaFile = new File([new Uint8Array(10)], 'livery.tga', { type: 'image/x-tga' });
    render(<LiveryPreview beforeFile={tgaFile} resultUrl={null} />);

    expect(screen.getByText('livery.tga')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
  });

  it('renders both before and after panels when resultUrl is provided', () => {
    const pngFile = new File([new Uint8Array(10)], 'livery.png', { type: 'image/png' });
    render(<LiveryPreview beforeFile={pngFile} resultUrl="blob:result-url" />);

    expect(screen.getByAltText(/uploaded livery/i)).toBeInTheDocument();
    const resultImg = screen.getByAltText(/composited result/i);
    expect(resultImg).toBeInTheDocument();
    expect(resultImg).toHaveAttribute('src', 'blob:result-url');
  });

  it('shows the Trading Paints note when result is available', () => {
    const pngFile = new File([new Uint8Array(10)], 'livery.png', { type: 'image/png' });
    render(<LiveryPreview beforeFile={pngFile} resultUrl="blob:result-url" />);

    expect(screen.getByText(/upload the downloaded png to trading paints/i)).toBeInTheDocument();
  });

  it('does not show the Trading Paints note before a result is available', () => {
    const pngFile = new File([new Uint8Array(10)], 'livery.png', { type: 'image/png' });
    render(<LiveryPreview beforeFile={pngFile} resultUrl={null} />);

    expect(screen.queryByText(/upload the downloaded png to trading paints/i)).not.toBeInTheDocument();
  });

  it('revokes the before object URL on unmount', () => {
    const pngFile = new File([new Uint8Array(10)], 'livery.png', { type: 'image/png' });
    const { unmount } = render(<LiveryPreview beforeFile={pngFile} resultUrl={null} />);

    unmount();

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:preview-url');
  });

  it('revokes the previous before URL when beforeFile changes', () => {
    const firstFile = new File([new Uint8Array(10)], 'first.png', { type: 'image/png' });
    const secondFile = new File([new Uint8Array(10)], 'second.png', { type: 'image/png' });

    const { rerender } = render(<LiveryPreview beforeFile={firstFile} resultUrl={null} />);
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);

    rerender(<LiveryPreview beforeFile={secondFile} resultUrl={null} />);

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:preview-url');
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
  });
});
