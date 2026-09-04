export const todayIso = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
};

export const addDaysIso = (isoDate, days) => {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
};

export const formatDisplayDate = (isoDate) => {
  if (!isoDate) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${isoDate}T12:00:00`));
};
