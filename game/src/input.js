// Keyboard and mouse, read fresh every frame. Movement keys are WASD and the
// arrows; E or Space interacts with the nearest station; M mutes; P pauses;
// Enter / Space confirms on the title and end screens. Clicking the floor sets
// a walk target; clicking a station walks there. The pantry picker answers
// number keys 1..9 and Escape closes it.

export const ACTION_INTERACT = 'interact';
export const ACTION_PAUSE = 'pause';
export const ACTION_CONFIRM = 'confirm';
export const ACTION_MUTE = 'mute';

const KEYMAP = {
  KeyE: ACTION_INTERACT,
  Space: ACTION_INTERACT,
  Enter: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyM: ACTION_MUTE,
};

export function createInput(canvas, toLogical) {
  const keys = new Set();
  const pressed = new Set();
  /** Logical point the chef is walking toward, or null. */
  let moveTarget = null;
  /** Logical point of the last click, consumed by the game each frame. */
  let clickPoint = null;
  let clickStation = null;

  function key(e) { return e.code; }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!e.repeat) pressed.add(key(e));
    keys.add(key(e));
  });
  window.addEventListener('keyup', (e) => keys.delete(key(e)));
  window.addEventListener('blur', () => { keys.clear(); pressed.clear(); moveTarget = null; });

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const p = toLogical(e.clientX - rect.left, e.clientY - rect.top);
    clickPoint = p;
    clickStation = null;
    // A floor click is a walk order; a station click is handled by the game
    // through clickPoint + its own hit test, so keep the target too.
    moveTarget = p;
  });

  return {
    /** -1 / 0 / 1 movement on each axis from the keys held down. */
    move() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      return { x, y };
    },
    /** True once for each key press; the game clears it every frame. */
    wasPressed(action) {
      for (const code of pressed) {
        if (KEYMAP[code] === action) return true;
      }
      return false;
    },
    /** Number keys 1..9 pressed this frame, as 0-based indexes, or null. */
    numberPressed() {
      for (let n = 1; n <= 9; n += 1) {
        if (pressed.has(`Digit${n}`) || pressed.has(`Numpad${n}`)) return n - 1;
      }
      return null;
    },
    escapePressed() { return pressed.has('Escape'); },
    moveTarget() { return moveTarget; },
    clearMoveTarget() { moveTarget = null; },
    /** The last click point, if any; the game takes it by calling takeClick. */
    takeClick() {
      const p = clickPoint;
      clickPoint = null;
      return p;
    },
    endFrame() { pressed.clear(); },
  };
}
