'use strict';
/* House Pet — a co-op tamagotchi for household chores. State lives in localStorage. */

const KEY = 'housepet.v1', DAY = 864e5, HOUR = 36e5;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const sod = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const addDays = (t, n) => { const d = new Date(sod(t)); d.setDate(d.getDate() + n); return d.getTime(); };
const today = () => sod(Date.now());
const dayKey = t => new Date(t).toDateString();

/* ---------- Game data ---------- */
const STATS = {
  food:   { icon: '🍖', label: 'Food',   decay: 2.2 },
  clean:  { icon: '🫧', label: 'Clean',  decay: 1.6 },
  fun:    { icon: '🎾', label: 'Play',   decay: 1.9 },
  energy: { icon: '💤', label: 'Energy', decay: 1.3 },
};
const CATS = {
  kitchen:  { icon: '🍳', label: 'Kitchen',  stat: 'food' },
  cleaning: { icon: '🧽', label: 'Cleaning', stat: 'clean' },
  laundry:  { icon: '🧺', label: 'Laundry',  stat: 'clean' },
  errands:  { icon: '🛒', label: 'Errands',  stat: 'fun' },
  outdoor:  { icon: '🌿', label: 'Outdoor',  stat: 'fun' },
  admin:    { icon: '📋', label: 'Admin',    stat: 'energy' },
  other:    { icon: '✨', label: 'Other',    stat: 'energy' },
};
const EVERY = [[1, 'Daily'], [2, 'Every 2 days'], [3, 'Every 3 days'], [7, 'Weekly'], [14, 'Every 2 weeks'], [30, 'Monthly']];
const COLORS = ['#ff8fab', '#6ec6ff', '#8bd17c', '#ffb86b', '#b79cff', '#4fd1c5'];

const SPECIES = [
  { id: 'cat', e: '🐱' }, { id: 'dog', e: '🐶' }, { id: 'bunny', e: '🐰' }, { id: 'hamster', e: '🐹' },
  { id: 'fox', e: '🦊', lvl: 3 }, { id: 'frog', e: '🐸', lvl: 4 }, { id: 'panda', e: '🐼', lvl: 5 },
  { id: 'koala', e: '🐨', lvl: 6 }, { id: 'penguin', e: '🐧', lvl: 7 }, { id: 'tiger', e: '🐯', lvl: 8 },
  { id: 'dragon', e: '🐲', lvl: 10 },
  { id: 'unicorn', e: '🦄', hearts: 15 }, { id: 'otter', e: '🦦', hearts: 25 }, { id: 'owl', e: '🦉', hearts: 35 },
];
const ITEMS = [
  // treats: coins, instant boost
  { id: 'cake',   e: '🍰', name: 'Cake',        coins: 15, use: { food: 35 } },
  { id: 'teddy',  e: '🧸', name: 'Teddy',       coins: 15, use: { fun: 35 } },
  { id: 'bath',   e: '🛁', name: 'Bubble bath', coins: 15, use: { clean: 35 } },
  { id: 'nap',    e: '☕', name: 'Cozy nap',    coins: 15, use: { energy: 35 } },
  { id: 'feast',  e: '🍱', name: 'Spa day',     coins: 50, use: { food: 100, clean: 100, fun: 100, energy: 100 } },
  // accessories
  { id: 'bow',    e: '🎀', name: 'Bow',      coins: 40,  acc: 1 },
  { id: 'cap',    e: '🧢', name: 'Cap',      coins: 60,  acc: 1 },
  { id: 'flower', e: '🌸', name: 'Flower',   coins: 60,  acc: 1 },
  { id: 'shades', e: '🕶️', name: 'Shades',   coins: 90,  acc: 1 },
  { id: 'party',  e: '🥳', name: 'Party',    coins: 100, acc: 1 },
  { id: 'tophat', e: '🎩', name: 'Top hat',  coins: 120, acc: 1 },
  { id: 'crown',  e: '👑', name: 'Crown',    coins: 250, acc: 1 },
  // love shop: hearts are earned only by helping your partner
  { id: 'ring',   e: '💍', name: 'Promise ring', hearts: 10, acc: 1 },
  { id: 'halo',   e: '😇', name: 'Halo',         hearts: 20, acc: 1 },
];
const ROOMS = [
  { id: 'home',    e: '🏠', name: 'Cozy home',  bg: 'linear-gradient(#fff6e9,#ffe3c4)', deco: '🪴 🛋️' },
  { id: 'garden',  e: '🌻', name: 'Garden',     coins: 80,  bg: 'linear-gradient(#d9f3ff,#c9f0c1)', deco: '🌻 🌷 🦋' },
  { id: 'beach',   e: '🏖️', name: 'Beach',      coins: 120, bg: 'linear-gradient(#bfe9ff,#ffe6a8)', deco: '🌴 🐚 ☀️' },
  { id: 'night',   e: '🌙', name: 'Night sky',  coins: 150, bg: 'linear-gradient(#2b2d5c,#6b5ca5)', deco: '🌙 ⭐ ✨' },
  { id: 'rainbow', e: '🌈', name: 'Rainbow',    hearts: 5,  bg: 'linear-gradient(#ffd1dc,#fff1b8,#c9f7d4,#c7e3ff)', deco: '🌈 ☁️ 💖' },
  { id: 'castle',  e: '🏰', name: 'Castle',     hearts: 30, bg: 'linear-gradient(#ffe0f0,#e3d4ff)', deco: '🏰 🎆 👑' },
];
const ACH = [
  { id: 'first',    e: '🌱', name: 'First Steps',   desc: 'Complete a chore',              t: p => p.n.done >= 1,    coins: 10 },
  { id: 'ten',      e: '🧹', name: 'Tidy Ten',      desc: 'Complete 10 chores',            t: p => p.n.done >= 10,   coins: 25 },
  { id: 'fifty',    e: '🏅', name: 'Home Hero',     desc: 'Complete 50 chores',            t: p => p.n.done >= 50,   coins: 75 },
  { id: 'help1',    e: '🤝', name: 'Helping Paw',   desc: 'Help your partner',             t: p => p.n.helped >= 1,  coins: 15 },
  { id: 'help10',   e: '💞', name: 'Dream Team',    desc: 'Help your partner 10 times',    t: p => p.n.helped >= 10, coins: 60 },
  { id: 'early5',   e: '🐦', name: 'Early Bird',    desc: 'Do 5 chores ahead of schedule', t: p => p.n.early >= 5,   coins: 30 },
  { id: 'inbox5',   e: '📥', name: 'Inbox Raider',  desc: 'Finish 5 inbox tasks',          t: p => p.n.inbox >= 5,   coins: 30 },
  { id: 'clear',    e: '✅', name: 'All Clear',     desc: 'Finish everything due today',   t: p => p.n.clear >= 1,   coins: 15 },
  { id: 'streak3',  e: '🔥', name: 'On a Roll',     desc: '3-day streak',                  t: p => p.streak >= 3,    coins: 20 },
  { id: 'streak7',  e: '⚡', name: 'Unstoppable',   desc: '7-day streak',                  t: p => p.streak >= 7,    coins: 50 },
  { id: 'streak30', e: '🌟', name: 'Legend',        desc: '30-day streak',                 t: p => p.streak >= 30,   coins: 200 },
  { id: 'lvl5',     e: '⭐', name: 'Growing Up',    desc: 'Reach level 5',                 t: p => p.level >= 5,     coins: 40 },
  { id: 'lvl10',    e: '🏆', name: 'Fully Grown',   desc: 'Reach level 10',                t: p => p.level >= 10,    coins: 100 },
  { id: 'harmony',  e: '☯️', name: 'Harmony',       desc: 'Both pets above 80% at once',   t: () => S.players.every(q => health(q) >= 80), coins: 40 },
];

