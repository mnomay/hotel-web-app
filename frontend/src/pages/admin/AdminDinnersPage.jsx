import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDinners } from '../../api/client';
import { useToast } from '../../components/ToastProvider';
import { formatDisplayDate } from '../../utils/dates';

function DayPanel({ title, summary }) {
  if (!summary) return null;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{formatDisplayDate(summary.date)}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-3xl font-semibold tracking-tight text-gray-900">
            {summary.guestCount}
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            dinner guests
          </p>
        </div>
      </div>

      {summary.bookings.length === 0 ? (
        <p className="mt-5 text-sm text-gray-500">No dinners booked for this night.</p>
      ) : (
        <ul className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {summary.bookings.map((item) => (
            <li key={item.confirmationCode}>
              <Link
                to={`/admin/bookings/${item.confirmationCode}`}
                className="flex flex-col gap-1 px-4 py-3 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.guestName}</p>
                  <p className="text-xs text-gray-500">
                    {item.roomName} · {item.confirmationCode}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {item.guests} guest{item.guests === 1 ? '' : 's'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-gray-400">
        {summary.bookingCount} booking{summary.bookingCount === 1 ? '' : 's'} · guests =
        adults + children (infants excluded)
      </p>
    </section>
  );
}

function AdminDinnersPage() {
  const { showToast } = useToast();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getAdminDinners()
      .then((data) => {
        if (active) setSchedule(data);
      })
      .catch((err) => {
        if (active) {
          setSchedule(null);
          showToast(err.message || 'Failed to load dinners', 'error');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Dinner schedule</h1>
      <p className="mt-1 text-sm text-gray-500">
        Headcount for tonight and tomorrow from active bookings.
      </p>

      {loading ? (
        <p className="mt-10 text-center text-sm text-gray-500">Loading dinners…</p>
      ) : !schedule ? (
        <p className="mt-10 text-center text-sm text-gray-500">No dinner data.</p>
      ) : (
        <div className="mt-6 grid gap-4">
          <DayPanel title="Today" summary={schedule.today} />
          <DayPanel title="Tomorrow" summary={schedule.tomorrow} />
        </div>
      )}
    </main>
  );
}

export default AdminDinnersPage;
