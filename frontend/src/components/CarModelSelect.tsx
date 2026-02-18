import type { ApiConfig } from '../types/config';

interface CarModelSelectProps {
  config: ApiConfig | null;
  loading: boolean;
  value: string;
  onChange: (carModelId: string) => void;
}

export function CarModelSelect({ config, loading, value, onChange }: CarModelSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="form-field">
      <label htmlFor="car-model">Car Model</label>
      <select
        id="car-model"
        value={value}
        onChange={handleChange}
        disabled={loading || config === null}
        aria-label="Select car model"
      >
        <option value="">{loading ? 'Loading…' : '— Select a car model —'}</option>
        {config &&
          Object.entries(config.carModels).map(([id, car]) => (
            <option key={id} value={id}>
              {car.label}
            </option>
          ))}
      </select>
    </div>
  );
}
