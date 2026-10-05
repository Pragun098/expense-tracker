import { useEffect, useRef, useState } from "react";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";

export default function Dashboard({ transactions, currency, onAdd, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    if (editing) dialogRef.current?.showModal();
  }, [editing]);
  const handleUpdate = (data) => {
    onUpdate(editing.id, data);
    setEditing(null);
  };
  return (
    <div className="grid">
      <TransactionForm onSubmit={onAdd} />
      <TransactionList transactions={transactions} currency={currency} onEdit={setEditing} onDelete={onDelete} />
      {editing && (
        <dialog ref={dialogRef} className="edit-dialog" aria-label="Edit transaction" onClose={() => setEditing(null)} onClick={(event) => { if (event.target === dialogRef.current) setEditing(null); }}>
            <button className="icon modal-close" type="button" aria-label="Close edit dialog" onClick={() => setEditing(null)}>×</button>
            <TransactionForm key={editing.id} editing={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </dialog>
      )}
    </div>
  );
}
