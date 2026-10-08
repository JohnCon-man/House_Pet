// UI: views, interactions and the animation choreography around game actions.
import * as D from './data.js';
import { store, save, esc, P, partner, solo, newPlayer, spec, xpNeed, needsHelp, helpAsks, streakNow, hasSpecies, capLabel, stage, timeOfDay, isNight, mood, choresOf, inboxOf, dueCount, ownerName, defaultState, migrate, dayKey, addDays, newRealPet, rpById, coatOf, rpModel, rpDone, rpMood } from './state.js';
import { photoToPet } from './photo.js';
import * as G from './game.js';
import { petSVG, eggSVG } from './pet.js';
import { sfx, confetti, burst, popText, fly, countUp, splash, center, wait } from './fx.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const S = () => store.S;
const ui = {
  view: !S().setup ? 'setup' : S().players.every(p => p.pet.hatched) ? 'home' : 'hatch',
  shopFor: 'a', focus: 'a', setupMode: 'solo', addingPlayer: false, hasPets: null, carePending: null, undo: null, react: {}, hatch: {}, gift: null, spinFor: null, modal: false,
};
const STAGE_SCALE = { baby: 0.74, kid: 0.88, adult: 1 };
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- Pet reactions & speech ---------- */
function petExp(p) {
  const r = ui.react[p.id];
  if (r && r.until > Date.now()) return r.exp;
  return isNight() ? 'sleep' : mood(p).exp;
}
function updatePet(pid) {
  const el = $(`#pet-${pid}`); if (!el) return;
  const p = P(pid), rp = !p && rpById(pid);
  if (p) el.innerHTML = petSVG(p, petExp(p), { stage: stage(p.level) });
  else if (rp) el.innerHTML = rpSVG(rp);
}
function react(pid, exp, ms = 1400) {
  ui.react[pid] = { exp, until: Date.now() + ms };
  updatePet(pid);
  setTimeout(() => { if (ui.react[pid]?.until <= Date.now()) { delete ui.react[pid]; updatePet(pid); } }, ms + 30);
}
const speechTimers = {};
function say(pid, text) {
  const el = $(`#speech-${pid}`); if (!el) return;
  el.textContent = text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(speechTimers[pid]); speechTimers[pid] = setTimeout(() => el.classList.remove('show'), 3400);
}
function lineFor(p) {
  if (isNight()) return pick(D.LINES.night);
  const q = partner(p);
  if (q && needsHelp(q) && Math.random() < 0.6) return pick(D.LINES.help).replace('{p}', q.name);
  const low = Object.keys(D.STATS).filter(k => p.pet[k] < 40);
  return low.length ? pick(D.LINES[pick(low)]) : pick(D.LINES.happy);
}

/* ---------- Small components ---------- */
const opts = (pairs, sel) => pairs.map(([v, l]) => `<option value="${v}"${v == sel ? ' selected' : ''}>${l}</option>`).join('');
const catOpts = sel => opts(Object.entries(D.CATS).map(([k, c]) => [k, `${c.icon} ${c.label}`]), sel);
const everyLabel = n => D.EVERY.find(e => e[0] === n)?.[1] || `Every ${n}d`;
const miniPet = (p, exp = 'ok') => `<span class="mini-pet">${petSVG(p, exp, { stage: 'kid' })}</span>`;
const chips = (act, cur) => `<div class="chips">${S().players.map(p =>
  `<button class="chip${p.id === cur ? ' on' : ''}" style="--c:${p.color}" data-act="${act}" data-p="${p.id}">${miniPet(p)} ${esc(p.name)}${dueCount(p.id) && act === 'focus' ? `<i class="dot">${dueCount(p.id)}</i>` : ''}</button>`).join('')}</div>`;
const SKY = { morning: '🌤️', day: '☀️', evening: '🌅', night: '🌙' };

function ring(p, k) {
  const v = Math.round(p.pet[k]), s = D.STATS[k], C = 2 * Math.PI * 21;
  return `<div class="ring${v < 30 ? ' low' : ''}" title="${s.label} ${v}%">
    <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="21" class="track"/><circle id="ring-${p.id}-${k}" cx="26" cy="26" r="21" class="val" stroke="${s.color}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - v / 100)).toFixed(1)}" data-v="${v}"/></svg>
    <span>${s.icon}</span><small>${s.label}</small></div>`;
}

function roomScene(p) {
  const room = D.ROOMS.find(r => r.id === p.pet.room) || D.ROOMS[0], tod = timeOfDay(), m = mood(p), sleeping = isNight() && !ui.react[p.id];
  const decor = D.HOUSE.filter(h => h.lvl <= S().house.level).map((h, i) => `<span class="decor d${i}" title="${h.name}">${h.e}</span>`).join('');
  const spin = G.canSpin(p) ? `<button class="room-btn spin ready" data-act="wheel" data-p="${p.id}" aria-label="Spin the daily wheel">🎡<i>Spin!</i></button>`
    : S().daily?.spun.includes(p.id) ? '' : `<button class="room-btn spin locked" data-act="wheelLocked" aria-label="Wheel locked">🎡<i>🔒</i></button>`;
  const gift = p.gifts > 0 ? `<button class="room-btn gift" id="gift-${p.id}" data-act="gift" data-p="${p.id}" aria-label="Open gift">🎁<i>${p.gifts}</i></button>` : `<span class="room-btn ghost" id="gift-${p.id}"></span>`;
  return `<div class="room tod-${tod}${room.dark ? ' dark' : ''}" style="--wall:${room.wall};--wall2:${room.wall2};--floor:${room.floor}">
    <div class="window"><span class="sky-obj">${SKY[tod]}</span>${tod === 'night' ? '<span class="stars">✨</span>' : '<span class="cloud">☁️</span>'}</div>
    ${decor}<div class="floor"></div><div class="rug" style="--c:${p.color}"></div>
    <button class="pet-btn" id="pet-${p.id}" data-act="pet" data-p="${p.id}" aria-label="Cuddle ${esc(p.pet.name)}" style="--s:${STAGE_SCALE[stage(p.level)]}">${petSVG(p, petExp(p), { stage: stage(p.level) })}</button>
    <div class="speech" id="speech-${p.id}"></div>
    ${needsHelp(p) ? '<div class="sos">🆘</div>' : ''}
    <div class="room-actions">${gift}${spin}</div>
    <div class="nameplate"><b>${esc(p.pet.name)}</b><span>${sleeping ? '💤 Sleeping' : `${m.e} ${m.label}`}</span></div>
  </div>`;
}

const togetherTag = '<span class="together-tag">👫 Together</span>';

function choreRow({ c, i }, by, helping) {
  const cat = D.CATS[c.cat], shared = c.owner === 'both';
  const tags = [shared && togetherTag, i.label, everyLabel(c.every), c.helpReq && '<em>🙋 asked for help</em>', i.d > 0 && i.k !== 'done' && '<span class="early">🐦 early bonus</span>'].filter(Boolean).join(' · ');
  const btns = i.k === 'done' ? '<span class="check done" aria-label="Done">✓</span>' : helping
    ? `<button class="btn help" data-act="do" data-id="${c.id}" data-by="${by}">🤝 I'll do it</button>`
    : `${shared || solo() ? '' : `<button class="icon-btn${c.helpReq ? ' on' : ''}" data-act="ask" data-id="${c.id}" aria-label="Ask for help">🙋</button>`}
       <button class="check" data-act="do" data-id="${c.id}" data-by="${by}" aria-label="Mark done">✓</button>`;
  return `<li class="chore k-${i.k}" style="--cc:${cat.color}"><span class="cat-badge">${cat.icon}</span>
    <div class="ct"><b>${esc(c.title)}</b><small>${tags}</small></div>${btns}</li>`;
}

// An inbox task someone claimed, shown in their task list on Home.
function inboxRow(it) {
  const cat = D.CATS[it.cat];
  const tags = ['📥 Inbox task', it.claimedBy === 'both' && togetherTag, it.urgent && '<em>🔥 Urgent</em>'].filter(Boolean).join(' · ');
  return `<li class="chore k-today from-inbox" style="--cc:${cat.color}"><span class="cat-badge">${cat.icon}</span>
    <div class="ct"><b>${esc(it.title)}</b><small>${tags}</small></div>
    <button class="icon-btn" data-act="release" data-id="${it.id}" aria-label="Put back up for grabs">↩️</button>
    <button class="check" data-act="doInbox" data-id="${it.id}" aria-label="Mark done">✓</button></li>`;
}

const claimBtns = it => solo()
  ? `<button class="btn claim" style="--c:${S().players[0].color}" data-act="claim" data-id="${it.id}" data-p="a">✋ I'll do it</button>`
  : S().players.map(p => `<button class="btn claim" style="--c:${p.color}" data-act="claim" data-id="${it.id}" data-p="${p.id}">${miniPet(p)} ${esc(p.name)}</button>`).join('')
  + `<button class="btn claim together" data-act="claim" data-id="${it.id}" data-p="both">👫 Together</button>`;

