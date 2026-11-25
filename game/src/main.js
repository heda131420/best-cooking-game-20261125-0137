// Boot and the one loop: input is read every frame, the kitchen advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between six screens: title,
// play, paused, day clear, game over and win.
//
// ?seed=N fixes the order pattern. ?shot=start|play|rush|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, FIELD, STEP } from './config.js';
import { createRandom } from './random.js';
import { createKitchen, nearestStation, pantryPick, startDay, stepKitchen } from './kitchen.js';
import { ACTION_CONFIRM, ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';
import { sfx } from './audio.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const kitchen = createKitchen(createRandom(seed));
const renderer = createRenderer(canvas);

/** Client pixels -> logical field coordinates, matching the renderer's fit. */
function toLogical(px, py) {
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  const scale = Math.min(cw / FIELD.width, ch / FIELD.height);
  const ox = (cw - FIELD.width * scale) / 2;
  const oy = (ch - FIELD.height * scale) / 2;
  return { x: (px - ox) / scale, y: (py - oy) / scale };
}

const input = createInput(canvas, toLogical);

/** Debug handle: lets a play-test (or a curious player) read the live state. */
window.__game = { kitchen };

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts one visit.
  }
}

let best = readBest();
let muted = false;
/** A station a click sent the chef to; interact on arrival. */
let pendingStation = null;
/** The last click's walk target, for the marker the renderer draws. */
let moveTarget = null;

function announce(message) {
  status.textContent = message;
}

function playEventSounds(events, dt) {
  for (const e of events) {
    if (e === 'pickup') sfx.pickup();
    else if (e === 'putdown') sfx.putdown();
    else if (e === 'chop') sfx.chop();
    else if (e === 'chop-done') sfx.chopDone();
    else if (e === 'cook-done') sfx.cookDone();
    else if (e === 'burnt') sfx.burnt();
    else if (e === 'serve') sfx.serve();
    else if (e === 'serve-wrong' || e === 'error') sfx.error();
    else if (e === 'new-order') sfx.orderIn();
    else if (e === 'expired') sfx.expired();
    else if (e === 'day-clear') sfx.dayClear();
    else if (e === 'game-over') sfx.gameOver();
    else if (e === 'win') sfx.dayClear();
    else if (e === 'sizzle') sfx.sizzle(dt);
    else if (e === 'click') sfx.click();
  }
}

function saveBestIfBeaten() {
  if (kitchen.coins > best) {
    best = kitchen.coins;
    saveBest(best);
  }
}

/** Pantry picker cell hit test, in logical coordinates (see render.js). */
function pantryCellAt(p) {
  const x = (FIELD.width - 560) / 2;
  const y = (FIELD.height - 300) / 2;
  for (let i = 0; i < 9; i += 1) {
    const px = x + 60 + (i % 3) * 170;
    const py = y + 116 + Math.floor(i / 3) * 62;
    if (p.x >= px - 78 && p.x <= px + 78 && p.y >= py - 26 && p.y <= py + 26) return i;
  }
  return null;
}

function handleClick(p) {
  sfx.unlock();
  if (kitchen.screen === 'title') {
    startDay(kitchen, 1);
    announce('Playing. Day 1: serve 4 dishes before time runs out.');
    return;
  }
  if (kitchen.screen === 'dayclear') {
    startDay(kitchen, kitchen.day + 1);
    announce(`Day ${kitchen.day}.`);
    return;
  }
  if (kitchen.screen === 'gameover' || kitchen.screen === 'win') {
    const fresh = createKitchen(createRandom(Math.floor(Math.random() * 4294967296)));
    Object.assign(kitchen, fresh);
    startDay(kitchen, 1);
    announce('Playing. Day 1.');
    return;
  }
  if (kitchen.screen !== 'play') return;

  if (kitchen.pantryOpen) {
    const cell = pantryCellAt(p);
    if (cell !== null) {
      if (pantryPick(kitchen, cell)) {
        sfx.pickup();
        announce('Picked up an ingredient.');
      }
    } else {
      kitchen.pantryOpen = false;
    }
    return;
  }

  // Walk to the click; a click on a station also uses it on arrival.
  const station = nearestStation(p.x, p.y);
  const clickedStation = station !== null && p.x >= station.x - 10 && p.x <= station.x + station.w + 10
    && p.y >= station.y - 10 && p.y <= station.y + station.h + 10;
  pendingStation = clickedStation ? station : null;
  moveTarget = p;
  input.clearMoveTarget();
}

