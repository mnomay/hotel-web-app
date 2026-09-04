async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.status = response.status;
    error.code = data?.code;
    error.data = data;
    throw error;
  }

  return data;
}

export const getAvailability = (checkIn, checkOut) =>
  request(
    `/api/rooms/availability?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`,
  );

export const createBooking = (payload) =>
  request('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