function helpPanel(p, q) {
  const list = choresOf(q.id).filter(x => x.c.owner === q.id && (x.c.helpReq || x.i.k === 'over' || x.i.k === 'today'));
  const why = [q.needHelp && 'asked for a hand', q.capacity < 35 && `is ${capLabel(q.capacity)[1].toLowerCase()}`, helpAsks(q).length && `flagged ${helpAsks(q).length} chore${helpAsks(q).length > 1 ? 's' : ''}`].filter(Boolean).join(' · ');
  return `<div class="help-panel"><div class="help-h"><span class="envelope">💌</span><div><b>${esc(q.pet.name)} needs a hand!</b><small>${esc(q.name)} ${why}</small></div></div>
    ${list.length ? `<ul class="chores">${list.map(x => choreRow(x, p.id, true)).join('')}</ul>`
      : `<p class="muted">Nothing due for them — grab something from the <button class="link" data-act="tab" data-v="inbox">📥 Inbox</button>.</p>`}
    <p class="tiny">Helping earns 💗 hearts — the rarest currency in the game.</p></div>`;
}

function playerCol(p) {
  const q = partner(p), list = choresOf(p.id), due = dueCount(p.id), [ce, cl] = capLabel(p.capacity);
  return `<section class="player" data-p="${p.id}" style="--c:${p.color}"><div class="p-left">
    <div class="phead">
      <div class="who"><b>${esc(p.name)}</b><span class="lvl">Lv ${p.level}</span></div>
      <div class="wallet"><span class="pill coin">🪙 <b id="coins-${p.id}">${p.coins}</b></span><span class="pill heart">💗 <b id="hearts-${p.id}">${p.hearts}</b></span><span class="pill fire${streakNow(p) ? '' : ' off'}">🔥 <b>${streakNow(p)}</b></span></div>
    </div>
    ${roomScene(p)}
    <div class="xpbar"><i style="width:${(p.xp / xpNeed(p.level) * 100).toFixed(1)}%"></i><span>⭐ ${p.xp} / ${xpNeed(p.level)} XP to Lv ${p.level + 1}</span></div>
    <div class="rings">${Object.keys(D.STATS).map(k => ring(p, k)).join('')}</div>
    ${q && needsHelp(q) ? helpPanel(p, q) : ''}
    <div class="cap">
      <div class="cap-top"><span>How's my energy?</span><b class="cap-lbl">${ce} ${cl}</b></div>
      <input type="range" min="0" max="100" step="5" value="${p.capacity}" data-chg="cap" data-p="${p.id}" aria-label="${esc(p.name)} capacity">
      ${q ? `<button class="pill-btn${p.needHelp ? ' on' : ''}" data-act="needHelp" data-p="${p.id}">${p.needHelp ? '🆘 Help requested · tap to cancel' : '🙋 I could use some help'}</button>` : ''}
      ${p.capacity < 35 ? '<p class="tiny">🛌 Rest mode: your pet’s needs drop half as fast while you recharge.</p>' : ''}
    </div></div><div class="p-right">
    <h3>My tasks ${due ? `<span class="badge">${due} to do</span>` : '<span class="badge ok">all clear ✨</span>'}</h3>
    <ul class="chores">${inboxOf(p.id).map(inboxRow).join('')}${list.map(x => choreRow(x, p.id)).join('') || '<li class="empty">No chores yet — add some in ⚙️ Settings.</li>'}</ul>
  </div></section>`;
}

function questStrip() {
  G.ensureDaily();
  const d = S().daily, claimed = d.quests.filter(q => q.claimed).length;
  return `<section class="quests">
    <div class="q-head"><h2>☀️ Today's quests</h2><span class="tiny">${solo() ? 'Rewards · +15🪙' : 'Team rewards · +15🪙 each'}</span>
      <span class="chest${d.chest ? ' open' : ''}" title="Claim all 3 for a gift each">${d.chest ? '🎁 Chest claimed!' : `🧰 ${claimed}/3 → bonus gifts`}</span></div>
    <div class="q-list">${d.quests.map(q => {
      const def = G.questDef(q.id), ready = q.prog >= def.goal && !q.claimed;
      return `<div class="quest${q.claimed ? ' claimed' : ready ? ' ready' : ''}"><span class="q-e">${def.e}</span>
        <div class="q-body"><b>${def.name}</b><div class="q-bar"><i style="width:${q.prog / def.goal * 100}%"></i><span>${q.prog}/${def.goal}</span></div></div>
        ${q.claimed ? '<span class="q-done">✓</span>' : ready ? `<button class="btn primary sm" data-act="claimQuest" data-id="${q.id}">Claim</button>` : ''}</div>`;
    }).join('')}</div></section>`;
}

// Unclaimed inbox tasks marked to float on Home, so either of you can grab one.
function floatStrip() {
  const items = S().inbox.filter(it => !it.claimedBy && it.float !== false).sort((a, b) => b.urgent - a.urgent || a.created - b.created);
  if (!items.length) return '';
  return `<section class="floaters"><div class="q-head"><h2>🎈 ${solo() ? 'Saved for later' : 'Up for grabs'}</h2><span class="tiny">${solo() ? 'Tap to add one to your list · +15🪙 and a 30% gift chance' : 'Grab one for +15🪙 and a 30% gift chance, or team up 👫'}</span></div>
    <div class="float-list">${items.map((it, n) => {
      const cat = D.CATS[it.cat];
      return `<div class="floater${it.urgent ? ' urgent' : ''}" style="--cc:${cat.color};--d:${(n % 4) * -0.8}s">
        <div class="f-top"><span class="cat-badge">${cat.icon}</span><div class="ct"><b>${esc(it.title)}</b><small>${it.urgent ? '🔥 Urgent' : cat.label}</small></div></div>
        <div class="acts">${claimBtns(it)}</div></div>`;
    }).join('')}</div></section>`;
}

/* ---------- Real-life pets ---------- */
const rps = () => S().realPets || [];
const MAX_RP = D.MAX_REAL_PETS;
function rpExp(rp) {
  const r = ui.react[rp.id];
  if (r && r.until > Date.now()) return r.exp;
  return isNight() ? 'sleep' : rpMood(rp).exp;
}
const rpSVG = (rp, exp) => petSVG(rpModel(rp), exp || rpExp(rp), { coat: coatOf(rp) });
const meterColor = v => v >= 60 ? '#22c55e' : v >= 30 ? '#f59e0b' : '#ef4444';
const joyIcon = rp => rp.kind === 'dog' ? '🦮' : '🧶';
const RP_SAY = {
  feed: ['Nom nom nom! 🍖', 'Best. Meal. Ever. 😋', 'My tummy says thank you!'],
  walk: ['Walkies!! 🦮', 'I sniffed SO many things!', 'Again tomorrow? 🐾'],
  play: ['Got the string! 🧶', 'Again, again!', '*pounce* ✨'],
  water: ['Ahh, fresh water 💧', 'So refreshing!'],
  litter: ['Much better, thank you 🧹', 'A clean box! 👑'],
};
function rpLine(rp) {
  if (isNight()) return pick(D.LINES.night);
  if (rp.food < 40) return pick(['Is it dinner time? 🍖', '*stares at food bowl*', 'I could eat… 🍖']);
  if (rp.joy < 40) return rp.kind === 'dog' ? pick(['Walk? Walk?? WALK?! 🦮', '*brings you the leash*']) : pick(['Play with me! 🧶', '*knocks something off the table*']);
  if (rp.fresh < 40) return rp.kind === 'cat' ? pick(['Psst… the litter box 🧹', 'My water is not fresh 💧']) : 'My water bowl is low 💧';
  return pick(rp.kind === 'cat' ? ['Purrrfect day ☀️', '*slow blink* 💕', 'I love my humans 💖'] : ['Best family ever! 💖', '*happy tail wags*', 'You’re my favorite! 🐾']);
}

function rpCard(rp) {
  const m = rpMood(rp), sleeping = isNight() && !ui.react[rp.id];
  const cares = Object.entries(D.CARE).filter(([, c]) => c.kinds.includes(rp.kind));
  return `<div class="rp-card" style="--rc:${coatOf(rp).body}">
    <div class="rp-scene">
      ${rp.photo ? `<img class="polaroid" src="${rp.photo}" alt="Photo of ${esc(rp.name)}">` : ''}
      <button class="pet-btn rp" id="pet-${rp.id}" data-act="rpPet" data-id="${rp.id}" aria-label="Cuddle ${esc(rp.name)}">${rpSVG(rp)}</button>
      <div class="speech" id="speech-${rp.id}"></div>
    </div>
    <div class="rp-name"><b>${esc(rp.name)}</b><small>${sleeping ? '💤 Sleeping' : `${m.e} ${m.label}`}</small></div>
    <div class="rp-meters">${Object.entries(D.RP_STATS).map(([k, st]) => {
      const v = Math.round(rp[k]);
      return `<div class="rp-m" title="${st.label} ${v}%"><span>${k === 'joy' ? joyIcon(rp) : st.icon}</span><div class="bar"><i style="width:${v}%;background:${meterColor(v)}"></i></div></div>`;
    }).join('')}</div>
    <div class="rp-care">${cares.map(([k, c]) => {
      const n = rpDone(rp, k);
      return `<button class="care${n >= c.goal ? ' done' : ''}" data-act="care" data-id="${rp.id}" data-c="${k}"><span>${c.e}</span><b>${c.label}</b><small>${n >= c.goal ? '✓ ' : ''}${n}/${c.goal}</small></button>`;
    }).join('')}</div>
  </div>`;
}

