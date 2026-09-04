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

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

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

  await prisma.adminUser.createMany({
    data: [
      { email: 'admin@hotel.local', passwordHash },
      { email: 'manager@hotel.local', passwordHash },
    ],
  });

  const pastCheckIn = formatDate(addDays(today, -10));
  const pastCheckOut = formatDate(addDays(today, -7));
  const currentCheckIn = formatDate(addDays(today, -1));
  const currentCheckOut = formatDate(addDays(today, 2));
  const futureCheckIn = formatDate(addDays(today, 14));
  const futureCheckOut = formatDate(addDays(today, 17));
  const cancelledCheckIn = formatDate(addDays(today, 5));
  const cancelledCheckOut = formatDate(addDays(today, 8));

  const bookings = [
    {
      confirmationCode: 'HTL-PAST01',
      room: roomsByName['Garden Room'],
      checkIn: pastCheckIn,
      checkOut: pastCheckOut,
      adults: 2,
      children: 0,
      infants: 0,
      guestName: 'Alex Rivera',
      guestEmail: 'alex.rivera@example.com',
      status: 'confirmed',
      dinners: {
        [pastCheckIn]: true,
        [formatDate(addDays(today, -9))]: true,
        [formatDate(addDays(today, -8))]: false,
      },
      review: {
        rating: 5,
        comment:
          'Beautiful stay — quiet garden and excellent breakfast nearby.',
        createdAt: toDateOnly(formatDate(addDays(today, -6))),
      },
    },
    {
      confirmationCode: 'HTL-NOW001',
      room: roomsByName['Courtyard Suite'],
      checkIn: currentCheckIn,
      checkOut: currentCheckOut,
      adults: 1,
      children: 0,
      infants: 0,
      guestName: 'Jordan Lee',
      guestEmail: 'jordan.lee@example.com',
      status: 'confirmed',
      dinners: {
        [currentCheckIn]: true,
        [formatDate(today)]: true,
        [formatDate(addDays(today, 1))]: false,
      },
    },
    {
      confirmationCode: 'HTL-FUTR01',
      room: roomsByName['Rooftop Loft'],
      checkIn: futureCheckIn,
      checkOut: futureCheckOut,
      adults: 2,
      children: 0,
      infants: 1,
      guestName: 'Sam Okonkwo',
      guestEmail: 'sam.okonkwo@example.com',
      status: 'confirmed',
      dinners: {
        [futureCheckIn]: false,
        [formatDate(addDays(today, 15))]: true,
        [formatDate(addDays(today, 16))]: true,
      },
    },
    {
      confirmationCode: 'HTL-CANC01',
      room: roomsByName['Garden Room'],
      checkIn: cancelledCheckIn,
      checkOut: cancelledCheckOut,
      adults: 1,
      children: 0,
      infants: 0,
      guestName: 'Casey Nguyen',
      guestEmail: 'casey.nguyen@example.com',
      status: 'cancelled',
      dinners: {
        [cancelledCheckIn]: false,
        [formatDate(addDays(today, 6))]: false,
        [formatDate(addDays(today, 7))]: false,
      },
    },
  ];

  for (const booking of bookings) {
    const nights = eachNight(booking.checkIn, booking.checkOut);
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
        dinnerPlans: {
          create: nights.map((night) => ({
            day: toDateOnly(night),
            wantsDinner: Boolean(booking.dinners[night]),
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
  console.log(
    'Admin logins: admin@hotel.local / admin123, manager@hotel.local / admin123',
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
