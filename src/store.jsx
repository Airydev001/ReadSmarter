import { createContext, useContext, useEffect, useRef, useState } from "react";
import { lib, songStore } from "./lib/db";
import { chime } from "./lib/audio";
import { dkey } from "./lib/stats";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
const DEF = { focus: 25, brk: 5, auto: true, theme: "system", hl: "#8dc63f", goal: 60, vol: 0.7, rate: 1, voice: "", shuffle: false };
const load = (k, d) => { try { return { ...d, ...JSON.parse(localStorage.getItem(k) || "{}") }; } catch { return d; } };

export function AppProvider({ children }) {
  const [s, setS] = useState(() => load("pb-s", DEF));
  const [days, setDays] = useState(() => load("pb-days", {}));
  const [tracks, setTracks] = useState([]);
  const [now, setNow] = useState("");
  const [req, setReq] = useState(null);
  const [t, setT] = useState({ phase: "idle", running: false, left: s.focus * 60, total: s.focus * 60 });
  const R = useRef({}); R.current = { s, t, tracks };
  const endAt = useRef(0), hooks = useRef({}), fadeT = useRef(), ti = useRef(-1), au = useRef(null);
  if (!au.current) { au.current = new Audio(); au.current.volume = 0; }

  // persistence + theme
  useEffect(() => { try { localStorage.setItem("pb-s", JSON.stringify(s)); } catch {} }, [s]);
  useEffect(() => { try { localStorage.setItem("pb-days", JSON.stringify(days)); } catch {} }, [days]);
  useEffect(() => {
    const r = document.documentElement;
    s.theme === "system" ? r.removeAttribute("data-theme") : (r.dataset.theme = s.theme);
  }, [s.theme]);
  useEffect(() => { lib.list(songStore).then((a) => setTracks(a.map((x) => ({ id: x.id, name: x.name, url: URL.createObjectURL(x.blob) })))); }, []);
  useEffect(() => { if (t.phase === "idle") setT((x) => ({ ...x, left: s.focus * 60, total: s.focus * 60 })); }, [s.focus]);
  useEffect(() => { document.title = t.phase === "idle" ? "ReadSmarter" : `${String(Math.floor(t.left / 60)).padStart(2, "0")}:${String(t.left % 60).padStart(2, "0")} · ReadSmarter`; }, [t.left, t.phase]);

  const bump = (k, v) => setDays((d) => { const key = dkey(), c = d[key] || { min: 0, pages: 0, ses: 0 }; return { ...d, [key]: { ...c, [k]: c[k] + v } }; });
  const set = (patch) => setS((x) => ({ ...x, ...patch }));

  // ---- music ----
  const fade = (to, ms, cb) => {
    clearInterval(fadeT.current); const a = au.current, from = a.volume; let n = 0;
    fadeT.current = setInterval(() => { n++; a.volume = Math.min(1, Math.max(0, from + (to - from) * n / 20)); if (n >= 20) { clearInterval(fadeT.current); cb && cb(); } }, ms / 20);
  };
  const nextTrack = () => {
    const { tracks: L, s: S } = R.current; if (!L.length) return;
    let i = (ti.current + 1) % L.length;
    if (S.shuffle && L.length > 1) do { i = Math.floor(Math.random() * L.length); } while (i === ti.current);
    ti.current = i; au.current.src = L[i].url; au.current.play().catch(() => {}); setNow(L[i].name);
  };
  const musicOn = () => { if (R.current.tracks.length) { nextTrack(); au.current.volume = 0; fade(R.current.s.vol, 3000); } };
  const musicOff = () => fade(0, 2000, () => au.current.pause());
  useEffect(() => { au.current.onended = () => R.current.t.phase === "break" && nextTrack(); }, []);
  useEffect(() => { if (R.current.t.phase === "break") au.current.volume = s.vol; }, [s.vol]);
  const addSongs = async (files) => {
    const add = [];
    for (const f of files) { const id = f.name + "|" + f.size; await lib.put(songStore, id, { name: f.name.replace(/\.[^.]+$/, ""), blob: f }); add.push({ id, name: f.name.replace(/\.[^.]+$/, ""), url: URL.createObjectURL(f) }); }
    setTracks((cur) => [...cur, ...add.filter((a) => !cur.some((x) => x.id === a.id))]);
  };
  const removeSong = async (id) => { await lib.del(songStore, id); setTracks((cur) => cur.filter((x) => x.id !== id)); };

  // ---- timer ----
  const begin = (phase, secs, running = true) => { endAt.current = Date.now() + secs * 1000; setT({ phase, running, left: secs, total: secs }); };
  const endBreak = (natural) => {
    const S = R.current.s; musicOff();
    if (hooks.current.paused) { hooks.current.paused = false; hooks.current.start && hooks.current.start(); }
    natural && !S.auto ? setT({ phase: "idle", running: false, left: S.focus * 60, total: S.focus * 60 }) : begin("focus", S.focus * 60);
  };
  const finish = () => {
    const { s: S, t: T } = R.current; chime();
    if (T.phase === "focus") {
      bump("min", S.focus); bump("ses", 1);
      hooks.current.paused = hooks.current.isReading ? hooks.current.isReading() : false;
      hooks.current.stop && hooks.current.stop();
      begin("break", S.brk * 60); musicOn();
    } else endBreak(true);
  };
  useEffect(() => {
    if (!t.running) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      if (left > 0) setT((x) => ({ ...x, left })); else { clearInterval(id); finish(); }
    }, 500);
    return () => clearInterval(id);
  }, [t.running, t.phase]);

  const toggle = () => {
    const a = au.current, L = R.current.tracks;
    if (L[0] && !a.src) { a.muted = true; a.src = L[0].url; a.play().then(() => { a.pause(); a.muted = false; }).catch(() => { a.muted = false; }); }
    if (t.running) { setT((x) => ({ ...x, running: false })); return; }
    if (t.phase === "idle") begin("focus", s.focus * 60);
    else { endAt.current = Date.now() + t.left * 1000; setT((x) => ({ ...x, running: true })); }
  };
  const reset = () => { musicOff(); hooks.current.stop && hooks.current.stop(); setT({ phase: "idle", running: false, left: s.focus * 60, total: s.focus * 60 }); };
  const plus = () => { endAt.current += 60000; setT((x) => ({ ...x, left: x.left + 60, total: x.total + 60 })); };
  const startTimer = () => { if (!R.current.t.running) toggle(); };

  return (
    <Ctx.Provider value={{ s, set, t, toggle, reset, plus, skip: () => endBreak(false), startTimer, days, bump, tracks, addSongs, removeSong, now, hooks, req, setReq }}>
      {children}
    </Ctx.Provider>
  );
}