function realPetsStrip() {
  if (!rps().length) return '';
  return `<section class="rpets"><div class="q-head"><h2>🐾 ${rps().length > 1 ? 'Our pets' : 'Our pet'}</h2><span class="tiny">Real-life feeding, walks and care keep them happy · +5🪙 a task</span></div>
    <div class="rp-list">${rps().map(rpCard).join('')}</div></section>`;
}

const swatchBg = c => c.spots ? `conic-gradient(${c.body} 0 50%, ${c.spots[0]} 0 75%, ${c.spots[1] || c.belly} 0)`
  : `linear-gradient(135deg, ${c.body} 0 58%, ${c.stripes || c.belly} 58%)`;

function rpEditor(rp) {
  const coat = coatOf(rp);
  return `<div class="rp-edit" style="--rc:${coat.body}">
    <div class="rp-preview">${rp.photo ? `<img class="polaroid" src="${rp.photo}" alt="">` : ''}${rpSVG(rp, 'happy')}<small>${rp.custom ? '📷 Colors from photo' : esc(coat.name)}</small></div>
    <div class="rp-fields">
      <label>Pet’s name <input value="${esc(rp.name)}" data-chg="rpet.name" data-id="${rp.id}" maxlength="20"></label>
      <div class="seg">${['cat', 'dog'].map(k => `<button type="button" class="seg-b${rp.kind === k ? ' on' : ''}" data-act="rpKind" data-id="${rp.id}" data-k="${k}">${k === 'cat' ? '🐱 Cat' : '🐶 Dog'}</button>`).join('')}</div>
      <span class="label">Coat</span>
      <div class="coats">${D.COATS[rp.kind].map(c => `<button type="button" class="coat${!rp.custom && rp.coat === c.id ? ' on' : ''}" data-act="rpCoat" data-id="${rp.id}" data-c="${c.id}" title="${c.name}" aria-label="${c.name}" style="background:${swatchBg(c)}"></button>`).join('')}</div>
      <div class="row rp-actions">
        <label class="btn">📷 ${rp.photo ? 'New photo' : 'Add a photo'}<input type="file" accept="image/*" data-chg="rpPhoto" data-id="${rp.id}" hidden></label>
        ${rp.photo ? `<button type="button" class="btn" data-act="rpPhotoOff" data-id="${rp.id}">Remove photo</button>` : ''}
        <button type="button" class="icon-btn" data-act="rpRemove" data-id="${rp.id}" aria-label="Remove ${esc(rp.name)}">🗑️</button>
      </div>
    </div></div>`;
}

function petsEditor() {
  return `<div class="rp-editors">${rps().map(rpEditor).join('')}</div>
    ${rps().length < MAX_RP ? `<div class="row"><button type="button" class="btn" data-act="rpAdd" data-k="dog">🐶 Add a dog</button><button type="button" class="btn" data-act="rpAdd" data-k="cat">🐱 Add a cat</button><span class="tiny">${rps().length}/${MAX_RP} pets</span></div>`
      : `<p class="tiny">That’s the max of ${MAX_RP} pets for now.</p>`}
    <p class="tiny">📷 A photo stays on this device. We crop it into a portrait and match your pet’s colors from it.</p>`;
}

// Setup and Settings both host the pet editor; keep typed setup fields when it re-renders.
function rerender() { if (ui.view === 'setup') captureSetup($('form[data-form=setup]')); render(); }

/* ---------- Views ---------- */
function homeView() {
  if (solo()) return `${questStrip()}${floatStrip()}${realPetsStrip()}<div class="duo solo">${playerCol(S().players[0])}</div>`;
  return `${questStrip()}${floatStrip()}${realPetsStrip()}<div class="focus-bar">${chips('focus', ui.focus)}</div>
    <div class="duo" data-focus="${ui.focus}">${S().players.map(playerCol).join('')}</div>`;
}

function inboxView() {
  const items = [...S().inbox].sort((a, b) => b.urgent - a.urgent || a.created - b.created);
  return `<section class="card"><h2>📥 Shared Inbox</h2>
    <p class="muted">${solo() ? 'Jot down one-off jobs. Add them straight to your list, or let them 🎈 float on Home until you have the energy. Inbox jobs pay <b>+15🪙</b> and a 30% gift chance.'
      : 'Drop in anything that needs doing. Assign it to one of you, to both of you 👫, or leave it up for grabs. 🎈 Floating tasks show on Home so whoever has the energy can grab them. Inbox jobs pay <b>+15🪙</b>, a 30% gift chance, and <b>💗</b> if your partner is struggling.'}</p>
    <form data-form="inbox" class="row">
      <input name="task" placeholder="e.g. Clean out the fridge" maxlength="80" required autocomplete="off">
      <select name="cat">${catOpts('cleaning')}</select>
      <select name="who" aria-label="Assign to">${opts(solo() ? [['', '🎈 Save for later'], ['a', '→ My list']] : [['', '🎈 Up for grabs'], ...S().players.map(p => [p.id, `→ ${esc(p.name)}`]), ['both', '👫 Together']], '')}</select>
      <label class="chk"><input type="checkbox" name="float" checked> 🎈 Float on Home</label>
      <label class="chk"><input type="checkbox" name="urgent"> 🔥 Urgent</label>
      <button class="btn primary">Add</button>
    </form>
    <ul class="inbox">${items.map(it => {
      const cat = D.CATS[it.cat], both = it.claimedBy === 'both', who = it.claimedBy && !both && P(it.claimedBy);
      const status = both ? 'Assigned to both of you 👫' : who ? `Assigned to ${esc(who.name)}` : it.float !== false ? '🎈 Up for grabs · floating on Home' : 'Up for grabs';
      return `<li class="${it.urgent ? 'urgent' : ''}" style="--cc:${cat.color};${who ? `--c:${who.color}` : both ? '--c:#8b5cf6' : ''}">
        <span class="cat-badge">${cat.icon}</span>
        <div class="ct"><b>${esc(it.title)}</b><small>${it.urgent ? '🔥 Urgent · ' : ''}${status}</small></div>
        <div class="acts">${it.claimedBy
          ? `<button class="btn primary" data-act="doInbox" data-id="${it.id}">✓ Done</button><button class="icon-btn" data-act="release" data-id="${it.id}" aria-label="Put back up for grabs">↩️</button>`
          : `${claimBtns(it)}<button class="icon-btn${it.float !== false ? ' on' : ''}" data-act="floatToggle" data-id="${it.id}" aria-label="Float on Home">🎈</button>`}
          <button class="icon-btn" data-act="delInbox" data-id="${it.id}" aria-label="Delete">🗑️</button></div></li>`;
    }).join('') || '<li class="empty">📭 Inbox zero. Your pets are proud.</li>'}</ul></section>`;
}

