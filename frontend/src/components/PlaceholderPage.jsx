function PlaceholderPage({ title, body }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-3 text-gray-500">{body}</p>
    </main>
  );
}

export default PlaceholderPage;
