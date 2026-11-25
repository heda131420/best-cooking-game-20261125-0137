# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/heda131420/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/heda131420/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle & Serve — Lunch Rush**: a complete, original cooking game. Run a one-chef kitchen through a three-day lunch service: take orders off the board, fetch ingredients from the pantry, chop them on the board, cook them on the range, build each dish on a plate at the assembly counter, and serve it at the window before the ticket's patience runs out. Five recipes, a combo tip system, burning food, three days of rising pressure, synthesized sound effects, and a best score kept between visits.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Any static server works too: serve `game/` and open `game/index.html`. No build step, no network requests, no libraries — plain ES modules and canvas.

## How to play

- **WASD / arrow keys** — move the chef. Click the floor to walk there; click a station to walk to it and use it.
- **E** — use the nearest station. Mash E on the chopping board to chop.
- **Pantry** — E opens the picker; click an ingredient or press **1–9**.
- **Range** — food cooks on its own; take it off inside the green zone or it burns.
- **Assembly** — put a plate down, add its ingredients, then serve the finished plate at the window.
- **P** — pause. **M** — mute.

Serve fast for tips, chain serves for a combo multiplier, and don't let a ticket expire — every expired order costs a heart. Meet each day's quota to reach the next day; three days make a full service.

## Layout

- `game/index.html` — the page; `game/src/main.js` — boot and game loop
- `game/src/config.js` — recipes, ingredients, tuning, palette
- `game/src/kitchen.js` — the simulation: chef, stations, chopping, cooking, serving, days
- `game/src/orders.js` — the order board: tickets, patience, rewards
- `game/src/render.js` — all canvas drawing: kitchen, food, HUD, screens
- `game/src/input.js` — keyboard and mouse; `game/src/audio.js` — synthesized sounds
- `game/src/shots.js` — the staged screenshot scenes; `game/src/random.js` — seeded RNG
- `main.ts` — the entrypoint: hands `game/` and `screenshots/` to the grader
- `screenshots/` — four real renders of the game: title, mid-service, the rush, service complete

---

<sub>Entered on [make.fun](https://make.fun/?ref=p3a162wj&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
