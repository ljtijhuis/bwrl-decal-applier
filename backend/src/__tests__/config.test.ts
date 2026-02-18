import request from 'supertest';
import { app } from '../index.js';

describe('GET /api/config', () => {
  it('returns 200 with carModels object', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('carModels');
    expect(typeof res.body.carModels).toBe('object');
  });

  it('includes ferrari-296-gt3-sprint with hasClassDecals: true and group GT3 Sprint', async () => {
    const res = await request(app).get('/api/config');
    const car = res.body.carModels['ferrari-296-gt3-sprint'];
    expect(car).toBeDefined();
    expect(car.label).toBe('Ferrari 296 GT3');
    expect(car.hasClassDecals).toBe(true);
    expect(car.group).toBe('GT3 Sprint');
  });

  it('includes ferrari-296-gt3-bwec with hasClassDecals: false and group BWEC', async () => {
    const res = await request(app).get('/api/config');
    const car = res.body.carModels['ferrari-296-gt3-bwec'];
    expect(car).toBeDefined();
    expect(car.label).toBe('Ferrari 296 GT3');
    expect(car.hasClassDecals).toBe(false);
    expect(car.group).toBe('BWEC');
  });

  it('each car model has label (string), group (string), and hasClassDecals (boolean)', async () => {
    const res = await request(app).get('/api/config');
    for (const car of Object.values(res.body.carModels as Record<string, unknown>)) {
      expect(car).toMatchObject({
        label: expect.any(String),
        group: expect.any(String),
        hasClassDecals: expect.any(Boolean),
      });
    }
  });

  it('returns all 34 car models', async () => {
    const res = await request(app).get('/api/config');
    expect(Object.keys(res.body.carModels)).toHaveLength(34);
  });

  it('contains exactly three series groups: GT3 Sprint, BWEC, and Falken', async () => {
    const res = await request(app).get('/api/config');
    const groups = new Set(
      Object.values(res.body.carModels as Record<string, { group: string }>).map((c) => c.group)
    );
    expect(groups).toEqual(new Set(['GT3 Sprint', 'BWEC', 'Falken']));
  });
});
