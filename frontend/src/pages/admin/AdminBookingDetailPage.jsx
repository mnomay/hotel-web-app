import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  cancelAdminBooking,
  checkInAdminBooking,
  checkOutAdminBooking,
  getAdminBooking,
} from '../../api/client';
import FormError from '../../components/FormError';
import { useToast } from '../../components/ToastProvider';
import { formatDisplayDate, todayIso } from '../../utils/dates';
import { formatMoney } from '../../utils/money';

const STATUS_PILL = {
  confirmed: 'bg-emerald-50 text-emerald-800',
  checked_in: 'bg-sky-50 text-sky-800',
  checked_out: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-rose-50 text-rose-800',
};

function guestSummary(booking) {
  const parts = [`${booking.adults} adult${booking.adults === 1 ? '' : 's'}`];
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
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [actionDate, setActionDate] = useState(() => todayIso());
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFormError('');

    getAdminBooking(confirmationCode)
      .then((data) => {
        if (active) {
          setBooking(data);
          setActionDate(todayIso());
        }
      })
      .catch(() => {
        if (active) {
          setBooking(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [confirmationCode]);

  const handleCancel = async () => {
    if (!booking || booking.status !== 'confirmed') return;
    if (
      !window.confirm(
        `Cancel booking ${booking.confirmationCode}? The room will become available again.`,
      )
    ) {
      return;
    }

    setCancelling(true);
    setFormError('');
    try {
      const updated = await cancelAdminBooking(booking.confirmationCode);
      setBooking(updated);
      showToast('Booking cancelled');
      navigate('/admin', { replace: false });
    } catch (err) {
      setFormError(err.message || 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  const handleCheckIn = async () => {
    if (!booking || booking.status !== 'confirmed') return;
    if (!actionDate) {
      setFormError('Select a check-in date');
      return;
    }
    setFormError('');
    setStatusBusy(true);
    try {
      const updated = await checkInAdminBooking(booking.confirmationCode, actionDate);
      setBooking(updated);
      showToast(`Checked in on ${formatDisplayDate(actionDate)}`);
    } catch (err) {
      setFormError(err.message || 'Check-in failed');
    } finally {
      setStatusBusy(false);
    }
  };

  const handleCheckOut = async () => {
    if (!booking || booking.status !== 'checked_in') return;
    if (!actionDate) {
      setFormError('Select a check-out date');
      return;
    }
    setFormError('');
    setStatusBusy(true);
    try {
      const updated = await checkOutAdminBooking(booking.confirmationCode, actionDate);
      setBooking(updated);
      showToast(`Checked out on ${formatDisplayDate(actionDate)}`);
    } catch (err) {
      setFormError(err.message || 'Check-out failed');
    } finally {
      setStatusBusy(false);
    }
  };

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

  const canCancel = booking.status === 'confirmed';
  const canCheckIn = booking.status === 'confirmed';
  const canCheckOut = booking.status === 'checked_in';
  const dinnerPlans = booking.dinnerPlans || [];

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
              Planned check-in
            </dt>
            <dd className="mt-1 text-gray-900">{formatDisplayDate(booking.checkIn)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Planned check-out
            </dt>
            <dd className="mt-1 text-gray-900">{formatDisplayDate(booking.checkOut)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Actually checked in
            </dt>
            <dd className="mt-1 text-gray-900">
              {booking.checkedInAt
                ? formatDisplayDate(booking.checkedInAt)
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Actually checked out
            </dt>
            <dd className="mt-1 text-gray-900">
              {booking.checkedOutAt
                ? formatDisplayDate(booking.checkedOutAt)
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Total
            </dt>
            <dd className="mt-1 text-gray-900">{formatMoney(booking.totalPrice)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Nights
            </dt>
            <dd className="mt-1 text-gray-900">{booking.nights}</dd>
          </div>
        </dl>

        {(canCheckIn || canCheckOut) && (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (canCheckIn) handleCheckIn();
              else handleCheckOut();
            }}
            className="mt-6 space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4"
          >
            <FormError message={formError} />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {canCheckIn ? 'Check in guest' : 'Check out guest'}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Choose the date this action happened. Defaults to today.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block flex-1">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </span>
                <input
                  type="date"
                  value={actionDate}
                  onChange={(e) => {
                    setActionDate(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                />
              </label>
              {canCheckIn ? (
                <button
                  type="submit"
                  disabled={statusBusy || !actionDate}
                  className="btn-primary sm:w-auto sm:min-w-[140px]"
                >
                  {statusBusy ? 'Saving…' : 'Mark checked in'}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={statusBusy || !actionDate}
                  className="btn-primary sm:w-auto sm:min-w-[140px]"
                >
                  {statusBusy ? 'Saving…' : 'Mark checked out'}
                </button>
              )}
            </div>
          </form>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900">Dinner plans</h2>
          {dinnerPlans.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No dinner nights on this stay.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">
              {dinnerPlans.map((plan) => (
                <li
                  key={plan.day}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="text-gray-700">{formatDisplayDate(plan.day)}</span>
                  <span
                    className={
                      plan.wantsDinner
                        ? 'font-medium text-emerald-700'
                        : 'text-gray-400'
                    }
                  >
                    {plan.wantsDinner ? 'Dinner' : 'No dinner'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
          {!canCheckIn && !canCheckOut ? <FormError message={formError} /> : null}
          {canCancel ? (
            <button
              type="button"
              disabled={cancelling || statusBusy}
              onClick={handleCancel}
              className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-60 sm:w-auto"
            >
              {cancelling ? 'Cancelling…' : 'Cancel booking'}
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              {booking.status === 'cancelled'
                ? 'This booking is already cancelled.'
                : 'Only confirmed bookings (not yet checked in) can be cancelled.'}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default AdminBookingDetailPage;
