import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import AppError from '../utils/AppError.js';
import { ORDER_STATUS, canTransition } from '../utils/orderStatus.js';
import { MAX_QTY_PER_ITEM } from '../validators/orderValidators.js';
import * as orderEvents from './orderEvents.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;
const round2 = (n) => Math.round(n * 100) / 100;

const assertValidId = (id) => {
  if (!OBJECT_ID.test(id)) throw new AppError('Invalid order id', 400);
};

// Same item added twice -> one line with summed quantity.
const mergeDuplicates = (items) => {
  const quantities = new Map();
  items.forEach(({ menuItemId, quantity }) => {
    quantities.set(menuItemId, (quantities.get(menuItemId) || 0) + quantity);
  });
  return [...quantities].map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
};

/**
 * Prices ALWAYS come from the database, never from the client.
 */
const createOrder = async ({ customer, items }) => {
  const merged = mergeDuplicates(items);
  const menuItems = await MenuItem.find({ _id: { $in: merged.map((i) => i.menuItemId) } });
  const byId = new Map(menuItems.map((item) => [item.id, item]));

  const orderItems = merged.map(({ menuItemId, quantity }) => {
    const menuItem = byId.get(menuItemId);
    if (!menuItem) throw new AppError(`Menu item not found: ${menuItemId}`, 404);
    if (!menuItem.isAvailable) throw new AppError(`"${menuItem.name}" is currently unavailable`, 409);
    if (quantity > MAX_QTY_PER_ITEM) {
      throw new AppError(`Quantity for "${menuItem.name}" cannot exceed ${MAX_QTY_PER_ITEM}`, 400);
    }
    return { menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity };
  });

  const totalAmount = round2(orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0));

  return Order.create({
    customer,
    items: orderItems,
    totalAmount,
    status: ORDER_STATUS.RECEIVED,
    statusHistory: [{ status: ORDER_STATUS.RECEIVED }],
  });
};

const getOrderById = async (id) => {
  assertValidId(id);
  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found', 404);
  return order;
};

const listOrders = ({ status, limit = 50 } = {}) => {
  const filter = status ? { status } : {};
  return Order.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit);
};

/**
 * Moves an order to a new status following the state machine.
 * The update is conditional on the current status, so two requests racing
 * (e.g. simulator + admin) can never both win.
 */
const updateStatus = async (id, newStatus) => {
  const order = await getOrderById(id);

  if (!canTransition(order.status, newStatus)) {
    throw new AppError(`Cannot change status from ${order.status} to ${newStatus}`, 409);
  }

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: { status: newStatus }, $push: { statusHistory: { status: newStatus, at: new Date() } } },
    { new: true }
  );
  if (!updated) throw new AppError('Order was updated by another request. Please retry.', 409);

  orderEvents.publish(updated);
  return updated;
};

// Customers may cancel only before the kitchen starts.
const cancelOrder = async (id) => {
  const order = await getOrderById(id);
  if (order.status !== ORDER_STATUS.RECEIVED) {
    throw new AppError('Only orders that are still in "Order Received" can be cancelled', 409);
  }
  return updateStatus(id, ORDER_STATUS.CANCELLED);
};

export { createOrder, getOrderById, listOrders, updateStatus, cancelOrder };