function shopView() {
  const p = P(ui.shopFor), room = D.ROOMS.find(r => r.id === p.pet.room);
  const price = x => x.hearts ? `${x.hearts} 💗` : x.coins ? `${x.coins} 🪙` : 'Free';
  const card = (inner, btn, cls = '') => `<div class="shop-item ${cls}">${inner}${btn}</div>`;
  const treats = D.TREATS.map(x => card(`<span class="big">${x.e}</span><b>${x.name}</b><small>${Object.entries(x.use).map(([k, v]) => `+${v}${D.STATS[k].icon}`).join(' ')}</small>`,
    `<button class="btn primary" data-act="buy" data-id="${x.id}">${price(x)}</button>`));
  const accs = D.ACCS.map(x => {
    const own = p.owned.includes(x.id), on = p.pet.acc === x.id;
    return card(`<span class="big">${x.e}</span><b>${x.name}</b>`, own ? `<button class="btn${on ? ' on' : ''}" data-act="wear" data-id="${x.id}">${on ? 'Wearing ✓' : 'Wear'}</button>`
      : `<button class="btn${x.hearts ? ' love' : ' primary'}" data-act="buy" data-id="${x.id}">${price(x)}</button>`, (on ? 'sel' : '') + (x.hearts ? ' lovely' : ''));
  });
  const looks = D.SPECIES.map(s => {
    const has = hasSpecies(p, s), cur = p.pet.species === s.id;
    const btn = cur ? '<button class="btn on">Current ✓</button>' : has ? `<button class="btn" data-act="species" data-id="${s.id}">Choose</button>`
      : s.lvl ? `<button class="btn" disabled>🔒 Lv ${s.lvl}</button>` : `<button class="btn love" data-act="buy" data-id="${s.id}">${price(s)}</button>`;
    return card(`<span class="look">${petSVG({ pet: { species: s.id } }, has ? 'happy' : 'ok')}</span><b>${s.name}</b>`, btn, (cur ? 'sel' : '') + (has ? '' : ' locked') + (s.hearts ? ' lovely' : ''));
  });
  const rooms = D.ROOMS.map(r => {
    const has = !r.coins && !r.hearts || p.owned.includes(r.id), cur = p.pet.room === r.id;
    const btn = cur ? '<button class="btn on">Home ✓</button>' : has ? `<button class="btn" data-act="room" data-id="${r.id}">Move in</button>`
      : `<button class="btn${r.hearts ? ' love' : ' primary'}" data-act="buy" data-id="${r.id}">${price(r)}</button>`;
    return card(`<span class="swatch" style="background:linear-gradient(${r.wall} 0 62%, ${r.floor} 62%)">${r.e}</span><b>${r.name}</b>`, btn, (cur ? 'sel' : '') + (r.hearts ? ' lovely' : ''));
  });
  return `<section class="card shop" style="--c:${p.color}">
    <div class="shop-top"><div><h2>🛍️ Pet Shop</h2>${chips('shopFor', ui.shopFor)}
      <p class="big-wallet"><span class="pill coin">🪙 <b>${p.coins}</b></span> <span class="pill heart">💗 <b>${p.hearts}</b></span></p>
      <p class="muted">🪙 Coins come from chores. 💗 Hearts ${solo() ? 'come from clearing everything due in a day ✅, gifts and the wheel' : 'only come from helping your partner'} — they unlock the rarest stuff.</p></div>
      <div class="dressing room" style="--wall:${room.wall};--wall2:${room.wall2};--floor:${room.floor}"><div class="floor"></div>
        <button class="pet-btn" data-act="pet" data-p="${p.id}" style="--s:${STAGE_SCALE[stage(p.level)]}">${petSVG(p, 'happy', { stage: stage(p.level) })}</button></div></div>
    <h3>🍰 Treats <small class="muted">instant boost for ${esc(p.pet.name)}</small></h3><div class="grid">${treats.join('')}</div>
    <h3>🎀 Accessories</h3><div class="grid">${accs.join('')}</div>
    <h3>🐾 Looks <small class="muted">level up or spend 💗 to unlock</small></h3><div class="grid">${looks.join('')}</div>
    <h3>🏡 Rooms</h3><div class="grid">${rooms.join('')}</div></section>`;
}

