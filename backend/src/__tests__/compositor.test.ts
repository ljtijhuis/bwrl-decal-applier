import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyDecals } from '../services/compositor.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DECALS_DIR = join(__dirname, '../../../decals');

describe('applyDecals', () => {
  let liveryBuffer: Buffer;
  let tgaBuffer: Buffer;

  beforeAll(async () => {
    liveryBuffer = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 4,
        background: { r: 200, g: 100, b: 50, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    // Build a minimal valid 2x2 TGA (type 2, 32bpp, top-to-bottom)
    const w = 2, h = 2;
    const header = Buffer.alloc(18, 0);
    header[2] = 2;                    // uncompressed true-color
    header.writeUInt16LE(w, 12);
    header.writeUInt16LE(h, 14);
    header[16] = 32;                  // 32 bpp
    header[17] = 0x28;                // top-left origin, 8-bit alpha
    const pixels = Buffer.alloc(w * h * 4, 128); // BGRA gray pixels
    tgaBuffer = Buffer.concat([header, pixels]);
  });

  it('returns a Buffer', async () => {
    const result = await applyDecals(liveryBuffer, [], DECALS_DIR);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('output is a valid PNG', async () => {
    const result = await applyDecals(liveryBuffer, [], DECALS_DIR);
    const meta = await sharp(result).metadata();
    expect(meta.format).toBe('png');
  });

  it('composites a single decal without error', async () => {
    const entries = [
      { file: 'example/league-logo.png', x: 10, y: 10, width: 50, height: 30 },
    ];
    const result = await applyDecals(liveryBuffer, entries, DECALS_DIR);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('composites multiple decals without error', async () => {
    const entries = [
      { file: 'example/league-logo.png', x: 10, y: 10, width: 50, height: 30 },
      { file: 'example/class-am.png', x: 100, y: 100, width: 40, height: 40 },
    ];
    const result = await applyDecals(liveryBuffer, entries, DECALS_DIR);
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('accepts a TGA livery and returns a valid PNG', async () => {
    const result = await applyDecals(tgaBuffer, [], DECALS_DIR);
    const meta = await sharp(result).metadata();
    expect(meta.format).toBe('png');
  });

  it('rejects for an invalid livery buffer', async () => {
    const badBuffer = Buffer.from('not an image');
    await expect(applyDecals(badBuffer, [], DECALS_DIR)).rejects.toThrow();
  });

  it('rejects when a decal file does not exist', async () => {
    const entries = [{ file: 'nonexistent/decal.png', x: 0, y: 0, width: 10, height: 10 }];
    await expect(applyDecals(liveryBuffer, entries, DECALS_DIR)).rejects.toThrow();
  });
});
