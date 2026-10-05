import { CURRENCIES } from "../constants";

function downloadFile(content, type, filename) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  let text = String(value ?? "");
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export default function Settings({ user, theme, onTheme, currency, onCurrency, onReset, onLogout, transactions, budgets }) {
  const exportCsv = () => {
    const columns = ["Description", "Amount", "Type", "Category", "Date"];
    const rows = transactions.map(({ description, amount, type, category, date }) => [description, amount, type, category, date]);
    const csv = [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    downloadFile(`\uFEFF${csv}`, "text/csv;charset=utf-8", "expense-transactions.csv");
  };

  const exportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      transactions,
      budgets,
      preferences: { theme, currency },
    };
    downloadFile(JSON.stringify(backup, null, 2), "application/json", "expense-tracker-backup.json");
  };

  const reset = () => {
    if (window.confirm(`Delete all ${transactions.length} transactions? Your budgets and settings will stay unchanged.`)) onReset();
  };

  return (
    <main className="settings-page">
      <header className="settings-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h2>Settings</h2>
          <p className="muted">Manage your preferences and keep your records in your hands.</p>
        </div>
      </header>

      <section className="settings-section account-section" aria-labelledby="account-heading">
        <div className="settings-section-heading">
          <span className="settings-index">01</span>
          <div><h3 id="account-heading">Account</h3><p className="muted">Signed-in profile</p></div>
        </div>
        <div className="account-details">
          <div className="account-avatar" aria-hidden="true">{user.name?.trim().charAt(0).toUpperCase() || "U"}</div>
          <div><strong>{user.name}</strong><p className="muted">{user.email}</p></div>
          <button className="btn settings-secondary" type="button" onClick={onLogout}>Log out</button>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="preferences-heading">
        <div className="settings-section-heading">
          <span className="settings-index">02</span>
          <div><h3 id="preferences-heading">Preferences</h3><p className="muted">Tune the app to your everyday use</p></div>
        </div>
        <div className="settings-controls">
          <div className="settings-control-row">
            <div><strong>Color theme</strong><p className="muted">Choose how Expense Tracker looks</p></div>
            <div className="segmented-control" role="group" aria-label="Color theme">
              {[ ["light", "Light"], ["dark", "Dark"] ].map(([value, label]) => (
                <button key={value} type="button" className={theme === value ? "selected" : ""} aria-pressed={theme === value} onClick={() => onTheme(value)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="settings-control-row">
            <div><strong>Display currency</strong><p className="muted">Used across summaries and reports</p></div>
            <label className="currency-select">
              <span className="visually-hidden">Display currency</span>
              <select value={currency} onChange={(event) => onCurrency(event.target.value)}>
                {CURRENCIES.map((value) => <option key={value} value={value}>{value} {value === "$" ? "US Dollar" : value === "₹" ? "Indian Rupee" : value === "€" ? "Euro" : "British Pound"}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="data-heading">
        <div className="settings-section-heading">
          <span className="settings-index">03</span>
          <div><h3 id="data-heading">Your data</h3><p className="muted">{transactions.length} transactions · {Object.keys(budgets).length} budget categories</p></div>
        </div>
        <div className="data-actions">
          <div><strong>Take your data with you</strong><p className="muted">Download a spreadsheet or a complete backup.</p></div>
          <div className="data-buttons">
            <button className="btn settings-secondary" type="button" onClick={exportCsv}>Export CSV</button>
            <button className="btn settings-secondary" type="button" onClick={exportBackup}>Download backup</button>
          </div>
        </div>
        <div className="settings-control-row danger-row">
          <div><strong>Delete transaction history</strong><p className="muted">This does not remove your budgets or preferences.</p></div>
          <button className="btn danger-button" type="button" onClick={reset} disabled={transactions.length === 0}>Delete transactions</button>
        </div>
      </section>
    </main>
  );
}
