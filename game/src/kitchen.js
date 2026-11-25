// The kitchen itself: the chef, the stations, and everything a lunch service
// does. Pure simulation, no DOM: main.js drives it, render.js draws it, and
// a Node test can import it and play a whole service headlessly.
//
// One hand, one job at a time. The loop a dish takes:
//   pantry (raw ingredient) -> chopping board (mash E to chop) or range
//   (cooks by itself, take it in the green zone) -> plate on the assembly
//   counter -> serving window, before the ticket's patience runs out.

import {
  CHEF, COOK, DAY, FIELD, HEARTS, INGREDIENTS, PANTRY_ORDER,
} from './config.js';
import {
  collectExpired, createOrders, findMatchingOrder, patienceFor, serveValue, stepOrders,
} from './orders.js';

/** Where the stations sit. The HUD owns y < 108; the floor starts below it. */
export const STATIONS = [
  { id: 'pantry', name: 'Pantry', x: 24, y: 168, w: 120, h: 150 },
  { id: 'board', name: 'Chopping Board', x: 24, y: 368, w: 120, h: 110 },
  { id: 'plates', name: 'Clean Plates', x: 24, y: 528, w: 120, h: 110 },
  { id: 'range', name: 'Range', x: 470, y: 112, w: 340, h: 64 },
  { id: 'assembly', name: 'Assembly', x: 470, y: 370, w: 340, h: 100 },
  { id: 'window', name: 'Serving Window', x: 1136, y: 168, w: 120, h: 150 },
  { id: 'bin', name: 'Bin', x: 1136, y: 528, w: 120, h: 110 },
];

/** The two burners on the range, as offsets inside the range rect. */
export const BURNERS = [
  { x: 520, y: 128 },
  { x: 700, y: 128 },
];

export const FLOOR = { x0: 168, y0: 196, x1: 1112, y1: 700 };

export function makeItem(kind, state = 'raw') {
  return { kind, state };
}

export function makePlate() {
  return { kind: 'plate', state: 'raw', components: [] };
}

function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

function distToRect(px, py, r) {
  const cx = Math.max(r.x, Math.min(px, r.x + r.w));
  const cy = Math.max(r.y, Math.min(py, r.y + r.h));
  return Math.hypot(px - cx, py - cy);
}

export function nearestStation(x, y) {
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const d = distToRect(x, y, s);
    if (d < bestD) { bestD = d; best = s; }
  }
  return bestD <= CHEF.reach ? best : null;
}

export function createKitchen(rng) {
  return {
    rng,
    screen: 'title',
    day: 1,
    timeLeft: DAY.length,
    coins: 0,
    served: 0,
    servedToday: 0,
    failed: 0,
    combo: 0,
    bestCombo: 0,
    hearts: HEARTS,
    chef: { x: 640, y: 580, face: -1 },
    hand: null,
    board: { item: null, progress: 0 },
    burners: [{ item: null, progress: 0, announced: false }, { item: null, progress: 0, announced: false }],
    assembly: { plate: null },
    orders: createOrders(1, rng),
    pantryOpen: false,
    toasts: [],
    /** Seconds left on the day-clear / game-over screen before input counts. */
    screenTimer: 0,
    dayResult: null,
  };
}

export function startDay(k, day) {
  k.day = day;
  k.timeLeft = DAY.length;
  k.servedToday = 0;
  k.hand = null;
  k.board = { item: null, progress: 0 };
  k.burners = [{ item: null, progress: 0, announced: false }, { item: null, progress: 0, announced: false }];
  k.assembly = { plate: null };
  k.orders = createOrders(day, k.rng);
  k.pantryOpen = false;
  k.toasts = [];
  k.screen = 'play';
}

function addToast(k, text, x, y) {
  k.toasts.push({ text, x, y, t: 0, life: 1.6 });
}

