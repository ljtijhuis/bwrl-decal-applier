import { useRef, useState, useCallback } from 'react';

const ACCEPTED_TYPES = ['image/png', 'image/x-tga', 'image/tga', 'image/vnd.adobe.photoshop', 'application/photoshop'];
const ACCEPTED_EXTENSIONS = ['.png', '.tga', '.psd'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  selectedFile: File | null;
}

function isValidType(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
}

export function FileUpload({ onFileChange, selectedFile }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!isValidType(file)) {
        setError('Only PNG, TGA, and PSD files are accepted.');
        onFileChange(null);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError('File is too large. Maximum size is 20 MB.');
        onFileChange(null);
        return;
      }
      setError(null);
      onFileChange(file);
    },
    [onFileChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleClick = () => inputRef.current?.click();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  };

  return (
    <div className="file-upload">
      <div
        className={`file-upload__zone ${dragOver ? 'file-upload__zone--drag-over' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Upload livery file"
      >
        {selectedFile ? (
          <p className="file-upload__filename">{selectedFile.name}</p>
        ) : (
          <p>Drag and drop your livery here, or click to select a file</p>
        )}
        <p className="file-upload__hint">Accepted formats: PNG, TGA, PSD — max 20 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.tga,.psd"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        data-testid="file-input"
      />
      {error && (
        <p className="file-upload__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
