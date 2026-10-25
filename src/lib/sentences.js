// Splits text into sentences, respecting punctuation and common abbreviations.
// Returns chunks to speak {a,b} that belong to a sentence {sa,sb} (long sentences are spoken in pieces).
const AB = /^(mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|fig|no|vol|pp|al|cf|eg|ie|e\.g|i\.e)$/i;
export function splitSentences(full) {
  const out = [];
  const push = (a, b) => {
    const raw = full.slice(a, b); if (!raw.trim()) return;
    const a2 = a + (raw.length - raw.trimStart().length), b2 = a + raw.trimEnd().length;
    if (b2 - a2 <= 260) { out.push({ a: a2, b: b2, sa: a2, sb: b2 }); return; }
    const t = full.slice(a2, b2), cr = /[,;:]\s+/g; let m, last = 0;
    while ((m = cr.exec(t))) { const e = m.index + m[0].length; if (e - last >= 140) { out.push({ a: a2 + last, b: a2 + e, sa: a2, sb: b2 }); last = e; } }
    if (last < t.length) out.push({ a: a2 + last, b: b2, sa: a2, sb: b2 });
  };
  const re = /[.!?]+["'”’)\]]*(?=\s|$)/g; let m, start = 0;
  while ((m = re.exec(full))) {
    const end = m.index + m[0].length;
    const word = ((full.slice(start, m.index).match(/(\S+)$/) || ["", ""])[1]).replace(/^[("'“‘\[]+/, "");
    const nx = (full.slice(end).match(/\S/) || [""])[0];
    if ((m[0][0] === "." && (AB.test(word) || /^[A-Z]$/.test(word))) || /[a-z]/.test(nx)) continue;
    push(start, end); start = end;
  }
  push(start, full.length);
  return out;
}
