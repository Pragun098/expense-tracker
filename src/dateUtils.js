const monthNames = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(2020, index, 1))
);

export function parseTransactionDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) return new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]), 12);

  const dayMonth = text.match(/^(\d{1,2})\s+([a-z]+)(?:,?\s+(\d{4}))?$/i);
  if (dayMonth) {
    const month = monthNames.findIndex((name) => name.toLowerCase() === dayMonth[2].toLowerCase());
    if (month >= 0) return new Date(Number(dayMonth[3] || new Date().getFullYear()), month, Number(dayMonth[1]), 12);
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toDateInput(value) {
  const date = parseTransactionDate(value) || new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function transactionMonth(value) {
  const date = parseTransactionDate(value);
  if (!date) return null;
  return {
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date),
    date,
  };
}

export function displayTransactionDate(value) {
  const date = parseTransactionDate(value);
  return date
    ? new Intl.DateTimeFormat("en", { day: "numeric", month: "long" }).format(date)
    : value || "Date unavailable";
}