function StarIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M12 2.5l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.8l1-6.1L3.2 9l6.1-.9L12 2.5z" />
    </svg>
  );
}

function StarRatingDisplay({ rating, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'h-7 w-7' : 'h-6 w-6';

  return (
    <div className="inline-flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill =
          rating >= star ? 100 : rating >= star - 0.5 ? 50 : 0;

        return (
          <span key={star} className={`relative inline-block ${sizeClass}`}>
            <StarIcon className="absolute inset-0 text-gray-200" />
            <span
              className="absolute inset-0 overflow-hidden text-amber-400"
              style={{ width: `${fill}%` }}
            >
              <StarIcon className={sizeClass} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function StarRatingInput({ value, onChange }) {
  return (
    <div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill =
            value >= star ? 100 : value >= star - 0.5 ? 50 : 0;

          return (
            <div key={star} className="relative h-9 w-9">
              <StarIcon className="pointer-events-none absolute inset-0 h-9 w-9 text-gray-200" />
              <span
                className="pointer-events-none absolute inset-0 overflow-hidden text-amber-400"
                style={{ width: `${fill}%` }}
              >
                <StarIcon className="h-9 w-9" />
              </span>
              <button
                type="button"
                aria-label={`${star - 0.5} stars`}
                onClick={() => onChange(star - 0.5)}
                className="absolute inset-y-0 left-0 z-10 w-1/2 rounded-l-sm"
              />
              <button
                type="button"
                aria-label={`${star} stars`}
                onClick={() => onChange(star)}
                className="absolute inset-y-0 right-0 z-10 w-1/2 rounded-r-sm"
              />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {value ? `${value} / 5` : 'Select a rating'} · click left/right half of a star for half or full
      </p>
    </div>
  );
}

export { StarRatingDisplay, StarRatingInput };
