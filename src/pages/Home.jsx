import { Link } from "react-router-dom";
import { useApp } from "../store";
import { summary } from "../lib/stats";

const F = [
  ["/read", "Read", "A PDF reader that reads aloud, highlighting one sentence at a time."],
  ["/focus", "Focus", "Set your own reading and break lengths."],
  ["/music", "Music", "Your own songs fade in on every break."],
  ["/library", "Library", "PDFs and songs saved on your device."],
  ["/progress", "Progress", "A daily goal, a streak and a weekly view."],
  ["/settings", "Settings", "Light, dark and your data."],
];

export default function Home() {
  const { days, s } = useApp();
  const x = summary(days, s.goal);
  return (
    <section>
      <div className="hero">
        <p className="eyebrow">Your reading companion</p>
        <h1>Read in bursts.<br />Rest on purpose.</h1>
        <p className="lead">Open any PDF, set your own focus and break times, and let your own music take over when it is time to rest.</p>
        <div className="row center">
          <Link className="btn pri" to="/read">Open a PDF</Link>
          <Link className="btn" to="/focus">Start focus</Link>
        </div>
      </div>
      <div className="grid3">
        <div className="card"><span className="muted">Today</span><b className="stat">{x.t.min}<small> / {s.goal} min</small></b></div>
        <div className="card"><span className="muted">Streak</span><b className="stat">{x.streak}<small> days</small></b></div>
        <div className="card"><span className="muted">Pages today</span><b className="stat">{x.t.pages}</b></div>
      </div>
      <div className="feats">
        {F.map(([to, t, d]) => <Link key={to} to={to} className="feat"><h3>{t}</h3><p>{d}</p></Link>)}
      </div>
    </section>
  );
}
