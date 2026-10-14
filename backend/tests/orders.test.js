import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import env from '../config/env.js';
import * as db from './helpers/db.js';
import MenuItem from '../models/MenuItem.js';

let pizza;
let burger;
let soldOut;

const customer = { name: 'Rahul Sharma', address: '221B MG Road, Bareilly', phone: '+91 98765-43210' };
const buildPayload = (overrides = {}) => ({
  customer,
  items: [
    { menuItemId: pizza.id, quantity: 2 },
    { menuItemId: burger.id, quantity: 1 },
  ],
  ...overrides,
});
const placeOrder = (payload = buildPayload()) => request(app).post('/api/orders').send(payload);

beforeAll(db.connect);
beforeEach(async () => {
  await db.seedMenu();
  const all = await MenuItem.find();
  pizza = all.find((i) => i.name === 'Test Pizza');
  burger = all.find((i) => i.name === 'Test Burger');
  soldOut = all.find((i) => i.name === 'Sold Out Fries');
});
afterEach(db.clear);
afterAll(db.close);

describe('POST /api/orders (create)', () => {
  it('creates an order with status RECEIVED and a server-calculated total', async () => {
    const res = await placeOrder();

    expect(res.status).toBe(201);
    const order = res.body.data;
    expect(order.status).toBe('RECEIVED');
    expect(order.totalAmount).toBe(2 * 250 + 150.5);
    expect(order.items).toHaveLength(2);
    expect(order.items[0]).toEqual(expect.objectContaining({ name: 'Test Pizza', price: 250, quantity: 2 }));
    expect(order.customer.phone).toBe('+919876543210'); // cleaned
    expect(order.statusHistory).toHaveLength(1);
  });

  it('ignores any price / total sent by the client', async () => {
    const res = await placeOrder({
      ...buildPayload(),
      totalAmount: 1,
      items: [{ menuItemId: pizza.id, quantity: 1, price: 1 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.data.totalAmount).toBe(250);
  });

  it('merges duplicate items into one line', async () => {
    const res = await placeOrder(
      buildPayload({
        items: [
          { menuItemId: pizza.id, quantity: 1 },
          { menuItemId: pizza.id, quantity: 2 },
        ],
      })
    );
    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(3);
  });

  it('returns 404 when a menu item does not exist', async () => {
    const res = await placeOrder(buildPayload({ items: [{ menuItemId: '64b7f0f2a1b2c3d4e5f60718', quantity: 1 }] }));
    expect(res.status).toBe(404);
  });

  it('returns 409 when a menu item is unavailable', async () => {
    const res = await placeOrder(buildPayload({ items: [{ menuItemId: soldOut.id, quantity: 1 }] }));
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/unavailable/i);
  });
});

describe('POST /api/orders (input validation)', () => {
  const invalidCases = [
    ['empty cart', () => buildPayload({ items: [] }), 'items'],
    ['missing items', () => ({ customer }), 'items'],
    ['missing customer', () => ({ items: [{ menuItemId: pizza.id, quantity: 1 }] }), 'customer'],
    ['short name', () => buildPayload({ customer: { ...customer, name: 'A' } }), 'customer.name'],
    ['short address', () => buildPayload({ customer: { ...customer, address: 'abc' } }), 'customer.address'],
    ['letters in phone', () => buildPayload({ customer: { ...customer, phone: 'abcdefghij' } }), 'customer.phone'],
    ['too short phone', () => buildPayload({ customer: { ...customer, phone: '12345' } }), 'customer.phone'],
    ['zero quantity', () => buildPayload({ items: [{ menuItemId: pizza.id, quantity: 0 }] }), 'items.0.quantity'],
    ['negative quantity', () => buildPayload({ items: [{ menuItemId: pizza.id, quantity: -2 }] }), 'items.0.quantity'],
    ['decimal quantity', () => buildPayload({ items: [{ menuItemId: pizza.id, quantity: 1.5 }] }), 'items.0.quantity'],
    ['string quantity', () => buildPayload({ items: [{ menuItemId: pizza.id, quantity: '2' }] }), 'items.0.quantity'],
    ['quantity above 20', () => buildPayload({ items: [{ menuItemId: pizza.id, quantity: 21 }] }), 'items.0.quantity'],
    ['bad menu item id', () => buildPayload({ items: [{ menuItemId: 'abc', quantity: 1 }] }), 'items.0.menuItemId'],
  ];

  it.each(invalidCases)('rejects %s with 400', async (_label, build, field) => {
    const res = await placeOrder(build());
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.map((e) => e.field)).toContain(field);
  });

  it('rejects merged quantity above the limit', async () => {
    const res = await placeOrder(
      buildPayload({
        items: [
          { menuItemId: pizza.id, quantity: 15 },
          { menuItemId: pizza.id, quantity: 15 },
        ],
      })
    );
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON', async () => {
    const res = await request(app).post('/api/orders').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/json/i);
  });
});

