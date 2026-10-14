import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import * as db from './helpers/db.js';

beforeAll(db.connect);
beforeEach(db.seedMenu);
afterEach(db.clear);
afterAll(db.close);

describe('GET /api/menu', () => {
  it('returns only available items with name, description, price and image', async () => {
    const res = await request(app).get('/api/menu');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.data.map((i) => i.name)).not.toContain('Sold Out Fries');
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        price: expect.any(Number),
        image: expect.any(String),
      })
    );
    expect(res.body.data[0]._id).toBeUndefined();
  });
});

describe('GET /api/menu/:id', () => {
  it('returns a single item', async () => {
    const { body } = await request(app).get('/api/menu');
    const res = await request(app).get(`/api/menu/${body.data[0].id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(body.data[0].id);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/menu/not-an-id');
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/menu/64b7f0f2a1b2c3d4e5f60718');
    expect(res.status).toBe(404);
  });
});

describe('misc', () => {
  it('health check works', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('unknown routes return a JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
