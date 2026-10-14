import * as orderService from '../services/orderService.js';
import * as orderEvents from '../services/orderEvents.js';
import statusSimulator from '../services/statusSimulator.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { ORDER_STATUS, isFinalStatus } from '../utils/orderStatus.js';

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body);
  statusSimulator.start(order.id);
  res.status(201).json({ success: true, data: order });
});

const listOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  if (status && !Object.values(ORDER_STATUS).includes(status)) {
    throw new AppError('Invalid status filter', 400);
  }
  const orders = await orderService.listOrders({ status });
  res.json({ success: true, count: orders.length, data: orders });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  res.json({ success: true, data: order });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, req.body.status);
  if (isFinalStatus(order.status)) statusSimulator.stop(order.id);
  res.json({ success: true, data: order });
});

// DELETE = cancel (we keep the record for history instead of erasing it).
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id);
  statusSimulator.stop(order.id);
  res.json({ success: true, data: order });
});

/**
 * Server-Sent Events: pushes every status change of one order to the browser.
 * Event name: "status", data: the full order JSON.
 */
const streamOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // stop nginx/Render proxies from buffering
  });

  const send = (data) => res.write(`event: status\ndata: ${JSON.stringify(data)}\n\n`);
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  let unsubscribe = () => {};
  const cleanup = () => {
    clearInterval(heartbeat);
    unsubscribe();
  };

  send(order.toJSON());
  if (isFinalStatus(order.status)) {
    cleanup();
    return res.end();
  }

  unsubscribe = orderEvents.subscribe(order.id, (updated) => {
    send(updated);
    if (isFinalStatus(updated.status)) {
      cleanup();
      res.end();
    }
  });
  req.on('close', cleanup);
  return undefined;
});

export { createOrder, listOrders, getOrder, updateOrderStatus, cancelOrder, streamOrderStatus };
