import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../components/FileUpload';

const makePng = (sizeBytes = 100): File => {
  const content = new Uint8Array(sizeBytes);
  return new File([content], 'livery.png', { type: 'image/png' });
};

const makeTga = (): File => {
  return new File([new Uint8Array(100)], 'livery.tga', { type: 'image/x-tga' });
};

const makeOversized = (): File => {
  const twentyMbPlusOne = 20 * 1024 * 1024 + 1;
  return new File([new Uint8Array(twentyMbPlusOne)], 'big.png', { type: 'image/png' });
};

const makeInvalidType = (): File => {
  return new File([new Uint8Array(100)], 'livery.jpg', { type: 'image/jpeg' });
};

describe('FileUpload', () => {
  it('renders the upload zone with hint text', () => {
    const onFileChange = vi.fn();
    render(<FileUpload selectedFile={null} onFileChange={onFileChange} />);

    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText(/accepted formats/i)).toBeInTheDocument();
  });

  it('shows filename when a file is selected', () => {
    const file = makePng();
    render(<FileUpload selectedFile={file} onFileChange={vi.fn()} />);

    expect(screen.getByText('livery.png')).toBeInTheDocument();
  });

  it('calls onFileChange with a valid PNG file', async () => {
    const onFileChange = vi.fn();
    render(<FileUpload selectedFile={null} onFileChange={onFileChange} />);

    const input = screen.getByTestId('file-input');
    const file = makePng();
    await userEvent.upload(input, file);

    expect(onFileChange).toHaveBeenCalledWith(file);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onFileChange with a valid TGA file', async () => {
    const onFileChange = vi.fn();
    render(<FileUpload selectedFile={null} onFileChange={onFileChange} />);

    const input = screen.getByTestId('file-input');
    const file = makeTga();
    await userEvent.upload(input, file);

    expect(onFileChange).toHaveBeenCalledWith(file);
  });

  it('shows error and calls onFileChange(null) for oversized file', async () => {
    const onFileChange = vi.fn();
    render(<FileUpload selectedFile={null} onFileChange={onFileChange} />);

    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, makeOversized());

    expect(onFileChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(/too large/i);
  });

  it('shows error and calls onFileChange(null) for invalid file type', () => {
    const onFileChange = vi.fn();
    render(<FileUpload selectedFile={null} onFileChange={onFileChange} />);

    // Use fireEvent to bypass the <input accept> filter so our JS validation runs
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [makeInvalidType()] } });

    expect(onFileChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(/png and tga/i);
  });

  it('clears error when a valid file is uploaded after an invalid one', () => {
    const onFileChange = vi.fn();
    render(<FileUpload selectedFile={null} onFileChange={onFileChange} />);

    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [makeInvalidType()] } });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [makePng()] } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles drop of a valid file', () => {
    const onFileChange = vi.fn();
    render(<FileUpload selectedFile={null} onFileChange={onFileChange} />);

    const zone = screen.getByRole('button');
    const file = makePng();
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });

    expect(onFileChange).toHaveBeenCalledWith(file);
  });

  it('handles drop of an oversized file', () => {
    const onFileChange = vi.fn();
    render(<FileUpload selectedFile={null} onFileChange={onFileChange} />);

    const zone = screen.getByRole('button');
    fireEvent.drop(zone, { dataTransfer: { files: [makeOversized()] } });

    expect(onFileChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(/too large/i);
  });

  it('adds drag-over style on dragover and removes it on dragleave', () => {
    render(<FileUpload selectedFile={null} onFileChange={vi.fn()} />);

    const zone = screen.getByRole('button');
    fireEvent.dragOver(zone, { preventDefault: () => {} });
    expect(zone.className).toContain('drag-over');

    fireEvent.dragLeave(zone);
    expect(zone.className).not.toContain('drag-over');
  });

  it('triggers file input on Enter key', () => {
    render(<FileUpload selectedFile={null} onFileChange={vi.fn()} />);

    const input = screen.getByTestId('file-input') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});

    const zone = screen.getByRole('button');
    fireEvent.keyDown(zone, { key: 'Enter' });

    expect(clickSpy).toHaveBeenCalled();
  });

  it('triggers file input on Space key', () => {
    render(<FileUpload selectedFile={null} onFileChange={vi.fn()} />);

    const input = screen.getByTestId('file-input') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});

    const zone = screen.getByRole('button');
    fireEvent.keyDown(zone, { key: ' ' });

    expect(clickSpy).toHaveBeenCalled();
  });

  it('does not trigger file input on other keys', () => {
    render(<FileUpload selectedFile={null} onFileChange={vi.fn()} />);

    const input = screen.getByTestId('file-input') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});

    const zone = screen.getByRole('button');
    fireEvent.keyDown(zone, { key: 'Tab' });

    expect(clickSpy).not.toHaveBeenCalled();
  });
});
