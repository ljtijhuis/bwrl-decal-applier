/**
 * diagnose-psd.mjs
 *
 * Runs a PSD file through the exact same code path the backend uses,
 * with full error reporting instead of the generic 422 message.
 *
 * Usage:
 *   node diagnose-psd.mjs <path-to-file.psd>
 */

import { readFile } from 'node:fs/promises';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node diagnose-psd.mjs <path-to-file.psd>');
  process.exit(1);
}

const buffer = await readFile(filePath);
console.log(`File: ${filePath}`);
console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB\n`);

// ── Step 1: magic bytes ──────────────────────────────────────────────────────
const magic = buffer.slice(0, 4).toString('ascii');
console.log(`Magic bytes: "${magic}" (expected "8BPS")`);
if (magic !== '8BPS') {
  console.error('✗ Magic bytes do not match — file is not a PSD.');
  process.exit(1);
}
console.log('✓ Magic bytes OK\n');

// ── Step 2: Psd.parse ────────────────────────────────────────────────────────
const { default: Psd } = await import('@webtoon/psd');
const arrayBuffer = buffer.buffer.slice(
  buffer.byteOffset,
  buffer.byteOffset + buffer.byteLength,
);

let psdFile;
try {
  psdFile = Psd.parse(arrayBuffer);
  console.log(`✓ Psd.parse() succeeded`);
  console.log(`  dimensions : ${psdFile.width} × ${psdFile.height}`);
  console.log(`  children   : ${psdFile.children.length} top-level layer(s)`);
  for (const child of psdFile.children) {
    const name = child.name ?? '(unnamed)';
    const type = child.type;
    console.log(`    - [${type}] "${name}"`);
  }
  console.log();
} catch (err) {
  console.error('✗ Psd.parse() threw:\n', err);
  process.exit(1);
}

// ── Step 3: composite ────────────────────────────────────────────────────────
let compositeData;
try {
  compositeData = await psdFile.composite();
  console.log(`✓ psdFile.composite() succeeded`);
  const expectedLen = psdFile.width * psdFile.height * 4;
  console.log(`  composite length : ${compositeData.length} bytes`);
  console.log(`  expected (RGBA)  : ${expectedLen} bytes`);
  if (compositeData.length !== expectedLen) {
    console.error(`  ✗ Length mismatch — composite result is wrong size.`);
    process.exit(1);
  }
  // Sample a pixel from the centre
  const cx = Math.floor(psdFile.width / 2);
  const cy = Math.floor(psdFile.height / 2);
  const idx = (cy * psdFile.width + cx) * 4;
  const [r, g, b, a] = [compositeData[idx], compositeData[idx+1], compositeData[idx+2], compositeData[idx+3]];
  console.log(`  centre pixel     : rgba(${r}, ${g}, ${b}, ${a})`);
  console.log();
} catch (err) {
  console.error('✗ psdFile.composite() threw:\n', err);
  process.exit(1);
}

// ── Step 4: Sharp raw input ──────────────────────────────────────────────────
const { default: sharp } = await import('sharp');
try {
  const data = Buffer.from(compositeData);
  const instance = sharp(data, {
    raw: { width: psdFile.width, height: psdFile.height, channels: 4 },
  });
  const meta = await instance.metadata();
  console.log(`✓ sharp() accepted the raw pixel data`);
  console.log(`  format   : ${meta.format ?? 'raw'}`);
  console.log(`  width    : ${meta.width}`);
  console.log(`  height   : ${meta.height}`);
  console.log(`  channels : ${meta.channels}`);
  console.log();
} catch (err) {
  console.error('✗ sharp() threw on the raw composite data:\n', err);
  process.exit(1);
}

console.log('All steps passed — this PSD should work with the backend.');
