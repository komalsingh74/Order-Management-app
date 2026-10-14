import { Router } from 'express';
import menuRoutes from './menuRoutes.js';
import orderRoutes from './orderRoutes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);

export default router;
