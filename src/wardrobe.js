// Outfits and hair for the players' pets. Every slot can be worn at the same time.
// Each item draws itself into one or more layers of the pet SVG:
//   back  – behind the body (wings, cloaks, long hair)
//   torso – clipped to the body shape (shirts, dresses)
//   front – over the face/body (collars, glasses, held items)
//   top   – over everything (hats)
// g (geometry) comes from petSVG: { ht: top of head, topY: hat baseline, ex/ey: left eye, my: mouth y }

const INK = '#4a2f3d';
const O = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const O3 = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const NOIR = '#2a2230';
const BONE = '#ece6d6';
const pair = svg => svg + `<g transform="matrix(-1 0 0 1 200 0)">${svg}</g>`;
const emoji = (e, x, y, size) => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle">${e}</text>`;
const shift = (g, svg) => `<g transform="translate(0 ${g.ht - 64})">${svg}</g>`;
// Points along the collar curve (y≈150) for beads, spikes and lace.
const NECK = [[60, 147], [79, 154], [100, 157], [121, 154], [140, 147]];
const necklace = (color, w = 8) => `<path d="M40 138 Q100 170 160 138" fill="none" stroke="${INK}" stroke-width="${w + 4}" stroke-linecap="round"/><path d="M40 138 Q100 170 160 138" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
const bone = (x, y, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-9 -2 h18 v4 h-18 Z" fill="${BONE}"/><circle cx="-10" cy="-3" r="3.4" fill="${BONE}"/><circle cx="-10" cy="3" r="3.4" fill="${BONE}"/><circle cx="10" cy="-3" r="3.4" fill="${BONE}"/><circle cx="10" cy="3" r="3.4" fill="${BONE}"/></g>`;
const jar = (inner, liquid = 'rgba(190,225,255,.45)') => `<g transform="translate(160 160)">
  <rect x="-15" y="-2" width="30" height="34" rx="9" fill="${liquid}" ${O3}/><rect x="-13" y="-10" width="26" height="9" rx="3" fill="#8a6a4a" ${O3}/>
  <path d="M-9 4 v18" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>${inner}</g>`;

