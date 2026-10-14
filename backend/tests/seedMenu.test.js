import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import MenuItem from '../models/MenuItem.js';
import { seedMenuIfEmpty } from '../seed/seedMenu.js';
import * as db from './helpers/db.js';

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

describe('menu image seeding', () => {
  it('refreshes existing menu image URLs without changing prices', async () => {
    await MenuItem.create({
      name: 'Margherita Pizza',
      category: 'Pizza',
      price: 300,
      image: '/menu/margherita-pizza.svg',
      description: 'Existing menu item.',
    });

    await seedMenuIfEmpty();

    const item = await MenuItem.findOne({ name: 'Margherita Pizza' });
    expect(item.image).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(item.price).toBe(300);
  });
});
