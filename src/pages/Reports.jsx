import { fmt } from "../constants";
import { transactionMonth } from "../dateUtils";

export default function Reports({ transactions, currency }) {
  const expenses = transactions.filter((t) => t.type === "expense");
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const byCat = expenses.reduce((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + t.amount }), {});
  const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const monthlyTotals = new Map();
  transactions.forEach((transaction) => {
    const month = transactionMonth(transaction.date);
    if (!month) return;
    if (!monthlyTotals.has(month.key)) monthlyTotals.set(month.key, { ...month, income: 0, expense: 0 });
    const totals = monthlyTotals.get(month.key);
    totals[transaction.type === "income" ? "income" : "expense"] += transaction.amount;
  });
  const months = [...monthlyTotals.values()].sort((a, b) => a.date - b.date).slice(-6);
  const maxMonthlyTotal = Math.max(0, ...months.flatMap(({ income, expense }) => [income, expense]));

  return (
    <main className="reports-page">
      <section className="card cashflow-report" aria-labelledby="cashflow-title">
        <div className="report-heading">
          <div>
            <p className="eyebrow">MONTHLY OVERVIEW</p>
            <h2 id="cashflow-title">Income vs. expenses</h2>
            <p className="muted">A month-by-month view of your cash flow</p>
          </div>
          <div className="chart-legend" aria-hidden="true">
            <span><i className="legend-dot income-dot" />Income</span>
            <span><i className="legend-dot expense-dot" />Expenses</span>
          </div>
        </div>
        {months.length === 0 ? (
          <p className="muted chart-empty">Add dated transactions to see your monthly cash flow.</p>
        ) : (
          <div className="cashflow-chart" role="img" aria-label={`Monthly income and expenses for ${months.map((month) => `${month.label}: income ${fmt(month.income, currency)}, expenses ${fmt(month.expense, currency)}`).join("; ")}`}>
            {months.map((month) => {
              const incomeHeight = maxMonthlyTotal ? month.income / maxMonthlyTotal * 100 : 0;
              const expenseHeight = maxMonthlyTotal ? month.expense / maxMonthlyTotal * 100 : 0;
              return (
                <div className="cashflow-month" key={month.key}>
                  <div className="cashflow-bars">
                    <div className="cashflow-bar income-bar" style={{ height: `${incomeHeight}%` }} title={`Income: ${fmt(month.income, currency)}`} />
                    <div className="cashflow-bar expense-bar" style={{ height: `${expenseHeight}%` }} title={`Expenses: ${fmt(month.expense, currency)}`} />
                  </div>
                  <span className="cashflow-month-name">{new Intl.DateTimeFormat("en", { month: "short" }).format(month.date)}</span>
                  <span className="cashflow-year">{month.date.getFullYear()}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card spending-report" aria-labelledby="spending-title">
        <div className="report-heading">
          <div>
            <p className="eyebrow">SPENDING BREAKDOWN</p>
            <h2 id="spending-title">Spending by category</h2>
          </div>
          <strong className="report-total">{fmt(total, currency)} <span className="muted">total</span></strong>
        </div>
        {rows.length === 0 && <p className="muted">No expenses to report yet.</p>}
        {rows.map(([cat, amt]) => {
          const pct = Math.round((amt / total) * 100);
          return (
            <div key={cat} className="bar-row">
              <div className="category-label"><strong>{cat}</strong><span className="muted">{fmt(amt, currency)} <span className="category-percent">{pct}%</span></span></div>
              <div className="bar"><div className="fill red-bg" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
