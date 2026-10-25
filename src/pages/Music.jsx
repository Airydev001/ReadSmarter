import { useApp } from "../store";

export default function Music() {
  const { s, set, tracks, addSongs, removeSong, now } = useApp();
  return (
    <section>
      <p className="eyebrow">Music</p><h1 className="page">Break music</h1>
      <div className="two">
        <div className="card">
          <h2>Your songs</h2>
          <label className="btn pri sm">Add your songs<input type="file" accept="audio/*" multiple hidden onChange={(e) => { addSongs([...e.target.files]); e.target.value = ""; }} /></label>
          <ul className="list">
            {tracks.map((x) => <li key={x.id} className={x.name === now ? "on" : ""}><span>{x.name}</span><button className="btn sm" onClick={() => removeSong(x.id)}>Remove</button></li>)}
          </ul>
          {!tracks.length && <p className="muted">No songs yet. Add some and they will play on your breaks.</p>}
          <label className="chk"><input type="checkbox" checked={s.shuffle} onChange={(e) => set({ shuffle: e.target.checked })} /> Shuffle</label>
          <label className="lab">Volume<input type="range" min="0" max="1" step="0.05" value={s.vol} onChange={(e) => set({ vol: +e.target.value })} /></label>
        </div>
        <div className="card"><h2>How breaks sound</h2><p className="muted">Music fades in over three seconds when your break starts and fades out as it ends. Reading aloud pauses and resumes after. Songs are saved on this device only and never uploaded.</p></div>
      </div>
    </section>
  );
}
