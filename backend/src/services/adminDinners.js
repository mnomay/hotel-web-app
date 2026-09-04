import prisma from '../db/prisma.js';
import { addDays, formatDateOnly, toDateOnly } from '../utils/dates.js';

const todayUtcDateOnly = () => {
  const now = new Date();
  return formatDateOnly(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
  );
};

const guestCountForDinner = (booking) =>
  Number(booking.adults || 0) + Number(booking.children || 0);

const buildDaySummary = (date, plans) => {
  const bookings = plans
    .filter((plan) => formatDateOnly(plan.day) === date)
    .map((plan) => {
      const guests = guestCountForDinner(plan.booking);
      return {
        confirmationCode: plan.booking.confirmationCode,
        guestName: plan.booking.guestName,
        roomName: plan.booking.room?.name,
        guests,
        adults: plan.booking.adults,
        children: plan.booking.children,
        infants: plan.booking.infants,
      };
    })
    .sort((a, b) => a.guestName.localeCompare(b.guestName));

  return {
    date,
    guestCount: bookings.reduce((sum, item) => sum + item.guests, 0),
    bookingCount: bookings.length,
    bookings,
  };
};

/** Dinner headcount = adults + children on active bookings with wantsDinner that day. */
export const getAdminDinnerSchedule = async () => {
  const today = todayUtcDateOnly();
  const tomorrow = formatDateOnly(addDays(toDateOnly(today), 1));

  const plans = await prisma.dinnerPlan.findMany({
    where: {
      wantsDinner: true,
      day: {
        in: [toDateOnly(today), toDateOnly(tomorrow)],
      },
      booking: {
        status: { in: ['confirmed', 'checked_in'] },
      },
    },
    include: {
      booking: {
        select: {
          confirmationCode: true,
          guestName: true,
          adults: true,
          children: true,
          infants: true,
          room: {
            select: { name: true },
          },
        },
      },
    },
  });

  return {
    today: buildDaySummary(today, plans),
    tomorrow: buildDaySummary(tomorrow, plans),
  };
};
