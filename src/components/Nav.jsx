import { NavLink } from "react-router-dom";
import { useApp } from "../store";
import { fmt } from "../lib/stats";

const L = [["/", "Home"], ["/read", "Read"], ["/focus", "Focus"], ["/music", "Music"], ["/library", "Library"], ["/progress", "Progress"], ["/settings", "Settings"]];

export default function Nav() {
  const { t } = useApp();
  return (
    <>
      <header className="nav">
        <div className="in">
          <NavLink to="/" className="logo">ReadSmarter</NavLink>
          <nav className="links" aria-label="Main">
            {L.map(([p, n]) => <NavLink key={p} to={p} end={p === "/"}>{n}</NavLink>)}
          </nav>
          <NavLink to="/focus" className="pill" aria-label="Timer">{fmt(t.left)}{t.phase === "break" ? " · break" : ""}</NavLink>
        </div>
      </header>
      <nav className="tabs" aria-label="Main tabs">
        {L.slice(0, 6).map(([p, n]) => <NavLink key={p} to={p} end={p === "/"}>{n}</NavLink>)}
      </nav>
    </>
  );
}