function moveChef(k, mx, my, dt) {
  const c = k.chef;
  const len = Math.hypot(mx, my);
  if (len < 0.01) return;
  const vx = (mx / len) * CHEF.speed * dt;
  const vy = (my / len) * CHEF.speed * dt;
  if (mx !== 0) c.face = mx > 0 ? 1 : -1;
  // Axis-separated movement so the chef slides along counters.
  const nx = Math.max(FLOOR.x0 + CHEF.radius, Math.min(FLOOR.x1 - CHEF.radius, c.x + vx));
  if (!hitsStation(nx, c.y)) c.x = nx;
  const ny = Math.max(FLOOR.y0 + CHEF.radius, Math.min(FLOOR.y1 - CHEF.radius, c.y + vy));
  if (!hitsStation(c.x, ny)) c.y = ny;
}

function hitsStation(x, y) {
  for (const s of STATIONS) {
    if (x > s.x - CHEF.radius && x < s.x + s.w + CHEF.radius
      && y > s.y - CHEF.radius && y < s.y + s.h + CHEF.radius) return true;
  }
  return false;
}

function cookable(item) {
  return item !== null && item.kind !== 'plate' && INGREDIENTS[item.kind].cook;
}

function choppable(item) {
  return item !== null && item.kind !== 'plate' && INGREDIENTS[item.kind].chop && item.state === 'raw';
}

/** Resolve a burner item's state from its progress when it is taken off. */
function cookedState(item, progress) {
  if (progress >= 1) return 'burnt';
  if (progress >= COOK.doneAt && progress <= COOK.doneUntil) return 'cooked';
  return item.state;
}

function interact(k, events) {
  const station = nearestStation(k.chef.x, k.chef.y);
  if (station === null) return;
  const hand = k.hand;

  if (station.id === 'pantry') {
    if (hand !== null) { events.push('error'); return; }
    k.pantryOpen = true;
    events.push('click');
    return;
  }

  if (station.id === 'board') {
    const b = k.board;
    if (b.item === null) {
      if (choppable(hand)) {
        b.item = hand; b.progress = 0; k.hand = null;
        events.push('putdown');
      } else if (hand !== null) events.push('error');
      return;
    }
    if (hand !== null) { events.push('error'); return; }
    if (b.item.state === 'raw' && INGREDIENTS[b.item.kind].chop) {
      b.progress += 1 / 3;
      events.push('chop');
      if (b.progress >= 1) {
        b.item.state = 'chopped';
        b.progress = 0;
        events.push('chop-done');
      }
      return;
    }
    k.hand = b.item;
    b.item = null; b.progress = 0;
    events.push('pickup');
    return;
  }

  if (station.id === 'range') {
    if (hand !== null && !cookable(hand)) { events.push('error'); return; }
    if (hand !== null) {
      const free = k.burners.find((b) => b.item === null);
      if (free === undefined) { events.push('error'); return; }
      free.item = hand; free.progress = 0; free.announced = false;
      k.hand = null;
      events.push('putdown');
      return;
    }
    // Take from the burner that is most done (a burnt one first).
    let best = null;
    for (const b of k.burners) {
      if (b.item === null) continue;
      if (best === null || b.progress > best.progress) best = b;
    }
    if (best === null) return;
    const state = cookedState(best.item, best.progress);
    k.hand = { kind: best.item.kind, state };
    best.item = null; best.progress = 0; best.announced = false;
    events.push(state === 'burnt' ? 'burnt-taken' : 'pickup');
    return;
  }

  if (station.id === 'plates') {
    if (hand !== null) { events.push('error'); return; }
    k.hand = makePlate();
    events.push('pickup');
    return;
  }

  if (station.id === 'assembly') {
    const a = k.assembly;
    if (a.plate === null) {
      if (hand !== null && hand.kind === 'plate') {
        a.plate = hand; k.hand = null;
        events.push('putdown');
      } else if (hand !== null) events.push('error');
      return;
    }
    if (hand === null) {
      k.hand = a.plate; a.plate = null;
      events.push('pickup');
      return;
    }
    if (hand.kind === 'plate') { events.push('error'); return; }
    const plate = a.plate;
    if (plate.components.length >= 3) { events.push('error'); return; }
    if (plate.components.some(([kind]) => kind === hand.kind)) { events.push('error'); return; }
    plate.components.push([hand.kind, hand.state]);
    k.hand = null;
    events.push('putdown');
    return;
  }

  if (station.id === 'window') {
    if (hand === null || hand.kind !== 'plate') { events.push('error'); return; }
    if (hand.components.length === 0) { events.push('error'); return; }
    const order = findMatchingOrder(k.orders, hand.components);
    if (order === null) { events.push('serve-wrong'); return; }
    const value = serveValue(order, k.combo);
    k.orders.list = k.orders.list.filter((o) => o.id !== order.id);
    k.coins += value;
    k.served += 1;
    k.servedToday += 1;
    k.combo += 1;
    k.bestCombo = Math.max(k.bestCombo, k.combo);
    k.hand = null;
    addToast(k, `+${value} coins`, 1196, 250);
    events.push('serve');
    return;
  }

  if (station.id === 'bin') {
    if (hand === null) return;
    k.hand = null;
    events.push('putdown');
  }
}

