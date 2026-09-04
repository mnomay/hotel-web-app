import { Router } from 'express';
import prisma from '../db/prisma.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'hotel-web-app-backend',
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'hotel-web-app-backend',
      database: 'disconnected',
      message: error.message,
    });
  }
});

export default router;