function handleConfirm() {
  sfx.unlock();
  if (kitchen.screen === 'title') {
    startDay(kitchen, 1);
    announce('Playing. Day 1: serve 4 dishes before time runs out.');
  } else if (kitchen.screen === 'dayclear') {
    startDay(kitchen, kitchen.day + 1);
    announce(`Day ${kitchen.day}.`);
  } else if (kitchen.screen === 'gameover' || kitchen.screen === 'win') {
    const fresh = createKitchen(createRandom(Math.floor(Math.random() * 4294967296)));
    Object.assign(kitchen, fresh);
    startDay(kitchen, 1);
    announce('Playing. Day 1.');
  }
}

function runShot(name) {
  const scene = stageShot(name, kitchen);
  best = scene.best;
  let painted = 0;
  function paint() {
    renderer.draw(kitchen, {
      best, muted, moveTarget: null, nearestStationId: null,
    });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let accumulator = 0;
  let last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > MAX_FRAME) dt = MAX_FRAME;
    accumulator += dt;

    // One-shot keys, read once per frame.
    if (input.wasPressed(ACTION_MUTE)) {
      muted = sfx.toggleMute();
    }
    const interactPressed = input.wasPressed(ACTION_INTERACT);
    if (input.wasPressed(ACTION_CONFIRM) || (interactPressed && kitchen.screen !== 'play')) handleConfirm();
    if (input.wasPressed(ACTION_PAUSE)) {
      if (kitchen.screen === 'play') { kitchen.screen = 'paused'; announce('Paused.'); }
      else if (kitchen.screen === 'paused') { kitchen.screen = 'play'; announce('Playing.'); }
      else if (kitchen.pantryOpen) kitchen.pantryOpen = false;
    }

    const click = input.takeClick();
    if (click !== null) handleClick(click);

    if (kitchen.pantryOpen) {
      const n = input.numberPressed();
      if (n !== null && pantryPick(kitchen, n)) {
        sfx.pickup();
        announce('Picked up an ingredient.');
      }
      if (input.escapePressed()) kitchen.pantryOpen = false;
    }

    // Movement: keys win over a click target.
    const keys = input.move();
    let mx = 0;
    let my = 0;
    if (keys.x !== 0 || keys.y !== 0) {
      mx = keys.x;
      my = keys.y;
      moveTarget = null;
      pendingStation = null;
    } else if (moveTarget !== null) {
      const dx = moveTarget.x - kitchen.chef.x;
      const dy = moveTarget.y - kitchen.chef.y;
      const d = Math.hypot(dx, dy);
      if (d < 14) {
        moveTarget = null;
        if (pendingStation !== null) {
          const near = nearestStation(kitchen.chef.x, kitchen.chef.y);
          if (near !== null && near.id === pendingStation.id) {
            const events = stepKitchen(kitchen, 0, { mx: 0, my: 0, interact: true });
            playEventSounds(events, 0);
          }
          pendingStation = null;
        }
      } else {
        mx = dx / d;
        my = dy / d;
      }
    }

    const interact = interactPressed && kitchen.screen === 'play';

    // The interact press rides on the first fixed step of this frame only.
    let interactLeft = interact;
    while (accumulator >= STEP) {
      accumulator -= STEP;
      const events = stepKitchen(kitchen, STEP, { mx, my, interact: interactLeft });
      interactLeft = false;
      playEventSounds(events, STEP);
      if (kitchen.screen === 'gameover' || kitchen.screen === 'win') saveBestIfBeaten();
    }

    const hover = kitchen.screen === 'play' && !kitchen.pantryOpen
      ? nearestStation(kitchen.chef.x, kitchen.chef.y)?.id ?? null
      : null;
    renderer.draw(kitchen, { best, muted, moveTarget, nearestStationId: hover });
    input.endFrame();
  }
  requestAnimationFrame(frame);
}

if (shot !== null) runShot(shot);
else runGame();
