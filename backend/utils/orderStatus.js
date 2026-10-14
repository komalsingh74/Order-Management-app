const ORDER_STATUS = Object.freeze({
  RECEIVED: 'RECEIVED',
  PREPARING: 'PREPARING',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
});

// Happy path, in order.
const STATUS_FLOW = [
  ORDER_STATUS.RECEIVED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
];

// State machine: which status can move to which.
const ALLOWED_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.RECEIVED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.OUT_FOR_DELIVERY],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
});

const canTransition = (from, to) => (ALLOWED_TRANSITIONS[from] || []).includes(to);

const nextStatus = (current) => {
  const index = STATUS_FLOW.indexOf(current);
  return index >= 0 && index < STATUS_FLOW.length - 1 ? STATUS_FLOW[index + 1] : null;
};

const isFinalStatus = (status) =>
  status === ORDER_STATUS.DELIVERED || status === ORDER_STATUS.CANCELLED;

export { ORDER_STATUS, STATUS_FLOW, canTransition, nextStatus, isFinalStatus };
