import { Component } from "react";
import { fmt } from "../constants";

// CLASS component (props + render) — child of Layout
export default class SummaryCards extends Component {
  render() {
    const { income, expense, currency } = this.props;
    const cards = [["Total Balance", income - expense, "blue"], ["Income", income, "green"], ["Expense", expense, "red"]];
    return (
      <section className="cards">
        {cards.map(([label, value, color]) => (
          <div className={`card summary-card summary-${color}`} key={label}>
            <span className="muted">{label}</span>
            <div className={`big ${color}`}>{fmt(value, currency)}</div>
          </div>
        ))}
      </section>
    );
  }
}
