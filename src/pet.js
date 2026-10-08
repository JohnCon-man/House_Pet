// Draws a pet as an SVG string from species parts + an expression.
// Expressions: happy, ok, sad, sick, sleep, joy, eat, love, wow
import { SPECIES, ACCS } from './data.js';

const INK = '#4a2f3d';
const O = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const L = 'stroke="#2b1d2a" stroke-width="5" stroke-linecap="round" fill="none"';
const pair = svg => svg + `<g transform="matrix(-1 0 0 1 200 0)">${svg}</g>`;
const tail = (d, c) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="14" stroke-linecap="round"/>`;

// Returns [behind-body, in-front-of-body] layers.
function parts(s) {
  const { body: b, accent: a, belly } = s;
  switch (s.ears) {
    case 'cat': return [tail('M158 156 C196 146 192 104 172 98', b) + pair(`<path d="M44 96 L50 34 L94 68 Z" fill="${b}" ${O}/><path d="M56 80 L57 50 L80 68 Z" fill="${a}"/>`), ''];
    case 'fox': return [`<ellipse cx="164" cy="138" rx="22" ry="40" transform="rotate(40 164 138)" fill="${b}" ${O}/><circle cx="186" cy="114" r="11" fill="#fff"/>` +
      pair(`<path d="M42 98 L46 26 L96 66 Z" fill="${b}" ${O}/><path d="M56 80 L54 48 L80 68 Z" fill="${belly}"/><path d="M45 42 L46 27 L60 38 Z" fill="${a}"/>`), ''];
    case 'dog': return [tail('M160 160 C186 150 190 126 182 112', b), pair(`<ellipse cx="44" cy="104" rx="18" ry="36" transform="rotate(18 44 104)" fill="${a}" ${O}/>`) + `<ellipse cx="128" cy="96" rx="14" ry="10" fill="${a}" opacity=".35"/>`];
    case 'bunny': return [pair(`<ellipse cx="74" cy="40" rx="15" ry="42" transform="rotate(-12 74 40)" fill="${b}" ${O}/><ellipse cx="74" cy="46" rx="7" ry="28" transform="rotate(-12 74 46)" fill="${a}"/>`) + `<circle cx="160" cy="160" r="14" fill="#fff" ${O}/>`, ''];
    case 'round': return [pair(`<circle cx="54" cy="74" r="18" fill="${b}" ${O}/><circle cx="54" cy="74" r="9" fill="${a}"/>`), ''];
    case 'panda': return [pair(`<circle cx="52" cy="74" r="20" fill="${a}" ${O}/>`), pair(`<ellipse cx="76" cy="114" rx="15" ry="18" transform="rotate(25 76 114)" fill="${a}"/>`)];
    case 'koala': return [pair(`<circle cx="44" cy="86" r="28" fill="${b}" ${O}/><circle cx="46" cy="88" r="15" fill="#f6d4e0"/>`), `<ellipse cx="100" cy="126" rx="12" ry="10" fill="${a}"/>`];
    case 'frog': return [pair(`<circle cx="70" cy="76" r="25" fill="${b}" ${O}/>`), ''];
    case 'penguin': return [pair(`<ellipse cx="38" cy="132" rx="12" ry="30" transform="rotate(20 38 132)" fill="${b}" ${O}/>`), ''];
    case 'dragon': return [tail('M156 160 C196 160 196 120 184 108', b) + pair(`<path d="M44 118 C8 84 6 146 36 152 Z" fill="${a}" ${O}/><path d="M72 72 L64 38 L88 64 Z" fill="#fff3b0" ${O}/>`), ''];
    case 'unicorn': return [pair(`<path d="M50 90 L56 48 L86 70 Z" fill="${b}" ${O}/><path d="M60 80 L61 58 L77 70 Z" fill="${a}"/>`),
      `<path d="M100 22 L89 68 L111 68 Z" fill="#ffd166" ${O}/><path d="M93 54 L107 50 M95 42 L105 39" stroke="${INK}" stroke-width="3"/>` +
      ['#ff9ad5,72,66,13', '#ffd166,58,78,12', '#8be9fd,50,96,11', '#b4f8c8,48,114,10'].map(x => { const [c, cx, cy, r] = x.split(','); return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" ${O}/>`; }).join('')];
    case 'axolotl': return [pair([[44, 80, -40], [34, 102, -80], [38, 126, -115]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="20" transform="rotate(${r} ${x} ${y})" fill="${a}" ${O}/>`).join('')), ''];
    default: return ['', ''];
  }
}

function eye(x, y, exp, side, iris) {
  switch (exp) {
    case 'joy': case 'eat': return `<path d="M${x - 10} ${y + 4} Q${x} ${y - 10} ${x + 10} ${y + 4}" ${L}/>`;
    case 'sleep': return `<path d="M${x - 10} ${y - 2} Q${x} ${y + 8} ${x + 10} ${y - 2}" ${L}/>`;
    case 'love': return `<path d="M${x} ${y + 9} C${x - 16} ${y - 2} ${x - 9} ${y - 16} ${x} ${y - 6} C${x + 9} ${y - 16} ${x + 16} ${y - 2} ${x} ${y + 9} Z" fill="#ff3d7f" stroke="#c2185b" stroke-width="2"/>`;
    case 'wow': {
      const pts = Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 5 : 13, t = Math.PI / 5 * i - Math.PI / 2; return `${(x + r * Math.cos(t)).toFixed(1)},${(y + r * Math.sin(t)).toFixed(1)}`; });
      return `<polygon points="${pts.join(' ')}" fill="#ffcc33" stroke="#e09b00" stroke-width="2" stroke-linejoin="round"/>`;
    }
    case 'sick': return `<ellipse cx="${x}" cy="${y + 2}" rx="9" ry="4" fill="#2b1d2a"/>`;
    default: {
      const big = exp === 'happy', rx = big ? 10 : 9, ry = big ? 12.5 : 11;
      let s = `<g class="blink">${iris ? `<ellipse cx="${x}" cy="${y}" rx="${rx + 3.5}" ry="${ry + 3}" fill="${iris}" stroke="#2b1d2a" stroke-width="1.5"/>` : ''}<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#2b1d2a"/><circle cx="${x + 3.5}" cy="${y - 4.5}" r="3.6" fill="#fff"/><circle cx="${x - 3}" cy="${y + 4}" r="1.6" fill="#fff"/></g>`;
      if (exp === 'sad') s += side < 0 ? `<path d="M${x - 11} ${y - 15} L${x + 7} ${y - 22}" ${L} stroke-width="4"/>` : `<path d="M${x - 7} ${y - 22} L${x + 11} ${y - 15}" ${L} stroke-width="4"/>`;
      return s;
    }
  }
}

