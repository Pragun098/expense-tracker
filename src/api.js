async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "The request could not be completed.");
  return payload;
}

export const api = {
  getSession: () => request("/api/auth/me"),
  login: (credentials) => request("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  signup: (credentials) => request("/api/auth/signup", { method: "POST", body: JSON.stringify(credentials) }),
  guest: () => request("/api/auth/guest", { method: "POST" }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  getData: () => request("/api/data"),
  updateData: (changes) => request("/api/data", { method: "PATCH", body: JSON.stringify(changes) }),
  addTransaction: (transaction) => request("/api/transactions", { method: "POST", body: JSON.stringify(transaction) }),
  updateTransaction: (id, changes) => request(`/api/transactions/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(changes) }),
  deleteTransaction: (id) => request(`/api/transactions/${encodeURIComponent(id)}`, { method: "DELETE" }),
  resetTransactions: () => request("/api/transactions", { method: "DELETE" }),
};