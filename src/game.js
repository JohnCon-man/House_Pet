// Game rules. Mutates store.S and pushes UI events (level ups, quests, unlocks) to `events`.
import { STATS, CATS, HOUR, CARE, RP_STATS, SPECIES, QUESTS, TEAM_QUESTS, STICKERS, WHEEL, ACH, HOUSE, houseNeed, TREATS, ACCS, ROOMS } from './data.js';
import { store, uid, clamp, today, dayKey, addDays, P, partner, health, xpNeed, needsHelp, choreInfo, choresOf } from './state.js';

const S = () => store.S;
export const events = [];
const ev = e => events.push(e);

export function log(text) { S().log.unshift({ t: Date.now(), text }); S().log.length = Math.min(S().log.length, 80); }

/* Stats decay over time; low capacity puts your pet in gentle "rest mode" (half decay). */
export function tick() {
  const now = Date.now(), h = (now - S().lastTick) / HOUR;
  if (h > 0) {
    S().lastTick = now;
    for (const p of S().players) {
      const slow = p.capacity < 35 ? 0.5 : 1;
      for (const k in STATS) p.pet[k] = clamp(p.pet[k] - STATS[k].decay * h * slow);
    }
    for (const rp of S().realPets || []) for (const k in RP_STATS) rp[k] = clamp(rp[k] - RP_STATS[k].decay[rp.kind] * h);
  }
  ensureDaily();
}

export const feed = (p, stat, amt) => { p.pet[stat] = clamp(p.pet[stat] + amt); };

export function award(p, { coins = 0, xp = 0, hearts = 0 }) {
  p.coins += coins; p.hearts += hearts; p.xp += xp;
  while (p.xp >= xpNeed(p.level)) {
    p.xp -= xpNeed(p.level); p.level++; p.gifts++;
    ev({ type: 'level', p, lvl: p.level, unlock: SPECIES.find(s => s.lvl === p.level) });
  }
}

export function houseXP(n) {
  const h = S().house;
  h.xp += n;
  while (h.level < HOUSE.length && h.xp >= houseNeed(h.level)) {
    h.xp -= houseNeed(h.level); h.level++;
    ev({ type: 'house', lvl: h.level, item: HOUSE[h.level - 1] });
  }
}

function bumpStreak(p) {
  const k = dayKey();
  if (p.lastDay === k) return 0;
  p.streak = p.lastDay === dayKey(addDays(Date.now(), -1)) ? p.streak + 1 : 1;
  p.lastDay = k;
  p.days = [...p.days.filter(d => d !== k), k].slice(-60);
  return Math.min(p.streak, 10) * 2;
}

function allClear(p, r, notes) {
  const k = dayKey();
  if (p.clearDay === k || choresOf(p.id).some(x => x.i.k === 'over' || x.i.k === 'today')) return;
  p.clearDay = k; p.n.clear++; r.coins += 20; r.xp += 10;
  // Solo players have no partner to help, so clearing the day is how they earn hearts.
  if (S().players.length === 1) { r.hearts = (r.hearts || 0) + 2; notes.push('✅ All clear +20 · +2💗'); } else notes.push('✅ All clear +20');
  ev({ type: 'clear', p });
}

export function checkAch() {
  for (const p of S().players) for (const a of ACH) {
    if (!p.ach.includes(a.id) && a.t(p, S(), health)) { p.ach.push(a.id); p.coins += a.coins; ev({ type: 'ach', p, a }); }
  }
}

/* ---------- Daily quests ---------- */
function rng(seed) { let h = 1779033703; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 3432918353); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return ((h >>> 0) % 10000) / 10000; }; }
export const questDef = id => [...QUESTS, ...TEAM_QUESTS].find(q => q.id === id);

export function ensureDaily() {
  const k = dayKey();
  if (S().daily?.day === k) return;
  const r = rng(k), pool = QUESTS.filter(q => !q.pets || (S().realPets || []).length);
  // Two players always get one teamwork quest; a solo player gets three regular ones.
  const picks = S().players.length > 1 ? [TEAM_QUESTS[Math.floor(r() * TEAM_QUESTS.length)].id] : [];
  while (picks.length < 3) picks.push(pool.splice(Math.floor(r() * pool.length), 1)[0].id);
  S().daily = { day: k, quests: picks.map(id => ({ id, prog: 0, claimed: false })), who: [], chest: false, spun: [], lastPet: 0 };
}

export function emit(type, pl = {}) {
  ensureDaily();
  const d = S().daily;
  if (type === 'chore' && pl.who && !d.who.includes(pl.who)) d.who.push(pl.who);
  for (const q of d.quests) {
    const def = questDef(q.id);
    if (q.claimed || q.prog >= def.goal) continue;
    const hit = def.on === type || def.on === `cat:${pl.cat}` && type === 'chore' || def.on === `stat:${pl.stat}` && type === 'chore';
    if (def.on === 'both') q.prog = d.who.length; else if (hit) q.prog++;
    if (q.prog >= def.goal) { q.prog = def.goal; ev({ type: 'quest', def }); }
  }
}

