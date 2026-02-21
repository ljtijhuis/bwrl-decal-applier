import sharp from 'sharp';
import Psd from '@webtoon/psd';
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
 * Patch a PSD buffer that is missing the mandatory 4-byte global layer mask
 * info length field at the end of the Layer and Mask Information section.
 *
 * GIMP (and some other editors) set the outer section length to exactly
 * `4 + layer_info_length`, leaving no room for the global mask field.
 * @webtoon/psd unconditionally reads that field, causing an out-of-bounds
 * DataView error.  When this condition is detected we insert 4 zero bytes
 * (global mask length = 0) at the correct position and update the outer
 * length field accordingly.
 */
function patchPsdGlobalMask(buf: Buffer): Buffer {
  // Minimum size: header(26) + colorMode(4) + imgRes(4) + layerMask(4) = 38
  if (buf.length < 38) return buf;

  let pos = 26; // skip header

  // Color mode data section
  if (pos + 4 > buf.length) return buf;
  const colorLen = buf.readUInt32BE(pos);
  pos += 4 + colorLen;

  // Image resources section
  if (pos + 4 > buf.length) return buf;
  const imgResLen = buf.readUInt32BE(pos);
  pos += 4 + imgResLen;

  // Layer and mask information section
  if (pos + 8 > buf.length) return buf;
  const lmLenOffset = pos;
  const lmLen = buf.readUInt32BE(pos);
  pos += 4;

  const liLen = buf.readUInt32BE(pos);

  // If remaining bytes after the layer info < 4, the global mask length
  // field is absent and @webtoon/psd will crash trying to read it.
  const remaining = lmLen - 4 - liLen;
  if (remaining >= 4) return buf; // already well-formed, no patch needed

  // @webtoon/psd calls t.padding(position, 4) before reading the global mask
  // length field, which aligns the reader position to the next 4-byte boundary.
  // The reader position after the layer info block is 8 + liLen (4 bytes for
  // the outer length field + 4 bytes for the inner length field + liLen bytes
  // of layer data). We must insert enough bytes to cover that alignment gap
  // PLUS the 4-byte global mask length field.
  const posAfterLayerInfo = 8 + liLen;
  const alignPad = (4 - (posAfterLayerInfo % 4)) % 4;
  const insertCount = alignPad + 4;

  // Insertion point: immediately after the layer info data
  const insertAt = pos + 4 + liLen;
  if (insertAt > buf.length) return buf;

  const patched = Buffer.allocUnsafe(buf.length + insertCount);
  buf.copy(patched, 0, 0, insertAt);                              // everything up to insertion point
  patched.fill(0, insertAt, insertAt + insertCount);              // alignment pad + global mask length = 0
  buf.copy(patched, insertAt + insertCount, insertAt);            // rest of file

  // Update the outer section length to account for the inserted bytes
  patched.writeUInt32BE(lmLen + insertCount, lmLenOffset);

  return patched;
}

/**
 * Decode the merged Image Data section of a PSD buffer into raw pixel data for Sharp.
 * Used as a fallback for flat PSDs (no layer data) that @webtoon/psd cannot parse.
 * Supports 8-bit RGB and RGBA, with raw or PackBits RLE compression.
 * Returns null if the section cannot be decoded.
 */