function albumView() {
  const owned = Object.keys(S().album).length, h = S().house;
  const days = Array.from({ length: 14 }, (_, i) => dayKey(addDays(Date.now(), i - 13)));
  const col = p => `<section class="card" style="--c:${p.color}"><h2>${miniPet(p, 'happy')} ${esc(p.name)} <span class="lvl">Lv ${p.level}</span></h2>
    <div class="kpis"><div><b>${p.n.done}</b>chores</div><div><b>${p.n.helped}</b>helps</div><div><b>${p.n.early}</b>early</div><div><b>${streakNow(p)}</b>streak</div><div><b>${p.n.gifts}</b>gifts</div></div>
    <div class="cal" title="Last 14 days">${days.map(d => `<span class="${p.days.includes(d) ? 'on' : ''}${d === dayKey() ? ' today' : ''}">${new Date(d).toLocaleDateString([], { weekday: 'narrow' })}</span>`).join('')}</div>
    <div class="ach">${D.ACH.filter(a => !(a.team && solo()) && !(a.pets && !rps().length)).map(a => `<div class="a${p.ach.includes(a.id) ? '' : ' locked'}"><span>${a.e}</span><b>${a.name}</b><small>${a.desc}</small></div>`).join('')}</div></section>`;
  return `<section class="card album"><h2>📒 Sticker Album <span class="badge ok">${owned}/${D.STICKERS.length}</span></h2>
      <p class="muted">${solo() ? '' : 'Shared by both of you. '}Stickers come from 🎁 gifts — found while doing chores, levelling up, and finishing daily quests.</p>
      <div class="stickers">${D.STICKERS.map(s => S().album[s.id]
        ? `<div class="sticker r-${s.r}"><span>${s.e}</span>${S().album[s.id] > 1 ? `<i>×${S().album[s.id]}</i>` : ''}</div>`
        : `<div class="sticker missing r-${s.r}"><span>?</span></div>`).join('')}</div></section>
    <section class="card"><h2>🏡 Our House <span class="badge">Lv ${h.level}</span></h2>
      <div class="xpbar house"><i style="width:${h.level >= D.HOUSE.length ? 100 : h.xp / D.houseNeed(h.level) * 100}%"></i><span>${h.level >= D.HOUSE.length ? 'Max level!' : `${h.xp} / ${D.houseNeed(h.level)} house XP`}</span></div>
      <div class="house-items">${D.HOUSE.map(x => `<div class="${x.lvl <= h.level ? '' : 'locked'}"><span>${x.e}</span><small>Lv ${x.lvl}</small></div>`).join('')}</div>
      <p class="tiny">Every chore either of you does builds up the house. Teamwork counts double.</p></section>
    <div class="duo all">${S().players.map(col).join('')}</div>
    <section class="card"><h2>📜 Recent activity</h2><ul class="log">${S().log.slice(0, 30).map(l =>
      `<li><small>${new Date(l.t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</small> ${esc(l.text)}</li>`).join('') || '<li class="muted">Nothing yet!</li>'}</ul></section>`;
}

function settingsView() {
  const people = [...S().players.map(p => [p.id, esc(p.name)]), ['both', '👫 Together']];
  return `<section class="card"><h2>👥 Players</h2><div class="duo all">${S().players.map(p => `<div class="fields" style="--c:${p.color}">
      <label>Name <input value="${esc(p.name)}" data-chg="player.name" data-p="${p.id}" maxlength="20"></label>
      <label>Pet name <input value="${esc(p.pet.name)}" data-chg="player.pet.name" data-p="${p.id}" maxlength="20"></label>
      <div class="swatches">${D.COLORS.map(c => `<button class="sw${p.color === c ? ' on' : ''}" style="background:${c}" data-act="color" data-p="${p.id}" data-c="${c}" aria-label="Color ${c}"></button>`).join('')}</div></div>`).join('')}</div></section>
    <section class="card"><h2>🐾 Our real pets</h2>
      <p class="muted">Optional. Add your real cats and dogs. Each gets a virtual twin on Home, and real feeding, walks and litter keep it happy.</p>
      ${petsEditor()}</section>
    <section class="card"><h2>🧹 Assigned chores</h2>
      <form data-form="chore" class="row">
        <input name="task" placeholder="New chore" maxlength="60" required autocomplete="off">
        <select name="cat">${catOpts('cleaning')}</select>
        ${solo() ? '<input type="hidden" name="owner" value="a">' : `<select name="owner">${opts(people, 'a')}</select>`}
        <select name="every">${opts(D.EVERY, 7)}</select>
        <button class="btn primary">Add</button>
      </form>
      <ul class="manage${solo() ? ' solo' : ''}">${S().chores.map(c => `<li>
        <input value="${esc(c.title)}" data-chg="chore.title" data-id="${c.id}" maxlength="60" aria-label="Title">
        <select data-chg="chore.cat" data-id="${c.id}">${catOpts(c.cat)}</select>
        ${solo() ? '' : `<select data-chg="chore.owner" data-id="${c.id}">${opts(people, c.owner)}</select>`}
        <select data-chg="chore.every" data-id="${c.id}">${opts(D.EVERY, c.every)}</select>
        <button class="icon-btn" data-act="delChore" data-id="${c.id}" aria-label="Delete">🗑️</button></li>`).join('')}</ul>
      <p class="tiny">Chore type decides what it does for the pet: 🍳 feeds · 🧽🧺 bathes · 🛒🌿 plays · 📋✨ rests.</p></section>
    ${solo() ? `<section class="card"><h2>👫 Play with someone?</h2><p class="muted">Add a second player to share chores, help each other out and earn 💗 hearts together. Your pet and progress stay as they are.</p>
      <button class="btn primary" data-act="addPlayer">👫 Add a second player</button></section>` : ''}
    <section class="card"><h2>⚙️ App</h2><div class="row">
      <button class="btn" data-act="sound">${S().sound ? '🔊 Sound on' : '🔇 Sound off'}</button>
      <button class="btn" data-act="export">💾 Back up data</button>
      <button class="btn" data-act="import">📦 Restore backup</button>
      <input type="file" id="importFile" accept="application/json" data-chg="import" hidden>
      <button class="btn danger" data-act="reset">🧨 Start over</button></div>
      <p class="tiny">Saved on this device. On iPad: Safari → Share → “Add to Home Screen” for a full-screen app that works offline.</p></section>`;
}

// Copy what's typed on the setup screen into state, so switching modes doesn't lose it.
function captureSetup(f) {
  S().players.forEach((p, i) => {
    if (!f[`n${i}`]) return;
    p.name = f[`n${i}`].value.trim() || p.name;
    p.pet.name = f[`pn${i}`].value.trim() || p.pet.name;
    p.pet.species = f[`sp${i}`].value || p.pet.species;
    p.color = f[`c${i}`].value || p.color;
  });
}

function setupView() {
  const base = D.SPECIES.filter(s => !s.lvl && !s.hearts), one = ui.setupMode === 'solo' && !ui.addingPlayer;
  const players = one ? S().players.slice(0, 1) : S().players, hasPets = ui.hasPets ?? rps().length > 0;
  return `<section class="setup"><div class="setup-hero"><div class="logo-big">🏡</div><h1>House<span>Pet</span></h1>
      <p>${ui.addingPlayer ? 'Welcome your new housemate! Set up their pet below.' : one ? 'Raise a pet by keeping your home happy. Doing chores feeds, bathes and plays with it. Clear your day to earn 💗 hearts and the rarest unlocks.'
        : 'Each of you raises a pet. Doing chores feeds, bathes and plays with it. Help each other out to earn 💗 hearts and the rarest unlocks.'}</p></div>
    ${ui.addingPlayer ? '' : `<div class="mode-pick" role="radiogroup" aria-label="How many players?">
      <button class="mode${one ? ' on' : ''}" data-act="setupMode" data-m="solo" role="radio" aria-checked="${one}"><span>🧍</span><b>Just me</b><small>1 player</small></button>
      <button class="mode${one ? '' : ' on'}" data-act="setupMode" data-m="duo" role="radio" aria-checked="${!one}"><span>👫</span><b>Two of us</b><small>2 players · share chores and help each other</small></button></div>`}
    <form data-form="setup"><div class="duo all${one ? ' one' : ''}">${players.map((p, i) => `<div class="fields setup-card" style="--c:${p.color}">
      <label>Your name <input name="n${i}" value="${p.name.startsWith('Player') ? '' : esc(p.name)}" placeholder="${esc(p.name)}" maxlength="20"></label>
      <label>Pet name <input name="pn${i}" value="${esc(p.pet.name)}" maxlength="20"></label>
      <span class="label">Pick a pet</span>
      <div class="species">${base.map(s => `<label><input type="radio" name="sp${i}" value="${s.id}"${p.pet.species === s.id ? ' checked' : ''}><span>${petSVG({ pet: { species: s.id } }, 'happy')}<small>${s.name}</small></span></label>`).join('')}</div>
      <span class="label">Pick a color</span>
      <div class="swatches">${D.COLORS.map(c => `<label class="sw-l"><input type="radio" name="c${i}" value="${c}"${p.color === c ? ' checked' : ''}><span class="sw" style="background:${c}"></span></label>`).join('')}</div>
    </div>`).join('')}</div>
    ${ui.addingPlayer ? '' : `<section class="setup-pets"><h2>🐾 Any pets at home?</h2>
      <p class="muted">Optional. Add your real cats and dogs (up to ${MAX_RP}). Each gets a virtual twin, and real feeding, walks and litter keep it happy.</p>
      <div class="mode-pick small" role="radiogroup" aria-label="Pets at home?">
        <button type="button" class="mode${hasPets ? '' : ' on'}" data-act="setupPets" data-v="0" role="radio" aria-checked="${!hasPets}"><span>🏠</span><b>No pets</b></button>
        <button type="button" class="mode${hasPets ? ' on' : ''}" data-act="setupPets" data-v="1" role="radio" aria-checked="${hasPets}"><span>🐾</span><b>Yes, we have pets</b></button></div>
      ${hasPets ? petsEditor() : ''}</section>
      <p class="muted center">We added some starter chores — tweak them anytime in ⚙️ Settings.</p>`}
    <div class="center"><button class="btn primary big">${one ? 'Get my egg 🥚' : 'Get our eggs 🥚'}</button></div></form></section>`;
}

function hatchView() {
  const all = S().players.every(p => p.pet.hatched);
  return `<section class="hatch"><h1>${all ? 'Say hello!' : solo() ? 'Your egg is wiggling!' : 'Your eggs are wiggling!'}</h1><p class="muted">${all ? `Keep ${solo() ? 'it' : 'them'} happy by keeping your home happy.` : solo() ? 'Tap the egg to hatch your pet.' : 'Tap each egg to hatch your pet.'}</p>
    <div class="eggs">${S().players.map(p => `<div class="egg-slot" style="--c:${p.color}" id="slot-${p.id}">${p.pet.hatched
      ? `<div class="hatched">${petSVG(p, 'joy', { stage: 'baby' })}</div><b>${esc(p.pet.name)}</b><small>${esc(p.name)}'s ${spec(p.pet.species).name}</small>`
      : `<button class="egg c${ui.hatch[p.id] || 0}" data-act="hatchTap" data-p="${p.id}" aria-label="Tap egg">${eggSVG(p.color, ui.hatch[p.id] || 0)}</button><b>${esc(p.name)}'s egg</b><small>${'●'.repeat(ui.hatch[p.id] || 0)}${'○'.repeat(4 - (ui.hatch[p.id] || 0))}</small>`}</div>`).join('')}</div>
    ${all ? '<button class="btn primary big" data-act="startGame">Let’s go! 🏡</button>' : ''}</section>`;
}

const TABS = [['home', '🏠', 'Home'], ['inbox', '📥', 'Inbox'], ['shop', '🛍️', 'Shop'], ['album', '📒', 'Album'], ['settings', '⚙️', 'Settings']];

function render() {
  // Finish any in-progress edit first: blurring fires its change handler (which may render) before we replace the DOM.
  const active = document.activeElement;
  if (active && active !== document.body && $('#app').contains(active)) active.blur();
  const intro = ui.view === 'setup' || ui.view === 'hatch';
  const h = S().house, harmony = Math.round(S().players.reduce((a, p) => a + (p.pet.food + p.pet.clean + p.pet.fun + p.pet.energy) / 4, 0) / S().players.length);
  const waiting = S().inbox.filter(i => !i.claimedBy).length;
  document.documentElement.classList.toggle('night', isNight());
  $('#top').innerHTML = intro ? '' : `<div class="brand"><span class="logo">🏡</span><span class="title">House<span>Pet</span></span></div>
    <div class="meters">
      <div class="meter" title="House level"><span>🏠 Lv ${h.level}</span><div class="bar"><i style="width:${h.level >= D.HOUSE.length ? 100 : h.xp / D.houseNeed(h.level) * 100}%"></i></div></div>
      <div class="meter" title="Household harmony — the average of both pets"><span>☯️ ${harmony}%</span><div class="bar"><i class="harm" style="width:${harmony}%"></i></div></div>
    </div>`;
  $('#tabs').innerHTML = intro ? '' : TABS.map(([v, e, l]) =>
    `<button class="${ui.view === v ? 'on' : ''}" data-act="tab" data-v="${v}"><span>${e}${v === 'inbox' && waiting ? `<i class="dot">${waiting}</i>` : ''}</span>${l}</button>`).join('');
  $('#app').innerHTML = { home: homeView, inbox: inboxView, shop: shopView, album: albumView, settings: settingsView, setup: setupView, hatch: hatchView }[ui.view]();
  try { navigator.setAppBadge?.(S().players.reduce((a, p) => a + dueCount(p.id), 0)).catch(() => {}); } catch {}
}

/* ---------- Toast & modal ---------- */
let toastTimer;
function toast(html, undo = false) {
  const t = $('#toast');
  t.innerHTML = `<div>${html}</div>${undo && ui.undo ? '<button data-act="undo">Undo</button>' : ''}`;
  t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 5000);
}
function modal(html) { ui.modal = true; $('#modal').innerHTML = `<div class="modal-card">${html}</div>`; $('#modal').classList.add('show'); }
function closeModal() { ui.modal = false; ui.gift = null; $('#modal').classList.remove('show'); render(); playEvents(); }

/* ---------- Animation helpers ---------- */
const snap = () => { ui.undo = JSON.stringify(S()); };
const viewSnap = () => Object.fromEntries(S().players.map(p => [p.id, { c: p.coins, h: p.hearts, st: { ...p.pet } }]));

function animateStats(before) {
  for (const p of S().players) for (const k in D.STATS) {
    const el = $(`#ring-${p.id}-${k}`), old = before[p.id].st[k];
    if (!el || Math.round(old) === Math.round(p.pet[k])) continue;
    const C = 2 * Math.PI * 21;
    el.style.transition = 'none'; el.setAttribute('stroke-dashoffset', C * (1 - old / 100));
    void el.getBoundingClientRect();
    el.style.transition = ''; el.setAttribute('stroke-dashoffset', C * (1 - p.pet[k] / 100));
    el.closest('.ring').classList.add('bump');
  }
}

async function animateWallets(before, from) {
  for (const p of S().players) {
    const b = before[p.id], cEl = $(`#coins-${p.id}`), hEl = $(`#hearts-${p.id}`);
    if (cEl && p.coins !== b.c) {
      cEl.textContent = b.c;
      if (from && p.coins > b.c) { for (let i = 0; i < 6; i++) fly(from, cEl, '🪙', { size: 24, delay: i * 60, dur: 620 }); await wait(640); sfx('coin'); }
      countUp(cEl, b.c, p.coins);
    }
    if (hEl && p.hearts !== b.h) {
      hEl.textContent = b.h;
      if (from && p.hearts > b.h) { await fly(from, hEl, '💗', { size: 30, dur: 700 }); }
      countUp(hEl, b.h, p.hearts);
    }
  }
}

function playEvents() {
  if (ui.modal) return;
  for (const e of G.events.splice(0)) {
    if (e.type === 'level') { react(e.p.id, 'wow', 2600); splash(`Level ${e.lvl}!`, `${esc(e.p.pet.name)} is growing up · 🎁 +1 gift${e.unlock ? ` · ${e.unlock.name} look unlocked!` : ''}`, { color: e.p.color, icon: '⭐', onShow: () => { sfx('level'); confetti(['⭐', '🌟', '✨', '🎉']); } }); }
    if (e.type === 'house') splash(`House level ${e.lvl}!`, `New decoration: ${e.item.e} ${e.item.name}`, { color: '#f59e0b', icon: '🏡', onShow: () => { sfx('level'); confetti(['🏡', e.item.e, '✨']); } });
    if (e.type === 'ach') splash(e.a.name, `${esc(e.p.name)} earned a trophy · +${e.a.coins}🪙`, { color: '#8b5cf6', icon: e.a.e, onShow: () => { sfx('level'); confetti([e.a.e, '🏆', '✨'], 18); } });
    if (e.type === 'quest') splash('Quest complete!', `${e.def.e} ${e.def.name} — claim it on Home`, { color: '#22c55e', icon: '☀️', onShow: () => sfx('done') });
    if (e.type === 'chest') splash('Daily chest!', 'All quests done — a 🎁 gift for each of you', { color: '#f59e0b', icon: '🧰', onShow: () => { sfx('open'); confetti(['🎁', '🪙', '✨']); } });
    if (e.type === 'clear') splash('All clear!', `${esc(e.p.name)} finished everything due today`, { color: e.p.color, icon: '✅', onShow: () => { sfx('team'); confetti(['✅', '✨', '🌟'], 20); } });
  }
}

/* ---------- Actions ---------- */
async function finishTask(el, run) {
  const li = el.closest('li'); li?.classList.add('checking');
  const from = center(el);
  sfx('pop'); burst(from.x, from.y, ['✨', '⭐', '💫'], 8, 60);
  await wait(320);
  snap();
  const before = viewSnap(), res = run();
  if (!res) return;
  G.checkAch(); save(); render();
  animateStats(before);
  sfx('done');
  // Treat flies to each pet the task cared for (skip pets hidden by the phone player switcher).
  res.owners.forEach((o, n) => {
    const petEl = $(`#pet-${o.id}`), seen = petEl && petEl.offsetParent !== null;
    (seen ? fly(from, petEl, D.STATS[res.stat].fly, { size: 44, dur: 800, delay: n * 150 }) : wait(800)).then(() => {
      react(o.id, res.together ? 'love' : 'eat', 1300); if (!n) sfx('chomp');
      if (seen) { const c = center(petEl); popText(c.x, c.y - 50, `+30 ${D.STATS[res.stat].icon}`, D.STATS[res.stat].color); burst(c.x, c.y, [D.STATS[res.stat].icon, '✨'], 6, 70); }
      setTimeout(() => say(o.id, res.together ? pick(['Teamwork! 👫', 'We did it together! 💞', 'Best team ever! ✨']) : pick(D.LINES.happy)), 1300 + n * 400);
    });
  });
  if (res.together) splash('Better together!', `Both of you · +${res.coins}🪙 +${res.hearts}💗 each`, { color: '#8b5cf6', icon: '👫', onShow: () => { sfx('team'); confetti(['👫', '💞', '✨', '🎉']); } });
  if (res.helped) {
    setTimeout(() => react(res.doer.id, 'love', 2000), 300);
    splash('Teamwork!', `${esc(res.doer.name)} helped ${esc(res.owner.name)} · +${res.hearts} 💗`, { color: res.doer.color, icon: '🤝', onShow: () => { sfx('team'); confetti(['💖', '🤝', '💕', '✨']); } });
  }
  toast(`${res.icon} <b>${esc(res.title)}</b> +${res.coins}🪙${res.hearts ? ` +${res.hearts}💗` : ''} +${res.xp}⭐${res.together ? ' each' : ''}${res.notes.length ? `<small>${res.notes.map(esc).join(' · ')}</small>` : ''}`, true);
  await animateWallets(before, from);
  if (res.gift) {
    const g = $(`#gift-${res.giftTo.id}`);
    await fly(from, g, '🎁', { size: 48, dur: 900 });
    sfx('buy'); if (g) { const c = center(g); popText(c.x, c.y - 30, 'Gift found!', '#f59e0b'); burst(c.x, c.y, ['🎁', '✨'], 8, 60); }
  }
  playEvents();
}

function openGift(pid) {
  ui.gift = { pid, taps: 0 };
  modal(`<div class="gift-stage"><h2>🎁 A gift for ${esc(P(pid).name)}!</h2>
    <button class="giftbox" data-act="giftTap" aria-label="Tap the gift"><span>🎁</span></button>
    <p class="muted" id="giftHint">Tap it 3 times to open!</p></div>`);
}

function giftTap(el) {
  const g = ui.gift; if (!g || g.done) return;
  g.taps++;
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake', `t${g.taps}`);
  sfx('shake');
  if (g.taps < 3) { $('#giftHint').textContent = g.taps === 1 ? 'Something’s rattling…' : 'Almost…!'; return; }
  g.done = true;
  const out = G.openGift(g.pid); G.checkAch(); save();
  const p = P(g.pid), c = center(el);
  sfx('open'); burst(c.x, c.y, ['✨', '⭐', '🎊', '💫', '🌟'], 18, 160);
  const reward = {
    sticker: () => `<div class="reward r-${out.st.r}"><span class="big">${out.st.e}</span><b class="rarity">${out.st.r} sticker!</b><small>${out.dup ? 'Already had it → +10🪙' : 'New in your album 📒'}</small></div>`,
    coins: () => `<div class="reward"><span class="big">🪙</span><b>+${out.coins} coins!</b></div>`,
    treat: () => `<div class="reward"><span class="big">${D.STATS[out.stat].fly}</span><b>A treat for ${esc(p.pet.name)}!</b><small>+40 ${D.STATS[out.stat].icon} ${D.STATS[out.stat].label}</small></div>`,
    hearts: () => `<div class="reward r-rare"><span class="big">💗</span><b>+2 hearts!</b></div>`,
  }[out.kind]();
  if (out.kind === 'sticker' && out.st.r !== 'common') confetti([out.st.e, '✨', '🌟'], out.st.r === 'legendary' ? 50 : 24);
  setTimeout(() => {
    $('.modal-card').innerHTML = `<div class="gift-stage">${reward}<div class="row center">
      ${p.gifts ? `<button class="btn primary" data-act="gift" data-p="${p.id}">Open next (${p.gifts})</button>` : ''}
      <button class="btn" data-act="closeModal">Yay!</button></div></div>`;
  }, 250);
}

function wheelSVG() {
  const n = D.WHEEL.length, a = 360 / n, R = 96, pt = (deg, r) => [100 + r * Math.cos(deg * Math.PI / 180), 100 + r * Math.sin(deg * Math.PI / 180)];
  return `<svg viewBox="0 0 200 200">${D.WHEEL.map((w, i) => {
    const a0 = i * a - 90, a1 = a0 + a, [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), am = a0 + a / 2, [lx, ly] = pt(am, 64);
    return `<path d="M100 100 L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${w.color}" stroke="#fff" stroke-width="2.5"/>
      <g transform="rotate(${am + 90} ${lx.toFixed(1)} ${ly.toFixed(1)})"><text x="${lx.toFixed(1)}" y="${(ly - 2).toFixed(1)}" font-size="20" text-anchor="middle">${w.e}</text>
      <text x="${lx.toFixed(1)}" y="${(ly + 15).toFixed(1)}" font-size="11" font-weight="700" text-anchor="middle" fill="#4a2f3d" font-family="Fredoka, sans-serif">${w.label}</text></g>`;
  }).join('')}<circle cx="100" cy="100" r="96" fill="none" stroke="#4a2f3d" stroke-width="4"/><circle cx="100" cy="100" r="14" fill="#fff" stroke="#4a2f3d" stroke-width="4"/></svg>`;
}

function openWheel(pid) {
  ui.spinFor = pid;
  modal(`<div class="wheel-stage"><h2>🎡 ${esc(P(pid).name)}'s daily spin</h2>
    <div class="wheel-wrap"><div class="pointer">▼</div><div class="wheel" id="wheel">${wheelSVG()}</div></div>
    <div id="wheelResult"><button class="btn primary big" data-act="spinGo">Spin!</button></div></div>`);
}

async function spinGo(el) {
  const i = G.spin(ui.spinFor);
  if (i == null) return;
  G.checkAch(); save();
  el.disabled = true;
  const w = $('#wheel'), seg = 360 / D.WHEEL.length;
  w.style.transform = `rotate(${360 * 6 - (i * seg + seg / 2) + (Math.random() * seg * 0.6 - seg * 0.3)}deg)`;
  let t = 0; for (let k = 0; k < 28; k++) { t += 35 + k * k * 0.5; setTimeout(() => sfx('tick'), t); }
  await wait(4800);
  const prize = D.WHEEL[i];
  sfx('level'); confetti([prize.e, '✨', '🎉']);
  $('#wheelResult').innerHTML = `<p class="prize">You won <b>${prize.e} ${prize.label}</b>!</p><button class="btn primary" data-act="closeModal">Sweet!</button>`;
}

async function doCare(id, key, by, btnEl) {
  const from = btnEl ? center(btnEl) : { x: innerWidth / 2, y: innerHeight / 2 };
  snap();
  const before = viewSnap(), res = G.care(id, key, by);
  if (!res) return;
  G.checkAch(); save(); render();
  sfx('pop'); burst(from.x, from.y, [res.c.e, '✨'], 8, 60);
  const petEl = $(`#pet-${id}`);
  fly(from, petEl, res.c.e, { size: 40, dur: 700 }).then(() => {
    react(id, key === 'feed' ? 'eat' : 'joy', 1300); sfx(key === 'feed' ? 'chomp' : 'done');
    if (petEl) { const c = center(petEl); popText(c.x, c.y - 40, `+${res.c.amt} ${res.c.e}`, '#22c55e'); burst(c.x, c.y, ['💖', '✨'], 6, 60); }
    setTimeout(() => say(id, pick(RP_SAY[key])), 900);
  });
  toast(`${res.c.e} ${esc(res.doers.map(p => p.name).join(' & '))} ${res.c.past} <b>${esc(res.rp.name)}</b> +${res.coins}🪙 +${res.xp}⭐${res.full ? '' : '<small>Already done today, still counts!</small>'}`, true);
  await animateWallets(before, from);
  playEvents();
}

const ACTIONS = {
  tab: el => { ui.view = el.dataset.v; sfx('tap'); render(); scrollTo(0, 0); },
  focus: el => { ui.focus = el.dataset.p; sfx('tap'); render(); },
  do: el => finishTask(el, () => G.doChore(el.dataset.id, el.dataset.by)),
  doInbox: el => finishTask(el, () => G.doInbox(el.dataset.id)),
  ask: el => {
    const c = S().chores.find(x => x.id === el.dataset.id), owner = P(c.owner), q = partner(owner);
    c.helpReq = !c.helpReq;
    if (c.helpReq) { G.log(`${owner.name} asked for help with “${c.title}”`); sfx('help'); setTimeout(() => { react(q.id, 'wow', 1500); say(q.id, `${owner.name} needs help with ${c.title}! 💌`); }, 100); toast(`💌 ${esc(q.pet.name)} delivered the message to ${esc(q.name)}`); }
    save(); render();
  },
  needHelp: el => {
    const p = P(el.dataset.p), q = partner(p); p.needHelp = !p.needHelp;
    if (p.needHelp) { G.log(`${p.name} asked for a hand 🆘`); sfx('help'); setTimeout(() => { react(q.id, 'wow', 1500); say(q.id, `${p.name} could use a hand! 💌`); }, 100); toast(`🆘 Sent to ${esc(q.name)}’s pet`); }
    else toast('💪 Glad you’re feeling better!');
    save(); render();
  },
  pet: el => {
    const pid = el.dataset.p, c = center(el);
    G.cuddle(pid); save();
    sfx('pop'); burst(c.x, c.y - 20, ['💖', '💕', '✨'], 7, 80);
    el.classList.remove('squish'); void el.offsetWidth; el.classList.add('squish');
    if (el.id) { react(pid, isNight() ? 'joy' : pick(['joy', 'love', 'joy']), 1200); say(pid, isNight() ? '*yawn* …hi 💤' : pick(D.LINES.pet)); }
    const q = S().daily.quests.find(x => x.id === 'cuddle');
    if (q && !q.claimed && q.prog >= G.questDef('cuddle').goal && ui.view === 'home') { const strip = $('.quests'); strip && (strip.outerHTML = questStrip()); }
    playEvents();
  },
  claim: el => {
    const it = S().inbox.find(x => x.id === el.dataset.id), c = center(el);
    it.claimedBy = el.dataset.p; G.log(`${ownerName(it.claimedBy)} grabbed “${it.title}”`);
    save(); render(); sfx('pop'); burst(c.x, c.y, ['🎈', '✨'], 8, 70);
    toast(`📌 <b>${esc(it.title)}</b> is on ${it.claimedBy === 'both' ? 'both of your lists 👫' : `${esc(P(it.claimedBy).name)}’s list`}`);
  },
  release: el => { const it = S().inbox.find(x => x.id === el.dataset.id); it.claimedBy = null; it.float = true; save(); render(); toast('🎈 Back up for grabs'); },
  floatToggle: el => { const it = S().inbox.find(x => x.id === el.dataset.id); it.float = it.float === false; sfx('tap'); save(); render(); },
  delInbox: el => { snap(); S().inbox = S().inbox.filter(x => x.id !== el.dataset.id); save(); render(); toast('🗑️ Removed', true); },
  shopFor: el => { ui.shopFor = el.dataset.p; sfx('tap'); render(); },
  buy: el => {
    const before = viewSnap(), from = center(el);
    snap();
    const r = G.buy(el.dataset.id, ui.shopFor);
    if (!r) { sfx('nope'); el.classList.add('nope'); setTimeout(() => el.classList.remove('nope'), 500); return toast(G.findItem(el.dataset.id)?.hearts ? '💗 Earn hearts by helping your partner!' : '🪙 Not enough coins yet — go do a chore!'); }
    G.checkAch(); save(); render(); sfx('buy');
    burst(from.x, from.y, [r.x.e || '✨', '✨', '💖'], 10, 80);
    if (r.kind !== 'treat') confetti([r.x.e || '✨', '✨'], 16);
    toast(`${r.x.e || '✨'} ${r.kind === 'treat' ? `${esc(P(ui.shopFor).pet.name)} loved it!` : `${esc(r.x.name)} unlocked!`}`, true);
    countUp($('.shop .pill.coin b'), before[ui.shopFor].c, P(ui.shopFor).coins);
    playEvents();
  },
  wear: el => { const p = P(ui.shopFor); p.pet.acc = p.pet.acc === el.dataset.id ? null : el.dataset.id; sfx('pop'); save(); render(); },
  room: el => { P(ui.shopFor).pet.room = el.dataset.id; sfx('pop'); save(); render(); },
  species: el => { P(ui.shopFor).pet.species = el.dataset.id; sfx('hatch'); save(); render(); confetti(['✨', '💖'], 14); },
  delChore: el => { snap(); S().chores = S().chores.filter(c => c.id !== el.dataset.id); save(); render(); toast('🗑️ Chore removed', true); },
  color: el => { P(el.dataset.p).color = el.dataset.c; save(); render(); },
  sound: () => { S().sound = !S().sound; save(); render(); sfx('pop'); },
  export: () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S(), null, 1)], { type: 'application/json' }));
    a.download = `house-pet-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  },
  import: () => $('#importFile').click(),
  reset: () => { if (confirm('Erase everything and start over?')) { store.S = defaultState(); ui.view = 'setup'; ui.hatch = {}; save(); render(); } },
  undo: () => { if (!ui.undo) return; store.S = JSON.parse(ui.undo); ui.undo = null; G.events.length = 0; save(); render(); toast('↩️ Undone'); },
  claimQuest: el => {
    const from = center(el), before = viewSnap();
    if (!G.claimQuest(el.dataset.id)) return;
    G.checkAch(); save(); render(); sfx('done'); burst(from.x, from.y, ['🪙', '✨', '⭐'], 12, 90);
    animateWallets(before, from).then(playEvents);
  },
  gift: el => { sfx('pop'); openGift(el.dataset.p); },
  giftTap,
  wheel: el => { sfx('pop'); openWheel(el.dataset.p); },
  wheelLocked: () => { sfx('nope'); toast('🎡 Finish a chore today to unlock your daily spin!'); },
  spinGo,
  closeModal,
  hatchTap: el => {
    const pid = el.dataset.p, n = (ui.hatch[pid] || 0) + 1;
    ui.hatch[pid] = n;
    if (n < 4) { sfx('shake'); render(); const egg = $(`#slot-${pid} .egg`); egg?.classList.add('shake'); return; }
    P(pid).pet.hatched = true; save(); render(); sfx('hatch');
    const slot = $(`#slot-${pid}`); if (slot) { const c = center(slot); burst(c.x, c.y, ['✨', '🥚', '💖', '⭐'], 16, 140); }
    confetti(['🐣', '✨', '💖'], 20);
  },
  setupPets: el => {
    captureSetup($('form[data-form=setup]'));
    ui.hasPets = el.dataset.v === '1';
    if (ui.hasPets && !rps().length) S().realPets = [newRealPet('dog')];
    sfx('tap'); render();
  },
  rpAdd: el => { if (rps().length >= MAX_RP) return; S().realPets = [...rps(), newRealPet(el.dataset.k)]; sfx('pop'); save(); rerender(); },
  rpKind: el => {
    const rp = rpById(el.dataset.id); if (rp.kind === el.dataset.k) return;
    const wasDefault = ['Buddy', 'Whiskers'].includes(rp.name);
    rp.kind = el.dataset.k; rp.coat = D.COATS[rp.kind][0].id; rp.custom = null; rp.photo = null;
    if (wasDefault) rp.name = rp.kind === 'cat' ? 'Whiskers' : 'Buddy';
    sfx('tap'); save(); rerender();
  },
  rpCoat: el => { const rp = rpById(el.dataset.id); rp.coat = el.dataset.c; rp.custom = null; sfx('tap'); save(); rerender(); },
  rpPhotoOff: el => { const rp = rpById(el.dataset.id); rp.photo = null; rp.custom = null; save(); rerender(); },
  rpRemove: el => {
    const rp = rpById(el.dataset.id);
    if (!confirm(`Remove ${rp.name}?`)) return;
    S().realPets = rps().filter(x => x !== rp);
    if (ui.view === 'setup' && !rps().length) ui.hasPets = false;
    save(); rerender();
  },
  rpPet: el => {
    const id = el.dataset.id, rp = rpById(id), c = center(el);
    sfx('pop'); burst(c.x, c.y - 20, ['💖', '💕', '🐾'], 7, 80);
    el.classList.remove('squish'); void el.offsetWidth; el.classList.add('squish');
    react(id, isNight() ? 'joy' : pick(['joy', 'love']), 1200);
    say(id, isNight() ? '*yawn* …hi 💤' : rp.kind === 'cat' ? pick(['Purrr… 💕', '*head bonk* 💖', '*slow blink*']) : pick(['*happy tail wags* 💖', 'Belly rubs?! 🐾', 'I love you! 💕']));
  },
  care: el => {
    const { id, c } = el.dataset;
    if (solo()) return doCare(id, c, 'a', el);
    const rp = rpById(id), cd = D.CARE[c];
    ui.carePending = { id, c };
    modal(`<div class="who-stage"><div class="who-pet">${rpSVG(rp, 'happy')}</div><h2>${cd.e} Who ${cd.past} ${esc(rp.name)}?</h2>
      <div class="who-btns">${S().players.map(p => `<button class="btn claim big" style="--c:${p.color}" data-act="careBy" data-p="${p.id}">${miniPet(p)} ${esc(p.name)}</button>`).join('')}
      <button class="btn claim together big" data-act="careBy" data-p="both">👫 Both of us</button></div>
      <button class="link" data-act="closeModal">Cancel</button></div>`);
  },
  careBy: el => {
    const pending = ui.carePending; if (!pending) return;
    ui.carePending = null; ui.modal = false; $('#modal').classList.remove('show');
    doCare(pending.id, pending.c, el.dataset.p, $(`[data-act=care][data-id="${pending.id}"][data-c="${pending.c}"]`));
  },
  setupMode: el => { captureSetup($('form[data-form=setup]')); ui.setupMode = el.dataset.m; sfx('tap'); render(); },
  addPlayer: () => {
    const used = S().players[0].color, color = D.COLORS.find(c => c !== used);
    S().players.push(newPlayer('b', 'Player 2', 'Biscuit', S().players[0].pet.species === 'dog' ? 'cat' : 'dog', color));
    ui.addingPlayer = true; ui.setupMode = 'duo'; ui.view = 'setup'; save(); render(); scrollTo(0, 0);
  },
  startGame: () => { ui.view = 'home'; sfx('level'); confetti(); render(); setTimeout(() => S().players.forEach((p, i) => setTimeout(() => say(p.id, i ? 'Our new home! 🏡' : 'Hi hi hi! 💖'), i * 900)), 400); },
};

