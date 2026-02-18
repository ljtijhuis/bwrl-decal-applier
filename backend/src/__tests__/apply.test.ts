import request from 'supertest';
import sharp from 'sharp';
import { app } from '../index.js';

describe('POST /api/apply', () => {
  let pngBuffer: Buffer;

  beforeAll(async () => {
    pngBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 4,
        background: { r: 100, g: 100, b: 100, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  });

  it('returns 400 when no file is uploaded', async () => {
    const res = await request(app)
      .post('/api/apply')
      .field('carModel', 'ferrari-296-gt3')
      .field('driverClass', 'AM');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no livery/i);
  });

  it('returns 400 when carModel is missing', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/carModel/i);
  });

  it('returns 400 for an unknown car model', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.png', contentType: 'image/png' })
      .field('carModel', 'nonexistent-car');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unknown car model/i);
  });

  it('returns 400 when driverClass is missing for a class-decal car', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.png', contentType: 'image/png' })
      .field('carModel', 'ferrari-296-gt3');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/driverClass/i);
  });

  it('returns 400 when driverClass is invalid for a class-decal car', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.png', contentType: 'image/png' })
      .field('carModel', 'ferrari-296-gt3')
      .field('driverClass', 'INVALID');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/driverClass/i);
  });

  it('returns 413 when file exceeds 20 MB', async () => {
    const bigBuffer = Buffer.alloc(21 * 1024 * 1024);
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', bigBuffer, { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBe(413);
    expect(res.body.error).toMatch(/too large/i);
  });

  it('returns 415 for an unsupported file type', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', Buffer.from('fake jpg'), {
        filename: 'livery.jpg',
        contentType: 'image/jpeg',
      })
      .field('carModel', 'ferrari-296-gt3');
    expect(res.status).toBe(415);
    expect(res.body.error).toMatch(/png and tga/i);
  });

  it('returns 200 PNG for valid Ferrari with AM class decal', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.png', contentType: 'image/png' })
      .field('carModel', 'ferrari-296-gt3')
      .field('driverClass', 'AM');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });

  it('returns 200 PNG for valid Porsche without class decal', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.png', contentType: 'image/png' })
      .field('carModel', 'porsche-911-gt3-r');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
  });

  it('silently ignores driverClass for a car without class decals', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.png', contentType: 'image/png' })
      .field('carModel', 'porsche-911-gt3-r')
      .field('driverClass', 'AM');
    expect(res.status).toBe(200);
  });

  it('returns 422 for a corrupt image buffer', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', Buffer.from('this is not an image'), {
        filename: 'corrupt.png',
        contentType: 'image/png',
      })
      .field('carModel', 'porsche-911-gt3-r');
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/could not process/i);
  });

  it('accepts a .tga extension file', async () => {
    // multer accepts it by extension; Sharp decodes it if valid, 422 otherwise.
    // We send a PNG buffer with a .tga filename to test the extension check path.
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.tga', contentType: 'application/octet-stream' })
      .field('carModel', 'porsche-911-gt3-r');
    // multer accepts the file (by .tga extension); Sharp can decode a PNG buffer regardless of name
    expect([200, 422]).toContain(res.status);
  });
});
