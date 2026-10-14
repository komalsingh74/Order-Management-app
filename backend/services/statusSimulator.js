import env from '../config/env.js';
import { nextStatus } from '../utils/orderStatus.js';
import * as orderService from './orderService.js';

// orderId -> pending timeout. Lets us cancel the simulation for an order.
const timers = new Map();

const scheduleNext = (orderId) => {
  const timer = setTimeout(async () => {
    timers.delete(orderId);
    try {
      const order = await orderService.getOrderById(orderId);
      const next = nextStatus(order.status); // null for DELIVERED / CANCELLED
      if (!next) return;
      await orderService.updateStatus(orderId, next);
      scheduleNext(orderId);
    } catch (err) {
      console.error(`Status simulation stopped for order ${orderId}: ${err.message}`);
    }
  }, env.statusStepMs);

  if (typeof timer.unref === 'function') timer.unref(); // never keep the process alive
  timers.set(orderId, timer);
};

const stop = (orderId) => {
  clearTimeout(timers.get(orderId));
  timers.delete(orderId);
};

const stopAll = () => [...timers.keys()].forEach(stop);

/** Starts "kitchen -> rider -> doorstep" progression for an order. */
const start = (orderId) => {
  if (!env.simulateStatus) return;
  stop(orderId);
  scheduleNext(orderId);
};

export default { start, stop, stopAll };
