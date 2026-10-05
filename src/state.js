// Game state: persistence, migration and read-only selectors.
import { KEY, DAY, STATS, COLORS, SPECIES, ROOMS } from './data.js';

export const uid = () => Math.random().toString(36).slice(2, 9);
export const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export const sod = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const addDays = (t, n) => { const d = new Date(sod(t)); d.setDate(d.getDate() + n); return d.getTime(); };
export const today = () => sod(Date.now());
export const dayKey = (t = Date.now()) => new Date(t).toDateString();
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const newPlayer = (id, name, pet, species, color) => ({
  id, name, color, coins: 20, hearts: 0, xp: 0, level: 1, streak: 0, lastDay: null, clearDay: null,
  capacity: 70, needHelp: false, owned: [], ach: [], gifts: 1, days: [],
  n: { done: 0, helped: 0, early: 0, inbox: 0, clear: 0, gifts: 0, together: 0 },
  pet: { name: pet, species, acc: null, room: 'home', food: 75, clean: 75, fun: 75, energy: 75, hatched: false },
});

export function defaultState() {
  const t = today();
  const seed = [
    ['Wash dishes', 'kitchen', 'a', 1], ['Cook dinner', 'kitchen', 'b', 1],
    ['Laundry', 'laundry', 'a', 3], ['Take out trash', 'cleaning', 'b', 3],
    ['Vacuum floors', 'cleaning', 'a', 7], ['Clean bathroom', 'cleaning', 'b', 7],
    ['Grocery run', 'errands', 'a', 7], ['Water plants', 'outdoor', 'b', 3],
    ['Pay bills', 'admin', 'a', 30], ['Change bed sheets', 'laundry', 'b', 14],
  ];
  return {
    v: 2, setup: false, sound: true, lastTick: Date.now(), log: [],
    players: [newPlayer('a', 'Player 1', 'Mochi', 'cat', COLORS[0]), newPlayer('b', 'Player 2', 'Biscuit', 'dog', COLORS[1])],
    chores: seed.map(([title, cat, owner, every], i) =>
      ({ id: uid(), title, cat, owner, every, start: addDays(t, i % Math.min(every, 3)), lastDone: null, helpReq: false })),
    inbox: [{ id: uid(), title: 'Fix the squeaky door', cat: 'other', claimedBy: null, urgent: false, created: Date.now() }],
    house: { xp: 0, level: 1 }, album: {}, daily: null, stats: { quests: 0 },
  };
}

// Fill in any fields added since the save was written, without touching existing values.
function fill(target, defaults) {
  for (const k in defaults) {
    if (target[k] === undefined) target[k] = defaults[k];
    else if (defaults[k] && typeof defaults[k] === 'object' && !Array.isArray(defaults[k]) && typeof target[k] === 'object') fill(target[k], defaults[k]);
  }
  return target;
}

export function migrate(s) {
  const d = defaultState();
  fill(s, { ...d, players: undefined, chores: undefined, inbox: undefined });
  s.players.forEach((p, i) => {
    fill(p, newPlayer(p.id, p.name, p.pet?.name, p.pet?.species, COLORS[i]));
    if (s.v < 2) p.pet.hatched = true;
    if (!SPECIES.some(x => x.id === p.pet.species)) p.pet.species = 'cat';
    if (!ROOMS.some(r => r.id === p.pet.room)) p.pet.room = 'home';
  });
  s.v = 2;
  return s;
}

export function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); return s?.players ? migrate(s) : defaultState(); }
  catch { return defaultState(); }
}

export const store = { S: load() };
export const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store.S)); } catch {} };

/* ---------- Selectors ---------- */
const S = () => store.S;
export const P = id => S().players.find(p => p.id === id);
export const partner = p => S().players.find(q => q.id !== p.id);
export const spec = id => SPECIES.find(s => s.id === id) || SPECIES[0];
export const health = p => Object.keys(STATS).reduce((a, k) => a + p.pet[k], 0) / 4;
export const xpNeed = l => 60 + l * 40;
export const helpAsks = p => S().chores.filter(c => c.owner === p.id && c.helpReq);
export const needsHelp = p => p.needHelp || p.capacity < 35 || helpAsks(p).length > 0;
export const streakNow = p => [dayKey(), dayKey(addDays(Date.now(), -1))].includes(p.lastDay) ? p.streak : 0;
export const hasSpecies = (p, s) => s.lvl ? p.level >= s.lvl : s.hearts ? p.owned.includes(s.id) : true;
export const capLabel = v => v < 20 ? ['🪫', 'Running on empty'] : v < 40 ? ['😮‍💨', 'Low battery'] : v < 70 ? ['🙂', 'Doing okay'] : v < 90 ? ['💪', 'Feeling good'] : ['🚀', 'Full tank'];
export const stage = l => l < 4 ? 'baby' : l < 9 ? 'kid' : 'adult';
export const isNight = (h = new Date().getHours()) => h >= 22 || h < 7;
export const timeOfDay = (h = new Date().getHours()) => isNight(h) ? 'night' : h < 11 ? 'morning' : h < 18 ? 'day' : 'evening';

export function mood(p) {
  const h = health(p);
  return h >= 75 ? { exp: 'happy', label: 'Thriving', e: '😊' } : h >= 50 ? { exp: 'ok', label: 'Content', e: '🙂' }
    : h >= 25 ? { exp: 'sad', label: 'Needs care', e: '😟' } : { exp: 'sick', label: 'Feeling sick', e: '🤒' };
}

export function choreInfo(c) {
  const t = today(), due = c.lastDone ? addDays(c.lastDone, c.every) : c.start;
  const d = Math.round((sod(due) - t) / DAY);
  if (c.lastDone && sod(c.lastDone) === t) return { k: 'done', d, label: 'Done today' };
  if (d < 0) return { k: 'over', d, label: `${-d}d overdue` };
  if (d === 0) return { k: 'today', d, label: 'Due today' };
  return { k: 'later', d, label: d === 1 ? 'Tomorrow' : `In ${d} days` };
}
const ORDER = { over: 0, today: 1, later: 2, done: 3 };
// Shared ('both') chores show up in both players' lists.
export const choresOf = id => S().chores.filter(c => c.owner === id || c.owner === 'both').map(c => ({ c, i: choreInfo(c) }))
  .sort((a, b) => ORDER[a.i.k] - ORDER[b.i.k] || a.i.d - b.i.d);
export const inboxOf = id => S().inbox.filter(it => it.claimedBy === id || it.claimedBy === 'both');
export const dueCount = id => choresOf(id).filter(x => x.i.k === 'over' || x.i.k === 'today').length + inboxOf(id).length;
export const ownerName = id => id === 'both' ? 'both of you' : P(id)?.name || '';
