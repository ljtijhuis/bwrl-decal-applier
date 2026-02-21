import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { applyDecals } from '../services/compositor.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DECALS_DIR = join(__dirname, '../../../decals');
const DECALS_CONFIG_PATH = join(DECALS_DIR, 'config.json');
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

interface DecalEntry {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CarModelConfig {
  label: string;
  decals: {
    base: DecalEntry[];
    classSpecific?: Record<string, DecalEntry[]>;
  };
}

interface DecalConfig {
  carModels: Record<string, CarModelConfig>;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const validMime = [
      'image/png',
      'image/x-tga',
      'image/tga',
      'image/vnd.adobe.photoshop',
      'application/photoshop',
    ].includes(file.mimetype);
    const validExt = ext === 'png' || ext === 'tga' || ext === 'psd';
    if (validMime || validExt) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  },
});

export const applyRouter = Router();

applyRouter.post('/', upload.single('livery'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No livery file uploaded.' });
    return;
  }

  const { carModel, driverClass } = req.body as { carModel?: string; driverClass?: string };

  if (!carModel) {
    res.status(400).json({ error: 'carModel is required.' });
    return;
  }

  const raw = await readFile(DECALS_CONFIG_PATH, 'utf-8');
  const config = JSON.parse(raw) as DecalConfig;

  const carConfig = config.carModels[carModel];
  if (!carConfig) {
    res.status(400).json({ error: `Unknown car model: ${carModel}` });
    return;
  }

  const entries: DecalEntry[] = [...carConfig.decals.base];

  if (carConfig.decals.classSpecific) {
    if (!driverClass || !(driverClass in carConfig.decals.classSpecific)) {
      res.status(400).json({
        error:
          'driverClass is required and must be one of AM, PRO-AM, PRO, ROOKIE for this car model.',
      });
      return;
    }
    const classEntries = carConfig.decals.classSpecific[driverClass];
    if (classEntries) entries.push(...classEntries);
  }

  try {
    const resultBuffer = await applyDecals(req.file.buffer, entries, DECALS_DIR);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="livery-with-decals.png"');
    res.send(resultBuffer);
  } catch {
    res
      .status(422)
      .json({ error: 'Could not process the uploaded image. Ensure it is a valid PNG, TGA, or PSD file.' });
  }
});

export function multerErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File is too large. Maximum size is 20 MB.' });
      return;
    }
    res.status(400).json({ error: `Upload error: ${err.message}` });
    return;
  }
  if (err instanceof Error && err.message === 'INVALID_FILE_TYPE') {
    res.status(415).json({ error: 'Only PNG, TGA, and PSD files are accepted.' });
    return;
  }
  next(err);
}