const FORMS = {
  setup: f => {
    captureSetup(f);
    if (ui.setupMode === 'solo' && !ui.addingPlayer) {
      // One player: drop the second player and give them every chore and task.
      S().players = S().players.slice(0, 1);
      S().chores.forEach(c => { c.owner = 'a'; });
      S().inbox.forEach(it => { if (it.claimedBy) it.claimedBy = 'a'; });
      S().daily = null; G.ensureDaily(); // re-pick today's quests without the teamwork one
    }
    if (!ui.addingPlayer && !(ui.hasPets ?? rps().length > 0)) S().realPets = [];
    ui.addingPlayer = false;
    S().setup = true; ui.view = 'hatch'; save(); render(); sfx('pop');
  },
  inbox: f => {
    const title = f.elements.task.value.trim(); if (!title) return;
    const who = f.who.value || null;
    G.addInbox(title, f.cat.value, f.urgent.checked, who, f.float.checked); save(); render(); sfx('pop');
    toast(who ? `📌 Added to ${who === 'both' ? 'both of your lists 👫' : `${esc(P(who).name)}’s list`}` : f.float.checked ? '🎈 Floating on Home for whoever grabs it' : '📥 Added to the inbox');
    $('form[data-form=inbox] [name=task]')?.focus();
  },
  chore: f => {
    const title = f.elements.task.value.trim(); if (!title) return;
    S().chores.push({ id: Math.random().toString(36).slice(2, 9), title, cat: f.cat.value, owner: f.owner.value, every: +f.every.value, start: Date.now(), lastDone: null, helpReq: false });
    save(); render(); sfx('pop'); toast('🧹 Chore added');
  },
};

