export const formatMoney = (cents) => {
  const amount = (Number(cents) || 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
