import prisma from '../db/prisma.js';
import { eachNight, formatDateOnly, isValidDateOnly, toDateOnly } from '../utils/dates.js';
import { generateConfirmationCode } from '../utils/confirmationCode.js';

const overlappingActiveFilter = (checkIn, checkOut) => ({
  status: { in: ['confirmed', 'checked_in'] },
  checkIn: { lt: toDateOnly(checkOut) },
  checkOut: { gt: toDateOnly(checkIn) },
});

export const findAvailableRooms = async (checkIn, checkOut) => {
  const rooms = await prisma.room.findMany({
    where: {
      bookings: {
        none: overlappingActiveFilter(checkIn, checkOut),
      },
    },
    orderBy: { pricePerNight: 'asc' },
  });

  const nights = eachNight(checkIn, checkOut).length;

  return rooms.map((room) => ({
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    description: room.description,
    pricePerNight: room.pricePerNight,
    totalPrice: room.pricePerNight * nights,
    nights,
  }));
};

export const isRoomAvailable = async (roomId, checkIn, checkOut) => {
  const conflict = await prisma.booking.findFirst({
    where: {
      roomId,
      ...overlappingActiveFilter(checkIn, checkOut),
    },
    select: { id: true },
  });

  return conflict === null;
};

const createUniqueConfirmationCode = async (tx) => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const confirmationCode = generateConfirmationCode();
    const existing = await tx.booking.findUnique({
      where: { confirmationCode },
      select: { id: true },
    });

    if (!existing) {
      return confirmationCode;
    }
  }

  throw new Error('Could not generate a unique confirmation code');
};

export const createBooking = async ({
  roomId,
  checkIn,
  checkOut,
  adults,
  children,
  infants,
  guestName,
  guestEmail,
}) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    const error = new Error('Room not found');
    error.statusCode = 404;
    error.code = 'ROOM_NOT_FOUND';
    throw error;
  }

  const occupancy = adults + children;

  if (occupancy > room.capacity) {
    const error = new Error(
      `This place has a maximum of ${room.capacity} guests, not including infants.`,
    );
    error.statusCode = 400;
    error.code = 'CAPACITY_EXCEEDED';
    throw error;
  }

  const available = await isRoomAvailable(roomId, checkIn, checkOut);

  if (!available) {
    const error = new Error('Room is not available for the selected dates');
    error.statusCode = 409;
    error.code = 'ROOM_UNAVAILABLE';
    throw error;
  }

  const nights = eachNight(checkIn, checkOut);
  const totalPrice = room.pricePerNight * nights.length;

  const booking = await prisma.$transaction(async (tx) => {
    const confirmationCode = await createUniqueConfirmationCode(tx);

    return tx.booking.create({
      data: {
        confirmationCode,
        roomId,
        checkIn: toDateOnly(checkIn),
        checkOut: toDateOnly(checkOut),
        adults,
        children,
        infants,
        pricePerNight: room.pricePerNight,
        totalPrice,
        guestName,
        guestEmail,
        status: 'confirmed',
        dinnerPlans: {
          create: nights.map((day) => ({
            day: toDateOnly(day),
            wantsDinner: false,
          })),
        },
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        dinnerPlans: {
          orderBy: { day: 'asc' },
        },
      },
    });
  });

  return serializeBooking(booking);
};

export const serializeBooking = (booking) => ({
  id: booking.id,
  confirmationCode: booking.confirmationCode,
  checkIn: formatDateOnly(booking.checkIn),
  checkOut: formatDateOnly(booking.checkOut),
  nights: eachNight(booking.checkIn, booking.checkOut).length,
  adults: booking.adults,
  children: booking.children,
  infants: booking.infants,
  pricePerNight: booking.pricePerNight,
  totalPrice: booking.totalPrice,
  guestName: booking.guestName,
  guestEmail: booking.guestEmail,
  status: booking.status,
  checkedInAt: booking.checkedInAt ? formatDateOnly(booking.checkedInAt) : null,
  checkedOutAt: booking.checkedOutAt ? formatDateOnly(booking.checkedOutAt) : null,
  room: booking.room
    ? {
        id: booking.room.id,
        name: booking.room.name,
        capacity: booking.room.capacity,
      }
    : undefined,
  dinnerPlans: (booking.dinnerPlans || []).map((plan) => ({
    day: formatDateOnly(plan.day),
    wantsDinner: plan.wantsDinner,
  })),
});

const bookingInclude = {
  room: {
    select: {
      id: true,
      name: true,
      capacity: true,
    },
  },
  dinnerPlans: {
    orderBy: { day: 'asc' },
  },
};

const normalizeConfirmationCode = (code) =>
  String(code || '')
    .trim()
    .toUpperCase();

