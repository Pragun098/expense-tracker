export const CATEGORIES = ["Food", "Transport", "Entertainment", "Shopping", "Bills", "Salary", "Other"];
export const CURRENCIES = ["$", "₹", "€", "£"];
export const fmt = (n, c = "$") => `${c}${Number(n).toFixed(2)}`;
