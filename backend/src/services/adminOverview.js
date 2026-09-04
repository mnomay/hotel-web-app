import prisma from '../db/prisma.js';
import {
  addDays,
  eachNight,
  formatDateOnly,
  isValidDateOnly,
  toDateOnly,
} from '../utils/dates.js';

const MAX_RANGE_DAYS = 62;

const todayUtcDateOnly = () => {
  const now = new Date();
  return formatDateOnly(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
  );
};

const serializeOverviewBooking = (booking, from, toExclusive) => {
  const checkIn = formatDateOnly(booking.checkIn);
  const checkOut = formatDateOnly(booking.checkOut);
  const visibleStart = checkIn < from ? from : checkIn;
  const visibleEndExclusive =
    checkOut > toExclusive ? toExclusive : checkOut;

  if (visibleStart >= visibleEndExclusive) {
    return null;
  }

  const startIndex = eachNight(from, visibleStart).length;
  const span = eachNight(visibleStart, visibleEndExclusive).length;

  return {
    id: booking.id,
    confirmationCode: booking.confirmationCode,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    status: booking.status,
    checkIn,
    checkOut,
    adults: booking.adults,
    children: booking.children,
    infants: booking.infants,
    totalPrice: booking.totalPrice,
    startIndex,
    span,
    clipsLeft: checkIn < from,
    clipsRight: checkOut > toExclusive,
  };
};

export const getAdminOverview = async (fromInput, toInput) => {
  const from = fromInput || todayUtcDateOnly();
  const to = toInput || formatDateOnly(addDays(toDateOnly(from), 13));

  if (!isValidDateOnly(from) || !isValidDateOnly(to)) {
    const error = new Error('from and to must be YYYY-MM-DD');
    error.statusCode = 400;
    error.code = 'INVALID_DATES';
    throw error;
  }

  if (from > to) {
    const error = new Error('from must be on or before to');
    error.statusCode = 400;
    error.code = 'INVALID_DATE_RANGE';
    throw error;
  }

  const days = eachNight(from, formatDateOnly(addDays(toDateOnly(to), 1)));

  if (days.length > MAX_RANGE_DAYS) {
    const error = new Error(`Date range cannot exceed ${MAX_RANGE_DAYS} days`);
    error.statusCode = 400;
    error.code = 'RANGE_TOO_LARGE';
    throw error;
  }

  const toExclusive = formatDateOnly(addDays(toDateOnly(to), 1));

  const rooms = await prisma.room.findMany({
    orderBy: { name: 'asc' },
    include: {
      bookings: {
        where: {
          checkIn: { lt: toDateOnly(toExclusive) },
          checkOut: { gt: toDateOnly(from) },
        },
        orderBy: { checkIn: 'asc' },
      },
    },
  });

  return {
    from,
    to,
    days,
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      bookings: room.bookings
        .map((booking) => serializeOverviewBooking(booking, from, toExclusive))
        .filter(Boolean),
    })),
  };
};