function mouth(s, exp, my) {
  if (s.ears === 'penguin') return `<path d="M87 ${my - 10} L113 ${my - 10} L100 ${my + 5} Z" fill="${s.accent}" ${O} stroke-width="3"/>`;
  const catty = ['cat', 'fox', 'bunny'].includes(s.ears);
  switch (exp) {
    case 'happy': case 'joy': case 'love': case 'wow':
      return `<path d="M87 ${my - 2} Q100 ${my + 20} 113 ${my - 2} Z" fill="#6b2140" stroke="#2b1d2a" stroke-width="3" stroke-linejoin="round"/><ellipse cx="100" cy="${my + 9}" rx="6" ry="3.5" fill="#ff7aa2"/>`;
    case 'sad': return `<path d="M90 ${my + 7} Q100 ${my - 3} 110 ${my + 7}" ${L} stroke-width="4"/>`;
    case 'sick': return `<path d="M87 ${my + 3} q4.3 -5 8.6 0 t8.6 0 t8.6 0" ${L} stroke-width="3.5"/>`;
    case 'sleep': return `<ellipse cx="100" cy="${my + 4}" rx="4" ry="3" fill="#6b2140"/>`;
    case 'eat': return `<ellipse class="chomp" cx="100" cy="${my + 5}" rx="10" ry="9" fill="#6b2140" stroke="#2b1d2a" stroke-width="3"/>`;
    default: return catty ? `<path d="M89 ${my} Q94.5 ${my + 7} 100 ${my} Q105.5 ${my + 7} 111 ${my}" ${L} stroke-width="4"/>` : `<path d="M89 ${my} Q100 ${my + 10} 111 ${my}" ${L} stroke-width="4"/>`;
  }
}

// Fixed spot positions inside the body, used by patched coats (calico, black & white…).
const SPOTS = [[70, 102, 17, 13], [134, 96, 14, 11], [126, 150, 12, 9]];

