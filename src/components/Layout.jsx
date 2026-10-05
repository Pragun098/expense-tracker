import { NavLink, Outlet } from "react-router-dom";
import Header from "./Header";
import SummaryCards from "./SummaryCards";

// Parent component: renders child components + nested route via <Outlet />
export default function Layout({ user, onLogout, transactions, currency, apiError }) {
  const sum = (type) => transactions.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
  const tabs = [["/", "Dashboard"], ["/reports", "Reports"], ["/budget", "Budget"], ["/settings", "Settings"]];
  return (
    <div className="container">
      <Header user={user} onLogout={onLogout} />
      <div className="page-heading">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">ET</span>
          <div><p className="eyebrow">PERSONAL FINANCE</p><h1>Expense Tracker</h1></div>
        </div>
        <nav className="tabs" aria-label="Main navigation">
          {tabs.map(([to, label]) => (
            <NavLink key={to} to={to} end className={({ isActive }) => "pill" + (isActive ? " active" : "")}>{label}</NavLink>
          ))}
        </nav>
      </div>
      <SummaryCards income={sum("income")} expense={sum("expense")} currency={currency} />
      {apiError && <p className="error">{apiError}</p>}
      <Outlet />
    </div>
  );
}