/* ---------- State ---------- */
const newPlayer = (id, name, pet, species, color) => ({
  id, name, color, coins: 20, hearts: 0, xp: 0, level: 1, streak: 0, lastDay: null, clearDay: null,
  capacity: 70, needHelp: false, owned: [], ach: [], lastPet: 0,
  n: { done: 0, helped: 0, early: 0, inbox: 0, clear: 0 },
  pet: { name: pet, species, acc: null, room: 'home', food: 75, clean: 75, fun: 75, energy: 75 },
});

function defaultState() {
  const t = today();
  const seed = [
    ['Wash dishes', 'kitchen', 'a', 1], ['Cook dinner', 'kitchen', 'b', 1],
    ['Laundry', 'laundry', 'a', 3], ['Take out trash', 'cleaning', 'b', 3],
    ['Vacuum floors', 'cleaning', 'a', 7], ['Clean bathroom', 'cleaning', 'b', 7],
    ['Grocery run', 'errands', 'a', 7], ['Water plants', 'outdoor', 'b', 3],
    ['Pay bills', 'admin', 'a', 30], ['Change bed sheets', 'laundry', 'b', 14],
  ];
  return {
    v: 1, setup: false, sound: true, lastTick: Date.now(), log: [],
    players: [newPlayer('a', 'Player 1', 'Mochi', 'cat', COLORS[0]), newPlayer('b', 'Player 2', 'Biscuit', 'dog', COLORS[1])],
    chores: seed.map(([title, cat, owner, every], i) =>
      ({ id: uid(), title, cat, owner, every, start: addDays(t, i % Math.min(every, 3)), lastDone: null, helpReq: false })),
    inbox: [{ id: uid(), title: 'Fix the squeaky door', cat: 'other', claimedBy: null, urgent: false, created: Date.now() }],
  };
}

function load() { try { return JSON.parse(localStorage.getItem(KEY)) || defaultState(); } catch { return defaultState(); } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }

let S = load(), undoSnap = null, view = S.setup ? 'home' : 'setup', shopFor = 'a', focus = 'a';

const P = id => S.players.find(p => p.id === id);
const partner = p => S.players.find(q => q.id !== p.id);
const spec = id => SPECIES.find(s => s.id === id) || SPECIES[0];
const item = id => ITEMS.find(i => i.id === id);
const health = p => Object.keys(STATS).reduce((a, k) => a + p.pet[k], 0) / 4;
const xpNeed = l => 60 + l * 40;
const helpAsks = p => S.chores.filter(c => c.owner === p.id && c.helpReq);
const needsHelp = p => p.needHelp || p.capacity < 35 || helpAsks(p).length > 0;
const streakNow = p => [dayKey(Date.now()), dayKey(addDays(Date.now(), -1))].includes(p.lastDay) ? p.streak : 0;
const hasSpecies = (p, s) => s.lvl ? p.level >= s.lvl : s.hearts ? p.owned.includes(s.id) : true;
const capLabel = v => v < 20 ? '🪫 Running on empty' : v < 40 ? '😮‍💨 Low' : v < 70 ? '🙂 Okay' : v < 90 ? '💪 Good' : '🚀 Full tank';
const mood = h => h >= 75 ? { cls: 'thriving', label: '😊 Thriving' } : h >= 50 ? { cls: 'ok', label: '🙂 Content' }
  : h >= 25 ? { cls: 'sad', label: '😟 Needs care' } : { cls: 'sick', label: '🤒 Feeling sick' };
