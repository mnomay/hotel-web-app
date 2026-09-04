/** @param {Date | string} value */
export const formatDateOnly = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
};

/** @param {string} yyyyMmDd */
export const toDateOnly = (yyyyMmDd) => new Date(`${yyyyMmDd}T00:00:00.000Z`);

export const addDays = (date, days) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

/** Nights in [checkIn, checkOut) as YYYY-MM-DD strings. */
export const eachNight = (checkIn, checkOut) => {
  const nights = [];
  let cursor = toDateOnly(formatDateOnly(checkIn));
  const end = toDateOnly(formatDateOnly(checkOut));

  while (cursor < end) {
    nights.push(formatDateOnly(cursor));
    cursor = addDays(cursor, 1);
  }

  return nights;
};

export const nightCount = (checkIn, checkOut) => eachNight(checkIn, checkOut).length;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const isValidDateOnly = (value) => {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) {
    return false;
  }

  const parsed = toDateOnly(value);
  return !Number.isNaN(parsed.getTime()) && formatDateOnly(parsed) === value;
};
