export function chime() {
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    const c = new C(), o = c.createOscillator(), g = c.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.2, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.6);
  } catch {}
}