/** Pick an ingredient from the open pantry picker. */
export function pantryPick(k, index) {
  if (!k.pantryOpen || k.hand !== null) return false;
  const kind = PANTRY_ORDER[index];
  if (kind === undefined) return false;
  k.hand = makeItem(kind, 'raw');
  k.pantryOpen = false;
  return true;
}

/** Does the plate on the assembly counter match an open ticket right now? */
export function assemblyMatches(k) {
  const plate = k.assembly.plate;
  if (plate === null) return false;
  return findMatchingOrder(k.orders, plate.components) !== null;
}

/**
 * One fixed step of play. `input` is {mx, my, interact} for this step.
 * Returns the events that happened, for sounds and announcements.
 */
export function stepKitchen(k, dt, input) {
  const events = [];
  if (k.screen !== 'play') return events;

  if (k.pantryOpen) {
    // The picker pauses the service while the chef chooses.
    return events;
  }

  k.timeLeft -= dt;
  moveChef(k, input.mx, input.my, dt);
  if (input.interact) interact(k, events);

  // Cooking advances on its own; flag the moment a burner finishes or burns.
  let anyCooking = false;
  for (const b of k.burners) {
    if (b.item === null) continue;
    anyCooking = true;
    const secs = INGREDIENTS[b.item.kind].cookSecs;
    b.progress = Math.min(1, b.progress + dt / secs);
    if (!b.announced && b.progress >= COOK.doneAt) {
      b.announced = true;
      events.push('cook-done');
    }
    if (b.progress >= 1 && b.item.state !== 'burnt') {
      b.item.state = 'burnt';
      events.push('burnt');
    }
  }
  if (anyCooking) events.push('sizzle');

  const maxOrders = DAY.maxOrders[Math.min(k.day, DAY.maxOrders.length) - 1];
  if (stepOrders(k.orders, dt, maxOrders, patienceFor(k.day)) === 'new-order') events.push('new-order');

  const expired = collectExpired(k.orders);
  if (expired > 0) {
    k.failed += expired;
    k.combo = 0;
    k.hearts -= expired;
    events.push('expired');
  }

  for (const t of k.toasts) t.t += dt;
  k.toasts = k.toasts.filter((t) => t.t < t.life);

  if (k.hearts <= 0) {
    k.hearts = 0;
    k.screen = 'gameover';
    k.dayResult = { passed: false, reason: 'out-of-hearts' };
    k.screenTimer = 0;
    events.push('game-over');
  } else if (k.timeLeft <= 0) {
    k.timeLeft = 0;
    const quota = DAY.quota[Math.min(k.day, DAY.quota.length) - 1];
    if (k.servedToday >= quota) {
      if (k.day >= 3) {
        k.screen = 'win';
        k.dayResult = { passed: true, reason: 'service-complete' };
        events.push('win');
      } else {
        k.screen = 'dayclear';
        k.dayResult = { passed: true, reason: 'quota-met', quota };
        events.push('day-clear');
      }
    } else {
      k.screen = 'gameover';
      k.dayResult = { passed: false, reason: 'quota-missed', quota, served: k.servedToday };
      events.push('game-over');
    }
    k.screenTimer = 0;
  }
  return events;
}

/** Seconds of service left, for the HUD timer. */
export function timeLeft(k) {
  return Math.max(0, k.timeLeft);
}

export { stationById };
