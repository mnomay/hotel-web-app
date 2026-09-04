import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getAdminOverview } from '../services/adminOverview.js';
import { getBookingByConfirmationCode } from '../services/bookings.js';

const router = Router();

router.use(requireAdmin);

router.get('/overview', async (req, res) => {
  try {
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;
    const overview = await getAdminOverview(from, to);
    return res.json(overview);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code,
      });
    }
    console.error(error);
    return res.status(500).json({ message: 'Failed to load overview' });
  }
});

router.get('/bookings/:confirmationCode', async (req, res) => {
  try {
    const booking = await getBookingByConfirmationCode(req.params.confirmationCode);
    return res.json(booking);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code,
      });
    }
    console.error(error);
    return res.status(500).json({ message: 'Failed to load booking' });
  }
});

export default router;
