// Static game content: stats, chore types, pets, shop, quests, loot.

export const KEY = 'housepet.v1', DAY = 864e5, HOUR = 36e5;

export const STATS = {
  food:   { icon: '🍖', label: 'Food',  decay: 2.2, fly: '🍎', color: '#ff8a5b' },
  clean:  { icon: '🫧', label: 'Clean', decay: 1.6, fly: '🫧', color: '#38bdf8' },
  fun:    { icon: '🎾', label: 'Play',  decay: 1.9, fly: '⚽', color: '#facc15' },
  energy: { icon: '💤', label: 'Rest',  decay: 1.3, fly: '🌙', color: '#a78bfa' },
};

export const CATS = {
  kitchen:  { icon: '🍳', label: 'Kitchen',  stat: 'food',   color: '#ff9f43' },
  cleaning: { icon: '🧽', label: 'Cleaning', stat: 'clean',  color: '#38bdf8' },
  laundry:  { icon: '🧺', label: 'Laundry',  stat: 'clean',  color: '#a78bfa' },
  errands:  { icon: '🛒', label: 'Errands',  stat: 'fun',    color: '#f472b6' },
  outdoor:  { icon: '🌿', label: 'Outdoor',  stat: 'fun',    color: '#34d399' },
  admin:    { icon: '📋', label: 'Admin',    stat: 'energy', color: '#fbbf24' },
  other:    { icon: '✨', label: 'Other',    stat: 'energy', color: '#2dd4bf' },
};

export const EVERY = [[1, 'Daily'], [2, 'Every 2 days'], [3, 'Every 3 days'], [7, 'Weekly'], [14, 'Every 2 weeks'], [30, 'Monthly']];
export const COLORS = ['#ff5d8f', '#3fa9ff', '#22c55e', '#f59e0b', '#8b5cf6', '#14b8a6'];

// Pets are drawn as SVG from these parts (see pet.js).
export const SPECIES = [
  { id: 'cat',     name: 'Kitty',   ears: 'cat',     body: '#ffb46b', belly: '#ffe9d2', accent: '#ff8fa3' },
  { id: 'dog',     name: 'Pup',     ears: 'dog',     body: '#e2b07c', belly: '#fff3e2', accent: '#9a6440' },
  { id: 'bunny',   name: 'Bun',     ears: 'bunny',   body: '#f3ecff', belly: '#ffffff', accent: '#ffb3c9' },
  { id: 'hamster', name: 'Hammy',   ears: 'round',   body: '#f8c66f', belly: '#fff7e3', accent: '#ffb0a3' },
  { id: 'frog',    name: 'Froggo',  ears: 'frog',    body: '#8ee07a', belly: '#eaffdc', accent: '#ff9db0' },
  { id: 'fox',     name: 'Foxy',    ears: 'fox',     body: '#ff8a3d', belly: '#fff4ea', accent: '#3b2a2a', lvl: 3 },
  { id: 'bear',    name: 'Bear',    ears: 'round',   body: '#be8a62', belly: '#f3dcc6', accent: '#8a5a3b', lvl: 4 },
  { id: 'panda',   name: 'Panda',   ears: 'panda',   body: '#ffffff', belly: '#f4f4f6', accent: '#2d2d3a', lvl: 5 },
  { id: 'koala',   name: 'Koala',   ears: 'koala',   body: '#b3bccb', belly: '#eef1f6', accent: '#6b7686', lvl: 6 },
  { id: 'penguin', name: 'Pengu',   ears: 'penguin', body: '#43528a', belly: '#ffffff', accent: '#ffb020', lvl: 7 },
  { id: 'dragon',  name: 'Dragon',  ears: 'dragon',  body: '#4fd1a5', belly: '#dafff0', accent: '#ff7a7a', lvl: 10 },
  { id: 'unicorn', name: 'Unicorn', ears: 'unicorn', body: '#ffffff', belly: '#fff0fb', accent: '#ffb3e6', hearts: 15 },
  { id: 'axolotl', name: 'Axolotl', ears: 'axolotl', body: '#ffb6d5', belly: '#ffe3ef', accent: '#ff5f9e', hearts: 25 },
  { id: 'ghost',   name: 'Boo',     ears: 'ghost',   body: '#f4f7ff', belly: '#f4f7ff', accent: '#a5b4fc', hearts: 35 },
];

