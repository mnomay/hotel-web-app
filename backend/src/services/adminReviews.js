import prisma from '../db/prisma.js';
import {
  addDays,
  formatDateOnly,
  isValidDateOnly,
  toDateOnly,
} from '../utils/dates.js';

/** Rating bands (half-stars 0.5–5):
 *  good: >= 4
 *  average: >= 2 and < 4
 *  bad: < 2
 */
const FILTERS = new Set(['latest', 'good', 'average', 'bad']);

const httpError = (statusCode, code, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const ratingWhereForFilter = (filter) => {
  if (filter === 'good') return { gte: 4 };
  if (filter === 'average') return { gte: 2, lt: 4 };
  if (filter === 'bad') return { lt: 2 };
  return undefined;
};

const orderByForFilter = (filter) => {
  if (filter === 'good') {
    return [{ rating: 'desc' }, { createdAt: 'desc' }];
  }
  if (filter === 'bad') {
    return [{ rating: 'asc' }, { createdAt: 'desc' }];
  }
  if (filter === 'average') {
    return [{ rating: 'desc' }, { createdAt: 'desc' }];
  }
  return [{ createdAt: 'desc' }];
};

const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;

export const getAdminReviews = async ({
  sort = 'latest',
  from,
  to,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
} = {}) => {
  // Accept legacy best/worst aliases
  let normalized = String(sort || 'latest').toLowerCase();
  if (normalized === 'best') normalized = 'good';
  if (normalized === 'worst') normalized = 'bad';

  if (!FILTERS.has(normalized)) {
    throw httpError(
      400,
      'INVALID_SORT',
      'sort must be latest, good, average, or bad',
    );
  }

  if (from && !isValidDateOnly(from)) {
    throw httpError(400, 'INVALID_DATES', 'from must be YYYY-MM-DD');
  }

  if (to && !isValidDateOnly(to)) {
    throw httpError(400, 'INVALID_DATES', 'to must be YYYY-MM-DD');
  }

  if (from && to && from > to) {
    throw httpError(400, 'INVALID_DATE_RANGE', 'from must be on or before to');
  }

  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(limit, 10) || DEFAULT_PAGE_SIZE),
  );

  const where = {};

  const rating = ratingWhereForFilter(normalized);
  if (rating) where.rating = rating;

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = toDateOnly(from);
    if (to) where.createdAt.lt = addDays(toDateOnly(to), 1);
  }

  const whereClause = Object.keys(where).length > 0 ? where : undefined;
  const total = await prisma.review.count({ where: whereClause });
  const totalPages = Math.max(1, Math.ceil(total / limitNum));
  const safePage = Math.min(pageNum, totalPages);
  const skip = (safePage - 1) * limitNum;

  const reviews = await prisma.review.findMany({
    where: whereClause,
    orderBy: orderByForFilter(normalized),
    skip,
    take: limitNum,
    include: {
      booking: {
        select: {
          confirmationCode: true,
          guestName: true,
          guestEmail: true,
          checkIn: true,
          checkOut: true,
          room: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    sort: normalized,
    from: from || null,
    to: to || null,
    page: safePage,
    limit: limitNum,
    total,
    totalPages,
    count: reviews.length,
    bands: {
      good: '4–5',
      average: '2–3.5',
      bad: '0.5–1.5',
    },
    reviews: reviews.map((review) => ({
      bookingId: review.bookingId,
      confirmationCode: review.booking.confirmationCode,
      rating: Number(review.rating),
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      guestName: review.booking.guestName,
      guestEmail: review.booking.guestEmail,
      checkIn: formatDateOnly(review.booking.checkIn),
      checkOut: formatDateOnly(review.booking.checkOut),
      room: review.booking.room,
    })),
  };
};
