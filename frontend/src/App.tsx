import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { CarModelSelect } from './components/CarModelSelect';
import { DriverClassSelect } from './components/DriverClassSelect';
import { ApplyButton } from './components/ApplyButton';
import { LiveryPreview } from './components/LiveryPreview';
import { useConfig } from './hooks/useConfig';
import { useApply } from './hooks/useApply';
import type { DriverClass } from './types/config';
import './App.css';

export function App() {
  const { config, loading, error: configError } = useConfig();
  const { apply, isLoading, error: applyError, resultUrl } = useApply();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [carModelId, setCarModelId] = useState<string>('');
  const [driverClass, setDriverClass] = useState<DriverClass | ''>('');

  const selectedCar = carModelId && config ? config.carModels[carModelId] : null;
  const needsClassDecal = selectedCar?.hasClassDecals ?? false;

  const handleCarModelChange = (id: string) => {
    setCarModelId(id);
    setDriverClass('');
  };

  const isApplyEnabled =
    selectedFile !== null &&
    carModelId !== '' &&
    (!needsClassDecal || driverClass !== '') &&
    !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !carModelId) return;
    await apply({ file: selectedFile, carModelId, driverClass });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Broken Wing Racing League</h1>
        <p className="app-subtitle">Decal Applier</p>
      </header>

      <main className="app-main">
        <div className="main-content">
          {configError && (
            <p className="error-banner" role="alert">
              Could not load car configuration: {configError}
            </p>
          )}

          {applyError && (
            <p className="error-banner" role="alert">
              {applyError}
            </p>
          )}

          <form className="apply-form" onSubmit={handleSubmit}>
            <FileUpload selectedFile={selectedFile} onFileChange={setSelectedFile} />

            <CarModelSelect
              config={config}
              loading={loading}
              value={carModelId}
              onChange={handleCarModelChange}
            />

            <DriverClassSelect
              visible={needsClassDecal}
              value={driverClass}
              onChange={setDriverClass}
            />

            <ApplyButton disabled={!isApplyEnabled} isLoading={isLoading} />
          </form>

          <LiveryPreview beforeFile={selectedFile} resultUrl={resultUrl} />
        </div>
      </main>
    </div>
  );
}

export default App;
