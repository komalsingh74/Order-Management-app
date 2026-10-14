import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import env from '../config/env.js';
import validate from '../middleware/validate.js';
import adminAuth from '../middleware/adminAuth.js';
import { createOrderSchema, updateStatusSchema } from '../validators/orderValidators.js';
import * as controller from '../controllers/orderController.js';

const router = Router();

// Anti-spam: max 30 orders / 15 min per IP (disabled in tests).
const createOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'test',
  message: { success: false, message: 'Too many orders from this IP. Try again later.' },
});

router.post('/', createOrderLimiter, validate(createOrderSchema), controller.createOrder);
router.get('/', adminAuth, controller.listOrders);
router.get('/:id', controller.getOrder);
router.get('/:id/stream', controller.streamOrderStatus);
router.patch('/:id/status', adminAuth, validate(updateStatusSchema), controller.updateOrderStatus);
router.delete('/:id', controller.cancelOrder);

export default router;
