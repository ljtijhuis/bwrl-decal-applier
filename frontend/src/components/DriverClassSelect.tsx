import type { DriverClass } from '../types/config';

const DRIVER_CLASSES: DriverClass[] = ['AM', 'PRO-AM', 'PRO', 'ROOKIE'];

interface DriverClassSelectProps {
  visible: boolean;
  value: DriverClass | '';
  onChange: (driverClass: DriverClass | '') => void;
}

export function DriverClassSelect({ visible, value, onChange }: DriverClassSelectProps) {
  if (!visible) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as DriverClass | '');
  };

  return (
    <div className="form-field">
      <label htmlFor="driver-class">Driver Class</label>
      <select
        id="driver-class"
        value={value}
        onChange={handleChange}
        aria-label="Select driver class"
      >
        <option value="">— Select a driver class —</option>
        {DRIVER_CLASSES.map((cls) => (
          <option key={cls} value={cls}>
            {cls}
          </option>
        ))}
      </select>
    </div>
  );
}
