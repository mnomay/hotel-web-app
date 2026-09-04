import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getAdminOverview } from '../services/adminOverview.js';
import { getAdminDinnerSchedule } from '../services/adminDinners.js';
import { getAdminReviews } from '../services/adminReviews.js';
import {
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  getBookingByConfirmationCode,
} from '../services/bookings.js';

const router = Router();

router.use(requireAdmin);

const sendServiceError = (res, error, fallbackMessage) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
    });
  }
  console.error(error);
  return res.status(500).json({ message: fallbackMessage });
};

router.get('/overview', async (req, res) => {
  try {
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;
    const overview = await getAdminOverview(from, to);
    return res.json(overview);
  } catch (error) {
    return sendServiceError(res, error, 'Failed to load overview');
  }
});

router.get('/dinners', async (_req, res) => {
  try {
    const schedule = await getAdminDinnerSchedule();
    return res.json(schedule);
  } catch (error) {
    return sendServiceError(res, error, 'Failed to load dinner schedule');
  }
});

router.get('/reviews', async (req, res) => {
  try {
    const sort = req.query.sort ? String(req.query.sort) : 'latest';
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;
    const page = req.query.page ? String(req.query.page) : '1';
    const limit = req.query.limit ? String(req.query.limit) : '5';
    const reviews = await getAdminReviews({ sort, from, to, page, limit });
    return res.json(reviews);
  } catch (error) {
    return sendServiceError(res, error, 'Failed to load reviews');
  }
});

router.get('/bookings/:confirmationCode', async (req, res) => {
  try {
    const booking = await getBookingByConfirmationCode(req.params.confirmationCode);
    return res.json(booking);
  } catch (error) {
    return sendServiceError(res, error, 'Failed to load booking');
  }
});

router.post('/bookings/:confirmationCode/cancel', async (req, res) => {
  try {
    const booking = await cancelBooking(req.params.confirmationCode);
    return res.json(booking);
  } catch (error) {
    return sendServiceError(res, error, 'Failed to cancel booking');
  }
});

router.post('/bookings/:confirmationCode/check-in', async (req, res) => {
  try {
    const date = req.body?.date ? String(req.body.date) : undefined;
    const booking = await checkInBooking(req.params.confirmationCode, date);
    return res.json(booking);
  } catch (error) {
    return sendServiceError(res, error, 'Failed to check in booking');
  }
});

router.post('/bookings/:confirmationCode/check-out', async (req, res) => {
  try {
    const date = req.body?.date ? String(req.body.date) : undefined;
    const booking = await checkOutBooking(req.params.confirmationCode, date);
    return res.json(booking);
  } catch (error) {
    return sendServiceError(res, error, 'Failed to check out booking');
  }
});

export default router;
