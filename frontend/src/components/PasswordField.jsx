import { useId, useState } from 'react';

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 3l18 18M10.5 10.7a2 2 0 002.8 2.8M9.9 5.1A10.5 10.5 0 0112 5c5 0 9.3 3.1 10.5 7.5a11 11 0 01-4.2 5.1M6.1 6.1A11 11 0 001.5 12.5C2.7 16.9 7 20 12 20c1.4 0 2.7-.2 3.9-.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12.5C3.2 8.1 7.5 5 12.5 5S21.8 8.1 23 12.5C21.8 16.9 17.5 20 12.5 20S3.2 16.9 2 12.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12.5" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  required = false,
  minLength,
  name,
}) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="relative block">
        <input
          id={inputId}
          name={name}
          required={required}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          value={value}
          onChange={onChange}
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-12 text-sm outline-none focus:border-gray-900 focus:bg-white"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((open) => !open)}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 transition hover:text-gray-700"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={visible} />
        </button>
      </span>
    </label>
  );
}

export default PasswordField;