function onChange(el) {
  const k = el.dataset.chg;
  if (k === 'cap') {
    const p = P(el.dataset.p), was = p.capacity; p.capacity = +el.value;
    if (p.capacity < 35 && was >= 35) { G.log(`${p.name}'s energy is low 🪫`); if (partner(p)) { setTimeout(() => say(partner(p).id, `${p.name} is running low… 💌`), 200); sfx('help'); } }
    save(); render(); return;
  }
  if (k === 'rpet.name') {
    const rp = rpById(el.dataset.id), v = el.value.trim();
    if (rp && v) rp.name = v;
    save(); rerender(); return;
  }
  if (k === 'rpPhoto') {
    const rp = rpById(el.dataset.id), file = el.files[0]; if (!rp || !file) return;
    photoToPet(file, rp.kind).then(({ photo, colors }) => {
      rp.photo = photo; rp.custom = colors; save(); rerender(); sfx('hatch');
      toast(`📷 Matched ${esc(rp.name)}’s colors from your photo! Tap a coat to adjust.`);
    }).catch(() => toast('⚠️ Couldn’t read that photo. Try another one?'));
    return;
  }
  if (k === 'import') {
    const file = el.files[0]; if (!file) return;
    file.text().then(t => { const d = JSON.parse(t); if (!d.players) throw 0; snap(); store.S = migrate(d); ui.view = 'home'; save(); render(); toast('📦 Data restored', true); })
      .catch(() => toast('⚠️ That file did not look like House Pet data'));
    return;
  }
  const [obj, ...path] = k.split('.'), last = path.pop();
  const target = path.reduce((o, f) => o[f], obj === 'chore' ? S().chores.find(c => c.id === el.dataset.id) : P(el.dataset.p));
  const val = last === 'every' ? +el.value : el.value.trim();
  if (val === '') return render();
  target[last] = val;
  save(); render();
}

