function FormError({ message }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
    >
      {message}
    </div>
  );
}

export default FormError;
