import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { api } from "./api";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Budget from "./pages/Budget";
import Settings from "./pages/Settings";

// Root component: owns all shared state and passes it down via props.
export default function App() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [theme, setTheme] = useState("dark");
  const [currency, setCurrency] = useState("$");
  const [ready, setReady] = useState(false);
  const [apiError, setApiError] = useState("");

  const loadUserData = async (nextUser) => {
    const data = await api.getData();
    setUser(nextUser);
    setTransactions(data.transactions || []);
    setBudgets(data.budgets || {});
    setTheme(data.theme || "dark");
    setCurrency(data.currency || "$");
    setApiError("");
  };

  useEffect(() => {
    let active = true;
    api.getSession()
      .then(async ({ user: sessionUser }) => {
        if (sessionUser) await loadUserData(sessionUser);
      })
      .catch((error) => { if (active) setApiError(error.message); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  // useEffect: apply theme to <html>
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  const runApi = async (operation, onSuccess) => {
    try {
      const result = await operation();
      onSuccess?.(result);
      setApiError("");
    } catch (error) {
      setApiError(error.message);
    }
  };
  const signIn = async (credentials, mode) => {
    const result = await (mode === "signup" ? api.signup(credentials) : api.login(credentials));
    await loadUserData(result.user);
  };
  const signInAsGuest = async () => {
    const result = await api.guest();
    await loadUserData(result.user);
  };
  const addTransaction = (transaction) => runApi(() => api.addTransaction(transaction), (created) => setTransactions((prev) => [created, ...prev]));
  const updateTransaction = (id, changes) => runApi(() => api.updateTransaction(id, changes), (updated) => setTransactions((prev) => prev.map((item) => item.id === id ? updated : item)));
  const deleteTransaction = (id) => runApi(() => api.deleteTransaction(id), () => setTransactions((prev) => prev.filter((item) => item.id !== id)));
  const changeBudgets = (nextBudgets) => {
    setBudgets(nextBudgets);
    runApi(() => api.updateData({ budgets: nextBudgets }));
  };
  const changeTheme = (nextTheme) => {
    setTheme(nextTheme);
    if (user) runApi(() => api.updateData({ theme: nextTheme }));
  };
  const changeCurrency = (nextCurrency) => {
    setCurrency(nextCurrency);
    runApi(() => api.updateData({ currency: nextCurrency }));
  };
  const toggleTheme = () => changeTheme(theme === "dark" ? "light" : "dark");
  const logout = () => runApi(api.logout, () => setUser(null));

  if (!ready) return <div className="container"><p>Connecting to the expense tracker API...</p></div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={signIn} onGuest={signInAsGuest} onToggleTheme={toggleTheme} theme={theme} apiError={apiError} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout user={user} onLogout={logout}
              transactions={transactions} currency={currency} apiError={apiError} />}>
        <Route path="/" element={<Dashboard transactions={transactions} currency={currency}
                 onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} />} />
        <Route path="/reports" element={<Reports transactions={transactions} currency={currency} />} />
        <Route path="/budget" element={<Budget transactions={transactions} budgets={budgets} onChange={changeBudgets} currency={currency} />} />
        <Route path="/settings" element={<Settings user={user} transactions={transactions} budgets={budgets} theme={theme} onTheme={changeTheme} currency={currency}
           onCurrency={changeCurrency} onReset={() => runApi(api.resetTransactions, () => setTransactions([]))} onLogout={logout} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
