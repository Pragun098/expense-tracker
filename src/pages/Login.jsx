import { useState } from "react";

export default function Login({ onLogin, onGuest, onToggleTheme, theme, apiError }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!email.includes("@") || form.password.length < 4) return setError("Enter a valid email and a password of 4+ characters.");
    setError("");
    try {
      await onLogin({ email, password: form.password }, mode);
    } catch (error) {
      setError(error.message);
    }
  };
  const handleGuest = async () => {
    setError("");
    try { await onGuest(); } catch (error) { setError(error.message); }
  };

  return (
    <div className="container">
      <header className="topbar"><span>💰 Expense Tracker</span>
        <button className="pill" onClick={onToggleTheme}>{theme === "dark" ? "☀️ Light" : "🌙 Dark"}</button></header>
      <form className="card auth" onSubmit={handleSubmit}>
        <h2 className="center">Welcome 👋</h2>
        <div className="toggle">
          <button type="button" className={"btn" + (mode === "login" ? " primary" : "")} onClick={() => setMode("login")}>Log in</button>
          <button type="button" className={"btn" + (mode === "signup" ? " primary" : "")} onClick={() => setMode("signup")}>Sign up</button>
        </div>
        <label>Email<input name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" /></label>
        <label>Password<input name="password" type="password" value={form.password} onChange={handleChange} /></label>
        {(error || apiError) && <p className="error">{error || apiError}</p>}
        <button className="btn primary" type="submit">{mode === "login" ? "Log in" : "Create account"}</button>
        <button className="btn" type="button" onClick={handleGuest}>Continue as guest</button>
      </form>
    </div>
  );
}
