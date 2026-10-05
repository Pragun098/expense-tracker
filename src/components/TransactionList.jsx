import { useState } from "react";
import { CATEGORIES, fmt } from "../constants";
import { transactionMonth } from "../dateUtils";
import TransactionItem from "./TransactionItem";

export default function TransactionList({ transactions, currency, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [month, setMonth] = useState("All");
  const visible = transactions.filter((t) =>
    t.description.toLowerCase().includes(search.toLowerCase()) && (category === "All" || t.category === category));
  const availableMonths = [...new Map(transactions.map((transaction) => {
    const parsed = transactionMonth(transaction.date);
    return parsed ? [parsed.key, parsed] : null;
  }).filter(Boolean))].sort(([keyA], [keyB]) => keyB.localeCompare(keyA));
  const selectedMonth = availableMonths.some(([key]) => key === month) ? month : "All";
  const grouped = new Map();
  visible.forEach((transaction) => {
    const parsed = transactionMonth(transaction.date);
    const key = parsed?.key || "undated";
    if (!grouped.has(key)) grouped.set(key, { key, label: parsed?.label || "Date unavailable", transactions: [], sortKey: parsed?.date.getTime() || 0 });
    grouped.get(key).transactions.push(transaction);
  });
  const groups = [...grouped.values()]
    .filter((group) => selectedMonth === "All" || group.key === selectedMonth)
    .sort((a, b) => b.sortKey - a.sortKey);
  const displayedCount = groups.reduce((count, group) => count + group.transactions.length, 0);

  return (
    <div className="card">
      <div className="transactions-title"><h2>Transactions</h2><span className="muted small">{displayedCount} records</span></div>
      <div className="filters">
        <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={selectedMonth} onChange={(e) => setMonth(e.target.value)} aria-label="Filter by month">
          <option value="All">All Months</option>
          {availableMonths.map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
        </select>
      </div>
      <div className="transaction-scroll">
        {groups.length === 0 ? <p className="muted">No transactions match these filters.</p> : groups.map((group) => {
        const income = group.transactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0);
        const expense = group.transactions.filter((transaction) => transaction.type !== "income").reduce((sum, transaction) => sum + transaction.amount, 0);
        return (
          <section className="month-group" key={group.key}>
            <header className="month-heading">
              <div><h3>{group.label}</h3><span className="muted small">{group.transactions.length} transactions</span></div>
              <div className="month-totals">
                <strong className={income - expense >= 0 ? "green" : "red"}>{income - expense >= 0 ? "+" : "−"}{fmt(Math.abs(income - expense), currency)}</strong>
                <span className="muted small">In {fmt(income, currency)} · Out {fmt(expense, currency)}</span>
              </div>
            </header>
            <ul>{group.transactions.map((transaction) => (
              <TransactionItem key={transaction.id} tx={transaction} currency={currency} onEdit={onEdit} onDelete={onDelete} />
            ))}</ul>
          </section>
        );
        })}
      </div>
    </div>
  );
}
