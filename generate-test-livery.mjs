/**
 * generate-test-livery.mjs
 *
 * Generates a minimal valid 2048×2048 PSD file for manually testing
 * PSD upload support in the decal applier.
 *
 * Run: node generate-test-livery.mjs
 *
 * The PSD has one fully-opaque layer filled with BWRL forest green.
 * @webtoon/psd (used by the backend) processes the layer tree, so the
 * layer data is what matters — not the merged Image Data section.
 */

import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WIDTH  = 2048;
const HEIGHT = 2048;

// BWRL forest green fill colour
const FILL_R = 34;
const FILL_G = 85;
const FILL_B = 46;
const FILL_A = 255;

// ---------------------------------------------------------------------------
// PackBits helpers
// ---------------------------------------------------------------------------

/**
 * PackBits-encode a single scanline of `count` identical bytes of `value`.
 * Header byte -n (stored unsigned) means "repeat next byte 1-n times".
 * Maximum run = 128 (header = -127 = 0x81).
 */
function packLine(value, count) {
  const out = [];
  let remaining = count;
  while (remaining > 0) {
    const run = Math.min(remaining, 128);
    // Signed -( run-1 ) stored as unsigned byte
    out.push((256 - (run - 1)) & 0xff, value);
    remaining -= run;
  }
  return Buffer.from(out);
}

/**
 * Build the full channel image data block for a channel of solid `value`.
 * Returns { block, byteCounts, packed } where:
 *   block      = compression word (2) + byteCountTable + packedScanlines
 *   byteCounts = the raw byte-count table (HEIGHT × 2 bytes)
 *   packed     = the raw compressed scanline data
 */
function encodeChannel(value) {
  const line    = packLine(value, WIDTH);
  const lineLen = line.length;

  // ByteCount table: one UInt16BE per scanline
  const byteCounts = Buffer.alloc(HEIGHT * 2);
  for (let row = 0; row < HEIGHT; row++) {
    byteCounts.writeUInt16BE(lineLen, row * 2);
  }

  // Compressed data: same packed scanline repeated HEIGHT times
  const packed = Buffer.alloc(lineLen * HEIGHT);
  for (let row = 0; row < HEIGHT; row++) {
    line.copy(packed, row * lineLen);
  }

  const compressionWord = Buffer.alloc(2);
  compressionWord.writeUInt16BE(1); // 1 = PackBits

  return {
    block:      Buffer.concat([compressionWord, byteCounts, packed]),
    byteCounts,
    packed,
  };
}

// ---------------------------------------------------------------------------
// PSD builder
// ---------------------------------------------------------------------------