describe('GET /api/orders/:id (read)', () => {
  it('returns the order', async () => {
    const { body } = await placeOrder();
    const res = await request(app).get(`/api/orders/${body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(body.data.id);
    expect(res.body.data.status).toBe('RECEIVED');
  });

  it('returns 400 for a malformed id and 404 for an unknown one', async () => {
    expect((await request(app).get('/api/orders/123')).status).toBe(400);
    expect((await request(app).get('/api/orders/64b7f0f2a1b2c3d4e5f60718')).status).toBe(404);
  });
});

describe('GET /api/orders (list)', () => {
  it('lists orders, newest first, and filters by status', async () => {
    const first = await placeOrder();
    const second = await placeOrder();
    await request(app).patch(`/api/orders/${first.body.data.id}/status`).send({ status: 'PREPARING' });

    const all = await request(app).get('/api/orders');
    expect(all.body.count).toBe(2);
    expect(all.body.data[0].id).toBe(second.body.data.id);

    const preparing = await request(app).get('/api/orders?status=PREPARING');
    expect(preparing.body.count).toBe(1);

    expect((await request(app).get('/api/orders?status=WHATEVER')).status).toBe(400);
  });
});

describe('PATCH /api/orders/:id/status (update)', () => {
  it('walks an order through the whole lifecycle and records history', async () => {
    const { body } = await placeOrder();
    const id = body.data.id;

    for (const status of ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']) {
      const res = await request(app).patch(`/api/orders/${id}/status`).send({ status });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(status);
    }

    const final = await request(app).get(`/api/orders/${id}`);
    expect(final.body.data.statusHistory.map((h) => h.status)).toEqual([
      'RECEIVED',
      'PREPARING',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ]);
  });

  it('rejects skipping a step (409) and unknown statuses (400)', async () => {
    const { body } = await placeOrder();
    const skip = await request(app).patch(`/api/orders/${body.data.id}/status`).send({ status: 'DELIVERED' });
    expect(skip.status).toBe(409);

    const unknown = await request(app).patch(`/api/orders/${body.data.id}/status`).send({ status: 'FLYING' });
    expect(unknown.status).toBe(400);
  });

  it('cannot go backwards', async () => {
    const { body } = await placeOrder();
    await request(app).patch(`/api/orders/${body.data.id}/status`).send({ status: 'PREPARING' });
    const back = await request(app).patch(`/api/orders/${body.data.id}/status`).send({ status: 'RECEIVED' });
    expect(back.status).toBe(409);
  });

  it('returns 404 for an unknown order', async () => {
    const res = await request(app).patch('/api/orders/64b7f0f2a1b2c3d4e5f60718/status').send({ status: 'PREPARING' });
    expect(res.status).toBe(404);
  });

  describe('with ADMIN_API_KEY enabled', () => {
    afterEach(() => {
      env.adminApiKey = '';
    });

    it('requires the x-admin-key header', async () => {
      const { body } = await placeOrder();
      env.adminApiKey = 'secret';

      const denied = await request(app).patch(`/api/orders/${body.data.id}/status`).send({ status: 'PREPARING' });
      expect(denied.status).toBe(401);

      const allowed = await request(app)
        .patch(`/api/orders/${body.data.id}/status`)
        .set('x-admin-key', 'secret')
        .send({ status: 'PREPARING' });
      expect(allowed.status).toBe(200);

      expect((await request(app).get('/api/orders')).status).toBe(401);
    });
  });
});

describe('DELETE /api/orders/:id (cancel)', () => {
  it('cancels an order that is still RECEIVED', async () => {
    const { body } = await placeOrder();
    const res = await request(app).delete(`/api/orders/${body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('refuses to cancel once the kitchen started', async () => {
    const { body } = await placeOrder();
    await request(app).patch(`/api/orders/${body.data.id}/status`).send({ status: 'PREPARING' });
    const res = await request(app).delete(`/api/orders/${body.data.id}`);
    expect(res.status).toBe(409);
  });

  it('a cancelled order cannot be moved forward', async () => {
    const { body } = await placeOrder();
    await request(app).delete(`/api/orders/${body.data.id}`);
    const res = await request(app).patch(`/api/orders/${body.data.id}/status`).send({ status: 'PREPARING' });
    expect(res.status).toBe(409);
  });
});
