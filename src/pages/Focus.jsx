import { useApp } from "../store";
import { fmt } from "../lib/stats";

const C = 326.7;
const P = [[25, 5], [50, 10], [15, 3], [5, 2]];
const clamp = (v, a, b, d) => Math.min(b, Math.max(a, +v || d));

export default function Focus() {
  const { s, set, t, toggle, reset } = useApp();
  const label = { idle: "Ready", focus: "Reading", break: "Break" }[t.phase] + (t.phase !== "idle" && !t.running ? " (paused)" : "");
  return (
    <section>
      <p className="eyebrow">Focus</p><h1 className="page">Your focus timer</h1>
      <div className="two">
        <div className="card center-text">
          <div className="ring">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="52" className="track" />
              <circle cx="60" cy="60" r="52" className="arc" strokeDasharray={C} strokeDashoffset={C * (1 - t.left / t.total)} />
            </svg>
            <div className="t"><div className="big-num">{fmt(t.left)}</div><div className="muted">{label}</div></div>
          </div>
          <div className="row center">
            <button className="btn pri" onClick={toggle}>{t.running ? "Pause" : t.phase === "idle" ? "Start" : "Resume"}</button>
            <button className="btn" onClick={reset}>Reset</button>
          </div>
        </div>
        <div className="card">
          <h2>Set your rhythm</h2>
          <div className="row">{P.map(([a, b]) => <button key={a} className="btn sm" onClick={() => set({ focus: a, brk: b })}>{a} / {b}</button>)}</div>
          <div className="fields">
            <label>Read for (minutes)<input type="number" min="1" max="180" value={s.focus} onChange={(e) => set({ focus: clamp(e.target.value, 1, 180, 25) })} /></label>
            <label>Break for (minutes)<input type="number" min="1" max="60" value={s.brk} onChange={(e) => set({ brk: clamp(e.target.value, 1, 60, 5) })} /></label>
          </div>
          <label className="chk"><input type="checkbox" checked={s.auto} onChange={(e) => set({ auto: e.target.checked })} /> Start the next session after each break</label>
        </div>
      </div>
    </section>
  );
}
