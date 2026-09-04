import { useEffect, useMemo, useState } from 'react';
import { cancelBooking, getBooking, updateDinners } from '../api/client';
import { useToast } from '../components/ToastProvider';
import { getRoomImage } from '../data/roomImages';
import { formatDisplayDate, todayIso } from '../utils/dates';
import { formatMoney } from '../utils/money';

const DINNER_PAGE_SIZE = 10;

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
  return parts.join(', ');
}

function statusLabel(status) {
  return status.replaceAll('_', ' ');
}

function statusClasses(status) {
  if (status === 'confirmed') return 'bg-green-50 text-green-800';
  if (status === 'checked_in') return 'bg-blue-50 text-blue-800';
  if (status === 'checked_out') return 'bg-gray-100 text-gray-600';
  return 'bg-gray-100 text-gray-600';
}

function Toggle({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition',
        checked ? 'bg-[#ff385c]' : 'bg-gray-300',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
          checked ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  );
}

function ManagePage() {
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [booking, setBooking] = useState(null);
  const [dinnerDraft, setDinnerDraft] = useState([]);
  const [dinnersOpen, setDinnersOpen] = useState(true);
  const [dinnerPage, setDinnerPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingDinners, setSavingDinners] = useState(false);

  const stayEnded = useMemo(() => {
    if (!booking) return false;
    return todayIso() >= booking.checkOut;
  }, [booking]);

  const isDone =
    booking?.status === 'checked_out' ||
    booking?.status === 'cancelled' ||
    stayEnded;

  const canEditDinners =
    (booking?.status === 'confirmed' || booking?.status === 'checked_in') &&
    !stayEnded;

  const canCancel = booking?.status === 'confirmed';

  const dinnersDirty = useMemo(() => {
    if (!booking) return false;
    return dinnerDraft.some((draft, index) => {
      const original = booking.dinnerPlans[index];
      return original && draft.wantsDinner !== original.wantsDinner;
    });
  }, [booking, dinnerDraft]);

  const dinnerPageCount = Math.max(
    1,
    Math.ceil(dinnerDraft.length / DINNER_PAGE_SIZE),
  );

  const pagedDinners = useMemo(() => {
    const start = (dinnerPage - 1) * DINNER_PAGE_SIZE;
    return dinnerDraft
      .map((plan, index) => ({ plan, index }))
      .slice(start, start + DINNER_PAGE_SIZE);
  }, [dinnerDraft, dinnerPage]);

  useEffect(() => {
    setDinnerPage(1);
  }, [booking?.confirmationCode]);

  useEffect(() => {
    if (dinnerPage > dinnerPageCount) {
      setDinnerPage(dinnerPageCount);
    }
  }, [dinnerPage, dinnerPageCount]);

  const lookupBooking = async (event) => {
    event.preventDefault();
    setLoading(true);
    setBooking(null);

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setLoading(false);
      showToast('Enter a confirmation code', 'error');
      return;
    }

    try {
      const data = await getBooking(normalizedCode);
      setBooking(data);
      setDinnerDraft(data.dinnerPlans.map((plan) => ({ ...plan })));
      setCode(data.confirmationCode);
      setDinnersOpen(true);
    } catch (err) {
      const message =
        err.message?.includes('<!DOCTYPE') || err.message?.includes('Cannot GET')
          ? 'Booking not found'
          : err.message || 'Could not find that booking';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking || !canCancel) return;
    const confirmed = window.confirm(
      'Cancel this booking? This cannot be undone.',
    );
    if (!confirmed) return;

    setLoading(true);

    try {
      const data = await cancelBooking(booking.confirmationCode);
      setBooking(data);
      setDinnerDraft(data.dinnerPlans.map((plan) => ({ ...plan })));
      showToast('Booking cancelled');
    } catch (err) {
      showToast(err.message || 'Could not cancel booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDinners = async () => {
    if (!booking || !canEditDinners) return;

    setSavingDinners(true);

    try {
      const data = await updateDinners(booking.confirmationCode, dinnerDraft);
      setBooking(data);
      setDinnerDraft(data.dinnerPlans.map((plan) => ({ ...plan })));
      showToast('Dinner plans saved');
    } catch (err) {
      showToast(err.message || 'Could not save dinner plans', 'error');
    } finally {
      setSavingDinners(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
          Manage your booking
        </h1>
        <p className="mt-2 text-gray-500">
          Enter your confirmation code to view details, dinners, or cancel.
        </p>
      </div>

      <form
        onSubmit={lookupBooking}
        className="rounded-3xl border border-gray-200 bg-white p-4 shadow-search sm:p-5"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Confirmation code
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="HTL-XXXXXX"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium tracking-wide text-gray-900 outline-none focus:border-gray-900 focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary sm:w-auto sm:min-w-[140px]"
            >
              {loading ? 'Looking up…' : 'Find booking'}
            </button>
          </div>
        </label>
      </form>

      {booking ? (
        <section className="mt-10 space-y-6">
          <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
            <div className="relative h-48 bg-gray-100 sm:h-56">
              <img
                src={getRoomImage(booking.room?.name)}
                alt={booking.room?.name || 'Room'}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {booking.confirmationCode}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-gray-900">
                    {booking.room?.name}
                  </h2>
                </div>
                <span
                  className={[
                    'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                    statusClasses(booking.status),
                  ].join(' ')}
                >
                  {statusLabel(booking.status)}
                </span>
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-gray-900">Dates</dt>
                  <dd className="mt-1 text-gray-600">
                    {formatDisplayDate(booking.checkIn)} –{' '}
                    {formatDisplayDate(booking.checkOut)}
                    <span className="block text-gray-400">
                      {booking.nights} night{booking.nights === 1 ? '' : 's'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Guests</dt>
                  <dd className="mt-1 text-gray-600">{guestSummary(booking)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Guest</dt>
                  <dd className="mt-1 text-gray-600">
                    {booking.guestName}
                    <span className="block">{booking.guestEmail}</span>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Total</dt>
                  <dd className="mt-1 text-gray-600">
                    {formatMoney(booking.totalPrice)}
                    <span className="block text-gray-400">
                      {formatMoney(booking.pricePerNight)} / night
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </article>

          <article className="rounded-3xl border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setDinnersOpen((open) => !open)}
              className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6"
              aria-expanded={dinnersOpen}
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Dinner plans</h3>
                <p className="mt-0.5 text-sm text-gray-500">
                  {dinnerDraft.length} night{dinnerDraft.length === 1 ? '' : 's'}
                </p>
              </div>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  {dinnersOpen ? (
                    <path d="M6 15l6-6 6 6" />
                  ) : (
                    <path d="M6 9l6 6 6-6" />
                  )}
                </svg>
              </span>
            </button>

            {dinnersOpen ? (
              <div className="border-t border-gray-100 px-5 pb-5 sm:px-6 sm:pb-6">
                {!isDone ? (
                  <p className="mt-4 text-sm text-gray-500">
                    Choose dinner at the hotel for each night of your stay.
                    {dinnerDraft.length > DINNER_PAGE_SIZE
                      ? ' Changes on every page are kept — Save updates the whole stay.'
                      : ''}
                  </p>
                ) : null}

                <ul className="mt-4 divide-y divide-gray-100">
                  {pagedDinners.map(({ plan, index }) => (
                    <li
                      key={plan.day}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatDisplayDate(plan.day)}
                        </p>
                        <p className="text-sm text-gray-500">Night {index + 1}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">
                          {plan.wantsDinner ? 'Yes' : 'No'}
                        </span>
                        <Toggle
                          checked={plan.wantsDinner}
                          disabled={!canEditDinners}
                          label={`Dinner on ${plan.day}`}
                          onChange={(nextValue) => {
                            const next = [...dinnerDraft];
                            next[index] = {
                              ...next[index],
                              wantsDinner: nextValue,
                            };
                            setDinnerDraft(next);
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>

                {dinnerDraft.length > DINNER_PAGE_SIZE ? (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={dinnerPage <= 1}
                      onClick={() => setDinnerPage((page) => page - 1)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <p className="text-sm text-gray-500">
                      Page {dinnerPage} of {dinnerPageCount}
                    </p>
                    <button
                      type="button"
                      disabled={dinnerPage >= dinnerPageCount}
                      onClick={() => setDinnerPage((page) => page + 1)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                ) : null}

                {canEditDinners ? (
                  <div className="sticky bottom-0 mt-5 border-t border-gray-100 bg-white pt-4">
                    <button
                      type="button"
                      disabled={!dinnersDirty || savingDinners}
                      onClick={handleSaveDinners}
                      className="btn-primary disabled:opacity-40"
                    >
                      {savingDinners
                        ? 'Saving…'
                        : dinnersDirty
                          ? `Save all dinner plans (${dinnerDraft.length} nights)`
                          : 'Save dinner plans'}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>

          {canCancel ? (
            <article className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900">Cancel booking</h3>
              <p className="mt-1 text-sm text-gray-500">
                Cancelling frees the room for other guests.
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={handleCancel}
                className="mt-5 w-full rounded-xl border border-red-200 bg-red-50 py-3.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                Cancel booking
              </button>
            </article>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

export default ManagePage;
