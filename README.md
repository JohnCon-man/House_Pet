# 🏡 House Pet

A two-player, co-op tamagotchi for household chores. Each of you raises a pet; doing chores keeps it fed, clean, happy and rested. Built to live on a shared iPad, and works on phones too.

## How it plays
- **Assigned chores** recur (daily, weekly, etc.). Each type cares for your pet in a different way: 🍳 feeds, 🧽🧺 bathes, 🛒🌿 plays, 📋✨ rests.
- **Pet stats drop over time.** Let them slide and your pet gets sad, then sick (it never dies).
- **Shared inbox** for one-off tasks. Either of you can claim one and finish it.
- **Capacity slider + "I could use some help".** When you're low (or you 🙋 flag a chore), your partner's side shows a 💌 help panel with **🤝 I'll do it** buttons. Low capacity also puts your pet in *rest mode*, so its needs drop more slowly.
- **Rewards:** 🪙 coins and XP for every chore, an 🐦 bonus for doing chores early, an ✅ all-clear bonus, 🔥 streaks, 📭 inbox zero, level-ups, and achievements.
- **💗 Hearts are earned only by helping your partner.** Spend them in the Love Shop on rare looks (🦄🦦🦉), rooms and accessories.
- Every action has an **Undo** in case of a mis-tap.

## Running it
It's plain HTML/CSS/JS with no build step. Open `index.html` through any static server (`python3 -m http.server`), or deploy with GitHub Pages:

1. Repo → **Settings → Pages → Source: GitHub Actions**.
2. Merge to `main`. The workflow publishes the site.
3. On the iPad, open the URL in Safari → Share → **Add to Home Screen** for a full-screen app that works offline.

Data is saved in the browser on that device (localStorage). Use **Settings → Back up data / Restore backup** to move it between devices.
