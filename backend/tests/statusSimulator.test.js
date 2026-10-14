import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import env from '../config/env.js';
import * as db from './helpers/db.js';
import MenuItem from '../models/MenuItem.js';
import * as orderService from '../services/orderService.js';
import statusSimulator from '../services/statusSimulator.js';

const customer = { name: 'Rahul Sharma', address: '221B MG Road, Bareilly', phone: '9876543210' };
const waitFor = async (check, timeout = 3000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, 20));
  }
  return false;
};

let item;
beforeAll(async () => {
  await db.connect();
  env.simulateStatus = true;
  env.statusStepMs = 30;
});
beforeEach(async () => {
  [item] = await MenuItem.insertMany([{ name: 'Sim Pizza', description: 'x', price: 100, image: '/a.svg' }]);
});
afterEach(async () => {
  statusSimulator.stopAll();
  await db.clear();
});
afterAll(async () => {
  env.simulateStatus = false;
  await db.close();
});

describe('status simulator', () => {
  it('moves an order RECEIVED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED by itself', async () => {
    const order = await orderService.createOrder({ customer, items: [{ menuItemId: item.id, quantity: 1 }] });
    statusSimulator.start(order.id);

    const delivered = await waitFor(async () => (await orderService.getOrderById(order.id)).status === 'DELIVERED');
    expect(delivered).toBe(true);

    const final = await orderService.getOrderById(order.id);
    expect(final.statusHistory.map((h) => h.status)).toEqual([
      'RECEIVED',
      'PREPARING',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ]);
  });

  it('stops when the order is cancelled', async () => {
    const order = await orderService.createOrder({ customer, items: [{ menuItemId: item.id, quantity: 1 }] });
    statusSimulator.start(order.id);
    await orderService.cancelOrder(order.id);
    statusSimulator.stop(order.id);

    await new Promise((r) => setTimeout(r, 120));
    expect((await orderService.getOrderById(order.id)).status).toBe('CANCELLED');
  });
});
