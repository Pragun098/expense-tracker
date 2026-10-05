import { CATEGORIES, fmt } from "../constants";

export default function Budget({ transactions, budgets, onChange, currency }) {
  const spent = (cat) => transactions.filter((t) => t.type === "expense" && t.category === cat).reduce((s, t) => s + t.amount, 0);
  return (
    <div className="card">
      <h2>Monthly budgets</h2>
      <p className="muted">Set a limit per category and track your spending.</p>
      {CATEGORIES.filter((c) => c !== "Salary").map((cat) => {
        const limit = parseFloat(budgets[cat]) || 0;
        const s = spent(cat);
        const pct = limit ? Math.min(100, (s / limit) * 100) : 0;
        return (
          <div key={cat} className="budget-row">
            <div className="row-fill">
              <strong>{cat}</strong>
              <input type="number" placeholder="Limit" value={budgets[cat] ?? ""}
                     onChange={(e) => onChange({ ...budgets, [cat]: e.target.value })} />
            </div>
            <div className="bar"><div className={`fill ${limit && s > limit ? "red-bg" : "green-bg"}`} style={{ width: `${pct}%` }} /></div>
            <small className="muted">{fmt(s, currency)} spent {limit ? `of ${fmt(limit, currency)}` : "(no limit set)"}</small>
          </div>
        );
      })}
    </div>
  );
}
