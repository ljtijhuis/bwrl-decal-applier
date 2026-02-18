import { useState, useEffect } from 'react';

interface LiveryPreviewProps {
  beforeFile: File | null;
  resultUrl: string | null;
}

export function LiveryPreview({ beforeFile, resultUrl }: LiveryPreviewProps) {
  const [beforeObjectUrl, setBeforeObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!beforeFile) {
      setBeforeObjectUrl(null);
      return;
    }

    const isTga = beforeFile.name.toLowerCase().endsWith('.tga');
    if (isTga) {
      setBeforeObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(beforeFile);
    setBeforeObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [beforeFile]);

  if (!beforeFile) return null;

  const isTga = beforeFile.name.toLowerCase().endsWith('.tga');

  const beforeContent = isTga ? (
    <div className="preview-placeholder">
      TGA file
      <span className="preview-placeholder__name">{beforeFile.name}</span>
    </div>
  ) : beforeObjectUrl ? (
    <img src={beforeObjectUrl} alt="Uploaded livery" className="preview-image" />
  ) : null;

  return (
    <div className="preview-container">
      <div className="preview-panel">
        <span className="preview-label">Before</span>
        {beforeContent}
      </div>

      {resultUrl && (
        <div className="preview-panel">
          <span className="preview-label">After</span>
          <img src={resultUrl} alt="Composited result" className="preview-image" />
          <p className="trading-paints-note">
            Your livery is ready. Upload the downloaded PNG to Trading Paints via{' '}
            <strong>Manage My Car &rarr; Upload Livery</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
