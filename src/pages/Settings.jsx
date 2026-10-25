import { useApp } from "../store";

export default function Settings() {
  const { s, set } = useApp();
  return (
    <section>
      <p className="eyebrow">Settings</p><h1 className="page">Make it yours</h1>
      <div className="two">
        <div className="card"><h2>Appearance</h2>
          <div className="row">{["system", "light", "dark"].map((m) => <button key={m} className={"btn sm" + (s.theme === m ? " pri" : "")} onClick={() => set({ theme: m })}>{m[0].toUpperCase() + m.slice(1)}</button>)}</div>
          <p className="muted">Highlight colour and reading voice are on the Read page.</p>
        </div>
        <div className="card"><h2>Your data</h2>
          <p className="muted">There is no account. PDFs, songs and progress are stored only in this browser.</p>
          <button className="btn sm" onClick={() => { if (confirm("Reset settings and progress? Saved PDFs and songs are kept.")) { localStorage.clear(); location.reload(); } }}>Reset settings and progress</button>
        </div>
      </div>
    </section>
  );
}