function decodePsdImageData(
  buffer: Buffer,
): { data: Buffer; width: number; height: number; channels: 3 | 4 } | null {
  if (buffer.length < 26) return null;

  const fileChannels = buffer.readUInt16BE(12);
  const height = buffer.readUInt32BE(14);
  const width = buffer.readUInt32BE(18);
  const depth = buffer.readUInt16BE(22);
  const colorMode = buffer.readUInt16BE(24);

  // Only support 8-bit RGB (colorMode=3). Cap usable channels at 4.
  if (depth !== 8 || colorMode !== 3 || fileChannels < 3) return null;
  if (width === 0 || height === 0) return null;

  const channels: 3 | 4 = fileChannels >= 4 ? 4 : 3;

  // Navigate to the Image Data section (after color mode, image resources, layer+mask)
  let pos = 26;
  if (pos + 4 > buffer.length) return null;
  pos += 4 + buffer.readUInt32BE(pos); // color mode data
  if (pos + 4 > buffer.length) return null;
  pos += 4 + buffer.readUInt32BE(pos); // image resources
  if (pos + 4 > buffer.length) return null;
  pos += 4 + buffer.readUInt32BE(pos); // layer and mask info

  if (pos + 2 > buffer.length) return null;
  const compression = buffer.readUInt16BE(pos);
  pos += 2;

  // Decode each channel's scanlines into a flat buffer (planar layout in PSD)
  const channelData: Buffer[] = [];

  if (compression === 0) {
    // Raw (uncompressed): channels × height × width bytes
    const bytesPerChannel = width * height;
    for (let c = 0; c < channels; c++) {
      if (pos + bytesPerChannel > buffer.length) return null;
      channelData.push(Buffer.from(buffer.subarray(pos, pos + bytesPerChannel)));
      pos += bytesPerChannel;
    }
  } else if (compression === 1) {
    // PackBits RLE: byte-count table (fileChannels × height × 2 bytes) then packed data
    const tableEntries = fileChannels * height;
    if (pos + tableEntries * 2 > buffer.length) return null;

    const byteCounts: number[] = [];
    for (let i = 0; i < tableEntries; i++) {
      byteCounts.push(buffer.readUInt16BE(pos + i * 2));
    }
    pos += tableEntries * 2;

    for (let c = 0; c < channels; c++) {
      const channel = Buffer.alloc(width * height);
      let outOff = 0;
      for (let r = 0; r < height; r++) {
        const rowBytes = byteCounts[c * height + r];
        const end = pos + rowBytes;
        if (end > buffer.length) return null;
        let p = pos;
        while (p < end) {
          const hdr = buffer.readInt8(p);
          p++;
          if (hdr >= 0) {
            // Literal run: copy next (hdr+1) bytes verbatim
            const count = hdr + 1;
            buffer.copy(channel, outOff, p, p + count);
            outOff += count;
            p += count;
          } else if (hdr !== -128) {
            // Repeat run: repeat next byte (-hdr+1) times
            const count = -hdr + 1;
            channel.fill(buffer[p], outOff, outOff + count);
            outOff += count;
            p++;
          }
          // hdr === -128 is a no-op
        }
        pos = end;
      }
      channelData.push(channel);
    }
  } else {
    // ZIP compression not supported
    return null;
  }

  // Interleave planar channels (RRR…GGG…BBB…) into packed pixels (RGBRGB… or RGBARGBA…)
  const out = Buffer.alloc(width * height * channels);
  for (let i = 0; i < width * height; i++) {
    for (let c = 0; c < channels; c++) {
      out[i * channels + c] = channelData[c][i];
    }
  }
  return { data: out, width, height, channels };
}

async function decodePsd(
  buffer: Buffer,
): Promise<{ data: Buffer; width: number; height: number; channels: 3 | 4 } | null> {
  // PSD magic bytes: "8BPS" (0x38 0x42 0x50 0x53)
  if (buffer.length < 4) return null;
  if (buffer[0] !== 0x38 || buffer[1] !== 0x42 || buffer[2] !== 0x50 || buffer[3] !== 0x53) {
    return null;
  }

  // Try @webtoon/psd first — it composites all visible layers correctly.
  // Fix PSDs that omit the global layer mask info length field (e.g. GIMP exports).
  try {
    const patchedBuffer = patchPsdGlobalMask(buffer);
    // Safe ArrayBuffer conversion — Node Buffer may have a byteOffset into a shared pool.
    // Cast to ArrayBuffer: Buffer.slice always returns ArrayBuffer, not SharedArrayBuffer.
    const arrayBuffer = patchedBuffer.buffer.slice(patchedBuffer.byteOffset, patchedBuffer.byteOffset + patchedBuffer.byteLength) as ArrayBuffer;
    const psdFile = Psd.parse(arrayBuffer);
    const compositeData = await psdFile.composite(); // Uint8ClampedArray, RGBA
    return {
      data: Buffer.from(compositeData),
      width: psdFile.width,
      height: psdFile.height,
      channels: 4,
    };
  } catch {
    // @webtoon/psd could not parse this PSD (e.g. flat/merged PSD with no layer data).
    // Fall back to decoding the merged Image Data section directly.
  }

  return decodePsdImageData(buffer);
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

async function liveryToSharp(buffer: Buffer): Promise<sharp.Sharp> {
  const psd = await decodePsd(buffer);
  if (psd) {
    return sharp(psd.data, { raw: { width: psd.width, height: psd.height, channels: psd.channels } });
  }
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

  const base = await liveryToSharp(liveryBuffer);
  return base.composite(compositeOps).png().toBuffer();
}
