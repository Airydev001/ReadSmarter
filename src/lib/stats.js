export const fmt = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
export const dkey = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export function summary(days, goal) {
  const g = (d) => days[dkey(d)] || { min: 0, pages: 0, ses: 0 };
  let streak = 0; const c = new Date();
  if (!g(c).min) c.setDate(c.getDate() - 1);
  while (g(c).min > 0) { streak++; c.setDate(c.getDate() - 1); }
  const week = [];
  for (let i = 6; i >= 0; i--) { const x = new Date(); x.setDate(x.getDate() - i); week.push({ l: "SMTWTFS"[x.getDay()], m: g(x).min }); }
  const tot = Object.values(days).reduce((a, d) => ({ min: a.min + (d.min || 0), pages: a.pages + (d.pages || 0) }), { min: 0, pages: 0 });
  return { t: g(new Date()), streak, week, tot, goal };
}