export const TREATS = [
  { id: 'cake',  e: '🍰', name: 'Cake',        coins: 15, use: { food: 35 } },
  { id: 'teddy', e: '🧸', name: 'Teddy',       coins: 15, use: { fun: 35 } },
  { id: 'bath',  e: '🛁', name: 'Bubble bath', coins: 15, use: { clean: 35 } },
  { id: 'nap',   e: '☕', name: 'Cozy nap',    coins: 15, use: { energy: 35 } },
  { id: 'spa',   e: '💆', name: 'Spa day',     coins: 50, use: { food: 100, clean: 100, fun: 100, energy: 100 } },
];

export const ACCS = [
  { id: 'bow',    e: '🎀', name: 'Bow',          coins: 40 },
  { id: 'cap',    e: '🧢', name: 'Cap',          coins: 60 },
  { id: 'flower', e: '🌸', name: 'Flower',       coins: 60 },
  { id: 'shades', e: '🕶️', name: 'Shades',       coins: 90, face: true },
  { id: 'party',  e: '🎉', name: 'Party popper', coins: 100 },
  { id: 'tophat', e: '🎩', name: 'Top hat',      coins: 120 },
  { id: 'crown',  e: '👑', name: 'Crown',        coins: 250 },
  { id: 'ring',   e: '💍', name: 'Promise ring', hearts: 10 },
  { id: 'halo',   e: '😇', name: 'Halo',         hearts: 20, halo: true },
];

export const ROOMS = [
  { id: 'home',    e: '🏠', name: 'Cozy home', wall: '#ffe7d1', wall2: '#ffd4b0', floor: '#d9a273' },
  { id: 'mint',    e: '🌿', name: 'Mint loft', coins: 60,  wall: '#d6f5e6', wall2: '#b5ecd2', floor: '#c49a6c' },
  { id: 'berry',   e: '🍓', name: 'Berry den', coins: 90,  wall: '#ffd6e5', wall2: '#ffb8d1', floor: '#b97f5d' },
  { id: 'ocean',   e: '🌊', name: 'Ocean',     coins: 140, wall: '#c9ecff', wall2: '#94d6ff', floor: '#f2d39b' },
  { id: 'galaxy',  e: '🌌', name: 'Galaxy',    coins: 200, wall: '#3b2f7a', wall2: '#6a4bc4', floor: '#2b2350', dark: true },
  { id: 'rainbow', e: '🌈', name: 'Rainbow',   hearts: 5,  wall: '#fff2b3', wall2: '#ffc9e0', floor: '#a7e3c4' },
  { id: 'castle',  e: '🏰', name: 'Castle',    hearts: 30, wall: '#eadcff', wall2: '#ffd9f0', floor: '#b39ddb' },
];

// Shared house upgrades: every chore either of you does levels up the house.
export const HOUSE = [
  { lvl: 1, e: '🪴', name: 'Houseplant' }, { lvl: 2, e: '🖼️', name: 'Painting' }, { lvl: 3, e: '🧸', name: 'Teddy' },
  { lvl: 4, e: '🕰️', name: 'Clock' }, { lvl: 5, e: '📚', name: 'Bookshelf' }, { lvl: 6, e: '🎸', name: 'Guitar' },
  { lvl: 7, e: '🐠', name: 'Fish tank' }, { lvl: 8, e: '🪩', name: 'Disco ball' }, { lvl: 9, e: '🎠', name: 'Carousel' },
  { lvl: 10, e: '🏆', name: 'Golden mop' },
];
export const houseNeed = l => 80 + l * 40;

