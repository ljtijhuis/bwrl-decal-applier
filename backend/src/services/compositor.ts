import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface DecalEntry {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function applyDecals(
  liveryBuffer: Buffer,
  decalEntries: DecalEntry[],
  decalsDir: string,
): Promise<Buffer> {
  const compositeOps: sharp.OverlayOptions[] = [];

  for (const entry of decalEntries) {
    const decalPath = join(decalsDir, entry.file);
    const rawDecalBuffer = await readFile(decalPath);
    const resizedDecal = await sharp(rawDecalBuffer)
      .resize(entry.width, entry.height, { fit: 'fill' })
      .png()
      .toBuffer();
    compositeOps.push({ input: resizedDecal, left: entry.x, top: entry.y });
  }

  return sharp(liveryBuffer).composite(compositeOps).png().toBuffer();
}
