import MenuItem from '../models/MenuItem.js';
import AppError from '../utils/AppError.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;

const listMenu = () => MenuItem.find({ isAvailable: true }).sort({ category: 1, name: 1 });

const getMenuItem = async (id) => {
  if (!OBJECT_ID.test(id)) throw new AppError('Invalid menu item id', 400);
  const item = await MenuItem.findById(id);
  if (!item) throw new AppError('Menu item not found', 404);
  return item;
};

export { listMenu, getMenuItem };
