import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { CarModelSelect } from './components/CarModelSelect';
import { DriverClassSelect } from './components/DriverClassSelect';
import { ApplyButton } from './components/ApplyButton';
import { useConfig } from './hooks/useConfig';
import type { DriverClass } from './types/config';
import './App.css';

export function App() {
  const { config, loading, error: configError } = useConfig();

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
    selectedFile !== null && carModelId !== '' && (!needsClassDecal || driverClass !== '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Phase 2: wire up to /api/apply
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Broken Wing Racing League</h1>
        <p className="app-subtitle">Decal Applier</p>
      </header>

      <main className="app-main">
        {configError && (
          <p className="error-banner" role="alert">
            Could not load car configuration: {configError}
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

          <ApplyButton disabled={!isApplyEnabled} />
        </form>
      </main>
    </div>
  );
}

export default App;
