export interface DecalEntry {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DriverClass = 'AM' | 'PRO-AM' | 'PRO' | 'ROOKIE';

export interface CarModelConfig {
  label: string;
  decals: {
    base: DecalEntry[];
    classSpecific?: Partial<Record<DriverClass, DecalEntry[]>>;
  };
}

export interface DecalConfig {
  carModels: Record<string, CarModelConfig>;
}

/** Simplified shape returned by GET /api/config */
export interface ApiCarModel {
  label: string;
  group: string;
  hasClassDecals: boolean;
}

export interface ApiConfig {
  carModels: Record<string, ApiCarModel>;
}
