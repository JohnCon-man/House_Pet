# 🏡 House Pet

**▶️ Play: https://johncon-man.github.io/House_Pet/**

A tamagotchi for household chores. Play **solo (1 player)** or **co-op (2 players)**: pick at setup. Each player hatches and raises a pet; doing chores feeds, bathes, plays with and rests it. Built for a shared iPad, and plays on phones too.

**Sharing with friends and family:** send them the link. Everyone who opens it gets their own fresh game saved on their own device, and nobody sees anyone else's data. A solo player can add a second player later from ⚙️ Settings.

## How it plays
- **Hatch your pets.** Pick from 5 starter species, then tap your eggs to hatch them. Pets grow from baby → kid → adult as you level up, and 9 more species unlock along the way.
- **Assigned chores** repeat on a schedule. Tap ✓ and the chore's treat flies to your pet: 🍳 feeds, 🧽🧺 bathes, 🛒🌿 plays, 📋✨ rests. Coins fly into your wallet.
- **Pets have moods.** Needs drop over time. Pets go from thriving to sad to sick (they never die), chatter about what they need, sleep at night, and love a cuddle (tap them).
- **Shared inbox** for one-off tasks. Assign each to one of you, to both of you, or leave it up for grabs. Once it's claimed, it shows in that person's task list on Home.
- **🎈 Up for grabs.** Unclaimed inbox tasks can float on the Home screen, so whoever has the energy can grab one with a tap. Tap ↩️ to put a task back.
- **👫 Together tasks.** Any recurring chore or inbox task can belong to both of you. It shows in both lists, and finishing it rewards both players and feeds both pets.
- **Energy slider + "I could use some help".** When you're low, or you 🙋 flag a chore, your partner's pet delivers the message 💌 and their side shows **🤝 I'll do it** buttons. Low energy also puts your pet in *rest mode*, so its needs drop half as fast.
- **Solo mode** skips the partner features. Solo players earn 💗 hearts by clearing everything due in a day (+2💗), plus gifts and the wheel.
- **Teamwork pays the most.** In 2-player mode, helping earns 💗 hearts, the rarest currency, which buys love-only looks (🦄 Unicorn, Axolotl, Boo), rooms and accessories.

### The daily loop
- ☀️ **3 daily quests** (one is always a teamwork quest). Each one pays both of you; claim all 3 for a 🧰 bonus gift each.
- 🎡 **Lucky wheel.** Each of you gets one spin a day, unlocked by your first chore.
- 🎁 **Gifts** drop randomly from chores, level-ups and quests. Open them for coins, treats, hearts or stickers.
- 📒 **Sticker album.** 24 stickers (common, rare, legendary), shared by both of you.
- 🏡 **House level.** Every chore builds up your shared house, which unlocks decorations in both pets' rooms.
- 🔥 Streaks, ✅ all-clear bonuses, 🐦 early bonuses, 19 trophies, and a 14-day streak calendar.

Every action has an **Undo** for mis-taps.

## Running it
It's plain HTML/CSS/JS (ES modules) with no build step. Serve the folder with any static server, e.g. `python3 -m http.server`, then open it.

### GitHub Pages
Pages is already set up (Settings → Pages → Source: GitHub Actions). Every push to `main` redeploys the site through `.github/workflows/pages.yml`. You can also run it by hand from the Actions tab.

1. Merge changes into `main` and wait about a minute for the deploy.
2. On the iPad, open the link above in Safari → Share → **Add to Home Screen** for a full-screen app that works offline.

Data is saved in the browser on that device. Use **Settings → Back up data / Restore backup** to move it between devices.

## Code map
| File | What it does |
| --- | --- |
| `src/data.js` | Game content: stats, chore types, species, shop, quests, stickers, wheel, trophies, pet lines |
| `src/state.js` | Save/load, migration, selectors (due dates, moods, etc.) |
| `src/game.js` | Rules: rewards, streaks, quests, gifts, wheel, house level, shop |
| `src/pet.js` | Draws pets as SVG from parts and expressions |
| `src/fx.js` | Synth sound effects, particles, fly-to animations, splash banners |
| `src/main.js` | Views, interactions and animation choreography |
