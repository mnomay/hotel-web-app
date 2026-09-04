import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAdminBooking } from '../../api/client';
import { useToast } from '../../components/ToastProvider';
import { formatDisplayDate } from '../../utils/dates';
import { formatMoney } from '../../utils/money';

const STATUS_PILL = {
  confirmed: 'bg-emerald-50 text-emerald-800',
  checked_in: 'bg-sky-50 text-sky-800',
  checked_out: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-rose-50 text-rose-800',
};

function guestSummary(booking) {
  const parts = [
    `${booking.adults} adult${booking.adults === 1 ? '' : 's'}`,
  ];
  if (booking.children > 0) {
    parts.push(
      `${booking.children} child${booking.children === 1 ? '' : 'ren'}`,
    );
  }
  if (booking.infants > 0) {
    parts.push(
      `${booking.infants} infant${booking.infants === 1 ? '' : 's'}`,
    );
  }
  return parts.join(' · ');
}

function AdminBookingDetailPage() {
  const { confirmationCode } = useParams();
  const { showToast } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getAdminBooking(confirmationCode)
      .then((data) => {
        if (active) setBooking(data);
      })
      .catch((err) => {
        if (active) {
          setBooking(null);
          showToast(err.message || 'Booking not found', 'error');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [confirmationCode, showToast]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-center text-gray-500 sm:px-6">
        Loading booking…
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/admin" className="text-sm font-medium text-gray-700 hover:underline">
          ← Back to overview
        </Link>
        <p className="mt-6 text-gray-500">Booking not found.</p>
      </main>
    );
  }

  const dinnerCount = (booking.dinnerPlans || []).filter((d) => d.wantsDinner).length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <Link to="/admin" className="text-sm font-medium text-gray-700 hover:underline">
        ← Back to overview
      </Link>

      <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Confirmation
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              {booking.confirmationCode}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{booking.room?.name}</p>
          </div>
          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              STATUS_PILL[booking.status] || STATUS_PILL.confirmed
            }`}
          >
            {String(booking.status).replace('_', ' ')}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Guest
            </dt>
            <dd className="mt-1 font-medium text-gray-900">{booking.guestName}</dd>
            <dd className="text-gray-500">{booking.guestEmail}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Guests
            </dt>
            <dd className="mt-1 text-gray-900">{guestSummary(booking)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Check-in
            </dt>
            <dd className="mt-1 text-gray-900">{formatDisplayDate(booking.checkIn)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Check-out
            </dt>
            <dd className="mt-1 text-gray-900">{formatDisplayDate(booking.checkOut)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Total
            </dt>
            <dd className="mt-1 text-gray-900">{formatMoney(booking.totalPrice)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Dinner nights
            </dt>
            <dd className="mt-1 text-gray-900">
              {dinnerCount} of {(booking.dinnerPlans || []).length}
            </dd>
          </div>
        </dl>

        <p className="mt-6 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
          Admin cancel actions arrive in the next step.
        </p>
      </div>
    </main>
  );
}

export default AdminBookingDetailPage;
