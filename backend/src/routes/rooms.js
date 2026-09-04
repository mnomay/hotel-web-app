import { Router } from 'express';
import { findAvailableRooms } from '../services/bookings.js';
import { isValidDateOnly, nightCount, toDateOnly } from '../utils/dates.js';

const router = Router();

router.get('/availability', async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;

    if (!isValidDateOnly(checkIn) || !isValidDateOnly(checkOut)) {
      return res.status(400).json({
        message: 'checkIn and checkOut are required as YYYY-MM-DD',
        code: 'INVALID_DATES',
      });
    }

    if (toDateOnly(checkOut) <= toDateOnly(checkIn)) {
      return res.status(400).json({
        message: 'checkOut must be after checkIn',
        code: 'INVALID_DATE_RANGE',
      });
    }

    const rooms = await findAvailableRooms(checkIn, checkOut);

    return res.json({
      checkIn,
      checkOut,
      nights: nightCount(checkIn, checkOut),
      rooms,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to load availability' });
  }
});

export default router;
