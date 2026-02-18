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

/**
 * Decode an uncompressed TGA buffer into raw RGBA/RGB pixel data for Sharp.
 * TGA has no magic bytes, so Sharp cannot auto-detect it from a buffer.
 * Supports type 2 (uncompressed true-color), 24bpp and 32bpp.
 * Returns null if the buffer does not look like a supported TGA file.
 */
function decodeTga(
  buffer: Buffer,
): { data: Buffer; width: number; height: number; channels: 3 | 4 } | null {
  if (buffer.length < 18) return null;

  const idLength = buffer[0];
  const colorMapType = buffer[1];
  const imageType = buffer[2];
  const width = buffer.readUInt16LE(12);
  const height = buffer.readUInt16LE(14);
  const bpp = buffer[16];
  const imageDescriptor = buffer[17];

  // Only handle uncompressed true-color (type 2) without a color map, 24 or 32 bpp
  if (colorMapType !== 0 || imageType !== 2 || (bpp !== 24 && bpp !== 32)) return null;
  if (width === 0 || height === 0) return null;

  const bytesPerPixel = bpp / 8;
  const dataOffset = 18 + idLength;
  if (buffer.length < dataOffset + width * height * bytesPerPixel) return null;

  const channels: 3 | 4 = bpp === 32 ? 4 : 3;
  const pixelData = buffer.subarray(dataOffset, dataOffset + width * height * bytesPerPixel);

  // Convert BGR/BGRA → RGB/RGBA
  const rgba = Buffer.alloc(width * height * channels);
  for (let i = 0; i < width * height; i++) {
    const src = i * bytesPerPixel;
    const dst = i * channels;
    rgba[dst] = pixelData[src + 2]; // R
    rgba[dst + 1] = pixelData[src + 1]; // G
    rgba[dst + 2] = pixelData[src]; // B
    if (channels === 4) rgba[dst + 3] = pixelData[src + 3]; // A
  }

  // Bit 5 of image descriptor: 0 = bottom-to-top (standard TGA), 1 = top-to-bottom
  const isTopToBottom = (imageDescriptor & 0x20) !== 0;
  if (isTopToBottom) {
    return { data: rgba, width, height, channels };
  }

  // Flip vertically: standard TGA stores rows bottom-to-top
  const rowSize = width * channels;
  const flipped = Buffer.alloc(rgba.length);
  for (let row = 0; row < height; row++) {
    rgba.copy(flipped, row * rowSize, (height - 1 - row) * rowSize, (height - row) * rowSize);
  }
  return { data: flipped, width, height, channels };
}

function liveryToSharp(buffer: Buffer): sharp.Sharp {
  const tga = decodeTga(buffer);
  if (tga) {
    return sharp(tga.data, { raw: { width: tga.width, height: tga.height, channels: tga.channels } });
  }
  return sharp(buffer);
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

  return liveryToSharp(liveryBuffer).composite(compositeOps).png().toBuffer();
}
