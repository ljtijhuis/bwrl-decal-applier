import request from 'supertest';
import sharp from 'sharp';
import { app } from '../index.js';

describe('POST /api/apply', () => {
  let pngBuffer: Buffer;

  beforeAll(async () => {
    pngBuffer = await sharp({
      create: {
        width: 2048,
        height: 2048,
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
      .field('carModel', 'ferrari-296-gt3-sprint')
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
      .field('carModel', 'ferrari-296-gt3-sprint');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/driverClass/i);
  });

  it('returns 400 when driverClass is invalid for a class-decal car', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.png', contentType: 'image/png' })
      .field('carModel', 'ferrari-296-gt3-sprint')
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
      .field('carModel', 'ferrari-296-gt3-sprint');
    expect(res.status).toBe(415);
    expect(res.body.error).toMatch(/png and tga/i);
  });

  it('returns 200 PNG for valid Ferrari Sprint with AM class decal', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.png', contentType: 'image/png' })
      .field('carModel', 'ferrari-296-gt3-sprint')
      .field('driverClass', 'AM');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });

  it('returns 200 PNG for valid Ferrari BWEC without class decal', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.png', contentType: 'image/png' })
      .field('carModel', 'ferrari-296-gt3-bwec');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
  });

  it('silently ignores driverClass for a car without class decals', async () => {
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.png', contentType: 'image/png' })
      .field('carModel', 'ferrari-296-gt3-bwec')
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
      .field('carModel', 'ferrari-296-gt3-bwec');
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/could not process/i);
  });

  it('accepts a .tga extension file', async () => {
    // multer accepts it by extension; Sharp decodes it if valid, 422 otherwise.
    // We send a PNG buffer with a .tga filename to test the extension check path.
    const res = await request(app)
      .post('/api/apply')
      .attach('livery', pngBuffer, { filename: 'livery.tga', contentType: 'application/octet-stream' })
      .field('carModel', 'ferrari-296-gt3-bwec');
    // multer accepts the file (by .tga extension); Sharp can decode a PNG buffer regardless of name
    expect([200, 422]).toContain(res.status);
  });
});

describe('per-car-model compositing', () => {
  let liveryBuffer: Buffer;

  beforeAll(async () => {
    liveryBuffer = await sharp({
      create: {
        width: 2048,
        height: 2048,
        channels: 4,
        background: { r: 100, g: 100, b: 100, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  });

  // Cars WITHOUT class decals: BWEC GT3, BWEC GTP, Falken GT4, Falken LMP3
  const nonClassDecalCars: [string][] = [
    ['acura-nsx-gt3-evo-bwec'],
    ['aston-martin-vantage-gt3-evo-bwec'],
    ['audi-r8-lms-gt3-evo-bwec'],
    ['bmw-m4-gt3-bwec'],
    ['corvette-z06-gt3r-bwec'],
    ['ferrari-296-gt3-bwec'],
    ['lamborghini-huracan-gt3-evo-bwec'],
    ['mclaren-720s-gt3-bwec'],
    ['mercedes-amg-gt3-evo-bwec'],
    ['ford-mustang-gt3-bwec'],
    ['porsche-992-gt3r-bwec'],
    ['acura-arx-06-gtp'],
    ['bmw-m-hybrid-v8-gtp'],
    ['cadillac-v-series-r-gtp'],
    ['ferrari-499p'],
    ['porsche-963-gtp'],
    ['aston-martin-gt4-falken'],
    ['bmw-m4-g82-gt4-evo-falken'],
    ['ford-mustang-gt4-falken'],
    ['mclaren-570s-gt4-falken'],
    ['mercedes-amg-gt4-falken'],
    ['porsche-718-cayman-gt4-falken'],
    ['lmp3-falken'],
  ];

  // Cars WITH class decals: GT3 Sprint
  const classDecalCars: [string][] = [
    ['acura-nsx-gt3-evo-sprint'],
    ['aston-martin-vantage-gt3-evo-sprint'],
    ['audi-r8-lms-gt3-evo-sprint'],
    ['bmw-m4-gt3-sprint'],
    ['corvette-z06-gt3r-sprint'],
    ['ferrari-296-gt3-sprint'],
    ['lamborghini-huracan-gt3-evo-sprint'],
    ['mclaren-720s-gt3-sprint'],
    ['mercedes-amg-gt3-evo-sprint'],
    ['ford-mustang-gt3-sprint'],
    ['porsche-992-gt3r-sprint'],
  ];

  test.each(nonClassDecalCars)(
    'composites %s without driverClass and returns PNG',
    async (carModelId) => {
      const res = await request(app)
        .post('/api/apply')
        .attach('livery', liveryBuffer, { filename: 'livery.png', contentType: 'image/png' })
        .field('carModel', carModelId);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/image\/png/);
    }
  );

  test.each(classDecalCars)(
    'composites %s with driverClass AM and returns PNG',
    async (carModelId) => {
      const res = await request(app)
        .post('/api/apply')
        .attach('livery', liveryBuffer, { filename: 'livery.png', contentType: 'image/png' })
        .field('carModel', carModelId)
        .field('driverClass', 'AM');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/image\/png/);
    }
  );
});
