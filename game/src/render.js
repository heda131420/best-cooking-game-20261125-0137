// Everything the eye sees, drawn on one canvas in the fixed 1280x720 logical
// field, scaled to the window. Food is drawn from shapes, never emoji or
// images, so the game looks the same in every browser. The order board, the
// timer, the plate mid-assembly and the dish ready to serve are all on the
// screen at once: that is what a screenshot of the game has to show.

import { BURNERS, FLOOR, STATIONS } from './kitchen.js';
import { dishMatches } from './orders.js';
import {
  COOK, DAY, FIELD, FONT, INGREDIENTS, PALETTE, PANTRY_ORDER, RECIPES,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_DAYCLEAR = 'dayclear';
export const SCREEN_OVER = 'gameover';
export const SCREEN_WIN = 'win';

const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
}

/** Draw one ingredient in its state, centred at (x, y), about `s` wide. */
export function drawFood(ctx, kind, state, x, y, s) {
  const ing = INGREDIENTS[kind];
  const burnt = state === 'burnt';
  const cooked = state === 'cooked';
  const main = burnt ? '#3a2c22' : ing.color;
  const dark = burnt ? '#241a12' : ing.dark;
  ctx.save();
  ctx.translate(x, y);
  if (state === 'chopped') {
    // Chopped food reads as three little pieces.
    for (const [dx, dy, r] of [[-s * 0.28, s * 0.1, s * 0.22], [s * 0.24, s * 0.14, s * 0.2], [0, -s * 0.2, s * 0.22]]) {
      ctx.fillStyle = main;
      circle(ctx, dx, dy, r);
      ctx.fill();
      ctx.fillStyle = dark;
      circle(ctx, dx - r * 0.25, dy - r * 0.25, r * 0.4);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  switch (kind) {
    case 'lettuce': {
      ctx.fillStyle = main;
      for (const [dx, dy, r] of [[0, 0, s * 0.42], [-s * 0.3, s * 0.12, s * 0.26], [s * 0.3, s * 0.12, s * 0.26]]) {
        circle(ctx, dx, dy, r); ctx.fill();
      }
      ctx.strokeStyle = dark; ctx.lineWidth = s * 0.05;
      ctx.beginPath(); ctx.moveTo(-s * 0.3, 0); ctx.quadraticCurveTo(0, s * 0.3, s * 0.3, 0); ctx.stroke();
      break;
    }
    case 'tomato': {
      ctx.fillStyle = main; circle(ctx, 0, s * 0.05, s * 0.4); ctx.fill();
      ctx.fillStyle = cooked ? '#7fae62' : '#5da24f';
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI / 2 + (i * TAU) / 5;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.28);
        ctx.lineTo(Math.cos(a) * s * 0.2, -s * 0.28 + Math.sin(a) * s * 0.2);
        ctx.lineTo(Math.cos(a + 0.5) * s * 0.08, -s * 0.2);
        ctx.closePath(); ctx.fill();
      }
      break;
    }
    case 'carrot': {
      ctx.fillStyle = cooked ? '#c97a2e' : main;
      ctx.beginPath(); ctx.moveTo(-s * 0.32, -s * 0.1); ctx.lineTo(s * 0.32, -s * 0.1); ctx.lineTo(0, s * 0.42); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = dark; ctx.lineWidth = s * 0.05;
      for (const yy of [-0.02, 0.12, 0.26]) { ctx.beginPath(); ctx.moveTo(-s * 0.18, yy * s); ctx.lineTo(s * 0.18, yy * s); ctx.stroke(); }
      ctx.strokeStyle = '#5da24f'; ctx.lineWidth = s * 0.07;
      for (const dx of [-0.14, 0, 0.14]) { ctx.beginPath(); ctx.moveTo(dx * s, -s * 0.1); ctx.lineTo(dx * s * 1.6, -s * 0.38); ctx.stroke(); }
      break;
    }
    case 'onion': {
      ctx.fillStyle = main; circle(ctx, 0, s * 0.05, s * 0.38); ctx.fill();
      ctx.strokeStyle = '#c9b48f'; ctx.lineWidth = s * 0.05;
      circle(ctx, 0, s * 0.05, s * 0.26); ctx.stroke();
      circle(ctx, 0, s * 0.05, s * 0.14); ctx.stroke();
      ctx.strokeStyle = '#7fae62'; ctx.lineWidth = s * 0.06;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.3); ctx.lineTo(0, -s * 0.48); ctx.stroke();
      break;
    }
    case 'patty': {
      ctx.fillStyle = cooked ? '#7a4a2e' : main;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.44, s * 0.3, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = dark;
      for (const [dx, dy] of [[-0.2, -0.08], [0.12, 0.06], [0.22, -0.1]]) { circle(ctx, dx * s, dy * s, s * 0.05); ctx.fill(); }
      break;
    }
    case 'pasta': {
      ctx.strokeStyle = cooked ? '#e0aa3e' : main; ctx.lineWidth = s * 0.09; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.4, i * s * 0.22);
        ctx.bezierCurveTo(-s * 0.15, i * s * 0.22 - s * 0.16, s * 0.15, i * s * 0.22 + s * 0.16, s * 0.4, i * s * 0.22);
        ctx.stroke();
      }
      break;
    }
    case 'dough': {
      ctx.fillStyle = cooked ? '#e3b96a' : main;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.44, s * 0.34, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = dark; ctx.lineWidth = s * 0.04;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.34, s * 0.24, 0, 0, TAU); ctx.stroke();
      break;
    }
    case 'cheese': {
      ctx.fillStyle = main;
      ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.26); ctx.lineTo(s * 0.4, s * 0.26); ctx.lineTo(0, -s * 0.36); ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark;
      for (const [dx, dy] of [[-0.12, 0.08], [0.14, 0.12], [0, -0.12]]) { circle(ctx, dx * s, dy * s, s * 0.06); ctx.fill(); }
      break;
    }
    case 'bun': {
      ctx.fillStyle = main;
      ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.42, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillRect(-s * 0.42, s * 0.08, s * 0.84, s * 0.1);
      ctx.fillStyle = '#fdf3d8';
      for (const [dx, dy] of [[-0.2, -0.18], [0.05, -0.28], [0.22, -0.12]]) { circle(ctx, dx * s, dy * s, s * 0.045); ctx.fill(); }
      break;
    }
    default: break;
  }
  if (burnt) {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = s * 0.05;
    ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(s * 0.3, s * 0.3); ctx.stroke();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, s) {
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.72, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = PALETTE.plateEdge; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.72, s * 0.5, 0, 0, TAU); ctx.stroke();
}

