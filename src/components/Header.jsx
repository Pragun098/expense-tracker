import { useState, useEffect } from "react";

// Functional component with useState + useEffect (live clock)
export default function Header({ user, onLogout }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id); // cleanup on unmount
  }, []);
  return (
    <header className="topbar">
      <div className="profile-identity">
        <span className="profile-avatar" aria-hidden="true">{user.name?.trim().charAt(0).toUpperCase() || "U"}</span>
        <span>{user.name}</span>
      </div>
      <div className="row">
        <small className="topbar-time">{now.toLocaleString()}</small>
        <button className="pill logout-button" type="button" onClick={onLogout}>Log out</button>
      </div>
    </header>
  );
}
