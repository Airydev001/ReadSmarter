import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import { useApp } from "../store";
import { lib, pdfStore } from "../lib/db";
import { splitSentences } from "../lib/sentences";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
const COLS = [["Green", "#8dc63f"], ["Yellow", "#fde047"], ["Pink", "#f9a8d4"], ["Blue", "#7dd3fc"], ["Orange", "#fdba74"]];
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;

export default function Read({ active }) {
  const { s, set, hooks, startTimer, bump, req, setReq, setPdfText } = useApp();
  const [pdf, setPdf] = useState(null), [name, setName] = useState(""), [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1), [fs, setFs] = useState(false), [speaking, setSpeaking] = useState(false);
  const [range, setRange] = useState(null), [rects, setRects] = useState([]), [rv, setRv] = useState(0), [w, setW] = useState(0);
  const [voices, setVoices] = useState([]), [drag, setDrag] = useState(false);
  const cv = useRef(), sheet = useRef(), vp = useRef(), info = useRef(null), job = useRef(0), rt = useRef(), hl = useRef();
  const spk = useRef(false), pg = useRef(1), canSpeak = "speechSynthesis" in window;
  spk.current = speaking; pg.current = page;

  // ---- open a PDF (from the toolbar, drag-drop, or the Library page) ----
  const stop = () => { job.current++; canSpeak && speechSynthesis.cancel(); setSpeaking(false); setRange(null); };
  const extractPdfText = async (doc) => {
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const words = content.items.filter((item) => item.str && item.str.trim()).map((item) => item.str.trim());
      if (words.length) text += words.join(" ") + " ";
    }
    return text.replace(/\s+/g, " ").trim();
  };
  const openFile = async (f, saved) => {
    try {
      const buf = await f.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
      const fullText = await extractPdfText(doc);
      stop(); info.current = null; setPdf(doc); setName(f.name); setPdfText(fullText);
      setPage(Math.min(+localStorage.getItem("pb-p:" + f.name) || 1, doc.numPages));
      if (!saved) lib.put(pdfStore, f.name + "|" + f.size, { name: f.name, blob: new Blob([buf], { type: "application/pdf" }) });
    } catch { alert("That file could not be opened. Choose a different PDF."); }
  };
  useEffect(() => { if (req) { openFile(req.file, req.saved); setReq(null); } }, [req]);
  useEffect(() => { if (name) localStorage.setItem("pb-p:" + name, page); }, [page, name]);
  const go = (n) => { if (!pdf || n < 1 || n > pdf.numPages || n === page) return; bump("pages", 1); setPage(n); if (spk.current) readFrom(n); };

  // ---- size + render ----
  useEffect(() => {
    const ro = new ResizeObserver(() => setW(sheet.current ? sheet.current.clientWidth : 0));
    ro.observe(sheet.current); return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!pdf || !active || !w) return;
    let dead = false;
    (async () => {
      const p = await pdf.getPage(page); if (dead) return;
      const base = p.getViewport({ scale: 1 });
      const v = p.getViewport({ scale: (Math.min(w - 28, fs ? 1400 : 900) / base.width) * zoom });
      const d = window.devicePixelRatio || 1, c = cv.current;
      c.width = v.width * d; c.height = v.height * d; c.style.width = v.width + "px"; c.style.height = v.height + "px";
      rt.current && rt.current.cancel();
      rt.current = p.render({ canvasContext: c.getContext("2d"), viewport: v, transform: d !== 1 ? [d, 0, 0, d, 0, 0] : null });
      try { await rt.current.promise; } catch { return; }
      if (!dead) { vp.current = v; setRv((x) => x + 1); }
    })();
    return () => { dead = true; };
  }, [pdf, page, zoom, fs, active, w]);

  // ---- sentence highlight rectangles ----
  useEffect(() => {
    const I = info.current;
    if (!range || !I || I.n !== page || !vp.current) { setRects([]); return; }
    const v = vp.current, out = [];
    I.items.forEach((it, k) => {
      const s0 = I.offs[k], e0 = s0 + it.str.length;
      if (e0 <= range.a || s0 >= range.b) return;
      const len = it.str.length, f0 = Math.max(range.a, s0) - s0, f1 = Math.min(range.b, e0) - s0;
      const tr = pdfjs.Util.transform(v.transform, it.transform), h = Math.hypot(tr[2], tr[3]), wd = it.width * v.scale;
      out.push({ x: tr[4] + (wd * f0) / len, y: tr[5] - h * 0.85, w: Math.max((wd * (f1 - f0)) / len, 2), h: h * 1.05 });
    });
    setRects(out);
  }, [range, rv, page]);
  useEffect(() => { const i = hl.current && hl.current.querySelector("i"); i && i.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [range]);

  // ---- read aloud, one sentence at a time ----
  useEffect(() => {
    if (!canSpeak) return;
    const load = () => setVoices(speechSynthesis.getVoices());
    load(); speechSynthesis.onvoiceschanged = load;
  }, []);
  const pageInfo = async (n) => {
    if (info.current && info.current.n === n) return info.current;
    const p = await pdf.getPage(n), items = (await p.getTextContent()).items.filter((i) => i.str);
    let full = ""; const offs = [];
    items.forEach((i) => { offs.push(full.length); full += i.str + " "; });
    return (info.current = { n, items, offs, full });
  };
  const readFrom = async (n) => {
    if (!pdf || !canSpeak) return;
    const my = ++job.current; speechSynthesis.cancel(); setSpeaking(true);
    const I = await pageInfo(n); if (my !== job.current) return;
    const parts = splitSentences(I.full); let i = 0;
    const next = () => {
      if (my !== job.current) return;
      if (i >= parts.length) { if (n < pdf.numPages) { bump("pages", 1); setPage(n + 1); readFrom(n + 1); } else stop(); return; }
      const sg = parts[i++];
      setRange((r) => (r && r.a === sg.a && r.b === sg.b ? r : { a: sg.a, b: sg.b }));
      const u = new SpeechSynthesisUtterance(I.full.slice(sg.a, sg.b));
      const v = speechSynthesis.getVoices().find((x) => x.name === s.voice); if (v) u.voice = v;
      u.rate = s.rate; u.onend = next; u.onerror = next; speechSynthesis.speak(u);
    };
    next();
  };
  hooks.current.isReading = () => spk.current;
  hooks.current.stop = stop;
  hooks.current.start = () => readFrom(pg.current);
  const toggleRead = () => { if (!pdf) return; if (speaking) { stop(); return; } startTimer(); readFrom(page); };

  // ---- full screen ----
  const toggleFs = async (on) => {
    setFs(on); document.body.style.overflow = on ? "hidden" : "";
    try {
      const el = document.documentElement;
      if (on && !fsEl()) { const f = el.requestFullscreen || el.webkitRequestFullscreen; f && await f.call(el); }
      if (!on && fsEl()) { const x = document.exitFullscreen || document.webkitExitFullscreen; x && await x.call(document); }
    } catch {}
  };
  useEffect(() => {
    const onChange = () => { if (!fsEl() && fs) toggleFs(false); };
    const onKey = (e) => {
      if (e.key === "Escape" && fs) toggleFs(false);
      if (!active || /INPUT|SELECT/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    document.addEventListener("fullscreenchange", onChange); document.addEventListener("webkitfullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("fullscreenchange", onChange); document.removeEventListener("webkitfullscreenchange", onChange); window.removeEventListener("keydown", onKey); };
  });

  return (
    <section>
      <p className="eyebrow">Read</p><h1 className="page">Your reader</h1>
      <div className="two">
        <div className={"rw" + (fs ? " fs" : "")}>
          <div className="bar">
            <label className="btn pri sm">Open PDF<input type="file" accept="application/pdf" hidden onChange={(e) => e.target.files[0] && openFile(e.target.files[0], false)} /></label>
            <button className="btn sm" onClick={() => go(page - 1)}>Previous</button>
            <input className="pg" type="number" min="1" max={pdf ? pdf.numPages : 1} value={page} onChange={(e) => go(+e.target.value)} aria-label="Page number" />
            <span className="muted">of {pdf ? pdf.numPages : 0}</span>
            <button className="btn sm" onClick={() => go(page + 1)}>Next</button>
            <button className="btn sm" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} aria-label="Zoom out">−</button>
            <button className="btn sm" onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))} aria-label="Zoom in">+</button>
            <span className="grow" />
            <button className="btn sm" onClick={toggleRead}>{speaking ? "Stop reading" : "Read aloud"}</button>
            <button className="btn sm" onClick={() => toggleFs(!fs)}>{fs ? "Exit full screen" : "Full screen"}</button>
          </div>
          <div ref={sheet} className={"sheet" + (drag ? " drag" : "")}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); e.dataTransfer.files[0] && openFile(e.dataTransfer.files[0], false); }}>
            {!pdf && <div className="empty"><h2>Drop a PDF here</h2><p>Or choose one from your device. ReadSmarter remembers your page.</p></div>}
            <div className="pagebox" hidden={!pdf}>
              <canvas ref={cv} />
              <div className="hl" ref={hl}>{rects.map((r, i) => <i key={i} style={{ left: r.x, top: r.y, width: r.w, height: r.h, background: s.hl }} />)}</div>
            </div>
          </div>
        </div>
        <details className="card tools" open>
          <summary>Reading tools</summary>
          <p className="muted">Highlight colour</p>
          <div className="sw">
            {COLS.map(([n, c]) => <button key={c} aria-label={n} aria-pressed={s.hl === c} style={{ background: c }} onClick={() => set({ hl: c })} />)}
            <input type="color" value={s.hl} onChange={(e) => set({ hl: e.target.value })} aria-label="Custom colour" />
          </div>
          <label className="lab">Voice
            <select value={s.voice} onChange={(e) => set({ voice: e.target.value })}>
              <option value="">Default</option>{voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
            </select>
          </label>
          <label className="lab">Speed
            <select value={s.rate} onChange={(e) => set({ rate: +e.target.value })}>{[0.8, 1, 1.25, 1.5].map((r) => <option key={r} value={r}>{r}×</option>)}</select>
          </label>
        </details>
      </div>
    </section>
  );
}
