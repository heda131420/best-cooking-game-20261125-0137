// The order board: which dishes the lunch crowd wants, how long each ticket
// waits, and what serving it pays. Orders are picked from the recipes the day
// has unlocked (salad and burger on day 1, pasta joins day 2, pizza and roast
// join day 3), never two identical tickets in a row when there is a choice.

import { DAY, RECIPES, tipFor } from './config.js';

/** Recipe ids unlocked on each day (1-based). */
const UNLOCKS = [
  ['salad', 'burger'],
  ['salad', 'burger', 'pasta'],
  ['salad', 'burger', 'pasta', 'pizza', 'roast'],
];

let nextId = 1;

export function createOrders(day, rng) {
  const pool = UNLOCKS[Math.min(day, UNLOCKS.length) - 1]
    .map((id) => RECIPES.find((r) => r.id === id));
  return {
    day,
    pool,
    list: [],
    spawnTimer: 2.5,
    lastRecipeId: null,
    rng,
  };
}

/** Seconds of patience a fresh ticket gets on this day. */
export function patienceFor(day) {
  return DAY.patience[Math.min(day, DAY.patience.length) - 1];
}

function pickRecipe(board) {
  const pool = board.pool;
  let pick = pool[Math.floor(board.rng() * pool.length)];
  if (pool.length > 1) {
    let guard = 0;
    while (pick.id === board.lastRecipeId && guard < 8) {
      pick = pool[Math.floor(board.rng() * pool.length)];
      guard += 1;
    }
  }
  board.lastRecipeId = pick.id;
  return pick;
}

/**
 * Advance the board one step. Returns 'new-order' when a ticket arrived.
 * `maxOrders` caps how many tickets sit on the board at once.
 */
export function stepOrders(board, dt, maxOrders, patienceSecs) {
  let event = null;
  for (const order of board.list) order.patience -= dt;
  // Expired tickets stay on the board until the kitchen collects them, so
  // the game can count the miss and flash the ticket first.
  board.spawnTimer -= dt;
  if (board.spawnTimer <= 0 && board.list.length < maxOrders) {
    const recipe = pickRecipe(board);
    board.list.push({
      id: nextId,
      recipe,
      patience: patienceSecs,
      patienceMax: patienceSecs,
    });
    nextId += 1;
    board.spawnTimer = DAY.orderEvery[Math.min(board.day, DAY.orderEvery.length) - 1];
    event = 'new-order';
  }
  return event;
}

/** Drop the tickets whose patience ran out; returns how many expired. */
export function collectExpired(board) {
  const before = board.list.length;
  board.list = board.list.filter((o) => o.patience > 0);
  return before - board.list.length;
}

/** The ticket a finished plate matches, or null. */
export function findMatchingOrder(board, components) {
  return board.list.find((order) => dishMatches(order.recipe, components)) ?? null;
}

/** True when the plate's components are exactly the recipe's, order aside. */
export function dishMatches(recipe, components) {
  if (components.length !== recipe.needs.length) return false;
  const have = components.map(([kind, state]) => `${kind}:${state}`).sort();
  const want = recipe.needs.map(([kind, state]) => `${kind}:${state}`).sort();
  return have.every((c, i) => c === want[i]);
}

/** Coins a serve pays: dish value + tip for patience left, times the combo. */
export function serveValue(order, combo) {
  const left = Math.max(0, order.patience / order.patienceMax);
  const tip = tipFor(order.recipe, left);
  const mult = 1 + 0.1 * Math.min(combo, 5);
  return Math.round((order.recipe.coins + tip) * mult);
}