const barColor = v => v >= 60 ? '#5cc77a' : v >= 30 ? '#ffb347' : '#ff6b6b';

/* Stats decay over time; low capacity puts your pet in gentle "rest mode" (slower decay). */
function tick() {
  const now = Date.now(), h = (now - S.lastTick) / HOUR;
  if (h <= 0) return;
  S.lastTick = now;
  for (const p of S.players) {
    const slow = p.capacity < 35 ? 0.5 : 1;
    for (const k in STATS) p.pet[k] = clamp(p.pet[k] - STATS[k].decay * h * slow);
  }
}

function choreInfo(c) {
  const t = today(), due = c.lastDone ? addDays(c.lastDone, c.every) : c.start;
  const d = Math.round((sod(due) - t) / DAY);
  if (c.lastDone && sod(c.lastDone) === t) return { k: 'done', d, label: '✅ Done today' };
  if (d < 0) return { k: 'over', d, label: `⚠️ ${-d}d overdue` };
  if (d === 0) return { k: 'today', d, label: 'Due today' };
  return { k: 'later', d, label: d === 1 ? 'Tomorrow' : `In ${d} days` };
}
const ORDER = { over: 0, today: 1, later: 2, done: 3 };
const choresOf = id => S.chores.filter(c => c.owner === id).map(c => ({ c, i: choreInfo(c) }))
  .sort((a, b) => ORDER[a.i.k] - ORDER[b.i.k] || a.i.d - b.i.d);

/* ---------- Rewards ---------- */
function feed(p, stat, amt) { p.pet[stat] = clamp(p.pet[stat] + amt); }

function award(p, { coins = 0, xp = 0, hearts = 0 }) {
  p.coins += coins; p.hearts += hearts; p.xp += xp;
  let up = false;
  while (p.xp >= xpNeed(p.level)) { p.xp -= xpNeed(p.level); p.level++; up = true; }
  if (up) {
    const s = SPECIES.find(s => s.lvl === p.level);
    setTimeout(() => { celebrate(['⭐', '🎉', '✨']); toast(`🎉 ${p.pet.name} grew to level ${p.level}!${s ? ` New look unlocked: ${s.e}` : ''}`); }, 900);
  }
}

function bumpStreak(p) {
  const k = dayKey(Date.now());
  if (p.lastDay === k) return 0;
  p.streak = p.lastDay === dayKey(addDays(Date.now(), -1)) ? p.streak + 1 : 1;
  p.lastDay = k;
  return Math.min(p.streak, 10) * 2;
}

function allClear(p, r, notes) {
  const k = dayKey(Date.now());
  if (p.clearDay === k || choresOf(p.id).some(x => x.i.k === 'over' || x.i.k === 'today')) return;
  p.clearDay = k; p.n.clear++; r.coins += 20; r.xp += 10;
  notes.push('✅ all clear +20');
}

function checkAch() {
  for (const p of S.players) for (const a of ACH) {
    if (!p.ach.includes(a.id) && a.t(p)) {
      p.ach.push(a.id); p.coins += a.coins;
      setTimeout(() => { celebrate([a.e, '🏆', '✨']); toast(`${a.e} ${p.name} unlocked “${a.name}” +${a.coins}🪙`); }, 1800);
    }
  }
}

function log(text) { S.log.unshift({ t: Date.now(), text }); S.log.length = Math.min(S.log.length, 60); }
function snap() { undoSnap = JSON.stringify(S); }
function commit(msg, notes = [], fx = true) {
  checkAch(); save(); render();
  toast(msg + (notes.length ? `<small>${notes.join(' · ')}</small>` : ''), true);
  if (fx) { chime(); celebrate(); }
}

/* ---------- Actions ---------- */
function doChore(id, byId) {
  const c = S.chores.find(x => x.id === id); if (!c) return;
  snap();
  const doer = P(byId), owner = P(c.owner), info = choreInfo(c), helped = byId !== c.owner;
  const r = { coins: 10, xp: 15, hearts: 0 }, notes = [];
  feed(owner, CATS[c.cat].stat, 30);
  if (info.d > 0) { r.coins += 8; r.xp += 5; doer.n.early++; notes.push('🐦 ahead of schedule +8'); }
  if (helped) {
    const asked = c.helpReq || needsHelp(owner);
    r.coins += 10; r.xp += 10; r.hearts += asked ? 3 : 1; doer.n.helped++;
    feed(doer, 'fun', 15);
    notes.push(`🤝 helped ${esc(owner.name)} +${asked ? 3 : 1}💗`);
  }
  const sb = bumpStreak(doer); if (sb) { r.coins += sb; notes.push(`🔥 ${doer.streak}-day streak +${sb}`); }
  c.lastDone = Date.now(); c.helpReq = false; doer.n.done++;
  if (!helped) allClear(owner, r, notes);
  award(doer, r);
  log(`${doer.name} did “${c.title}”${helped ? ` for ${owner.name} 🤝` : ''}`);
  commit(`${CATS[c.cat].icon} ${esc(c.title)} done! +${r.coins}🪙${r.hearts ? ` +${r.hearts}💗` : ''}`, notes);
}