/* ---------- Hair ---------- */
export const HAIR_COLORS = [
  ['#2a2230', 'Raven'], ['#6b3a7a', 'Plum'], ['#9b1b30', 'Blood red'], ['#d7d3de', 'Silver'], ['#6fcf5f', 'Toxic green'],
  ['#2f3f8f', 'Midnight'], ['#ff8fc0', 'Bubblegum'], ['#f2d98d', 'Bleach blonde'], ['#d9772b', 'Ginger'], ['#6b4a32', 'Brown'],
];
const fringe = c => `<path d="M40 104 C38 50 162 50 160 104 L152 94 L144 102 L134 92 L122 101 L110 91 L100 100 L90 91 L78 101 L66 92 L56 102 L48 94 Z" fill="${c}" ${O}/>`;
const cap = c => `<path d="M44 100 C40 54 160 54 156 100 Q128 80 100 82 Q72 80 44 100 Z" fill="${c}" ${O}/>`;
export const HAIR = [
  { id: 'none',     name: 'No hair',     e: '🚫' },
  { id: 'bangs',    name: 'Blunt bangs', e: '💇', front: fringe },
  { id: 'long',     name: 'Long & dark', e: '🖤', back: c => `<path d="M30 92 C24 34 176 34 170 92 L182 188 Q162 178 150 192 L50 192 Q38 178 18 188 Z" fill="${c}" ${O}/>`, front: fringe },
  { id: 'bun',      name: 'Top bun',     e: '🍡', front: c => `${cap(c)}<circle cx="100" cy="44" r="17" fill="${c}" ${O}/><path d="M88 58 Q100 64 112 58" stroke="#ff5d8f" stroke-width="5" fill="none" stroke-linecap="round"/>` },
  { id: 'emo',      name: 'Emo sweep',   e: '🥀', coins: 40, back: c => `<path d="M28 100 C22 40 178 40 172 100 L170 154 L30 154 Z" fill="${c}" ${O}/>`,
    front: c => `<path d="M40 104 C34 48 166 46 162 100 L160 128 Q144 116 130 132 Q128 106 112 98 L100 96 L88 100 L74 95 L60 102 L48 96 Z" fill="${c}" ${O}/>` },
  { id: 'pigtails', name: 'Pigtails',    e: '🎀', coins: 40, back: c => pair(`<ellipse cx="30" cy="124" rx="16" ry="34" transform="rotate(14 30 124)" fill="${c}" ${O}/>`),
    front: c => `${cap(c)}${pair('<circle cx="44" cy="96" r="6" fill="#ff5d8f" stroke="#4a2f3d" stroke-width="2.5"/>')}` },
  { id: 'curly',    name: 'Curly cloud', e: '☁️', coins: 50, front: c => [[50, 96, 13], [150, 96, 13], [60, 76, 17], [140, 76, 17], [80, 62, 19], [120, 62, 19], [100, 56, 20]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${O}/>`).join('') },
  { id: 'spiky',    name: 'Spiky',       e: '⚡', coins: 60, front: c => `<path d="M42 102 L34 70 L54 80 L54 46 L74 66 L84 34 L98 60 L112 32 L120 62 L140 42 L142 76 L164 66 L158 102 Q100 84 42 102 Z" fill="${c}" ${O}/>` },
  { id: 'mohawk',   name: 'Mohawk',      e: '🤘', coins: 80, front: c => `<path d="M82 78 L74 34 L90 50 L94 20 L104 46 L114 22 L116 50 L130 36 L120 78 Z" fill="${c}" ${O}/>` },
];
export const hairById = id => HAIR.find(h => h.id === id);

/* ---------- Clothing ---------- */
// price: coins / hearts / lvl (level needed). goth: shown with a 🦇 tag in the shop.
export const SLOTS = [['hat', '🎩 Hats'], ['face', '👓 Face'], ['neck', '📿 Neck'], ['body', '👕 Body'], ['back', '🦇 Back'], ['held', '🫙 Held']];
export const WARDROBE = [
  // Hats (old single accessories keep their ids so saves still own them)
  { id: 'bow',      slot: 'hat', e: '🎀', name: 'Bow',           coins: 40,  art: { top: g => emoji('🎀', 100, g.topY, 50) } },
  { id: 'cap',      slot: 'hat', e: '🧢', name: 'Cap',           coins: 60,  art: { top: g => emoji('🧢', 100, g.topY, 50) } },
  { id: 'flower',   slot: 'hat', e: '🌸', name: 'Flower',        coins: 60,  art: { top: g => emoji('🌸', 128, g.topY, 36) } },
  { id: 'party',    slot: 'hat', e: '🎉', name: 'Party popper',  coins: 100, art: { top: g => emoji('🎉', 100, g.topY, 50) } },
  { id: 'tophat',   slot: 'hat', e: '🎩', name: 'Top hat',       coins: 120, art: { top: g => emoji('🎩', 100, g.topY, 50) } },
  { id: 'crown',    slot: 'hat', e: '👑', name: 'Crown',         coins: 250, art: { top: g => emoji('👑', 100, g.topY, 50) } },
  { id: 'halo',     slot: 'hat', e: '😇', name: 'Halo',          hearts: 20, art: { top: g => `<ellipse class="halo" cx="100" cy="${g.topY - 34}" rx="30" ry="8" fill="none" stroke="#ffd54a" stroke-width="7"/>` } },
  { id: 'witch',    slot: 'hat', e: '🧙', name: 'Witch hat',     coins: 90, goth: true, art: { top: g => shift(g, `<ellipse cx="100" cy="66" rx="52" ry="11" fill="${NOIR}" ${O}/><path d="M72 64 L102 2 Q110 -6 116 8 L128 64 Z" fill="${NOIR}" ${O}/><path d="M74 56 L126 56 L128 64 L72 64 Z" fill="#8b5cf6"/><text x="113" y="40" font-size="12">✨</text>`) } },
  { id: 'horns',    slot: 'hat', e: '😈', name: 'Little horns',  coins: 70, goth: true, art: { top: g => shift(g, pair(`<path d="M68 76 Q48 52 60 28 Q66 50 84 66 Z" fill="${BONE}" ${O}/>`)) } },
  { id: 'veil',     slot: 'hat', e: '🖤', name: 'Mourning veil', coins: 110, goth: true, art: { top: g => shift(g, `<path d="M48 72 Q100 56 152 72 L150 104 Q138 112 126 104 Q114 112 100 104 Q86 112 74 104 Q62 112 50 104 Z" fill="#1a1420" opacity=".42"/><path d="M50 82 L150 82 M50 94 L150 94 M72 66 L68 108 M100 60 V108 M128 66 L132 108" stroke="#1a1420" stroke-width="1.6" opacity=".7"/><path d="M50 104 Q62 112 74 104 Q86 112 100 104 Q114 112 126 104 Q138 112 150 104" fill="none" stroke="#1a1420" stroke-width="2.5"/><ellipse cx="122" cy="62" rx="24" ry="9" fill="${NOIR}" ${O3}/><text x="140" y="64" font-size="18">🥀</text>`) } },
  { id: 'batbow',   slot: 'hat', e: '🦇', name: 'Bat bow',       coins: 50, goth: true, art: { top: g => shift(g, `<path d="M106 70 Q116 56 130 62 Q126 66 132 70 Q138 64 146 66 Q150 58 160 62 Q154 76 140 78 Q132 72 130 80 Q122 74 106 70 Z" fill="${NOIR}" ${O3}/>`) } },
  { id: 'roses',    slot: 'hat', e: '🥀', name: 'Dead-rose crown', coins: 130, goth: true, art: { top: g => `${emoji('🥀', 70, g.topY + 6, 28)}${emoji('🥀', 100, g.topY - 2, 30)}${emoji('🥀', 130, g.topY + 6, 28)}` } },
  { id: 'spiderhat', slot: 'hat', e: '🕷️', name: 'Pet spider',   coins: 80, goth: true, art: { top: g => `<path d="M140 ${g.topY - 70} V${g.topY - 14}" stroke="#fff" stroke-width="1.5" opacity=".8"/>${emoji('🕷️', 140, g.topY, 30)}` } },
  { id: 'skullclip', slot: 'hat', e: '💀', name: 'Skull clip',   coins: 45, goth: true, art: { top: g => emoji('💀', 134, g.topY + 8, 26) } },
  // Face
  { id: 'shades',   slot: 'face', e: '🕶️', name: 'Shades',        coins: 90,  art: { front: g => emoji('🕶️', 100, g.ey + 17, 58) } },
  { id: 'glasses',  slot: 'face', e: '👓', name: 'Round glasses', coins: 50,  art: { front: g => `${pair(`<circle cx="${g.ex}" cy="${g.ey}" r="16" fill="rgba(255,255,255,.15)" stroke="${NOIR}" stroke-width="3.5"/>`)}<path d="M${g.ex + 16} ${g.ey - 2} Q100 ${g.ey - 8} ${200 - g.ex - 16} ${g.ey - 2}" stroke="${NOIR}" stroke-width="3.5" fill="none"/>` } },
  { id: 'eyeliner', slot: 'face', e: '🖋️', name: 'Winged eyeliner', coins: 35, goth: true, art: { front: g => pair(`<path d="M${g.ex - 10} ${g.ey - 4} L${g.ex - 24} ${g.ey - 12} L${g.ex - 12} ${g.ey + 1} Z" fill="${NOIR}"/>`) } },
  { id: 'stitches', slot: 'face', e: '🧵', name: 'Stitches',      coins: 40, goth: true, art: { front: g => `<path d="M128 ${g.ey + 14} L156 ${g.ey + 26}" stroke="${NOIR}" stroke-width="2.5"/>${[0, 1, 2, 3].map(i => `<path d="M${132 + i * 7} ${g.ey + 10 + i * 3} l4 10" stroke="${NOIR}" stroke-width="2.5" stroke-linecap="round"/>`).join('')}` } },
  { id: 'monocle',  slot: 'face', e: '🧐', name: 'Monocle',       coins: 70,  art: { front: g => `<circle cx="${200 - g.ex}" cy="${g.ey}" r="16" fill="rgba(255,255,255,.18)" stroke="#c9a227" stroke-width="3.5"/><path d="M${200 - g.ex + 12} ${g.ey + 11} Q170 150 150 168" stroke="#c9a227" stroke-width="2" fill="none"/>` } },
  { id: 'eyepatch', slot: 'face', e: '🏴‍☠️', name: 'Eye patch',   coins: 60,  art: { front: g => `<path d="M44 ${g.ey - 26} L158 ${g.ey - 34}" stroke="${NOIR}" stroke-width="3"/><ellipse cx="${g.ex}" cy="${g.ey}" rx="14" ry="13" fill="${NOIR}" ${O3}/>` } },
  // Neck
  { id: 'choker',   slot: 'neck', e: '⛓️', name: 'Spiked choker', coins: 60, goth: true, art: { front: () => necklace(NOIR) + NECK.map(([x, y]) => `<path d="M${x - 4} ${y + 2} L${x} ${y + 11} L${x + 4} ${y + 2} Z" fill="#d7d3de" stroke="${INK}" stroke-width="1.5"/>`).join('') } },
  { id: 'lace',     slot: 'neck', e: '🤍', name: 'Lace collar',   coins: 55, goth: true, art: { front: () => NECK.map(([x, y]) => `<circle cx="${x}" cy="${y + 3}" r="9" fill="#fff" ${O3}/>`).join('') + `<circle cx="100" cy="168" r="5" fill="${NOIR}"/>` } },
  { id: 'bowtie',   slot: 'neck', e: '🎀', name: 'Black bow tie', coins: 45,  art: { front: () => `<path d="M100 156 L80 146 L80 168 Z M100 156 L120 146 L120 168 Z" fill="${NOIR}" ${O3}/><circle cx="100" cy="156" r="5" fill="${NOIR}" ${O3}/>` } },
  { id: 'bones',    slot: 'neck', e: '🦴', name: 'Bone necklace', coins: 75, goth: true, art: { front: () => `<path d="M40 138 Q100 170 160 138" fill="none" stroke="${INK}" stroke-width="2"/>${bone(72, 152, 0.8, 18)}${bone(100, 158, 0.9)}${bone(128, 152, 0.8, -18)}` } },
  { id: 'pearls',   slot: 'neck', e: '⚪', name: 'Pearl choker',  coins: 85,  art: { front: () => [44, 54, 64, 76, 88, 100, 112, 124, 136, 146, 156].map(x => { const t = (x - 40) / 120, y = 138 + 64 * t * (1 - t); return `<circle cx="${x}" cy="${y}" r="5" fill="#f7f2ff" stroke="${INK}" stroke-width="1.5"/>`; }).join('') } },
  { id: 'scarf',    slot: 'neck', e: '🧣', name: 'Red scarf',     coins: 50,  art: { front: () => necklace('#b3263a', 12) + `<path d="M120 152 L128 186 L114 184 L110 154 Z" fill="#b3263a" ${O3}/>` } },
  { id: 'moon',     slot: 'neck', e: '🌙', name: 'Moon pendant',  coins: 65, goth: true, art: { front: () => `<path d="M48 140 Q100 168 152 140" fill="none" stroke="#c9a227" stroke-width="2"/><path d="M104 160 a9 9 0 1 0 0 16 a7 7 0 1 1 0 -16 Z" fill="#ffd166" ${O3}/>` } },
  // Body (clipped to the body shape)
  { id: 'skeleton', slot: 'body', e: '💀', name: 'Skeleton tee',  coins: 120, goth: true, art: { torso: () => `<rect x="0" y="146" width="200" height="60" fill="${NOIR}"/><path d="M100 150 V184" stroke="${BONE}" stroke-width="5" stroke-linecap="round"/>${[156, 166, 176].map(y => pair(`<path d="M96 ${y} Q78 ${y - 6} 66 ${y + 4}" stroke="${BONE}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`)).join('')}` } },
  { id: 'dress',    slot: 'body', e: '👗', name: 'Black lace dress', coins: 110, goth: true, art: { torso: () => `<rect x="0" y="144" width="200" height="60" fill="${NOIR}"/>${[50, 66, 82, 98, 114, 130, 146].map(x => `<circle cx="${x + 2}" cy="146" r="6" fill="#fff" opacity=".9"/>`).join('')}<path d="M90 160 L110 160 L100 176 Z" fill="#9b1b30"/>` } },
  { id: 'stripes',  slot: 'body', e: '🦓', name: 'Striped shirt', coins: 80, goth: true, art: { torso: () => [146, 154, 162, 170, 178, 186].map((y, i) => `<rect x="0" y="${y}" width="200" height="8" fill="${i % 2 ? '#fff' : NOIR}"/>`).join('') } },
  { id: 'corset',   slot: 'body', e: '🩸', name: 'Velvet corset', coins: 140, goth: true, art: { torso: () => `<rect x="0" y="146" width="200" height="60" fill="#7a1f2b"/><path d="M92 150 L108 160 M108 150 L92 160 M92 160 L108 170 M108 160 L92 170 M92 170 L108 180 M108 170 L92 180" stroke="${NOIR}" stroke-width="2.5"/><path d="M60 146 Q100 156 140 146" stroke="${NOIR}" stroke-width="4" fill="none"/>` } },
  { id: 'coat',     slot: 'body', e: '🧥', name: 'Victorian coat', coins: 160, goth: true, art: { torso: () => `<rect x="0" y="144" width="200" height="60" fill="#3e2a5c"/><path d="M100 144 L82 172 L100 162 L118 172 Z" fill="#e9e2f2" ${O3}/>${[162, 172, 182].map(y => `<circle cx="100" cy="${y}" r="3" fill="#c9a227"/>`).join('')}` } },
  { id: 'beetle',   slot: 'body', e: '🪲', name: 'Beetle tee',    coins: 70, goth: true, art: { torso: () => `<rect x="0" y="146" width="200" height="60" fill="#23402c"/>${emoji('🪲', 100, 178, 24)}` } },
  { id: 'sweater',  slot: 'body', e: '🧶', name: 'Cozy sweater',  coins: 60,  art: { torso: () => `<rect x="0" y="146" width="200" height="60" fill="#c9b6f2"/>${[60, 80, 100, 120, 140].map(x => `<path d="M${x} 150 v32" stroke="#a48fe0" stroke-width="3" stroke-dasharray="4 4"/>`).join('')}` } },
  // Back
  { id: 'batwings', slot: 'back', e: '🦇', name: 'Bat wings',     coins: 150, goth: true, art: { back: () => pair(`<path d="M44 118 C16 82 -6 112 -2 150 C8 138 18 144 20 156 C28 144 36 148 40 158 Z" fill="${NOIR}" ${O}/>`) } },
  { id: 'raven',    slot: 'back', e: '🐦‍⬛', name: 'Raven wings', hearts: 15, goth: true, art: { back: () => pair(`<g fill="#1d1824" ${O3}><ellipse cx="22" cy="110" rx="12" ry="34" transform="rotate(-28 22 110)"/><ellipse cx="18" cy="130" rx="11" ry="30" transform="rotate(-48 18 130)"/><ellipse cx="22" cy="150" rx="10" ry="24" transform="rotate(-70 22 150)"/></g>`) } },
  { id: 'cloak',    slot: 'back', e: '🧛', name: 'Vampire cloak', coins: 180, goth: true, art: { back: () => `<path d="M28 84 Q100 64 172 84 L190 194 Q100 204 10 194 Z" fill="${NOIR}" ${O}/><path d="M36 92 Q100 78 164 92 L176 186 Q100 194 24 186 Z" fill="#9b1b30" opacity=".9"/>`, front: () => pair(`<path d="M52 140 L36 118 L70 134 Z" fill="${NOIR}" ${O3}/>`) } },
  { id: 'fairy',    slot: 'back', e: '🧚', name: 'Fairy wings',   coins: 120, art: { back: () => pair(`<ellipse cx="20" cy="104" rx="22" ry="34" transform="rotate(-30 20 104)" fill="rgba(190,230,255,.75)" ${O3}/><ellipse cx="24" cy="150" rx="16" ry="22" transform="rotate(-50 24 150)" fill="rgba(255,200,240,.75)" ${O3}/>`) } },
  { id: 'mothwings', slot: 'back', e: '🦋', name: 'Moth wings',   coins: 140, goth: true, art: { back: () => pair(`<ellipse cx="16" cy="112" rx="26" ry="38" transform="rotate(-25 16 112)" fill="#b8a99a" ${O3}/><circle cx="14" cy="106" r="9" fill="#5a4636"/><circle cx="14" cy="106" r="4" fill="#ece6d6"/>`) } },
  // Held
  { id: 'ring',     slot: 'held', e: '💍', name: 'Promise ring',  hearts: 10, art: { front: () => emoji('💍', 150, 190, 34) } },
  { id: 'fireflies', slot: 'held', e: '✨', name: 'Firefly jar',  coins: 90, goth: true, art: { front: () => jar('<circle class="glow" cx="-4" cy="12" r="4" fill="#fff59d"/><circle class="glow g2" cx="6" cy="20" r="3.5" fill="#fff59d"/><circle class="glow g3" cx="2" cy="6" r="3" fill="#fff59d"/>', 'rgba(40,50,80,.55)') } },
  { id: 'specimen', slot: 'held', e: '👁️', name: 'Specimen jar', coins: 120, goth: true, art: { front: () => jar('<text x="0" y="22" font-size="17" text-anchor="middle">👁️</text>', 'rgba(140,210,120,.55)') } },
  { id: 'mothjar',  slot: 'held', e: '🫙', name: 'Moth in a jar', coins: 100, goth: true, art: { front: () => jar('<text x="0" y="21" font-size="16" text-anchor="middle" style="filter:grayscale(.8)">🦋</text>') } },
  { id: 'candle',   slot: 'held', e: '🕯️', name: 'Candle',         coins: 40, goth: true, art: { front: () => emoji('🕯️', 156, 188, 34) } },
  { id: 'potion',   slot: 'held', e: '🧪', name: 'Potion',         coins: 55, goth: true, art: { front: () => emoji('🧪', 156, 188, 32) } },
  { id: 'skull',    slot: 'held', e: '💀', name: 'Yorick (a skull)', coins: 95, goth: true, art: { front: () => emoji('💀', 156, 190, 32) } },
  { id: 'rose',     slot: 'held', e: '🥀', name: 'Black rose',     coins: 50, goth: true, art: { front: () => emoji('🥀', 156, 188, 34) } },
  { id: 'orb',      slot: 'held', e: '🔮', name: 'Crystal ball',  hearts: 12, goth: true, art: { front: () => emoji('🔮', 156, 190, 32) } },
];
export const itemById = id => WARDROBE.find(w => w.id === id);
// Old saves stored a single accessory; this maps it into a slot.
export const slotOf = id => itemById(id)?.slot;

// Collect every layer for an outfit + hairstyle.
export function outfitLayers(pet, g) {
  const L = { back: '', torso: '', front: '', top: '' };
  const hair = hairById(pet.hair), color = pet.hairColor || HAIR_COLORS[0][0];
  if (hair?.back) L.back += shift(g, hair.back(color));
  for (const [slot] of SLOTS) {
    const it = itemById(pet.outfit?.[slot]);
    if (!it) continue;
    for (const k in it.art) L[k] += it.art[k](g);
  }
  // Hair sits under hats but over the face, so it goes first in the top layer.
  if (hair?.front) L.top = shift(g, hair.front(color)) + L.top;
  return L;
}
