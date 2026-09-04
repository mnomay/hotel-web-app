import { Router } from 'express';
import { createBooking } from '../services/bookings.js';
import { isValidDateOnly, toDateOnly } from '../utils/dates.js';

const router = Router();

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isNonNegativeInt = (value) =>
  Number.isInteger(value) && value >= 0;

router.post('/', async (req, res) => {
  try {
    const {
      roomId,
      checkIn,
      checkOut,
      adults,
      children = 0,
      infants = 0,
      guestName,
      guestEmail,
    } = req.body ?? {};

    if (!isNonEmptyString(roomId)) {
      return res.status(400).json({
        message: 'roomId is required',
        code: 'INVALID_ROOM',
      });
    }

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

    if (!Number.isInteger(adults) || adults < 1) {
      return res.status(400).json({
        message: 'adults must be an integer of at least 1',
        code: 'INVALID_GUESTS',
      });
    }

    if (!isNonNegativeInt(children) || !isNonNegativeInt(infants)) {
      return res.status(400).json({
        message: 'children and infants must be non-negative integers',
        code: 'INVALID_GUESTS',
      });
    }

    if (adults + children < 1) {
      return res.status(400).json({
        message: 'At least one adult or child is required',
        code: 'INVALID_GUESTS',
      });
    }

    if (!isNonEmptyString(guestName) || !isNonEmptyString(guestEmail)) {
      return res.status(400).json({
        message: 'guestName and guestEmail are required',
        code: 'INVALID_GUEST_CONTACT',
      });
    }

    const email = guestEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: 'guestEmail must be a valid email address',
        code: 'INVALID_EMAIL',
      });
    }

    const booking = await createBooking({
      roomId: roomId.trim(),
      checkIn,
      checkOut,
      adults,
      children,
      infants,
      guestName: guestName.trim(),
      guestEmail: email,
    });

    return res.status(201).json(booking);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code,
      });
    }

    console.error(error);
    return res.status(500).json({ message: 'Failed to create booking' });
  }
});

export default router;