function doInbox(id) {
  const it = S.inbox.find(x => x.id === id); if (!it || !it.claimedBy) return;
  snap();
  const doer = P(it.claimedBy), q = partner(doer), stat = CATS[it.cat].stat;
  const r = { coins: 15 + (it.urgent ? 5 : 0), xp: 20, hearts: 0 }, notes = [];
  feed(doer, stat, 30); feed(q, stat, 10);
  if (needsHelp(q)) { r.hearts += 1; doer.n.helped++; notes.push(`💗 covered for ${esc(q.name)}`); }
  const sb = bumpStreak(doer); if (sb) { r.coins += sb; notes.push(`🔥 ${doer.streak}-day streak +${sb}`); }
  S.inbox = S.inbox.filter(x => x !== it);
  if (!S.inbox.length) { r.coins += 10; notes.push('📭 inbox zero +10'); }
  doer.n.inbox++; doer.n.done++;
  award(doer, r);
  log(`${doer.name} finished inbox task “${it.title}”`);
  commit(`📥 ${esc(it.title)} done! +${r.coins}🪙${r.hearts ? ` +${r.hearts}💗` : ''}`, notes);
}

function buy(id, pid) {
  const p = P(pid), x = item(id) || ROOMS.find(r => r.id === id) || SPECIES.find(s => s.id === id);
  const cost = x.coins || 0, hcost = x.hearts || 0;
  if (p.coins < cost || p.hearts < hcost) return toast(hcost ? '💗 Earn hearts by helping your partner!' : '🪙 Not enough coins yet — go do a chore!');
  snap();
  p.coins -= cost; p.hearts -= hcost;
  if (x.use) { for (const k in x.use) feed(p, k, x.use[k]); log(`${p.name} treated ${p.pet.name} to ${x.e}`); }
  else {
    p.owned.push(x.id);
    if (x.acc) p.pet.acc = x.id; else if (x.bg) p.pet.room = x.id; else p.pet.species = x.id;
    log(`${p.name} unlocked ${x.e} ${x.name || ''}`);
  }
  commit(`${x.e} ${x.use ? `${esc(p.pet.name)} loved it!` : 'Unlocked!'}`, [], true);
}

