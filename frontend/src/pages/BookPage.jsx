import { useEffect, useMemo, useState } from 'react';
import { createBooking, getAvailability } from '../api/client';
import { useToast } from '../components/ToastProvider';
import { getRoomImage } from '../data/roomImages';
import { addDaysIso, formatDisplayDate, todayIso } from '../utils/dates';
import { formatMoney } from '../utils/money';

function guestSummary({ adults, children, infants }) {
  const parts = [];
  parts.push(`${adults} adult${adults === 1 ? '' : 's'}`);
  if (children > 0) parts.push(`${children} child${children === 1 ? '' : 'ren'}`);
  if (infants > 0) parts.push(`${infants} infant${infants === 1 ? '' : 's'}`);
  return parts.join(', ');
}

function CounterRow({ label, hint, value, onChange, min, max }) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={!canDecrease}
          onClick={() => onChange(value - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-lg text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
        >
          −
        </button>
        <span className="w-6 text-center text-base font-medium text-gray-900">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={!canIncrease}
          onClick={() => onChange(value + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-lg text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}

function BookingModal({
  room,
  checkIn,
  checkOut,
  nights,
  onClose,
  onBooked,
}) {
  const { showToast } = useToast();
  const [modalStep, setModalStep] = useState(1);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const occupancy = adults + children;
  const overCapacity = occupancy > room.capacity;
  const totalPrice = room.pricePerNight * nights;

  const capacityMessage = useMemo(
    () =>
      `This place has a maximum of ${room.capacity} guests, not including infants.`,
    [room.capacity],
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const submitBooking = async (event) => {
    event.preventDefault();
    if (overCapacity || adults < 1) return;

    setLoading(true);

    try {
      const booking = await createBooking({
        roomId: room.id,
        checkIn,
        checkOut,
        adults,
        children,
        infants,
        guestName,
        guestEmail,
      });
      showToast('Booking confirmed');
      onBooked(booking);
    } catch (err) {
      showToast(err.message || 'Could not complete booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <p id="booking-modal-title" className="text-base font-semibold text-gray-900">
            {modalStep === 1 ? 'Review and continue' : 'Your details'}
          </p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          <div className="overflow-hidden rounded-2xl">
            <img
              src={getRoomImage(room.name)}
              alt={room.name}
              className="h-40 w-full object-cover"
            />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">{room.name}</h3>

          {modalStep === 1 ? (
            <>
              <div className="mt-5 rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Dates
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {formatDisplayDate(checkIn)} – {formatDisplayDate(checkOut)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {nights} night{nights === 1 ? '' : 's'}
                </p>
              </div>

              <div className="mt-5">
                <h4 className="text-base font-semibold text-gray-900">Change guests</h4>
                <p className="mt-1 text-sm text-gray-500">{capacityMessage}</p>

                <div className="mt-2 divide-y divide-gray-200 border-t border-gray-200">
                  <CounterRow
                    label="Adults"
                    hint="Age 13+"
                    value={adults}
                    min={1}
                    max={room.capacity - children}
                    onChange={setAdults}
                  />
                  <CounterRow
                    label="Children"
                    hint="Ages 2 – 12"
                    value={children}
                    min={0}
                    max={room.capacity - adults}
                    onChange={setChildren}
                  />
                  <CounterRow
                    label="Infants"
                    hint="Under 2"
                    value={infants}
                    min={0}
                    max={5}
                    onChange={setInfants}
                  />
                </div>

                {overCapacity ? (
                  <p className="mt-2 text-sm text-red-600">{capacityMessage}</p>
                ) : null}
              </div>

              <div className="mt-5 rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {formatMoney(room.pricePerNight)} × {nights} night
                    {nights === 1 ? '' : 's'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatMoney(totalPrice)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-base">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-semibold text-gray-900">
                    {formatMoney(totalPrice)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={overCapacity || adults < 1}
                onClick={() => setModalStep(2)}
                className="btn-primary mt-6"
              >
                Continue
              </button>
            </>
          ) : (
            <form onSubmit={submitBooking} className="mt-5 space-y-4">
              <p className="text-sm text-gray-500">
                {formatDisplayDate(checkIn)} – {formatDisplayDate(checkOut)} ·{' '}
                {guestSummary({ adults, children, infants })} · {formatMoney(totalPrice)}
              </p>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                  Full name
                </span>
                <input
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-gray-900"
                  placeholder="Alex Rivera"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-gray-900">
                  Email
                </span>
                <input
                  required
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-gray-900"
                  placeholder="alex@example.com"
                />
              </label>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Confirming…' : 'Confirm booking'}
              </button>
              <button
                type="button"
                onClick={() => setModalStep(1)}
                className="w-full rounded-xl border border-gray-300 py-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function BookPage() {
  const { showToast } = useToast();
  const minCheckIn = todayIso();
  const [checkIn, setCheckIn] = useState(minCheckIn);
  const [checkOut, setCheckOut] = useState(addDaysIso(minCheckIn, 2));
  const [rooms, setRooms] = useState([]);
  const [resultCheckIn, setResultCheckIn] = useState('');
  const [resultCheckOut, setResultCheckOut] = useState('');
  const [resultNights, setResultNights] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const resetFlow = () => {
    setShowResults(false);
    setRooms([]);
    setResultCheckIn('');
    setResultCheckOut('');
    setResultNights(0);
    setSelectedRoom(null);
    setConfirmation(null);
  };

  const searchRooms = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSelectedRoom(null);
    setConfirmation(null);

    try {
      const data = await getAvailability(checkIn, checkOut);
      setRooms(data.rooms);
      setResultCheckIn(checkIn);
      setResultCheckOut(checkOut);
      setResultNights(data.nights);
      setShowResults(true);
    } catch (err) {
      showToast(err.message || 'Could not load available rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
          Book a stay at Willow House
        </h1>
        <p className="mt-2 text-gray-500">3 rooms · no account needed</p>
      </div>

      <form
        onSubmit={searchRooms}
        className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-4 shadow-search sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
          <label className="date-field">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Check-in
            </span>
            <input
              type="date"
              required
              min={minCheckIn}
              value={checkIn}
              onChange={(e) => {
                const next = e.target.value;
                setCheckIn(next);
                if (checkOut <= next) setCheckOut(addDaysIso(next, 1));
              }}
            />
          </label>

          <label className="date-field">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Check-out
            </span>
            <input
              type="date"
              required
              min={addDaysIso(checkIn, 1)}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </label>

          <button type="submit" disabled={loading} className="btn-primary sm:min-w-[140px]">
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {showResults && !confirmation ? (
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Available rooms</h2>
            <p className="mt-1 text-sm text-gray-500">
              {formatDisplayDate(resultCheckIn)} – {formatDisplayDate(resultCheckOut)}
              {resultNights > 0
                ? ` · ${resultNights} night${resultNights === 1 ? '' : 's'}`
                : ''}
            </p>
          </div>

          {rooms.length === 0 ? (
            <p className="text-gray-500">No rooms available for these dates.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <article
                  key={room.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-card"
                >
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={getRoomImage(room.name)}
                      alt={room.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-800">
                      Up to {room.capacity} guests
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{room.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {room.description}
                    </p>
                    <p className="mt-3 text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">
                        {formatMoney(room.totalPrice)}
                      </span>
                      {` for ${room.nights} night${room.nights === 1 ? '' : 's'}`}
                      <span className="text-gray-400">
                        {' '}
                        · {formatMoney(room.pricePerNight)} / night
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoom(room);
                      }}
                      className="btn-primary mt-4"
                    >
                      Select room
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {selectedRoom && !confirmation ? (
        <BookingModal
          room={selectedRoom}
          checkIn={resultCheckIn}
          checkOut={resultCheckOut}
          nights={resultNights}
          onClose={() => setSelectedRoom(null)}
          onBooked={(booking) => {
            setConfirmation(booking);
            setSelectedRoom(null);
            setShowResults(false);
          }}
        />
      ) : null}

      {confirmation ? (
        <section className="mx-auto mt-12 max-w-lg rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#ff385c]">Booking confirmed</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">You&apos;re all set</h2>
          <p className="mt-2 text-sm text-gray-500">
            Save your confirmation code to manage your stay later.
          </p>
          <p className="mt-6 rounded-xl bg-gray-50 px-4 py-4 text-2xl font-semibold tracking-wide text-gray-900">
            {confirmation.confirmationCode}
          </p>
          <dl className="mt-6 grid gap-3 text-left text-sm text-gray-700 sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-gray-900">Room</dt>
              <dd>{confirmation.room?.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Guests</dt>
              <dd>
                {guestSummary({
                  adults: confirmation.adults,
                  children: confirmation.children,
                  infants: confirmation.infants,
                })}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Dates</dt>
              <dd>
                {formatDisplayDate(confirmation.checkIn)} –{' '}
                {formatDisplayDate(confirmation.checkOut)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Total</dt>
              <dd>{formatMoney(confirmation.totalPrice)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={resetFlow}
            className="btn-primary mt-6"
          >
            Book another stay
          </button>
        </section>
      ) : null}
    </main>
  );
}

export default BookPage;
