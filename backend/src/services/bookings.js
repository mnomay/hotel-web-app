import prisma from '../db/prisma.js';
import { eachNight, formatDateOnly, toDateOnly } from '../utils/dates.js';
import { generateConfirmationCode } from '../utils/confirmationCode.js';

const overlappingConfirmedFilter = (checkIn, checkOut) => ({
  status: 'confirmed',
  checkIn: { lt: toDateOnly(checkOut) },
  checkOut: { gt: toDateOnly(checkIn) },
});

export const findAvailableRooms = async (checkIn, checkOut) => {
  const rooms = await prisma.room.findMany({
    where: {
      bookings: {
        none: overlappingConfirmedFilter(checkIn, checkOut),
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
      ...overlappingConfirmedFilter(checkIn, checkOut),
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
