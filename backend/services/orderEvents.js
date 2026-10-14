import { EventEmitter } from 'node:events';

// Tiny pub/sub used to push status changes to connected SSE clients.
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

const channel = (orderId) => `order:${orderId}`;

const publish = (order) => emitter.emit(channel(order.id), order.toJSON());

// Returns an unsubscribe function.
const subscribe = (orderId, listener) => {
  emitter.on(channel(orderId), listener);
  return () => emitter.off(channel(orderId), listener);
};

export { publish, subscribe };