// Daily co-op quests: 3 are drawn per day, one is always a teamwork quest.
export const QUESTS = [
  { id: 'c3',      e: '🧹', name: 'Finish 3 chores',            goal: 3,  on: 'chore' },
  { id: 'c6',      e: '💪', name: 'Knock out 6 chores',       goal: 6,  on: 'chore' },
  { id: 'inbox',   e: '📥', name: 'Clear an inbox task',        goal: 1,  on: 'inbox' },
  { id: 'early',   e: '🐦', name: 'Get ahead on a chore',       goal: 1,  on: 'early' },
  { id: 'kitchen', e: '🍳', name: 'Do a kitchen chore',         goal: 1,  on: 'cat:kitchen' },
  { id: 'tidy',    e: '🧽', name: 'Do 2 cleaning/laundry jobs', goal: 2,  on: 'stat:clean' },
  { id: 'cuddle',  e: '💞', name: 'Give the pets 10 cuddles',   goal: 10, on: 'pet' },
  { id: 'spin',    e: '🎡', name: 'Spin the lucky wheel',       goal: 1,  on: 'spin' },
  { id: 'care',    e: '🐾', name: 'Do 3 pet-care tasks',        goal: 3,  on: 'care', pets: true },
];
export const TEAM_QUESTS = [
  { id: 'help', e: '🤝', name: 'Help your partner out', goal: 1, on: 'help' },
  { id: 'both', e: '👫', name: 'Both of you do a chore', goal: 2, on: 'both' },
];

export const STICKERS = [
  ...[['donut', '🍩'], ['cactus', '🌵'], ['sock', '🧦'], ['teapot', '🫖'], ['sponge', '🧽'], ['berry', '🍓'], ['cupcake', '🧁'],
    ['snail', '🐌'], ['shroom', '🍄'], ['kite', '🪁'], ['juice', '🧃'], ['bee', '🐝'], ['avocado', '🥑'], ['duck', '🦆']]
    .map(([id, e]) => ({ id, e, r: 'common' })),
  ...[['flamingo', '🦩'], ['octopus', '🐙'], ['planet', '🪐'], ['butterfly', '🦋'], ['sushi', '🍣'], ['whale', '🐳'], ['peacock', '🦚']]
    .map(([id, e]) => ({ id, e, r: 'rare' })),
  ...[['wand', '🪄'], ['gem', '💎'], ['comet', '☄️']].map(([id, e]) => ({ id, e, r: 'legendary' })),
];

export const WHEEL = [
  { e: '🪙', label: '10',  coins: 10,  color: '#ffd166' },
  { e: '🎁', label: 'Gift', gift: 1,   color: '#ff8fab' },
  { e: '🪙', label: '25',  coins: 25,  color: '#7bdff2' },
  { e: '⭐', label: '+40 XP', xp: 40,  color: '#b8f2a1' },
  { e: '🪙', label: '15',  coins: 15,  color: '#ffd166' },
  { e: '💗', label: '+1',  hearts: 1,  color: '#ff8fab' },
  { e: '🪙', label: '50',  coins: 50,  color: '#7bdff2' },
  { e: '💰', label: '100', coins: 100, color: '#c3a6ff' },
];