const ACTIONS = {
  tab: el => { view = el.dataset.v; render(); scrollTo(0, 0); },
  focus: el => { focus = el.dataset.p; render(); },
  do: el => doChore(el.dataset.id, el.dataset.by),
  ask: el => {
    const c = S.chores.find(x => x.id === el.dataset.id); c.helpReq = !c.helpReq;
    if (c.helpReq) { log(`${P(c.owner).name} asked for help with “${c.title}”`); toast(`🙋 ${esc(partner(P(c.owner)).name)}'s pet got the message!`); chime([660, 520]); }
    save(); render();
  },
  needHelp: el => {
    const p = P(el.dataset.p); p.needHelp = !p.needHelp;
    if (p.needHelp) { log(`${p.name} asked for a hand 🆘`); toast(`🆘 Sent to ${esc(partner(p).name)}'s pet`); chime([660, 520]); }
    save(); render();
  },
  pet: el => {
    const p = P(el.dataset.p);
    floatHearts(el);
    if (Date.now() - p.lastPet > 20000) { p.lastPet = Date.now(); feed(p, 'fun', 3); save(); }
  },
  claim: el => { S.inbox.find(x => x.id === el.dataset.id).claimedBy = el.dataset.p; save(); render(); },
  release: el => { S.inbox.find(x => x.id === el.dataset.id).claimedBy = null; save(); render(); },
  doInbox: el => doInbox(el.dataset.id),
  delInbox: el => { snap(); S.inbox = S.inbox.filter(x => x.id !== el.dataset.id); save(); render(); toast('🗑️ Removed', true); },
  shopFor: el => { shopFor = el.dataset.p; render(); },
  buy: el => buy(el.dataset.id, shopFor),
  wear: el => { const p = P(shopFor); p.pet.acc = p.pet.acc === el.dataset.id ? null : el.dataset.id; save(); render(); },
  room: el => { P(shopFor).pet.room = el.dataset.id; save(); render(); },
  species: el => { P(shopFor).pet.species = el.dataset.id; save(); render(); },
  delChore: el => { snap(); S.chores = S.chores.filter(c => c.id !== el.dataset.id); save(); render(); toast('🗑️ Chore removed', true); },
  sound: () => { S.sound = !S.sound; save(); render(); },
  export: () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }));
    a.download = `house-pet-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  },
  import: () => $('#importFile').click(),
  reset: () => { if (confirm('Erase everything and start over?')) { S = defaultState(); view = 'setup'; save(); render(); } },
  undo: () => { if (undoSnap) { S = JSON.parse(undoSnap); undoSnap = null; save(); render(); toast('↩️ Undone'); } },
};

const FORMS = {
  setup: f => {
    S.players.forEach((p, i) => {
      p.name = f[`n${i}`].value.trim() || p.name;
      p.pet.name = f[`pn${i}`].value.trim() || p.pet.name;
      p.pet.species = f[`sp${i}`].value || p.pet.species;
    });
    S.setup = true; view = 'home'; save(); render(); celebrate(['🥚', '🐣', '💖']);
  },
  inbox: f => {
    const title = f.elements.task.value.trim(); if (!title) return;
    S.inbox.push({ id: uid(), title, cat: f.cat.value, urgent: f.urgent.checked, claimedBy: null, created: Date.now() });
    log(`New inbox task: “${title}”`); save(); render(); toast('📥 Added to the inbox');
  },
  chore: f => {
    const title = f.elements.task.value.trim(); if (!title) return;
    S.chores.push({ id: uid(), title, cat: f.cat.value, owner: f.owner.value, every: +f.every.value, start: today(), lastDone: null, helpReq: false });
    save(); render(); toast('🧹 Chore added');
  },
};

function onChange(el) {
  const k = el.dataset.chg;
  if (k === 'cap') { const p = P(el.dataset.p); p.capacity = +el.value; log(`${p.name} capacity: ${capLabel(p.capacity)}`); save(); render(); return; }
  if (k === 'import') {
    const file = el.files[0]; if (!file) return;
    file.text().then(t => { const d = JSON.parse(t); if (!d.players) throw 0; snap(); S = d; save(); render(); toast('📦 Data imported', true); })
      .catch(() => toast('⚠️ That file did not look like House Pet data'));
    return;
  }
  const [obj, ...path] = k.split('.'), last = path.pop();
  const target = path.reduce((o, f) => o[f], obj === 'chore' ? S.chores.find(c => c.id === el.dataset.id) : P(el.dataset.p));
  const val = last === 'every' ? +el.value : el.value.trim();
  if (val === '') return render();
  target[last] = val;
  save(); render();
}

/* ---------- Views ---------- */
const opts = (pairs, sel) => pairs.map(([v, l]) => `<option value="${v}"${v == sel ? ' selected' : ''}>${l}</option>`).join('');
const catOpts = sel => opts(Object.entries(CATS).map(([k, c]) => [k, `${c.icon} ${c.label}`]), sel);
const playerChips = (act, cur) => `<div class="chips">${S.players.map(p =>
  `<button class="chip${p.id === cur ? ' on' : ''}" style="--c:${p.color}" data-act="${act}" data-p="${p.id}">${spec(p.pet.species).e} ${esc(p.name)}</button>`).join('')}</div>`;

function petCard(p) {
  const h = health(p), m = mood(h), room = ROOMS.find(r => r.id === p.pet.room) || ROOMS[0];
  const low = Object.keys(STATS).reduce((a, k) => p.pet[k] < p.pet[a] ? k : a, 'food');
  const bubble = needsHelp(p) ? '🆘' : p.pet[low] < 40 ? STATS[low].icon : h >= 85 ? '💖' : '';
  return `<div class="pet-card ${m.cls}${room.id === 'night' ? ' dark' : ''}" style="background:${room.bg}">
    <div class="deco">${room.deco}</div>
    ${bubble ? `<div class="bubble">${bubble}</div>` : ''}
    <button class="pet" data-act="pet" data-p="${p.id}" aria-label="Pet ${esc(p.pet.name)}" style="--s:${1 + Math.min(p.level, 12) * 0.03}">
      ${p.pet.acc ? `<span class="acc">${item(p.pet.acc).e}</span>` : ''}<span class="body">${spec(p.pet.species).e}</span>
    </button>
    <div class="pet-name">${esc(p.pet.name)} <small>Lv ${p.level}</small> <span class="mood">${m.label}</span></div>
  </div>
  <div class="xp" title="XP"><i style="width:${p.xp / xpNeed(p.level) * 100}%"></i><span>${p.xp}/${xpNeed(p.level)} XP</span></div>
  <div class="stats">${Object.entries(STATS).map(([k, s]) =>
    `<div class="stat" title="${s.label}"><span>${s.icon}</span><div class="bar"><i style="width:${p.pet[k]}%;background:${barColor(p.pet[k])}"></i></div></div>`).join('')}</div>`;
}

function choreRow({ c, i }, by, helping) {
  const cat = CATS[c.cat];
  const btns = i.k === 'done' ? '' : helping
    ? `<button class="btn help" data-act="do" data-id="${c.id}" data-by="${by}">🤝 I'll do it</button>`
    : `<button class="icon-btn${c.helpReq ? ' on' : ''}" data-act="ask" data-id="${c.id}" aria-label="Ask for help">🙋</button>
       <button class="btn do" data-act="do" data-id="${c.id}" data-by="${by}">✓<span class="lbl"> Done</span></button>`;
  return `<li class="chore ${i.k}"><span class="ci">${cat.icon}</span>
    <div class="ct"><b>${esc(c.title)}</b><small>${i.label} · ${EVERY.find(e => e[0] === c.every)?.[1] || `Every ${c.every}d`}${c.helpReq ? ' · <em>🙋 asked for help</em>' : ''}${i.d > 0 && i.k !== 'done' ? ' · 🐦 early bonus' : ''}</small></div>
    ${btns}</li>`;
}

