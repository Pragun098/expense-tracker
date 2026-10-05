import { fmt } from "../constants";
import { displayTransactionDate } from "../dateUtils";

// Child component: receives data + callbacks as props, raises events to parent
export default function TransactionItem({ tx, currency, onEdit, onDelete }) {
  const isIncome = tx.type === "income";
  const hue = [...tx.description].reduce((value, character) => (value * 31 + character.charCodeAt(0)) % 360, 0);
  return (
    <li className="tx">
      <div className="tx-main">
        <span className="tx-avatar" style={{ "--avatar-hue": hue }} aria-hidden="true">{tx.description.trim().charAt(0).toUpperCase() || "?"}</span>
        <div className="tx-copy">
          <strong>{tx.description}</strong>
          <div className="muted small">{tx.category} • {displayTransactionDate(tx.date)}</div>
        </div>
      </div>
      <div className="row">
        <span className={isIncome ? "green" : "red"}>{isIncome ? "+" : "-"}{fmt(tx.amount, currency)}</span>
        <button className="icon" type="button" title="Edit" aria-label={`Edit ${tx.description}`} onClick={() => onEdit(tx)}>✏️</button>
        <button className="icon" type="button" title="Delete" aria-label={`Delete ${tx.description}`} onClick={() => onDelete(tx.id)}>🗑️</button>
      </div>
    </li>
  );
}