// coat: optional color/marking override for real-life pets (see COATS in data.js).
export function petSVG(p, exp = 'ok', { stage = 'kid', coat = null } = {}) {
  const base = SPECIES.find(x => x.id === p.pet.species) || SPECIES[0];
  const s = coat ? { ...base, ...coat } : base;
  const acc = ACCS.find(a => a.id === p.pet.acc);
  const frog = s.ears === 'frog', ghost = s.ears === 'ghost', peng = s.ears === 'penguin';
  const ey = frog ? 76 : 110, ex = frog ? 70 : 77, my = frog ? 124 : 134;
  const [back, front] = parts(s);
  const body = ghost
    ? `<path d="M36 120 C36 70 64 50 100 50 C136 50 164 70 164 120 L164 174 Q153 162 142 174 Q131 186 120 174 Q109 162 98 174 Q87 186 76 174 Q65 162 54 174 Q45 184 36 174 Z" fill="${s.body}" ${O}/>`
    : peng ? `<ellipse cx="100" cy="120" rx="60" ry="66" fill="${s.body}" ${O}/><ellipse cx="100" cy="134" rx="44" ry="48" fill="${s.belly}"/>`
    : `<ellipse cx="100" cy="124" rx="68" ry="60" fill="${s.body}" ${O}/><ellipse cx="100" cy="148" rx="42" ry="28" fill="${s.belly}"/>`;
  const markings = (s.spots || []).map((c, i) => `<ellipse cx="${SPOTS[i][0]}" cy="${SPOTS[i][1]}" rx="${SPOTS[i][2]}" ry="${SPOTS[i][3]}" fill="${c}"/>`).join('')
    + (s.stripes ? `<path d="M88 72 l5 13 M100 67 v15 M112 72 l-5 13" stroke="${s.stripes}" stroke-width="5" stroke-linecap="round" fill="none"/>` : '');
  const muzzle = s.dark ? `<ellipse cx="100" cy="${my - 3}" rx="21" ry="14" fill="${s.belly}"/>` : '';
  const feet = ghost ? '' : pair(`<ellipse cx="72" cy="182" rx="17" ry="9" fill="${peng ? s.accent : s.body}" ${O}/>`);
  const nose = ['cat', 'fox', 'dog', 'round', 'panda'].includes(s.ears) || s.id === 'bunny'
    ? `<path d="M94 ${my - 11} Q100 ${my - 5} 106 ${my - 11} Q100 ${my - 15} 94 ${my - 11} Z" fill="${s.id === 'bunny' ? '#ff8fb0' : INK}"/>` : '';
  const whiskers = s.ears === 'cat' ? pair(`<path d="M56 ${my - 6} L32 ${my - 10} M56 ${my} L32 ${my + 4}" stroke="${s.dark ? '#fff' : INK}" stroke-width="2.5" opacity="${s.dark ? '.8' : '.55'}" stroke-linecap="round"/>`) : '';
  const cheeks = pair(`<ellipse cx="${frog ? 56 : 60}" cy="${ey + (frog ? 40 : 19)}" rx="10" ry="6" fill="${exp === 'sick' ? '#9be37f' : '#ff7aa2'}" opacity=".5"/>`);
  const extras = (exp === 'sad' ? `<path d="M${ex - 6} ${ey + 14} q-6 10 0 14 q6 -4 0 -14 Z" fill="#7fd3ff" stroke="#3aa0d8" stroke-width="1.5" class="tear"/>` : '')
    + (exp === 'sick' ? `<path d="M156 70 q-8 12 0 16 q8 -4 0 -16 Z" fill="#7fd3ff" stroke="#3aa0d8" stroke-width="2"/>` : '')
    + (exp === 'sleep' ? '<g class="zzz" font-family="Fredoka, sans-serif" font-weight="700" fill="#6c5ce7"><text x="150" y="70" font-size="22">z</text><text x="164" y="52" font-size="28">z</text><text x="180" y="30" font-size="34">Z</text></g>' : '');
  const tuft = stage === 'baby' && s.ears !== 'unicorn' ? `<path d="M100 ${ghost ? 52 : peng ? 56 : 66} q-10 -16 6 -22" fill="none" ${O}/>` : '';
  const topY = ghost ? 60 : peng ? 62 : frog ? 70 : 74;
  const accSvg = !acc ? '' : acc.halo ? `<ellipse class="halo" cx="100" cy="${topY - 34}" rx="30" ry="8" fill="none" stroke="#ffd54a" stroke-width="7"/>`
    : acc.id === 'ring' ? `<text x="150" y="190" font-size="34" text-anchor="middle">${acc.e}</text>`
    : acc.face ? `<text x="100" y="${ey + 17}" font-size="58" text-anchor="middle">${acc.e}</text>`
    : `<text x="100" y="${topY}" font-size="50" text-anchor="middle">${acc.e}</text>`;
  const face = eye(ex, ey, exp, -1, s.iris) + eye(200 - ex, ey, exp, 1, s.iris);
  return `<svg class="pet-svg exp-${exp} st-${stage}" viewBox="-10 -30 220 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse class="shadow" cx="100" cy="190" rx="${ghost ? 44 : 60}" ry="9" fill="#000" opacity=".13"/>
    <g class="rig">${back}${body}${markings}${feet}${front}${tuft}${cheeks}${muzzle}${whiskers}${nose}${face}${mouth(s, exp, my)}${extras}${accSvg}</g>
  </svg>`;
}

// Egg for the hatching intro.
export const eggSVG = (color, cracks = 0) => `<svg class="egg-svg" viewBox="0 0 200 220" aria-hidden="true">
  <ellipse cx="100" cy="206" rx="54" ry="9" fill="#000" opacity=".13"/>
  <path d="M100 18 C150 18 172 110 172 140 C172 182 140 204 100 204 C60 204 28 182 28 140 C28 110 50 18 100 18 Z" fill="#fffaf0" ${O}/>
  <g fill="${color}" opacity=".85"><circle cx="70" cy="90" r="12"/><circle cx="128" cy="70" r="9"/><circle cx="134" cy="140" r="14"/><circle cx="74" cy="160" r="9"/><circle cx="104" cy="118" r="7"/></g>
  ${cracks > 0 ? `<path d="M60 120 L78 108 L90 124 L104 106" fill="none" ${O}/>` : ''}
  ${cracks > 1 ? `<path d="M104 106 L118 124 L132 108 L146 120" fill="none" ${O}/>` : ''}
  ${cracks > 2 ? `<path d="M70 70 L84 78 L80 92 M130 160 L120 170 L126 182" fill="none" ${O}/>` : ''}
</svg>`;
