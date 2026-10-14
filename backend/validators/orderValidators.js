import { z } from 'zod';
import { ORDER_STATUS } from '../utils/orderStatus.js';

const MAX_QTY_PER_ITEM = 20;

const objectId = z
  .string({ required_error: 'Menu item id is required' })
  .regex(/^[a-f\d]{24}$/i, 'Invalid menu item id')
  .transform((value) => value.toLowerCase());

// Accepts "+91 98765-43210" style input, stores digits (and a leading +) only.
const phone = z
  .string({ required_error: 'Phone number is required' })
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\+?\d{10,15}$/, 'Phone must contain 10 to 15 digits'));

const customerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters'),
  address: z
    .string({ required_error: 'Address is required' })
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must be at most 200 characters'),
  phone,
});

const orderItemSchema = z.object({
  menuItemId: objectId,
  quantity: z
    .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(MAX_QTY_PER_ITEM, `Quantity cannot exceed ${MAX_QTY_PER_ITEM}`),
});

const createOrderSchema = z.object({
  customer: customerSchema,
  items: z
    .array(orderItemSchema, { required_error: 'Items are required' })
    .min(1, 'Cart cannot be empty')
    .max(20, 'Too many different items in one order'),
});

const updateStatusSchema = z.object({
  status: z.enum(Object.values(ORDER_STATUS), {
    errorMap: () => ({ message: `Status must be one of: ${Object.values(ORDER_STATUS).join(', ')}` }),
  }),
});

export { createOrderSchema, updateStatusSchema, MAX_QTY_PER_ITEM };
