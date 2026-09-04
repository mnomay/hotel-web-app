async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
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
      if (text.includes('<!DOCTYPE') || text.includes('Cannot GET')) {
        data = { message: 'Booking not found' };
      } else {
        data = { message: text };
      }
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

export const getBooking = (confirmationCode) => {
  const code = String(confirmationCode || '').trim();
  if (!code) {
    const error = new Error('Enter a confirmation code');
    error.status = 400;
    error.code = 'INVALID_CODE';
    return Promise.reject(error);
  }

  return request(`/api/bookings/${encodeURIComponent(code)}`);
};

export const cancelBooking = (confirmationCode) =>
  request(`/api/bookings/${encodeURIComponent(confirmationCode)}/cancel`, {
    method: 'POST',
  });

export const updateDinners = (confirmationCode, dinners) =>
  request(`/api/bookings/${encodeURIComponent(confirmationCode)}/dinners`, {
    method: 'PUT',
    body: JSON.stringify({ dinners }),
  });

export const createReview = (payload) =>
  request('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const adminLogin = (email, password) =>
  request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const adminLogout = () =>
  request('/api/admin/logout', {
    method: 'POST',
  });

export const getAdminMe = () => request('/api/admin/me');

export const getAdminOverview = (from, to) =>
  request(
    `/api/admin/overview?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );

export const getAdminBooking = (confirmationCode) => {
  const code = String(confirmationCode || '').trim();
  if (!code) {
    const error = new Error('Confirmation code required');
    error.statusCode = 400;
    return Promise.reject(error);
  }

  return request(`/api/admin/bookings/${encodeURIComponent(code)}`);
};