export const ACH = [
  { id: 'first',    e: '🌱', name: 'First Steps',   desc: 'Complete a chore',              t: p => p.n.done >= 1,    coins: 10 },
  { id: 'ten',      e: '🧹', name: 'Tidy Ten',      desc: 'Complete 10 chores',            t: p => p.n.done >= 10,   coins: 25 },
  { id: 'fifty',    e: '🏅', name: 'Home Hero',     desc: 'Complete 50 chores',            t: p => p.n.done >= 50,   coins: 75 },
  { id: 'hundred',  e: '💯', name: 'Centurion',     desc: 'Complete 100 chores',           t: p => p.n.done >= 100,  coins: 150 },
  { team: true, id: 'help1',    e: '🤝', name: 'Helping Paw',   desc: 'Help your partner',             t: p => p.n.helped >= 1,  coins: 15 },
  { team: true, id: 'together5', e: '👫', name: 'Better Together', desc: 'Finish 5 tasks together',   t: p => p.n.together >= 5, coins: 40 },
  { team: true, id: 'help10',   e: '💞', name: 'Dream Team',    desc: 'Help your partner 10 times',    t: p => p.n.helped >= 10, coins: 60 },
  { id: 'early5',   e: '🐦', name: 'Early Bird',    desc: 'Do 5 chores ahead of schedule', t: p => p.n.early >= 5,   coins: 30 },
  { id: 'inbox5',   e: '📥', name: 'Inbox Raider',  desc: 'Finish 5 inbox tasks',          t: p => p.n.inbox >= 5,   coins: 30 },
  { id: 'clear',    e: '✅', name: 'All Clear',     desc: 'Finish everything due today',   t: p => p.n.clear >= 1,   coins: 15 },
  { id: 'streak3',  e: '🔥', name: 'On a Roll',     desc: '3-day streak',                  t: p => p.streak >= 3,    coins: 20 },
  { id: 'streak7',  e: '⚡', name: 'Unstoppable',   desc: '7-day streak',                  t: p => p.streak >= 7,    coins: 50 },
  { id: 'streak30', e: '🌟', name: 'Legend',        desc: '30-day streak',                 t: p => p.streak >= 30,   coins: 200 },
  { id: 'lvl5',     e: '⭐', name: 'Growing Up',    desc: 'Reach level 5',                 t: p => p.level >= 5,     coins: 40 },
  { id: 'lvl10',    e: '🏆', name: 'Fully Grown',   desc: 'Reach level 10',                t: p => p.level >= 10,    coins: 100 },
  { id: 'gifts5',   e: '🎁', name: 'Unwrapper',     desc: 'Open 5 gifts',                  t: p => p.n.gifts >= 5,   coins: 25 },
  { id: 'album10',  e: '📒', name: 'Collector',     desc: 'Find 10 different stickers',    t: (p, S) => Object.keys(S.album).length >= 10, coins: 50 },
  { id: 'albumAll', e: '🌠', name: 'Completionist', desc: 'Complete the sticker album',    t: (p, S) => Object.keys(S.album).length >= STICKERS.length, coins: 300 },
  { id: 'house5',   e: '🏡', name: 'Homemakers',    desc: 'Reach house level 5',           t: (p, S) => S.house.level >= 5, coins: 60 },
  { pets: true, id: 'petparent', e: '🐾', name: 'Pet Parent', desc: 'Do 25 real pet-care tasks', t: p => (p.n.care || 0) >= 25, coins: 50 },
  { id: 'harmony',  e: '☯️', name: 'Harmony',       desc: 'Every pet above 85% at once',   t: (p, S, h) => S.players.every(q => h(q) >= 85), coins: 40 },
];

export const LINES = {
  food: ['My tummy is rumbling… 🍖', 'Is it snack time? 🍎', 'I could eat a whole sock 🧦'],
  clean: ['I feel a bit stinky 🫧', 'Bath time, maybe? 🛁', 'Is that a dust bunny? 🐰'],
  fun: ['Play with me! 🎾', "I'm soooo bored ⚽", 'Let’s do something fun! 🎈'],
  energy: ['So sleepy… 💤', '*yawn* 🥱', 'Nap o’clock? 🌙'],
  happy: ['Best. Humans. Ever. 💖', 'I love our home! 🏡', 'You two make a great team!', 'Wheee! ✨', 'Our house is so cozy 🥰', 'Today feels like a good day ☀️'],
  help: ['{p} could use a hand 💌', 'Psst… {p} needs help! 🆘', 'Team up with {p}? 🤝'],
  night: ['zzz… 💤', '*snore* 🌙', 'mmm… five more minutes…'],
  pet: ['Hehe! 💕', 'More scritches! 🥰', 'Purrrfect 😽', '*happy wiggle* ✨', 'I love you! 💖'],
};