function drawPlateWithFood(ctx, plate, x, y, s) {
  drawPlate(ctx, x, y, s);
  const n = plate.components.length;
  plate.components.forEach(([kind, state], i) => {
    const dx = n === 1 ? 0 : (i - (n - 1) / 2) * s * 0.72;
    drawFood(ctx, kind, state, x + dx, y - s * 0.1, s * 0.55);
  });
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 700) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** Centred text on a dark pill, for labels that sit on the bare floor. */
function pillText(ctx, str, x, y, size, color) {
  ctx.font = `700 ${size}px ${FONT}`;
  const w = ctx.measureText(str).width + 18;
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  rr(ctx, x - w / 2, y - size / 2 - 5, w, size + 10, 8);
  ctx.fill();
  text(ctx, str, x, y + 1, size, color, 'center');
}

function stationRect(id) {
  return STATIONS.find((s) => s.id === id);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    ctx.setTransform(scale, 0, 0, scale, (canvas.width - FIELD.width * scale) / 2, (canvas.height - FIELD.height * scale) / 2);
  }

  function drawFloor() {
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(0, 0, FIELD.width, 108);
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 108, FIELD.width, FIELD.height - 108);
    ctx.fillStyle = PALETTE.tile;
    for (let y = 128; y < FIELD.height; y += 56) {
      for (let x = ((y / 56) % 2 === 0 ? 0 : 28); x < FIELD.width; x += 56) {
        ctx.fillRect(x, y, 52, 52);
      }
    }
    // Rug in the middle of the floor.
    ctx.fillStyle = '#a34d3f';
    rr(ctx, 560, 500, 160, 110, 14); ctx.fill();
    ctx.strokeStyle = '#e8b04b'; ctx.lineWidth = 4;
    rr(ctx, 570, 510, 140, 90, 10); ctx.stroke();
  }

  function drawStation(k, s, hover) {
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    ctx.save();
    if (hover) {
      ctx.shadowColor = PALETTE.gold;
      ctx.shadowBlur = 18;
    }
    ctx.fillStyle = PALETTE.counter;
    rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    rr(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 14, 8); ctx.fill();
    ctx.restore();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.name.toUpperCase(), cx, s.y + s.h - 8);

    if (s.id === 'pantry') {
      PANTRY_ORDER.forEach((kind, i) => {
        const px = s.x + 22 + (i % 3) * 38;
        const py = s.y + 26 + Math.floor(i / 3) * 38;
        drawFood(ctx, kind, 'raw', px, py, 30);
      });
      text(ctx, 'E: pick', cx, s.y + s.h - 26, 12, PALETTE.muted, 'center', 600);
    }
    if (s.id === 'board') {
      ctx.fillStyle = PALETTE.board;
      rr(ctx, s.x + 14, s.y + 14, s.w - 28, s.h - 44, 8); ctx.fill();
      ctx.strokeStyle = PALETTE.boardEdge; ctx.lineWidth = 2;
      rr(ctx, s.x + 14, s.y + 14, s.w - 28, s.h - 44, 8); ctx.stroke();
      if (k.board.item !== null) {
        drawFood(ctx, k.board.item.kind, k.board.item.state, cx, s.y + 44, 52);
        if (k.board.progress > 0) {
          ctx.fillStyle = '#2e2118';
          ctx.fillRect(s.x + 20, s.y + 74, s.w - 40, 8);
          ctx.fillStyle = PALETTE.gold;
          ctx.fillRect(s.x + 20, s.y + 74, (s.w - 40) * k.board.progress, 8);
        }
      } else {
        text(ctx, 'mash E to chop', cx, s.y + 44, 12, PALETTE.muted, 'center', 600);
      }
    }
    if (s.id === 'plates') {
      for (let i = 0; i < 3; i += 1) drawPlate(ctx, cx, s.y + 28 + i * 13, 30);
      text(ctx, 'E: take plate', cx, s.y + s.h - 26, 12, PALETTE.muted, 'center', 600);
    }
    if (s.id === 'range') {
      ctx.fillStyle = PALETTE.steelDark;
      ctx.fillRect(s.x + 8, s.y + 8, s.w - 16, s.h - 24);
      BURNERS.forEach((b, i) => {
        const burner = k.burners[i];
        const cy = s.y + 34;
        ctx.fillStyle = '#22242a';
        circle(ctx, b.x, cy, 28); ctx.fill();
        ctx.strokeStyle = PALETTE.steel; ctx.lineWidth = 3;
        circle(ctx, b.x, cy, 28); ctx.stroke();
        if (burner.item !== null) {
          if (burner.progress < 1) {
            ctx.fillStyle = PALETTE.flame;
            ctx.beginPath();
            ctx.moveTo(b.x - 10, cy + 26);
            ctx.quadraticCurveTo(b.x - 16, cy + 12, b.x, cy + 6);
            ctx.quadraticCurveTo(b.x + 16, cy + 12, b.x + 10, cy + 26);
            ctx.closePath(); ctx.fill();
          }
          drawFood(ctx, burner.item.kind, burner.item.state, b.x, cy - 4, 40);
          // Progress bar just below the counter, with the green done-zone.
          const bx = b.x - 40;
          const by = s.y + s.h + 8;
          ctx.fillStyle = '#1d1712';
          ctx.fillRect(bx, by, 80, 9);
          ctx.fillStyle = '#3f7a44';
          ctx.fillRect(bx + 80 * COOK.doneAt, by, 80 * (COOK.doneUntil - COOK.doneAt), 9);
          ctx.fillStyle = burner.progress >= 1 ? PALETTE.red : PALETTE.gold;
          ctx.fillRect(bx, by, 80 * Math.min(1, burner.progress), 9);
          if (burner.progress >= COOK.doneAt && burner.progress < 1) {
            pillText(ctx, 'READY!', b.x, by + 24, 12, PALETTE.green);
          } else if (burner.progress >= 1) {
            pillText(ctx, 'BURNT!', b.x, by + 24, 12, PALETTE.red);
          }
        }
      });
    }
    if (s.id === 'assembly') {
      // The count / ready line lives under the counter, so the plate and the
      // station's own name never collide with it.
      const under = s.y + s.h + 16;
      if (k.assembly.plate !== null) {
        const match = k.orders.list.some((o) => dishMatches(o.recipe, k.assembly.plate.components));
        if (match) {
          ctx.save();
          ctx.shadowColor = PALETTE.green; ctx.shadowBlur = 16;
          drawPlateWithFood(ctx, k.assembly.plate, cx, cy - 6, 40);
          ctx.restore();
          pillText(ctx, 'READY TO SERVE', cx, under, 13, PALETTE.green);
        } else {
          drawPlateWithFood(ctx, k.assembly.plate, cx, cy - 6, 40);
          const need = k.assembly.plate.components.length;
          pillText(ctx, need === 0 ? 'add ingredients' : `${need} on the plate`, cx, under, 12, PALETTE.text);
        }
      } else {
        text(ctx, 'put a plate here', cx, cy - 6, 13, PALETTE.muted, 'center', 600);
      }
    }
    if (s.id === 'window') {
      ctx.fillStyle = '#241a12';
      rr(ctx, s.x + 10, s.y + 12, s.w - 20, 58, 8); ctx.fill();
      ctx.fillStyle = PALETTE.gold;
      text(ctx, 'SERVE', cx, s.y + 42, 18, PALETTE.gold, 'center');
      const ready = k.assembly.plate !== null
        && k.orders.list.some((o) => dishMatches(o.recipe, k.assembly.plate.components));
      if (ready) {
        ctx.save();
        ctx.shadowColor = PALETTE.gold; ctx.shadowBlur = 16;
        ctx.fillStyle = PALETTE.gold;
        circle(ctx, cx, s.y + 92, 12); ctx.fill();
        ctx.restore();
        text(ctx, 'order up!', cx, s.y + 116, 12, PALETTE.gold, 'center', 600);
      } else {
        text(ctx, 'serve matching', cx, s.y + 92, 11, PALETTE.muted, 'center', 600);
        text(ctx, 'plates here', cx, s.y + 110, 11, PALETTE.muted, 'center', 600);
      }
    }
    if (s.id === 'bin') {
      ctx.fillStyle = PALETTE.steelDark;
      rr(ctx, cx - 26, s.y + 16, 52, 62, 8); ctx.fill();
      ctx.fillStyle = '#5a636e';
      ctx.fillRect(cx - 30, s.y + 10, 60, 10);
      text(ctx, 'E: toss it', cx, s.y + s.h - 26, 12, PALETTE.muted, 'center', 600);
    }
  }

  function drawChef(k) {
    const c = k.chef;
    const bob = Math.sin(performance.now() / 180) * 1.5;
    ctx.save();
    ctx.translate(c.x, c.y + bob * 0.4);
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, 20, 24, 8, 0, 0, TAU); ctx.fill();
    // Body / apron.
    ctx.fillStyle = '#f4f1e8';
    ctx.beginPath(); ctx.ellipse(0, 6, 20, 18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d94f3d';
    ctx.fillRect(-20, -2, 40, 7);
    // Head.
    ctx.fillStyle = '#f2c99b';
    circle(ctx, 0, -18, 15); ctx.fill();
    // Toque.
    ctx.fillStyle = '#ffffff';
    rr(ctx, -14, -40, 28, 14, 6); ctx.fill();
    circle(ctx, -9, -40, 8); ctx.fill();
    circle(ctx, 9, -40, 8); ctx.fill();
    circle(ctx, 0, -43, 9); ctx.fill();
    // Eyes look the way the chef faces.
    ctx.fillStyle = '#2e2118';
    circle(ctx, c.face * 4 - 5, -18, 2.2); ctx.fill();
    circle(ctx, c.face * 4 + 5, -18, 2.2); ctx.fill();
    // Held item rides above the hat.
    if (k.hand !== null) {
      if (k.hand.kind === 'plate') drawPlateWithFood(ctx, k.hand, 0, -56, 30);
      else drawFood(ctx, k.hand.kind, k.hand.state, 0, -56, 40);
    }
    ctx.restore();
  }

  function drawTicket(order, x, y, w) {
    const low = order.patience < order.patienceMax * 0.3;
    ctx.save();
    if (low && Math.floor(performance.now() / 400) % 2 === 0) {
      ctx.shadowColor = PALETTE.red; ctx.shadowBlur = 12;
    }
    ctx.fillStyle = PALETTE.ticket;
    rr(ctx, x, y, w, 86, 8); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = PALETTE.ticketEdge; ctx.lineWidth = 2;
    rr(ctx, x, y, w, 86, 8); ctx.stroke();
    text(ctx, order.recipe.name, x + 10, y + 15, 14, PALETTE.darkText, 'left');
    order.recipe.needs.forEach(([kind, state], i) => {
      drawFood(ctx, kind, state, x + 24 + i * 34, y + 44, 30);
    });
    // Patience bar.
    const frac = Math.max(0, order.patience / order.patienceMax);
    ctx.fillStyle = '#e5d9bd';
    ctx.fillRect(x + 10, y + 70, w - 20, 8);
    ctx.fillStyle = frac > 0.5 ? '#5da24f' : frac > 0.25 ? '#e8a13c' : PALETTE.red;
    ctx.fillRect(x + 10, y + 70, (w - 20) * frac, 8);
    text(ctx, `${Math.ceil(order.patience)}s`, x + w - 10, y + 15, 13, low ? PALETTE.red : '#7a6a52', 'right', 600);
  }

  function drawHud(k, ui) {
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(0, 0, FIELD.width, 104);
    ctx.fillStyle = PALETTE.panelEdge;
    ctx.fillRect(0, 100, FIELD.width, 4);

    text(ctx, `DAY ${k.day} / 3`, 20, 26, 20, PALETTE.text, 'left');
    const quota = DAY.quota[Math.min(k.day, DAY.quota.length) - 1];
    text(ctx, `Served ${k.servedToday}/${quota}`, 20, 52, 14, PALETTE.muted, 'left');
    // Service timer.
    const frac = Math.max(0, k.timeLeft / DAY.length);
    ctx.fillStyle = '#57402a';
    ctx.fillRect(20, 66, 220, 12);
    ctx.fillStyle = frac > 0.3 ? PALETTE.gold : PALETTE.red;
    ctx.fillRect(20, 66, 220 * frac, 12);
    text(ctx, `${Math.ceil(k.timeLeft)}s left`, 248, 72, 14, PALETTE.text, 'left', 600);

    // Order board.
    text(ctx, 'ORDERS', 300, 22, 13, PALETTE.muted, 'left');
    if (k.orders.list.length === 0) {
      text(ctx, 'No orders yet — the lunch crowd is coming…', 300, 56, 14, PALETTE.muted, 'left', 600);
    }
    k.orders.list.forEach((order, i) => drawTicket(order, 300 + i * 216, 8, 204));

    // Coins, combo, hearts.
    const right = FIELD.width - 20;
    ctx.fillStyle = PALETTE.gold;
    circle(ctx, right - 190, 30, 11); ctx.fill();
    ctx.fillStyle = '#b8860b';
    text(ctx, '$', right - 190, 31, 15, '#7a5a00', 'center');
    text(ctx, `${k.coins}`, right - 172, 30, 22, PALETTE.text, 'left');
    if (k.combo >= 2) {
      text(ctx, `COMBO x${k.combo}`, right - 172, 58, 15, PALETTE.flame, 'left');
    }
    for (let i = 0; i < 3; i += 1) {
      const hx = right - 60 + i * 22;
      ctx.fillStyle = i < k.hearts ? PALETTE.red : '#57402a';
      ctx.beginPath();
      ctx.moveTo(hx, 40);
      ctx.bezierCurveTo(hx - 10, 30, hx - 14, 42, hx, 50);
      ctx.bezierCurveTo(hx + 14, 42, hx + 10, 30, hx, 40);
      ctx.fill();
    }
    if (ui.muted) text(ctx, 'muted (M)', right, 84, 12, PALETTE.muted, 'right', 600);
    else text(ctx, 'WASD move · E interact · P pause', right, 84, 12, PALETTE.muted, 'right', 600);
  }

  function drawToasts(k) {
    for (const t of k.toasts) {
      const a = 1 - t.t / t.life;
      ctx.save();
      ctx.globalAlpha = a;
      text(ctx, t.text, t.x, t.y - t.t * 30, 20, PALETTE.gold, 'center');
      ctx.restore();
    }
  }

  function drawPantryPicker(k) {
    ctx.fillStyle = 'rgba(20,12,6,0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    const w = 560;
    const h = 300;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    ctx.fillStyle = PALETTE.ticket;
    rr(ctx, x, y, w, h, 14); ctx.fill();
    ctx.strokeStyle = PALETTE.ticketEdge; ctx.lineWidth = 3;
    rr(ctx, x, y, w, h, 14); ctx.stroke();
    text(ctx, 'PANTRY — what do you need?', x + w / 2, y + 34, 22, PALETTE.darkText, 'center');
    text(ctx, 'Click one, or press 1–9. Esc closes.', x + w / 2, y + 62, 14, '#7a6a52', 'center', 600);
    PANTRY_ORDER.forEach((kind, i) => {
      const px = x + 60 + (i % 3) * 170;
      const py = y + 116 + Math.floor(i / 3) * 62;
      ctx.fillStyle = '#efe3c2';
      rr(ctx, px - 78, py - 26, 156, 52, 10); ctx.fill();
      drawFood(ctx, kind, 'raw', px - 52, py, 40);
      text(ctx, `${i + 1} · ${INGREDIENTS[kind].name}`, px - 28, py, 15, PALETTE.darkText, 'left');
    });
  }

  function panel(title, lines, foot, accent) {
    ctx.fillStyle = 'rgba(20,12,6,0.62)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    const w = 640;
    const h = 150 + lines.length * 30;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    ctx.fillStyle = PALETTE.panel;
    rr(ctx, x, y, w, h, 16); ctx.fill();
    ctx.strokeStyle = accent ?? PALETTE.gold; ctx.lineWidth = 3;
    rr(ctx, x, y, w, h, 16); ctx.stroke();
    text(ctx, title, x + w / 2, y + 44, 34, accent ?? PALETTE.gold, 'center');
    lines.forEach((line, i) => text(ctx, line, x + w / 2, y + 92 + i * 30, 17, PALETTE.text, 'center', 600));
    if (foot !== null) text(ctx, foot, x + w / 2, y + h - 32, 15, PALETTE.muted, 'center', 600);
  }

  function drawTitle(k, ui) {
    panel('SIZZLE & SERVE', [
      'The lunch rush is on. Cook every order before patience runs out!',
      'WASD / arrows — move    E — use a station (mash E to chop)',
      'Click the floor to walk · 1–9 picks from the pantry · M mutes',
      'Pantry → chop or cook → build on a plate → serve at the window.',
    ], ui.best > 0 ? `Best score: ${ui.best} coins — press Enter or click to start` : 'Press Enter or click to start', PALETTE.gold);
  }

  function drawPaused() {
    panel('PAUSED', ['Take a breath — the stove is off.', 'The orders wait for no one, except right now.'], 'Press P or E to keep cooking', PALETTE.blue);
  }

  function drawDayClear(k) {
    const quota = DAY.quota[Math.min(k.day, DAY.quota.length) - 1];
    panel(`DAY ${k.day} COMPLETE!`, [
      `You served ${k.servedToday} dishes (quota ${quota}) and earned ${k.coins} coins.`,
      `Day ${k.day + 1} brings more orders, faster — and new recipes.`,
    ], 'Press Enter for the next day', PALETTE.green);
  }

  function drawOver(k, ui) {
    const reason = k.dayResult?.reason === 'out-of-hearts'
      ? 'Too many orders walked out hungry.'
      : `The day ended at ${k.servedToday} of ${k.dayResult?.quota ?? '?'} dishes.`;
    panel('SERVICE OVER', [
      reason,
      `Coins earned: ${k.coins}   ·   Best: ${Math.max(ui.best, k.coins)}`,
    ], 'Press Enter to try again', PALETTE.red);
  }

  function drawWin(k, ui) {
    panel('SERVICE COMPLETE!', [
      'Three days, every quota met — the lunch crowd loves this kitchen.',
      `Final score: ${k.coins} coins   ·   Best combo x${k.bestCombo}   ·   Best: ${Math.max(ui.best, k.coins)}`,
    ], 'Press Enter to play again', PALETTE.gold);
  }

  function drawRecipesStrip() {
    // A small recipe reminder along the bottom, so new players can plan.
    const y = FIELD.height - 22;
    ctx.fillStyle = 'rgba(20,12,6,0.55)';
    ctx.fillRect(0, y - 12, FIELD.width, 34);
    let x = 16;
    text(ctx, 'MENU:', x, y + 5, 12, PALETTE.gold, 'left');
    x += 52;
    for (const r of RECIPES) {
      text(ctx, r.name, x, y + 5, 12, PALETTE.text, 'left', 600);
      x += ctx.measureText(r.name).width + 8;
      for (const [kind, state] of r.needs) {
        drawFood(ctx, kind, state, x + 10, y + 5, 20);
        x += 24;
      }
      x += 18;
    }
  }

  return {
    fit,
    draw(k, ui) {
      fit();
      ctx.clearRect(0, 0, FIELD.width, FIELD.height);
      drawFloor();
      const hover = ui.nearestStationId;
      for (const s of STATIONS) drawStation(k, s, s.id === hover);
      drawChef(k);
      drawHud(k, ui);
      drawRecipesStrip();
      drawToasts(k);
      if (ui.moveTarget !== null && k.screen === 'play') {
        ctx.strokeStyle = 'rgba(255,247,234,0.7)';
        ctx.lineWidth = 2;
        circle(ctx, ui.moveTarget.x, ui.moveTarget.y, 8);
        ctx.stroke();
      }
      if (k.pantryOpen) drawPantryPicker(k);
      if (k.screen === 'title') drawTitle(k, ui);
      else if (k.screen === 'paused') drawPaused();
      else if (k.screen === 'dayclear') drawDayClear(k);
      else if (k.screen === 'gameover') drawOver(k, ui);
      else if (k.screen === 'win') drawWin(k, ui);
    },
  };
}
