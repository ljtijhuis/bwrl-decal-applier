import type { ApiCarModel, ApiConfig } from '../types/config';

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
          (() => {
            const groupOrder: string[] = [];
            const grouped: Record<string, Array<[string, ApiCarModel]>> = {};
            for (const [id, car] of Object.entries(config.carModels)) {
              if (!grouped[car.group]) {
                groupOrder.push(car.group);
                grouped[car.group] = [];
              }
              grouped[car.group].push([id, car]);
            }
            return groupOrder.map((groupName) => (
              <optgroup key={groupName} label={groupName}>
                {grouped[groupName].map(([id, car]) => (
                  <option key={id} value={id}>
                    {car.label}
                  </option>
                ))}
              </optgroup>
            ));
          })()}
      </select>
    </div>
  );
}