// ----- Real-life pets (optional): up to 4 cats/dogs drawn as virtual twins -----
// Coats override a species' colors. spots/stripes add markings; dark coats get colored irises
// and light whiskers so faces stay readable.
const INKY = '#3b3442';
export const COATS = {
  cat: [
    { id: 'orange',   name: 'Orange tabby', body: '#f6a04d', belly: '#ffe4c4', accent: '#ff9fb2', stripes: '#d4782a' },
    { id: 'black',    name: 'Black',        body: INKY,      belly: '#6f6679', accent: '#ff9fb2', dark: true, iris: '#d4e157' },
    { id: 'white',    name: 'White',        body: '#fbf7f2', belly: '#ffffff', accent: '#ffb3c7', iris: '#7cc4ff' },
    { id: 'gray',     name: 'Gray',         body: '#9aa4b1', belly: '#dde2e8', accent: '#ffb3c7', iris: '#e9c46a' },
    { id: 'tuxedo',   name: 'Tuxedo',       body: INKY,      belly: '#ffffff', accent: '#ff9fb2', dark: true, iris: '#d4e157' },
    { id: 'calico',   name: 'Calico',       body: '#fbf3ea', belly: '#ffffff', accent: '#ffb3c7', spots: ['#f39a45', INKY, '#f39a45'] },
    { id: 'siamese',  name: 'Siamese',      body: '#f1e4cf', belly: '#fbf3e6', accent: '#5b4636', iris: '#6ec6ff' },
    { id: 'brown',    name: 'Brown tabby',  body: '#a67c58', belly: '#e8d3bd', accent: '#ffb3c7', stripes: '#6e4e33' },
  ],
  dog: [
    { id: 'golden',    name: 'Golden',          body: '#e9b866', belly: '#fbe5ba', accent: '#c98b3a' },
    { id: 'black',     name: 'Black',           body: INKY,      belly: '#6f6679', accent: '#2a2430', dark: true, iris: '#b07a45' },
    { id: 'chocolate', name: 'Chocolate',       body: '#8b5a3c', belly: '#c99a76', accent: '#5e3a24' },
    { id: 'cream',     name: 'White / cream',   body: '#f8f1e4', belly: '#ffffff', accent: '#e3cfae' },
    { id: 'blackwhite',name: 'Black & white',   body: '#fbf8f3', belly: '#ffffff', accent: INKY, spots: [INKY, INKY] },
    { id: 'tan',       name: 'Tan & black',     body: '#c88a4a', belly: '#f0d2a5', accent: INKY, spots: [INKY] },
    { id: 'gray',      name: 'Gray',            body: '#9aa4b1', belly: '#e1e5ea', accent: '#6d7682' },
    { id: 'tricolor',  name: 'Tricolor',        body: '#fbf6ee', belly: '#ffffff', accent: '#8b5a3c', spots: ['#c88a4a', INKY] },
  ],
};
export const MAX_REAL_PETS = 4;

// Real care actions. goal = times per day that pay full rewards.
export const CARE = {
  feed:   { e: '🍖', label: 'Feed',   past: 'fed',               stat: 'food',  amt: 60, goal: 2, kinds: ['cat', 'dog'] },
  walk:   { e: '🦮', label: 'Walk',   past: 'walked',            stat: 'joy',   amt: 60, goal: 2, kinds: ['dog'] },
  play:   { e: '🧶', label: 'Play',   past: 'played with',       stat: 'joy',   amt: 60, goal: 1, kinds: ['cat'] },
  water:  { e: '💧', label: 'Water',  past: 'refilled water for', stat: 'fresh', amt: 50, goal: 1, kinds: ['cat', 'dog'] },
  litter: { e: '🧹', label: 'Litter', past: 'scooped litter for', stat: 'fresh', amt: 50, goal: 1, kinds: ['cat'] },
};
// Hourly decay: food empties over ~14h (two meals a day), exercise faster for dogs.
export const RP_STATS = {
  food:  { icon: '🍖', label: 'Fed',      decay: { cat: 7, dog: 7 } },
  joy:   { icon: '🎾', label: 'Exercise', decay: { cat: 3.5, dog: 6 } },
  fresh: { icon: '💧', label: 'Fresh',    decay: { cat: 4, dog: 4 } },
};
