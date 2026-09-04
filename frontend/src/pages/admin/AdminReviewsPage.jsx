import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminReviews } from '../../api/client';
import FormError from '../../components/FormError';
import { StarRatingDisplay } from '../../components/StarRating';
import { addDaysIso, formatDisplayDate, todayIso } from '../../utils/dates';

const PAGE_SIZE = 5;

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'good', label: 'Good (4–5)' },
  { value: 'average', label: 'Average (2–3.5)' },
  { value: 'bad', label: 'Bad (under 2)' },
];

function formatSubmittedAt(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function AdminReviewsPage() {
  const [sort, setSort] = useState('latest');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [applied, setApplied] = useState({
    sort: 'latest',
    from: '',
    to: '',
    page: 1,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);

    getAdminReviews({ ...applied, limit: PAGE_SIZE })
      .then((result) => {
        if (active) {
          setData(result);
          setFormError('');
        }
      })
      .catch((err) => {
        if (active) {
          setData(null);
          setFormError(err.message || 'Failed to load reviews');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applied]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (from && to && from > to) {
      setFormError('Start date must be on or before end date');
      return;
    }
    setFormError('');
    setApplied({ sort, from, to, page: 1 });
  };

  const clearDates = () => {
    setFrom('');
    setTo('');
    setFormError('');
    setApplied((current) => ({ ...current, from: '', to: '', page: 1 }));
  };

  const setLast30Days = () => {
    const end = todayIso();
    const start = addDaysIso(end, -30);
    setFrom(start);
    setTo(end);
    setFormError('');
    setApplied((current) => ({
      ...current,
      from: start,
      to: end,
      page: 1,
    }));
  };

  const goToPage = (nextPage) => {
    setApplied((current) => ({ ...current, page: nextPage }));
  };

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Reviews</h1>
      <p className="mt-1 text-sm text-gray-500">
        Filter by date submitted or rating band (4 counts as good, 2 as average).
      </p>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-5 space-y-3 rounded-2xl border border-gray-200 bg-white p-3 sm:p-4"
      >
        <FormError message={formError} />
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSort(option.value);
                setFormError('');
                setApplied((current) => ({
                  ...current,
                  sort: option.value,
                  page: 1,
                }));
              }}
              className={[
                'rounded-lg px-3 py-2 text-sm font-medium transition',
                applied.sort === option.value
                  ? 'bg-[#ff385c] text-white'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-rose-50 hover:text-[#ff385c]',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>

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
          <button type="submit" className="btn-primary sm:w-auto sm:min-w-[110px]">
            Apply
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={setLast30Days}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Last 30 days
          </button>
          <button
            type="button"
            onClick={clearDates}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            All dates
          </button>
        </div>
      </form>

      {loading ? (
        <p className="mt-10 text-center text-sm text-gray-500">Loading reviews…</p>
      ) : !data || data.total === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-900">No reviews found</p>
          <p className="mt-1 text-sm text-gray-500">
            Try another sort order or widen the date range. Seed review:{' '}
            <span className="font-medium text-gray-700">HTL-PAST01</span>
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-xs text-gray-400">
            {data.total} review{data.total === 1 ? '' : 's'}
            {data.from || data.to
              ? ` · ${data.from ? formatDisplayDate(data.from) : '…'} – ${
                  data.to ? formatDisplayDate(data.to) : '…'
                }`
              : ' · all dates'}
            {data.totalPages > 1
              ? ` · page ${data.page} of ${data.totalPages}`
              : ''}
          </p>

          {data.reviews.map((review) => (
            <article
              key={review.bookingId}
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{review.guestName}</p>
                  <p className="text-sm text-gray-500">
                    {review.room?.name} ·{' '}
                    <Link
                      to={`/admin/bookings/${review.confirmationCode}`}
                      className="font-medium text-gray-800 underline-offset-2 hover:underline"
                    >
                      {review.confirmationCode}
                    </Link>
                  </p>
                </div>
                <div className="sm:text-right">
                  <StarRatingDisplay rating={review.rating} />
                  <p className="mt-1 text-xs text-gray-400">
                    {formatSubmittedAt(review.createdAt)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-700">
                {review.comment}
              </p>
              <p className="mt-3 text-xs text-gray-400">
                Stay {formatDisplayDate(review.checkIn)} –{' '}
                {formatDisplayDate(review.checkOut)}
              </p>
            </article>
          ))}

          {data.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => goToPage(data.page - 1)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 disabled:opacity-40"
              >
                Previous
              </button>
              <p className="text-sm text-gray-500">
                Page {data.page} of {data.totalPages}
              </p>
              <button
                type="button"
                disabled={data.page >= data.totalPages}
                onClick={() => goToPage(data.page + 1)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}

export default AdminReviewsPage;
