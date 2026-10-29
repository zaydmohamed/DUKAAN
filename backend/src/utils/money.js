/**
 * Money Utility Module
 * All internal monetary calculations and database amounts are stored in cents (integer minor units)
 * to avoid floating-point inaccuracies.
 */

// Convert decimal/float to integer cents
const toCents = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return 0;
  return Math.round(Number(amount) * 100);
};

// Convert integer cents to decimal dollars
const toDollars = (cents) => {
  if (cents === undefined || cents === null || isNaN(cents)) return 0;
  return Number((Number(cents) / 100).toFixed(2));
};

// Format cents as readable currency string
const formatCurrency = (cents, symbol = '$') => {
  const dollars = toDollars(cents);
  return `${symbol}${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Safe addition of cents
const addCents = (...centsArr) => {
  return centsArr.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
};

// Safe subtraction of cents
const subtractCents = (a, b) => {
  return (Number(a) || 0) - (Number(b) || 0);
};

// Safe multiplication of cents by unit quantity
const multiplyCents = (unitCents, quantity) => {
  return Math.round((Number(unitCents) || 0) * (Number(quantity) || 0));
};

// Safe division of cents by quantity, returning integer unit cents
const divideCents = (totalCents, quantity) => {
  if (!quantity || Number(quantity) === 0) return 0;
  return Math.round((Number(totalCents) || 0) / Number(quantity));
};

module.exports = {
  toCents,
  toDollars,
  formatCurrency,
  addCents,
  subtractCents,
  multiplyCents,
  divideCents,
};