function helpPanel(p, q) {
  const list = choresOf(q.id).filter(x => x.c.helpReq || x.i.k === 'over' || x.i.k === 'today');
  const why = [q.needHelp && 'asked for a hand', q.capacity < 35 && `capacity is ${capLabel(q.capacity)}`, helpAsks(q).length && `${helpAsks(q).length} chore(s) flagged`].filter(Boolean).join(' · ');
  return `<div class="help-panel"><div class="help-h"><span class="ping">💌</span><div><b>${esc(q.pet.name)} needs a hand!</b><small>${esc(q.name)} ${why}</small></div></div>
    ${list.length ? `<ul class="chores">${list.map(x => choreRow(x, p.id, true)).join('')}</ul>`
      : `<p class="muted">Nothing due for them right now — grab something from the <button class="link" data-act="tab" data-v="inbox">📥 Inbox</button> to lighten the load.</p>`}
    <p class="muted tiny">Helping earns 💗 hearts for the Love Shop.</p></div>`;
}

function playerCol(p) {
  const q = partner(p), list = choresOf(p.id), due = list.filter(x => x.i.k === 'over' || x.i.k === 'today').length;
  return `<section class="player" data-p="${p.id}" style="--c:${p.color}">
    <div class="phead"><b>${esc(p.name)}</b><span class="wallet">🪙 ${p.coins} &nbsp;💗 ${p.hearts} &nbsp;🔥 ${streakNow(p)}</span></div>
    ${petCard(p)}
    ${needsHelp(q) ? helpPanel(p, q) : ''}
    <div class="cap">
      <div class="cap-top"><span>My capacity</span><b class="cap-lbl">${capLabel(p.capacity)}</b></div>
      <input type="range" min="0" max="100" step="5" value="${p.capacity}" data-chg="cap" data-p="${p.id}" aria-label="${esc(p.name)} capacity">
      <button class="pill${p.needHelp ? ' on' : ''}" data-act="needHelp" data-p="${p.id}">${p.needHelp ? '🆘 Help requested — tap to cancel' : '🙋 I could use some help'}</button>
      ${p.capacity < 35 ? '<p class="muted tiny">🛌 Rest mode: your pet’s needs drop slower while your capacity is low.</p>' : ''}
    </div>
    <h3>My chores ${due ? `<span class="badge">${due} due</span>` : '<span class="badge ok">all clear ✨</span>'}</h3>
    <ul class="chores">${list.map(x => choreRow(x, p.id)).join('') || '<li class="muted">No chores yet — add some in ⚙️ Settings.</li>'}</ul>
  </section>`;
}

function homeView() {
  return `<div class="focus-bar">${playerChips('focus', focus)}</div>
    <div class="duo" data-focus="${focus}">${S.players.map(playerCol).join('')}</div>`;
}

function inboxView() {
  const items = [...S.inbox].sort((a, b) => b.urgent - a.urgent || a.created - b.created);
  return `<section class="card"><h2>📥 Shared Inbox</h2>
    <p class="muted">Drop in anything that needs doing. Whoever has capacity grabs it. Inbox tasks pay +15🪙 — and +💗 if your partner is struggling.</p>
    <form data-form="inbox" class="row">
      <input name="task" placeholder="e.g. Clean out the fridge" maxlength="80" required>
      <select name="cat">${catOpts('cleaning')}</select>
      <label class="chk"><input type="checkbox" name="urgent"> 🔥 Urgent</label>
      <button class="btn do">Add</button>
    </form>
    <ul class="inbox">${items.map(it => {
      const who = it.claimedBy && P(it.claimedBy);
      return `<li class="${it.urgent ? 'urgent' : ''}" ${who ? `style="--c:${who.color}"` : ''}>
        <span class="ci">${CATS[it.cat].icon}</span>
        <div class="ct"><b>${esc(it.title)}</b><small>${it.urgent ? '🔥 Urgent · ' : ''}${who ? `Claimed by ${esc(who.name)}` : 'Up for grabs'}</small></div>
        <div class="acts">${who
          ? `<button class="btn do" data-act="doInbox" data-id="${it.id}">✓ Done</button><button class="icon-btn" data-act="release" data-id="${it.id}" aria-label="Release">↩️</button>`
          : S.players.map(p => `<button class="btn claim" style="--c:${p.color}" data-act="claim" data-id="${it.id}" data-p="${p.id}">${spec(p.pet.species).e} ${esc(p.name)}</button>`).join('')}
          <button class="icon-btn" data-act="delInbox" data-id="${it.id}" aria-label="Delete">🗑️</button></div></li>`;
    }).join('') || '<li class="empty">📭 Inbox zero. Your pets are proud.</li>'}</ul></section>`;
}

