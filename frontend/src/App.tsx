import { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { CarModelSelect } from './components/CarModelSelect';
import { DriverClassSelect } from './components/DriverClassSelect';
import { ApplyButton } from './components/ApplyButton';
import { LiveryPreview } from './components/LiveryPreview';
import { Instructions } from './components/Instructions';
import { Sponsors } from './components/Sponsors';
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

  const autoCompleted = useMemo(() => {
    const s = new Set<number>();
    if (selectedFile) { s.add(0); s.add(1); }
    if (carModelId) s.add(2);
    if (carModelId && (!needsClassDecal || driverClass !== '')) s.add(3);
    if (resultUrl) s.add(4);
    return s;
  }, [selectedFile, carModelId, needsClassDecal, driverClass, resultUrl]);

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
        <div className="app-header__inner">
          <img
            src="/bwrl-logo.png"
            alt="Broken Wing Racing League logo"
            className="app-header__logo"
          />
          <div className="app-header__text">
            <h1 className="app-header__title">Broken Wing Racing League</h1>
            <p className="app-header__subtitle">Decal Applier</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          <Instructions autoCompleted={autoCompleted} />

          <div className="form-column">
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
        </div>
      </main>
      <Sponsors />
    </div>
  );
}

export default App;
