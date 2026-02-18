import { Router } from 'express';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DECALS_CONFIG_PATH = join(__dirname, '../../../decals/config.json');

interface DecalEntry {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CarModelConfig {
  label: string;
  group: string;
  decals: {
    base: DecalEntry[];
    classSpecific?: Record<string, DecalEntry[]>;
  };
}

interface DecalConfig {
  carModels: Record<string, CarModelConfig>;
}

export const configRouter = Router();

configRouter.get('/', async (_req, res) => {
  try {
    const raw = await readFile(DECALS_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(raw) as DecalConfig;

    const carModels: Record<string, { label: string; group: string; hasClassDecals: boolean }> = {};
    for (const [id, car] of Object.entries(config.carModels)) {
      carModels[id] = {
        label: car.label,
        group: car.group,
        hasClassDecals:
          car.decals.classSpecific !== undefined &&
          Object.keys(car.decals.classSpecific).length > 0,
      };
    }

    res.json({ carModels });
  } catch {
    res.status(500).json({ error: 'Failed to load configuration' });
  }
});
