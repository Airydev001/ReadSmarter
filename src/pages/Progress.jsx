import { useApp } from "../store";
import { summary } from "../lib/stats";

export default function Progress() {
  const { days, s, set } = useApp();
  const x = summary(days, s.goal), mx = Math.max(s.goal, ...x.week.map((w) => w.m));
  return (
    <section>
      <p className="eyebrow">Progress</p><h1 className="page">Your reading habit</h1>
      <div className="two">
        <div className="card"><h2>This week (minutes)</h2>
          <div className="week">{x.week.map((w, i) => <div key={i} className="bc"><small>{w.m}</small><div className="b" style={{ height: Math.max(4, (w.m / mx) * 100) + "%" }} /><span>{w.l}</span></div>)}</div>
        </div>
        <div className="card"><h2>Daily goal</h2>
          <p className="stat">{x.t.min}<small> / {s.goal} min today</small></p>
          <label className="lab">Daily goal (minutes)<input type="number" min="5" max="600" value={s.goal} onChange={(e) => set({ goal: Math.min(600, Math.max(5, +e.target.value || 60)) })} /></label>
        </div>
      </div>
      <div className="grid3">
        <div className="card"><span className="muted">Streak</span><b className="stat">{x.streak}<small> days</small></b></div>
        <div className="card"><span className="muted">All-time minutes</span><b className="stat">{x.tot.min}</b></div>
        <div className="card"><span className="muted">All-time pages</span><b className="stat">{x.tot.pages}</b></div>
      </div>
    </section>
  );
}
