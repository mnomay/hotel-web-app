import prisma from '../db/prisma.js';
import { formatDateOnly } from '../utils/dates.js';

const httpError = (statusCode, code, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const normalizeConfirmationCode = (code) =>
  String(code || '')
    .trim()
    .toUpperCase();

const todayUtcDateOnly = () => {
  const now = new Date();
  return formatDateOnly(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
  );
};

export const createReview = async ({ confirmationCode, rating, comment }) => {
  const code = normalizeConfirmationCode(confirmationCode);
  const numericRating = Number(rating);

  if (!code) {
    throw httpError(400, 'INVALID_CODE', 'confirmationCode is required');
  }

  if (
    Number.isNaN(numericRating) ||
    numericRating < 0.5 ||
    numericRating > 5 ||
    Math.round(numericRating * 2) !== numericRating * 2
  ) {
    throw httpError(
      400,
      'INVALID_RATING',
      'rating must be between 0.5 and 5 in half-star steps',
    );
  }

  if (typeof comment !== 'string' || comment.trim().length < 3) {
    throw httpError(
      400,
      'INVALID_COMMENT',
      'comment must be at least 3 characters',
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { confirmationCode: code },
    include: { review: true, room: { select: { id: true, name: true } } },
  });

  if (!booking) {
    throw httpError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  }

  if (booking.status === 'cancelled') {
    throw httpError(
      409,
      'BOOKING_CANCELLED',
      'Cannot review a cancelled booking',
    );
  }

  const today = todayUtcDateOnly();
  const checkOut = formatDateOnly(booking.checkOut);

  if (today < checkOut) {
    throw httpError(
      409,
      'STAY_NOT_ENDED',
      'A review can only be added after the last day of the booking',
    );
  }

  if (booking.review) {
    throw httpError(
      409,
      'REVIEW_EXISTS',
      'A review has already been added for this booking',
    );
  }

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      rating: numericRating,
      comment: comment.trim(),
    },
  });

  return {
    bookingId: review.bookingId,
    confirmationCode: booking.confirmationCode,
    rating: Number(review.rating),
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    room: booking.room,
  };
};
