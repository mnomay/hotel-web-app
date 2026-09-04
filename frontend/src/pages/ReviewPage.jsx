import { useState } from 'react';
import { createReview } from '../api/client';
import { StarRatingDisplay, StarRatingInput } from '../components/StarRating';
import { useToast } from '../components/ToastProvider';

function ReviewPage() {
  const { showToast } = useToast();
  const [confirmationCode, setConfirmationCode] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const code = confirmationCode.trim().toUpperCase();
    if (!code) {
      showToast('Enter a confirmation code', 'error');
      return;
    }

    if (!rating || rating < 0.5) {
      showToast('Select a star rating', 'error');
      return;
    }

    if (!comment.trim() || comment.trim().length < 3) {
      showToast('Please write a short review comment', 'error');
      return;
    }

    setLoading(true);

    try {
      const review = await createReview({
        confirmationCode: code,
        rating,
        comment: comment.trim(),
      });
      setSubmitted(review);
      setConfirmationCode(review.confirmationCode);
      showToast('Review submitted');
    } catch (err) {
      showToast(err.message || 'Could not submit review', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(null);
    setConfirmationCode('');
    setRating(0);
    setComment('');
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
          Leave a review
        </h1>
        <p className="mt-2 text-gray-500">
          Reviews can be added once, after the last day of your stay.
        </p>
      </div>

      {submitted ? (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-search">
          <p className="text-sm font-semibold text-emerald-700">Thank you</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Review submitted
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {submitted.confirmationCode}
            {submitted.room?.name ? ` · ${submitted.room.name}` : ''}
          </p>
          <div className="mt-4 flex justify-center">
            <StarRatingDisplay rating={Number(submitted.rating)} size="lg" />
          </div>
          <p className="mt-2 text-sm text-gray-500">{Number(submitted.rating)} / 5</p>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {submitted.comment}
          </p>
          <button type="button" onClick={resetForm} className="btn-primary mt-6">
            Write another review
          </button>
        </section>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-search sm:p-6"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Confirmation code
            </span>
            <input
              required
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
              placeholder="HTL-XXXXXX"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium tracking-wide text-gray-900 outline-none focus:border-gray-900 focus:bg-white"
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Rating
            </legend>
            <StarRatingInput value={rating} onChange={setRating} />
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Comment
            </span>
            <textarea
              required
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your stay?"
              className="w-full resize-y rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:bg-white"
            />
          </label>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      )}
    </main>
  );
}

export default ReviewPage;