/* ---------- Wiring ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled && ACTIONS[el.dataset.act]) { e.preventDefault(); ACTIONS[el.dataset.act](el); return; }
  if (e.target.id === 'modal' && !ui.gift?.taps) closeModal();
});
document.addEventListener('change', e => { if (e.target.dataset.chg) onChange(e.target); });
document.addEventListener('input', e => {
  if (e.target.dataset.chg === 'cap') { const [ce, cl] = capLabel(+e.target.value); e.target.closest('.cap').querySelector('.cap-lbl').textContent = `${ce} ${cl}`; }
});
document.addEventListener('submit', e => { const f = e.target; if (FORMS[f.dataset.form]) { e.preventDefault(); FORMS[f.dataset.form](f); } });

const busy = () => ui.modal || (document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName));
function refresh() { G.tick(); save(); if (!busy()) render(); }
setInterval(refresh, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });

// Pets chatter on their own every so often.
setInterval(() => {
  if (ui.view !== 'home' || ui.modal || document.hidden) return;
  const who = pick([...S().players.map(p => [p.id, () => lineFor(p)]), ...rps().map(rp => [rp.id, () => rpLine(rp)])]);
  if (!$(`#speech-${who[0]}`)?.classList.contains('show')) say(who[0], who[1]());
}, 14000);

G.tick(); save(); render();
if (ui.view === 'home') setTimeout(() => S().players.forEach((p, i) => setTimeout(() => say(p.id, lineFor(p)), 600 + i * 1500)), 300);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
