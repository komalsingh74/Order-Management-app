import * as menuService from '../services/menuService.js';
import asyncHandler from '../utils/asyncHandler.js';

const getMenu = asyncHandler(async (_req, res) => {
  const items = await menuService.listMenu();
  res.json({ success: true, count: items.length, data: items });
});

const getMenuItem = asyncHandler(async (req, res) => {
  const item = await menuService.getMenuItem(req.params.id);
  res.json({ success: true, data: item });
});

export { getMenu, getMenuItem };
