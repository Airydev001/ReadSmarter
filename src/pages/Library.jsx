import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store";
import { lib, pdfStore } from "../lib/db";

export default function Library() {
  const nav = useNavigate(), { setReq } = useApp();
  const [a, setA] = useState([]);
  const refresh = () => lib.list(pdfStore).then((x) => setA(x.reverse()));
  useEffect(() => { refresh(); }, []);
  const open = (r, saved) => { setReq({ file: saved ? new File([r.blob], r.name, { type: "application/pdf" }) : r, saved }); nav("/read"); };
  return (
    <section>
      <p className="eyebrow">Library</p><h1 className="page">Your saved PDFs</h1>
      <div className="card">
        <label className="btn pri sm">Add a PDF<input type="file" accept="application/pdf" hidden onChange={(e) => e.target.files[0] && open(e.target.files[0], false)} /></label>
        <ul className="list">
          {a.map((r) => (
            <li key={r.id}><span>{r.name}</span>
              <span className="row"><button className="btn sm" onClick={() => open(r, true)}>Open</button><button className="btn sm" onClick={async () => { await lib.del(pdfStore, r.id); refresh(); }}>Delete</button></span>
            </li>
          ))}
        </ul>
        {!a.length && <p className="muted">PDFs you open are saved here on this device.</p>}
      </div>
    </section>
  );
}
