import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const formatDate = (date) => date.toISOString().slice(0, 10);

const addDays = (date, days) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const toDateOnly = (yyyyMmDd) => new Date(`${yyyyMmDd}T00:00:00.000Z`);

const eachNight = (checkIn, checkOut) => {
  const nights = [];
  let cursor = new Date(`${checkIn}T00:00:00.000Z`);
  const end = new Date(`${checkOut}T00:00:00.000Z`);

  while (cursor < end) {
    nights.push(formatDate(cursor));
    cursor = addDays(cursor, 1);
  }

  return nights;
};

/** Mark selected nights for dinner; others default false. */
const dinnerMap = (nights, yesNights = []) => {
  const yes = new Set(yesNights);
  return Object.fromEntries(nights.map((night) => [night, yes.has(night)]));
};

async function main() {
  // Anchor seed calendar to 2026-09-04 so demo stays line up with “through Sept 10”
  // regardless of when seed is re-run.
  const today = toDateOnly('2026-09-04');
  const d = (offset) => formatDate(addDays(today, offset));

  await prisma.review.deleteMany();
  await prisma.dinnerPlan.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.adminUser.deleteMany();

  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        name: 'Garden Room',
        capacity: 2,
        pricePerNight: 8900,
        description:
          'Quiet ground-floor room with a private terrace overlooking the garden.',
      },
    }),
    prisma.room.create({
      data: {
        name: 'Courtyard Suite',
        capacity: 2,
        pricePerNight: 12000,
        description:
          'Light-filled suite with a sitting nook and courtyard views.',
      },
    }),
    prisma.room.create({
      data: {
        name: 'Rooftop Loft',
        capacity: 2,
        pricePerNight: 15000,
        description:
          'Top-floor loft with skylight, desk space, and city skyline outlook.',
      },
    }),
  ]);

  const roomsByName = Object.fromEntries(rooms.map((room) => [room.name, room]));
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.adminUser.create({
    data: { email: 'admin@hotel.local', passwordHash },
  });

  /*
   * Occupancy from today (2026-09-04) through ~Sept 10:
   * at most ONE room active so ≥2 rooms stay free for booking tests.
   *
   *   Courtyard  Sep 3 → 6   checked_in  (covers today + dinner today/tomorrow)
   *   Garden     Sep 6 → 8   confirmed
   *   Rooftop    Sep 8 → 11  confirmed  (nights through Sept 10)
   *
   * Past stays: checked_out history + good / average / bad reviews.
   * HTL-DONE01: checked_out, no review (smoke: leave a review).
   * HTL-CANC01: cancelled (does not block availability).
   */

  const bookings = [
    // —— Past history + reviews (all rooms, all rating bands) ——
    {
      confirmationCode: 'HTL-GOOD01',
      room: roomsByName['Garden Room'],
      checkIn: d(-28),
      checkOut: d(-25),
      adults: 2,
      children: 0,
      infants: 0,
      guestName: 'Alex Rivera',
      guestEmail: 'alex.rivera@example.com',
      status: 'checked_out',
      checkedInAt: d(-28),
      checkedOutAt: d(-25),
      dinnerYes: [d(-28), d(-27)],
      review: {
        rating: 5,
        comment: 'Beautiful stay — quiet garden and excellent service.',
        createdAt: toDateOnly(d(-24)),
      },
    },
    {
      confirmationCode: 'HTL-GOOD02',
      room: roomsByName['Courtyard Suite'],
      checkIn: d(-24),
      checkOut: d(-21),
      adults: 2,
      children: 1,
      infants: 0,
      guestName: 'Priya Shah',
      guestEmail: 'priya.shah@example.com',
      status: 'checked_out',
      checkedInAt: d(-24),
      checkedOutAt: d(-21),
      dinnerYes: [d(-23), d(-22)],
      review: {
        rating: 4.5,
        comment: 'Spacious suite, great for a short family trip.',
        createdAt: toDateOnly(d(-20)),
      },
    },
    {
      confirmationCode: 'HTL-AVG001',
      room: roomsByName['Rooftop Loft'],
      checkIn: d(-22),
      checkOut: d(-19),
      adults: 1,
      children: 0,
      infants: 0,
      guestName: 'Chris Patel',
      guestEmail: 'chris.patel@example.com',
      status: 'checked_out',
      checkedInAt: d(-22),
      checkedOutAt: d(-19),
      dinnerYes: [d(-21)],
      review: {
        rating: 3,
        comment: 'Nice views, but the loft felt a bit warm at night.',
        createdAt: toDateOnly(d(-18)),
      },
    },
    {
      confirmationCode: 'HTL-AVG002',
      room: roomsByName['Garden Room'],
      checkIn: d(-18),
      checkOut: d(-15),
      adults: 2,
      children: 0,
      infants: 1,
      guestName: 'Taylor Kim',
      guestEmail: 'taylor.kim@example.com',
      status: 'checked_out',
      checkedInAt: d(-18),
      checkedOutAt: d(-15),
      dinnerYes: [d(-18), d(-17), d(-16)],
      review: {
        rating: 2.5,
        comment: 'Decent room; check-in was slow and Wi‑Fi was spotty.',
        createdAt: toDateOnly(d(-14)),
      },
    },
    {
      confirmationCode: 'HTL-BAD001',
      room: roomsByName['Courtyard Suite'],
      checkIn: d(-16),
      checkOut: d(-13),
      adults: 1,
      children: 0,
      infants: 0,
      guestName: 'Riley Quinn',
      guestEmail: 'riley.quinn@example.com',
      status: 'checked_out',
      checkedInAt: d(-16),
      checkedOutAt: d(-13),
      dinnerYes: [],
      review: {
        rating: 1.5,
        comment: 'Noisy courtyard and the AC barely worked.',
        createdAt: toDateOnly(d(-12)),
      },
    },
    {
      confirmationCode: 'HTL-BAD002',
      room: roomsByName['Rooftop Loft'],
      checkIn: d(-14),
      checkOut: d(-11),
      adults: 2,
      children: 0,
      infants: 0,
      guestName: 'Jamie Ortega',
      guestEmail: 'jamie.ortega@example.com',
      status: 'checked_out',
      checkedInAt: d(-14),
      checkedOutAt: d(-11),
      dinnerYes: [d(-14)],
      review: {
        rating: 0.5,
        comment: 'Worst stay — dirty bathroom and late housekeeping.',
        createdAt: toDateOnly(d(-10)),
      },
    },
    {
      confirmationCode: 'HTL-PAST01',
      room: roomsByName['Garden Room'],
      checkIn: d(-10),
      checkOut: d(-7),
      adults: 2,
      children: 0,
      infants: 0,
      guestName: 'Noah Bennett',
      guestEmail: 'noah.bennett@example.com',
      status: 'checked_out',
      checkedInAt: d(-10),
      checkedOutAt: d(-7),
      dinnerYes: [d(-10), d(-9)],
      review: {
        rating: 4,
        comment: 'Lovely garden terrace — would book again.',
        createdAt: toDateOnly(d(-6)),
      },
    },
    // Checked out, no review yet (smoke: submit a review)
    {
      confirmationCode: 'HTL-DONE01',
      room: roomsByName['Rooftop Loft'],
      checkIn: d(-6),
      checkOut: d(-3),
      adults: 1,
      children: 0,
      infants: 0,
      guestName: 'Morgan Blake',
      guestEmail: 'morgan.blake@example.com',
      status: 'checked_out',
      checkedInAt: d(-6),
      checkedOutAt: d(-3),
      dinnerYes: [d(-5), d(-4)],
    },
    // —— Near term: only Courtyard occupied (2 rooms free) ——
    {
      confirmationCode: 'HTL-NOW001',
      room: roomsByName['Courtyard Suite'],
      checkIn: d(-1), // Sep 3
      checkOut: d(2), // Sep 6
      adults: 2,
      children: 0,
      infants: 0,
      guestName: 'Jordan Lee',
      guestEmail: 'jordan.lee@example.com',
      status: 'checked_in',
      checkedInAt: d(-1),
      dinnerYes: [d(-1), d(0), d(1)], // yesterday, today, tomorrow
    },
    // —— Staggered confirmed stays through Sept 10 (still ≤1 room busy) ——
    {
      confirmationCode: 'HTL-GARD06',
      room: roomsByName['Garden Room'],
      checkIn: d(2), // Sep 6
      checkOut: d(4), // Sep 8
      adults: 2,
      children: 1,
      infants: 0,
      guestName: 'Elena Vargas',
      guestEmail: 'elena.vargas@example.com',
      status: 'confirmed',
      dinnerYes: [d(2), d(3)],
    },
    {
      confirmationCode: 'HTL-ROOF08',
      room: roomsByName['Rooftop Loft'],
      checkIn: d(4), // Sep 8
      checkOut: d(7), // Sep 11 — nights Sep 8, 9, 10
      adults: 2,
      children: 0,
      infants: 1,
      guestName: 'Sam Okonkwo',
      guestEmail: 'sam.okonkwo@example.com',
      status: 'confirmed',
      dinnerYes: [d(4), d(6)], // Sep 8 & Sep 10
    },
    // Further-out confirmed (after Sept 10 window)
    {
      confirmationCode: 'HTL-FUTR01',
      room: roomsByName['Garden Room'],
      checkIn: d(14),
      checkOut: d(17),
      adults: 1,
      children: 0,
      infants: 0,
      guestName: 'Harper Diaz',
      guestEmail: 'harper.diaz@example.com',
      status: 'confirmed',
      dinnerYes: [d(15), d(16)],
    },
    // Cancelled — does not block the room
    {
      confirmationCode: 'HTL-CANC01',
      room: roomsByName['Rooftop Loft'],
      checkIn: d(2),
      checkOut: d(5),
      adults: 1,
      children: 0,
      infants: 0,
      guestName: 'Casey Nguyen',
      guestEmail: 'casey.nguyen@example.com',
      status: 'cancelled',
      dinnerYes: [],
    },
  ];

  for (const booking of bookings) {
    const nights = eachNight(booking.checkIn, booking.checkOut);
    const dinners = dinnerMap(nights, booking.dinnerYes);
    const totalPrice = booking.room.pricePerNight * nights.length;

    const created = await prisma.booking.create({
      data: {
        confirmationCode: booking.confirmationCode,
        roomId: booking.room.id,
        checkIn: toDateOnly(booking.checkIn),
        checkOut: toDateOnly(booking.checkOut),
        adults: booking.adults,
        children: booking.children,
        infants: booking.infants,
        pricePerNight: booking.room.pricePerNight,
        totalPrice,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        status: booking.status,
        checkedInAt: booking.checkedInAt
          ? toDateOnly(booking.checkedInAt)
          : null,
        checkedOutAt: booking.checkedOutAt
          ? toDateOnly(booking.checkedOutAt)
          : null,
        dinnerPlans: {
          create: nights.map((night) => ({
            day: toDateOnly(night),
            wantsDinner: Boolean(dinners[night]),
          })),
        },
        ...(booking.review
          ? {
              review: {
                create: {
                  rating: booking.review.rating,
                  comment: booking.review.comment,
                  createdAt: booking.review.createdAt,
                },
              },
            }
          : {}),
      },
    });

    console.log(`Seeded booking ${created.confirmationCode}`);
  }

  console.log('Seed completed successfully');
  console.log('Admin login: admin@hotel.local / admin123');
  console.log(
    'Near-term occupancy: only 1 room busy at a time through Sep 10 (2+ free).',
  );
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
