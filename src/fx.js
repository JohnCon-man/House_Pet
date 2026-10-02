// Juice: synthesized sound effects, particles, fly-to animations, splash banners.
import { store } from './state.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, ms));
export { wait };

/* ---------- Sound ---------- */
let ac;
function tone(f, start, dur, { type = 'triangle', vol = 0.16, slide = 0 } = {}) {
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + start;
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
}
const SFX = {
  pop:    () => tone(520, 0, 0.12, { slide: 1.8, type: 'sine', vol: 0.2 }),
  tap:    () => tone(880, 0, 0.06, { type: 'sine', vol: 0.08 }),
  coin:   () => { tone(988, 0, 0.08, { type: 'square', vol: 0.06 }); tone(1319, 0.07, 0.22, { type: 'square', vol: 0.06 }); },
  done:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.25)),
  chomp:  () => [0, 0.14, 0.28].forEach(t => tone(180, t, 0.08, { type: 'square', vol: 0.07, slide: 0.6 })),
  level:  () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.3, { vol: 0.14 })),
  help:   () => { tone(784, 0, 0.18, { type: 'sine' }); tone(988, 0.16, 0.3, { type: 'sine' }); },
  team:   () => [659, 784, 988, 1319].forEach((f, i) => { tone(f, i * 0.08, 0.35, { type: 'sine' }); tone(f / 2, i * 0.08, 0.35, { vol: 0.06 }); }),
  tick:   () => tone(1400, 0, 0.03, { type: 'square', vol: 0.04 }),
  shake:  () => tone(220, 0, 0.1, { type: 'sawtooth', vol: 0.05, slide: 1.5 }),
  open:   () => { tone(300, 0, 0.3, { type: 'sawtooth', vol: 0.05, slide: 4 }); [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.25 + i * 0.06, 0.3, { type: 'sine', vol: 0.1 })); },
  hatch:  () => { tone(400, 0, 0.15, { type: 'square', vol: 0.06, slide: 0.5 }); [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.15 + i * 0.08, 0.3, { type: 'sine' })); },
  buy:    () => { tone(660, 0, 0.1, { type: 'sine' }); tone(990, 0.08, 0.2, { type: 'sine' }); },
  nope:   () => { tone(300, 0, 0.12, { type: 'square', vol: 0.05 }); tone(220, 0.1, 0.2, { type: 'square', vol: 0.05 }); },
};
export function sfx(name) {
  if (!store.S.sound) return;
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); SFX[name]?.(); } catch {}
}

/* ---------- Particles ---------- */
const layer = () => document.getElementById('fx');

export function confetti(emojis = ['🎉', '✨', '💖', '⭐', '🎊'], n = 28) {
  if (reduced()) return;
  const colors = ['#ff5d8f', '#3fa9ff', '#22c55e', '#f59e0b', '#8b5cf6', '#ffd166'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    const paper = i % 2;
    s.className = 'confetti' + (paper ? ' paper' : '');
    if (paper) s.style.background = colors[i % colors.length]; else s.textContent = emojis[i % emojis.length];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.setProperty('--dx', Math.random() * 200 - 100 + 'px');
    s.style.setProperty('--r', Math.random() * 720 - 360 + 'deg');
    s.style.animationDuration = 1.6 + Math.random() * 1.2 + 's';
    s.style.animationDelay = Math.random() * 0.3 + 's';
    layer().appendChild(s); setTimeout(() => s.remove(), 3400);
  }
}

export function burst(x, y, emojis = ['✨', '💖', '⭐'], n = 10, spread = 90) {
  if (reduced()) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'), a = (Math.PI * 2 * i) / n + Math.random() * 0.5, d = spread * (0.6 + Math.random() * 0.6);
    s.className = 'spark'; s.textContent = emojis[i % emojis.length];
    s.style.left = x + 'px'; s.style.top = y + 'px';
    layer().appendChild(s);
    s.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(1.1)`, opacity: 0 }],
      { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
  }
}

export function popText(x, y, text, color = '#22c55e') {
  const s = document.createElement('span');
  s.className = 'pop-text'; s.textContent = text; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.color = color;
  layer().appendChild(s);
  s.animate([{ transform: 'translate(-50%,0) scale(.5)', opacity: 0 }, { transform: 'translate(-50%,-30px) scale(1.15)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%,-80px) scale(1)', opacity: 0 }],
    { duration: 1300, easing: 'ease-out' }).onfinish = () => s.remove();
}

const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
export { center };

// Fly an emoji along an arc from a point to an element. Resolves on arrival.
export function fly(from, toEl, emoji, { size = 34, delay = 0, dur = 750 } = {}) {
  if (!toEl) return Promise.resolve();
  const to = center(toEl);
  if (reduced()) return Promise.resolve();
  const s = document.createElement('span');
  s.className = 'flyer'; s.textContent = emoji; s.style.fontSize = size + 'px'; s.style.left = from.x + 'px'; s.style.top = from.y + 'px';
  layer().appendChild(s);
  const dx = to.x - from.x, dy = to.y - from.y, lift = -Math.min(160, Math.abs(dx) * 0.4 + 60);
  return new Promise(res => {
    s.animate([
      { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
      { transform: `translate(calc(-50% + ${dx * 0.45}px), calc(-50% + ${dy * 0.45 + lift}px)) scale(1.3)`, opacity: 1, offset: 0.45 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.7)`, opacity: 1 },
    ], { duration: dur, delay, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' }).onfinish = () => { s.remove(); res(); };
  });
}

// Animate a number in an element from a to b.
export function countUp(el, a, b, dur = 700) {
  if (!el || a === b) return;
  const t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
  el.parentElement?.classList.remove('bump'); void el.offsetWidth; el.parentElement?.classList.add('bump');
}

// Big centered banner, queued so several in a row play one after another.
let splashQ = Promise.resolve();
export function splash(title, sub = '', { color = '#ff5d8f', icon = '', onShow } = {}) {
  splashQ = splashQ.then(async () => {
    onShow?.();
    const d = document.createElement('div');
    d.className = 'splash'; d.style.setProperty('--c', color);
    d.innerHTML = `${icon ? `<div class="splash-icon">${icon}</div>` : ''}<div class="splash-title">${title}</div>${sub ? `<div class="splash-sub">${sub}</div>` : ''}`;
    layer().appendChild(d);
    await wait(1700); d.classList.add('out'); await wait(350); d.remove();
  });
  return splashQ;
}
