import request from 'supertest';
import { app } from '../index.js';

describe('GET /api/config', () => {
  it('returns 200 with carModels object', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('carModels');
    expect(typeof res.body.carModels).toBe('object');
  });

  it('includes ferrari-296-gt3 with hasClassDecals: true', async () => {
    const res = await request(app).get('/api/config');
    expect(res.body.carModels['ferrari-296-gt3']).toBeDefined();
    expect(res.body.carModels['ferrari-296-gt3'].label).toBe('Ferrari 296 GT3');
    expect(res.body.carModels['ferrari-296-gt3'].hasClassDecals).toBe(true);
  });

  it('includes porsche-911-gt3-r with hasClassDecals: false', async () => {
    const res = await request(app).get('/api/config');
    expect(res.body.carModels['porsche-911-gt3-r']).toBeDefined();
    expect(res.body.carModels['porsche-911-gt3-r'].label).toBe('Porsche 911 GT3 R');
    expect(res.body.carModels['porsche-911-gt3-r'].hasClassDecals).toBe(false);
  });

  it('each car model has label (string) and hasClassDecals (boolean)', async () => {
    const res = await request(app).get('/api/config');
    for (const car of Object.values(res.body.carModels as Record<string, unknown>)) {
      expect(car).toMatchObject({
        label: expect.any(String),
        hasClassDecals: expect.any(Boolean),
      });
    }
  });
});
