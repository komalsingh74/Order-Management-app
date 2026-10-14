import MenuItem from '../models/MenuItem.js';
import menuData from './menuData.js';

// Called on every server start; does nothing if the menu already exists.
const seedMenuIfEmpty = async () => {
  const count = await MenuItem.estimatedDocumentCount();
  if (count > 0) {
    await MenuItem.bulkWrite(
      menuData.map(({ name, image }) => ({
        updateOne: { filter: { name }, update: { $set: { image } } },
      }))
    );
    return 0;
  }
  const created = await MenuItem.insertMany(menuData);
  console.log(`Seeded ${created.length} menu items`);
  return created.length;
};

// Wipes and re-inserts the menu (used by `npm run seed`).
const resetMenu = async () => {
  await MenuItem.deleteMany({});
  const created = await MenuItem.insertMany(menuData);
  return created.length;
};

export { seedMenuIfEmpty, resetMenu };
