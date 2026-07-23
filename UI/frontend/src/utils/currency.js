export const formatCurrency = (value) => {
  const numericValue = Number(value);

  if (value === null || value === undefined || Number.isNaN(numericValue)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};
