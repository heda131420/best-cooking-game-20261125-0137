// Sizzle & Serve — Lunch Rush: entrypoint for the make.fun bounty
// best-cooking-game-20261125-0137 ("Make the best cooking game").
// The game itself lives in game/ — plain static files (game/index.html plus its
// ES modules, no libraries, no network requests) that a desktop browser loads
// offline. This file hands that game and the screenshots/ renders to the
// grader: it copies game/ and screenshots/ from beside this file into the
// output directory and writes output/dossier.json, the summary the judge
// reads, using the vendored make.fun library in vendor/makefun-game.ts.
// The game: run a one-chef kitchen through a three-day lunch service — take
// orders, fetch and chop ingredients, cook on the range, build each dish on a
// plate, and serve it at the window before the ticket's patience runs out.
//
// Run it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const GAME_NAME = 'Sizzle & Serve — Lunch Rush';
const BOUNTY = 'best-cooking-game-20261125-0137';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

console.log(`[${BOUNTY}] Packaging ${GAME_NAME} …`);

// Fail fast, loudly, instead of handing in an empty or screenshot-less entry:
// the game folder, its page, and at least one screenshot must be present.
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error(`[${BOUNTY}] ${GAME_NAME}: game/index.html is missing — nothing to hand in.`);
}
if (!existsSync(shotsDir) || readdirSync(shotsDir).length === 0) {
  throw new Error(`[${BOUNTY}] ${GAME_NAME}: screenshots/ is missing or empty — the judge needs renders.`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's caps (reference/gate.json): only text_max_bytes shapes the
// dossier's bytes. The other caps refuse entries the scorer would refuse:
// more than 4 screenshots, or one over 256 KiB; more than 993 files in game/
// or 48 MiB of game files in total; or a path under game/ longer than 1000
// bytes. game/ counts beside /output's own 1000-entry cap, its screenshots/
// and its dossier.json.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`[${BOUNTY}] ${GAME_NAME} packaged to ${out}.`);
