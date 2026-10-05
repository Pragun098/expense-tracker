import { useState, useEffect } from "react";
import { CATEGORIES } from "../constants";
import { toDateInput } from "../dateUtils";

const empty = () => ({ description: "", amount: "", type: "expense", category: "Food", date: toDateInput() });

// Controlled form: every input is bound to state; validation on submit
export default function TransactionForm({ editing, onSubmit, onCancel }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  // useEffect: fill the form when a transaction is chosen for editing
  useEffect(() => {
    setForm(editing ? { ...editing, amount: String(editing.amount), date: toDateInput(editing.date) } : empty());
    setError("");
  }, [editing]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.description.trim()) return setError("Enter a description.");
    if (!(amount > 0)) return setError("Amount must be greater than 0.");
    onSubmit({ description: form.description.trim(), amount, type: form.type, category: form.category, date: form.date });
    setForm(empty());
    setError("");
  };

  return (
    <form className="card transaction-form" onSubmit={handleSubmit}>
      <h2 className="form-heading">{editing ? "Edit Transaction" : "Add Transaction"}</h2>
      <label className="form-wide">Description
        <input name="description" value={form.description} onChange={handleChange} placeholder="E.g. Groceries" />
      </label>
      <label>Amount
        <input name="amount" type="number" step="0.01" value={form.amount} onChange={handleChange} placeholder="0.00" />
      </label>
      <label>Date
        <input name="date" type="date" value={form.date} onChange={handleChange} />
      </label>
      <label>Type
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </label>
      <label>Category
        <select name="category" value={form.category} onChange={handleChange}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      {error && <p className="error form-error">{error}</p>}
      <button className="btn primary" type="submit">{editing ? "Save changes" : "Add Transaction"}</button>
      {editing && <button className="btn" type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
}
