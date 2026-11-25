// Every tuning number, recipe and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size.
//
// Game: "Sizzle & Serve — Lunch Rush". One chef, one kitchen, a lunch service.
// Orders arrive on the board; the chef fetches ingredients from the pantry,
// chops them on the board, cooks them on the range, builds the dish on a plate
// at the assembly counter and serves it at the window before patience runs out.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const CHEF = {
  radius: 22,
  speed: 300,
  /** How close the chef must be to a station to use it. */
  reach: 96,
};

export const DAY = {
  /** Seconds of service in one day. */
  length: 150,
  /** Dishes a day asks for before it counts as passed. */
  quota: [4, 6, 8],
  /** How many orders may sit on the board at once, per day. */
  maxOrders: [2, 3, 3],
  /** Seconds between new orders, per day. */
  orderEvery: [16, 13, 11],
  /** Seconds of patience an order starts with, per day. */
  patience: [85, 75, 65],
};

export const HEARTS = 3;

/** Chopping takes this long (seconds) of holding the interact key. */
export const CHOP_TIME = 1.6;
/** Cooking progress runs 0..1; the dish is done inside DONE_ZONE and burns at 1. */
export const COOK = {
  /** Fraction of the bar that is the perfect green zone. */
  doneAt: 0.62,
  doneUntil: 0.86,
};

/**
 * Every ingredient the pantry stocks. `chop` / `cook` name what the station
 * turns it into; a missing step means the ingredient is used as it comes.
 * `cookSecs` is how long the range takes to cook it (raw or chopped).
 */
export const INGREDIENTS = {
  lettuce: { name: 'Lettuce', color: '#7dc383', dark: '#4c8a52', chop: true, cook: false, price: 2 },
  tomato: { name: 'Tomato', color: '#e4574b', dark: '#a92f28', chop: true, cook: false, price: 2 },
  carrot: { name: 'Carrot', color: '#ef8f3c', dark: '#b25f1d', chop: true, cook: true, cookSecs: 7 },
  onion: { name: 'Onion', color: '#e8dcc8', dark: '#b3a284', chop: true, cook: true, cookSecs: 6 },
  patty: { name: 'Patty', color: '#9c6b4f', dark: '#6e4630', chop: false, cook: true, cookSecs: 9 },
  pasta: { name: 'Pasta', color: '#f2cf6b', dark: '#c39a35', chop: false, cook: true, cookSecs: 8 },
  dough: { name: 'Dough', color: '#f0dfb8', dark: '#c9ad72', chop: false, cook: true, cookSecs: 8 },
  cheese: { name: 'Cheese', color: '#f7d54d', dark: '#d9ae1e', chop: false, cook: false, price: 3 },
  bun: { name: 'Bun', color: '#e8a95c', dark: '#b57a33', chop: false, cook: false, price: 2 },
};

/** Pantry order, also the number-key order (1..9) in the pantry picker. */
export const PANTRY_ORDER = ['lettuce', 'tomato', 'carrot', 'onion', 'patty', 'pasta', 'dough', 'cheese', 'bun'];

/**
 * A recipe is a dish name, its coin value and the exact components a plate
 * must hold: [ingredient, state] pairs, state being 'raw' | 'chopped' | 'cooked'.
 */
export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    coins: 12,
    needs: [['lettuce', 'chopped'], ['tomato', 'chopped']],
  },
  {
    id: 'burger',
    name: 'Classic Burger',
    coins: 20,
    needs: [['bun', 'raw'], ['patty', 'cooked'], ['lettuce', 'chopped']],
  },
  {
    id: 'pasta',
    name: 'Tomato Pasta',
    coins: 18,
    needs: [['pasta', 'cooked'], ['tomato', 'chopped']],
  },
  {
    id: 'pizza',
    name: 'Cheese Pizza',
    coins: 22,
    needs: [['dough', 'cooked'], ['tomato', 'chopped'], ['cheese', 'raw']],
  },
  {
    id: 'roast',
    name: 'Garden Roast',
    coins: 24,
    needs: [['carrot', 'cooked'], ['onion', 'cooked'], ['lettuce', 'chopped']],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? null;
}

/** Tip for serving with this much patience left (0..1): up to +50% of the dish. */
export function tipFor(recipe, patienceLeft) {
  return Math.round(recipe.coins * 0.5 * patienceLeft);
}

export const PALETTE = {
  floor: '#c98f5f',
  floorDark: '#b57a4c',
  tile: '#d9a06b',
  wall: '#8a5a3b',
  wallTop: '#a06b45',
  counter: '#6b4a2f',
  counterTop: '#8a6238',
  counterEdge: '#4a3220',
  steel: '#b9c2cc',
  steelDark: '#7e8894',
  board: '#e8d3a8',
  boardEdge: '#b89b62',
  plate: '#f4f1e8',
  plateEdge: '#cfc9b8',
  window: '#3d2b1f',
  text: '#fff7ea',
  darkText: '#2e2118',
  muted: '#d8c3a5',
  gold: '#f2c94c',
  green: '#7dc383',
  red: '#e4574b',
  blue: '#6fb7d9',
  panel: '#2e2118',
  panelEdge: '#57402a',
  ticket: '#fdf6e3',
  ticketEdge: '#d9c48f',
  flame: '#ff9a3c',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-and-serve.best';