function shopView() {
  const p = P(shopFor);
  const price = x => x.hearts ? `${x.hearts}💗` : x.coins ? `${x.coins}🪙` : 'Free';
  const card = (x, btn, cls = '') => `<div class="shop-item ${cls}"><span class="big">${x.e}</span><b>${x.name || ''}</b>${btn}</div>`;
  const treats = ITEMS.filter(x => x.use).map(x => card(x, `<button class="btn do" data-act="buy" data-id="${x.id}">${price(x)}</button>`));
  const accs = ITEMS.filter(x => x.acc).map(x => p.owned.includes(x.id)
    ? card(x, `<button class="btn${p.pet.acc === x.id ? ' on' : ''}" data-act="wear" data-id="${x.id}">${p.pet.acc === x.id ? 'Wearing' : 'Wear'}</button>`, p.pet.acc === x.id ? 'sel' : '')
    : card(x, `<button class="btn${x.hearts ? ' love' : ''}" data-act="buy" data-id="${x.id}">${price(x)}</button>`));
  const looks = SPECIES.map(s => {
    const has = hasSpecies(p, s), cur = p.pet.species === s.id;
    const btn = cur ? '<button class="btn on">Current</button>' : has ? `<button class="btn" data-act="species" data-id="${s.id}">Choose</button>`
      : s.lvl ? `<button class="btn" disabled>🔒 Lv ${s.lvl}</button>` : `<button class="btn love" data-act="buy" data-id="${s.id}">${price(s)}</button>`;
    return card(s, btn, (cur ? 'sel' : '') + (has ? '' : ' locked'));
  });
  const rooms = ROOMS.map(r => {
    const has = !r.coins && !r.hearts || p.owned.includes(r.id), cur = p.pet.room === r.id;
    const btn = cur ? '<button class="btn on">Current</button>' : has ? `<button class="btn" data-act="room" data-id="${r.id}">Move in</button>`
      : `<button class="btn${r.hearts ? ' love' : ''}" data-act="buy" data-id="${r.id}">${price(r)}</button>`;
    return `<div class="shop-item room${cur ? ' sel' : ''}" style="background:${r.bg}"><span class="big">${r.e}</span><b>${r.name}</b>${btn}</div>`;
  });
  return `<section class="card"><h2>🛍️ Pet Shop</h2>${playerChips('shopFor', shopFor)}
    <p class="wallet big-wallet">🪙 ${p.coins} coins &nbsp; 💗 ${p.hearts} hearts</p>
    <p class="muted">🪙 Coins come from chores. 💗 Hearts only come from helping your partner — spend them on 💍 love items.</p>
    <h3>🍰 Treats <small class="muted">instant boost for ${esc(p.pet.name)}</small></h3><div class="grid">${treats.join('')}</div>
    <h3>🎀 Accessories</h3><div class="grid">${accs.join('')}</div>
    <h3>🐾 Looks <small class="muted">level up or earn hearts to unlock</small></h3><div class="grid">${looks.join('')}</div>
    <h3>🏡 Rooms</h3><div class="grid">${rooms.join('')}</div></section>`;
}

