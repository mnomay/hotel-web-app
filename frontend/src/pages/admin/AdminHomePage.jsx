import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminOverview } from '../../api/client';
import FormError from '../../components/FormError';
import { addDaysIso, formatDisplayDate, todayIso } from '../../utils/dates';

const DAY_WIDTH = 72;
const ROOM_WIDTH = 148;

const STATUS_STYLES = {
  confirmed: 'bg-emerald-600 hover:bg-emerald-700',
  checked_in: 'bg-sky-600 hover:bg-sky-700',
  checked_out: 'bg-gray-500 hover:bg-gray-600',
  cancelled: 'bg-rose-300 text-rose-950 line-through hover:bg-rose-400',
};

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
  cancelled: 'Cancelled',
};

function dayLabel(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    day: String(date.getDate()),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
  };
}

function AdminHomePage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(() => todayIso());
  const [to, setTo] = useState(() => addDaysIso(todayIso(), 13));
  const [applied, setApplied] = useState(() => ({
    from: todayIso(),
    to: addDaysIso(todayIso(), 13),
  }));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);

    getAdminOverview(applied.from, applied.to)
      .then((overview) => {
        if (active) {
          setData(overview);
          setFormError('');
        }
      })
      .catch((err) => {
        if (active) {
          setData(null);
          setFormError(err.message || 'Failed to load overview');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applied]);

  const today = todayIso();
  const gridWidth = useMemo(() => {
    const days = data?.days?.length || 0;
    return ROOM_WIDTH + days * DAY_WIDTH;
  }, [data]);

  const applyRange = (nextFrom, nextTo) => {
    setFrom(nextFrom);
    setTo(nextTo);
    setFormError('');
    setApplied({ from: nextFrom, to: nextTo });
  };

  const shiftRange = (days) => {
    applyRange(addDaysIso(applied.from, days), addDaysIso(applied.to, days));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!from || !to) {
      setFormError('Select a start and end date');
      return;
    }
    if (from > to) {
      setFormError('Start date must be on or before end date');
      return;
    }
    setFormError('');
    setApplied({ from, to });
  };

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Rooms across days. Click a booking to open details.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => shiftRange(-7)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            ← Prev week
          </button>
          <button
            type="button"
            onClick={() => applyRange(todayIso(), addDaysIso(todayIso(), 13))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftRange(7)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Next week →
          </button>
        </div>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-5 space-y-3 rounded-2xl border border-gray-200 bg-white p-3 sm:p-4"
      >
        <FormError message={formError} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              From
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                if (formError) setFormError('');
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:bg-white"
            />
          </label>
          <label className="block flex-1">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              To
            </span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                if (formError) setFormError('');
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-900 focus:bg-white"
            />
          </label>
          <button type="submit" className="btn-primary sm:w-auto sm:min-w-[120px]">
            Apply
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${STATUS_STYLES[key].split(' ')[0]}`} />
            {label}
          </span>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500">Loading grid…</p>
        ) : !data ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500">No overview data.</p>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: gridWidth }}>
              <div
                className="sticky top-0 z-20 grid border-b border-gray-200 bg-gray-50"
                style={{
                  gridTemplateColumns: `${ROOM_WIDTH}px repeat(${data.days.length}, ${DAY_WIDTH}px)`,
                }}
              >
                <div className="sticky left-0 z-30 border-r border-gray-200 bg-gray-50 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Room
                </div>
                {data.days.map((day) => {
                  const label = dayLabel(day);
                  const isToday = day === today;
                  return (
                    <div
                      key={day}
                      className={`border-r border-gray-100 px-1 py-2 text-center last:border-r-0 ${
                        isToday ? 'bg-rose-50' : ''
                      }`}
                      title={formatDisplayDate(day)}
                    >
                      <div className="text-[10px] font-medium uppercase text-gray-400">
                        {label.weekday}
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          isToday ? 'text-[#ff385c]' : 'text-gray-900'
                        }`}
                      >
                        {label.day}
                      </div>
                      <div className="text-[10px] text-gray-400">{label.month}</div>
                    </div>
                  );
                })}
              </div>

              {data.rooms.map((room) => (
                <div
                  key={room.id}
                  className="relative grid border-b border-gray-100 last:border-b-0"
                  style={{
                    gridTemplateColumns: `${ROOM_WIDTH}px repeat(${data.days.length}, ${DAY_WIDTH}px)`,
                    minHeight: 72,
                  }}
                >
                  <div className="sticky left-0 z-10 flex flex-col justify-center border-r border-gray-200 bg-white px-3 py-3">
                    <div className="text-sm font-semibold text-gray-900">{room.name}</div>
                    <div className="text-xs text-gray-400">
                      Sleeps {room.capacity}
                    </div>
                  </div>

                  {data.days.map((day) => (
                    <div
                      key={`${room.id}-${day}`}
                      className={`border-r border-gray-50 last:border-r-0 ${
                        day === today ? 'bg-rose-50/40' : ''
                      }`}
                    />
                  ))}

                  <div
                    className="pointer-events-none absolute inset-y-0"
                    style={{ left: ROOM_WIDTH, right: 0 }}
                  >
                    {room.bookings.map((booking) => (
                      <button
                        key={booking.id}
                        type="button"
                        title={`${booking.guestName} · ${booking.confirmationCode}`}
                        onClick={() =>
                          navigate(`/admin/bookings/${booking.confirmationCode}`)
                        }
                        className={`pointer-events-auto absolute top-3 flex h-11 items-center overflow-hidden rounded-lg px-2 text-left text-xs font-semibold text-white shadow-sm transition ${
                          STATUS_STYLES[booking.status] || STATUS_STYLES.confirmed
                        } ${booking.clipsLeft ? 'rounded-l-none' : ''} ${
                          booking.clipsRight ? 'rounded-r-none' : ''
                        }`}
                        style={{
                          left: booking.startIndex * DAY_WIDTH + 4,
                          width: Math.max(booking.span * DAY_WIDTH - 8, 28),
                        }}
                      >
                        <span className="truncate">
                          {booking.guestName}
                          <span className="ml-1 font-normal opacity-80">
                            {booking.confirmationCode}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {data ? (
        <p className="mt-3 text-xs text-gray-400">
          Showing {formatDisplayDate(data.from)} – {formatDisplayDate(data.to)}. Scroll
          sideways on smaller screens.
        </p>
      ) : null}
    </main>
  );
}

export default AdminHomePage;
