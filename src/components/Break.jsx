import { useApp } from "../store";
import { fmt } from "../lib/stats";

export default function Break() {
  const { t, plus, skip, now, tracks } = useApp();
  if (t.phase !== "break") return null;
  return (
    <div className="brk" role="dialog" aria-label="Break time">
      <h2>Break time</h2>
      <div className="big-num">{fmt(t.left)}</div>
      <p>{tracks.length && now ? "Now playing: " + now : "Stretch, drink water, look away from the screen."}</p>
      <div className="row">
        <button className="btn" onClick={plus}>Add 1 minute</button>
        <button className="btn" onClick={skip}>Back to reading</button>
      </div>
    </div>
  );
}