const httpError = (statusCode, code, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const todayUtcDateOnly = () => {
  const now = new Date();
  return formatDateOnly(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
  );
};

export const getBookingByConfirmationCode = async (confirmationCode) => {
  const code = normalizeConfirmationCode(confirmationCode);

  const booking = await prisma.booking.findUnique({
    where: { confirmationCode: code },
    include: bookingInclude,
  });

  if (!booking) {
    throw httpError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  }

  return serializeBooking(booking);
};

export const cancelBooking = async (confirmationCode) => {
  const code = normalizeConfirmationCode(confirmationCode);

  const booking = await prisma.booking.findUnique({
    where: { confirmationCode: code },
  });

  if (!booking) {
    throw httpError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  }

  if (booking.status !== 'confirmed') {
    throw httpError(
      409,
      'CANCEL_NOT_ALLOWED',
      booking.status === 'cancelled'
        ? 'Booking is already cancelled'
        : 'Only confirmed bookings that have not checked in can be cancelled',
    );
  }

  const updated = await prisma.booking.update({
    where: { confirmationCode: code },
    data: { status: 'cancelled' },
    include: bookingInclude,
  });

  return serializeBooking(updated);
};

export const checkInBooking = async (confirmationCode, dateInput) => {
  const code = normalizeConfirmationCode(confirmationCode);
  const date = dateInput || todayUtcDateOnly();

  if (!isValidDateOnly(date)) {
    throw httpError(400, 'INVALID_DATE', 'checkedInAt must be YYYY-MM-DD');
  }

  const booking = await prisma.booking.findUnique({
    where: { confirmationCode: code },
  });

  if (!booking) {
    throw httpError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  }

  if (booking.status !== 'confirmed') {
    throw httpError(
      409,
      'CHECKIN_NOT_ALLOWED',
      booking.status === 'checked_in'
        ? 'Guest is already checked in'
        : 'Only confirmed bookings can be checked in',
    );
  }

  const updated = await prisma.booking.update({
    where: { confirmationCode: code },
    data: {
      status: 'checked_in',
      checkedInAt: toDateOnly(date),
      checkedOutAt: null,
    },
    include: bookingInclude,
  });

  return serializeBooking(updated);
};

export const checkOutBooking = async (confirmationCode, dateInput) => {
  const code = normalizeConfirmationCode(confirmationCode);
  const date = dateInput || todayUtcDateOnly();

  if (!isValidDateOnly(date)) {
    throw httpError(400, 'INVALID_DATE', 'checkedOutAt must be YYYY-MM-DD');
  }

  const booking = await prisma.booking.findUnique({
    where: { confirmationCode: code },
  });

  if (!booking) {
    throw httpError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  }

  if (booking.status !== 'checked_in') {
    throw httpError(
      409,
      'CHECKOUT_NOT_ALLOWED',
      booking.status === 'checked_out'
        ? 'Guest is already checked out'
        : 'Only checked-in bookings can be checked out',
    );
  }

  const checkedInAt = booking.checkedInAt
    ? formatDateOnly(booking.checkedInAt)
    : null;

  if (checkedInAt && date < checkedInAt) {
    throw httpError(
      400,
      'INVALID_CHECKOUT_DATE',
      'Checkout date cannot be before the check-in date',
    );
  }

  const updated = await prisma.booking.update({
    where: { confirmationCode: code },
    data: {
      status: 'checked_out',
      checkedOutAt: toDateOnly(date),
    },
    include: bookingInclude,
  });

  return serializeBooking(updated);
};

export const updateDinnerPlans = async (confirmationCode, dinners) => {
  const code = normalizeConfirmationCode(confirmationCode);

  const booking = await prisma.booking.findUnique({
    where: { confirmationCode: code },
    include: bookingInclude,
  });

  if (!booking) {
    throw httpError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  }

  if (booking.status === 'cancelled' || booking.status === 'checked_out') {
    throw httpError(
      409,
      'DINNERS_LOCKED',
      booking.status === 'cancelled'
        ? 'Cannot update dinners for a cancelled booking'
        : 'Cannot update dinners after checkout',
    );
  }

  if (!['confirmed', 'checked_in'].includes(booking.status)) {
    throw httpError(409, 'DINNERS_LOCKED', 'Cannot update dinners for this booking');
  }

  const today = todayUtcDateOnly();
  const checkOut = formatDateOnly(booking.checkOut);

  if (today >= checkOut) {
    throw httpError(
      409,
      'STAY_ENDED',
      'Cannot update dinners after the stay has ended',
    );
  }

  if (!Array.isArray(dinners) || dinners.length === 0) {
    throw httpError(
      400,
      'INVALID_DINNERS',
      'dinners must be a non-empty array of { day, wantsDinner }',
    );
  }

  const existingByDay = new Map(
    booking.dinnerPlans.map((plan) => [formatDateOnly(plan.day), plan]),
  );

  const updates = [];

  for (const item of dinners) {
    if (!item || !isValidDateOnly(item.day) || typeof item.wantsDinner !== 'boolean') {
      throw httpError(
        400,
        'INVALID_DINNERS',
        'Each dinner entry needs day (YYYY-MM-DD) and wantsDinner (boolean)',
      );
    }

    if (!existingByDay.has(item.day)) {
      throw httpError(
        400,
        'INVALID_DINNER_DAY',
        `Day ${item.day} is not part of this booking`,
      );
    }

    updates.push({ day: item.day, wantsDinner: item.wantsDinner });
  }

  await prisma.$transaction(
    updates.map((item) =>
      prisma.dinnerPlan.update({
        where: {
          bookingId_day: {
            bookingId: booking.id,
            day: toDateOnly(item.day),
          },
        },
        data: { wantsDinner: item.wantsDinner },
      }),
    ),
  );

  const refreshed = await prisma.booking.findUnique({
    where: { confirmationCode: code },
    include: bookingInclude,
  });

  return serializeBooking(refreshed);
};
