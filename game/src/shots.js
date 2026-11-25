// The screenshot scenes behind ?shot=start|play|rush|end. Each one builds a
// real kitchen state through the same objects a playthrough produces —
// orders on the board, food on the stations, a plate mid-assembly — and the
// renderer paints it, so the frame is what the game really looks like.
// ?shot=...&seed=N stages that scene instead of running the loop, paints it
// twice and sets window.__shotReady for a screenshot.

import { recipeById } from './config.js';
import { makeItem, makePlate } from './kitchen.js';

let orderId = 100;

function addOrder(k, recipeId, patience, patienceMax) {
  k.orders.list.push({
    id: orderId,
    recipe: recipeById(recipeId),
    patience,
    patienceMax,
  });
  orderId += 1;
}

/**
 * Set the kitchen to the named scene and return the best score to show.
 * Any other name stages the title scene.
 */
export function stageShot(name, k) {
  if (name === 'play') {
    k.screen = 'play';
    k.day = 1;
    k.timeLeft = 132;
    k.coins = 34;
    k.combo = 2;
    k.bestCombo = 3;
    k.hearts = 3;
    k.servedToday = 2;
    k.chef.x = 730; k.chef.y = 540; k.chef.face = -1;
    k.hand = makeItem('tomato', 'chopped');
    k.board.item = makeItem('tomato', 'chopped');
    k.board.progress = 0;
    k.burners[0].item = makeItem('pasta', 'raw');
    k.burners[0].progress = 0.7;
    k.burners[1].item = makeItem('patty', 'raw');
    k.burners[1].progress = 0.4;
    // A finished burger on the plate, matching the open burger ticket: the
    // plate is ready to serve, and the chef carries chopped tomato for the pasta.
    const plate = makePlate();
    plate.components.push(['bun', 'raw'], ['patty', 'cooked'], ['lettuce', 'chopped']);
    k.assembly.plate = plate;
    addOrder(k, 'burger', 42, 75);
    addOrder(k, 'pasta', 55, 75);
    addOrder(k, 'salad', 18, 75);
    return { best: 86 };
  }
  if (name === 'rush') {
    k.screen = 'play';
    k.day = 2;
    k.timeLeft = 45;
    k.coins = 128;
    k.combo = 4;
    k.bestCombo = 5;
    k.hearts = 2;
    k.servedToday = 5;
    k.chef.x = 730; k.chef.y = 545; k.chef.face = -1;
    k.hand = makeItem('cheese', 'raw');
    k.board.item = makeItem('carrot', 'chopped');
    k.board.progress = 0;
    k.burners[0].item = makeItem('onion', 'chopped');
    k.burners[0].progress = 0.8;
    k.burners[1].item = makeItem('dough', 'raw');
    k.burners[1].progress = 0.55;
    const plate = makePlate();
    plate.components.push(['dough', 'cooked'], ['tomato', 'chopped']);
    k.assembly.plate = plate;
    addOrder(k, 'pizza', 16, 65);
    addOrder(k, 'roast', 28, 65);
    addOrder(k, 'burger', 48, 65);
    return { best: 154 };
  }
  if (name === 'end') {
    k.screen = 'win';
    k.day = 3;
    k.timeLeft = 0;
    k.coins = 214;
    k.combo = 5;
    k.bestCombo = 5;
    k.hearts = 3;
    k.servedToday = 8;
    k.served = 18;
    k.dayResult = { passed: true, reason: 'service-complete' };
    k.chef.x = 640; k.chef.y = 560;
    addOrder(k, 'pizza', 40, 65);
    return { best: 214 };
  }
  // start: the title screen over a kitchen already mid-service.
  k.screen = 'title';
  k.day = 1;
  k.timeLeft = 150;
  k.coins = 0;
  k.combo = 0;
  k.hearts = 3;
  k.chef.x = 640; k.chef.y = 560; k.chef.face = -1;
  k.board.item = makeItem('lettuce', 'chopped');
  k.burners[0].item = makeItem('patty', 'raw');
  k.burners[0].progress = 0.7;
  const plate = makePlate();
  plate.components.push(['bun', 'raw'], ['patty', 'cooked']);
  k.assembly.plate = plate;
  addOrder(k, 'salad', 70, 85);
  addOrder(k, 'burger', 60, 85);
  return { best: 0 };
}