export function claimQuest(id) {
  const d = S().daily, q = d.quests.find(x => x.id === id), def = questDef(id);
  if (!q || q.claimed || q.prog < def.goal) return false;
  q.claimed = true; S().stats.quests++;
  S().players.forEach(p => award(p, { coins: 15, xp: 10 }));
  houseXP(15);
  log(`Quest complete: ${def.e} ${def.name}`);
  if (d.quests.every(x => x.claimed) && !d.chest) { d.chest = true; S().players.forEach(p => p.gifts++); ev({ type: 'chest' }); }
  return true;
}

/* ---------- Chores ---------- */
// A task assigned to both players: both pets get cared for and both players are rewarded.
function doTogether({ title, catId, early = false, inbox = false, urgent = false, finish }) {
  const ps = S().players, cat = CATS[catId], notes = ['👫 Together +1💗 each'];
  const base = { coins: 15 + (inbox ? 5 : 0) + (urgent ? 5 : 0), xp: 20, hearts: 1 };
  if (early) { base.coins += 8; notes.push('🐦 Early +8'); }
  finish();
  let giftTo = null;
  for (const p of ps) {
    const r = { ...base };
    feed(p, cat.stat, 30);
    r.coins += bumpStreak(p);
    p.n.done++; p.n.together++;
    if (early) p.n.early++;
    if (inbox) p.n.inbox++;
    allClear(p, r, notes);
    if (Math.random() < 0.25) { p.gifts++; giftTo = giftTo || p; }
    award(p, r);
    emit('chore', { cat: catId, stat: cat.stat, who: p.id });
  }
  houseXP(25);
  emit('help');
  if (early) emit('early');
  if (inbox) emit('inbox');
  log(`${ps[0].name} & ${ps[1].name} did “${title}” together 👫`);
  return { ...base, notes: [...new Set(notes)], gift: !!giftTo, giftTo, together: true, stat: cat.stat, doer: ps[0], owners: ps, title, icon: cat.icon };
}

export function doChore(id, byId) {
  const c = S().chores.find(x => x.id === id); if (!c) return null;
  const info = choreInfo(c), cat = CATS[c.cat];
  if (c.owner === 'both') return doTogether({ title: c.title, catId: c.cat, early: info.d > 0, finish: () => { c.lastDone = Date.now(); c.helpReq = false; } });
  const doer = P(byId), owner = P(c.owner), helped = byId !== c.owner;
  const r = { coins: 10, xp: 15, hearts: 0 }, notes = [];
  feed(owner, cat.stat, 30);
  const early = info.d > 0;
  if (early) { r.coins += 8; r.xp += 5; doer.n.early++; notes.push('🐦 Early +8'); }
  if (helped) {
    const asked = c.helpReq || needsHelp(owner);
    r.coins += 10; r.xp += 10; r.hearts += asked ? 3 : 1; doer.n.helped++;
    feed(doer, 'fun', 15);
    notes.push(`🤝 Teamwork +${asked ? 3 : 1}💗`);
  }
  const sb = bumpStreak(doer); if (sb) { r.coins += sb; notes.push(`🔥 ${doer.streak}-day streak +${sb}`); }
  c.lastDone = Date.now(); c.helpReq = false; doer.n.done++;
  if (!helped) allClear(owner, r, notes);
  const gift = Math.random() < 0.2;
  if (gift) doer.gifts++;
  award(doer, r);
  houseXP(10 + (helped ? 10 : 0));
  emit('chore', { cat: c.cat, stat: cat.stat, who: byId });
  if (early) emit('early');
  if (helped) emit('help');
  log(`${doer.name} did “${c.title}”${helped ? ` for ${owner.name} 🤝` : ''}`);
  return { ...r, notes, gift, giftTo: gift ? doer : null, helped, stat: cat.stat, doer, owner, owners: [owner], title: c.title, icon: cat.icon };
}

// who: null (up for grabs), a player id, or 'both'. float: show unclaimed task on the Home screen.
export function addInbox(title, cat, urgent, who = null, float = true) {
  S().inbox.push({ id: uid(), title, cat, urgent, claimedBy: who || null, float, created: Date.now() });
  log(`New inbox task: “${title}”`);
}

export function doInbox(id) {
  const it = S().inbox.find(x => x.id === id); if (!it?.claimedBy) return null;
  if (it.claimedBy === 'both') return doTogether({ title: it.title, catId: it.cat, inbox: true, urgent: it.urgent, finish: () => { S().inbox = S().inbox.filter(x => x !== it); } });
  const doer = P(it.claimedBy), q = partner(doer), stat = CATS[it.cat].stat;
  const r = { coins: 15 + (it.urgent ? 5 : 0), xp: 20, hearts: 0 }, notes = [];
  feed(doer, stat, 30); if (q) feed(q, stat, 10);
  if (needsHelp(q)) { r.hearts += 1; doer.n.helped++; notes.push(`💗 Covered for ${q.name}`); emit('help'); }
  const sb = bumpStreak(doer); if (sb) { r.coins += sb; notes.push(`🔥 ${doer.streak}-day streak +${sb}`); }
  S().inbox = S().inbox.filter(x => x !== it);
  if (!S().inbox.length) { r.coins += 10; notes.push('📭 Inbox zero +10'); }
  doer.n.inbox++; doer.n.done++;
  const gift = Math.random() < 0.3;
  if (gift) doer.gifts++;
  award(doer, r);
  houseXP(15);
  emit('chore', { cat: it.cat, stat, who: doer.id }); emit('inbox');
  log(`${doer.name} finished inbox task “${it.title}”`);
  return { ...r, notes, gift, giftTo: gift ? doer : null, stat, doer, owner: doer, owners: [doer], title: it.title, icon: CATS[it.cat].icon };
}