function trophiesView() {
  const col = p => `<section class="card" style="--c:${p.color}"><h2>${spec(p.pet.species).e} ${esc(p.name)}</h2>
    <div class="kpis"><div><b>${p.n.done}</b>chores</div><div><b>${p.n.helped}</b>helps</div><div><b>${p.n.early}</b>early</div><div><b>${streakNow(p)}</b>day streak</div><div><b>${p.level}</b>level</div></div>
    <div class="ach">${ACH.map(a => `<div class="a${p.ach.includes(a.id) ? '' : ' locked'}"><span>${a.e}</span><b>${a.name}</b><small>${a.desc}</small></div>`).join('')}</div></section>`;
  return `<div class="duo all">${S.players.map(col).join('')}</div>
    <section class="card"><h2>📜 Recent activity</h2><ul class="log">${S.log.slice(0, 30).map(l =>
      `<li><small>${new Date(l.t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</small> ${esc(l.text)}</li>`).join('') || '<li class="muted">Nothing yet!</li>'}</ul></section>`;
}

function settingsView() {
  const people = S.players.map(p => [p.id, esc(p.name)]);
  return `<section class="card"><h2>👥 Players</h2><div class="duo all">${S.players.map(p => `<div class="fields">
      <label>Name <input value="${esc(p.name)}" data-chg="player.name" data-p="${p.id}" maxlength="20"></label>
      <label>Pet name <input value="${esc(p.pet.name)}" data-chg="player.pet.name" data-p="${p.id}" maxlength="20"></label>
      <label>Color <select data-chg="player.color" data-p="${p.id}">${opts(COLORS.map(c => [c, c]), p.color)}</select>
        <span class="swatch" style="background:${p.color}"></span></label></div>`).join('')}</div></section>
    <section class="card"><h2>🧹 Assigned chores</h2>
      <form data-form="chore" class="row">
        <input name="task" placeholder="New chore" maxlength="60" required>
        <select name="cat">${catOpts('cleaning')}</select>
        <select name="owner">${opts(people, 'a')}</select>
        <select name="every">${opts(EVERY, 7)}</select>
        <button class="btn do">Add</button>
      </form>
      <ul class="manage">${S.chores.map(c => `<li>
        <input value="${esc(c.title)}" data-chg="chore.title" data-id="${c.id}" maxlength="60" aria-label="Title">
        <select data-chg="chore.cat" data-id="${c.id}">${catOpts(c.cat)}</select>
        <select data-chg="chore.owner" data-id="${c.id}">${opts(people, c.owner)}</select>
        <select data-chg="chore.every" data-id="${c.id}">${opts(EVERY, c.every)}</select>
        <button class="icon-btn" data-act="delChore" data-id="${c.id}" aria-label="Delete">🗑️</button></li>`).join('')}</ul>
      <p class="muted tiny">Chore type decides what it does for your pet: 🍳 feeds · 🧽🧺 bathes · 🛒🌿 plays · 📋✨ rests.</p></section>
    <section class="card"><h2>⚙️ App</h2><div class="row">
      <button class="btn" data-act="sound">${S.sound ? '🔊 Sound on' : '🔇 Sound off'}</button>
      <button class="btn" data-act="export">💾 Back up data</button>
      <button class="btn" data-act="import">📦 Restore backup</button>
      <input type="file" id="importFile" accept="application/json" data-chg="import" hidden>
      <button class="btn danger" data-act="reset">🧨 Start over</button></div>
      <p class="muted tiny">Data is saved on this device. Tip: in Safari tap Share → “Add to Home Screen” for a full-screen app.</p></section>`;
}

function setupView() {
  return `<section class="card setup"><h1>🏡 Welcome to House Pet</h1>
    <p>Each of you raises a pet. Doing chores feeds, bathes and plays with it. Help each other out to earn 💗 hearts and rare unlocks.</p>
    <form data-form="setup"><div class="duo all">${S.players.map((p, i) => `<div class="fields" style="--c:${p.color}">
      <label>Your name <input name="n${i}" value="${esc(p.name)}" maxlength="20"></label>
      <label>Pet name <input name="pn${i}" value="${esc(p.pet.name)}" maxlength="20"></label>
      <div class="species">${SPECIES.filter(s => !s.lvl && !s.hearts).map(s =>
        `<label><input type="radio" name="sp${i}" value="${s.id}"${p.pet.species === s.id ? ' checked' : ''}><span>${s.e}</span></label>`).join('')}</div></div>`).join('')}</div>
      <p class="muted">We added some starter chores — edit them anytime in ⚙️ Settings.</p>
      <button class="btn do big">Hatch our pets 🥚</button></form></section>`;
}

const TABS = [['home', '🏠', 'Home'], ['inbox', '📥', 'Inbox'], ['shop', '🛍️', 'Shop'], ['trophies', '🏆', 'Trophies'], ['settings', '⚙️', 'Settings']];

function render() {
  const harmony = Math.round(S.players.reduce((a, p) => a + health(p), 0) / S.players.length);
  const waiting = S.inbox.filter(i => !i.claimedBy).length;
  $('#top').innerHTML = `<h1>🏡 House Pet</h1>
    <div class="harmony" title="Household harmony"><span>☯️ Harmony</span><div class="bar"><i style="width:${harmony}%;background:${barColor(harmony)}"></i></div><b>${harmony}%</b></div>`;
  $('#tabs').innerHTML = view === 'setup' ? '' : TABS.map(([v, e, l]) =>
    `<button class="${view === v ? 'on' : ''}" data-act="tab" data-v="${v}"><span>${e}${v === 'inbox' && waiting ? `<i class="dot">${waiting}</i>` : ''}</span>${l}</button>`).join('');
  $('#app').innerHTML = { home: homeView, inbox: inboxView, shop: shopView, trophies: trophiesView, settings: settingsView, setup: setupView }[view]();
}

/* ---------- Effects ---------- */
let toastTimer;
function toast(html, undo = false) {
  const t = $('#toast');
  t.innerHTML = `<div>${html}</div>${undo && undoSnap ? '<button data-act="undo">Undo</button>' : ''}`;
  t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 5000);
}

function celebrate(em = ['🎉', '✨', '💖', '⭐']) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < 22; i++) {
    const s = document.createElement('span');
    s.className = 'confetti'; s.textContent = em[i % em.length];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDelay = Math.random() * 0.4 + 's';
    s.style.setProperty('--dx', Math.random() * 160 - 80 + 'px');
    document.body.appendChild(s); setTimeout(() => s.remove(), 2600);
  }
}

function floatHearts(el) {
  const r = el.getBoundingClientRect();
  el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle');
  for (let i = 0; i < 5; i++) {
    const s = document.createElement('span');
    s.className = 'heart'; s.textContent = ['💖', '💕', '✨'][i % 3];
    s.style.left = r.left + r.width / 2 + (Math.random() * 80 - 40) + 'px';
    s.style.top = r.top + scrollY + 20 + 'px';
    s.style.animationDelay = i * 0.08 + 's';
    document.body.appendChild(s); setTimeout(() => s.remove(), 1600);
  }
}

let ac;
function chime(notes = [523, 659, 784]) {
  if (!S.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const t = ac.currentTime;
    notes.forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), s = t + i * 0.09;
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.18, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.35);
      o.connect(g).connect(ac.destination); o.start(s); o.stop(s + 0.4);
    });
  } catch {}
}

/* ---------- Wiring ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](el);
});
document.addEventListener('change', e => { if (e.target.dataset.chg) onChange(e.target); });
document.addEventListener('input', e => {
  if (e.target.dataset.chg === 'cap') e.target.closest('.cap').querySelector('.cap-lbl').textContent = capLabel(+e.target.value);
});
document.addEventListener('submit', e => { const f = e.target; if (FORMS[f.dataset.form]) { e.preventDefault(); FORMS[f.dataset.form](f); } });

const refresh = () => {
  tick(); save();
  const busy = document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
  if (!busy) render();
};
setInterval(refresh, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });

tick(); save(); render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