function buildPSD() {
  // Pre-compute compressed channel data for the layer (RGBA)
  const aCh = encodeChannel(FILL_A);
  const rCh = encodeChannel(FILL_R);
  const gCh = encodeChannel(FILL_G);
  const bCh = encodeChannel(FILL_B);

  // ── Layer Record (70 bytes) ──────────────────────────────────────────────
  //
  // Extra data inside the layer record (required subsections):
  //   Layer mask data:        4 bytes (length = 0)
  //   Layer blending ranges:  4 bytes (length = 0)
  //   Layer name (Pascal str, padded to multiple of 4):
  //     empty string = 1 byte (length=0) + 3 bytes padding = 4 bytes
  //
  const extraData    = Buffer.alloc(12); // 4 + 4 + 4
  const extraDataLen = 12;

  // Layout: rect(16) + chanCount(2) + chanInfo(4×6=24) + blendSig(4) + blendKey(4)
  //         + opacity(1) + clipping(1) + flags(1) + filler(1) + extraLen(4) + extra(12) = 70
  const lr  = Buffer.alloc(70);
  let o = 0;

  // Bounding rectangle (top, left, bottom, right)
  lr.writeInt32BE(0,      o); o += 4;
  lr.writeInt32BE(0,      o); o += 4;
  lr.writeInt32BE(HEIGHT, o); o += 4;
  lr.writeInt32BE(WIDTH,  o); o += 4;

  // Number of channels: 4 (alpha + RGB)
  lr.writeUInt16BE(4, o); o += 2;

  // Channel info: [channelID (Int16BE), dataLength (UInt32BE)]
  lr.writeInt16BE(-1,              o); o += 2;
  lr.writeUInt32BE(aCh.block.length, o); o += 4; // alpha
  lr.writeInt16BE(0,               o); o += 2;
  lr.writeUInt32BE(rCh.block.length, o); o += 4; // red
  lr.writeInt16BE(1,               o); o += 2;
  lr.writeUInt32BE(gCh.block.length, o); o += 4; // green
  lr.writeInt16BE(2,               o); o += 2;
  lr.writeUInt32BE(bCh.block.length, o); o += 4; // blue

  // Blend mode signature + key
  lr.write('8BIM', o, 'ascii'); o += 4;
  lr.write('norm', o, 'ascii'); o += 4; // Normal

  // Opacity, clipping, flags (0 = visible), filler
  lr.writeUInt8(255, o); o += 1; // fully opaque
  lr.writeUInt8(0,   o); o += 1; // base clipping
  lr.writeUInt8(0,   o); o += 1; // flags: visible, not protected
  lr.writeUInt8(0,   o); o += 1; // filler

  // Extra data
  lr.writeUInt32BE(extraDataLen, o); o += 4;
  extraData.copy(lr, o);           o += extraDataLen;

  if (o !== 70) throw new Error(`Layer record size mismatch: ${o} (expected 70)`);

  // ── Layer Info ───────────────────────────────────────────────────────────
  // layer_count(2) + layer_record + channel_image_data
  const layerCount = Buffer.alloc(2);
  layerCount.writeInt16BE(1); // 1 layer (positive → no merged alpha)

  const chanImageData   = Buffer.concat([aCh.block, rCh.block, gCh.block, bCh.block]);
  const layerInfoContent = Buffer.concat([layerCount, lr, chanImageData]);

  // Layer info length must be even (pad to next multiple of 2 if needed)
  const layerInfoPad = layerInfoContent.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0);
  const layerInfoLen = layerInfoContent.length + layerInfoPad.length;

  const layerInfoLenBuf = Buffer.alloc(4);
  layerInfoLenBuf.writeUInt32BE(layerInfoLen);

  // ── Layer and Mask Section ───────────────────────────────────────────────
  // total_length(4) + layer_info_length(4) + layer_info_content [+ padding]
  //   + global_layer_mask_info_length(4, value=0)
  //
  // @webtoon/psd unconditionally reads the 4-byte global mask length field
  // after the layer records, even when there is no global mask data.
  const globalMaskLen = Buffer.alloc(4); // length = 0, no global mask data
  const layerMaskContent = Buffer.concat([
    layerInfoLenBuf,
    layerInfoContent,
    layerInfoPad,
    globalMaskLen,
  ]);
  const layerMaskLenBuf = Buffer.alloc(4);
  layerMaskLenBuf.writeUInt32BE(layerMaskContent.length);

  // ── Image Data Section (merged/flattened composite) ──────────────────────
  // Even though @webtoon/psd's composite() uses the layer tree rather than
  // this section, the section must be well-formed for parsing to succeed.
  //
  // Format (PackBits):
  //   2 bytes:  compression type
  //   numChannels × HEIGHT × 2 bytes: byte-count table (all channels, R first)
  //   numChannels × compressed data
  const mrCh = encodeChannel(FILL_R);
  const mgCh = encodeChannel(FILL_G);
  const mbCh = encodeChannel(FILL_B);

  const imgComprWord = Buffer.alloc(2);
  imgComprWord.writeUInt16BE(1); // PackBits

  // ── PSD Header (26 bytes) ────────────────────────────────────────────────
  const header = Buffer.alloc(26);
  header.write('8BPS', 0, 'ascii'); // Signature
  header.writeUInt16BE(1,      4);  // Version 1 (PSD, not PSB)
  // Bytes 6–11: reserved (already 0)
  header.writeUInt16BE(3,      12); // 3 channels for merged image (RGB)
  header.writeUInt32BE(HEIGHT, 14);
  header.writeUInt32BE(WIDTH,  18);
  header.writeUInt16BE(8,      22); // 8 bits per channel
  header.writeUInt16BE(3,      24); // Color mode: RGB

  return Buffer.concat([
    // Header
    header,
    // Color Mode Data section (length = 0)
    Buffer.alloc(4),
    // Image Resources section (length = 0)
    Buffer.alloc(4),
    // Layer and Mask Information section
    layerMaskLenBuf,
    layerMaskContent,
    // Image Data section
    imgComprWord,
    mrCh.byteCounts, mgCh.byteCounts, mbCh.byteCounts, // byte count table
    mrCh.packed,     mgCh.packed,     mbCh.packed,     // compressed data
  ]);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('Building PSD binary...');
const psd = buildPSD();
console.log(`PSD size: ${(psd.length / 1024).toFixed(0)} KB`);

// Self-verify: parse with @webtoon/psd (the same library the backend uses)
console.log('Verifying with @webtoon/psd...');
const { default: Psd } = await import('@webtoon/psd');
const arrayBuffer = psd.buffer.slice(psd.byteOffset, psd.byteOffset + psd.byteLength);
const parsed    = Psd.parse(arrayBuffer);
const composite = await parsed.composite();

const expectedPixels = parsed.width * parsed.height * 4; // RGBA
if (composite.length !== expectedPixels) {
  console.error(`Composite size mismatch: got ${composite.length}, expected ${expectedPixels}`);
  process.exit(1);
}
// Spot-check first pixel
const [pr, pg, pb, pa] = [composite[0], composite[1], composite[2], composite[3]];
console.log(`First pixel RGBA: (${pr}, ${pg}, ${pb}, ${pa}) — expected (${FILL_R}, ${FILL_G}, ${FILL_B}, ${FILL_A})`);
if (pr !== FILL_R || pg !== FILL_G || pb !== FILL_B || pa !== FILL_A) {
  console.error('First pixel does not match expected fill colour — PSD may be malformed.');
  process.exit(1);
}

const outputPath = join(__dirname, 'test-livery.psd');
await writeFile(outputPath, psd);
console.log(`\ntest-livery.psd written (${(psd.length / 1024).toFixed(0)} KB)`);
console.log('Upload it via the app to verify PSD support end-to-end.');