/* ---------- Real-life pet care ---------- */
// by: a player id or 'both'. Past each care's daily goal it still counts, but pays a token amount.
export function care(id, key, by) {
  const rp = (S().realPets || []).find(x => x.id === id), c = CARE[key];
  if (!rp || !c) return null;
  const k = dayKey();
  if (rp.day !== k) { rp.day = k; rp.done = {}; }
  rp.done[key] = (rp.done[key] || 0) + 1;
  rp[c.stat] = clamp(rp[c.stat] + c.amt);
  const full = rp.done[key] <= c.goal, doers = by === 'both' ? S().players : [P(by)];
  const r = full ? { coins: 5, xp: 8 } : { coins: 1, xp: 2 };
  for (const p of doers) {
    p.n.care = (p.n.care || 0) + 1;
    feed(p, 'fun', 5);
    award(p, { ...r, coins: r.coins + bumpStreak(p) });
  }
  houseXP(full ? 5 : 1);
  emit('care');
  log(`${doers.map(p => p.name).join(' & ')} ${c.past} ${rp.name} ${c.e}`);
  return { ...r, rp, c, doers, full, count: rp.done[key] };
}

/* ---------- Pets, gifts, wheel, shop ---------- */
export function cuddle(pid) {
  const p = P(pid), d = S().daily, now = Date.now();
  if (now - (p.lastPet || 0) > 20000) { p.lastPet = now; feed(p, 'fun', 3); }
  if (now - (d.lastPet || 0) > 800) { d.lastPet = now; emit('pet'); }
}

export const canSpin = p => S().daily && !S().daily.spun.includes(p.id) && p.lastDay === dayKey();

export function spin(pid) {
  const p = P(pid);
  if (!canSpin(p)) return null;
  const i = Math.floor(Math.random() * WHEEL.length), w = WHEEL[i];
  S().daily.spun.push(pid);
  award(p, { coins: w.coins || 0, xp: w.xp || 0, hearts: w.hearts || 0 });
  if (w.gift) p.gifts++;
  emit('spin');
  log(`${p.name} spun the wheel: ${w.e} ${w.label}`);
  return i;
}

export function openGift(pid) {
  const p = P(pid);
  if (p.gifts < 1) return null;
  p.gifts--; p.n.gifts++;
  const r = Math.random();
  let out;
  if (r < 0.45) {
    const rr = Math.random(), rarity = rr < 0.05 ? 'legendary' : rr < 0.27 ? 'rare' : 'common';
    const pool = STICKERS.filter(s => s.r === rarity), st = pool[Math.floor(Math.random() * pool.length)];
    const dup = !!S().album[st.id];
    S().album[st.id] = (S().album[st.id] || 0) + 1;
    if (dup) p.coins += 10;
    out = { kind: 'sticker', st, dup };
  } else if (r < 0.75) {
    const coins = 20 + Math.floor(Math.random() * 9) * 5;
    p.coins += coins; out = { kind: 'coins', coins };
  } else if (r < 0.9) {
    const stat = Object.keys(STATS)[Math.floor(Math.random() * 4)];
    feed(p, stat, 40); out = { kind: 'treat', stat };
  } else { p.hearts += 2; out = { kind: 'hearts', hearts: 2 }; }
  log(`${p.name} opened a gift 🎁`);
  return out;
}

export const findItem = id => TREATS.find(x => x.id === id) || ACCS.find(x => x.id === id) || ROOMS.find(x => x.id === id) || SPECIES.find(x => x.id === id);

export function buy(id, pid) {
  const p = P(pid), x = findItem(id);
  if (!x || p.coins < (x.coins || 0) || p.hearts < (x.hearts || 0)) return null;
  p.coins -= x.coins || 0; p.hearts -= x.hearts || 0;
  if (x.use) { for (const k in x.use) feed(p, k, x.use[k]); log(`${p.name} treated ${p.pet.name} to ${x.e}`); return { x, kind: 'treat' }; }
  p.owned.push(x.id);
  const kind = ACCS.includes(x) ? 'acc' : ROOMS.includes(x) ? 'room' : 'species';
  if (kind === 'acc') p.pet.acc = x.id; else if (kind === 'room') p.pet.room = x.id; else p.pet.species = x.id;
  log(`${p.name} unlocked ${x.e || ''} ${x.name}`);
  return { x, kind };
}
